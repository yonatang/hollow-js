/**
 * Schema for OBJECT record types
 * Based on com.netflix.hollow.core.schema.HollowObjectSchema
 */

import { HollowSchema, SchemaType } from './HollowSchema.js';

/**
 * Field types for OBJECT schemas
 */
export const FieldType = {
  REFERENCE: 'REFERENCE',
  INT: 'INT',
  LONG: 'LONG',
  BOOLEAN: 'BOOLEAN',
  FLOAT: 'FLOAT',
  DOUBLE: 'DOUBLE',
  STRING: 'STRING',
  BYTES: 'BYTES'
};

/**
 * OBJECT schema
 */
export class HollowObjectSchema extends HollowSchema {
  /**
   * Create a new OBJECT schema
   * @param {string} schemaName - The schema name
   * @param {number} numFields - Number of fields
   * @param {string[]} keyFieldPaths - Primary key field paths (optional)
   */
  constructor(schemaName, numFields, keyFieldPaths = null) {
    super(schemaName);

    this.fieldNames = new Array(numFields);
    this.fieldTypes = new Array(numFields);
    this.referencedTypes = new Array(numFields);
    this.nameFieldIndexLookup = new Map();
    this.primaryKey = keyFieldPaths;
    this.size = 0;
  }

  /**
   * Get schema type
   * @returns {string} OBJECT
   */
  getSchemaType() {
    return SchemaType.OBJECT;
  }

  /**
   * Add a field to the schema
   * @param {string} fieldName - The field name
   * @param {string} fieldType - The field type (from FieldType)
   * @param {string} referencedType - The referenced type (for REFERENCE fields)
   * @returns {number} The field index
   */
  addField(fieldName, fieldType, referencedType = null) {
    if (fieldType === FieldType.REFERENCE && !referencedType) {
      throw new Error(
        `When adding a REFERENCE field to a schema, the referenced type must be provided. Check type: ${this.getName()} field: ${fieldName}`
      );
    }

    this.fieldNames[this.size] = fieldName;
    this.fieldTypes[this.size] = fieldType;
    this.referencedTypes[this.size] = referencedType;
    this.nameFieldIndexLookup.set(fieldName, this.size);

    this.size++;
    return this.size - 1;
  }

  /**
   * Get number of fields
   * @returns {number} Number of fields
   */
  numFields() {
    return this.size;
  }

  /**
   * Get field position by name
   * @param {string} fieldName - The field name
   * @returns {number} The field index, or -1 if not found
   */
  getPosition(fieldName) {
    const index = this.nameFieldIndexLookup.get(fieldName);
    return index !== undefined ? index : -1;
  }

  /**
   * Get field name by position
   * @param {number} fieldPosition - The field position
   * @returns {string} The field name
   */
  getFieldName(fieldPosition) {
    return this.fieldNames[fieldPosition];
  }

  /**
   * Get field type by name
   * @param {string} fieldName - The field name
   * @returns {string} The field type, or null if not found
   */
  getFieldTypeByName(fieldName) {
    const fieldPosition = this.getPosition(fieldName);
    if (fieldPosition === -1) {
      return null;
    }
    return this.getFieldType(fieldPosition);
  }

  /**
   * Get field type by position
   * @param {number} fieldPosition - The field position
   * @returns {string} The field type
   */
  getFieldType(fieldPosition) {
    return this.fieldTypes[fieldPosition];
  }

  /**
   * Get referenced type by name
   * @param {string} fieldName - The field name
   * @returns {string} The referenced type, or null if not found
   */
  getReferencedTypeByName(fieldName) {
    const fieldPosition = this.getPosition(fieldName);
    if (fieldPosition === -1) {
      return null;
    }
    return this.getReferencedType(fieldPosition);
  }

  /**
   * Get referenced type by position
   * @param {number} fieldPosition - The field position
   * @returns {string} The referenced type
   */
  getReferencedType(fieldPosition) {
    return this.referencedTypes[fieldPosition];
  }

  /**
   * Get primary key field paths
   * @returns {string[]} The primary key field paths, or null
   */
  getPrimaryKey() {
    return this.primaryKey;
  }
}
