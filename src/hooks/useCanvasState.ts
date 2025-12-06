import { useState, useCallback, useRef } from "react";
import type { Position } from "../types";
import { ZOOM_MIN, ZOOM_MAX } from "../constants";

export function useCanvasState() {
  const [panOffset, setPanOffset] = useState<Position>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const startPanRef = useRef<Position>({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement | null>(null);

  // Selection
  const selectNode = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
  }, []);

  const selectEdge = useCallback((edgeId: string | null) => {
    setSelectedEdgeId(edgeId);
    setSelectedNodeId(null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, []);

  // Pan
  const startPan = useCallback(
    (clientX: number, clientY: number) => {
      setIsPanning(true);
      startPanRef.current = {
        x: clientX - panOffset.x,
        y: clientY - panOffset.y,
      };
    },
    [panOffset]
  );

  const updatePan = useCallback(
    (clientX: number, clientY: number) => {
      if (isPanning) {
        setPanOffset({
          x: clientX - startPanRef.current.x,
          y: clientY - startPanRef.current.y,
        });
      }
    },
    [isPanning]
  );

  const endPan = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Horizontal pan (for shift+scroll)
  const panHorizontal = useCallback((delta: number) => {
    setPanOffset((prev) => ({
      x: prev.x - delta,
      y: prev.y,
    }));
  }, []);

  // Zoom
  const zoomIn = useCallback(() => {
    setZoom((prev) => Math.min(ZOOM_MAX, prev * 1.2));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((prev) => Math.max(ZOOM_MIN, prev * 0.8));
  }, []);

  const handleWheel = useCallback(
    (deltaY: number, shiftKey: boolean = false) => {
      if (shiftKey) {
        // Shift+scroll = horizontal pan
        panHorizontal(deltaY);
      } else {
        // Normal scroll = zoom
        const delta = deltaY > 0 ? 0.9 : 1.1;
        setZoom((prev) => Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, prev * delta)));
      }
    },
    [panHorizontal]
  );

  const resetView = useCallback(() => {
    setPanOffset({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  // Coordinate conversion
  const screenToCanvas = useCallback(
    (clientX: number, clientY: number): Position => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return {
        x: (clientX - rect.left - panOffset.x) / zoom,
        y: (clientY - rect.top - panOffset.y) / zoom,
      };
    },
    [panOffset, zoom]
  );

  const canvasToScreen = useCallback(
    (x: number, y: number): Position => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return {
        x: x * zoom + panOffset.x + rect.left,
        y: y * zoom + panOffset.y + rect.top,
      };
    },
    [panOffset, zoom]
  );

  return {
    canvasRef,
    panOffset,
    zoom,
    isPanning,
    selectedNodeId,
    selectedEdgeId,
    hoveredNodeId,
    // Selection
    selectNode,
    selectEdge,
    clearSelection,
    setHoveredNodeId,
    // Pan
    startPan,
    updatePan,
    endPan,
    panHorizontal,
    // Zoom
    zoomIn,
    zoomOut,
    handleWheel,
    resetView,
    // Coordinates
    screenToCanvas,
    canvasToScreen,
  };
}
