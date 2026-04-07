/**
 * Bit-packed data reader for fixed-length fields
 * Handles non-byte-aligned bit access
 * Based on com.netflix.hollow.core.memory.encoding.FixedLengthElementArray
 */

export class FixedLengthData {
  /**
   * Create a new FixedLengthData
   * @param {Uint8Array} data - The byte array containing bit-packed data
   */
  constructor(data) {
    this.data = data;
    this.view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  }

  /**
   * Get the value of an element at the specified bit index
   * @param {number} bitIndex - The bit index (not byte index)
   * @param {number} bitsPerElement - Number of bits for this element
   * @returns {number} The element value
   */
  getElementValue(bitIndex, bitsPerElement) {
    const mask = bitsPerElement === 64 ? -1 : ((1 << bitsPerElement) - 1);
    return this.getElementValueWithMask(bitIndex, bitsPerElement, mask);
  }

  /**
   * Get the value of an element with a pre-computed mask
   * @param {number} bitIndex - The bit index
   * @param {number} bitsPerElement - Number of bits for this element
   * @param {number} mask - The bit mask to apply
   * @returns {number} The element value
   */
  getElementValueWithMask(bitIndex, bitsPerElement, mask) {
    // For simplicity, just use getLargeElementValue for all reads
    // This matches the 64-bit aligned access pattern that works correctly
    return Number(this.getLargeElementValue(bitIndex, bitsPerElement) & BigInt(mask));
  }

  /*
  const byteIndex = Math.floor(bitIndex / 8);
    const bitOffset = bitIndex % 8;

    // Read 8 bytes as a 64-bit value in little-endian order (matching Java's Unsafe.getLong)
    // This matches Java's behavior: long l = unsafe.getLong(segment, elementByteOffset);
    let value = 0n;
    for (let i = 0; i < 8 && byteIndex + i < this.data.length; i++) {
      const byte = BigInt(this.data[byteIndex + i]);
      value |= (byte << BigInt(i * 8));
    }

    // Shift to remove bits before our element
    value >>= BigInt(bitOffset);

    // Apply mask to get only our bits
    return Number(value & BigInt(mask));
   */

  /**
   * Get a large element value (for elements > 32 bits)
   * @param {number} bitIndex - The bit index
   * @param {number} bitsPerElement - Number of bits for this element
   * @returns {bigint} The element value as BigInt
   */
  getLargeElementValue(bitIndex, bitsPerElement) {
    // Calculate which 64-bit long and bit offset within it
    const whichLong = Math.floor(bitIndex / 64);
    const bitOffsetInLong = bitIndex % 64;

    // Read first long (8 bytes in big-endian order)
    let value = 0n;
    const firstLongByteIndex = whichLong * 8;
    for (let i = 0; i < 8 && firstLongByteIndex + i < this.data.length; i++) {
      value = (value << 8n) | BigInt(this.data[firstLongByteIndex + i]);
    }

    // Shift to remove bits before our element
    value >>= BigInt(bitOffsetInLong);

    const bitsRemaining = 64 - bitOffsetInLong;

    // If we need more bits, read the next long
    if (bitsRemaining < bitsPerElement) {
      const nextLongByteIndex = (whichLong + 1) * 8;
      let nextValue = 0n;
      for (let i = 0; i < 8 && nextLongByteIndex + i < this.data.length; i++) {
        nextValue = (nextValue << 8n) | BigInt(this.data[nextLongByteIndex + i]);
      }

      // We have bitsRemaining bits from the first long (the LOW bits of our value)
      // We need (bitsPerElement - bitsRemaining) more bits from the next long (the HIGH bits)
      const bitsNeeded = bitsPerElement - bitsRemaining;

      // Get the lower bits from the next long - these become the high bits of our result
      const nextMask = (1n << BigInt(bitsNeeded)) - 1n;
      const nextBits = nextValue & nextMask;

      // Combine: first value has the low bits, next value provides the high bits
      value = value | (nextBits << BigInt(bitsRemaining));
    }

    const mask = bitsPerElement === 64 ? -1n : ((1n << BigInt(bitsPerElement)) - 1n);
    return value & mask;
  }

  /**
   * Get the underlying data array
   * @returns {Uint8Array} The data array
   */
  getData() {
    return this.data;
  }

  /**
   * Get the size in bits
   * @returns {number} Size in bits
   */
  getSizeBits() {
    return this.data.length * 8;
  }

  /**
   * Get the size in bytes
   * @returns {number} Size in bytes
   */
  getSizeBytes() {
    return this.data.length;
  }

  /**
   * Read fixed-length data from a BlobInput
   * @param {BlobInput} input - The input stream
   * @param {number} numBits - Number of bits to read
   * @returns {FixedLengthData} The fixed-length data
   */
  static readFrom(input, numBits) {
    const numBytes = Math.ceil(numBits / 8);
    const data = input.readBytes(numBytes);
    return new FixedLengthData(data);
  }
}
