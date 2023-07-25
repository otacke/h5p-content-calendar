import Util from '@services/util';
import Card from '@components/cards-list/card';
import CardPlaceholder from './card-placeholder';
import './cards-list.scss';

export default class CardsList {

  /**
   * @class
   * @param {object} [params] Parameters.
   * @param {object} [params.contents] Contents.
   * @param {object} [callbacks] Callbacks.
   * @param {function} [callbacks.onCardClicked] Callback click.
   * @param {function} [callbacks.onGotoToolbar] Callback to go to toolbar.
   */
  constructor(params = {}, callbacks = {}) {
    this.params = Util.extend({
      contents: {}
    }, params);

    this.callbacks = Util.extend({
      onCardClicked: () => {},
      onGotoToolbar: () => {}
    }, callbacks);

    this.dom = document.createElement('ul');
    this.dom.classList.add('h5p-content-calendar-cards-list');
    this.dom.setAttribute('role', 'list'); // Explicit list role required for some screen readers
    this.dom.setAttribute(
      'aria-label', this.params.dictionary.get('a11y.cardListView')
    );
    this.dom.addEventListener('keydown', (event) => {
      this.handleKeydown(event);
    });
    this.dom.addEventListener('click', (event) => {
      const index = Object.values(this.cards).findIndex((card) => {
        return card.isThisYours(event.target);
      });

      if (index === -1) {
        return;
      }

      this.handleCardClicked(Object.keys(this.cards)[index]);
    });

    if (this.params.backgroundImage?.path) {
      const image = document.createElement('image');
      H5P.setSource(
        image,
        this.params.backgroundImage,
        this.params.globals.get('contentId')
      );

      if (image.src) {
        this.dom.style.backgroundImage = `URL(${image.src})`;
      }
    }

    this.cards = {};

    this.placeholder = new CardPlaceholder();

    for (const id in this.params.contents) {
      const contentParams = this.params.contents[id];

      this.addCard(
        {
          id: id,
          card: {
            label: contentParams.label,
            image: contentParams.image,
            introduction: contentParams.introduction,
            keywords: contentParams.keywords,
            visuals: contentParams.visuals
          }
        }
      );
    }
  }

  /**
   * Get DOM.
   * @returns {HTMLElement} Content DOM.
   */
  getDOM() {
    return this.dom;
  }

  /**
   * Add card.
   * @param {object} [params] Parameters.
   * @param {string} params.id Id of card to add.
   * @param {object} params.card Card parameters.
   * @param {object} [callbacks] Callbacks.
   * @param {function} [callbacks.onCardClicked] Handler for card clicked.
   */
  addCard(params = {}, callbacks = {}) {
    if (typeof params.id !== 'string' || !params.card) {
      return; // No id given
    }

    this.cards[params.id] = new Card(
      {
        ...params.card,
        dictionary: this.params.dictionary,
        globals: this.params.globals
      },
      callbacks
    );
    this.dom.append(this.cards[params.id].getDOM());
  }

  /**
   * Remove card.
   * @param {string} id Id of card to be removed.
   */
  removeCard(id) {
    if (typeof id !== 'string') {
      return; // No id given
    }

    delete this.cards[id];
  }

  /**
   * Focus card.
   * @param {string} id Id of card to remove focus.
   */
  focusCard(id) {
    if (typeof id !== 'string') {
      return; // No id given
    }

    this.cards[id]?.focus();
  }

  /**
   * Update state of a card view.
   * @param {string} id Card's id.
   * @param {string} key Key of state to be changed.
   * @param {string|number|boolean} value Value of state to be changed.
   */
  updateCardState(id, key, value) {
    if (typeof id !== 'string') {
      return;
    }

    this.cards[id].updateState(key, value);
  }

  /**
   * Handle card clicked.
   * @param {string} id Id of card that was clicked.
   */
  handleCardClicked(id) {
    this.callbacks.onCardClicked({ id: id });
  }

  /**
   * Handle keydown.
   * @param {KeyboardEvent} event Keyboard event.
   */
  handleKeydown(event) {
    // Jump to toolbar on Alt+T
    if (event.code === 'KeyT' && event.altKey) {
      this.callbacks.onGotoToolbar();
    }
    else {
      return;
    }

    event.preventDefault();
  }
}
