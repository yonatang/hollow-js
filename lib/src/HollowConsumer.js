/**
 * Top-level consumer class
 * Based on com.netflix.hollow.api.consumer.HollowConsumer
 */

import { BlobInput } from './io/BlobInput.js';
import { HollowBlobReader } from './engine/HollowBlobReader.js';
import { SnapshotLoader } from './util/SnapshotLoader.js';

/**
 * Hollow consumer - main entry point for loading and consuming snapshots
 */
export class HollowConsumer {
  constructor() {
    this.stateEngine = null;
  }

  /**
   * Load a snapshot from a URL
   * @param {string} url - The URL to load from
   * @returns {Promise<HollowReadStateEngine>} The state engine
   */
  async loadSnapshot(url) {
    const arrayBuffer = await SnapshotLoader.loadFromUrl(url);
    return this.loadSnapshotFromBuffer(arrayBuffer);
  }

  /**
   * Load a snapshot from a File object
   * @param {File} file - The file to load
   * @returns {Promise<HollowReadStateEngine>} The state engine
   */
  async loadSnapshotFromFile(file) {
    const arrayBuffer = await SnapshotLoader.loadFromFile(file);
    return this.loadSnapshotFromBuffer(arrayBuffer);
  }

  /**
   * Load a snapshot from an ArrayBuffer
   * @param {ArrayBuffer} arrayBuffer - The snapshot data
   * @returns {HollowReadStateEngine} The state engine
   */
  loadSnapshotFromBuffer(arrayBuffer) {
    const input = new BlobInput(arrayBuffer);
    this.stateEngine = HollowBlobReader.readSnapshot(input);
    return this.stateEngine;
  }

  /**
   * Get the state engine
   * @returns {HollowReadStateEngine} The state engine
   */
  getStateEngine() {
    return this.stateEngine;
  }
}
