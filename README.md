# Neo4j Schema Modeler

[![npm version](https://img.shields.io/npm/v/neo4j-schema-modeler)](https://www.npmjs.com/package/neo4j-schema-modeler)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

A powerful, interactive React component for visually designing and managing Neo4j graph schemas with an intuitive drag-and-drop interface. Create, edit, and visualize your graph database schema with ease.

## ✨ Features

### Core Functionality

- 🎨 Visual node and relationship creation with drag-and-drop interface
- 🔍 Interactive property management with type support
- 🔄 Real-time schema validation and visualization
- � Intuitive relationship management between nodes
- 🎨 Customizable node and edge styling

### Advanced Features

- 🌓 Dark/light mode support with smooth transitions
- 🎯 Context menus for quick actions (right-click on nodes/edges/canvas)
- 📝 Rich property editor with Neo4j data type support
- ⏪ Full undo/redo functionality with keyboard shortcuts
- 🔍 Zoom and pan controls with minimap navigation
- 🎨 Custom color themes and styling options
- 📥/📤 Import/export functionality (JSON, Cypher)
- 🔍 Search and filter nodes and relationships
- 📱 Responsive design that works on different screen sizes

## 🚀 Installation

### Install

Using pnpm (recommended):

```bash
pnpm add neo4j-schema-modeler
```

Using npm:

```bash
npm install neo4j-schema-modeler
```

Using yarn:

```bash
yarn add neo4j-schema-modeler
```

### Peer Dependencies

This package requires the following peer dependencies:

- React 18.x or 19.x
- React DOM 18.x or 19.x
- TypeScript 5.x (for TypeScript support)

## 💻 Basic Usage

### Basic Implementation

```tsx
import React, { useState } from "react";
import { Neo4jSchemaModeler } from "neo4j-schema-modeler";
import type { SchemaModel } from "neo4j-schema-modeler";
import "neo4j-schema-modeler/dist/neo4j-schema-modeler.css";

// Initial schema data (optional)
const initialSchema: SchemaModel = {
  nodes: [
    {
      id: "1",
      x: 100,
      y: 100,
      data: {
        label: "Person",
        color: "#3b82f6",
        properties: [
          { name: "name", type: "String", required: true },
          { name: "age", type: "Integer" },
          { name: "email", type: "String", unique: true },
        ],
      },
    },
  ],
  edges: [],
};

function App() {
  const [schema, setSchema] = useState<SchemaModel>(initialSchema);
  const [darkMode, setDarkMode] = useState(false);

  const handleSchemaChange = (updatedSchema: SchemaModel) => {
    console.log("Schema updated:", updatedSchema);
    setSchema(updatedSchema);
  };

  return (
    <div className="h-screen w-screen flex flex-col">
      <div className="p-4 border-b flex justify-between items-center">
        <h1 className="text-xl font-bold">Neo4j Schema Modeler</h1>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700"
        >
          {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>

      <div className="flex-1 relative">
        <Neo4jSchemaModeler
          initialData={schema}
          onSchemaChange={handleSchemaChange}
          darkMode={darkMode}
          showToolbar={true}
          showMinimap={true}
          propertyPanelPosition="right"
        />
      </div>
    </div>
  );
}

export default App;
```

### Available Hooks

```tsx
import {
  useSchemaState, // For managing schema state
  useCanvasState, // For canvas interactions
  useUndoRedo, // For undo/redo functionality
} from "neo4j-schema-modeler";

// Example hook usage
const {
  nodes,
  edges,
  addNode,
  updateNode,
  deleteNode,
  addEdge,
  updateEdge,
  deleteEdge,
} = useSchemaState();
```

## 📚 Component API

### Props

| Prop                    | Type                                                    | Default          | Description                      |
| ----------------------- | ------------------------------------------------------- | ---------------- | -------------------------------- |
| `initialData`           | `SchemaModel`                                           | `null`           | Initial schema data to load      |
| `onSchemaChange`        | `(schema: SchemaModel) => void`                         | `undefined`      | Callback when schema changes     |
| `darkMode`              | `boolean`                                               | `false`          | Enable dark mode                 |
| `propertyPanelPosition` | `'left' \| 'right'`                                     | `'right'`        | Position of the property panel   |
| `showToolbar`           | `boolean`                                               | `true`           | Show/hide the toolbar            |
| `showMinimap`           | `boolean`                                               | `true`           | Show/hide the minimap            |
| `theme`                 | `object`                                                | `{}`             | Custom theme overrides           |
| `readOnly`              | `boolean`                                               | `false`          | Make the editor read-only        |
| `zoom`                  | `number`                                                | `1`              | Initial zoom level (0.1 - 2)     |
| `pan`                   | `{ x: number, y: number }`                              | `{ x: 0, y: 0 }` | Initial pan position             |
| `onNodeClick`           | `(node: Node) => void`                                  | `undefined`      | Callback when a node is clicked  |
| `onEdgeClick`           | `(edge: Edge) => void`                                  | `undefined`      | Callback when an edge is clicked |
| `onSelectionChange`     | `(selection: { nodes: Node[], edges: Edge[] }) => void` | `undefined`      | Callback when selection changes  |

### Methods (via ref)

```typescript
interface SchemaModelerRef {
  // Export the current schema as Cypher
  exportToCypher(): string;

  // Export the current schema as JSON
  exportToJSON(): string;

  // Import schema from JSON
  importFromJSON(json: string): void;

  // Zoom to fit all nodes
  fitView(padding?: number): void;

  // Zoom to a specific node
  zoomToNode(nodeId: string, padding?: number): void;

  // Get the current schema
  getSchema(): SchemaModel;

  // Undo last action
  undo(): void;

  // Redo last undone action
  redo(): void;
}
```

### Customizing the Theme

You can customize the appearance using a theme object:

```typescript
const customTheme = {
  // Colors
  primary: "#3b82f6",
  secondary: "#6b7280",
  success: "#10b981",
  danger: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",

  // Backgrounds
  background: "#ffffff",
  surface: "#f9fafb",

  // Text
  text: "#1f2937",
  textMuted: "#6b7280",

  // Borders
  border: "#e5e7eb",

  // Node specific
  node: {
    defaultColor: "#3b82f6",
    selectedColor: "#2563eb",
    hoverColor: "#60a5fa",
    textColor: "#ffffff",
  },

  // Edge specific
  edge: {
    defaultColor: "#9ca3af",
    selectedColor: "#3b82f6",
    hoverColor: "#6b7280",
  },
};

// Usage
<Neo4jSchemaModeler theme={customTheme} />;
```

## 🔧 Advanced Usage

### Custom Styling

You can customize the appearance using CSS variables or by providing a custom theme:

```css
:root {
  --nsm-primary-color: #4f46e5;
  --nsm-bg-color: #ffffff;
  --nsm-text-color: #1f2937;
  /* Add more custom variables as needed */
}
```

### Programmatic Control

```tsx
const schemaRef = useRef(null);

// Later in your component
<Neo4jSchemaModeler ref={schemaRef} />;

// Example: Export schema to Cypher
const exportToCypher = () => {
  if (schemaRef.current) {
    const cypher = schemaRef.current.exportToCypher();
    console.log(cypher);
  }
};
```

## 📦 Data Structure

The schema follows this structure:

```typescript
interface SchemaModel {
  nodes: Node[];
  edges: Edge[];
  version: string;
}

interface Node {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    properties: Property[];
    color?: string;
  };
}

interface Edge {
  id: string;
  source: string;
  target: string;
  type: string;
  data: {
    label?: string;
    properties: Property[];
    color?: string;
  };
}

interface Property {
  name: string;
  type: Neo4jPropertyType;
  required: boolean;
  defaultValue?: any;
}

type Neo4jPropertyType =
  | "String"
  | "Integer"
  | "Float"
  | "Boolean"
  | "Date"
  | "DateTime"
  | "LocalDateTime"
  | "Duration"
  | "Point"
  | "CartesianPoint"
  | "StringArray"
  | "IntegerArray"
  | "FloatArray"
  | "BooleanArray"
  | "DateArray"
  | "PointArray";
```

## �️ Development

### Prerequisites

- Node.js 18+ and npm 8+ or Yarn 1.22+
- Git

### Getting Started

1. Clone the repository:

```bash
git clone https://github.com/fab679/neo4j-schema-modeler.git
cd neo4j-schema-modeler
```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn
   ```

3. Start the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

   This will start the development server at `http://localhost:3000`

4. Run tests:

   ```bash
   npm test
   # or
   yarn test
   ```

5. Build for production:

   ```bash
   npm run build
   # or
   yarn build
   ```

6. Run linter:
   ```bash
   npm run lint
   # or
   yarn lint
   ```

## 🚩 Deployment

This project can be deployed to static hosts such as Vercel or GitHub Pages. Be aware of how Vite's `base` option affects asset paths:

- Vercel (recommended for this demo app): deploy the built `dist/` at root. Vercel serves from `/` so set Vite `base` to `/` or leave it unset. The demo site is available at the configured Vercel URL (see `index.html`/`.env` for the site URL).
- GitHub Pages: if you publish to `https://<user>.github.io/neo4j-schema-modeler/` you must set `base: '/neo4j-schema-modeler/'` in `vite.config.ts` so assets are resolved relative to that subpath.

Build locally and verify output:

```bash
pnpm install
pnpm run build
ls dist
```

Automatic publishing to npm and CI

This repository includes a GitHub Actions workflow to publish the package to npm when you push a semver tag (see `.github/workflows/publish.yml`).

Quick publish notes (local):

1. Ensure `package.json` has the correct `name` (this project is published as `neo4j-schema-modeler`) and the `files` array includes `dist`.
2. Build the library (the repo already contains `build:lib` and `build:types` scripts):

```bash
pnpm run build:lib
pnpm run build:types
```

3. Bump version and publish:

```bash
pnpm version patch
pnpm publish
```

If publishing from CI, add an `NPM_TOKEN` secret and push a tag (e.g. `git tag v0.1.3 && git push origin v0.1.3`) — the workflow will publish automatically.

### Project Structure

```
src/
├── components/          # Reusable React components
│   ├── Canvas.tsx      # Main canvas component
│   ├── Toolbar.tsx     # Toolbar with actions
│   ├── PropertiesPanel.tsx  # Property editor
│   └── ...
├── hooks/              # Custom React hooks
│   ├── useSchemaState.ts
│   └── useCanvasState.ts
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── constants/          # Application constants
└── App.tsx             # Main application component
```

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm test -- --watch
```

Run test coverage:

```bash
npm test -- --coverage
```

## 🤝 Contributing

We welcome contributions of all kinds! Whether you're fixing bugs, improving documentation, or adding new features, your help is appreciated.

### How to Contribute

1. **Report Bugs**: Open an issue with detailed steps to reproduce the problem.
2. **Suggest Enhancements**: Share your ideas for new features or improvements.
3. **Submit Pull Requests**: Follow these steps:
   - Fork the repository
   - Create a feature branch
   - Make your changes
   - Add tests if applicable
   - Update documentation
   - Submit a pull request

### Code Style

- Follow the existing code style (prettier + eslint)
- Write meaningful commit messages
- Keep PRs focused on a single feature/bugfix
- Add tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ and [React](https://reactjs.org/)
- Inspired by [Neo4j Browser](https://neo4j.com/developer/neo4j-browser/)
- Uses [Tailwind CSS](https://tailwindcss.com/) for styling
- Icons by [Lucide](https://lucide.dev/)

## 📚 Resources

- [Neo4j Documentation](https://neo4j.com/docs/)
- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
