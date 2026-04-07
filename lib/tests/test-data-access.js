import {beforeAll, describe, expect, test} from '@jest/globals';
import {HollowConsumer} from '../src/index.js';
import fs from 'node:fs';

const SNAPSHOT_PATH = './tests/snapshots/snapshot-20260405040910001';

describe('Data Access API', () => {
  let consumer;
  let engine;
  let stringState;
  let movieState;
  let actorState;

  beforeAll(async () => {
    consumer = new HollowConsumer();
    const content = fs.readFileSync(SNAPSHOT_PATH);
    engine = await consumer.loadSnapshotFromBuffer(content.buffer);

    stringState = engine.getTypeState('String');
    movieState = engine.getTypeState('Movie');
    actorState = engine.getTypeState('Actor');
  });

  test('should access type states', () => {
    expect(stringState).toBeTruthy();
    expect(movieState).toBeTruthy();
    expect(actorState).toBeTruthy();
  });

  test('should have correct schema fields', () => {
    const movieSchema = movieState.getSchema();
    expect(movieSchema.name).toBe('Movie');
    expect(movieSchema.numFields()).toBe(5);
    expect(movieSchema.getFieldName(0)).toBe('id');
    expect(movieSchema.getFieldName(1)).toBe('title');
    expect(movieSchema.getFieldName(2)).toBe('viewers');
    expect(movieSchema.getFieldName(3)).toBe('actors');
    expect(movieSchema.getFieldName(4)).toBe('roles');
  });

  test('should read movie field values', () => {
    const movieBits = movieState.getPopulatedOrdinals();
    const firstOrd = movieBits.nextSetBit(0);

    expect(firstOrd).toBeGreaterThanOrEqual(0);

    const movieId = movieState.readInt(firstOrd, 0);
    const movieTitleOrd = movieState.readOrdinal(firstOrd, 1);

    expect(typeof movieId).toBe('number');
    expect(typeof movieTitleOrd).toBe('number');
  });

  test('should read string field values', () => {
    const movieBits = movieState.getPopulatedOrdinals();
    const firstOrd = movieBits.nextSetBit(0);
    const titleOrd = movieState.readOrdinal(firstOrd, 1);

    const title = stringState.readString(titleOrd, 0);
    expect(typeof title).toBe('string');
    expect(title.length).toBeGreaterThan(0);
    expect(title).toBe('Movie 10001');
  });

  test('should iterate through multiple movies', () => {
    const movieBits = movieState.getPopulatedOrdinals();
    let ord = movieBits.nextSetBit(0);
    let count = 0;

    while (ord >= 0 && count < 5) {
      const id = movieState.readInt(ord, 0);
      const titleOrd = movieState.readOrdinal(ord, 1);

      expect(typeof id).toBe('number');
      expect(typeof titleOrd).toBe('number');

      if (titleOrd >= 0) {
        const title = stringState.readString(titleOrd, 0);
        expect(typeof title).toBe('string');
      }

      ord = movieBits.nextSetBit(ord + 1);
      count++;
    }

    expect(count).toBe(5);
  });

  test('should read actor field values', () => {
    const actorBits = actorState.getPopulatedOrdinals();
    const firstActor = actorBits.nextSetBit(0);

    expect(firstActor).toBeGreaterThanOrEqual(0);

    const actorId = actorState.readInt(firstActor, 0);
    const actorNameOrd = actorState.readOrdinal(firstActor, 1);

    expect(typeof actorId === 'number' || actorId === null).toBe(true);
    expect(typeof actorNameOrd).toBe('number');

    if (actorNameOrd >= 0) {
      const actorName = stringState.readString(actorNameOrd, 0);
      expect(typeof actorName).toBe('string');
      expect(actorName.length).toBeGreaterThan(0);
    }
  });
});
