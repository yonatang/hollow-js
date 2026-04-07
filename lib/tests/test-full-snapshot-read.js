import {beforeAll, describe, expect, test} from '@jest/globals';
import fs from 'fs';
import {FieldType, GenericHollowObject, HollowConsumer, SchemaType} from '../src/index.js';

const SNAPSHOT_PATH = './tests/snapshots/snapshot-20260405040910001';

describe('read full snapshot', () => {
  let consumer;
  let engine;

  function loadMovie(ord) {
    const movieState = engine.getTypeState('Movie');
    const movieOrd = movieState.getPopulatedOrdinals().nextSetBit(ord);
    return new GenericHollowObject(engine, 'Movie', movieOrd);
  }

  beforeAll(async () => {
    consumer = new HollowConsumer();
    const content = fs.readFileSync(SNAPSHOT_PATH);
    engine = await consumer.loadSnapshotFromBuffer(content.buffer);
  });

  describe('should read the schema', () => {
    test('should read the schema for Movie', () => {
      const movieState = engine.getTypeState('Movie');
      const schema = movieState.schema;
      expect(schema.getSchemaType()).toBe('OBJECT');
      expect(schema.getName()).toBe('Movie');
      const fields = [];
      for (let i = 0; i < schema.numFields(); i++) {
        const fieldName = schema.getFieldName(i);
        const fieldType = schema.getFieldType(i);
        const referenceType = schema.getReferencedType(i);
        fields.push({fieldName, fieldType, referenceType});
      }
      expect(fields.map(f => f.fieldName)).toStrictEqual(['id', 'title', 'viewers', 'actors', 'roles']);
      expect(fields.map(f => f.referenceType)).toStrictEqual([null, 'String', null, 'SetOfActor', 'MapOfStringToActor']);
      expect(fields.map(f => f.fieldType)).toStrictEqual(['INT', 'REFERENCE', 'LONG', 'REFERENCE', 'REFERENCE']);
      const primaryKey = schema.getPrimaryKey();
      expect(primaryKey).toStrictEqual(['id']);
    });

    test('should read the schema for Actor', () => {
      const actorState = engine.getTypeState('Actor');
      const schema = actorState.getSchema();

      // Verify schema type
      expect(schema.getSchemaType()).toBe(SchemaType.OBJECT);
      expect(schema.getName()).toBe('Actor');

      // Verify number of fields
      expect(schema.numFields()).toBe(8);

      // Verify field names and types
      expect(schema.getFieldName(0)).toBe('actorId');
      expect(schema.getFieldType(0)).toBe(FieldType.INT);

      expect(schema.getFieldName(1)).toBe('actorName');
      expect(schema.getFieldType(1)).toBe(FieldType.REFERENCE);
      expect(schema.getReferencedType(1)).toBe('String');

      expect(schema.getFieldName(2)).toBe('age');
      expect(schema.getFieldType(2)).toBe(FieldType.DOUBLE);

      expect(schema.getFieldName(3)).toBe('floatAge');
      expect(schema.getFieldType(3)).toBe(FieldType.FLOAT);

      expect(schema.getFieldName(4)).toBe('active');
      expect(schema.getFieldType(4)).toBe(FieldType.BOOLEAN);

      expect(schema.getFieldName(5)).toBe('kids');
      expect(schema.getFieldType(5)).toBe(FieldType.REFERENCE);
      expect(schema.getReferencedType(5)).toBe('ListOfString');

      expect(schema.getFieldName(6)).toBe('image');
      expect(schema.getFieldType(6)).toBe(FieldType.BYTES);

      expect(schema.getFieldName(7)).toBe('foreignName');
      expect(schema.getFieldType(7)).toBe(FieldType.REFERENCE);
      expect(schema.getReferencedType(7)).toBe('String');

      // Verify field lookup by name
      expect(schema.getPosition('actorId')).toBe(0);
      expect(schema.getPosition('actorName')).toBe(1);
      expect(schema.getPosition('age')).toBe(2);
      expect(schema.getPosition('floatAge')).toBe(3);
      expect(schema.getPosition('active')).toBe(4);
      expect(schema.getPosition('kids')).toBe(5);
      expect(schema.getPosition('nonexistent')).toBe(-1);
    });

    test('should read the schema for SetOfActor', () => {
      const setOfActorState = engine.getTypeState('SetOfActor');
      const schema = setOfActorState.getSchema();

      // Verify schema type
      expect(schema.getSchemaType()).toBe(SchemaType.SET);
      expect(schema.getName()).toBe('SetOfActor');

      // Verify element type
      expect(schema.getElementType()).toBe('Actor');
    });

    test('should read the schema for ListOfString', () => {
      const listOfStringState = engine.getTypeState('ListOfString');
      const schema = listOfStringState.getSchema();

      // Verify schema type
      expect(schema.getSchemaType()).toBe(SchemaType.LIST);
      expect(schema.getName()).toBe('ListOfString');

      // Verify element type
      expect(schema.getElementType()).toBe('String');
    });

    test('should read the schema for MapOfStringToActor', () => {
      const mapState = engine.getTypeState('MapOfStringToActor');
      const schema = mapState.getSchema();

      // Verify schema type
      expect(schema.getSchemaType()).toBe(SchemaType.MAP);
      expect(schema.getName()).toBe('MapOfStringToActor');

      // Verify key and value types
      expect(schema.getKeyType()).toBe('String');
      expect(schema.getValueType()).toBe('Actor');
    });


  });


  describe('reading movies', () => {
    test('should have the current number of movies', () => {
      const movieState = engine.getTypeState('Movie');
      expect(movieState.getMaxOrdinal()).toBe(5);
      expect(movieState.getPopulatedOrdinals().cardinality()).toBe(6);
    });

    test('should read movie ord 0', () => {
      const movie = loadMovie(0);

      // Validate basic movie data
      validateMovieData(movie, 10001, 38, 'Movie 10001', 3942853202);

      // Validate all actors as documented in snapshot text
      validateMovieActors(movie, 0, [
        {
          ord: 3,
          actorId: 20004,
          actorNameOrd: 8,
          actorName: 'Actor 20004',
          foreignName: 'שחקן 20004',
          active: false,
          age: 47.1,
          floatAge: 47.1,
          kids: ['Ava 20004', 'Lucas 20004'],
          image: signedToUnsigned([-107, 109, 65, 5, 4, -128, -122, -109, -93, 95])
        },
        {
          ord: 1,
          actorId: 20002,
          actorNameOrd: 3,
          actorName: 'Actor 20002',
          foreignName: 'שחקן 20002',
          active: false,
          age: 29.3,
          floatAge: 29.3,
          kids: ['Olivia 20002'],
          image: signedToUnsigned([-4, 72, 90, -39, -22, 63, 7, -31, 1, -124])
        },
        {
          ord: 5,
          actorId: 20006,
          actorNameOrd: 16,
          actorName: 'Actor 20006',
          foreignName: 'שחקן 20006',
          active: true,
          age: 33.9,
          floatAge: 33.9,
          kids: ['Ava 20006', 'Mason 20006'],
          image: signedToUnsigned([-84, 93, -3, 66, -71, 66, 27, -120, 72, -77])
        },
        {
          ord: 4,
          actorId: 20005,
          actorNameOrd: 12,
          actorName: 'Actor 20005',
          foreignName: 'שחקן 20005',
          active: false,
          age: 31.4,
          floatAge: 31.4,
          kids: ['Noah 20005', 'Mason 20005'],
          image: signedToUnsigned([49, 40, -126, -14, -72, -114, -99, -19, 125, -34])
        }
      ]);

      // Validate all roles as documented in snapshot text
      validateMovieRoles(movie, 0, [
        {keyOrd: 40, roleName: 'Sidekick', actorOrd: 5, actorId: 20006, actorName: 'Actor 20006'},
        {keyOrd: 41, roleName: 'Mentor', actorOrd: 3, actorId: 20004, actorName: 'Actor 20004'},
        {keyOrd: 42, roleName: 'Villain', actorOrd: 4, actorId: 20005, actorName: 'Actor 20005'},
        {keyOrd: 39, roleName: 'Hero', actorOrd: 1, actorId: 20002, actorName: 'Actor 20002'}
      ]);
    });

    test('should read movie ord 1', () => {
      const movie = loadMovie(1);

      // Validate basic movie data
      validateMovieData(movie, 10002, 43, 'Movie 10002', 4585364780);

      // Validate actors
      validateMovieActors(movie, 1, [
        {
          ord: 2,
          actorId: 20003,
          actorNameOrd: 6,
          actorName: 'Actor 20003',
          foreignName: 'שחקן 20003',
          active: false,
          age: 41.2,
          floatAge: 41.2,
          kids: null,
          image: signedToUnsigned([-80, 30, 50, 15, 72, -26, -29, 63, 86, -118])
        }
      ]);

      // Validate roles
      validateMovieRoles(movie, 1, [
        {keyOrd: 39, roleName: 'Hero', actorOrd: 2, actorId: 20003, actorName: 'Actor 20003'}
      ]);
    });

    test('should read movie ord 2', () => {
      const movie = loadMovie(2);

      // Validate basic movie data
      validateMovieData(movie, 10003, 44, 'Movie 10003', 4866855146);

      // Validate actors
      validateMovieActors(movie, 2, [
        {
          ord: 7,
          actorId: 20008,
          actorNameOrd: 24,
          actorName: 'Actor 20008',
          foreignName: 'שחקן 20008',
          active: false,
          age: 33.1,
          floatAge: 33.1,
          kids: null,
          image: signedToUnsigned([-104, -94, -61, -64, 58, 105, -75, -89, -61, -119])
        },
        {
          ord: 8,
          actorId: 20009,
          actorNameOrd: 26,
          actorName: 'Actor 20009',
          foreignName: 'שחקן 20009',
          active: true,
          age: 47.9,
          floatAge: 47.9,
          kids: ['Sophia 20009', 'Emma 20009', 'Emma 20009'],
          image: signedToUnsigned([-94, 124, -71, -27, -72, 118, 46, -104, -31, 5])
        },
        {
          ord: 10,
          actorId: 20011,
          actorNameOrd: 35,
          actorName: 'Actor 20011',
          foreignName: 'שחקן 20011',
          active: true,
          age: 30.1,
          floatAge: 30.1,
          kids: ['Lucas 20011'],
          image: signedToUnsigned([-101, -117, -128, 102, 92, -114, -44, 91, -109, 39])
        }
      ]);

      // Validate roles
      validateMovieRoles(movie, 2, [
        {keyOrd: 40, roleName: 'Sidekick', actorOrd: 10, actorId: 20011, actorName: 'Actor 20011'},
        {keyOrd: 42, roleName: 'Villain', actorOrd: 7, actorId: 20008, actorName: 'Actor 20008'},
        {keyOrd: 39, roleName: 'Hero', actorOrd: 8, actorId: 20009, actorName: 'Actor 20009'}
      ]);
    });

    test('should read movie ord 3', () => {
      const movie = loadMovie(3);

      // Validate basic movie data
      validateMovieData(movie, 10004, 45, 'Movie 10004', 5014436401);

      // Validate actors
      validateMovieActors(movie, 3, [
        {
          ord: 2,
          actorId: 20003,
          actorNameOrd: 6,
          actorName: 'Actor 20003',
          foreignName: 'שחקן 20003',
          active: false,
          age: 41.2,
          floatAge: 41.2,
          kids: null,
          image: signedToUnsigned([-80, 30, 50, 15, 72, -26, -29, 63, 86, -118])
        },
        {
          ord: 9,
          actorId: 20010,
          actorNameOrd: 30,
          actorName: 'Actor 20010',
          foreignName: 'שחקן 20010',
          active: true,
          age: 25.3,
          floatAge: 25.3,
          kids: ['Lucas 20010', 'Liam 20010', 'Noah 20010'],
          image: signedToUnsigned([-60, 20, 79, -87, 9, -113, 33, -65, -7, -93])
        },
        {
          ord: 0,
          actorId: 20001,
          actorNameOrd: 0,
          actorName: 'Actor 20001',
          foreignName: 'שחקן 20001',
          active: true,
          age: 21.6,
          floatAge: 21.6,
          kids: ['Mason 20001'],
          image: signedToUnsigned([72, -66, 59, -70, -105, -42, -35, 82, -42, -2])
        }
      ]);

      // Validate roles
      validateMovieRoles(movie, 3, [
        {keyOrd: 40, roleName: 'Sidekick', actorOrd: 2, actorId: 20003, actorName: 'Actor 20003'},
        {keyOrd: 42, roleName: 'Villain', actorOrd: 9, actorId: 20010, actorName: 'Actor 20010'},
        {keyOrd: 39, roleName: 'Hero', actorOrd: 0, actorId: 20001, actorName: 'Actor 20001'}
      ]);
    });

    test('should read movie ord 4', () => {
      const movie = loadMovie(4);

      // Validate basic movie data
      validateMovieData(movie, 10005, 46, 'Movie 10005', 4433944571);

      // Validate actors
      validateMovieActors(movie, 4, [
        {
          ord: 5,
          actorId: 20006,
          actorNameOrd: 16,
          actorName: 'Actor 20006',
          foreignName: 'שחקן 20006',
          active: true,
          age: 33.9,
          floatAge: 33.9,
          kids: ['Ava 20006', 'Mason 20006'],
          image: signedToUnsigned([-84, 93, -3, 66, -71, 66, 27, -120, 72, -77])
        },
        {
          ord: 1,
          actorId: 20002,
          actorNameOrd: 3,
          actorName: 'Actor 20002',
          foreignName: 'שחקן 20002',
          active: false,
          age: 29.3,
          floatAge: 29.3,
          kids: ['Olivia 20002'],
          image: signedToUnsigned([-4, 72, 90, -39, -22, 63, 7, -31, 1, -124])
        },
        {
          ord: 8,
          actorId: 20009,
          actorNameOrd: 26,
          actorName: 'Actor 20009',
          foreignName: 'שחקן 20009',
          active: true,
          age: 47.9,
          floatAge: 47.9,
          kids: ['Sophia 20009', 'Emma 20009', 'Emma 20009'],
          image: signedToUnsigned([-94, 124, -71, -27, -72, 118, 46, -104, -31, 5])
        },
        {
          ord: 6,
          actorId: 20007,
          actorNameOrd: 20,
          actorName: 'Actor 20007',
          foreignName: 'שחקן 20007',
          active: true,  // Actual value in snapshot (raw=1)
          age: 49.9,
          floatAge: 49.9,
          kids: ['Mason 20007', 'Noah 20007', 'Noah 20007'],
          image: signedToUnsigned([-59, 40, 91, -57, 45, -109, 45, 79, 98, -26])
        }
      ]);

      // Validate roles
      validateMovieRoles(movie, 4, [
        {keyOrd: 40, roleName: 'Sidekick', actorOrd: 8, actorId: 20009, actorName: 'Actor 20009'},
        {keyOrd: 41, roleName: 'Mentor', actorOrd: 6, actorId: 20007, actorName: 'Actor 20007'},
        {keyOrd: 42, roleName: 'Villain', actorOrd: 5, actorId: 20006, actorName: 'Actor 20006'},
        {keyOrd: 39, roleName: 'Hero', actorOrd: 1, actorId: 20002, actorName: 'Actor 20002'}
      ]);
    });

    test('should read movie ord 5', () => {
      const movie = loadMovie(5);

      // Validate basic movie data
      validateMovieData(movie, 10006, 47, 'Movie 10006', 4986365998);

      // Validate actors
      validateMovieActors(movie, 5, [
        {
          ord: 2,
          actorId: 20003,
          actorNameOrd: 6,
          actorName: 'Actor 20003',
          foreignName: 'שחקן 20003',
          active: false,
          age: 41.2,
          floatAge: 41.2,
          kids: null,
          image: signedToUnsigned([-80, 30, 50, 15, 72, -26, -29, 63, 86, -118])
        },
        {
          ord: 1,
          actorId: 20002,
          actorNameOrd: 3,
          actorName: 'Actor 20002',
          foreignName: 'שחקן 20002',
          active: false,
          age: 29.3,
          floatAge: 29.3,
          kids: ['Olivia 20002'],
          image: signedToUnsigned([-4, 72, 90, -39, -22, 63, 7, -31, 1, -124])
        },
        {
          ord: 3,
          actorId: 20004,
          actorNameOrd: 8,
          actorName: 'Actor 20004',
          foreignName: 'שחקן 20004',
          active: false,
          age: 47.1,
          floatAge: 47.1,
          kids: ['Ava 20004', 'Lucas 20004'],
          image: signedToUnsigned([-107, 109, 65, 5, 4, -128, -122, -109, -93, 95])
        },
        {
          ord: 7,
          actorId: 20008,
          actorNameOrd: 24,
          actorName: 'Actor 20008',
          foreignName: 'שחקן 20008',
          active: false,
          age: 33.1,
          floatAge: 33.1,
          kids: null,
          image: signedToUnsigned([-104, -94, -61, -64, 58, 105, -75, -89, -61, -119])
        }
      ]);

      // Validate roles
      validateMovieRoles(movie, 5, [
        {keyOrd: 40, roleName: 'Sidekick', actorOrd: 3, actorId: 20004, actorName: 'Actor 20004'},
        {keyOrd: 41, roleName: 'Mentor', actorOrd: 7, actorId: 20008, actorName: 'Actor 20008'},
        {keyOrd: 42, roleName: 'Villain', actorOrd: 2, actorId: 20003, actorName: 'Actor 20003'},
        {keyOrd: 39, roleName: 'Hero', actorOrd: 1, actorId: 20002, actorName: 'Actor 20002'}
      ]);
    });
  });
});


