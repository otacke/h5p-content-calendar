import Contents from '@models/contents';
import Screenreader from '@services/screenreader';
import Util from '@services/util';
import MediaScreen from './media-screen/media-screen';
import CardsList from '@components/cards-list/cards-list';
import ConfirmationDialog from '@components/confirmation-dialog/confirmation-dialog';
import ExerciseOverlay from '@components/exercise-overlay/exercise-overlay';
import Toolbar from '@components/toolbar/toolbar';
import './content.scss';
import MessageBox from './message-box/message-box';
import MessageBoxHint from './message-box/message-box-hint';

export default class Content {

  constructor(params = {}) {
    this.params = Util.extend({
      contents: [],
      previousState: {}
    }, params);

    this.buildDOM();

    this.initializeContentLocking();
  }

  /**
   * Build DOM.
   */
  buildDOM() {
    this.dom = document.createElement('div');
    this.dom.classList.add('h5p-content-calendar-content');

    if (!this.params.contents.length) {
      this.messageBoxHint = new MessageBoxHint();
      this.messageBoxHint.setText(
        this.params.dictionary.get('l10n.noContents')
      );
      this.dom.append(this.messageBoxHint.getDOM());

      return;
    }

    // Pool of card models
    this.pool = new Contents(
      {
        globals: this.params.globals,
        dictionary: this.params.dictionary,
        contents: this.params.contents,
        ...(this.params.previousState.contents && {
          previousState: this.params.previousState.contents
        })
      },
      {
        onStateChanged: (params) => {
          this.handleExerciseStateChanged(params);
        },
        onCardStateChanged: (id, key, value) => {
          this.poolList.updateCardState(id, key, value);
        },
        onContinued: () => {
          this.handleExerciseClosed();
        }
      }
    );

    // Title screen if set
    if (this.params.titleScreen) {
      this.intro = document.createElement('div');
      this.intro.classList.add('h5p-content-calendar-content-intro');

      this.startScreen = new MediaScreen({
        id: 'start',
        contentId: this.params.globals.get('contentId'),
        introduction: this.params.titleScreen.titleScreenIntroduction,
        medium: this.params.titleScreen.titleScreenMedium,
        buttons: [
          { id: 'start', text: this.params.dictionary.get('l10n.start') }
        ],
        a11y: {
          screenOpened: this.params.dictionary.get('a11y.startScreenWasOpened')
        }
      }, {
        onButtonClicked: () => {
          this.handleTitleScreenClosed();
        }
      });

      this.intro.append(this.startScreen.getDOM());

      this.dom.append(this.intro);
    }

    this.main = document.createElement('div');
    this.main.classList.add('h5p-content-calendar-content-main');
    this.dom.append(this.main);

    const buttons = [
      {
        id: 'reset',
        type: 'pulse',
        a11y: {
          active: this.params.dictionary.get('a11y.buttonReset'),
        },
        onClick: () => {
          this.handleResetConfirmation();
        }
      }
    ];

    // Toolbar
    this.toolbar = new Toolbar({
      dictionary: this.params.dictionary,
      buttons: buttons
    });
    this.main.append(this.toolbar.getDOM());

    this.messageBoxIntroduction = new MessageBox();
    this.main.appendChild(this.messageBoxIntroduction.getDOM());

    // Pool of contents
    this.poolList = new CardsList(
      {
        dictionary: this.params.dictionary,
        globals: this.params.globals,
        contents: this.pool.getContents(),
        ...(this.params.backgroundImage &&
          { backgroundImage: this.params.backgroundImage }
        )
      },
      {
        onCardClicked: (params) => {
          this.handleCardClicked(params);
        },
        onGotoToolbar: () => {
          this.toolbar.focus();
        }
      }
    );
    this.main.append(this.poolList.getDOM());

    this.messageBoxHint = new MessageBoxHint();
    this.messageBoxHint.hide();
    this.main.append(this.messageBoxHint.getDOM());

    if (this.intro) {
      this.main.classList.add('display-none');
    }

    this.exerciseOverlay = new ExerciseOverlay(
      {
        dictionary: this.params.dictionary
      },
      {
        onClosed: () => {
          this.handleExerciseClosed();
        }
      }
    );
    this.dom.append(this.exerciseOverlay.getDOM());

    // Confirmation Dialog
    this.confirmationDialog = new ConfirmationDialog({
      globals: this.params.globals
    });
    document.body.append(this.confirmationDialog.getDOM());

    // Screenreader for polite screen reading
    document.body.append(Screenreader.getDOM());

    // Update contents' state from previous state
    Object.entries(this.params.previousState?.contents || [])
      .forEach((entry) => {
        this.pool.updateState(entry[0], entry[1]);
      });
  }

