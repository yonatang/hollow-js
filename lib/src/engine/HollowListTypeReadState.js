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

    this.maxOrdinal = VarInt.readVInt(input);
    this.bitsPerListPointer = VarInt.readVInt(input);
    this.bitsPerElement = VarInt.readVInt(input);
    this.totalNumberOfElements = Number(VarInt.readVLong(input));

    // Read list pointer data
    const pointerNumLongs = VarInt.readVLong(input);
    const pointerBytes = Number(pointerNumLongs * 8n);
    const pointerData = input.readBytes(pointerBytes);
    this.listPointerData = new FixedLengthData(pointerData);

    // Read element data
    const elementNumLongs = VarInt.readVLong(input);
    const elementBytes = Number(elementNumLongs * 8n);
    const elementData = input.readBytes(elementBytes);
    this.elementData = new FixedLengthData(elementData);

    // Read populated ordinals from stream
    const numLongs = input.readInt();
    for (let i = 0; i < numLongs; i++) {
      const longValue = input.readLong();
      const baseOrdinal = i * 64;
      for (let bit = 0; bit < 64; bit++) {
        const mask = 1n << BigInt(bit);
        if ((longValue & mask) !== 0n) {
          this.populatedOrdinals.set(baseOrdinal + bit);
        }
      }
    }
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
