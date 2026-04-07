import {describe, expect, test} from '@jest/globals';
import {FixedLengthData} from '../src/io/FixedLengthData.js';

describe('FixedLengthData tests', () => {
  test('should get 21bit int correctly for first value', () => {
    const data = Buffer.from('09080000001e8482', 'hex');
    const fixedLengthData = new FixedLengthData(data);
    const value = fixedLengthData.getElementValue(0, 21);
    expect(value).toBe(2000002);
  });

  test('should get 14bit int correctly for 21th bit', () => {
    const data = Buffer.from('09080000001e84820b7a1218001000bd', 'hex');
    const fixedLengthData = new FixedLengthData(data);
    const value = fixedLengthData.getElementValue(21, 14);
    expect(value).toBe(0);
  });
});