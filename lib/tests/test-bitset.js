import { describe, test, expect } from '@jest/globals';
import { BitSet } from '../src/util/BitSet.js';

describe('BitSet', () => {
  test('should set and get bits', () => {
    const bitSet = new BitSet(64);

    bitSet.set(0);
    bitSet.set(5);
    bitSet.set(31);
    bitSet.set(32);
    bitSet.set(63);

    expect(bitSet.get(0)).toBe(true);
    expect(bitSet.get(5)).toBe(true);
    expect(bitSet.get(31)).toBe(true);
    expect(bitSet.get(32)).toBe(true);
    expect(bitSet.get(63)).toBe(true);
    expect(bitSet.get(1)).toBe(false);
    expect(bitSet.get(10)).toBe(false);
  });

  test('should clear bits', () => {
    const bitSet = new BitSet(64);

    bitSet.set(5);
    expect(bitSet.get(5)).toBe(true);

    bitSet.clear(5);
    expect(bitSet.get(5)).toBe(false);
  });

  test('should find next set bit', () => {
    const bitSet = new BitSet(128);

    bitSet.set(0);
    bitSet.set(10);
    bitSet.set(29);
    bitSet.set(32);
    bitSet.set(63);
    bitSet.set(100);

    expect(bitSet.nextSetBit(0)).toBe(0);
    expect(bitSet.nextSetBit(1)).toBe(10);
    expect(bitSet.nextSetBit(11)).toBe(29);
    expect(bitSet.nextSetBit(30)).toBe(32);
    expect(bitSet.nextSetBit(33)).toBe(63);
    expect(bitSet.nextSetBit(64)).toBe(100);
    expect(bitSet.nextSetBit(101)).toBe(-1);
  });

  test('should count cardinality', () => {
    const bitSet = new BitSet(64);

    expect(bitSet.cardinality()).toBe(0);

    bitSet.set(0);
    expect(bitSet.cardinality()).toBe(1);

    bitSet.set(5);
    bitSet.set(31);
    expect(bitSet.cardinality()).toBe(3);

    bitSet.set(32);
    bitSet.set(63);
    expect(bitSet.cardinality()).toBe(5);
  });

  test('should handle large indices', () => {
    const bitSet = new BitSet(64);

    bitSet.set(1000);
    expect(bitSet.get(1000)).toBe(true);
    expect(bitSet.get(999)).toBe(false);

    const next = bitSet.nextSetBit(0);
    expect(next).toBe(1000);
  });

  test('should set range of bits', () => {
    const bitSet = new BitSet(64);

    bitSet.setRange(10, 20);

    for (let i = 10; i < 20; i++) {
      expect(bitSet.get(i)).toBe(true);
    }
    expect(bitSet.get(9)).toBe(false);
    expect(bitSet.get(20)).toBe(false);
    expect(bitSet.cardinality()).toBe(10);
  });

  test('should iterate through all set bits', () => {
    const bitSet = new BitSet(128);
    const expected = [0, 10, 29, 32, 63, 100];

    expected.forEach(i => bitSet.set(i));

    const actual = [];
    let bit = bitSet.nextSetBit(0);
    while (bit !== -1) {
      actual.push(bit);
      bit = bitSet.nextSetBit(bit + 1);
    }

    expect(actual).toEqual(expected);
  });

  test('should handle empty BitSet', () => {
    const bitSet = new BitSet(64);

    expect(bitSet.nextSetBit(0)).toBe(-1);
    expect(bitSet.cardinality()).toBe(0);
  });

  test('should return correct size', () => {
    const bitSet = new BitSet(64);
    expect(bitSet.size()).toBe(64);

    bitSet.set(100);
    expect(bitSet.size()).toBeGreaterThanOrEqual(128);
  });
});
