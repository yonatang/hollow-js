import { describe, test, expect, beforeAll } from '@jest/globals';
import { HollowConsumer, TypeIterator } from '../src/index.js';
import fs from 'node:fs';

const SNAPSHOT_PATH = './tests/snapshots/snapshot-20260405040910001';

describe('TypeIterator', () => {
  let consumer;
  let engine;

  beforeAll(async () => {
    consumer = new HollowConsumer();
    const content = fs.readFileSync(SNAPSHOT_PATH);
    engine = await consumer.loadSnapshotFromBuffer(content.buffer);
  });

  test('should count records in type', () => {
    const movieState = engine.getTypeState('Movie');
    const count = TypeIterator.count(movieState);

    expect(count).toBe(6);
  });

  test('should iterate with forEach', () => {
    const movieState = engine.getTypeState('Movie');
    let count = 0;
    const ordinals = [];

    TypeIterator.forEach(movieState, engine, (obj, ordinal) => {
      count++;
      ordinals.push(ordinal);
    });

    expect(count).toBe(6);
    expect(ordinals.length).toBe(6);

    // Verify ordinals are all valid numbers
    for (const ordinal of ordinals) {
      expect(typeof ordinal).toBe('number');
      expect(isNaN(ordinal)).toBe(false);
      expect(ordinal).toBeGreaterThanOrEqual(0);
    }
  });

  test('should convert to array', () => {
    const movieState = engine.getTypeState('Movie');
    const array = TypeIterator.toArray(movieState, engine);

    expect(array.length).toBe(6);
    expect(Array.isArray(array)).toBe(true);
  });

  test('should handle all types', () => {
    const stringState = engine.getTypeState('String');
    const actorState = engine.getTypeState('Actor');
    const setOfActorState = engine.getTypeState('SetOfActor');
    const movieState = engine.getTypeState('Movie');

    expect(TypeIterator.count(stringState)).toBeGreaterThan(0);
    expect(TypeIterator.count(actorState)).toBe(11);
    expect(TypeIterator.count(setOfActorState)).toBeGreaterThan(0);
    expect(TypeIterator.count(movieState)).toBe(6);
  });

  // TODO not a particularly good test
  // test('should not leak memory during iteration', () => {
  //   const movieState = engine.getTypeState('Movie');
  //   const initialMemory = process.memoryUsage().heapUsed;
  //
  //   // Iterate multiple times
  //   for (let i = 0; i < 1000; i++) {
  //     let count = 0;
  //     TypeIterator.forEach(movieState, engine, (obj, ordinal) => {
  //       count++;
  //     });
  //     expect(count).toBe(6);
  //   }
  //
  //   const finalMemory = process.memoryUsage().heapUsed;
  //   const memoryIncrease = finalMemory - initialMemory;
  //   const memoryIncreaseMB = memoryIncrease / 1024 / 1024;
  //
  //   console.log(memoryIncreaseMB)
  //   // Memory should not increase significantly (allow up to 20MB for GC fluctuations)
  //   expect(memoryIncreaseMB).toBeLessThan(40);
  // });

  test('should handle sparse ordinals', () => {
    const movieState = engine.getTypeState('Movie');
    const ordinals = [];

    TypeIterator.forEach(movieState, engine, (obj, ordinal) => {
      ordinals.push(ordinal);
    });

    // Verify ordinals may have gaps but are all valid
    for (let i = 1; i < ordinals.length; i++) {
      const gap = ordinals[i] - ordinals[i - 1];
      expect(gap).toBeGreaterThanOrEqual(1);
    }
  });

  test('should provide valid objects in forEach', () => {
    const movieState = engine.getTypeState('Movie');

    TypeIterator.forEach(movieState, engine, (obj, ordinal) => {
      expect(obj).toBeTruthy();
      expect(typeof obj.getInt).toBe('function');

      const id = obj.getInt('id');
      expect(typeof id).toBe('number');
    });
  });
});
