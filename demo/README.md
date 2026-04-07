# Hollow.js React Demo

Interactive React + Vite application for browsing Netflix Hollow snapshots.

## Features

- 🎬 Load and browse Hollow snapshots
- 📊 View all types with record counts
- 🔍 Inspect schemas and field definitions
- 📝 View records as pretty-printed JSON
- 📄 Pagination for large datasets
- ⚡ Built with React + Vite for fast development

## Getting Started

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Then open http://localhost:5173 in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
hollow-js-demo/
├── src/
│   ├── hollow-js/         # Hollow.js library (copied from main project)
│   ├── components/        # React components
│   │   ├── HollowBrowser.tsx      # Main browser component
│   │   ├── TypeList.tsx           # Type list sidebar
│   │   ├── TypeDetail.tsx         # Type detail view
│   │   └── HollowBrowser.css      # Styles
│   ├── App.tsx            # Root component
│   └── main.tsx           # Entry point
├── ../snapshots/          # External snapshot files (outside public)
└── vite.config.ts         # Vite configuration with file serving
```

## Snapshot Files

Snapshot files are stored in the `snapshots/` directory at the project root (outside the demo folder). This allows:
- Sharing snapshots between multiple demos
- Keeping large binary files out of the demo bundle
- Easy snapshot management

The Vite configuration allows serving these files via the `@snapshots` alias.

## How It Works

1. **Load Snapshot** - Click the button to load the snapshot file
2. **Browse Types** - Left sidebar shows all types with record counts
3. **View Schema** - Click a type to see its schema definition
4. **Inspect Records** - Browse records with pagination
5. **View JSON** - Click a record to see its full JSON representation

## Technologies

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Hollow.js** - Netflix Hollow reader library

## Development

The demo uses hot module replacement (HMR) for fast development:

```bash
npm run dev
```

Edit files in `src/` and see changes instantly.

## Adding Your Own Snapshots

1. Copy your snapshot file to `../snapshots/`
2. Update the snapshot path in `src/components/HollowBrowser.tsx`:

```typescript
const engine = await consumer.loadSnapshot('/@snapshots/your-snapshot-file');
```

Or add a file input to let users upload snapshots dynamically.

## Troubleshooting

### Snapshot Not Loading

- Check that the snapshot file exists in `../snapshots/`
- Verify the path in HollowBrowser.tsx
- Check browser console for errors

### TypeScript Errors

Run the type checker:
```bash
npm run build
```

### Module Not Found

The Hollow.js library is copied to `src/hollow-js/`. If you update the main library:
```bash
cp -r ../src/* src/hollow-js/
```

## License

MIT
