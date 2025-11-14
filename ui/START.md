# Starting the ReactFlow Template UI

## Quick Start

```bash
# Navigate to UI directory
cd ui

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open automatically at http://localhost:3000

## Available Scripts

- `npm run dev` - Start development server (port 3000)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run type-check` - Check TypeScript types

## Development

The UI runs independently from the main library. It uses:

- **Vite** - Fast dev server and build tool
- **React 18** - UI framework
- **ReactFlow** - Visual node-based editor
- **Zustand** - State management
- **TypeScript** - Type safety

## Project Structure

```
ui/
├── src/
│   ├── components/     # React components
│   │   ├── canvas/     # Canvas and controls
│   │   ├── nodes/      # Node components
│   │   └── edges/      # Edge components
│   ├── lib/            # Utilities and types
│   ├── App.tsx         # Main application
│   └── main.tsx        # Entry point
├── index.html          # HTML template
├── vite.config.ts      # Vite configuration
└── package.json        # Dependencies

```

## Features

✅ **Template Catalog** - Browse and select templates
✅ **Visual Canvas** - ReactFlow-based node editor
✅ **Undo/Redo** - Full history management with keyboard shortcuts
✅ **Multiple Views** - Grid/list catalog modes
✅ **Search & Filter** - Find templates quickly
✅ **Responsive** - Works on different screen sizes

## Keyboard Shortcuts

- `Cmd/Ctrl + Z` - Undo
- `Cmd/Ctrl + Shift + Z` - Redo
- `Cmd/Ctrl + Y` - Redo (alternative)

## Tips

- Click "Show/Hide Catalog" to toggle the sidebar
- Select a template from the catalog to work with it
- Use the undo/redo buttons or keyboard shortcuts
- The canvas supports drag, zoom, and pan

## Troubleshooting

**Port already in use:**
```bash
# Change port in vite.config.ts
server: {
  port: 3001,  // Use different port
}
```

**Dependencies not installing:**
```bash
# Clear npm cache and try again
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**TypeScript errors:**
```bash
# Run type check
npm run type-check
```

## Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

The production build will be in `ui/dist/`
