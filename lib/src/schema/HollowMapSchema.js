/**
 * Schema for MAP record types
 * Based on com.netflix.hollow.core.schema.HollowMapSchema
 */

import { HollowSchema, SchemaType } from './HollowSchema.js';

/**
 * MAP schema
 */
export class HollowMapSchema extends HollowSchema {
  /**
   * Create a new MAP schema
   * @param {string} schemaName - The schema name
   * @param {string} keyType - The key type name
   * @param {string} valueType - The value type name
   * @param {string[]} hashKeyFields - Hash key field paths (optional)
   */
  constructor(schemaName, keyType, valueType, hashKeyFields = null) {
    super(schemaName);
    this.keyType = keyType;
    this.valueType = valueType;
    this.hashKeyFields = hashKeyFields;
  }

  /**
   * Get schema type
   * @returns {string} MAP
   */
  getSchemaType() {
    return SchemaType.MAP;
  }

  /**
   * Get key type
   * @returns {string} The key type name
   */
  getKeyType() {
    return this.keyType;
  }

  /**
   * Get value type
   * @returns {string} The value type name
   */
  getValueType() {
    return this.valueType;
  }

  /**
   * Get hash key fields
   * @returns {string[]} The hash key field paths, or null
   */
  getHashKey() {
    return this.hashKeyFields;
  }
}
