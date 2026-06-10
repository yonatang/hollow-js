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
        const loadedTypes = engine.getAllTypes();
        expect(loadedTypes.sort()).toEqual(types);
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

    test('should have all 6 schemas with correct types', () => {
        const schemas = engine.getSchemas();
        expect(schemas.size).toBe(6);
        expect(schemas.get('String').getSchemaType()).toBe('OBJECT');
        expect(schemas.get('ListOfString').getSchemaType()).toBe('LIST');
        expect(schemas.get('Actor').getSchemaType()).toBe('OBJECT');
        expect(schemas.get('SetOfActor').getSchemaType()).toBe('SET');
        expect(schemas.get('MapOfStringToActor').getSchemaType()).toBe('MAP');
        expect(schemas.get('Movie').getSchemaType()).toBe('OBJECT');
    });

    test('String schema details', () => {
        const schema = engine.getSchemas().get('String');
        expect(schema.getName()).toBe('String');
        expect(schema.numFields()).toBe(1);
        expect(schema.getFieldName(0)).toBe('value');
        expect(schema.getFieldType(0)).toBe('STRING');
        expect(schema.getReferencedType(0)).toBeNull();
        expect(schema.getPrimaryKey()).toBeNull();
    });

    test('ListOfString schema details', () => {
        const schema = engine.getSchemas().get('ListOfString');
        expect(schema.getName()).toBe('ListOfString');
        expect(schema.getElementType()).toBe('String');
    });

    test('Actor schema details', () => {
        const schema = engine.getSchemas().get('Actor');
        expect(schema.getName()).toBe('Actor');
        expect(schema.numFields()).toBe(8);
        expect(schema.getFieldName(0)).toBe('actorId');
        expect(schema.getFieldType(0)).toBe('INT');
        expect(schema.getReferencedType(0)).toBeNull();
        expect(schema.getFieldName(1)).toBe('actorName');
        expect(schema.getFieldType(1)).toBe('REFERENCE');
        expect(schema.getReferencedType(1)).toBe('String');
        expect(schema.getFieldName(2)).toBe('age');
        expect(schema.getFieldType(2)).toBe('DOUBLE');
        expect(schema.getReferencedType(2)).toBeNull();
        expect(schema.getFieldName(3)).toBe('floatAge');
        expect(schema.getFieldType(3)).toBe('FLOAT');
        expect(schema.getReferencedType(3)).toBeNull();
        expect(schema.getFieldName(4)).toBe('active');
        expect(schema.getFieldType(4)).toBe('BOOLEAN');
        expect(schema.getReferencedType(4)).toBeNull();
        expect(schema.getFieldName(5)).toBe('kids');
        expect(schema.getFieldType(5)).toBe('REFERENCE');
        expect(schema.getReferencedType(5)).toBe('ListOfString');
        expect(schema.getFieldName(6)).toBe('image');
        expect(schema.getFieldType(6)).toBe('BYTES');
        expect(schema.getReferencedType(6)).toBeNull();
        expect(schema.getFieldName(7)).toBe('foreignName');
        expect(schema.getFieldType(7)).toBe('REFERENCE');
        expect(schema.getReferencedType(7)).toBe('String');
        expect(schema.getPrimaryKey()).toEqual(['actorId']);
    });

    test('SetOfActor schema details', () => {
        const schema = engine.getSchemas().get('SetOfActor');
        expect(schema.getName()).toBe('SetOfActor');
        expect(schema.getElementType()).toBe('Actor');
        expect(schema.getHashKey()).toEqual(['actorName']);
    });

    test('MapOfStringToActor schema details', () => {
        const schema = engine.getSchemas().get('MapOfStringToActor');
        expect(schema.getName()).toBe('MapOfStringToActor');
        expect(schema.getKeyType()).toBe('String');
        expect(schema.getValueType()).toBe('Actor');
        expect(schema.getHashKey()).toEqual(['value']);
    });

    test('Movie schema details', () => {
        const schema = engine.getSchemas().get('Movie');
        expect(schema.getName()).toBe('Movie');
        expect(schema.numFields()).toBe(5);
        expect(schema.getFieldName(0)).toBe('id');
        expect(schema.getFieldType(0)).toBe('INT');
        expect(schema.getReferencedType(0)).toBeNull();
        expect(schema.getFieldName(1)).toBe('title');
        expect(schema.getFieldType(1)).toBe('REFERENCE');
        expect(schema.getReferencedType(1)).toBe('String');
        expect(schema.getFieldName(2)).toBe('viewers');
        expect(schema.getFieldType(2)).toBe('LONG');
        expect(schema.getReferencedType(2)).toBeNull();
        expect(schema.getFieldName(3)).toBe('actors');
        expect(schema.getFieldType(3)).toBe('REFERENCE');
        expect(schema.getReferencedType(3)).toBe('SetOfActor');
        expect(schema.getFieldName(4)).toBe('roles');
        expect(schema.getFieldType(4)).toBe('REFERENCE');
        expect(schema.getReferencedType(4)).toBe('MapOfStringToActor');
        expect(schema.getPrimaryKey()).toEqual(['id']);
    });

});
