import MessageBox from './message-box.js';
import './message-box-hint.scss';

export default class MessageBoxHint extends MessageBox {

  /**
   * General purpose message box.
   * @class
   */
  constructor() {
    super();

    this.dom.classList.add('message-box-hint');
  }

  /**
   * Get DOM.
   * @returns {HTMLElement} DOM.
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
   * Set text.
   * @param {string} html Text.
   */
  setText(html) {
    this.message.innerHTML = html || MessageBox.DEFAULT_TEXT;

  }
}

/** @constant {string} DEFAULT_TEXT Default message text*/
MessageBox.DEFAULT_TEXT = 'Something important was supposed to be here.';
