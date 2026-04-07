/**
 * Main snapshot reader
 * Based on com.netflix.hollow.core.read.engine.HollowBlobReader
 */

import { HollowBlobHeader } from './HollowBlobHeader.js';
import { HollowReadStateEngine } from './HollowReadStateEngine.js';
import { HollowObjectTypeReadState } from './HollowObjectTypeReadState.js';
import { HollowListTypeReadState } from './HollowListTypeReadState.js';
import { HollowSetTypeReadState } from './HollowSetTypeReadState.js';
import { HollowMapTypeReadState } from './HollowMapTypeReadState.js';
import { SchemaType } from '../schema/HollowSchema.js';
import { VarInt } from '../io/VarInt.js';
import { SchemaReader } from '../schema/SchemaReader.js';

/**
 * Hollow blob reader - main entry point for reading snapshots
 */
export class HollowBlobReader {
  /**
   * Read a snapshot from input
   * @param {BlobInput} input - The input stream
   * @returns {HollowReadStateEngine} The state engine
   */
  static readSnapshot(input) {
    const stateEngine = new HollowReadStateEngine();

    // Read header
    const header = HollowBlobHeader.readHeader(input);

    // Read number of type states
    const numTypeStates = VarInt.readVInt(input);

    // Read each type state
    for (let i = 0; i < numTypeStates; i++) {
      // Read schema from stream (it's encoded again even though it's in the header)
      const streamSchema = SchemaReader.readFrom(input);

      // Use schema from header (they should match)
      const schema = header.getSchemas()[i];

      // Read number of shards (with backwards compatibility)
      const numShards = this.readNumShards(input);

      // Create appropriate type read state
      let typeState;
      switch (schema.getSchemaType()) {
        case SchemaType.OBJECT:
          typeState = new HollowObjectTypeReadState(schema);
          break;
        case SchemaType.LIST:
          typeState = new HollowListTypeReadState(schema);
          break;
        case SchemaType.SET:
          typeState = new HollowSetTypeReadState(schema);
          break;
        case SchemaType.MAP:
          typeState = new HollowMapTypeReadState(schema);
          break;
        default:
          throw new Error(`Unknown schema type: ${schema.getSchemaType()}`);
      }

      // Read snapshot data
      typeState.readSnapshot(input, numShards);

      // Add to state engine
      stateEngine.addTypeState(typeState);
    }

    return stateEngine;
  }

  /**
   * Read number of shards with backwards compatibility
   * @param {BlobInput} input - The input stream
   * @returns {number} Number of shards
   */
  static readNumShards(input) {
    const backwardsCompatibilityBytes = VarInt.readVInt(input);

    if (backwardsCompatibilityBytes === 0) {
      return 1; // Produced by version < 2.1.0, always 1 shard
    }

    // Skip forwards compatibility bytes
    const forwardsCompatibilityBytes = VarInt.readVInt(input);
    for (let i = 0; i < forwardsCompatibilityBytes; i++) {
      input.readByte();
    }

    // Read actual number of shards
    return VarInt.readVInt(input);
  }
}
