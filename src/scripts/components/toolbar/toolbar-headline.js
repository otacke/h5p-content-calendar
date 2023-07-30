import Util from '@services/util';
import './toolbar-headline.scss';

export default class ToolbarHeadline {
  /**
   * Headline for toolbar.
   * @class
   * @param {object} [params] Parameter from editor.
   * @param {string} [params.text] Headline text.
   */
  constructor(params = {}) {
    this.dom = document.createElement('div');
    this.dom.classList.add('h5p-content-calendar-headline');
    if (params.text) {
      this.dom.innerText = Util.purifyHTML(params.text);
    }
  }

  /**
   * Get DOM element.
   * @returns {HTMLElement} DOM element.
   */
  getDOM() {
    return this.dom;
  }
}
