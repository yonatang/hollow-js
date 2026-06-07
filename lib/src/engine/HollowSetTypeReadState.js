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

    this.maxOrdinal = VarInt.readVInt(input);
    this.bitsPerSetPointer = VarInt.readVInt(input);
    this.bitsPerSetSizeValue = VarInt.readVInt(input);
    this.bitsPerFixedLengthSetPortion = this.bitsPerSetPointer + this.bitsPerSetSizeValue;
    this.bitsPerElement = VarInt.readVInt(input);
    this.totalNumberOfBuckets = Number(VarInt.readVLong(input));

    // Read set pointer and size data
    const pointerNumLongs = VarInt.readVLong(input);
    const pointerBytes = Number(pointerNumLongs * 8n);
    const pointerData = input.readBytes(pointerBytes);
    this.setPointerAndSizeData = new FixedLengthData(pointerData);

    // Read element data
    const elementNumLongs = VarInt.readVLong(input);
    const elementBytes = Number(elementNumLongs * 8n);
    const elementData = input.readBytes(elementBytes);
    this.elementData = new FixedLengthData(elementData);

    const numLongs = input.readInt();
    this.populatedOrdinals.setWords(input.readBigUint64ArrayBE(numLongs));
  }

  /**
   * Get the size of a set
   * @param {number} ordinal - The set ordinal
   * @returns {number} The size
   */
  size(ordinal) {
    if (ordinal > this.maxOrdinal) return 0;

    const bitIndex = ordinal * this.bitsPerFixedLengthSetPortion + this.bitsPerSetPointer;
    return this.setPointerAndSizeData.getElementValue(bitIndex, this.bitsPerSetSizeValue);
  }

  /**
   * Get an element ordinal from a set
   * @param {number} ordinal - The set ordinal
   * @param {number} index - The element index
   * @returns {number} The element ordinal
   */
  getElementOrdinal(ordinal, index) {
    const startBucket = this.getSetStartBucket(ordinal);
    const bucketIndex = startBucket + index;
    const bitIndex = bucketIndex * this.bitsPerElement;
    return this.elementData.getElementValue(bitIndex, this.bitsPerElement);
  }

  /**
   * Get set start bucket index
   * @param {number} ordinal - The set ordinal
   * @returns {number} The start bucket index
   */
  getSetStartBucket(ordinal) {
    if (ordinal === 0) return 0;
    const bitIndex = (ordinal - 1) * this.bitsPerFixedLengthSetPortion;
    return this.setPointerAndSizeData.getElementValue(bitIndex, this.bitsPerSetPointer);
  }
}
