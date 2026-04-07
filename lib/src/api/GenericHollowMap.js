/**
 * Generic map accessor
 * Based on com.netflix.hollow.api.objects.generic.GenericHollowMap
 */

import { GenericHollowObject } from './GenericHollowObject.js';

/**
 * Generic Hollow map
 */
export class GenericHollowMap {
  /**
   * Create a new GenericHollowMap
   * @param {HollowReadStateEngine} stateEngine - The state engine
   * @param {string} typeName - The map type name
   * @param {number} ordinal - The map ordinal
   */
  constructor(stateEngine, typeName, ordinal) {
    this.stateEngine = stateEngine;
    this.typeName = typeName;
    this.ordinal = ordinal;
    this.typeState = stateEngine.getTypeState(typeName);

    if (!this.typeState) {
      throw new Error(`Type not found: ${typeName}`);
    }

    this.schema = this.typeState.getSchema();
  }

  /**
   * Get the type name
   * @returns {string} The type name
   */
  getTypeName() {
    return this.typeName;
  }

  /**
   * Get the ordinal of this map
   * @returns {number} The ordinal
   */
  getOrdinal() {
    return this.ordinal;
  }

  /**
   * Get the size of the map
   * @returns {number} The size
   */
  size() {
    return this.typeState.size(this.ordinal);
  }

  /**
   * Get a key by index
   * @param {number} index - The logical index (0-based, skipping empty buckets)
   * @returns {GenericHollowObject} The key
   */
  getKey(index) {
    const entry = this.findEntryByIndex(index);
    const keyType = this.schema.getKeyType();
    return new GenericHollowObject(this.stateEngine, keyType, entry.keyOrdinal);
  }

  /**
   * Get a value by index
   * @param {number} index - The logical index (0-based, skipping empty buckets)
   * @returns {GenericHollowObject} The value
   */
  getValue(index) {
    const entry = this.findEntryByIndex(index);
    const valueType = this.schema.getValueType();
    return new GenericHollowObject(this.stateEngine, valueType, entry.valueOrdinal);
  }

  /**
   * Get an entry by index
   * @param {number} index - The logical index (0-based, skipping empty buckets)
   * @returns {{key: GenericHollowObject, value: GenericHollowObject}} The entry
   */
  getEntry(index) {
    const entry = this.findEntryByIndex(index);
    const keyType = this.schema.getKeyType();
    const valueType = this.schema.getValueType();
    return {
      key: new GenericHollowObject(this.stateEngine, keyType, entry.keyOrdinal),
      value: new GenericHollowObject(this.stateEngine, valueType, entry.valueOrdinal)
    };
  }

  /**
   * Find the bucket index and ordinals for a logical index
   * @param {number} index - The logical index
   * @returns {{keyOrdinal: number, valueOrdinal: number}} The entry ordinals
   * @private
   */
  findEntryByIndex(index) {
    // Maps use hash-based storage, so we need to skip empty buckets
    const startBucket = this.typeState.getMapStartBucket(this.ordinal);
    const mapSize = this.size();
    const emptyKeyOrdinal = (1 << this.typeState.bitsPerKeyElement) - 1;

    let logicalIndex = 0;
    let bucketIndex = startBucket;

    // Scan buckets until we find the index-th non-empty entry
    while (logicalIndex <= index && bucketIndex < startBucket + mapSize * 2) {
      const bitIndex = bucketIndex * this.typeState.bitsPerMapEntry;
      const keyOrdinal = this.typeState.entryData.getElementValue(bitIndex, this.typeState.bitsPerKeyElement);
      const valueOrdinal = this.typeState.entryData.getElementValue(bitIndex + this.typeState.bitsPerKeyElement, this.typeState.bitsPerValueElement);

      if (keyOrdinal !== emptyKeyOrdinal) {
        if (logicalIndex === index) {
          return { keyOrdinal, valueOrdinal };
        }
        logicalIndex++;
      }
      bucketIndex++;
    }

    throw new Error(`Index ${index} out of bounds for map of size ${mapSize}`);
  }

  /**
   * Iterate over all entries
   * @returns {Iterator<{key: GenericHollowObject, value: GenericHollowObject}>} Iterator
   */
  *entries() {
    const size = this.size();
    for (let i = 0; i < size; i++) {
      yield this.getEntry(i);
    }
  }

  /**
   * Iterate over all entries (default iterator)
   * @returns {Iterator<{key: GenericHollowObject, value: GenericHollowObject}>} Iterator
   */
  *[Symbol.iterator]() {
    yield* this.entries();
  }

  /**
   * Convert to array of entries
   * @returns {Array<{key: GenericHollowObject, value: GenericHollowObject}>} Array of entries
   */
  toArray() {
    return Array.from(this.entries());
  }
}
