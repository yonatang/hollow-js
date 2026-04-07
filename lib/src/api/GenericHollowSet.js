/**
 * Generic set accessor
 * Based on com.netflix.hollow.api.objects.generic.GenericHollowSet
 */

import { GenericHollowObject } from './GenericHollowObject.js';

/**
 * Generic Hollow set
 */
export class GenericHollowSet {
  /**
   * Create a new GenericHollowSet
   * @param {HollowReadStateEngine} stateEngine - The state engine
   * @param {string} typeName - The set type name
   * @param {number} ordinal - The set ordinal
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
   * Get the ordinal of this set
   * @returns {number} The ordinal
   */
  getOrdinal() {
    return this.ordinal;
  }

  /**
   * Get the size of the set
   * @returns {number} The size
   */
  size() {
    return this.typeState.size(this.ordinal);
  }

  /**
   * Get an element by index
   * @param {number} index - The logical index (0-based, skipping empty buckets)
   * @returns {GenericHollowObject} The element
   */
  get(index) {
    // Sets use hash-based storage, so we need to skip empty buckets
    const startBucket = this.typeState.getSetStartBucket(this.ordinal);
    const setSize = this.size();
    const emptyOrdinal = (1 << this.typeState.bitsPerElement) - 1;

    let logicalIndex = 0;
    let bucketIndex = startBucket;

    // Scan buckets until we find the index-th non-empty element
    while (logicalIndex <= index && bucketIndex < startBucket + setSize * 2) {
      const bitIndex = bucketIndex * this.typeState.bitsPerElement;
      const elementOrdinal = this.typeState.elementData.getElementValue(bitIndex, this.typeState.bitsPerElement);

      if (elementOrdinal !== emptyOrdinal) {
        if (logicalIndex === index) {
          const elementType = this.schema.getElementType();
          return new GenericHollowObject(this.stateEngine, elementType, elementOrdinal);
        }
        logicalIndex++;
      }
      bucketIndex++;
    }

    throw new Error(`Index ${index} out of bounds for set of size ${setSize}`);
  }

  /**
   * Iterate over all elements
   * @returns {Iterator<GenericHollowObject>} Iterator
   */
  *[Symbol.iterator]() {
    const size = this.size();
    for (let i = 0; i < size; i++) {
      yield this.get(i);
    }
  }

  /**
   * Convert to array
   * @returns {GenericHollowObject[]} Array of elements
   */
  toArray() {
    return Array.from(this);
  }
}
