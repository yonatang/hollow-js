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
    this.numShards = 1;
    this.shards = [];
  }

  /**
   * Read snapshot data
   * @param {BlobInput} input - The input stream
   * @param {number} numShards - Number of shards
   */
  readSnapshot(input, numShards = 1) {
    if (numShards > 1) {
      this.maxOrdinal = VarInt.readVInt(input);
    }

    this.numShards = numShards;
    this.shards = [];

    for (let shardIndex = 0; shardIndex < numShards; shardIndex++) {
      const shardMaxOrdinal = VarInt.readVInt(input);

      let shardBitsPerRecord = 0;
      const shardBitsPerField = [];
      for (let i = 0; i < this.schema.numFields(); i++) {
        const bitsForField = VarInt.readVInt(input);
        shardBitsPerField[i] = bitsForField;
        shardBitsPerRecord += bitsForField;
      }

      const numLongs = VarInt.readVLong(input);
      const numBytes = Number(numLongs * 8n);
      const fixedData = input.readBytes(numBytes);

      const shardVarLengthData = [];
      for (let i = 0; i < this.schema.numFields(); i++) {
        const numBytesInVarData = VarInt.readVLong(input);
        if (numBytesInVarData > 0n) {
          shardVarLengthData[i] = input.readBytes(Number(numBytesInVarData));
        } else {
          shardVarLengthData[i] = null;
        }
      }

      const shardBitOffsetPerField = [];
      const shardNullValueForField = [];
      for (let i = 0; i < this.schema.numFields(); i++) {
        shardBitOffsetPerField[i] = i === 0 ? 0 : shardBitOffsetPerField[i - 1] + shardBitsPerField[i - 1];
        if (shardBitsPerField[i] >= 32) {
          shardNullValueForField[i] = Number((1n << BigInt(shardBitsPerField[i])) - 1n);
        } else {
          shardNullValueForField[i] = (1 << shardBitsPerField[i]) - 1;
        }
      }

      this.shards.push({
        maxOrdinal: shardMaxOrdinal,
        bitsPerRecord: shardBitsPerRecord,
        bitsPerField: shardBitsPerField,
        bitOffsetPerField: shardBitOffsetPerField,
        nullValueForField: shardNullValueForField,
        fixedLengthData: new FixedLengthData(fixedData),
        varLengthData: shardVarLengthData,
      });

      if (numShards === 1) {
        this.maxOrdinal = shardMaxOrdinal;
      }
    }

    // Expose shard 0's data for backward compatibility
    const s0 = this.shards[0];
    this.bitsPerRecord = s0.bitsPerRecord;
    this.bitsPerField = s0.bitsPerField;
    this.bitOffsetPerField = s0.bitOffsetPerField;
    this.nullValueForField = s0.nullValueForField;
    this.fixedLengthData = s0.fixedLengthData;
    this.varLengthData = s0.varLengthData;

    const numLongs = input.readInt();
    this.populatedOrdinals.setWords(input.readBigUint64ArrayBE(numLongs));
  }

  /**
   * Resolve which shard and intra-shard ordinal to use for a global ordinal
   * @param {number} ordinal - The global ordinal
   * @returns {{shard: object, shardOrdinal: number}}
   */
  _getShardForOrdinal(ordinal) {
    const shardIndex = ordinal % this.numShards;
    const shardOrdinal = Math.floor(ordinal / this.numShards);
    return {shard: this.shards[shardIndex], shardOrdinal};
  }

  /**
   * Read an INT field value
   * @param {number} ordinal - The record ordinal
   * @param {number} fieldIndex - The field index
   * @returns {number} The int value, or null
   */
  readInt(ordinal, fieldIndex) {
    const {shard, shardOrdinal} = this._getShardForOrdinal(ordinal);
    const bitIndex = shardOrdinal * shard.bitsPerRecord + shard.bitOffsetPerField[fieldIndex];
    const value = shard.fixedLengthData.getElementValue(bitIndex, shard.bitsPerField[fieldIndex]);

    if (value === shard.nullValueForField[fieldIndex]) return null;
    return this.zigZagDecode(value);
  }

  /**
   * Read a LONG field value
   * @param {number} ordinal - The record ordinal
   * @param {number} fieldIndex - The field index
   * @returns {bigint} The long value, or null
   */
  readLong(ordinal, fieldIndex) {
    const {shard, shardOrdinal} = this._getShardForOrdinal(ordinal);
    const bitIndex = shardOrdinal * shard.bitsPerRecord + shard.bitOffsetPerField[fieldIndex];
    const value = shard.fixedLengthData.getLargeElementValue(bitIndex, shard.bitsPerField[fieldIndex]);

    if (value === BigInt(shard.nullValueForField[fieldIndex])) return null;
    return this.zigZagDecodeLong(value);
  }

  /**
   * Read a BOOLEAN field value
   * @param {number} ordinal - The record ordinal
   * @param {number} fieldIndex - The field index
   * @returns {boolean} The boolean value, or null
   */
  readBoolean(ordinal, fieldIndex) {
    const {shard, shardOrdinal} = this._getShardForOrdinal(ordinal);
    const bitIndex = shardOrdinal * shard.bitsPerRecord + shard.bitOffsetPerField[fieldIndex];
    const value = shard.fixedLengthData.getElementValue(bitIndex, shard.bitsPerField[fieldIndex]);

    if (value === shard.nullValueForField[fieldIndex]) return null;
    return value === 1;
  }

  /**
   * Read a FLOAT field value
   * @param {number} ordinal - The record ordinal
   * @param {number} fieldIndex - The field index
   * @returns {number} The float value, or null
   */
  readFloat(ordinal, fieldIndex) {
    const {shard, shardOrdinal} = this._getShardForOrdinal(ordinal);
    const bitIndex = shardOrdinal * shard.bitsPerRecord + shard.bitOffsetPerField[fieldIndex];
    const intBits = Number(shard.fixedLengthData.getLargeElementValue(bitIndex, shard.bitsPerField[fieldIndex]));

    // NULL_FLOAT_BITS = Float.floatToIntBits(Float.NaN) + 1 = 0x7FC00001
    const NULL_FLOAT_BITS = 0x7FC00001;
    if (intBits === NULL_FLOAT_BITS) return null;

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
    const {shard, shardOrdinal} = this._getShardForOrdinal(ordinal);
    const bitIndex = shardOrdinal * shard.bitsPerRecord + shard.bitOffsetPerField[fieldIndex];
    const longBits = shard.fixedLengthData.getLargeElementValue(bitIndex, shard.bitsPerField[fieldIndex]);

    // NULL_DOUBLE_BITS = Double.doubleToLongBits(Double.NaN) + 1 = 0x7FF8000000000001
    const NULL_DOUBLE_BITS = 0x7FF8000000000001n;
    if (longBits === NULL_DOUBLE_BITS) return null;

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
    const {shard, shardOrdinal} = this._getShardForOrdinal(ordinal);
    const bitIndex = shardOrdinal * shard.bitsPerRecord + shard.bitOffsetPerField[fieldIndex];
    const value = shard.fixedLengthData.getElementValue(bitIndex, shard.bitsPerField[fieldIndex]);

    if (value === shard.nullValueForField[fieldIndex]) return -1;
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
    const {shard, shardOrdinal} = this._getShardForOrdinal(ordinal);
    const varData = shard.varLengthData[fieldIndex];
    if (!varData) return null;

    const bitIndex = shardOrdinal * shard.bitsPerRecord + shard.bitOffsetPerField[fieldIndex];
    const endByte = shard.fixedLengthData.getElementValue(bitIndex, shard.bitsPerField[fieldIndex]);
    let startByte = shardOrdinal !== 0
      ? shard.fixedLengthData.getElementValue(bitIndex - shard.bitsPerRecord, shard.bitsPerField[fieldIndex])
      : 0;

    // High bit of the field value indicates null
    const nullBit = 1 << (shard.bitsPerField[fieldIndex] - 1);
    if ((endByte & nullBit) !== 0) return null;

    startByte &= nullBit - 1;

    const length = endByte - startByte;
    if (length === 0) return isString ? '' : new Uint8Array(0);

    const bytes = varData.slice(startByte, startByte + length);
    return isString ? this.decodeVarIntString(bytes) : bytes;
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

    return String.fromCharCode(...chars);
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