  /**
   * Initialize content locking.
   */
  initializeContentLocking() {
    const hasTimeRestrictions = Object.values(this.pool.getContents())
      .some((content) => {
        return Object.keys(content.restrictions.get()).some((key) => {
          return ['starttime', 'endtime'].includes(key);
        });
      });

    if (hasTimeRestrictions) {
      window.setInterval(() => {
        this.updateContentLocking();
      }, Content.LOCKING_INTERVAL_MS);
    }

    this.updateContentLocking();
  }

  /**
   * Get DOM.
   * @returns {HTMLElement} Content DOM.
   */
  getDOM() {
    return this.dom;
  }

  /**
   * Answer H5P core's call to return the current state.
   * @returns {object|undefined} Current state.
   */
  getCurrentState() {
    if (!this.pool) {
      return;
    }

    return {
      contents: this.pool.getCurrentState()
    };
  }

  /**
   * Update contents accessibility state.
   */
  updateContentLocking() {
    const contents = this.pool.getContents();

    for (const id in contents) {
      this.pool.updateState(
        id, { 'isLocked': !contents[id].areRequirementsMet() }
      );
    }
  }

  /**
   * Handle card was clicked.
   * @param {object} [params] Parameters.
   * @param {string} params.id Id of card that was clicked.
   * @param {boolean} [params.selected] If true, handle selection.
   */
  handleCardClicked(params = {}) {
    if (!params.id) {
      return;
    }

    const content = this.pool.getContent(params.id);

    if (!content.areRequirementsMet()) {
      return; // Access restrictions
    }

    this.exerciseOverlay.setH5PContent(content.contentInstance.getDOM());
    this.exerciseOverlay.setTitle(
      content?.label || content?.contentInstance?.params?.metadata?.title ||
      ''
    );
    this.exerciseOverlay.show();

    content.contentInstance.setState(this.params.globals.get('states')['viewed']);

    // Keep track to give back focus later
    this.currentCardId = params.id;

    window.requestAnimationFrame(() => {
      this.params.globals.get('resize')();
    });
  }

  /**
   * Handle title screen closed.
   */
  handleTitleScreenClosed() {
    this.main.classList.remove('display-none');
    this.toolbar.focusButton('filter');

    this.params.globals.get('resize')();
  }

  /**
   * Handle exercise state changed.
   * @param {object} [params] Parameters.
   * @param {string} params.id Subcontent id of exercise.
   * @param {number} params.state State id.
   */
  handleExerciseStateChanged(params = {}) {
    if (typeof params.id !== 'string' || typeof params.state !== 'number') {
      return;
    }

    this.pool.updateState(params.id, { 'statusCode': params.state });
  }

  /**
   * Handle exercise closed.
   */
  handleExerciseClosed() {
    this.exerciseOverlay.hide();

    // Give focus back to previously focussed card
    this.poolList.focusCard(this.currentCardId);
  }

  /**
   * Handle reset confirmation.
   */
  handleResetConfirmation() {
    this.confirmationDialog.update(
      {
        headerText: this.params.dictionary.get('l10n.confirmResetHeader'),
        dialogText: this.params.dictionary.get('l10n.confirmResetDialog'),
        cancelText: this.params.dictionary.get('l10n.no'),
        confirmText: this.params.dictionary.get('l10n.yes')
      }, {
        onConfirmed: () => {
          this.handleReset();
        }
      }
    );

    this.confirmationDialog.show();
  }

  /**
   * Handle reset.
   */
  handleReset() {
    this.pool.reset();
  }
}

/** @constant {number} LOCKING_INTERVAL_MS Update interval in milliseconds. */
Content.LOCKING_INTERVAL_MS = 15 * 1000; // Update locking state every 15 seconds
