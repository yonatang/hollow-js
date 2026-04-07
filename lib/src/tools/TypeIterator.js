/**
 * Utility to iterate all records in a type
 */

import {GenericHollowObject} from '../api/GenericHollowObject.js';
import {GenericHollowSet} from '../api/GenericHollowSet.js';
import {GenericHollowList} from '../api/GenericHollowList.js';
import {GenericHollowMap} from '../api/GenericHollowMap.js';
import {SchemaType} from '../schema/HollowSchema.js';

/**
 * Type iterator utility
 */
export class TypeIterator {
  /**
   * Create a generic object of the appropriate type
   * @param {HollowReadStateEngine} stateEngine - The state engine
   * @param {string} typeName - The type name
   * @param {number} ordinal - The ordinal
   * @returns {GenericHollowObject|GenericHollowSet|GenericHollowList|GenericHollowMap} The generic object
   */
  static createGenericObject(stateEngine, typeName, ordinal) {
    const typeState = stateEngine.getTypeState(typeName);
    const schemaType = typeState.getSchema().getSchemaType();

    switch (schemaType) {
    case SchemaType.OBJECT:
      return new GenericHollowObject(stateEngine, typeName, ordinal);
    case SchemaType.SET:
      return new GenericHollowSet(stateEngine, typeName, ordinal);
    case SchemaType.LIST:
      return new GenericHollowList(stateEngine, typeName, ordinal);
    case SchemaType.MAP:
      return new GenericHollowMap(stateEngine, typeName, ordinal);
    default:
      throw new Error(`Unknown schema type: ${schemaType}`);
    }
  }

  /**
   * Iterate over all records in a type
   * @param {HollowTypeReadState} typeState - The type state
   * @param {HollowReadStateEngine} stateEngine - The state engine
   * @param {Function} callback - Callback function(obj, ordinal)
   */
  static forEach(typeState, stateEngine, callback) {
    const typeName = typeState.getSchema().getName();
    const populatedOrdinals = typeState.getPopulatedOrdinals();

    let ordinal = populatedOrdinals.nextSetBit(0);
    while (ordinal !== -1) {
      const obj = TypeIterator.createGenericObject(stateEngine, typeName, ordinal);
      callback(obj, ordinal);
      ordinal = populatedOrdinals.nextSetBit(ordinal + 1);
    }
  }

  /**
   * Get all records in a type as an array
   * @param {HollowTypeReadState} typeState - The type state
   * @param {HollowReadStateEngine} stateEngine - The state engine
   * @returns {GenericHollowObject[]} Array of objects
   */
  static toArray(typeState, stateEngine) {
    const result = [];
    TypeIterator.forEach(typeState, stateEngine, (obj) => {
      result.push(obj);
    });
    return result;
  }

  /**
   * Get count of populated records
   * @param {HollowTypeReadState} typeState - The type state
   * @returns {number} Count of records
   */
  static count(typeState) {
    return typeState.getPopulatedOrdinals().cardinality();
  }
}
