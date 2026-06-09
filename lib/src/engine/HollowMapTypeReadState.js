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

    for (let shardIndex = 0; shardIndex < numShards; shardIndex++) {
      const shardMaxOrdinal = VarInt.readVInt(input);
      const bitsPerMapPointer = VarInt.readVInt(input);
      const bitsPerMapSizeValue = VarInt.readVInt(input);
      const bitsPerKeyElement = VarInt.readVInt(input);
      const bitsPerValueElement = VarInt.readVInt(input);
      const totalNumberOfBuckets = Number(VarInt.readVLong(input));

      const pointerNumLongs = VarInt.readVLong(input);
      const pointerBytes = Number(pointerNumLongs * 8n);
      const pointerData = input.readBytes(pointerBytes);

      const entryNumLongs = VarInt.readVLong(input);
      const entryBytes = Number(entryNumLongs * 8n);
      const entryData = input.readBytes(entryBytes);

      if (shardIndex === 0) {
        if (numShards === 1) this.maxOrdinal = shardMaxOrdinal;
        this.bitsPerMapPointer = bitsPerMapPointer;
        this.bitsPerMapSizeValue = bitsPerMapSizeValue;
        this.bitsPerFixedLengthMapPortion = bitsPerMapPointer + bitsPerMapSizeValue;
        this.bitsPerKeyElement = bitsPerKeyElement;
        this.bitsPerValueElement = bitsPerValueElement;
        this.bitsPerMapEntry = bitsPerKeyElement + bitsPerValueElement;
        this.totalNumberOfBuckets = totalNumberOfBuckets;
        this.mapPointerAndSizeData = new FixedLengthData(pointerData);
        this.entryData = new FixedLengthData(entryData);
      }
    }

    const numLongs = input.readInt();
    this.populatedOrdinals.setWords(input.readBigUint64ArrayBE(numLongs));
  }

  /**
   * Get the size of a map
   * @param {number} ordinal - The map ordinal
   * @returns {number} The size
   */
  size(ordinal) {
    if (ordinal > this.maxOrdinal) return 0;

    const bitIndex = ordinal * this.bitsPerFixedLengthMapPortion + this.bitsPerMapPointer;
    return this.mapPointerAndSizeData.getElementValue(bitIndex, this.bitsPerMapSizeValue);
  }

  /**
   * Get a key ordinal from a map
   * @param {number} ordinal - The map ordinal
   * @param {number} index - The entry index
   * @returns {number} The key ordinal
   */
  getKey(ordinal, index) {
    const startBucket = this.getMapStartBucket(ordinal);
    const bucketIndex = startBucket + index;
    const bitIndex = bucketIndex * this.bitsPerMapEntry;
    return this.entryData.getElementValue(bitIndex, this.bitsPerKeyElement);
  }

  /**
   * Get a value ordinal from a map
   * @param {number} ordinal - The map ordinal
   * @param {number} index - The entry index
   * @returns {number} The value ordinal
   */
  getValue(ordinal, index) {
    const startBucket = this.getMapStartBucket(ordinal);
    const bucketIndex = startBucket + index;
    const bitIndex = bucketIndex * this.bitsPerMapEntry + this.bitsPerKeyElement;
    return this.entryData.getElementValue(bitIndex, this.bitsPerValueElement);
  }

  /**
   * Get map start bucket index
   * @param {number} ordinal - The map ordinal
   * @returns {number} The start bucket index
   */
  getMapStartBucket(ordinal) {
    if (ordinal === 0) return 0;
    const bitIndex = (ordinal - 1) * this.bitsPerFixedLengthMapPortion;
    return this.mapPointerAndSizeData.getElementValue(bitIndex, this.bitsPerMapPointer);
  }
}
