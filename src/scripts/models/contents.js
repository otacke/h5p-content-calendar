import Util from '@services/util';
import ContentInstance from '@models/content-instance';
import Restrictions from '@models/restrictions/restrictions';
import Restriction from '@models/restrictions/restriction';

export default class Contents {

  constructor(params = {}, callbacks = {}) {
    this.params = Util.extend({
      contents: [],
      previousState: {}
    }, params);

    this.callbacks = Util.extend({
      onStateChanged: () => {},
      onCardStateChanged: () => {},
      onContinued: () => {}
    }, callbacks);

    if (Object.keys(this.params.previousState).length) {
      this.params.contents = this.params.contents.map((contentParams) => {
        const id = contentParams.contentType.subContentId;
        contentParams.previousState = this.params.previousState[id].instance;
        contentParams.restrictions = contentParams.restrictions || {};

        return contentParams;
      });
    }

    this.contents = {};

    this.params.contents.forEach((contentParams) => {
      this.addContent(contentParams);
    });
  }

  /**
   * Add content that has already been created.
   * @param {string} id Id of content.
   * @param {object} content Content that has already been created.
   */
  addContentReady(id, content) {
    this.contents[id] = content;
  }

  /**
   * Add content.
   * @param {object} [params] Parameters.
   * @param {string} [params.label] Content label if set in editor.
   * @param {string} [params.introduction] Introduction if set in editor.
   * @param {object} params.contentType Content type parameters.
   * @param {string} [params.keywords] Keywords delimited by , if set in editor.
   */
  addContent(params = {}) {
    if (!params.contentType?.subContentId) {
      return;
    }

    params = Util.extend({
      statusCode: this.params.globals.get('states')['unstarted'],
      keywords: ''
    }, params);

    const label = (!params.label && !params.image && !params.introduction) ?
      (
        params.contentType.metadata?.title ||
        this.params.dictionary.get('l10n.untitledContent')
      ) :
      params.label;

    const introduction = params.introduction || '';

    const contentInstance = new ContentInstance(
      {
        globals: this.params.globals,
        dictionary: this.params.dictionary,
        contentParams: params.contentType,
        previousState: params.previousState
      },
      {
        onStateChanged: (state) => {
          this.callbacks.onStateChanged({
            id: params.contentType.subContentId,
            state: state
          });
        },
        onContinued: () => {
          this.callbacks.onContinued();
        }
      }
    );

    const restrictions = new Restrictions();
    for (const id in params.restrictions) {
      if (id !== 'starttime' && id !== 'endtime') {
        continue; // Not interesting
      }

      const date = new Date(params.restrictions[id]);
      if (!(date instanceof Date) || isNaN(date)) {
        continue; // No valid date
      }

      restrictions.add({
        id: id,
        targetValue: date,
        mode: (id === 'starttime') ?
          Restriction.MODES['GREATEROREQUAL'] :
          Restriction.MODES['LESSOREQUAL'],
        getCurrentValue: () => {
          return new Date();
        }
      });
    }

    // TODO: Could be a class
    const content = {
      ...(label && {label: label}),
      ...(params.image && {image: params.image}),
      introduction: introduction,
      contentInstance: contentInstance,
      visuals: params.visuals,
      restrictions: restrictions,
      statusCode: params.statusCode,
      areRequirementsMet: () => {
        return restrictions.areMet();
      }
    };

    this.contents[params.contentType.subContentId] = content;
  }

  /**
   * Get content by id.
   * @param {string} id Id for selection.
   * @returns {object|null} Content object.
   */
  getContent(id) {
    if (typeof id !== 'string') {
      return null;
    }

    return this.contents[id];
  }

  /**
   * Get content instance DOM by id.
   * @param {string} id Id for selection.
   * @returns {HTMLElement|null} Content instance DOM.
   */
  getContentDOM(id) {
    if (typeof id !== 'string') {
      return null;
    }

    return this.contents[id].contentInstance.instanceDOM;
  }

  /**
   * Remove content by id.
   * @param {string} id Id for removal.
   */
  removeContent(id) {
    if (typeof id !== 'string') {
      return;
    }

    delete this.contents[id];
  }

  /**
   * Get all contents.
   * @returns {object} Content objects.
   */
  getContents() {
    return this.contents;
  }

  /**
   * Update states.
   * @param {string} id Id of content.
   * @param {object} entries Entries as key value pair.
   */
  updateState(id, entries = {}) {
    if (typeof id !== 'string') {
      return;
    }

    Object.keys(entries).forEach((key) => {
      if (['statusCode', 'isLocked'].includes(key)) {
        this.contents[id][key] = entries[key];
        this.callbacks.onCardStateChanged(id, key, entries[key]);
      }
    });
  }

  /**
   * Reset contents.
   */
  reset() {
    Object.values(this.contents).forEach((content) => {
      content.contentInstance.setState(
        this.params.globals.get('states')['unstarted']
      );
      content.contentInstance.reset();
    });
  }

  /**
   * Answer H5P core's call to return the current state.
   * @returns {object} Current state.
   */
  getCurrentState() {
    const state = {};
    for (const id in this.contents) {
      const content = this.contents[id];

      state[id] = {
        statusCode: content.statusCode,
        instance: content.contentInstance?.instance?.getCurrentState?.() ?? {}
      };
    }

    return state;
  }
}
