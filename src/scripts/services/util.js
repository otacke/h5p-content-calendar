/** Class for utility functions */
export default class Util {
  /**
   * Extend an array just like JQuery's extend.
   * @returns {object} Merged objects.
   */
  static extend() {
    for (let i = 1; i < arguments.length; i++) {
      for (let key in arguments[i]) {
        if (Object.prototype.hasOwnProperty.call(arguments[i], key)) {
          if (typeof arguments[0][key] === 'object' && typeof arguments[i][key] === 'object') {
            this.extend(arguments[0][key], arguments[i][key]);
          }
          else {
            arguments[0][key] = arguments[i][key];
          }
        }
      }
    }
    return arguments[0];
  }

  /**
   * Format language tag (RFC 5646). Assuming "language-coutry". No validation.
   * Cmp. https://tools.ietf.org/html/rfc5646
   * @param {string} languageCode Language tag.
   * @returns {string} Formatted language tag.
   */
  static formatLanguageCode(languageCode) {
    if (typeof languageCode !== 'string') {
      return languageCode;
    }

    /*
     * RFC 5646 states that language tags are case insensitive, but
     * recommendations may be followed to improve human interpretation
     */
    const segments = languageCode.split('-');
    segments[0] = segments[0].toLowerCase(); // ISO 639 recommendation
    if (segments.length > 1) {
      segments[1] = segments[1].toUpperCase(); // ISO 3166-1 recommendation
    }
    languageCode = segments.join('-');

    return languageCode;
  }

  /**
   * Swap two DOM elements.
   * @param {HTMLElement} element1 Element 1.
   * @param {HTMLElement} element2 Element 2.
   */
  static swapDOMElements(element1, element2) {
    const parent1 = element1.parentNode;
    const parent2 = element2.parentNode;

    if (!parent1 || !parent2) {
      return;
    }

    const replacement1 = document.createElement('div');
    const replacement2 = document.createElement('div');

    parent1.replaceChild(replacement1, element1);
    parent2.replaceChild(replacement2, element2);
    parent1.replaceChild(element2, replacement1);
    parent2.replaceChild(element1, replacement2);
  }

  /**
   * Determine whether H5P user is using mouse.
   * @param {HTMLElement} [element] Element to start looking backwards from.
   * @returns {boolean|null} True/false as expected, null if not determinable.
   */
  static isUsingMouse(element) {
    let h5pContent = element?.closest('.h5p-content');

    if (!h5pContent) {
      h5pContent = document.querySelector('.h5p-content');
    }

    if (!h5pContent) {
      return null;
    }

    return h5pContent.classList.contains('using-mouse');
  }

  /**
   * Determine whether element is touch device.
   * @param {Event} [event] Event that may bear sourceCapabilities.
   * @returns {boolean} True if likely to be touch device. Else false.
   */
  static isTouchDevice(event) {
    if (event?.sourceCapabilities?.firesTouchEvents) {
      return true;
    }

    if (
      typeof window.ontouchstart === 'function' ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0
    ) {
      return true;
    }

    return false;
  }
}
