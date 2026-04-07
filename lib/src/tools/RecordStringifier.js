/**
 * JSON stringification of records
 * Based on com.netflix.hollow.tools.stringifier.HollowRecordJsonStringifier
 */

import { SchemaType } from '../schema/HollowSchema.js';
import { FieldType } from '../schema/HollowObjectSchema.js';

/**
 * Record stringifier - converts Hollow records to JSON
 */
export class RecordStringifier {
  /**
   * Convert a GenericHollowObject to JSON
   * @param {GenericHollowObject} obj - The object
   * @param {boolean} pretty - Whether to pretty-print
   * @returns {string} JSON string
   */
  static toJSON(obj, pretty = false) {
    const result = RecordStringifier.objectToValue(obj);
    return pretty ? JSON.stringify(result, null, 2) : JSON.stringify(result);
  }

  /**
   * Convert an object to a value (internal)
   * @param {GenericHollowObject|GenericHollowList|GenericHollowSet|GenericHollowMap} obj - The object
   * @returns {*} The value
   */
  static objectToValue(obj) {
    if (obj === null || obj === undefined) {
      return null;
    }

    const schema = obj.schema;
    const schemaType = schema.getSchemaType();

    switch (schemaType) {
      case SchemaType.OBJECT:
        return RecordStringifier.hollowObjectToValue(obj);
      case SchemaType.LIST:
        return RecordStringifier.hollowListToValue(obj);
      case SchemaType.SET:
        return RecordStringifier.hollowSetToValue(obj);
      case SchemaType.MAP:
        return RecordStringifier.hollowMapToValue(obj);
      default:
        return null;
    }
  }

  /**
   * Convert a OBJECT to a value
   * @param {GenericHollowObject} obj - The object
   * @returns {Object} The value
   */
  static hollowObjectToValue(obj) {
    const result = {};
    const fieldNames = obj.getFieldNames();

    for (const fieldName of fieldNames) {
      const fieldType = obj.getFieldType(fieldName);

      try {
        let value;

        switch (fieldType) {
          case FieldType.INT:
            value = obj.getInt(fieldName);
            break;
          case FieldType.LONG:
            value = obj.getLong(fieldName);
            value = value !== null ? value.toString() : null; // Convert BigInt to string for JSON
            break;
          case FieldType.BOOLEAN:
            value = obj.getBoolean(fieldName);
            break;
          case FieldType.FLOAT:
            value = obj.getFloat(fieldName);
            break;
          case FieldType.DOUBLE:
            value = obj.getDouble(fieldName);
            break;
          case FieldType.STRING:
            value = obj.getString(fieldName);
            break;
          case FieldType.BYTES:
            const bytes = obj.getBytes(fieldName);
            value = bytes ? Array.from(bytes) : null; // Convert to array for JSON
            break;
          case FieldType.REFERENCE:
            const refObj = obj.getObject(fieldName);
            value = refObj ? RecordStringifier.objectToValue(refObj) : null;
            break;
          default:
            value = null;
        }

        result[fieldName] = value;
      } catch (e) {
        result[fieldName] = `<error: ${e.message}>`;
      }
    }

    return result;
  }

  /**
   * Convert a LIST to a value
   * @param {GenericHollowList} list - The list
   * @returns {Array} The value
   */
  static hollowListToValue(list) {
    const result = [];
    const size = list.size();

    for (let i = 0; i < size; i++) {
      const element = list.get(i);
      result.push(RecordStringifier.objectToValue(element));
    }

    return result;
  }

  /**
   * Convert a SET to a value
   * @param {GenericHollowSet} set - The set
   * @returns {Array} The value
   */
  static hollowSetToValue(set) {
    const result = [];
    const size = set.size();

    for (let i = 0; i < size; i++) {
      const element = set.get(i);
      result.push(RecordStringifier.objectToValue(element));
    }

    return result;
  }

  /**
   * Convert a MAP to a value
   * @param {GenericHollowMap} map - The map
   * @returns {Object} The value
   */
  static hollowMapToValue(map) {
    const result = {};
    const size = map.size();

    for (let i = 0; i < size; i++) {
      const entry = map.getEntry(i);
      // Try to use key as string if possible
      const keyObj = entry.key;
      let keyStr;

      // If key is a simple object with a single string field, use that
      const keyFieldNames = keyObj.getFieldNames();
      if (keyFieldNames.length === 1) {
        const fieldType = keyObj.getFieldType(keyFieldNames[0]);
        if (fieldType === FieldType.STRING) {
          keyStr = keyObj.getString(keyFieldNames[0]);
        } else if (fieldType === FieldType.INT) {
          keyStr = String(keyObj.getInt(keyFieldNames[0]));
        } else {
          keyStr = `key_${i}`;
        }
      } else {
        keyStr = `key_${i}`;
      }

      result[keyStr] = RecordStringifier.objectToValue(entry.value);
    }

    return result;
  }
}
