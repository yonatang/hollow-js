/**
 * OBJECT type read state
 * Based on com.netflix.hollow.core.read.engine.object.HollowObjectTypeReadState
 *
 * Simplified implementation for snapshot reading
 */

import {HollowTypeReadState} from './HollowTypeReadState.js';
import {VarInt} from '../io/VarInt.js';
import {FixedLengthData} from '../io/FixedLengthData.js';

/**
 * OBJECT type read state
 */
export class HollowObjectTypeReadState extends HollowTypeReadState {
  /**
   * Create a new OBJECT type read state
   * @param {HollowObjectSchema} schema - The schema
   */
  constructor(schema) {
    super(schema);
    this.fixedLengthData = null;
    this.varLengthData = [];
    this.bitsPerField = [];
    this.bitOffsetPerField = [];
    this.nullValueForField = [];
    this.bitsPerRecord = 0;
  }

  /**
   * Read snapshot data
   * @param {BlobInput} input - The input stream
   * @param {number} numShards - Number of shards (simplified: assumes 1)
   */
  readSnapshot(input, numShards = 1) {
    //  When numShards > 1, read global max ordinal first
    if (numShards > 1) {
      this.maxOrdinal = VarInt.readVInt(input);
    }

    // For now, only support single shard - read first shard and skip the rest
    for (let shardIndex = 0; shardIndex < numShards; shardIndex++) {
      // Read max ordinal for this shard
      const shardMaxOrdinal = VarInt.readVInt(input);

      // Read field statistics (bits per field)
      let shardBitsPerRecord = 0;
      const shardBitsPerField = [];
      for (let i = 0; i < this.schema.numFields(); i++) {
        const bitsForField = VarInt.readVInt(input);
        shardBitsPerField[i] = bitsForField;
        shardBitsPerRecord += bitsForField;
      }

      // Read fixed-length data (bit-packed fields)
      // First read numLongs (size of the data in 64-bit longs)
      const numLongs = VarInt.readVLong(input);
      const numBytes = Number(numLongs * 8n);
      const fixedData = input.readBytes(numBytes);

      // Read variable-length data (strings, bytes)
      const shardVarLengthData = [];
      for (let i = 0; i < this.schema.numFields(); i++) {
        const numBytesInVarData = VarInt.readVLong(input);
        if (numBytesInVarData > 0n) {
          const varData = input.readBytes(Number(numBytesInVarData));
          shardVarLengthData[i] = varData;
        } else {
          shardVarLengthData[i] = null;
        }
      }

      // Only use data from the first shard
      if (shardIndex === 0) {
        this.bitsPerRecord = shardBitsPerRecord;
        this.bitsPerField = shardBitsPerField;
        this.bitOffsetPerField = [];
        for (let i = 0; i < this.schema.numFields(); i++) {
          this.bitOffsetPerField[i] = i === 0 ? 0 : this.bitOffsetPerField[i - 1] + this.bitsPerField[i - 1];

          // Calculate null value (all bits set)
          // For fields >= 32 bits, use BigInt to avoid overflow
          if (this.bitsPerField[i] >= 32) {
            this.nullValueForField[i] = Number((1n << BigInt(this.bitsPerField[i])) - 1n);
          } else {
            this.nullValueForField[i] = (1 << this.bitsPerField[i]) - 1;
          }
        }
        this.fixedLengthData = new FixedLengthData(fixedData);
        this.varLengthData = shardVarLengthData;

        // If single shard, set max ordinal from shard
        if (numShards === 1) {
          this.maxOrdinal = shardMaxOrdinal;
        }
      }
    }

    // Read populated ordinals from stream
    const numLongs = input.readInt();

    // Read the populated ordinals bitset and update our BitSet
    for (let i = 0; i < numLongs; i++) {
      const longValue = input.readLong();
      const baseOrdinal = i * 64;

      // Check each bit in the long value
      for (let bit = 0; bit < 64; bit++) {
        const mask = 1n << BigInt(bit);
        if ((longValue & mask) !== 0n) {
          this.populatedOrdinals.set(baseOrdinal + bit);
        }
      }
    }
  }

