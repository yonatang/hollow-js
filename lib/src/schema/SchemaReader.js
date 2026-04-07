/**
 * Schema reader - factory methods for reading schemas
 * Separate from HollowSchema to avoid circular dependencies
 */

import { VarInt } from '../io/VarInt.js';
import { SchemaType } from './HollowSchema.js';
import { HollowObjectSchema } from './HollowObjectSchema.js';
import { HollowListSchema } from './HollowListSchema.js';
import { HollowSetSchema } from './HollowSetSchema.js';
import { HollowMapSchema } from './HollowMapSchema.js';

export class SchemaReader {
  /**
   * Read a schema from a BlobInput
   * @param {BlobInput} input - The input stream
   * @returns {HollowSchema} The schema
   */
  static readFrom(input) {
    const schemaTypeId = input.readByte();
    const schemaName = input.readString(input.readShort());

    const schemaType = SchemaType.fromTypeId(schemaTypeId);
    const hasKey = SchemaType.hasKey(schemaTypeId);

    switch (schemaType) {
      case SchemaType.OBJECT:
        return SchemaReader.readObjectSchemaFrom(input, schemaName, hasKey);
      case SchemaType.LIST:
        return SchemaReader.readListSchemaFrom(input, schemaName);
      case SchemaType.SET:
        return SchemaReader.readSetSchemaFrom(input, schemaName, hasKey);
      case SchemaType.MAP:
        return SchemaReader.readMapSchemaFrom(input, schemaName, hasKey);
      default:
        throw new Error(`Unknown schema type: ${schemaType}`);
    }
  }

  static readObjectSchemaFrom(input, schemaName, hasPrimaryKey) {
    let keyFieldPaths = null;
    if (hasPrimaryKey) {
      const numKeyFields = VarInt.readVInt(input);
      keyFieldPaths = [];
      for (let i = 0; i < numKeyFields; i++) {
        const len = input.readShort();
        keyFieldPaths.push(input.readString(len));
      }
    }

    const numFields = input.readShort();
    const schema = new HollowObjectSchema(schemaName, numFields, keyFieldPaths);

    for (let i = 0; i < numFields; i++) {
      let len = input.readShort();
      const fieldName = input.readString(len);

      len = input.readShort();
      const fieldType = input.readString(len);

      let referencedType = null;
      if (fieldType === 'REFERENCE') {
        len = input.readShort();
        referencedType = input.readString(len);
      }

      schema.addField(fieldName, fieldType, referencedType);
    }

    return schema;
  }

  static readListSchemaFrom(input, schemaName) {
    const len = input.readShort();
    const elementType = input.readString(len);
    return new HollowListSchema(schemaName, elementType);
  }

  static readSetSchemaFrom(input, schemaName, hasHashKey) {
    let len = input.readShort();
    const elementType = input.readString(len);

    let hashKeyFields = null;
    if (hasHashKey) {
      const numFields = VarInt.readVInt(input);
      hashKeyFields = [];
      for (let i = 0; i < numFields; i++) {
        len = input.readShort();
        hashKeyFields.push(input.readString(len));
      }
    }

    return new HollowSetSchema(schemaName, elementType, hashKeyFields);
  }

  static readMapSchemaFrom(input, schemaName, hasHashKey) {
    let len = input.readShort();
    const keyType = input.readString(len);

    len = input.readShort();
    const valueType = input.readString(len);

    let hashKeyFields = null;
    if (hasHashKey) {
      const numFields = VarInt.readVInt(input);
      hashKeyFields = [];
      for (let i = 0; i < numFields; i++) {
        len = input.readShort();
        hashKeyFields.push(input.readString(len));
      }
    }

    return new HollowMapSchema(schemaName, keyType, valueType, hashKeyFields);
  }
}
