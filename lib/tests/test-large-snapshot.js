import {beforeAll, describe, expect, test} from '@jest/globals';
import {HollowConsumer, RecordStringifier, TypeIterator} from '../src/index.js';
import fs from 'node:fs';

// This is a fairly large file, 0.5gb, so I won't check it into git
// Use the java-helper to generate the file to run the tests
const SNAPSHOT_PATH = './tests/snapshots/large';

describe.skip('Snapshot Loading', () => {
    let consumer;
    let engine;

    const types = ['ListOfString', 'MapOfStringToString', 'Person', 'SetOfString', 'String'];
    beforeAll(async () => {
        consumer = new HollowConsumer();
        console.log('loading ', SNAPSHOT_PATH);
        const content = fs.readFileSync(SNAPSHOT_PATH);
        engine = await consumer.loadSnapshotFromBuffer(content.buffer);
    });
    test('load large snapshot', () => {
        const loadedTypes = engine.getAllTypes();
        expect(loadedTypes.sort()).toEqual(types);

        const stringType = engine.getTypeState('String');
        console.log('stringType.getMaxOrdinal()', stringType.getMaxOrdinal());
        console.log('stringType.shardIndex', stringType.shardIndex);
    });

    test('Person ordinal 2 - all fields', () => {
        const hobj = TypeIterator.createGenericObject(engine, 'Person', 2);
        const obj = RecordStringifier.hollowObjectToValue(hobj);

        expect(obj.id).toBe(10002);
        expect(obj.name).toBe('Person 10002');

        // cities is a list (ordered)
        expect(obj.cities).toEqual([
            'Toronto', 'New York', 'Oslo', 'Helsinki', 'Stockholm',
            'Singapore', 'Prague', 'London', 'Seoul', 'Bangkok',
            'Dubai', 'Paris', 'Mumbai', 'Tokyo', 'Vienna',
            'Sydney', 'Zurich', 'Rome', 'Madrid',
        ]);

        // tags is a set (unordered)
        expect(obj.tags).toHaveLength(7);
        expect(obj.tags).toEqual(expect.arrayContaining([
            'influencer', 'churned', 'beta', 'student', 'developer', 'high_value', 'subscriber',
        ]));

        // tagMap is a map
        expect(obj.tagMap).toEqual({
            source: 'value40',
            age_group: 'value94',
            referrer: 'value31',
            campaign: 'value86',
            lang: 'value59',
            color: 'value99',
            tier: 'value6',
            device: 'value10',
            cohort: 'value42',
            industry: 'value43',
            department: 'value6',
            browser: 'value88',
        });
    })
});