  /**
   * Read an INT field value
   * @param {number} ordinal - The record ordinal
   * @param {number} fieldIndex - The field index
   * @returns {number} The int value, or null
   */
  readInt(ordinal, fieldIndex) {
    const bitIndex = ordinal * this.bitsPerRecord + this.bitOffsetPerField[fieldIndex];
    const value = this.fixedLengthData.getElementValue(bitIndex, this.bitsPerField[fieldIndex]);

    // Check for null
    if (value === this.nullValueForField[fieldIndex]) {
      return null;
    }

    // Zig-zag decode
    return this.zigZagDecode(value);
  }

  /**
   * Read a LONG field value
   * @param {number} ordinal - The record ordinal
   * @param {number} fieldIndex - The field index
   * @returns {bigint} The long value, or null
   */
  readLong(ordinal, fieldIndex) {
    const bitIndex = ordinal * this.bitsPerRecord + this.bitOffsetPerField[fieldIndex];
    const value = this.fixedLengthData.getLargeElementValue(bitIndex, this.bitsPerField[fieldIndex]);

    // Check for null
    if (value === BigInt(this.nullValueForField[fieldIndex])) {
      return null;
    }

    // Zig-zag decode
    return this.zigZagDecodeLong(value);
  }

  /**
   * Read a BOOLEAN field value
   * @param {number} ordinal - The record ordinal
   * @param {number} fieldIndex - The field index
   * @returns {boolean} The boolean value, or null
   */
  readBoolean(ordinal, fieldIndex) {
    const bitIndex = ordinal * this.bitsPerRecord + this.bitOffsetPerField[fieldIndex];
    const value = this.fixedLengthData.getElementValue(bitIndex, this.bitsPerField[fieldIndex]);

    if (value === this.nullValueForField[fieldIndex]) return null;
    return value === 1;
  }

  /**
   * Read a FLOAT field value
   * @param {number} ordinal - The record ordinal
   * @param {number} fieldIndex - The field index
   * @returns {number} The float value, or null
   */
  readFloat(ordinal, fieldIndex) {
    const bitIndex = ordinal * this.bitsPerRecord + this.bitOffsetPerField[fieldIndex];
    // Use getLargeElementValue instead of getElementValue - it handles bit-packing correctly
    const intBits = Number(this.fixedLengthData.getLargeElementValue(bitIndex, this.bitsPerField[fieldIndex]));

    // NULL_FLOAT_BITS = Float.floatToIntBits(Float.NaN) + 1
    // In JavaScript, NaN has bit pattern 0x7FC00000, so NULL_FLOAT_BITS is 0x7FC00001
    const NULL_FLOAT_BITS = 0x7FC00001;
    if (intBits === NULL_FLOAT_BITS) {
      return null;
    }

    // Convert int bits to float
    const buffer = new ArrayBuffer(4);
    const intView = new Uint32Array(buffer);
    const floatView = new Float32Array(buffer);
    intView[0] = intBits;
    return floatView[0];
  }

  /**
   * Read a DOUBLE field value
   * @param {number} ordinal - The record ordinal
   * @param {number} fieldIndex - The field index
   * @returns {number} The double value, or null
   */
  readDouble(ordinal, fieldIndex) {
    const bitIndex = ordinal * this.bitsPerRecord + this.bitOffsetPerField[fieldIndex];
    const longBits = this.fixedLengthData.getLargeElementValue(bitIndex, this.bitsPerField[fieldIndex]);

    // NULL_DOUBLE_BITS = Double.doubleToLongBits(Double.NaN) + 1
    // In JavaScript, NaN as double has bit pattern 0x7FF8000000000000, so NULL_DOUBLE_BITS is 0x7FF8000000000001
    const NULL_DOUBLE_BITS = 0x7FF8000000000001n;
    if (longBits === NULL_DOUBLE_BITS) {
      return null;
    }

    // Convert long bits to double
    const buffer = new ArrayBuffer(8);
    const bigIntView = new BigUint64Array(buffer);
    const doubleView = new Float64Array(buffer);
    bigIntView[0] = longBits;
    return doubleView[0];
  }

  /**
   * Read a STRING field value
   * @param {number} ordinal - The record ordinal
   * @param {number} fieldIndex - The field index
   * @returns {string} The string value, or null
   */
  readString(ordinal, fieldIndex) {
    return this.readVarLengthField(ordinal, fieldIndex, true);
  }

