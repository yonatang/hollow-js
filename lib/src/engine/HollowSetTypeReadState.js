/**
 * SET type read state
 * Based on com.netflix.hollow.core.read.engine.set.HollowSetTypeReadState
 *
 * Simplified implementation for snapshot reading
 */

import { HollowTypeReadState } from './HollowTypeReadState.js';
import { VarInt } from '../io/VarInt.js';
import { FixedLengthData } from '../io/FixedLengthData.js';

/**
 * SET type read state
 */
export class HollowSetTypeReadState extends HollowTypeReadState {
  /**
   * Create a new SET type read state
   * @param {HollowSetSchema} schema - The schema
   */
  constructor(schema) {
    super(schema);
    this.setPointerAndSizeData = null;
    this.elementData = null;
    this.bitsPerSetPointer = 0;
    this.bitsPerSetSizeValue = 0;
    this.bitsPerFixedLengthSetPortion = 0;
    this.bitsPerElement = 0;
    this.totalNumberOfBuckets = 0;
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
      const bitsPerSetPointer = VarInt.readVInt(input);
      const bitsPerSetSizeValue = VarInt.readVInt(input);
      const bitsPerElement = VarInt.readVInt(input);
      const totalNumberOfBuckets = Number(VarInt.readVLong(input));

      const pointerNumLongs = VarInt.readVLong(input);
      const pointerData = input.readBytes(Number(pointerNumLongs * 8n));

      const elementNumLongs = VarInt.readVLong(input);
      const elementData = input.readBytes(Number(elementNumLongs * 8n));

      this.shards.push({
        maxOrdinal: shardMaxOrdinal,
        bitsPerSetPointer,
        bitsPerSetSizeValue,
        bitsPerFixedLengthSetPortion: bitsPerSetPointer + bitsPerSetSizeValue,
        bitsPerElement,
        totalNumberOfBuckets,
        setPointerAndSizeData: new FixedLengthData(pointerData),
        elementData: new FixedLengthData(elementData),
      });

      if (numShards === 1) this.maxOrdinal = shardMaxOrdinal;
    }

    // Expose shard 0's data for backward compatibility
    const s0 = this.shards[0];
    this.bitsPerSetPointer = s0.bitsPerSetPointer;
    this.bitsPerSetSizeValue = s0.bitsPerSetSizeValue;
    this.bitsPerFixedLengthSetPortion = s0.bitsPerFixedLengthSetPortion;
    this.bitsPerElement = s0.bitsPerElement;
    this.totalNumberOfBuckets = s0.totalNumberOfBuckets;
    this.setPointerAndSizeData = s0.setPointerAndSizeData;
    this.elementData = s0.elementData;

    const numLongs = input.readInt();
    this.populatedOrdinals.setWords(input.readBigUint64ArrayBE(numLongs));
  }

  /**
   * Resolve which shard and intra-shard ordinal to use for a global ordinal
   * @param {number} ordinal
   * @returns {{shard: object, shardOrdinal: number}}
   */
  _getShardForOrdinal(ordinal) {
    return {
      shard: this.shards[ordinal % this.numShards],
      shardOrdinal: Math.floor(ordinal / this.numShards),
    };
  }

  /**
   * Get the size of a set
   * @param {number} ordinal - The set ordinal
   * @returns {number} The size
   */
  size(ordinal) {
    if (ordinal > this.maxOrdinal) return 0;
    const {shard, shardOrdinal} = this._getShardForOrdinal(ordinal);
    const bitIndex = shardOrdinal * shard.bitsPerFixedLengthSetPortion + shard.bitsPerSetPointer;
    return shard.setPointerAndSizeData.getElementValue(bitIndex, shard.bitsPerSetSizeValue);
  }

  /**
   * Get an element ordinal from a set
   * @param {number} ordinal - The set ordinal
   * @param {number} index - The element index
   * @returns {number} The element ordinal
   */
  getElementOrdinal(ordinal, index) {
    const {shard, shardOrdinal} = this._getShardForOrdinal(ordinal);
    const startBucket = this._shardStartBucket(shard, shardOrdinal);
    const bitIndex = (startBucket + index) * shard.bitsPerElement;
    return shard.elementData.getElementValue(bitIndex, shard.bitsPerElement);
  }

  _shardStartBucket(shard, shardOrdinal) {
    if (shardOrdinal === 0) return 0;
    const bitIndex = (shardOrdinal - 1) * shard.bitsPerFixedLengthSetPortion;
    return shard.setPointerAndSizeData.getElementValue(bitIndex, shard.bitsPerSetPointer);
  }

  /**
   * Return all non-empty element ordinals for the set at the given global ordinal.
   * Iterates the hash buckets of the correct shard, skipping empty slots.
   * @param {number} ordinal - The global set ordinal
   * @returns {number[]} Element ordinals
   */
  getSetElements(ordinal) {
    const {shard, shardOrdinal} = this._getShardForOrdinal(ordinal);
    const startBucket = this._shardStartBucket(shard, shardOrdinal);
    const endBucket = shard.setPointerAndSizeData.getElementValue(
      shardOrdinal * shard.bitsPerFixedLengthSetPortion, shard.bitsPerSetPointer
    );
    const emptyOrdinal = (1 << shard.bitsPerElement) - 1;
    const elements = [];
    for (let bucket = startBucket; bucket < endBucket; bucket++) {
      const elementOrdinal = shard.elementData.getElementValue(bucket * shard.bitsPerElement, shard.bitsPerElement);
      if (elementOrdinal !== emptyOrdinal) {
        elements.push(elementOrdinal);
      }
    }
    return elements;
  }

  /** @deprecated use size() / getSetElements() */
  getSetStartBucket(ordinal) {
    const {shard, shardOrdinal} = this._getShardForOrdinal(ordinal);
    return this._shardStartBucket(shard, shardOrdinal);
  }
}
