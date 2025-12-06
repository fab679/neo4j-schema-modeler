import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  Toolbar,
  Canvas,
  PropertiesPanel,
  ContextMenu,
  ConfirmDialog,
  NodeDetailsDialog,
  ColorPickerDialog,
} from "./components";
import { useSchemaState, useCanvasState } from "./hooks";
import {
  getThemeClasses,
  generateCypher,
  downloadFile,
  calculatePanelPosition,
} from "./utils";
import type { ContextMenuState, Position, Node, Edge } from "./types";
import { NODE_RADIUS } from "./constants";

const App: React.FC = () => {
  // Theme state
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("neo4j-modeler-dark-mode");
    return saved ? JSON.parse(saved) : true;
  });
  const theme = getThemeClasses(darkMode);

  // Schema state (nodes & edges) - start with empty canvas
  const schema = useSchemaState();
  const {
    nodes,
    edges,
    getNodeById,
    getEdgeById,
    addNode,
    updateNodeData,
    updateNodePosition,
    deleteNode,
    duplicateNode,
    addEdge,
    updateEdgeData,
    deleteEdge,
    reverseEdge,
    addNodeProperty,
    updateNodeProperty,
    deleteNodeProperty,
    addEdgeProperty,
    updateEdgeProperty,
    deleteEdgeProperty,
    clearAll,
    loadSchema,
  } = schema;

  // Canvas state (pan, zoom, selection)
  const canvas = useCanvasState();
  const {
    canvasRef,
    panOffset,
    zoom,
    isPanning,
    selectedNodeId,
    selectedEdgeId,
    hoveredNodeId,
    selectNode,
    selectEdge,
    clearSelection,
    setHoveredNodeId,
    startPan,
    updatePan,
    endPan,
    zoomIn,
    zoomOut,
    handleWheel,
    resetView,
    screenToCanvas,
  } = canvas;

  // Interaction state
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionSourceId, setConnectionSourceId] = useState<string | null>(
    null
  );
  const [mousePos, setMousePos] = useState<Position>({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // Dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: "danger" | "warning" | "info";
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });

  const [nodeDetailsDialog, setNodeDetailsDialog] = useState<{
    isOpen: boolean;
    nodeId: string | null;
  }>({ isOpen: false, nodeId: null });

  const [colorPickerDialog, setColorPickerDialog] = useState<{
    isOpen: boolean;
    targetType: "node" | "edge";
    targetId: string | null;
    currentColor: string;
  }>({
    isOpen: false,
    targetType: "node",
    targetId: null,
    currentColor: "#FF6B6B",
  });

  // Refs
  const dragStartRef = useRef<Position>({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persist dark mode
  useEffect(() => {
    localStorage.setItem("neo4j-modeler-dark-mode", JSON.stringify(darkMode));
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // Selected items
  const selectedNode = selectedNodeId ? getNodeById(selectedNodeId) : null;
  const selectedEdge = selectedEdgeId ? getEdgeById(selectedEdgeId) : null;

  // ============ Canvas Event Handlers ============

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 2) return;

      setContextMenu(null);

      if (e.button === 0 && !draggedNodeId) {
        clearSelection();
        startPan(e.clientX, e.clientY);
      }
    },
    [clearSelection, startPan, draggedNodeId]
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      setMousePos(canvasPos);

      if (draggedNodeId) {
        updateNodePosition(draggedNodeId, canvasPos.x, canvasPos.y);
      } else if (isPanning) {
        updatePan(e.clientX, e.clientY);
      }
    },
    [draggedNodeId, isPanning, screenToCanvas, updateNodePosition, updatePan]
  );

  const handleCanvasMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (isConnecting && connectionSourceId && hoveredNodeId) {
        addEdge(connectionSourceId, hoveredNodeId);
      }

      setDraggedNodeId(null);
      setIsConnecting(false);
      setConnectionSourceId(null);
      endPan();
    },
    [isConnecting, connectionSourceId, hoveredNodeId, addEdge, endPan]
  );

  const handleCanvasWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      handleWheel(e.deltaY, e.shiftKey);
    },
    [handleWheel]
  );

  const handleCanvasContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: "canvas",
    });
  }, []);

  // ============ Node Event Handlers ============

  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation();
      if (e.button !== 0) return;

      selectNode(nodeId);
      setDraggedNodeId(nodeId);

      const node = getNodeById(nodeId);
      if (node) {
        dragStartRef.current = { x: node.x, y: node.y };
      }
    },
    [selectNode, getNodeById]
  );

  const handleNodeMouseUp = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      if (isConnecting && connectionSourceId) {
        addEdge(connectionSourceId, nodeId);
        setIsConnecting(false);
        setConnectionSourceId(null);
      }
      setDraggedNodeId(null);
    },
    [isConnecting, connectionSourceId, addEdge]
  );

  const handleNodeDoubleClick = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation();
      setNodeDetailsDialog({ isOpen: true, nodeId });
    },
    []
  );

  const handleNodeContextMenu = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.preventDefault();
      e.stopPropagation();
      selectNode(nodeId);
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        type: "node",
        targetId: nodeId,
      });
    },
    [selectNode]
  );

  const handleConnectionStart = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation();
      setIsConnecting(true);
      setConnectionSourceId(nodeId);
    },
    []
  );

  // ============ Edge Event Handlers ============

  const handleEdgeClick = useCallback(
    (e: React.MouseEvent, edgeId: string) => {
      e.stopPropagation();
      selectEdge(edgeId);
    },
    [selectEdge]
  );

  const handleEdgeContextMenu = useCallback(
    (e: React.MouseEvent, edgeId: string) => {
      e.preventDefault();
      e.stopPropagation();
      selectEdge(edgeId);
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        type: "edge",
        targetId: edgeId,
      });
    },
    [selectEdge]
  );

  // ============ Keyboard Shortcuts ============

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedNodeId) {
          setConfirmDialog({
            isOpen: true,
            title: "Delete Node",
            message:
              "Are you sure you want to delete this node and all its relationships?",
            variant: "danger",
            onConfirm: () => {
              deleteNode(selectedNodeId);
              clearSelection();
            },
          });
        } else if (selectedEdgeId) {
          deleteEdge(selectedEdgeId);
          clearSelection();
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        if (selectedNodeId) {
          const newNode = duplicateNode(selectedNodeId);
          if (newNode) {
            selectNode(newNode.id);
          }
        }
      }

      if (e.key === "Escape") {
        clearSelection();
        setContextMenu(null);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        setNodeDetailsDialog({ isOpen: false, nodeId: null });
        setColorPickerDialog((prev) => ({ ...prev, isOpen: false }));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedNodeId,
    selectedEdgeId,
    deleteNode,
    deleteEdge,
    duplicateNode,
    selectNode,
    clearSelection,
  ]);

  // ============ Toolbar Actions ============

  const handleAddNode = useCallback(() => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = (rect.width / 2 - panOffset.x) / zoom;
    const centerY = (rect.height / 2 - panOffset.y) / zoom;

    const newNode = addNode({ x: centerX, y: centerY });
    selectNode(newNode.id);
  }, [canvasRef, panOffset, zoom, addNode, selectNode]);

  const handleAddNodeAtPosition = useCallback(
    (x: number, y: number) => {
      const newNode = addNode({ x, y });
      selectNode(newNode.id);
    },
    [addNode, selectNode]
  );

  const handleClearCanvas = useCallback(() => {
    setConfirmDialog({
      isOpen: true,
      title: "Clear Canvas",
      message: "This will delete all nodes and relationships. Are you sure?",
      variant: "danger",
      onConfirm: () => {
        clearAll();
        resetView();
        clearSelection();
      },
    });
  }, [clearAll, resetView, clearSelection]);

  // ============ Export Functions ============

  const handleExportJSON = useCallback(() => {
    const data = {
      nodes,
      edges,
      metadata: {
        version: "2.1",
        exportedAt: new Date().toISOString(),
        name: "Neo4j Schema",
      },
    };
    downloadFile(
      JSON.stringify(data, null, 2),
      "neo4j-schema.json",
      "application/json"
    );
  }, [nodes, edges]);

  const handleExportCypher = useCallback(() => {
    const cypher = generateCypher(nodes, edges, getNodeById);
    downloadFile(cypher, "neo4j-schema.cypher", "text/plain");
  }, [nodes, edges, getNodeById]);

  const handleExportImage = useCallback(() => {
    if (!canvasRef.current) return;
    if (nodes.length === 0) {
      alert("Nothing to export. Add some nodes first.");
      return;
    }

    const PADDING = 80;
    const PANEL_WIDTH = 280;
    const PANEL_HEIGHT = 200;
    const EDGE_PROP_PANEL_WIDTH = 150;
    const EDGE_PROP_PANEL_HEIGHT = 120;

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    // Calculate bounds for nodes
    nodes.forEach((node) => {
      const nodeLeft = node.x - NODE_RADIUS;
      const nodeRight = node.x + NODE_RADIUS;
      const nodeTop = node.y - NODE_RADIUS;
      const nodeBottom = node.y + NODE_RADIUS;

      minX = Math.min(minX, nodeLeft);
      maxX = Math.max(maxX, nodeRight);
      minY = Math.min(minY, nodeTop);
      maxY = Math.max(maxY, nodeBottom);

      if (node.data.properties.length > 0) {
        const panelPos = calculatePanelPosition(
          node.x,
          node.y,
          node.id,
          nodes,
          node.data.propertyPanelPosition
        );

        const panelLeft = node.x - NODE_RADIUS + panelPos.left;
        const panelRight = panelLeft + PANEL_WIDTH;
        const panelTop = node.y - NODE_RADIUS + panelPos.top;
        const panelBottom = panelTop + PANEL_HEIGHT;

        minX = Math.min(minX, panelLeft);
        maxX = Math.max(maxX, panelRight);
        minY = Math.min(minY, panelTop);
        maxY = Math.max(maxY, panelBottom);
      }
    });

    // Calculate bounds for edges (including self-loops and property panels)
    edges.forEach((edge) => {
      const source = getNodeById(edge.source);
      const target = getNodeById(edge.target);
      if (!source || !target) return;

      if (edge.source === edge.target) {
        minX = Math.min(minX, source.x - 160);
        maxX = Math.max(maxX, source.x + 160);
        minY = Math.min(minY, source.y - 200);
        maxY = Math.max(maxY, source.y + 160);
      } else {
        const midX = (source.x + target.x) / 2;
        const midY = (source.y + target.y) / 2;

        if (edge.data.properties.length > 0) {
          minX = Math.min(minX, midX - EDGE_PROP_PANEL_WIDTH);
          maxX = Math.max(maxX, midX + EDGE_PROP_PANEL_WIDTH);
          minY = Math.min(minY, midY - EDGE_PROP_PANEL_HEIGHT);
          maxY = Math.max(maxY, midY + EDGE_PROP_PANEL_HEIGHT);
        }
      }
    });

    const width = maxX - minX + PADDING * 2;
    const height = maxY - minY + PADDING * 2;

    const canvas = document.createElement("canvas");
    canvas.width = width * 2;
    canvas.height = height * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(2, 2);

    // Background
    ctx.fillStyle = darkMode ? "#111827" : "#f9fafb";
    ctx.fillRect(0, 0, width, height);

    // Grid
    ctx.fillStyle = darkMode ? "#374151" : "#d1d5db";
    for (let x = 0; x < width; x += 24) {
      for (let y = 0; y < height; y += 24) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const offsetX = PADDING - minX;
    const offsetY = PADDING - minY;

    // Helper function to draw edge property panel
    const drawEdgePropertyPanel = (
      edge: Edge,
      labelX: number,
      labelY: number,
      perpX: number,
      perpY: number
    ) => {
      if (edge.data.properties.length === 0) return;

      const panelWidth = 140;
      const rowHeight = 16;
      const headerHeight = 22;
      const paddingY = 8;
      const propsToShow = edge.data.properties.slice(0, 4);
      const panelHeight =
        headerHeight + propsToShow.length * rowHeight + paddingY;

      const labelStyle = edge.data.labelStyle || "top";

      let panelOffsetDistance = 0;
      if (labelStyle === "top") {
        panelOffsetDistance = 50;
      } else if (labelStyle === "bottom") {
        panelOffsetDistance = -50;
      } else {
        panelOffsetDistance = 45;
      }

      const panelX = labelX;
      const panelY = labelY + perpY * panelOffsetDistance;

      ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 2;

      ctx.fillStyle = darkMode ? "#1f2937" : "#ffffff";
      ctx.beginPath();
      ctx.roundRect(
        panelX - panelWidth / 2,
        panelY - panelHeight / 2,
        panelWidth,
        panelHeight,
        6
      );
      ctx.fill();

      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      ctx.strokeStyle = darkMode ? "#374151" : "#e5e7eb";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = darkMode ? "#9ca3af" : "#6b7280";
      ctx.font = "600 8px 'Google Sans', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(
        "PROPERTIES",
        panelX - panelWidth / 2 + 8,
        panelY - panelHeight / 2 + 14
      );

      ctx.strokeStyle = darkMode ? "#374151" : "#e5e7eb";
      ctx.beginPath();
      ctx.moveTo(
        panelX - panelWidth / 2 + 6,
        panelY - panelHeight / 2 + headerHeight
      );
      ctx.lineTo(
        panelX + panelWidth / 2 - 6,
        panelY - panelHeight / 2 + headerHeight
      );
      ctx.stroke();

      propsToShow.forEach((prop, idx) => {
        const propY =
          panelY -
          panelHeight / 2 +
          headerHeight +
          4 +
          idx * rowHeight +
          rowHeight / 2;

        ctx.fillStyle = darkMode ? "#e5e7eb" : "#374151";
        ctx.font = "500 9px 'Google Sans', sans-serif";
        ctx.textAlign = "left";
        const propName =
          prop.name.length > 10 ? prop.name.slice(0, 10) + "…" : prop.name;
        ctx.fillText(propName, panelX - panelWidth / 2 + 8, propY);

        ctx.fillStyle = darkMode ? "#6b7280" : "#9ca3af";
        ctx.font = "400 8px 'Google Sans', sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(prop.type, panelX + panelWidth / 2 - 8, propY);
      });

      if (edge.data.properties.length > 4) {
        ctx.fillStyle = darkMode ? "#6b7280" : "#9ca3af";
        ctx.font = "italic 8px 'Google Sans', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(
          `+${edge.data.properties.length - 4} more`,
          panelX,
          panelY + panelHeight / 2 - 6
        );
      }
    };

    // Draw edges
    edges.forEach((edge) => {
      const source = getNodeById(edge.source);
      const target = getNodeById(edge.target);
      if (!source || !target) return;

      const sx = source.x + offsetX;
      const sy = source.y + offsetY;
      const tx = target.x + offsetX;
      const ty = target.y + offsetY;

      ctx.strokeStyle = edge.data.color || "#6b7280";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";

      if (edge.source === edge.target) {
        const loopSize = 80;
        const baseAngle = -Math.PI / 2;
        const arcSpread = 0.55;
        const startAngle = baseAngle - arcSpread;
        const endAngle = baseAngle + arcSpread;

        const startX = sx + Math.cos(startAngle) * NODE_RADIUS;
        const startY = sy + Math.sin(startAngle) * NODE_RADIUS;
        const endX = sx + Math.cos(endAngle) * NODE_RADIUS;
        const endY = sy + Math.sin(endAngle) * NODE_RADIUS;

        const cx = sx + Math.cos(baseAngle) * loopSize * 1.8;
        const cy = sy + Math.sin(baseAngle) * loopSize * 1.8;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(cx, cy, endX, endY);
        ctx.stroke();

        const arrowSize = 8;
        const arrowAngle = endAngle + Math.PI / 2;
        ctx.fillStyle = edge.data.color || "#6b7280";
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - arrowSize * Math.cos(arrowAngle - Math.PI / 6),
          endY - arrowSize * Math.sin(arrowAngle - Math.PI / 6)
        );
        ctx.lineTo(
          endX - arrowSize * Math.cos(arrowAngle + Math.PI / 6),
          endY - arrowSize * Math.sin(arrowAngle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();

        const labelDistance = loopSize * 1.15;
        const labelX = sx + Math.cos(baseAngle) * labelDistance;
        const labelY = sy + Math.sin(baseAngle) * labelDistance;

        const perpX = Math.cos(baseAngle);
        const perpY = Math.sin(baseAngle);

        const labelStyle = edge.data.labelStyle || "top";
        let labelOffsetDist = 0;
        if (labelStyle === "top") labelOffsetDist = -18;
        else if (labelStyle === "bottom") labelOffsetDist = 18;

        const finalLabelX = labelX + perpX * labelOffsetDist;
        const finalLabelY = labelY + perpY * labelOffsetDist;

        ctx.font = "bold 11px 'Google Sans', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const labelWidth =
          ctx.measureText(edge.data.relationshipType).width + 14;
        ctx.fillStyle = darkMode ? "#1f2937" : "#ffffff";
        ctx.beginPath();
        ctx.roundRect(
          finalLabelX - labelWidth / 2,
          finalLabelY - 10,
          labelWidth,
          20,
          4
        );
        ctx.fill();
        ctx.strokeStyle = darkMode ? "#374151" : "#e5e7eb";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = darkMode ? "#e5e7eb" : "#374151";
        ctx.fillText(edge.data.relationshipType, finalLabelX, finalLabelY);

        drawEdgePropertyPanel(edge, labelX, labelY, perpX, perpY);
      } else {
        const dx = tx - sx;
        const dy = ty - sy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        const startX = sx + Math.cos(angle) * NODE_RADIUS;
        const startY = sy + Math.sin(angle) * NODE_RADIUS;
        const endX = tx - Math.cos(angle) * NODE_RADIUS;
        const endY = ty - Math.sin(angle) * NODE_RADIUS;

        ctx.strokeStyle = edge.data.color || "#6b7280";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        const arrowSize = 10;
        ctx.fillStyle = edge.data.color || "#6b7280";
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - arrowSize * Math.cos(angle - Math.PI / 6),
          endY - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          endX - arrowSize * Math.cos(angle + Math.PI / 6),
          endY - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();

        const perpX = dist > 0 ? -dy / dist : 0;
        const perpY = dist > 0 ? dx / dist : -1;

        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;

        const labelStyle = edge.data.labelStyle || "top";
        let labelOffsetDist = 0;
        if (labelStyle === "top") labelOffsetDist = -18;
        else if (labelStyle === "bottom") labelOffsetDist = 18;

        const labelX = midX + perpX * labelOffsetDist;
        const labelY = midY + perpY * labelOffsetDist;

        ctx.font = "bold 11px 'Google Sans', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const labelWidth =
          ctx.measureText(edge.data.relationshipType).width + 14;
        ctx.fillStyle = darkMode ? "#1f2937" : "#ffffff";
        ctx.beginPath();
        ctx.roundRect(labelX - labelWidth / 2, labelY - 10, labelWidth, 20, 4);
        ctx.fill();

        if (labelStyle !== "inline") {
          ctx.strokeStyle = darkMode ? "#374151" : "#e5e7eb";
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        ctx.fillStyle =
          labelStyle === "inline"
            ? edge.data.color || (darkMode ? "#d1d5db" : "#4b5563")
            : darkMode
            ? "#e5e7eb"
            : "#374151";
        ctx.fillText(edge.data.relationshipType, labelX, labelY);

        drawEdgePropertyPanel(edge, midX, midY, perpX, perpY);
      }
    });

    // Draw nodes
    nodes.forEach((node) => {
      const cx = node.x + offsetX;
      const cy = node.y + offsetY;

      ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 4;

      ctx.fillStyle = node.data.color;
      ctx.beginPath();
      ctx.arc(cx, cy, NODE_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 14px 'Google Sans', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(node.data.label, cx, cy);

      if (node.data.properties.length > 0) {
        const panelPos = calculatePanelPosition(
          node.x,
          node.y,
          node.id,
          nodes,
          node.data.propertyPanelPosition
        );

        const panelX = cx - NODE_RADIUS + panelPos.left;
        const panelY = cy - NODE_RADIUS + panelPos.top;
        const panelW = 200;
        const rowHeight = 22;
        const headerHeight = 28;
        const panelH =
          headerHeight +
          Math.min(node.data.properties.length, 5) * rowHeight +
          12;

        ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 2;

        ctx.fillStyle = darkMode ? "#1f2937" : "#ffffff";
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelW, panelH, 10);
        ctx.fill();

        ctx.shadowColor = "transparent";

        ctx.strokeStyle = darkMode ? "#374151" : "#e5e7eb";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = darkMode ? "#9ca3af" : "#6b7280";
        ctx.font = "600 9px 'Google Sans', sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("PROPERTIES", panelX + 10, panelY + 16);

        ctx.strokeStyle = darkMode ? "#374151" : "#e5e7eb";
        ctx.beginPath();
        ctx.moveTo(panelX + 10, panelY + 26);
        ctx.lineTo(panelX + panelW - 10, panelY + 26);
        ctx.stroke();

        const propsToShow = node.data.properties.slice(0, 5);
        propsToShow.forEach((prop, idx) => {
          const propY = panelY + headerHeight + idx * rowHeight + 12;

          ctx.fillStyle = darkMode ? "#e5e7eb" : "#374151";
          ctx.font = "500 11px 'Google Sans', sans-serif";
          ctx.textAlign = "left";
          ctx.fillText(prop.name, panelX + 10, propY);

          ctx.fillStyle = darkMode ? "#9ca3af" : "#6b7280";
          ctx.font = "400 9px 'Google Sans', sans-serif";
          ctx.textAlign = "right";
          ctx.fillText(prop.type, panelX + panelW - 10, propY);
        });

        if (node.data.properties.length > 5) {
          const moreY = panelY + headerHeight + 5 * rowHeight + 12;
          ctx.fillStyle = darkMode ? "#6b7280" : "#9ca3af";
          ctx.font = "italic 10px 'Google Sans', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(
            `+${node.data.properties.length - 5} more...`,
            panelX + panelW / 2,
            moreY
          );
        }
      }
    });

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "neo4j-schema.png";
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }, [nodes, edges, getNodeById, darkMode, canvasRef]);

  // ============ Import Function ============

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (data.nodes && data.edges) {
            setConfirmDialog({
              isOpen: true,
              title: "Import Schema",
              message:
                "This will replace your current schema. Do you want to continue?",
              variant: "warning",
              onConfirm: () => {
                loadSchema(data.nodes, data.edges);
                resetView();
              },
            });
          } else {
            alert("Invalid schema file format");
          }
        } catch (err) {
          alert("Failed to parse JSON file");
        }
      };
      reader.readAsText(file);

      e.target.value = "";
    },
    [loadSchema, resetView]
  );

  // ============ Context Menu Actions ============

  const handleDeleteNodeFromMenu = useCallback(
    (nodeId: string) => {
      setConfirmDialog({
        isOpen: true,
        title: "Delete Node",
        message:
          "Are you sure you want to delete this node and all its relationships?",
        variant: "danger",
        onConfirm: () => {
          deleteNode(nodeId);
          clearSelection();
        },
      });
    },
    [deleteNode, clearSelection]
  );

  const handleDuplicateNodeFromMenu = useCallback(
    (nodeId: string) => {
      const newNode = duplicateNode(nodeId);
      if (newNode) {
        selectNode(newNode.id);
      }
    },
    [duplicateNode, selectNode]
  );

  const handleViewNodeDetails = useCallback((nodeId: string) => {
    setNodeDetailsDialog({ isOpen: true, nodeId });
  }, []);

  const handleOpenNodeColorPicker = useCallback(
    (nodeId: string) => {
      const node = getNodeById(nodeId);
      if (node) {
        setColorPickerDialog({
          isOpen: true,
          targetType: "node",
          targetId: nodeId,
          currentColor: node.data.color,
        });
      }
    },
    [getNodeById]
  );

  const handleOpenEdgeColorPicker = useCallback(
    (edgeId: string) => {
      const edge = getEdgeById(edgeId);
      if (edge) {
        setColorPickerDialog({
          isOpen: true,
          targetType: "edge",
          targetId: edgeId,
          currentColor: edge.data.color,
        });
      }
    },
    [getEdgeById]
  );

  const handleColorSelect = useCallback(
    (color: string) => {
      if (
        colorPickerDialog.targetType === "node" &&
        colorPickerDialog.targetId
      ) {
        updateNodeData(colorPickerDialog.targetId, { color });
      } else if (
        colorPickerDialog.targetType === "edge" &&
        colorPickerDialog.targetId
      ) {
        updateEdgeData(colorPickerDialog.targetId, { color });
      }
    },
    [colorPickerDialog, updateNodeData, updateEdgeData]
  );

  const handleDeleteEdgeFromMenu = useCallback(
    (edgeId: string) => {
      deleteEdge(edgeId);
      clearSelection();
    },
    [deleteEdge, clearSelection]
  );

  // ============ Render ============

  return (
    <div className={`h-screen flex flex-col ${theme.bg} overflow-hidden`}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileImport}
      />

      <Toolbar
        theme={theme}
        zoom={zoom}
        darkMode={darkMode}
        onAddNode={handleAddNode}
        onExportJSON={handleExportJSON}
        onExportImage={handleExportImage}
        onExportCypher={handleExportCypher}
        onImport={handleImport}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetView={resetView}
        onClearCanvas={handleClearCanvas}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />

      <div className="flex-1 flex overflow-hidden">
        <Canvas
          nodes={nodes}
          edges={edges}
          panOffset={panOffset}
          zoom={zoom}
          isPanning={isPanning}
          selectedNodeId={selectedNodeId}
          selectedEdgeId={selectedEdgeId}
          hoveredNodeId={hoveredNodeId}
          draggedNodeId={draggedNodeId}
          isConnecting={isConnecting}
          connectionSourceId={connectionSourceId}
          mousePos={mousePos}
          theme={theme}
          darkMode={darkMode}
          canvasRef={canvasRef}
          onCanvasMouseDown={handleCanvasMouseDown}
          onCanvasMouseMove={handleCanvasMouseMove}
          onCanvasMouseUp={handleCanvasMouseUp}
          onCanvasWheel={handleCanvasWheel}
          onCanvasContextMenu={handleCanvasContextMenu}
          onNodeMouseDown={handleNodeMouseDown}
          onNodeMouseUp={handleNodeMouseUp}
          onNodeDoubleClick={handleNodeDoubleClick}
          onNodeHover={setHoveredNodeId}
          onNodeContextMenu={handleNodeContextMenu}
          onConnectionStart={handleConnectionStart}
          onEdgeClick={handleEdgeClick}
          onEdgeContextMenu={handleEdgeContextMenu}
          getNodeById={getNodeById}
        />

        <PropertiesPanel
          selectedNode={selectedNode ?? null}
          selectedEdge={selectedEdge ?? null}
          theme={theme}
          darkMode={darkMode}
          onUpdateNodeData={updateNodeData}
          onAddNodeProperty={addNodeProperty}
          onUpdateNodeProperty={updateNodeProperty}
          onDeleteNodeProperty={deleteNodeProperty}
          onDeleteNode={handleDeleteNodeFromMenu}
          onOpenColorPicker={handleOpenNodeColorPicker}
          onUpdateEdgeData={updateEdgeData}
          onAddEdgeProperty={addEdgeProperty}
          onUpdateEdgeProperty={updateEdgeProperty}
          onDeleteEdgeProperty={deleteEdgeProperty}
          onReverseEdge={reverseEdge}
          onDeleteEdge={handleDeleteEdgeFromMenu}
          onOpenEdgeColorPicker={handleOpenEdgeColorPicker}
        />
      </div>

      <ContextMenu
        contextMenu={contextMenu}
        onClose={() => setContextMenu(null)}
        theme={theme}
        screenToCanvas={screenToCanvas}
        onAddNode={handleAddNodeAtPosition}
        onResetView={resetView}
        onClearCanvas={handleClearCanvas}
        onExportJSON={handleExportJSON}
        onExportImage={handleExportImage}
        onExportCypher={handleExportCypher}
        onImport={handleImport}
        onEditNode={(nodeId) => selectNode(nodeId)}
        onViewNodeDetails={handleViewNodeDetails}
        onDuplicateNode={handleDuplicateNodeFromMenu}
        onChangeNodeColor={handleOpenNodeColorPicker}
        onDeleteNode={handleDeleteNodeFromMenu}
        onEditEdge={(edgeId) => selectEdge(edgeId)}
        onReverseEdge={reverseEdge}
        onChangeEdgeColor={handleOpenEdgeColorPicker}
        onDeleteEdge={handleDeleteEdgeFromMenu}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        theme={theme}
        darkMode={darkMode}
      />

      <NodeDetailsDialog
        isOpen={nodeDetailsDialog.isOpen}
        onClose={() => setNodeDetailsDialog({ isOpen: false, nodeId: null })}
        node={
          nodeDetailsDialog.nodeId
            ? getNodeById(nodeDetailsDialog.nodeId) ?? null
            : null
        }
        edges={edges}
        getNodeById={getNodeById}
        theme={theme}
        darkMode={darkMode}
      />

      <ColorPickerDialog
        isOpen={colorPickerDialog.isOpen}
        onClose={() =>
          setColorPickerDialog((prev) => ({ ...prev, isOpen: false }))
        }
        onSelect={handleColorSelect}
        currentColor={colorPickerDialog.currentColor}
        title={`Choose ${
          colorPickerDialog.targetType === "node" ? "Node" : "Relationship"
        } Color`}
        theme={theme}
        darkMode={darkMode}
      />
    </div>
  );
};

export default App;
