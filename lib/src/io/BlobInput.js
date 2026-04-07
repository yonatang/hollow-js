/**
 * Binary stream reader for Hollow blob data
 * Handles big-endian (Java default) byte order
 * Based on com.netflix.hollow.core.read.HollowBlobInput
 */

export class BlobInput {
  /**
   * Create a new BlobInput
   * @param {ArrayBuffer} buffer - The binary data buffer
   */
  constructor(buffer) {
    this.buffer = buffer;
    this.view = new DataView(buffer);
    this.position = 0;
  }

  /**
   * Read a single byte
   * @returns {number} The byte value (0-255)
   */
  readByte() {
    if (this.position >= this.buffer.byteLength) {
      throw new Error('Unexpected end of input');
    }
    return this.view.getUint8(this.position++);
  }

  /**
   * Read a signed byte
   * @returns {number} The signed byte value (-128 to 127)
   */
  readSignedByte() {
    if (this.position >= this.buffer.byteLength) {
      throw new Error('Unexpected end of input');
    }
    return this.view.getInt8(this.position++);
  }

  /**
   * Read a 16-bit short (big-endian, unsigned)
   * @returns {number} The short value
   */
  readShort() {
    if (this.position + 2 > this.buffer.byteLength) {
      throw new Error('Unexpected end of input');
    }
    const value = this.view.getUint16(this.position, false); // false = big-endian, unsigned
    this.position += 2;
    return value;
  }

  /**
   * Read a 32-bit integer (big-endian)
   * @returns {number} The integer value
   */
  readInt() {
    if (this.position + 4 > this.buffer.byteLength) {
      throw new Error('Unexpected end of input');
    }
    const value = this.view.getInt32(this.position, false); // false = big-endian
    this.position += 4;
    return value;
  }

  /**
   * Read a 64-bit long (big-endian)
   * @returns {bigint} The long value
   */
  readLong() {
    if (this.position + 8 > this.buffer.byteLength) {
      throw new Error('Unexpected end of input');
    }
    const value = this.view.getBigInt64(this.position, false); // false = big-endian
    this.position += 8;
    return value;
  }

  /**
   * Read a 32-bit float (big-endian)
   * @returns {number} The float value
   */
  readFloat() {
    if (this.position + 4 > this.buffer.byteLength) {
      throw new Error('Unexpected end of input');
    }
    const value = this.view.getFloat32(this.position, false); // false = big-endian
    this.position += 4;
    return value;
  }

  /**
   * Read a 64-bit double (big-endian)
   * @returns {number} The double value
   */
  readDouble() {
    if (this.position + 8 > this.buffer.byteLength) {
      throw new Error('Unexpected end of input');
    }
    const value = this.view.getFloat64(this.position, false); // false = big-endian
    this.position += 8;
    return value;
  }

  /**
   * Read a boolean
   * @returns {boolean} The boolean value
   */
  readBoolean() {
    return this.readByte() !== 0;
  }

  /**
   * Read a UTF-8 string
   * @param {number} length - The number of bytes to read
   * @returns {string} The decoded string
   */
  readString(length) {
    if (this.position + length > this.buffer.byteLength) {
      throw new Error(`Unexpected end of input: trying to read ${length} bytes at position ${this.position}, but only ${this.buffer.byteLength - this.position} bytes remaining`);
    }

    const bytes = new Uint8Array(this.buffer, this.position, length);
    this.position += length;

    // Decode UTF-8
    return new TextDecoder('utf-8').decode(bytes);
  }

  /**
   * Read raw bytes
   * @param {number} length - The number of bytes to read
   * @returns {Uint8Array} The byte array
   */
  readBytes(length) {
    if (this.position + length > this.buffer.byteLength) {
      throw new Error('Unexpected end of input');
    }

    const bytes = new Uint8Array(this.buffer, this.position, length);
    this.position += length;
    return bytes;
  }

  /**
   * Skip bytes
   * @param {number} count - Number of bytes to skip
   */
  skip(count) {
    this.position += count;
    if (this.position > this.buffer.byteLength) {
      throw new Error('Skipped past end of input');
    }
  }

  /**
   * Get current position
   * @returns {number} Current position in bytes
   */
  getPosition() {
    return this.position;
  }

  /**
   * Set position
   * @param {number} position - New position
   */
  setPosition(position) {
    if (position < 0 || position > this.buffer.byteLength) {
      throw new Error('Invalid position');
    }
    this.position = position;
  }

  /**
   * Get remaining bytes
   * @returns {number} Number of remaining bytes
   */
  remaining() {
    return this.buffer.byteLength - this.position;
  }

  /**
   * Check if at end of input
   * @returns {boolean} True if at end
   */
  isEOF() {
    return this.position >= this.buffer.byteLength;
  }
}
