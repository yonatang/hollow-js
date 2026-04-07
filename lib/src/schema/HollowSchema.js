/**
 * Base class for Hollow schemas
 * Based on com.netflix.hollow.core.schema.HollowSchema
 */

/**
 * Schema types enum
 */
export const SchemaType = {
  OBJECT: 'OBJECT',
  LIST: 'LIST',
  SET: 'SET',
  MAP: 'MAP',

  /**
   * Get schema type from type ID
   * @param {number} typeId - The type ID
   * @returns {string} The schema type
   */
  fromTypeId(typeId) {
    switch (typeId) {
      case 0:
      case 6:
        return SchemaType.OBJECT;
      case 1:
      case 4:
        return SchemaType.SET;
      case 2:
        return SchemaType.LIST;
      case 3:
      case 5:
        return SchemaType.MAP;
      default:
        throw new Error(`Cannot recognize HollowSchema type id ${typeId}`);
    }
  },

  /**
   * Check if type ID indicates a key is present
   * @param {number} typeId - The type ID
   * @returns {boolean} True if has key
   */
  hasKey(typeId) {
    return typeId === 4 || typeId === 5 || typeId === 6;
  }
};

/**
 * Base Hollow schema class
 */
export class HollowSchema {
  /**
   * Create a new schema
   * @param {string} name - The schema name
   */
  constructor(name) {
    if (name === null || name === undefined) {
      throw new Error('Type name in Hollow Schema was null');
    }
    this.name = name;
  }

  /**
   * Get the schema name
   * @returns {string} The schema name
   */
  getName() {
    return this.name;
  }

  /**
   * Get the schema type
   * @returns {string} The schema type
   */
  getSchemaType() {
    throw new Error('getSchemaType must be implemented by subclass');
  }
}
