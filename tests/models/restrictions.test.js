import Restrictions from '@models/restrictions/restrictions';
import Restriction from '@models/restrictions/restriction';
import { beforeEach, describe, expect, test } from '@jest/globals';

let restrictions;
let currentValue;
let currentValue2;
let currentValue3;

const testValues = [
  undefined, null,
  true, false,
  -1, 0, 1, 2, 3,
  '1', 'f', 'o', 'x', 'foo', 'foobar',
  [], {},
  new Date('2023-01-01T00:00:00.000Z'), new Date('2023-01-02T00:00:00.000Z')
];

const getCurrentValue = () => {
  return currentValue;
};

const getCurrentValue2 = () => {
  return currentValue2;
};

const getCurrentValue3 = () => {
  return currentValue3;
};

beforeEach(() => {
  restrictions = new Restrictions();
  currentValue = undefined;
  currentValue2 = undefined;
  currentValue3 = undefined;
});

describe('Main functions', () => {
  test('No restrictions set', () => {
    expect(restrictions.mode).toBe(Restrictions.MODES['ALL']);
    expect(restrictions.areMet()).toBe(true);
  });

  test('Add and remove restrictions', () => {
    // Should be ignored due to argument not being an object
    restrictions.add();
    expect(Object.keys(restrictions.restrictions).length).toBe(0);

    // Should be ignored due to argument not being an object
    restrictions.add('123');
    expect(Object.keys(restrictions.restrictions).length).toBe(0);

    // Should be added
    restrictions.add(
      { id: 1, targetValue: 1, getCurrentValue: getCurrentValue }
    );
    expect(Object.keys(restrictions.restrictions).length).toBe(1);

    // Should replace existing restriction
    restrictions.add(
      { id: 1, targetValue: 2, getCurrentValue: getCurrentValue }
    );
    expect(Object.keys(restrictions.restrictions).length).toBe(1);
    expect(restrictions.restrictions[1].targetValue).toBe(2);

    // Should add another restriction
    restrictions.add(
      { id: 2, targetValue: 1, getCurrentValue: getCurrentValue }
    );
    expect(Object.keys(restrictions.restrictions).length).toBe(2);

    // Should add another restriction, yet without config yet
    restrictions.add(
      { id: 3 }
    );
    expect(Object.keys(restrictions.restrictions).length).toBe(3);

    // Should be ignored to to missing id
    restrictions.remove();
    expect(Object.keys(restrictions.restrictions).length).toBe(3);

    // Should remove restriction with id 2
    restrictions.remove(2);
    expect(Object.keys(restrictions.restrictions)).toStrictEqual(['1', '3']);

    // Should remove restriction with id 1
    restrictions.remove(1);
    expect(Object.keys(restrictions.restrictions)).toStrictEqual(['3']);
  });

  test('Set mode', () => {
    expect(restrictions.mode).toBe(1);

    // Should be ignored due to missing argument
    restrictions.setMode();
    expect(restrictions.mode).toBe(Restrictions.MODES['ALL']);

    // Should set the mode to ANY by value
    restrictions.setMode(0);
    expect(restrictions.mode).toBe(Restrictions.MODES['ANY']);

    // Should be ignored as -1 is not a legal value
    restrictions.setMode(-1);
    expect(restrictions.mode).toBe(Restrictions.MODES['ANY']);

    // Should set the mode to ALL by value
    restrictions.setMode(Restrictions.MODES['ALL']);
    expect(restrictions.mode).toBe(Restrictions.MODES['ALL']);

    // Should set the mode to ANY by value
    restrictions.setMode(Restrictions.MODES['ANY']);
    expect(restrictions.mode).toBe(Restrictions.MODES['ANY']);

    // Should set the mode to ALL by key
    restrictions.setMode('ALL');
    expect(restrictions.mode).toBe(Restrictions.MODES['ALL']);

    // Should set the mode to ANY by key
    restrictions.setMode('ANY');
    expect(restrictions.mode).toBe(Restrictions.MODES['ANY']);

    // Should set the mode to ALL by key (ignoring case)
    restrictions.setMode('all');
    expect(restrictions.mode).toBe(Restrictions.MODES['ALL']);

    // Should set the mode to ANY by key (ignoring case)
    restrictions.setMode('any');
    expect(restrictions.mode).toBe(Restrictions.MODES['ANY']);
  });
});

