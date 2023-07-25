import Util from '@services/util';
import FocusTrap from '@services/focus-trap';
import './exercise-overlay.scss';

/** Class representing an exercise overlay */
export default class ExerciseOverlay {

  /**
   * Exercise holding H5P content.
   * @class
   * @param {object} [params] Parameters.
   * @param {object} [callbacks] Callbacks.
   * @param {function} [callbacks.onClosed] Callback when exercise closed.
   */
  constructor(params = {}, callbacks = {}) {
    this.params = Util.extend({}, params);

    this.callbacks = Util.extend({
      onClosed: () => {}
    }, callbacks);

    this.handleGlobalClick = this.handleGlobalClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);

    this.dom = document.createElement('div');
    this.dom.classList.add('h5p-content-calendar-exercise');
    this.dom.setAttribute('role', 'dialog');
    this.dom.setAttribute('aria-modal', 'true');

    // Container for H5P content, can be CSS-transformed
    this.contentContainer = document.createElement('div');
    this.contentContainer.classList.add('h5p-content-calendar-exercise-content-container');
    this.dom.append(this.contentContainer);

    this.content = document.createElement('div');
    this.content.classList.add('h5p-content-calendar-exercise-content');
    this.contentContainer.append(this.content);

    // Close button
    this.buttonClose = document.createElement('button');
    this.buttonClose.classList.add('h5p-content-calendar-exercise-button-close');
    this.buttonClose.setAttribute(
      'aria-label', this.params.dictionary.get('a11y.close')
    );
    this.buttonClose.addEventListener('click', () => {
      this.callbacks.onClosed();
    });
    this.contentContainer.append(this.buttonClose);

    // Headline
    const headline = document.createElement('div');
    headline.classList.add('h5p-content-calendar-exercise-headline');
    this.content.append(headline);

    this.headlineText = document.createElement('div');
    this.headlineText.classList.add(
      'h5p-content-calendar-exercise-headline-text'
    );
    headline.append(this.headlineText);

    // H5P instance
    this.h5pInstance = document.createElement('div');
    this.h5pInstance.classList.add(
      'h5p-content-calendar-exercise-instance-container'
    );
    this.content.append(this.h5pInstance);

    this.focusTrap = new FocusTrap({ trapElement: this.dom });

    this.hide();
  }

  /**
   * Get DOM for exercise.
   * @returns {HTMLElement} DOM for exercise.
   */
  getDOM() {
    return this.dom;
  }

  /**
   * Show.
   */
  show() {
    this.dom.classList.remove('display-none');

    // Wait to allow DOM to progress
    window.requestAnimationFrame(() => {
      this.focusTrap.activate();
      document.addEventListener('click', this.handleGlobalClick);
      document.addEventListener('keydown', this.handleKeyDown);
    });
  }

  /**
   * Hide.
   */
  hide() {
    document.removeEventListener('click', this.handleGlobalClick);
    document.removeEventListener('keydown', this.handleKeyDown);

    this.dom.classList.add('display-none');
    this.focusTrap.deactivate();
  }

  /**
   * Set H5P DOM.
   * @param {HTMLElement} h5pDOM DOM of H5P instance.
   */
  setH5PContent(h5pDOM) {
    this.h5pInstance.innerHTML = '';
    this.h5pInstance.append(h5pDOM);
  }

  /**
   * Set headline text.
   * @param {string} text Headline text to set.
   */
  setTitle(text) {
    this.headlineText.innerText = text;
    this.dom.setAttribute(
      'aria-label',
      this.params.dictionary.get('a11y.exerciseLabel').replace(/@label/, text)
    );
  }

  /**
   * Get computed size.
   * @returns {object} Size with width and height.
   */
  getSize() {
    const rect = this.dom.getBoundingClientRect();
    return { width: rect.width, height: rect.height};
  }

  /**
   * Handle global click event.
   * @param {Event} event Click event.
   */
  handleGlobalClick(event) {
    if (
      !this.content.contains(event.target) &&
      event.target.isConnected // H5P content may have removed element already
    ) {
      this.callbacks.onClosed();
    }
  }

  /**
   * Handle key down.
   * @param {KeyboardEvent} event Keyboard event.
   */
  handleKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.callbacks.onClosed();
    }
  }
}
