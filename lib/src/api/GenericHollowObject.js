/**
 * Generic object accessor (no code generation required)
 * Based on com.netflix.hollow.api.objects.generic.GenericHollowObject
 */

import {SchemaType} from '../schema/HollowSchema.js';
import {GenericHollowList} from './GenericHollowList.js';
import {GenericHollowSet} from './GenericHollowSet.js';
import {GenericHollowMap} from './GenericHollowMap.js';

/**
 * Generic Hollow object - provides access to record fields by name
 */
export class GenericHollowObject {
  /**
   * Create a new GenericHollowObject
   * @param {HollowReadStateEngine} stateEngine - The state engine
   * @param {string} typeName - The type name
   * @param {number} ordinal - The record ordinal
   */
  constructor(stateEngine, typeName, ordinal) {
    this.stateEngine = stateEngine;
    this.typeName = typeName;
    this.ordinal = ordinal;
    this.typeState = stateEngine.getTypeState(typeName);

    if (!this.typeState) {
      throw new Error(`Type not found: ${typeName}`);
    }

    this.schema = this.typeState.getSchema();
  }

  /**
   * Get the type name
   * @returns {string} The type name
   */
  getTypeName() {
    return this.typeName;
  }

  /**
   * Get the ordinal
   * @returns {number} The ordinal
   */
  getOrdinal() {
    return this.ordinal;
  }

  /**
   * Get an INT field value
   * @param {string} fieldName - The field name
   * @returns {number} The int value, or null
   */
  getInt(fieldName) {
    const fieldIndex = this.schema.getPosition(fieldName);
    if (fieldIndex === -1) {
      throw new Error(`Field not found: ${fieldName} in type ${this.typeName}`);
    }
    return this.typeState.readInt(this.ordinal, fieldIndex);
  }

  /**
   * Get a LONG field value
   * @param {string} fieldName - The field name
   * @returns {number} The long value as a Number, or null
   */
  getLong(fieldName) {
    const fieldIndex = this.schema.getPosition(fieldName);
    if (fieldIndex === -1) {
      throw new Error(`Field not found: ${fieldName} in type ${this.typeName}`);
    }
    const value = this.typeState.readLong(this.ordinal, fieldIndex);
    // Convert BigInt to Number for JavaScript compatibility
    // Note: This may lose precision for values > Number.MAX_SAFE_INTEGER (2^53 - 1)
    return value === null ? null : Number(value);
  }

  /**
   * Get a BOOLEAN field value
   * @param {string} fieldName - The field name
   * @returns {boolean} The boolean value, or null
   */
  getBoolean(fieldName) {
    const fieldIndex = this.schema.getPosition(fieldName);
    if (fieldIndex === -1) {
      throw new Error(`Field not found: ${fieldName} in type ${this.typeName}`);
    }
    return this.typeState.readBoolean(this.ordinal, fieldIndex);
  }

  /**
   * Get a FLOAT field value
   * @param {string} fieldName - The field name
   * @returns {number} The float value, or null
   */
  getFloat(fieldName) {
    const fieldIndex = this.schema.getPosition(fieldName);
    if (fieldIndex === -1) {
      throw new Error(`Field not found: ${fieldName} in type ${this.typeName}`);
    }
    return this.typeState.readFloat(this.ordinal, fieldIndex);
  }

  /**
   * Get a DOUBLE field value
   * @param {string} fieldName - The field name
   * @returns {number} The double value, or null
   */
  getDouble(fieldName) {
    const fieldIndex = this.schema.getPosition(fieldName);
    if (fieldIndex === -1) {
      throw new Error(`Field not found: ${fieldName} in type ${this.typeName}`);
    }
    return this.typeState.readDouble(this.ordinal, fieldIndex);
  }

  /**
   * Get a STRING field value
   * @param {string} fieldName - The field name
   * @returns {string} The string value, or null
   */
  getString(fieldName) {
    const fieldIndex = this.schema.getPosition(fieldName);
    if (fieldIndex === -1) {
      throw new Error(`Field not found: ${fieldName} in type ${this.typeName}`);
    }
    return this.typeState.readString(this.ordinal, fieldIndex);
  }

  /**
   * Get a BYTES field value
   * @param {string} fieldName - The field name
   * @returns {Uint8Array} The bytes value, or null
   */
  getBytes(fieldName) {
    const fieldIndex = this.schema.getPosition(fieldName);
    if (fieldIndex === -1) {
      throw new Error(`Field not found: ${fieldName} in type ${this.typeName}`);
    }
    return this.typeState.readBytes(this.ordinal, fieldIndex);
  }