/**
 * Convert a GenericHollowSet to an object mapping ordinal -> element
 * @param {GenericHollowSet} set - The set to convert
 * @returns {Object} Object with ordinals as keys and elements as values
 */
function setToOrdinalMap(set) {
  const map = {};
  const size = set.size();
  for (let i = 0; i < size; i++) {
    const element = set.get(i);
    const ordinal = element.getOrdinal();
    map[ordinal] = element;
  }
  return map;
}

function mapToOrdinalEntryMap(hmap) {
  const map = {};
  const size = hmap.size();
  for (let i = 0; i < size; i++) {
    const element = hmap.getEntry(i);
    const key = element.key;
    const value = element.value;
    const ordinal = key.getOrdinal();
    map[ordinal] = {key, value};
  }
  return map;
}

/**
 * Validate a role entry in a map
 * @param {Object} rolesMap - Map of ordinal -> {key, value}
 * @param {number} keyOrdinal - Expected key ordinal
 * @param {string} roleName - Expected role name (e.g., "Hero")
 * @param {number} actorOrdinal - Expected actor ordinal
 * @param {number} actorId - Expected actor ID
 * @param {string} actorName - Expected actor name
 */
function validateRole(rolesMap, keyOrdinal, roleName, actorOrdinal, actorId, actorName) {
  const {key, value} = rolesMap[keyOrdinal];
  expect(key.getOrdinal()).toBe(keyOrdinal);
  expect(key.getString('value')).toBe(roleName);
  expect(value.getOrdinal()).toBe(actorOrdinal);
  expect(value.getInt('actorId')).toBe(actorId);
  expect(value.getObject('actorName').getString('value')).toBe(actorName);
}


