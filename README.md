# Hollow.js

A JavaScript port of [Netflix Hollow](https://hollow.how/) for reading and browsing snapshot data in browsers.

## Overview

Hollow.js brings Netflix's Hollow library to JavaScript, enabling browser-based applications to load and query Hollow snapshot files. This implementation focuses on the read/consumer APIs, providing a low-level Generic API for accessing data without code generation.

## Project Structure

```
hollow-js/
├── lib/              # Core library (@yonatang/hollow-js)
│   ├── src/          # Library source code
│   ├── dist/         # Built library (generated)
│   └── tests/        # Library tests
├── demo/             # Demo application
│   ├── src/          # React demo app
│   └── binaries/     # Test snapshots
└── package.json      # Monorepo scripts
```

## Features

- ✅ **Snapshot Reading** - Load Hollow blob files (version 1030)
- ✅ **All Schema Types** - Support for OBJECT, LIST, SET, and MAP types
- ✅ **All Field Types** - INT, LONG, BOOLEAN, FLOAT, DOUBLE, STRING, BYTES, REFERENCE
- ✅ **Generic API** - Access records without code generation
- ✅ **TypeScript Support** - Full type declarations included
- ✅ **Browser Native** - Pure JavaScript with ES6 modules
- ✅ **Interactive Demo** - Browse snapshots with a web UI

## Quick Start

### Installation

```bash
# Install dependencies
cd lib && npm install
cd ../demo && npm install

# Or from root
npm install  # If using workspaces
```

### Build and Run

```bash
# From project root:
npm run install:demo  # Build library and install in demo
npm run dev:demo      # Start demo app at http://localhost:5173

# Or step by step:
cd lib
npm run build
npm run install:demo

cd ../demo
npm run dev
```

### Basic Usage

```javascript
import { HollowConsumer, GenericHollowObject, RecordStringifier } from '@yonatang/hollow-js';

// Load a snapshot
const consumer = new HollowConsumer();
const stateEngine = await consumer.loadSnapshot('path/to/snapshot.blob');

// List all types
const types = stateEngine.getAllTypes();
console.log('Types:', types);

// Get a type state
const movieType = stateEngine.getTypeState('Movie');

// Access a record
const movie = new GenericHollowObject(stateEngine, 'Movie', ordinal);
const title = movie.getString('title');
const year = movie.getInt('year');

// Convert to JSON
const json = RecordStringifier.toJSON(movie, true);
console.log(json);
```

## Demo

An interactive web-based demo is included to browse snapshot data:

```bash
# Start the demo server
node demo/serve.js

# Open http://localhost:3000 in your browser
```

See [DEMO_README.md](DEMO_README.md) for details.

## Architecture

### Core Components

**Binary Parsing Layer**
- `BlobInput` - Binary stream reader with big-endian support
- `VarInt` - Variable-length integer encoding/decoding
- `FixedLengthData` - Bit-packed data reader for non-byte-aligned fields

**Schema Layer**
- `HollowSchema` - Base schema with factory methods
- `HollowObjectSchema`, `HollowListSchema`, `HollowSetSchema`, `HollowMapSchema`
- Field type definitions and schema parsing

**Engine Layer**
- `HollowBlobReader` - Main snapshot reader
- `HollowReadStateEngine` - Dataset state management
- `HollowTypeReadState` - Base type reader
- Type-specific readers for OBJECT, LIST, SET, MAP

**API Layer**
- `HollowConsumer` - Main entry point
- `GenericHollowObject` - Generic record accessor
- `GenericHollowList`, `GenericHollowSet`, `GenericHollowMap` - Collection accessors

**Tools**
- `RecordStringifier` - JSON conversion
- `TypeIterator` - Record iteration utilities
- `SnapshotLoader` - HTTP/file loading

## API Documentation

### HollowConsumer

```javascript
const consumer = new HollowConsumer();

// Load from URL
const stateEngine = await consumer.loadSnapshot('https://example.com/snapshot.blob');

// Load from File object
const stateEngine = await consumer.loadSnapshotFromFile(file);

// Load from ArrayBuffer
const stateEngine = consumer.loadSnapshotFromBuffer(arrayBuffer);
```

### GenericHollowObject

```javascript
const obj = new GenericHollowObject(stateEngine, 'TypeName', ordinal);

// Access fields
const intValue = obj.getInt('fieldName');
const longValue = obj.getLong('fieldName');
const boolValue = obj.getBoolean('fieldName');
const floatValue = obj.getFloat('fieldName');
const doubleValue = obj.getDouble('fieldName');
const stringValue = obj.getString('fieldName');
const bytesValue = obj.getBytes('fieldName');

// Access references
const refObj = obj.getObject('refField');
const list = obj.getList('listField');
const set = obj.getSet('setField');
const map = obj.getMap('mapField');
```

### TypeIterator

```javascript
const typeState = stateEngine.getTypeState('Movie');

// Iterate all records
TypeIterator.forEach(typeState, stateEngine, (obj, ordinal) => {
  console.log(`Record #${ordinal}:`, obj.getString('title'));
});

// Get all as array
const records = TypeIterator.toArray(typeState, stateEngine);

// Get count
const count = TypeIterator.count(typeState);
```

### RecordStringifier

```javascript
const obj = new GenericHollowObject(stateEngine, 'Movie', ordinal);

// Convert to JSON
const json = RecordStringifier.toJSON(obj, true); // true = pretty print
console.log(json);
```

## Implementation Status

✅ **Completed (100%)**
- Phase 1: Binary Parsing Foundation
- Phase 2: Schema Parsing
- Phase 3: Type Read States
- Phase 4: Blob Reading & State Engine
- Phase 5: Generic API
- Phase 6: Utilities & Tools
- Phase 7: Main Entry Point
- Phase 8: Demo & Testing

See [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) for detailed status.

## Limitations

- **Snapshots Only** - Delta application not implemented
- **Single Shard** - Multi-shard snapshots not yet supported
- **Browser Only** - Designed for browser environments
- **No Code Generation** - Uses Generic API only

## Browser Compatibility

Requires modern browser with:
- ES6 Modules
- Fetch API
- BigInt (for 64-bit integers)
- DataView (for binary data)

Tested on Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for our development workflow, changeset guidelines, and release process.

Areas for improvement:

- Multi-shard support
- Delta application
- Performance optimizations
- Additional utilities (indexing, querying)
- TypeScript definitions
- More comprehensive tests

## References

- [Hollow Official Site](https://hollow.how/)
- [Hollow GitHub](https://github.com/Netflix/hollow)
- [Hollow Documentation](https://hollow.how/getting-started)

## License

MIT License - See LICENSE file

## Acknowledgements

Based on [Netflix Hollow](https://github.com/Netflix/hollow) - an in-memory data dissemination framework for Java.
