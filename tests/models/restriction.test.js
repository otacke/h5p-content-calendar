import Restriction from '@models/restrictions/restriction';
import { beforeEach, describe, expect, test } from '@jest/globals';

let restriction;
let currentValue;

const testValues = [
  undefined, null,
  true, false,
  -1, 0, 1, 2, 3,
  '1', 'f', 'o', 'x', 'foo', 'foobar',
  [], {},
  new Date('2023-01-01T00:00:00.000Z'), new Date('2023-01-02T00:00:00.000Z')
];

const testModes = [
  'NOTEQUAL', 'EQUAL', 'LESSOREQUAL', 'GREATEROREQUAL',
  'LESS', 'GREATER', 'SUPSET', 'SUBSET'
];

beforeEach(() => {
  restriction = new Restriction({}, {
    getCurrentValue: () => {
      return currentValue;
    }
  });
});

describe('Main functions', () => {
  test('Nothing set', () => {
    expect(restriction.targetValue).toBe(undefined);
    expect(restriction.mode).toBe(Restriction.MODES['EQUAL']);
    expect(restriction.isMet()).toBe(true);
  });

  /* setTargetValue() should always set the value */
  test('SetTargetValue', () => {
    testValues.forEach((value) => {
      restriction.setTargetValue(value);
      expect(restriction.targetValue).toBe(value);
    });
  });

  /* setModes() should only accept and set modes defined in Restriction.MODES */
  test('SetMode (valid keys)', () => {
    Object.keys(Restriction.MODES).forEach((value) => {
      restriction.setMode(value);
      expect(restriction.mode).toBe(Restriction.MODES[value]);
    });

    // Should accept any letter case
    Object.keys(Restriction.MODES).forEach((value) => {
      restriction.setMode(value.toLowerCase());
      expect(restriction.mode).toBe(Restriction.MODES[value]);
    });
  });

  /* setModes() should only accept and set modes defined in Restriction.MODES */
  test('SetMode (valid values)', () => {
    Object.values(Restriction.MODES).forEach((value) => {
      restriction.setMode(value);
      expect(restriction.mode).toBe(value);
    });
  });

  /* setModes() should ignore modes not defined in Restriction.MODES */
  test('SetMode (invalid keys/values)', () => {
    const originalMode = restriction.mode;

    testValues
      .filter((value) => {
        if (typeof value === 'string') {
          return !Object.keys(Restriction.MODES).includes(value.toUpperCase());
        }

        if (typeof value === 'number') {
          return !Object.values(Restriction.MODES).includes(value);
        }

        return true;
      })
      .forEach((value) => {
        restriction.setMode(value);

        expect(restriction.mode).toBe(originalMode);
      });
  });

  /*
   * Flood with all combinations of value and target value types for all
   * comparision modes
   */
  describe('Comparisons', () => {
    testValues.forEach((targetValue) => {
      testModes.forEach((testMode) => {
        testValues.forEach((testValue) => {
          test(`"${testValue}" ${testMode} "${targetValue}"`, () => {
            restriction.setTargetValue(targetValue);
            restriction.setMode(testMode);

            currentValue = testValue;

            let expected;

            if (targetValue === undefined) {
              expected = true;
            }
            else {
              switch (testMode) {
                case 'NOTEQUAL':
                  expected = testValue !== targetValue;
                  break;

                case 'EQUAL':
                  expected = testValue === targetValue;
                  break;

                case 'LESSOREQUAL':
                  expected = testValue <= targetValue;
                  break;

                case 'GREATEROREQUAL':
                  expected = testValue >= targetValue;
                  break;

                case 'LESS':
                  expected = testValue < targetValue;
                  break;

                case 'GREATER':
                  expected = testValue > targetValue;
                  break;

                case 'SUPSET':
                  expected = (typeof testValue === 'string') ?
                    testValue.includes(targetValue) :
                    false;
                  break;

                case 'SUBSET':
                  expected = (typeof targetValue === 'string') ?
                    targetValue.includes(testValue) :
                    false;
                  break;

                default:
                  expected = false;
                  break;
              }
            }

            expect(restriction.isMet()).toBe(expected);
          });
        });
      });
    });
  });
});
