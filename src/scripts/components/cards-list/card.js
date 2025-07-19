import Util from '@services/util.js';
import './card.scss';

export default class Card {

  /**
   * @class
   * @param {object} [params] Parameters.
   * @param {string} params.label Label.
   * @param {string} [params.introduction] Introduction text.
   * @param {string[]} [params.keywords] Keywords.
   * @param {object} [callbacks] Callbacks.
   */
  constructor(params = {}, callbacks = {}) {
    this.params = Util.extend({
    }, params);

    this.callbacks = Util.extend({
    }, callbacks);

    this.buildDOM();
    this.setStatusCode(this.params.globals.get('states').unstarted);
    this.updateAriaLabel();
  }

  /**
   * Build DOM.
   */
  buildDOM() {
    this.dom = document.createElement('li');
    this.dom.classList.add('h5p-content-calendar-card');
    this.dom.classList.toggle('no-label', !this.params.label);
    this.dom.classList.toggle('no-image', !this.params.image?.path);
    this.dom.classList.toggle('no-introduction', !this.params.introduction);
    this.dom.classList.toggle(
      'no-content-state', !this.params.displayContentState
    );
    this.dom.classList.toggle('has-padding', this.params.visuals.hasCardPadding);

    this.button = document.createElement('button');
    this.button.classList.add('h5p-content-calendar-card-content');
    this.dom.append(this.button);

    if (this.params.label) {
      const label = document.createElement('div');
      label.classList.add('h5p-content-calendar-card-label');
      label.innerHTML = this.params.label;
      this.button.append(label);
    }

    if (this.params.image?.path) {
      const image = document.createElement('img');
      image.classList.add('h5p-content-calendar-card-image');
      if (this.params.label) {
        image.classList.add('has-label');
      }
      image.setAttribute('draggable', 'false');
      image.setAttribute('alt', ''); // Only decorational

      image.addEventListener('load', () => {
        this.params.globals.get('resize')();
      });

      if (this.params.visuals?.imageSizing === 'custom') {
        image.classList.add('fixed-ratio');
      }

      H5P.setSource(
        image, this.params.image, this.params.globals.get('contentId')
      );

      this.button.append(image);
    }

    // An empty introduction will serve as a growing element in flexbox
    const introduction = document.createElement('p');
    introduction.classList.add('h5p-content-calendar-card-introduction');
    introduction.innerHTML = this.params.introduction;
    if (!this.params.introduction) {
      introduction.classList.add('empty');
    }

    this.button.append(introduction);

    this.status = document.createElement('div');
    this.status.classList.add('h5p-content-calendar-card-status');
    this.status.classList.toggle(
      'display-none', !this.params.displayContentState
    );
    this.button.append(this.status);
  }

  /**
   * Get DOM.
   * @returns {HTMLElement} Content DOM.
   */
  getDOM() {
    return this.dom;
  }

  /**
   * Show.
   */
  show() {
    this.dom.classList.remove('display-none');
  }

  /**
   * Hide.
   */
  hide() {
    this.dom.classList.add('display-none');
  }

  /**
   * Focus.
   */
  focus() {
    this.button.focus();
  }

  /**
   * Determine whether domElement belongs to this card.
   * @param {HTMLElement} domElement DOM element.
   * @returns {boolean} Trui, if domElement belongs to this card.
   */
  isThisYours(domElement) {
    return domElement?.closest('.h5p-content-calendar-card') === this.dom;
  }

  /**
   * Update aria label.
   */
  updateAriaLabel() {
    const ariaLabelSegments = [
      `${this.params.dictionary.get('a11y.exerciseLabel').replace(/@label/g, this.params.ariaLabel)}`,
      this.params.dictionary.get(`l10n.status${this.statusCode}`)
    ];

    this.button.setAttribute('aria-label', ariaLabelSegments.join('. '));
  }

  /**
   * Update card's state.
   * @param {string} key Key of state.
   * @param {number|string} value Value io state.
   */
  updateState(key, value) {
    if (key === 'statusCode') {
      this.setStatusCode(value);
    }

    if (key === 'isLocked') {
      this.dom.classList.toggle('locked', value);
    }

    this.updateAriaLabel();
  }

  /**
   * Set status code.
   * @param {number} state State id.
   */
  setStatusCode(state) {
    const statusCode = Object.entries(this.params.globals.get('states'))
      .find((entry) => entry[1] === state)[0];

    this.statusCode =
      `${statusCode.charAt(0).toLocaleUpperCase()}${statusCode.slice(1)}`;

    this.status.innerHTML = this.params.dictionary.get(
      `l10n.status${this.statusCode}`
    );
  }
}