  /**
   * Get a REFERENCE field value (as GenericHollowObject, GenericHollowSet, GenericHollowList, or GenericHollowMap)
   * @param {string} fieldName - The field name
   * @returns {GenericHollowObject|GenericHollowSet|GenericHollowList|GenericHollowMap} The referenced object, or null
   */
  getObject(fieldName) {
    const fieldIndex = this.schema.getPosition(fieldName);
    if (fieldIndex === -1) {
      throw new Error(`Field not found: ${fieldName} in type ${this.typeName}`);
    }

    const referencedOrdinal = this.typeState.readOrdinal(this.ordinal, fieldIndex);
    if (referencedOrdinal === -1) {
      return null;
    }

    const referencedType = this.schema.getReferencedType(fieldIndex);

    // Get the schema of the referenced type to determine what to return
    const referencedTypeState = this.stateEngine.getTypeState(referencedType);
    const referencedSchema = referencedTypeState.getSchema();
    const schemaType = referencedSchema.getSchemaType();

    // Return the appropriate Generic type based on schema type
    switch (schemaType) {
    case SchemaType.OBJECT:
      return new GenericHollowObject(this.stateEngine, referencedType, referencedOrdinal);
    case SchemaType.SET:
      return new GenericHollowSet(this.stateEngine, referencedType, referencedOrdinal);
    case SchemaType.LIST:
      return new GenericHollowList(this.stateEngine, referencedType, referencedOrdinal);
    case SchemaType.MAP:
      return new GenericHollowMap(this.stateEngine, referencedType, referencedOrdinal);
    default:
      return new GenericHollowObject(this.stateEngine, referencedType, referencedOrdinal);
    }
  }

  /**
   * Get a LIST field value (as GenericHollowList)
   * @param {string} fieldName - The field name
   * @returns {GenericHollowList} The list, or null
   */
  getList(fieldName) {
    const fieldIndex = this.schema.getPosition(fieldName);
    if (fieldIndex === -1) {
      throw new Error(`Field not found: ${fieldName} in type ${this.typeName}`);
    }

    const referencedOrdinal = this.typeState.readOrdinal(this.ordinal, fieldIndex);
    if (referencedOrdinal === -1) {
      return null;
    }

    const referencedType = this.schema.getReferencedType(fieldIndex);
    return new GenericHollowList(this.stateEngine, referencedType, referencedOrdinal);
  }

  /**
   * Get a SET field value (as GenericHollowSet)
   * @param {string} fieldName - The field name
   * @returns {GenericHollowSet} The set, or null
   */
  getSet(fieldName) {
    const fieldIndex = this.schema.getPosition(fieldName);
    if (fieldIndex === -1) {
      throw new Error(`Field not found: ${fieldName} in type ${this.typeName}`);
    }

    const referencedOrdinal = this.typeState.readOrdinal(this.ordinal, fieldIndex);
    if (referencedOrdinal === -1) {
      return null;
    }

    const referencedType = this.schema.getReferencedType(fieldIndex);
    return new GenericHollowSet(this.stateEngine, referencedType, referencedOrdinal);
  }

  /**
   * Get a MAP field value (as GenericHollowMap)
   * @param {string} fieldName - The field name
   * @returns {GenericHollowMap} The map, or null
   */
  getMap(fieldName) {
    const fieldIndex = this.schema.getPosition(fieldName);
    if (fieldIndex === -1) {
      throw new Error(`Field not found: ${fieldName} in type ${this.typeName}`);
    }

    const referencedOrdinal = this.typeState.readOrdinal(this.ordinal, fieldIndex);
    if (referencedOrdinal === -1) {
      return null;
    }

    const referencedType = this.schema.getReferencedType(fieldIndex);
    return new GenericHollowMap(this.stateEngine, referencedType, referencedOrdinal);
  }

  /**
   * Get all field names
   * @returns {string[]} Array of field names
   */
  getFieldNames() {
    const names = [];
    for (let i = 0; i < this.schema.numFields(); i++) {
      names.push(this.schema.getFieldName(i));
    }
    return names;
  }

  /**
   * Get field type by name
   * @param {string} fieldName - The field name
   * @returns {string} The field type
   */
  getFieldType(fieldName) {
    return this.schema.getFieldTypeByName(fieldName);
  }
}
