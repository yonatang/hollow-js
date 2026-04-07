/**
 * Variable-byte integer encoding and decoding logic
 * Based on com.netflix.hollow.core.memory.encoding.VarInt
 */

export class VarInt {
  /**
   * Read a variable length integer from the BlobInput
   * @param {BlobInput} input - The input stream to read from
   * @returns {number} The decoded integer value
   */
  static readVInt(input) {
    let b = input.readByte();

    if (b === 0x80) {
      throw new Error('Attempting to read null value as int');
    }

    let value = b & 0x7F;
    while ((b & 0x80) !== 0) {
      b = input.readByte();
      value <<= 7;
      value |= (b & 0x7F);
    }

    return value;
  }

  /**
   * Read a variable length long from the BlobInput
   * @param {BlobInput} input - The input stream to read from
   * @returns {bigint} The decoded long value
   */
  static readVLong(input) {
    let b = input.readByte();

    if (b === 0x80) {
      throw new Error('Attempting to read null value as long');
    }

    let value = BigInt(b & 0x7F);
    while ((b & 0x80) !== 0) {
      b = input.readByte();
      value = (value << 7n) | BigInt(b & 0x7F);
    }

    return value;
  }

  /**
   * Check if value at current position is null
   * @param {BlobInput} input - The input stream
   * @returns {boolean} True if the value is null
   */
  static readVNull(input) {
    const b = input.readByte();
    return b === 0x80;
  }

  /**
   * Determine the size (in bytes) of the specified value when encoded as VarInt
   * @param {number} value - The int value
   * @returns {number} The size in bytes
   */
  static sizeOfVInt(value) {
    if (value < 0) return 5;
    if (value < 0x80) return 1;
    if (value < 0x4000) return 2;
    if (value < 0x200000) return 3;
    if (value < 0x10000000) return 4;
    return 5;
  }

  /**
   * Determine the size (in bytes) of the specified value when encoded as VarLong
   * @param {bigint} value - The long value
   * @returns {number} The size in bytes
   */
  static sizeOfVLong(value) {
    if (value < 0n) return 10;
    if (value < 0x80n) return 1;
    if (value < 0x4000n) return 2;
    if (value < 0x200000n) return 3;
    if (value < 0x10000000n) return 4;
    if (value < 0x800000000n) return 5;
    if (value < 0x40000000000n) return 6;
    if (value < 0x2000000000000n) return 7;
    if (value < 0x100000000000000n) return 8;
    return 9;
  }
}
