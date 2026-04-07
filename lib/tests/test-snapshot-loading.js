import {beforeAll, describe, expect, test} from '@jest/globals';
import {HollowConsumer} from '../src/index.js';
import fs from 'node:fs';

const SNAPSHOT_PATH = './tests/snapshots/snapshot-20260405040910001';

describe('Snapshot Loading', () => {
  let consumer;
  let engine;

  const types = ['Actor', 'ListOfString', 'MapOfStringToActor', 'Movie', 'SetOfActor', 'String']
  beforeAll(async () => {
    consumer = new HollowConsumer();
    const content = fs.readFileSync(SNAPSHOT_PATH);
    engine = await consumer.loadSnapshotFromBuffer(content.buffer);
  });

  test('should load all types', () => {
    const types = engine.getAllTypes();
    expect(types.sort()).toEqual(types);
  });

  test('should load correct number of types', () => {
    expect(engine.getNumTypes()).toBe(types.length);
  });

  test('should have type states for all types', () => {
    types.forEach(typeName => {
      const typeState = engine.getTypeState(typeName);
      expect(typeState).toBeTruthy();
    });
  });

  test('should have correct schemas', () => {
    const stringSchema = engine.getTypeState('String').getSchema();
    expect(stringSchema.getName()).toBe('String');
    expect(stringSchema.numFields()).toBe(1);

    const actorSchema = engine.getTypeState('Actor').getSchema();
    expect(actorSchema.getName()).toBe('Actor');
    expect(actorSchema.numFields()).toBe(8);

    const movieSchema = engine.getTypeState('Movie').getSchema();
    expect(movieSchema.getName()).toBe('Movie');
    expect(movieSchema.numFields()).toBe(5);
  });

  test('should have populated ordinals', () => {
    const stringState = engine.getTypeState('String');
    expect(stringState.getPopulatedOrdinals().cardinality()).toBe(48);

    const actorState = engine.getTypeState('Actor');
    expect(actorState.getPopulatedOrdinals().cardinality()).toBe(11);

    const movieState = engine.getTypeState('Movie');
    expect(movieState.getPopulatedOrdinals().cardinality()).toBe(6);
  });

  test('should have loaded fixed-length data', () => {
    const stringState = engine.getTypeState('String');
    expect(stringState.fixedLengthData).toBeTruthy();
    expect(stringState.fixedLengthData.data.length).toBeGreaterThan(0);

    const movieState = engine.getTypeState('Movie');
    expect(movieState.fixedLengthData).toBeTruthy();
    expect(movieState.fixedLengthData.data.length).toBeGreaterThan(0);
  });

  test('should have loaded variable-length data', () => {
    const stringState = engine.getTypeState('String');
    expect(stringState.varLengthData).toBeTruthy();
    expect(stringState.varLengthData[0]).toBeTruthy();
  });
});
