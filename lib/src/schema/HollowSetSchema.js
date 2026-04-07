/**
 * Schema for SET record types
 * Based on com.netflix.hollow.core.schema.HollowSetSchema
 */

import { HollowSchema, SchemaType } from './HollowSchema.js';

/**
 * SET schema
 */
export class HollowSetSchema extends HollowSchema {
  /**
   * Create a new SET schema
   * @param {string} schemaName - The schema name
   * @param {string} elementType - The element type name
   * @param {string[]} hashKeyFields - Hash key field paths (optional)
   */
  constructor(schemaName, elementType, hashKeyFields = null) {
    super(schemaName);
    this.elementType = elementType;
    this.hashKeyFields = hashKeyFields;
  }

  /**
   * Get schema type
   * @returns {string} SET
   */
  getSchemaType() {
    return SchemaType.SET;
  }

  /**
   * Get element type
   * @returns {string} The element type name
   */
  getElementType() {
    return this.elementType;
  }

  /**
   * Get hash key fields
   * @returns {string[]} The hash key field paths, or null
   */
  getHashKey() {
    return this.hashKeyFields;
  }
}
