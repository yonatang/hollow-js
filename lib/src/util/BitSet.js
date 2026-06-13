/**
 * BitSet implementation for tracking populated ordinals
 * JavaScript implementation of Java's BitSet
 */

export class BitSet {
  /**
   * Create a new BitSet
   * @param {number} size - Initial size in bits (optional)
   */
  constructor(size = 64) {
    // Store bits in an array of 64-bit integers (matching Java's long[])
    this.words = new BigUint64Array(Math.ceil(size / 64));
  }

  /**
   * Set a bit to 1
   * @param {number} index - The bit index
   */
  set(index) {
    const wordIndex = Math.floor(index / 64);
    const bitIndex = index % 64;

    // Grow array if needed
    if (wordIndex >= this.words.length) {
      const newWords = new BigUint64Array(wordIndex + 1);
      newWords.set(this.words);
      this.words = newWords;
    }

    this.words[wordIndex] |= (1n << BigInt(bitIndex));
  }

  /**
   * Get a bit value
   * @param {number} index - The bit index
   * @returns {boolean} True if bit is set
   */
  get(index) {
    const wordIndex = Math.floor(index / 64);
    const bitIndex = index % 64;

    if (wordIndex >= this.words.length) {
      return false;
    }

    return (this.words[wordIndex] & (1n << BigInt(bitIndex))) !== 0n;
  }

  /**
   * Clear a bit to 0
   * @param {number} index - The bit index
   */
  clear(index) {
    const wordIndex = Math.floor(index / 64);
    const bitIndex = index % 64;

    if (wordIndex < this.words.length) {
      this.words[wordIndex] &= ~(1n << BigInt(bitIndex));
    }
  }

  /**
   * Find the next set bit starting from a given index
   * @param {number} fromIndex - The index to start from (inclusive)
   * @returns {number} The index of the next set bit, or -1 if none
   */
  nextSetBit(fromIndex) {
    let wordIndex = Math.floor(fromIndex / 64);
    let bitIndex = fromIndex % 64;

    if (wordIndex >= this.words.length) {
      return -1;
    }

    // Check remaining bits in the current word
    let word = this.words[wordIndex] & (~0n << BigInt(bitIndex));

    while (true) {
      if (word !== 0n) {
        // Find the lowest set bit using a more reliable method
        let bit = 0;
        while ((word & (1n << BigInt(bit))) === 0n) {
          bit++;
        }
        return wordIndex * 64 + bit;
      }

      // Move to next word
      wordIndex++;
      if (wordIndex >= this.words.length) {
        return -1;
      }

      word = this.words[wordIndex];
    }
  }

  /**
   * Find the previous set bit at or before a given index
   * @param {number} fromIndex - The index to start from (inclusive)
   * @returns {number} The index of the previous set bit, or -1 if none
   */
  previousSetBit(fromIndex) {
    if (fromIndex < 0) {
      return -1;
    }

    let wordIndex = Math.floor(fromIndex / 64);
    let bitIndex = fromIndex % 64;

    if (wordIndex >= this.words.length) {
      wordIndex = this.words.length - 1;
      bitIndex = 63;
    }

    // Mask out bits above fromIndex in the current word
    const mask = bitIndex === 63 ? ~0n : (1n << BigInt(bitIndex + 1)) - 1n;
    let word = this.words[wordIndex] & mask;

    while (true) {
      if (word !== 0n) {
        // Find the highest set bit
        let bit = 63;
        while ((word & (1n << BigInt(bit))) === 0n) {
          bit--;
        }
        return wordIndex * 64 + bit;
      }

      wordIndex--;
      if (wordIndex < 0) {
        return -1;
      }

      word = this.words[wordIndex];
    }
  }

  /**
   * Count the number of set bits
   * @returns {number} The number of set bits
   */
  cardinality() {
    let count = 0;
    for (let i = 0; i < this.words.length; i++) {
      // Count bits in word using Brian Kernighan's algorithm
      let word = this.words[i];
      while (word !== 0n) {
        word &= word - 1n;
        count++;
      }
    }
    return count;
  }

  /**
   * Replace the entire backing store with a pre-built BigUint64Array.
   * @param {BigUint64Array} words
   */
  setWords(words) {
    this.words = words;
  }

  /**
   * Set all bits in the range [fromIndex, toIndex)
   * @param {number} fromIndex - Start index (inclusive)
   * @param {number} toIndex - End index (exclusive)
   */
  setRange(fromIndex, toIndex) {
    for (let i = fromIndex; i < toIndex; i++) {
      this.set(i);
    }
  }

  /**
   * Get the size of the BitSet in bits
   * @returns {number} The size
   */
  size() {
    return this.words.length * 64;
  }
}
