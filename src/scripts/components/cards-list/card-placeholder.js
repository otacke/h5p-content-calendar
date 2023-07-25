import './card-placeholder.scss';

export default class CardPlaceholder {

  /**
   * @class
   */
  constructor() {
    this.dom = document.createElement('div');
    this.dom.classList.add('h5p-content-calendar-card-placeholder');

    // These listeners prevent Firefox from showing draggable animation
    this.dom.addEventListener('dragover', (event) => {
      event.preventDefault();
    });
    this.dom.addEventListener('drop', (event) => {
      event.preventDefault();
    });
  }

  /**
   * Get placeholder DOM.
   * @returns {HTMLElement} Placeholder DOM.
   */
  getDOM() {
    return this.dom;
  }

  /**
   * Set placeholder size.
   * @param {number} width Width.
   * @param {number} height Height.
   */
  setSize(width, height) {
    this.dom.style.width = `${width}px`;
    this.dom.style.height = `${height}px`;
  }
}
