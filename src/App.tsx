import React, { useState, useRef, useEffect, useCallback } from "react";
import { Moon, Sun } from "lucide-react";
import type {
  Node,
  Edge,
  ContextMenuState,
  Position,
  SchemaModel,
} from "./types";
import { DEFAULT_NODE_COLORS } from "./constants";
import { useSchemaState } from "./hooks/useSchemaState";
import { useCanvasState } from "./hooks/useCanvasState";
import { getThemeClasses, generateCypher, downloadFile } from "./utils";
import {
  Toolbar,
  Canvas,
  PropertiesPanel,
  ContextMenu,
  ConfirmDialog,
  NodeDetailsDialog,
  ColorPickerDialog,
} from "./components";

interface Neo4jSchemaModelerProps {
  initialData?: SchemaModel;
  darkMode?: boolean;
  onSchemaChange?: (schema: SchemaModel) => void;
}

const Neo4jSchemaModeler: React.FC<Neo4jSchemaModelerProps> = ({
  initialData,
  darkMode = false,
  onSchemaChange,
}) => {
  // Schema state
  const schema = useSchemaState();

  // Canvas state
  const canvas = useCanvasState();

  // Local state
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionSourceId, setConnectionSourceId] = useState<string | null>(
    null
  );
  const [mousePos, setMousePos] = useState<Position>({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // Dialog state
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [detailsNodeId, setDetailsNodeId] = useState<string | null>(null);
  const [colorPickerTarget, setColorPickerTarget] = useState<{
    type: "node" | "edge";
    id: string;
  } | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Theme
  const theme = getThemeClasses(darkMode);

  // Initialize with data
  useEffect(() => {
    if (initialData) {
      schema.loadSchema(initialData.nodes, initialData.edges);
    } else {
      // Sample data
      const sampleNodes: Node[] = [
        {
          id: "1",
          x: 200,
          y: 200,
          data: {
            label: "Person",
            properties: [
              { name: "id", type: "String", required: true, unique: true },
              { name: "name", type: "String", required: true },
              { name: "email", type: "String", unique: true },
            ],
            color: DEFAULT_NODE_COLORS[0],
            definition: "Represents a person in the system",
          },
        },
        {
          id: "2",
          x: 550,
          y: 200,
          data: {
            label: "Company",
            properties: [
              { name: "name", type: "String", required: true },
              { name: "founded", type: "Date" },
            ],
            color: DEFAULT_NODE_COLORS[1],
            definition: "Represents a company or organization",
          },
        },
      ];
      const sampleEdges: Edge[] = [
        {
          id: "e1",
          source: "1",
          target: "2",
          data: {
            relationshipType: "WORKS_AT",
            properties: [
              { name: "since", type: "Date" },
              { name: "role", type: "String" },
            ],
            color: "#6b7280",
          },
        },
      ];
      schema.loadSchema(sampleNodes, sampleEdges);
    }
  }, []);

  // Notify parent of schema changes
  useEffect(() => {
    onSchemaChange?.({ nodes: schema.nodes, edges: schema.edges });
  }, [schema.nodes, schema.edges, onSchemaChange]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        if (canvas.selectedNodeId) {
          schema.deleteNode(canvas.selectedNodeId);
          canvas.selectNode(null);
        } else if (canvas.selectedEdgeId) {
          schema.deleteEdge(canvas.selectedEdgeId);
          canvas.selectEdge(null);
        }
      } else if (e.key === "Escape") {
        canvas.clearSelection();
        setContextMenu(null);
        setDetailsNodeId(null);
        setColorPickerTarget(null);
        setIsConnecting(false);
        setConnectionSourceId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canvas.selectedNodeId, canvas.selectedEdgeId, schema, canvas]);

  // Screen to canvas conversion
  const screenToCanvas = useCallback(
    (clientX: number, clientY: number): Position => {
      const rect = canvas.canvasRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return {
        x: (clientX - rect.left - canvas.panOffset.x) / canvas.zoom,
        y: (clientY - rect.top - canvas.panOffset.y) / canvas.zoom,
      };
    },
    [canvas.panOffset, canvas.zoom, canvas.canvasRef]
  );

  // Canvas event handlers
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      setContextMenu(null);
      canvas.startPan(e.clientX, e.clientY);
      canvas.clearSelection();
    },
    [canvas]
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const pos = screenToCanvas(e.clientX, e.clientY);
      setMousePos(pos);

      if (isDragging && draggedNodeId) {
        schema.updateNodePosition(draggedNodeId, pos.x, pos.y);
      } else if (canvas.isPanning && !isConnecting) {
        canvas.updatePan(e.clientX, e.clientY);
      }
    },
    [
      isDragging,
      draggedNodeId,
      canvas.isPanning,
      isConnecting,
      screenToCanvas,
      schema,
      canvas,
    ]
  );

  const handleCanvasMouseUp = useCallback(
    (_e: React.MouseEvent, nodeId?: string) => {
      if (isConnecting && connectionSourceId && nodeId) {
        schema.addEdge(connectionSourceId, nodeId);
        canvas.selectEdge(schema.edges[schema.edges.length - 1]?.id || null);
      }

      setIsDragging(false);
      setDraggedNodeId(null);
      setIsConnecting(false);
      setConnectionSourceId(null);
      canvas.endPan();
    },
    [isConnecting, connectionSourceId, schema, canvas]
  );

  const handleCanvasWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      canvas.handleWheel(e.deltaY);
    },
    [canvas]
  );

  const handleCanvasContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const rect = canvas.canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setContextMenu({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          type: "canvas",
        });
      }
    },
    [canvas.canvasRef]
  );

  // Node event handlers
  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation();
      if (e.button !== 0) return;

      setContextMenu(null);
      setIsDragging(true);
      setDraggedNodeId(nodeId);
      canvas.selectNode(nodeId);
    },
    [canvas]
  );

  const handleNodeMouseUp = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation();
      handleCanvasMouseUp(e, nodeId);
    },
    [handleCanvasMouseUp]
  );

  const handleNodeContextMenu = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = canvas.canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setContextMenu({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          type: "node",
          targetId: nodeId,
        });
      }
    },
    [canvas.canvasRef]
  );

  const handleConnectionStart = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation();
      e.preventDefault();
      setIsConnecting(true);
      setConnectionSourceId(nodeId);
      setIsDragging(false);
      setDraggedNodeId(null);
    },
    []
  );

  // Edge event handlers
  const handleEdgeClick = useCallback(
    (e: React.MouseEvent, edgeId: string) => {
      e.stopPropagation();
      canvas.selectEdge(edgeId);
      setContextMenu(null);
    },
    [canvas]
  );

  const handleEdgeContextMenu = useCallback(
    (e: React.MouseEvent, edgeId: string) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = canvas.canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setContextMenu({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          type: "edge",
          targetId: edgeId,
        });
      }
    },
    [canvas.canvasRef]
  );

  // Export functions
  const exportAsJSON = useCallback(() => {
    const data: SchemaModel = {
      nodes: schema.nodes,
      edges: schema.edges,
      metadata: {
        version: "1.0",
        exportedAt: new Date().toISOString(),
      },
    };
    downloadFile(
      JSON.stringify(data, null, 2),
      "neo4j-schema.json",
      "application/json"
    );
  }, [schema.nodes, schema.edges]);

  const exportAsCypher = useCallback(() => {
    const cypher = generateCypher(
      schema.nodes,
      schema.edges,
      schema.getNodeById
    );
    downloadFile(cypher, "neo4j-schema.cypher", "text/plain");
  }, [schema.nodes, schema.edges, schema.getNodeById]);

  const exportAsImage = useCallback(() => {
    const canvasEl = document.createElement("canvas");
    const ctx = canvasEl.getContext("2d");
    if (!ctx) return;

    // Calculate bounds to include all nodes and their properties
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    // First pass to calculate the required canvas size
    schema.nodes.forEach((node) => {
      // Account for node size and properties panel
      const nodeLeft = node.x - 120; // Extra space for properties
      const nodeRight = node.x + 320; // Width of properties panel + node
      const nodeTop = node.y - 100;
      const nodeBottom = node.y + 100;

      minX = Math.min(minX, nodeLeft);
      minY = Math.min(minY, nodeTop);
      maxX = Math.max(maxX, nodeRight);
      maxY = Math.max(maxY, nodeBottom);
    });

    const padding = 100;
    canvasEl.width = Math.max(1200, maxX - minX + padding * 2);
    canvasEl.height = Math.max(800, maxY - minY + padding * 2);

    const offsetX = -minX + padding;
    const offsetY = -minY + padding;

    // Set background
    ctx.fillStyle = darkMode ? "#1a1a2e" : "#ffffff";
    ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);

    // Draw edges first (behind nodes)
    schema.edges.forEach((edge) => {
      const source = schema.getNodeById(edge.source);
      const target = schema.getNodeById(edge.target);
      if (source && target) {
        // Draw edge line
        ctx.strokeStyle = edge.data.color || (darkMode ? "#6b7280" : "#9ca3af");
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(source.x + offsetX, source.y + offsetY);
        ctx.lineTo(target.x + offsetX, target.y + offsetY);
        ctx.stroke();

        // Draw edge label
        const midX = (source.x + target.x) / 2 + offsetX;
        const midY = (source.y + target.y) / 2 + offsetY;
        ctx.fillStyle = darkMode ? "#e5e7eb" : "#374151";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(edge.data.relationshipType, midX, midY - 8);
      }
    });

    // Draw nodes and their properties
    schema.nodes.forEach((node) => {
      const nodeX = node.x + offsetX;
      const nodeY = node.y + offsetY;
      const nodeRadius = 40;

      // Draw node circle
      ctx.fillStyle = node.data.color || (darkMode ? "#3b82f6" : "#2563eb");
      ctx.beginPath();
      ctx.arc(nodeX, nodeY, nodeRadius, 0, Math.PI * 2);
      ctx.fill();

      // Draw node border
      ctx.strokeStyle = darkMode ? "#ffffff" : "#000000";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw node label
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(node.data.label, nodeX, nodeY);

      // Draw properties container if node has properties
      if (node.data.properties && node.data.properties.length > 0) {
        // Calculate properties box size based on number of properties
        const propBoxWidth = 220;
        const propBoxHeight = 40 + node.data.properties.length * 22;
        const propBoxX = nodeX + nodeRadius + 20;
        const propBoxY = nodeY - propBoxHeight / 2;

        // Draw properties box with rounded corners
        ctx.fillStyle = darkMode ? "#2d3748" : "#f3f4f6";
        ctx.strokeStyle = darkMode ? "#4a5568" : "#d1d5db";
        ctx.lineWidth = 1;

        // Create rounded rectangle path
        const radius = 8;
        ctx.beginPath();
        ctx.moveTo(propBoxX + radius, propBoxY);
        ctx.lineTo(propBoxX + propBoxWidth - radius, propBoxY);
        ctx.quadraticCurveTo(
          propBoxX + propBoxWidth,
          propBoxY,
          propBoxX + propBoxWidth,
          propBoxY + radius
        );
        ctx.lineTo(propBoxX + propBoxWidth, propBoxY + propBoxHeight - radius);
        ctx.quadraticCurveTo(
          propBoxX + propBoxWidth,
          propBoxY + propBoxHeight,
          propBoxX + propBoxWidth - radius,
          propBoxY + propBoxHeight
        );
        ctx.lineTo(propBoxX + radius, propBoxY + propBoxHeight);
        ctx.quadraticCurveTo(
          propBoxX,
          propBoxY + propBoxHeight,
          propBoxX,
          propBoxY + propBoxHeight - radius
        );
        ctx.lineTo(propBoxX, propBoxY + radius);
        ctx.quadraticCurveTo(propBoxX, propBoxY, propBoxX + radius, propBoxY);
        ctx.closePath();

        ctx.fill();
        ctx.stroke();

        // Draw properties header with subtle bottom border
        ctx.fillStyle = darkMode ? "#4a5568" : "#e5e7eb";
        ctx.fillRect(propBoxX, propBoxY, propBoxWidth, 28);

        // Header text
        ctx.fillStyle = darkMode ? "#f3f4f6" : "#1f2937";
        ctx.font = "600 12px sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText("Properties", propBoxX + 10, propBoxY + 14);

        // Draw property items
        node.data.properties.forEach((prop, index) => {
          const propY = propBoxY + 36 + index * 20;

          // Property name and type
          ctx.fillStyle = darkMode ? "#e2e8f0" : "#1f2937";
          ctx.font = "500 11px sans-serif";
          ctx.fillText(`${prop.name}: ${prop.type}`, propBoxX + 10, propY);

          // Required/Unique indicators
          if (prop.required || prop.unique) {
            ctx.font = "bold 10px sans-serif";
            const indicators = [
              prop.required ? "R" : "",
              prop.unique ? "U" : "",
            ]
              .filter(Boolean)
              .join(" ");

            ctx.fillStyle = darkMode ? "#93c5fd" : "#3b82f6";
            ctx.textAlign = "right";
            ctx.fillText(indicators, propBoxX + propBoxWidth - 10, propY);
            ctx.textAlign = "left";
          }
        });
      }
    });

    // Create and trigger download
    canvasEl.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "neo4j-schema.png";
        a.click();
        URL.revokeObjectURL(url);
      }
    }, "image/png");
  }, [schema.nodes, schema.edges, schema.getNodeById, darkMode]);

  const importJSON = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const data = JSON.parse(ev.target?.result as string);
            schema.loadSchema(data.nodes || [], data.edges || []);
            canvas.clearSelection();
          } catch (err) {
            alert("Invalid JSON file");
          }
        };
        reader.readAsText(file);
      }
      e.target.value = "";
    },
    [schema, canvas]
  );

  // Get selected data
  const selectedNode = canvas.selectedNodeId
    ? schema.getNodeById(canvas.selectedNodeId)
    : null;
  const selectedEdge = canvas.selectedEdgeId
    ? schema.getEdgeById(canvas.selectedEdgeId)
    : null;
  const detailsNode = detailsNodeId ? schema.getNodeById(detailsNodeId) : null;

  return (
    <div className={`w-full h-full flex ${theme.bg} ${theme.text}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={importJSON}
        className="hidden"
      />

      {/* Toolbar */}
      <Toolbar
        theme={theme}
        zoom={canvas.zoom}
        onAddNode={() => {
          const node = schema.addNode({
            x: 300 - canvas.panOffset.x / canvas.zoom,
            y: 200 - canvas.panOffset.y / canvas.zoom,
          });
          canvas.selectNode(node.id);
        }}
        onExportJSON={exportAsJSON}
        onExportImage={exportAsImage}
        onExportCypher={exportAsCypher}
        onImport={() => fileInputRef.current?.click()}
        onZoomIn={canvas.zoomIn}
        onZoomOut={canvas.zoomOut}
        onResetView={canvas.resetView}
      />

      {/* Canvas */}
      <Canvas
        nodes={schema.nodes}
        edges={schema.edges}
        panOffset={canvas.panOffset}
        zoom={canvas.zoom}
        isPanning={canvas.isPanning}
        selectedNodeId={canvas.selectedNodeId}
        selectedEdgeId={canvas.selectedEdgeId}
        hoveredNodeId={canvas.hoveredNodeId}
        draggedNodeId={draggedNodeId}
        isConnecting={isConnecting}
        connectionSourceId={connectionSourceId}
        mousePos={mousePos}
        theme={theme}
        darkMode={darkMode}
        canvasRef={canvas.canvasRef}
        onCanvasMouseDown={handleCanvasMouseDown}
        onCanvasMouseMove={handleCanvasMouseMove}
        onCanvasMouseUp={(e) => handleCanvasMouseUp(e)}
        onCanvasWheel={handleCanvasWheel}
        onCanvasContextMenu={handleCanvasContextMenu}
        onNodeMouseDown={handleNodeMouseDown}
        onNodeMouseUp={handleNodeMouseUp}
        onNodeHover={canvas.setHoveredNodeId}
        onNodeContextMenu={handleNodeContextMenu}
        onConnectionStart={handleConnectionStart}
        onEdgeClick={handleEdgeClick}
        onEdgeContextMenu={handleEdgeContextMenu}
        getNodeById={schema.getNodeById}
      />

      {/* Context Menu */}
      <ContextMenu
        contextMenu={contextMenu}
        onClose={() => setContextMenu(null)}
        theme={theme}
        screenToCanvas={(x, y) => {
          const rect = canvas.canvasRef.current?.getBoundingClientRect();
          if (!rect) return { x: 0, y: 0 };
          return screenToCanvas(x + rect.left, y + rect.top);
        }}
        onAddNode={(x, y) => {
          const node = schema.addNode({ x, y });
          canvas.selectNode(node.id);
        }}
        onResetView={canvas.resetView}
        onClearCanvas={() => setShowClearConfirm(true)}
        onExportJSON={exportAsJSON}
        onExportImage={exportAsImage}
        onExportCypher={exportAsCypher}
        onImport={() => fileInputRef.current?.click()}
        onEditNode={(nodeId) => canvas.selectNode(nodeId)}
        onViewNodeDetails={(nodeId) => setDetailsNodeId(nodeId)}
        onDuplicateNode={(nodeId) => {
          const newNode = schema.duplicateNode(nodeId);
          if (newNode) canvas.selectNode(newNode.id);
        }}
        onChangeNodeColor={(nodeId) =>
          setColorPickerTarget({ type: "node", id: nodeId })
        }
        onDeleteNode={(nodeId) => {
          schema.deleteNode(nodeId);
          if (canvas.selectedNodeId === nodeId) canvas.selectNode(null);
        }}
        onEditEdge={(edgeId) => canvas.selectEdge(edgeId)}
        onReverseEdge={(edgeId) => schema.reverseEdge(edgeId)}
        onChangeEdgeColor={(edgeId) =>
          setColorPickerTarget({ type: "edge", id: edgeId })
        }
        onDeleteEdge={(edgeId) => {
          schema.deleteEdge(edgeId);
          if (canvas.selectedEdgeId === edgeId) canvas.selectEdge(null);
        }}
      />

      {/* Properties Panel */}
      <PropertiesPanel
        selectedNode={selectedNode || null}
        selectedEdge={selectedEdge || null}
        theme={theme}
        darkMode={darkMode}
        onUpdateNodeData={(nodeId, data) => {
          // Ensure propertyPanelPosition is properly merged with existing data
          schema.updateNodeData(nodeId, {
            ...data,
            propertyPanelPosition: data.propertyPanelPosition || "auto",
          });
        }}
        onAddNodeProperty={schema.addNodeProperty}
        onUpdateNodeProperty={schema.updateNodeProperty}
        onDeleteNodeProperty={schema.deleteNodeProperty}
        onDeleteNode={(nodeId) => {
          schema.deleteNode(nodeId);
          canvas.selectNode(null);
        }}
        onOpenColorPicker={(nodeId) =>
          setColorPickerTarget({ type: "node", id: nodeId })
        }
        onUpdateEdgeData={schema.updateEdgeData}
        onAddEdgeProperty={schema.addEdgeProperty}
        onUpdateEdgeProperty={schema.updateEdgeProperty}
        onDeleteEdgeProperty={schema.deleteEdgeProperty}
        onReverseEdge={schema.reverseEdge}
        onDeleteEdge={(edgeId) => {
          schema.deleteEdge(edgeId);
          canvas.selectEdge(null);
        }}
        onOpenEdgeColorPicker={(edgeId) =>
          setColorPickerTarget({ type: "edge", id: edgeId })
        }
      />

      {/* Clear Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={() => {
          schema.clearAll();
          canvas.clearSelection();
        }}
        title="Clear Canvas"
        message="Are you sure you want to clear the entire canvas? This will delete all nodes and relationships and cannot be undone."
        confirmText="Clear All"
        variant="danger"
        theme={theme}
        darkMode={darkMode}
      />

      {/* Node Details Dialog */}
      <NodeDetailsDialog
        isOpen={!!detailsNodeId}
        onClose={() => setDetailsNodeId(null)}
        node={detailsNode || null}
        edges={schema.edges}
        getNodeById={schema.getNodeById}
        theme={theme}
        darkMode={darkMode}
      />

      {/* Color Picker Dialog */}
      <ColorPickerDialog
        isOpen={!!colorPickerTarget}
        onClose={() => setColorPickerTarget(null)}
        currentColor={
          colorPickerTarget?.type === "node"
            ? schema.getNodeById(colorPickerTarget.id)?.data.color || "#FF6B6B"
            : colorPickerTarget?.type === "edge"
            ? schema.getEdgeById(colorPickerTarget.id)?.data.color || "#6b7280"
            : "#FF6B6B"
        }
        onSelect={(color) => {
          if (colorPickerTarget?.type === "node") {
            schema.updateNodeData(colorPickerTarget.id, { color });
          } else if (colorPickerTarget?.type === "edge") {
            schema.updateEdgeData(colorPickerTarget.id, { color });
          }
        }}
        title={
          colorPickerTarget?.type === "node"
            ? "Node Color"
            : "Relationship Color"
        }
        theme={theme}
        darkMode={darkMode}
      />
    </div>
  );
};

// App wrapper with theme toggle
export default function App() {
  const [darkMode, setDarkMode] = useState(true);

  return (
    <div className="w-full h-screen">
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg border transition-colors ${
            darkMode
              ? "bg-gray-800 text-white hover:bg-gray-700 border-gray-700"
              : "bg-white text-gray-900 hover:bg-gray-100 border-gray-200"
          }`}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          {darkMode ? "Light" : "Dark"}
        </button>
      </div>
      <Neo4jSchemaModeler darkMode={darkMode} />
    </div>
  );
}
