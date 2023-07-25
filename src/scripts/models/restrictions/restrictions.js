import Restriction from './restriction';

/**
 * Set of restrictions.
 * @class
 * @param {object} [params] Parameters.
 * @param {number|string} [params.mode] Mode to check restrictions with.
 */
export default class Restrictions {
  constructor(params = {}) {
    this.mode = Restrictions.MODES['ALL'];
    this.setMode(params.mode);

    this.restrictions = {};
  }

  /**
   * Set mode to combine restrictions.
   * @param {number|string} mode Mode to use, ANY or ALL.
   */
  setMode(mode) {
    if (
      typeof mode === 'string' &&
      Object.keys(Restrictions.MODES).includes(mode.toUpperCase())
    ) {
      this.mode = Restrictions.MODES[mode.toUpperCase()];
    }
    else if (
      typeof mode === 'number' &&
      Object.values(Restrictions.MODES).includes(mode)
    ) {
      this.mode = mode;
    }
  }

  /**
   * Add restriction.
   * @param {object} [params] Parameters.
   * @param {string|number} params.id Id for the restriction.
   * @param {boolean|number|string|Date} [params.targetValue] Target value.
   * @param {number|string} [params.mode] Restrictions comparison mode.
   * @param {function} [params.getCurrentValue] Callback to deliver current value.
   */
  add(params = {}) {
    if (!params.id) {
      return;
    }

    this.restrictions[params.id] = new Restriction(
      {
        targetValue: params.targetValue,
        mode: params.mode
      },
      {
        getCurrentValue: () => {
          return params.getCurrentValue();
        }
      }
    );
  }

  /**
   * Remove restriction
   * @param {number|string} id Id of restriction to remove.
   */
  remove(id) {
    if (!id) {
      return;
    }

    delete this.restrictions[id];
  }

  /**
   * Get restrictions.
   * @returns {object} Restrictions.
   */
  get() {
    return this.restrictions;
  }

  /**
   * Determine whether restrictions are met based on mode ANY/ALL.
   * @returns {boolean} True, id ANY/ALL restrictions are met.
   */
  areMet() {
    if (!Object.keys(this.restrictions).length) {
      return true;
    }

    const restrictions = Object.values(this.restrictions);
    if (this.mode === Restrictions.MODES['ALL']) {
      return restrictions.every((restriction) => {
        return restriction.isMet();
      });
    }
    else if (this.mode === Restrictions.MODES['ANY']) {
      return restrictions.some((restriction) => restriction.isMet());
    }

    return false;
  }
}

/** @constant {object} MODES Possible modes for combining restrictions */
Restrictions.MODES = {
  ANY: 0, // At least on restriction must be met
  ALL: 1 // All restrictions must be met
};
