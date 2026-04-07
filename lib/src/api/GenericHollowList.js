/**
 * Generic list accessor
 * Based on com.netflix.hollow.api.objects.generic.GenericHollowList
 */

import { GenericHollowObject } from './GenericHollowObject.js';

/**
 * Generic Hollow list
 */
export class GenericHollowList {
  /**
   * Create a new GenericHollowList
   * @param {HollowReadStateEngine} stateEngine - The state engine
   * @param {string} typeName - The list type name
   * @param {number} ordinal - The list ordinal
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
   * Get the ordinal of this list
   * @returns {number} The ordinal
   */
  getOrdinal() {
    return this.ordinal;
  }

  /**
   * Get the size of the list
   * @returns {number} The size
   */
  size() {
    return this.typeState.size(this.ordinal);
  }

  /**
   * Get an element by index
   * @param {number} index - The index
   * @returns {GenericHollowObject} The element
   */
  get(index) {
    const elementOrdinal = this.typeState.getElementOrdinal(this.ordinal, index);
    const elementType = this.schema.getElementType();
    return new GenericHollowObject(this.stateEngine, elementType, elementOrdinal);
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
