import Util from '@services/util';
export default class ContentInstance {

  constructor(params = {}, callbacks = {}) {
    this.params = Util.extend({
    }, params);

    this.callbacks = Util.extend({
      onStateChanged: () => {},
      onContinued: () => {},
    }, callbacks);

    this.instance = undefined;
    this.isAttached = false;

    this.dom = document.createElement('div');
    this.dom.classList.add('h5p-content-calendar-exercise-instance-wrapper');

    this.instanceDOM = document.createElement('div');
    this.instanceDOM.classList.add('h5p-content-calendar-content-instance');
    this.dom.append(this.instanceDOM);

    this.initialize();

    this.reset();
  }

  /**
   * Get instance DOM.
   * @returns {HTMLElement} Instance DOM.
   */
  getDOM() {
    return this.dom;
  }

  /**
   * Initialize.
   */
  initialize() {
    if (this.instance === null || this.instance) {
      return; // Only once, please
    }

    const contentParams = this.params.contentParams;

    const machineName = contentParams.contentType?.library?.split?.(' ')[0];

    if (machineName === 'H5P.Video') {
      contentParams.params.visuals.fit = (
        contentParams.params.sources.length && (
          contentParams.params.sources[0].mime === 'video/mp4' ||
          contentParams.params.sources[0].mime === 'video/webm' ||
          contentParams.params.sources[0].mime === 'video/ogg'
        )
      );
    }

    if (machineName === 'H5P.Audio') {
      if (contentParams.params.playerMode === 'full') {
        contentParams.params.fitToWrapper = true;
      }
    }

    this.instance = H5P.newRunnable(
      contentParams,
      this.params.globals.get('contentId'),
      undefined,
      true,
      { previousState: this.params.previousState },
    );

    if (!this.instance) {
      return;
    }

    // Resize parent when children resize
    this.bubbleUp(
      this.instance, 'resize', this.params.globals.get('mainInstance'),
    );

    // Resize children to fit inside parent
    this.bubbleDown(
      this.params.globals.get('mainInstance'), 'resize', [this.instance],
    );

    if (this.isInstanceTask(this.instance)) {
      this.instance.on('xAPI', (event) => {
        this.trackXAPI(event);
      });
    }
  }


  /**
   * Make it easy to bubble events from child to parent.
   * @param {object} origin Origin of event.
   * @param {string} eventName Name of event.
   * @param {object} target Target to trigger event on.
   */
  bubbleUp(origin, eventName, target) {
    origin.on(eventName, (event) => {
      // Prevent target from sending event back down
      target.bubblingUpwards = true;

      // Trigger event
      target.trigger(eventName, event);

      // Reset
      target.bubblingUpwards = false;
    });
  }

  /**
   * Make it easy to bubble events from parent to children.
   * @param {object} origin Origin of event.
   * @param {string} eventName Name of event.
   * @param {object[]} targets Targets to trigger event on.
   */
  bubbleDown(origin, eventName, targets) {
    origin.on(eventName, (event) => {
      if (origin.bubblingUpwards) {
        return; // Prevent send event back down.
      }

      targets.forEach((target) => {
        // If not attached yet, some contents can fail (e. g. CP).
        if (this.isAttached) {
          target.trigger(eventName, event);
        }
      });
    });
  }

  /**
   * Attach instance to DOM.
   */
  attachInstance() {
    if (!this.instance) {
      return; // No instance to attach
    }

    if (this.isAttached) {
      return; // Already attached. Listeners would go missing on re-attaching.
    }

    this.instance.attach(H5P.jQuery(this.instanceDOM));

    if (this.instance?.libraryInfo.machineName === 'H5P.Audio') {
      if (!!window.chrome) {
        this.instance.audio.style.height = '54px';
      }
    }

    // If using H5P.Question, use its button functions.
    if (
      this.instance.registerDomElements &&
      this.instance.addButton && this.instance.hasButton
    ) {
      this.extendsH5PQuestion = true;

      this.instance.addButton(
        'content-calendar-continue',
        this.params.dictionary.get('l10n.continue'),
        () => {
          this.callbacks.onContinued();
        },
        false,
      );
    }
    else {
      this.continueButton = document.createElement('button');
      this.continueButton.classList.add(
        'h5p-joubelui-button',
        'h5p-content-calendar-exercise-instance-continue-button',
        'display-none',
      );
      this.continueButton.innerText =
        this.params.dictionary.get('l10n.continue');
      this.continueButton.addEventListener('click', () => {
        this.callbacks.onContinued();
      });

      this.dom.append(this.continueButton);
    }

    this.isAttached = true;
  }

  /**
   * Determine whether an H5P instance is a task.
   * @param {H5P.ContentType} instance Instance.
   * @returns {boolean} True, if instance is a task.
   */
  isInstanceTask(instance = {}) {
    if (!instance) {
      return false;
    }

    if (instance.isTask) {
      return instance.isTask; // Content will determine if it's task on its own
    }

    // Check for maxScore > 0 as indicator for being a task
    const hasGetMaxScore = (typeof instance.getMaxScore === 'function');
    if (hasGetMaxScore && instance.getMaxScore() > 0) {
      return true;
    }

    return false;
  }

  /**
   * Track scoring of contents.
   * @param {Event} event Event.
   */
  trackXAPI(event) {
    if (!event || event.getScore() === null) {
      return; // Not relevant
    }

    if (event.getScore() < this.instance.getMaxScore()) {
      this.setState(this.params.globals.get('states').completed);
    }
    else {
      this.setState(this.params.globals.get('states').cleared);
    }

    if (this.extendsH5PQuestion) {
      this.instance.showButton('content-calendar-continue');
    }
    else {
      this.continueButton.classList.remove('display-none');
    }
  }

  /**
   * Set exercise state.
   * @param {number|string} state State constant.
   * @param {object} [params] Parameters.
   * @param {boolean} [params.force] If true, will set state unconditionally.
   */
  setState(state, params = {}) {
    const states = this.params.globals.get('states');

    if (typeof state === 'string') {
      state = Object.entries(states)
        .find((entry) => entry[0] === state)[1];
    }

    if (typeof state !== 'number') {
      return;
    }

    let newState;

    if (params.force) {
      newState = states[state];
    }
    else if (state === states.unstarted) {
      newState = states.unstarted;
    }
    else if (state === states.viewed) {
      newState = (this.isInstanceTask(this.instance)) ?
        states.viewed :
        states.cleared;
    }
    else if (state === states.completed) {
      newState = states.completed;
    }
    else if (state === states.cleared) {
      newState = states.cleared;
    }

    if (!this.state || this.state !== newState) {
      this.state = newState;

      this.callbacks.onStateChanged(this.state);
    }
  }

  /**
   * Reset.
   */
  reset() {
    if (!this.instance) {
      return; // No instance to reset
    }

    /*
     * If not attached yet, some contents can fail (e. g. CP), but contents
     * that are not attached never had a previous state change, so okay
     */
    if (this.isAttached) {
      this.instance?.resetTask?.();
    }

    // iOS doesn't feature window.requestIdleCallback
    const callback = window.requestIdleCallback ?? window.requestAnimationFrame;
    callback(() => {
      this.observer = this.observer || new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          this.observer.unobserve(this.instanceDOM);

          this.handleViewed();
        }
      }, {
        root: document.documentElement,
        threshold: 0,
      });
      this.observer.observe(this.instanceDOM);
    });
  }

  /**
   * Handle viewed.
   */
  handleViewed() {
    this.attachInstance();

    window.requestAnimationFrame(() => {
      this.params.globals.get('resize')();
    });
  }
}