  /**
   * Read a BYTES field value
   * @param {number} ordinal - The record ordinal
   * @param {number} fieldIndex - The field index
   * @returns {Uint8Array} The bytes value, or null
   */
  readBytes(ordinal, fieldIndex) {
    return this.readVarLengthField(ordinal, fieldIndex, false);
  }

  /**
   * Read a REFERENCE field value (ordinal of referenced record)
   * @param {number} ordinal - The record ordinal
   * @param {number} fieldIndex - The field index
   * @returns {number} The referenced record ordinal, or -1 for null
   */
  readOrdinal(ordinal, fieldIndex) {
    const bitIndex = ordinal * this.bitsPerRecord + this.bitOffsetPerField[fieldIndex];
    const value = this.fixedLengthData.getElementValue(bitIndex, this.bitsPerField[fieldIndex]);

    // Check for null
    if (value === this.nullValueForField[fieldIndex]) {
      return -1; // ORDINAL_NONE
    }

    return value;
  }

  /**
   * Read variable-length field (STRING or BYTES)
   * @param {number} ordinal - The record ordinal
   * @param {number} fieldIndex - The field index
   * @param {boolean} isString - True for STRING, false for BYTES
   * @returns {string|Uint8Array} The value, or null
   */
  readVarLengthField(ordinal, fieldIndex, isString) {
    const varData = this.varLengthData[fieldIndex];
    if (!varData) {
      return null;
    }

    // Read the pointer from fixed-length data
    const bitIndex = ordinal * this.bitsPerRecord + this.bitOffsetPerField[fieldIndex];
    const endByte = this.fixedLengthData.getElementValue(bitIndex, this.bitsPerField[fieldIndex]);
    let startByte = ordinal !== 0 ? this.fixedLengthData.getElementValue(bitIndex - this.bitsPerRecord, this.bitsPerField[fieldIndex]) : 0;

    if ((endByte & (1 << this.bitsPerRecord - 1)) !== 0) return null;

    startByte &= (1 << this.bitsPerRecord - 1) - 1;

    const length = (endByte - startByte);

    if (length === 0) {
      return isString ? '' : new Uint8Array(0);
    }

    const bytes = varData.slice(startByte, startByte + length);

    if (isString) {
      // Strings are encoded as VarInts representing Unicode codepoints, not UTF-8
      return this.decodeVarIntString(bytes);
    } else {
      return bytes;
    }
  }

  /**
   * Decode a VarInt-encoded string
   * Hollow stores strings as a sequence of VarInts where each VarInt is a Unicode codepoint
   * @param {Uint8Array} bytes - The VarInt-encoded bytes
   * @returns {string} The decoded string
   */
  decodeVarIntString(bytes) {
    const chars = [];
    let i = 0;

    // First loop: handle single-byte characters (0-127)
    while (i < bytes.length && (bytes[i] & 0x80) === 0) {
      chars.push(bytes[i]);
      i++;
    }

    // Second loop: handle multi-byte VarInt characters
    let charValue = 0;
    while (i < bytes.length) {
      const b = bytes[i++];
      charValue = (charValue << 7) | (b & 0x7F);

      // If high bit is NOT set, this is the last byte of the VarInt
      if ((b & 0x80) === 0) {
        chars.push(charValue);
        charValue = 0;
      }
    }

    // Convert codepoints to string
    return String.fromCharCode(...chars);
  }

  /**
   * Read a VarInt from a byte array
   * @param {Uint8Array} bytes - The byte array
   * @param {number} position - The position
   * @returns {number} The int value
   */
  readVarIntFromBytes(bytes, position) {
    let b = bytes[position++];
    if (b === 0x80) {
      throw new Error('Attempting to read null value as int');
    }

    let value = b & 0x7F;
    while ((b & 0x80) !== 0) {
      b = bytes[position++];
      value <<= 7;
      value |= (b & 0x7F);
    }

    return value;
  }

  /**
   * Zig-zag decode an int
   * @param {number} encoded - The encoded value
   * @returns {number} The decoded value
   */
  zigZagDecode(encoded) {
    return (encoded >>> 1) ^ -(encoded & 1);
  }

  /**
   * Zig-zag decode a long
   * @param {bigint} encoded - The encoded value
   * @returns {bigint} The decoded value
   */
  zigZagDecodeLong(encoded) {
    return (encoded >> 1n) ^ -(encoded & 1n);
  }
}