/**
 * Validate basic movie data
 * @param {GenericHollowObject} movie - The movie object
 * @param {number} expectedId - Expected movie ID
 * @param {number} expectedTitleOrdinal - Expected title String ordinal
 * @param {string} expectedTitleValue - Expected title string value
 * @param {number} expectedViewers - Expected viewers count
 */
function validateMovieData(movie, expectedId, expectedTitleOrdinal, expectedTitleValue, expectedViewers) {
  expect(movie.getInt('id')).toBe(expectedId);
  const titleObj = movie.getObject('title');
  expect(titleObj.getOrdinal()).toBe(expectedTitleOrdinal);
  expect(titleObj.getString('value')).toBe(expectedTitleValue);
  expect(movie.getLong('viewers')).toBe(expectedViewers);
}

/**
 * Convert signed bytes (Java format) to unsigned bytes (JS Uint8Array format)
 * @param {number[]} signedBytes - Array of signed bytes (-128 to 127)
 * @returns {number[]} Array of unsigned bytes (0 to 255)
 */
function signedToUnsigned(signedBytes) {
  return signedBytes.map(b => b < 0 ? b + 256 : b);
}

/**
 * Validate all actors in a movie
 * @param {GenericHollowObject} movie - The movie object
 * @param {number} expectedSetOrdinal - Expected actors set ordinal
 * @param {Array<{ord: number, actorId: number, actorNameOrd: number, actorName: string, active: boolean|null, age: number, floatAge: number, kids: string[]|null, image: number[]}>} expectedActors - Array of expected actor info
 */
