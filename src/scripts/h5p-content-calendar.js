import Util from '@services/util.js';
import Dictionary from '@services/dictionary.js';
import Globals from '@services/globals.js';
import Content from '@components/content.js';
import '@styles/h5p-content-calendar.scss';

export default class ContentCalendar extends H5P.EventDispatcher {
  /**
   * @class
   * @param {object} params Parameters passed by the editor.
   * @param {number} contentId Content's id.
   * @param {object} [extras] Saved state, metadata, etc.
   */
  constructor(params, contentId, extras = {}) {
    super();

    // Sanitize parameters
    this.params = Util.extend({
      introductionTexts: {},
      contents: [],
      visuals: {
        hasCardPadding: false,
        cardWidth: '14rem',
        imageSizing: 'custom',
        customRatioWidth: 16,
        customRatioHeight: 9,
        introClamp: 'unset',
      },
      behaviour: {
        displayContentState: false,
        enableRetry: false,
      },
      l10n: {
        start: 'Start',
        statusUnstarted: 'unstarted',
        statusViewed: 'viewed',
        statusCompleted: 'completed',
        statusCleared: 'cleared',
        untitledContent: 'Untitled content',
        noCardsFilter: 'You need to select keywords in order to see contents to select from.',
        noCardsSelected: 'You have not selected any content.',
        confirmResetHeader: 'Reset all contents?',
        // eslint-disable-next-line @stylistic/js/max-len
        confirmResetDialog: 'All your contents and their status will be reset, but your selection will remain as is. Do you want to proceed?',
        confirmResetAllHeader: 'Reset all contents and selections?',
        // eslint-disable-next-line @stylistic/js/max-len
        confirmResetAllDialog: 'All your contents and their status and your selections will be reset. Do you want to proceed?',
        no: 'No',
        yes: 'Yes',
        noContents: 'No valid contents were set.',
        continue: 'Continue',
      },
      a11y: {
        exerciseLabel: 'Exercise: @label',
        toolbar: 'Toolbar. Use the key combination Alt plus T to focus the toolbar later on.',
        cardListView: 'Select what exercise you want to do',
        buttonReset: 'Reset exercises',
        close: 'Close',
      },
    }, params);

    this.contentId = contentId;
    this.extras = extras;

    // Set globals
    this.globals = new Globals();
    this.globals.set('contentId', this.contentId);
    this.globals.set('mainInstance', this);
    this.globals.set('states', ContentCalendar.STATES);
    this.globals.set('resize', () => {
      this.trigger('resize');
    });

    // Sanitize
    this.params.contents = this.params.contents
      .filter((content) => {
        return content.contentType?.subContentId;
      })
      .map((content) => {
        const amendedContent = content;
        amendedContent.visuals = this.params.visuals;

        return amendedContent;
      });

    // Fill dictionary
    this.dictionary = new Dictionary();
    this.dictionary.fill({ l10n: this.params.l10n, a11y: this.params.a11y });

    this.previousState = extras?.previousState || {};
    const defaultLanguage = extras?.metadata?.defaultLanguage || 'en';
    this.languageTag = Util.formatLanguageCode(defaultLanguage);

    this.buildDOM();

    this.setCustomCSSProperties();
  }

  /**
   * Attach library to wrapper.
   * @param {H5P.jQuery} $wrapper Content's container.
   */
  attach($wrapper) {
    $wrapper.get(0).classList.add('h5p-content-calendar');
    $wrapper.get(0).appendChild(this.dom);
  }

  /**
   * Set custom CSS properties.
   */
  setCustomCSSProperties() {
    if (this.params.visuals.cardWidth.match(/^\d+(?:\.\d+)?(?: )?$/)) {
      this.params.visuals.cardWidth = `${this.params.visuals.cardWidth}px`;
    }
    this.dom.style.setProperty('--card-width', this.params.visuals.cardWidth);

    this.dom.style.setProperty(
      '--card-image-ratio-width', this.params.visuals.customRatioWidth,
    );

    this.dom.style.setProperty(
      '--card-image-ratio-height', this.params.visuals.customRatioHeight,
    );

    this.dom.style.setProperty(
      '--card-introduction-clamp', this.params.visuals.introClamp,
    );
  }

  /**
   * Build main DOM.
   */
  buildDOM() {
    this.dom = document.createElement('div');
    this.dom.classList.add('h5p-content-calendar-main');

    this.content = new Content(
      {
        dictionary: this.dictionary,
        globals: this.globals,
        ...(this.params.headline && { headline: this.params.headline }),
        contents: this.params.contents,
        behaviour: this.params.behaviour,
        introductionTexts: this.params.introductionTexts,
        ...(
          this.params.showTitleScreen &&
          { titleScreen: this.params.titleScreen }
        ),
        ...(
          Object.keys(this.previousState).length &&
          { previousState: this.previousState.content }
        ),
        ...(this.params.visuals.backgroundImage?.path &&
          { backgroundImage: this.params.visuals.backgroundImage }
        ),
      },
      {
        resize: () => {
          this.trigger('resize');
        },
      },
    );
    this.dom.append(this.content.getDOM());
  }

  /**
   * Get task title.
   * @returns {string} Title.
   */
  getTitle() {
    // H5P Core function: createTitle
    return H5P.createTitle(
      this.extras?.metadata?.title || ContentCalendar.DEFAULT_DESCRIPTION,
    );
  }

  /**
   * Get content type description.
   * @returns {string} Description.
   */
  getDescription() {
    return ContentCalendar.DEFAULT_DESCRIPTION;
  }

  /**
   * Answer H5P core's call to return the current state.
   * @returns {object} Current state.
   */
  getCurrentState() {
    return {
      content: this.content.getCurrentState(),
    };
  }
}

/** @constant {string} DEFAULT_DESCRIPTION Default description. */
ContentCalendar.DEFAULT_DESCRIPTION = 'Content Compiler';

/** @constant {string} DEFAULT_CARD_IMAGE_RATIO Default ratio. */
ContentCalendar.DEFAULT_CARD_IMAGE_RATIO = '16/9';

/** @constant {object} STATES States lookup */
ContentCalendar.STATES = {
  unstarted: 0,
  viewed: 1,
  completed: 2,
  cleared: 3,
};
