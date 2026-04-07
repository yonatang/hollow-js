/**
 * Schema for LIST record types
 * Based on com.netflix.hollow.core.schema.HollowListSchema
 */

import { HollowSchema, SchemaType } from './HollowSchema.js';

/**
 * LIST schema
 */
export class HollowListSchema extends HollowSchema {
  /**
   * Create a new LIST schema
   * @param {string} schemaName - The schema name
   * @param {string} elementType - The element type name
   */
  constructor(schemaName, elementType) {
    super(schemaName);
    this.elementType = elementType;
  }

  /**
   * Get schema type
   * @returns {string} LIST
   */
  getSchemaType() {
    return SchemaType.LIST;
  }

  /**
   * Get element type
   * @returns {string} The element type name
   */
  getElementType() {
    return this.elementType;
  }
}
