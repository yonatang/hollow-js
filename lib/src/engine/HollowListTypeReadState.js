/**
 * LIST type read state
 * Based on com.netflix.hollow.core.read.engine.list.HollowListTypeReadState
 *
 * Simplified implementation for snapshot reading
 */

import { HollowTypeReadState } from './HollowTypeReadState.js';
import { VarInt } from '../io/VarInt.js';
import { FixedLengthData } from '../io/FixedLengthData.js';

/**
 * LIST type read state
 */
export class HollowListTypeReadState extends HollowTypeReadState {
  /**
   * Create a new LIST type read state
   * @param {HollowListSchema} schema - The schema
   */
  constructor(schema) {
    super(schema);
    this.listPointerData = null;
    this.elementData = null;
    this.bitsPerListPointer = 0;
    this.bitsPerElement = 0;
    this.totalNumberOfElements = 0;
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
      const bitsPerListPointer = VarInt.readVInt(input);
      const bitsPerElement = VarInt.readVInt(input);
      const totalNumberOfElements = Number(VarInt.readVLong(input));

      const pointerNumLongs = VarInt.readVLong(input);
      const pointerData = input.readBytes(Number(pointerNumLongs * 8n));

      const elementNumLongs = VarInt.readVLong(input);
      const elementData = input.readBytes(Number(elementNumLongs * 8n));

      this.shards.push({
        maxOrdinal: shardMaxOrdinal,
        bitsPerListPointer,
        bitsPerElement,
        totalNumberOfElements,
        listPointerData: new FixedLengthData(pointerData),
        elementData: new FixedLengthData(elementData),
      });

      if (numShards === 1) this.maxOrdinal = shardMaxOrdinal;
    }

    // Expose shard 0's data for backward compatibility
    const s0 = this.shards[0];
    this.bitsPerListPointer = s0.bitsPerListPointer;
    this.bitsPerElement = s0.bitsPerElement;
    this.totalNumberOfElements = s0.totalNumberOfElements;
    this.listPointerData = s0.listPointerData;
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
   * Get the size of a list
   * @param {number} ordinal - The list ordinal
   * @returns {number} The size
   */
  size(ordinal) {
    if (ordinal > this.maxOrdinal) return 0;
    const {shard, shardOrdinal} = this._getShardForOrdinal(ordinal);
    return this._shardEndElement(shard, shardOrdinal) - this._shardStartElement(shard, shardOrdinal);
  }

  /**
   * Get an element ordinal from a list
   * @param {number} ordinal - The list ordinal
   * @param {number} index - The element index
   * @returns {number} The element ordinal
   */
  getElementOrdinal(ordinal, index) {
    const {shard, shardOrdinal} = this._getShardForOrdinal(ordinal);
    const elementIndex = this._shardStartElement(shard, shardOrdinal) + index;
    return shard.elementData.getElementValue(elementIndex * shard.bitsPerElement, shard.bitsPerElement);
  }

  _shardStartElement(shard, shardOrdinal) {
    if (shardOrdinal === 0) return 0;
    return shard.listPointerData.getElementValue((shardOrdinal - 1) * shard.bitsPerListPointer, shard.bitsPerListPointer);
  }

  _shardEndElement(shard, shardOrdinal) {
    return shard.listPointerData.getElementValue(shardOrdinal * shard.bitsPerListPointer, shard.bitsPerListPointer);
  }

  /** @deprecated use size() / getElementOrdinal() */
  getListStartElement(ordinal) {
    const {shard, shardOrdinal} = this._getShardForOrdinal(ordinal);
    return this._shardStartElement(shard, shardOrdinal);
  }

  /** @deprecated use size() / getElementOrdinal() */
  getListEndElement(ordinal) {
    const {shard, shardOrdinal} = this._getShardForOrdinal(ordinal);
    return this._shardEndElement(shard, shardOrdinal);
  }
}
