/**
 * Base class for type read states
 * Based on com.netflix.hollow.core.read.engine.HollowTypeReadState
 */

import { BitSet } from '../util/BitSet.js';

/**
 * Base class for all type read states
 */
export class HollowTypeReadState {
  /**
   * Create a new type read state
   * @param {HollowSchema} schema - The schema
   */
  constructor(schema) {
    this.schema = schema;
    this.maxOrdinal = -1;
    this.populatedOrdinals = new BitSet();
  }

  /**
   * Get the schema
   * @returns {HollowSchema} The schema
   */
  getSchema() {
    return this.schema;
  }

  /**
   * Get max ordinal
   * @returns {number} The maximum ordinal
   */
  getMaxOrdinal() {
    return this.maxOrdinal;
  }

  /**
   * Get populated ordinals
   * @returns {BitSet} BitSet of populated ordinals
   */
  getPopulatedOrdinals() {
    return this.populatedOrdinals;
  }

  /**
   * Read snapshot data from input
   * @param {BlobInput} input - The input stream
   * @param {number} numShards - Number of shards
   */
  readSnapshot(input, numShards) {
    throw new Error('readSnapshot must be implemented by subclass');
  }
}