function validateMovieActors(movie, expectedSetOrdinal, expectedActors) {
  const actors = movie.getSet('actors');
  expect(actors.getOrdinal()).toBe(expectedSetOrdinal);
  expect(actors.size()).toBe(expectedActors.length);

  // Verify actor ordinals match expectations
  const actualActorOrdinals = [];
  for (let i = 0; i < actors.size(); i++) {
    actualActorOrdinals.push(actors.get(i).getOrdinal());
  }
  const expectedActorOrdinals = expectedActors.map(a => a.ord).sort();
  expect(actualActorOrdinals.sort()).toEqual(expectedActorOrdinals);

  // Create a map for easy access by ordinal
  const actorsMap = setToOrdinalMap(actors);

  // Validate each actor
  for (const expected of expectedActors) {
    expect(actorsMap[expected.ord]).toBeDefined();
    const actor = actorsMap[expected.ord];

    expect(actor.getOrdinal()).toBe(expected.ord);
    expect(actor.getInt('actorId')).toBe(expected.actorId);

    const actorName = actor.getObject('actorName');
    expect(actorName.getOrdinal()).toBe(expected.actorNameOrd);
    expect(actorName.getString('value')).toBe(expected.actorName);

    // Test UTF-8 foreignName field if provided
    if (expected.foreignName !== undefined) {
      const foreignName = actor.getObject('foreignName');
      expect(foreignName.getString('value')).toBe(expected.foreignName);
    }

    expect(actor.getBoolean('active')).toBe(expected.active);
    expect(actor.getDouble('age')).toBe(expected.age);
    // Floats have less precision than doubles, so use toBeCloseTo
    expect(actor.getFloat('floatAge')).toBeCloseTo(expected.floatAge, 1);

    // Test image bytes field
    if (expected.image !== undefined) {
      const imageBytes = actor.getBytes('image');
      expect(Array.from(imageBytes)).toEqual(expected.image);
    }

    const kids = actor.getList('kids');
    if (expected.kids === null) {
      expect(kids).toBe(null);
    } else {
      expect(kids.size()).toBe(expected.kids.length);
      for (let i = 0; i < expected.kids.length; i++) {
        expect(kids.get(i).getString('value')).toBe(expected.kids[i]);
      }
    }
  }
}

/**
 * Validate all roles in a movie
 * @param {GenericHollowObject} movie - The movie object
 * @param {number} expectedMapOrdinal - Expected map ordinal
 * @param {Array<{keyOrd: number, roleName: string, actorOrd: number, actorId: number, actorName: string}>} expectedRoles - Array of expected role info
 */
function validateMovieRoles(movie, expectedMapOrdinal, expectedRoles) {
  const roles = movie.getMap('roles');
  expect(roles.getOrdinal()).toBe(expectedMapOrdinal);
  expect(roles.size()).toBe(expectedRoles.length);

  // Collect all key ordinals and verify they match expectations
  const actualKeyOrdinals = [];
  for (let i = 0; i < roles.size(); i++) {
    actualKeyOrdinals.push(roles.getEntry(i).key.getOrdinal());
  }
  const expectedKeyOrdinals = expectedRoles.map(r => r.keyOrd).sort();
  expect(actualKeyOrdinals.sort()).toEqual(expectedKeyOrdinals);

  // Validate each role
  const rolesMap = mapToOrdinalEntryMap(roles);
  for (const role of expectedRoles) {
    validateRole(rolesMap, role.keyOrd, role.roleName, role.actorOrd, role.actorId, role.actorName);
  }
}