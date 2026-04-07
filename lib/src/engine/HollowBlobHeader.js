/**
 * Hollow blob header parser
 * Based on com.netflix.hollow.core.read.engine.HollowBlobHeaderReader
 */

import { SchemaReader } from '../schema/SchemaReader.js';
import { VarInt } from '../io/VarInt.js';

/**
 * Blob header
 */
export class HollowBlobHeader {
  /**
   * Create a new blob header
   */
  constructor() {
    this.version = 0;
    this.originRandomizedTag = 0n;
    this.destinationRandomizedTag = 0n;
    this.schemas = [];
    this.headerTags = new Map();
  }

  /**
   * Read header from input
   * @param {BlobInput} input - The input stream
   * @returns {HollowBlobHeader} The header
   */
  static readHeader(input) {
    const header = new HollowBlobHeader();

    // Read version
    header.version = input.readInt();

    // Check version
    if (header.version !== 1030) {
      throw new Error(`Unsupported blob version: ${header.version}. Expected 1030`);
    }

    // Read randomized tags
    header.originRandomizedTag = input.readLong();
    header.destinationRandomizedTag = input.readLong();

    // Read "oldBytesToSkip" - pre v2.2.0 envelope (includes all schema data)
    const oldBytesToSkip = VarInt.readVInt(input);

    if (oldBytesToSkip !== 0) {
      // Read number of schemas
      const numSchemas = VarInt.readVInt(input);

      // Read schemas
      for (let i = 0; i < numSchemas; i++) {
        const schema = SchemaReader.readFrom(input);
        header.schemas.push(schema);
      }

      // Skip forward compatibility bytes
      const forwardCompatibilityBytesToSkip = VarInt.readVInt(input);
      if (forwardCompatibilityBytesToSkip > 0) {
        for (let i = 0; i < forwardCompatibilityBytesToSkip; i++) {
          input.readByte();
        }
      }
    }

    // Read header tags (count is SHORT)
    const numHeaderTags = input.readShort();
    for (let i = 0; i < numHeaderTags; i++) {
      let len = input.readShort();
      const key = input.readString(len);

      len = input.readShort();
      const value = input.readString(len);

      header.headerTags.set(key, value);
    }

    return header;
  }

  /**
   * Get schemas
   * @returns {HollowSchema[]} The schemas
   */
  getSchemas() {
    return this.schemas;
  }

  /**
   * Get header tags
   * @returns {Map<string, string>} The header tags
   */
  getHeaderTags() {
    return this.headerTags;
  }
}