describe('Test meeting restrictions', () => {
  test('ALL, 1 restriction', () => {
    restrictions.setMode(Restrictions.MODES['ALL']);
    expect(restrictions.areMet()).toBe(true);

    const targetValue = 1;
    restrictions.add(
      { id: 1, targetValue: targetValue, getCurrentValue: getCurrentValue }
    );
    expect(restrictions.areMet()).toBe(currentValue === targetValue);

    [-1, 0, 1, '1'].forEach((value) => {
      currentValue = value;
      expect(restrictions.areMet()).toBe(currentValue === targetValue);
    });
  });

  test('ANY, 1 restriction', () => {
    restrictions.setMode(Restrictions.MODES['ANY']);
    expect(restrictions.areMet()).toBe(true);

    const targetValue = 1;
    restrictions.add(
      { id: 1, targetValue: targetValue, getCurrentValue: getCurrentValue }
    );
    expect(restrictions.areMet()).toBe(currentValue === targetValue);

    [-1, 0, 1, '1'].forEach((value) => {
      currentValue = value;
      expect(restrictions.areMet()).toBe(currentValue === targetValue);
    });
  });

  test('ALL, 2 restrictions with EQUAL', () => {
    restrictions.setMode(Restrictions.MODES['ALL']);
    expect(restrictions.areMet()).toBe(true);

    // Introduce restrictions
    const targetValue = 1;
    restrictions.add(
      { id: 1, targetValue: targetValue, getCurrentValue: getCurrentValue }
    );
    expect(restrictions.areMet()).toBe(false);

    const targetValue2 = 2;
    restrictions.add(
      { id: 2, targetValue: targetValue2, getCurrentValue: getCurrentValue2 }
    );
    expect(restrictions.areMet()).toBe(false);

    // restrictions met if all current values match target values
    [-1, 0, 1, '1'].forEach((value1) => {
      [-1, 0, 1, '2'].forEach((value2) => {
        currentValue = value1;
        currentValue2 = value2;
        expect(restrictions.areMet()).toBe(
          currentValue === targetValue && currentValue2 === targetValue2
        );
      });
    });
  });

  test('ANY, 2 restrictions with EQUAL', () => {
    restrictions.setMode(Restrictions.MODES['ANY']);
    expect(restrictions.areMet()).toBe(true);

    // Introduce restrictions
    const targetValue = 1;
    restrictions.add(
      { id: 1, targetValue: targetValue, getCurrentValue: getCurrentValue }
    );
    expect(restrictions.areMet()).toBe(false);

    const targetValue2 = 2;
    restrictions.add(
      { id: 2, targetValue: targetValue2, getCurrentValue: getCurrentValue2 }
    );
    expect(restrictions.areMet()).toBe(false);

    // restrictions met if any current value matches target value
    testValues.forEach((value1) => {
      testValues.forEach((value2) => {
        currentValue = value1;
        currentValue2 = value2;
        expect(restrictions.areMet()).toBe(
          currentValue === targetValue || currentValue2 === targetValue2
        );
      });
    });
  });

  test('ALL, 3 restrictions mixed', () => {
    restrictions.setMode(Restrictions.MODES['ALL']);

    // Introduce restrictions
    const targetValue = 1;
    restrictions.add(
      { id: 1, targetValue: targetValue, getCurrentValue: getCurrentValue }
    );

    const targetValue2 = new Date('2023-01-01T00:00:00.000Z');
    restrictions.add(
      { id: 2, targetValue: targetValue2, getCurrentValue: getCurrentValue2, mode: Restriction.MODES['LESSOREQUAL'] }
    );

    const targetValue3 = 'foo';
    restrictions.add(
      { id: 3, targetValue: targetValue3, getCurrentValue: getCurrentValue3, mode: Restriction.MODES['SUBSET'] }
    );

    testValues.forEach((value1) => {
      testValues.forEach((value2) => {
        testValues.forEach((value3) => {
          currentValue = value1;
          currentValue2 = value2;
          currentValue3 = value3;

          // Restrictions met if every single restriction is met
          const expected =
            (value1 === targetValue) &&
            (value2 <= targetValue2) &&
            ((typeof targetValue3 === 'string') ?
              targetValue3.includes(value3) :
              false
            );

          expect(restrictions.areMet()).toBe(expected);
        });
      });
    });
  });

  test('ANY, 3 restrictions mixed', () => {
    restrictions.setMode(Restrictions.MODES['ANY']);

    // Introduce restrictions
    const targetValue = 1;
    restrictions.add(
      { id: 1, targetValue: targetValue, getCurrentValue: getCurrentValue }
    );

    const targetValue2 = new Date('2023-01-01T00:00:00.000Z');
    restrictions.add(
      { id: 2, targetValue: targetValue2, getCurrentValue: getCurrentValue2, mode: Restriction.MODES['LESSOREQUAL'] }
    );

    const targetValue3 = 'foo';
    restrictions.add(
      { id: 3, targetValue: targetValue3, getCurrentValue: getCurrentValue3, mode: Restriction.MODES['SUBSET'] }
    );

    testValues.forEach((value1) => {
      testValues.forEach((value2) => {
        testValues.forEach((value3) => {
          currentValue = value1;
          currentValue2 = value2;
          currentValue3 = value3;

          // Restrictions met if any single restriction is met
          const expected =
            (value1 === targetValue) ||
            (value2 <= targetValue2) ||
            ((typeof targetValue3 === 'string') ?
              targetValue3.includes(value3) :
              false
            );

          expect(restrictions.areMet()).toBe(expected);
        });
      });
    });
  });
});
