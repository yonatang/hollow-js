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
      const bitsPerListPointer = VarInt.readVInt(input);
      const bitsPerElement = VarInt.readVInt(input);
      const totalNumberOfElements = Number(VarInt.readVLong(input));

      const pointerNumLongs = VarInt.readVLong(input);
      const pointerBytes = Number(pointerNumLongs * 8n);
      const pointerData = input.readBytes(pointerBytes);

      const elementNumLongs = VarInt.readVLong(input);
      const elementBytes = Number(elementNumLongs * 8n);
      const elementData = input.readBytes(elementBytes);

      if (shardIndex === 0) {
        if (numShards === 1) this.maxOrdinal = shardMaxOrdinal;
        this.bitsPerListPointer = bitsPerListPointer;
        this.bitsPerElement = bitsPerElement;
        this.totalNumberOfElements = totalNumberOfElements;
        this.listPointerData = new FixedLengthData(pointerData);
        this.elementData = new FixedLengthData(elementData);
      }
    }

    const numLongs = input.readInt();
    this.populatedOrdinals.setWords(input.readBigUint64ArrayBE(numLongs));
  }

  /**
   * Get the size of a list
   * @param {number} ordinal - The list ordinal
   * @returns {number} The size
   */
  size(ordinal) {
    if (ordinal > this.maxOrdinal) return 0;

    const startElement = this.getListStartElement(ordinal);
    const endElement = this.getListEndElement(ordinal);
    return endElement - startElement;
  }

  /**
   * Get an element ordinal from a list
   * @param {number} ordinal - The list ordinal
   * @param {number} index - The element index
   * @returns {number} The element ordinal
   */
  getElementOrdinal(ordinal, index) {
    const startElement = this.getListStartElement(ordinal);
    const elementIndex = startElement + index;
    return this.elementData.getElementValue(elementIndex * this.bitsPerElement, this.bitsPerElement);
  }

  /**
   * Get list start element index
   * @param {number} ordinal - The list ordinal
   * @returns {number} The start element index
   */
  getListStartElement(ordinal) {
    if (ordinal === 0) return 0;
    return this.listPointerData.getElementValue((ordinal - 1) * this.bitsPerListPointer, this.bitsPerListPointer);
  }

  /**
   * Get list end element index
   * @param {number} ordinal - The list ordinal
   * @returns {number} The end element index
   */
  getListEndElement(ordinal) {
    return this.listPointerData.getElementValue(ordinal * this.bitsPerListPointer, this.bitsPerListPointer);
  }
}
