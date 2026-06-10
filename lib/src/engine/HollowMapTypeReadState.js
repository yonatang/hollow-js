/**
 * MAP type read state
 * Based on com.netflix.hollow.core.read.engine.map.HollowMapTypeReadState
 *
 * Simplified implementation for snapshot reading
 */

import { HollowTypeReadState } from './HollowTypeReadState.js';
import { VarInt } from '../io/VarInt.js';
import { FixedLengthData } from '../io/FixedLengthData.js';

/**
 * MAP type read state
 */
export class HollowMapTypeReadState extends HollowTypeReadState {
  /**
   * Create a new MAP type read state
   * @param {HollowMapSchema} schema - The schema
   */
  constructor(schema) {
    super(schema);
    this.mapPointerAndSizeData = null;
    this.entryData = null;
    this.bitsPerMapPointer = 0;
    this.bitsPerMapSizeValue = 0;
    this.bitsPerFixedLengthMapPortion = 0;
    this.bitsPerKeyElement = 0;
    this.bitsPerValueElement = 0;
    this.bitsPerMapEntry = 0;
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
      const bitsPerMapPointer = VarInt.readVInt(input);
      const bitsPerMapSizeValue = VarInt.readVInt(input);
      const bitsPerKeyElement = VarInt.readVInt(input);
      const bitsPerValueElement = VarInt.readVInt(input);
      const totalNumberOfBuckets = Number(VarInt.readVLong(input));

      const pointerNumLongs = VarInt.readVLong(input);
      const pointerData = input.readBytes(Number(pointerNumLongs * 8n));

      const entryNumLongs = VarInt.readVLong(input);
      const entryData = input.readBytes(Number(entryNumLongs * 8n));

      this.shards.push({
        maxOrdinal: shardMaxOrdinal,
        bitsPerMapPointer,
        bitsPerMapSizeValue,
        bitsPerFixedLengthMapPortion: bitsPerMapPointer + bitsPerMapSizeValue,
        bitsPerKeyElement,
        bitsPerValueElement,
        bitsPerMapEntry: bitsPerKeyElement + bitsPerValueElement,
        totalNumberOfBuckets,
        mapPointerAndSizeData: new FixedLengthData(pointerData),
        entryData: new FixedLengthData(entryData),
      });

      if (numShards === 1) this.maxOrdinal = shardMaxOrdinal;
    }

    // Expose shard 0's data for backward compatibility
    const s0 = this.shards[0];
    this.bitsPerMapPointer = s0.bitsPerMapPointer;
    this.bitsPerMapSizeValue = s0.bitsPerMapSizeValue;
    this.bitsPerFixedLengthMapPortion = s0.bitsPerFixedLengthMapPortion;
    this.bitsPerKeyElement = s0.bitsPerKeyElement;
    this.bitsPerValueElement = s0.bitsPerValueElement;
    this.bitsPerMapEntry = s0.bitsPerMapEntry;
    this.totalNumberOfBuckets = s0.totalNumberOfBuckets;
    this.mapPointerAndSizeData = s0.mapPointerAndSizeData;
    this.entryData = s0.entryData;

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
   * Get the size of a map
   * @param {number} ordinal - The map ordinal
   * @returns {number} The size
   */
  size(ordinal) {
    if (ordinal > this.maxOrdinal) return 0;
    const {shard, shardOrdinal} = this._getShardForOrdinal(ordinal);
    const bitIndex = shardOrdinal * shard.bitsPerFixedLengthMapPortion + shard.bitsPerMapPointer;
    return shard.mapPointerAndSizeData.getElementValue(bitIndex, shard.bitsPerMapSizeValue);
  }

  /**
   * Get a key ordinal from a map
   * @param {number} ordinal - The map ordinal
   * @param {number} index - The entry index
   * @returns {number} The key ordinal
   */
  getKey(ordinal, index) {
    const {shard, shardOrdinal} = this._getShardForOrdinal(ordinal);
    const bucketIndex = this._shardStartBucket(shard, shardOrdinal) + index;
    return shard.entryData.getElementValue(bucketIndex * shard.bitsPerMapEntry, shard.bitsPerKeyElement);
  }

  /**
   * Get a value ordinal from a map
   * @param {number} ordinal - The map ordinal
   * @param {number} index - The entry index
   * @returns {number} The value ordinal
   */
  getValue(ordinal, index) {
    const {shard, shardOrdinal} = this._getShardForOrdinal(ordinal);
    const bucketIndex = this._shardStartBucket(shard, shardOrdinal) + index;
    return shard.entryData.getElementValue(bucketIndex * shard.bitsPerMapEntry + shard.bitsPerKeyElement, shard.bitsPerValueElement);
  }

  _shardStartBucket(shard, shardOrdinal) {
    if (shardOrdinal === 0) return 0;
    const bitIndex = (shardOrdinal - 1) * shard.bitsPerFixedLengthMapPortion;
    return shard.mapPointerAndSizeData.getElementValue(bitIndex, shard.bitsPerMapPointer);
  }

  /**
   * Return all non-empty entries for the map at the given global ordinal.
   * Iterates the hash buckets of the correct shard, skipping empty slots.
   * @param {number} ordinal - The global map ordinal
   * @returns {{keyOrdinal: number, valueOrdinal: number}[]} Entries
   */
  getMapEntries(ordinal) {
    const {shard, shardOrdinal} = this._getShardForOrdinal(ordinal);
    const startBucket = this._shardStartBucket(shard, shardOrdinal);
    const endBucket = shard.mapPointerAndSizeData.getElementValue(
      shardOrdinal * shard.bitsPerFixedLengthMapPortion, shard.bitsPerMapPointer
    );
    const emptyKeyOrdinal = (1 << shard.bitsPerKeyElement) - 1;
    const entries = [];
    for (let bucket = startBucket; bucket < endBucket; bucket++) {
      const bitIndex = bucket * shard.bitsPerMapEntry;
      const keyOrdinal = shard.entryData.getElementValue(bitIndex, shard.bitsPerKeyElement);
      if (keyOrdinal !== emptyKeyOrdinal) {
        const valueOrdinal = shard.entryData.getElementValue(bitIndex + shard.bitsPerKeyElement, shard.bitsPerValueElement);
        entries.push({keyOrdinal, valueOrdinal});
      }
    }
    return entries;
  }

  /** @deprecated use size() / getMapEntries() */
  getMapStartBucket(ordinal) {
    const {shard, shardOrdinal} = this._getShardForOrdinal(ordinal);
    return this._shardStartBucket(shard, shardOrdinal);
  }
}
