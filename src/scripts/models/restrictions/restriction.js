import Util from '@services/util.js';

/**
 * Restriction of some kind.
 * @class
 * @param {object} [params] Parameters.
 * @param {number|string} [params.mode] Mode to check restrictions with.
 * @param {boolean|number|string|Date} [params.targetValue] Target value.
 * @param {object} [callbacks] Callbacks.
 * @param {function} [callbacks.getCurrentValue] Callback to get current value.
 */
export default class Restriction {
  constructor(params = {}, callbacks = {}) {
    this.mode = Restriction.MODES.EQUAL;

    this.callbacks = Util.extend({
      getCurrentValue: () => {}
    }, callbacks);

    this.setTargetValue(params.targetValue);
    this.setMode(params.mode);
  }

  /**
   * Set target value.
   * @param {boolean|number|string|Date} targetValue Target value to be set.
   */
  setTargetValue(targetValue) {
    this.targetValue = targetValue;
  }

  /**
   * Set mode.
   * @param {number|string} mode Mode to be set.
   */
  setMode(mode) {
    if (
      typeof mode === 'string' &&
      Object.keys(Restriction.MODES).includes(mode.toUpperCase())
    ) {
      this.mode = Restriction.MODES[mode.toUpperCase()];
    }
    else if (
      typeof mode === 'number' &&
      Object.values(Restriction.MODES).includes(mode)
    ) {
      this.mode = mode;
    }
  }

  /**
   * Determine whether the restriction was met.
   * Will compare the current value with the target value based on the mode,
   * e.g. "equal" or "greater" or "subset"
   * @returns {boolean} True, if restriction was met.
   */
  isMet() {
    if (this.targetValue === undefined) {
      return true;
    }

    let result;

    switch (this.mode) {
      case Restriction.MODES.NOTEQUAL:
        result = this.callbacks.getCurrentValue() !== this.targetValue;
        break;

      case Restriction.MODES.EQUAL:
        result = this.callbacks.getCurrentValue() === this.targetValue;
        break;

      case Restriction.MODES.LESSOREQUAL:
        result = this.callbacks.getCurrentValue() <= this.targetValue;
        break;

      case Restriction.MODES.GREATEROREQUAL:
        result = this.callbacks.getCurrentValue() >= this.targetValue;
        break;

      case Restriction.MODES.LESS:
        result = this.callbacks.getCurrentValue() < this.targetValue;
        break;

      case Restriction.MODES.GREATER:
        result = this.callbacks.getCurrentValue() > this.targetValue;
        break;

      // current value is superset of targetValue / contains targetValue
      case Restriction.MODES.SUPSET:
        result = (typeof this.callbacks.getCurrentValue() === 'string') ?
          this.callbacks.getCurrentValue().includes(this.targetValue) :
          false;
        break;

      // current value is subset of targetValue / is contained by targetValue
      case Restriction.MODES.SUBSET:
        result = (typeof this.targetValue === 'string') ?
          this.targetValue.includes(this.callbacks.getCurrentValue()) :
          false;
        break;

      default:
        result = false;
        break;
    }

    return result;
  }
}

/** @constant {object} MODES Possible modes. */
Restriction.MODES = {
  NOTEQUAL: 0, // current value is not equal to target value
  EQUAL: 1, // current value is equal to target value
  LESSOREQUAL: 2, // current value is less than or equal to target value
  GREATEROREQUAL: 3, // current value is greater than or equal to target value
  LESS: 4, // current value is less than target value
  GREATER: 5, // current value is greater than target value
  SUPSET: 6, // current value contains target value/is superset of target value
  SUBSET: 7 // current value is included in target value/is subset of target value
};
