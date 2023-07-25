import './message-box.scss';

export default class MessageBox {

  /**
   * General purpose message box.
   * @class
   */
  constructor() {
    this.dom = document.createElement('div');
    this.dom.classList.add('h5p-content-calendar-message-box');

    this.message = document.createElement('p');
    this.message.classList.add('h5p-content-calendar-message-box-message');
    this.dom.append(this.message);
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
