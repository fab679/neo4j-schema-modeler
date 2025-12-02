import React, { useMemo } from "react";
import { Plus } from "lucide-react";
import type { Node, Edge, ThemeClasses, Position } from "../types";
import { NODE_RADIUS } from "../constants";
import {
  getEdgePath,
  getEdgeCurveOffset,
  calculatePanelPosition,
} from "../utils";

interface CanvasProps {
  nodes: Node[];
  edges: Edge[];
  panOffset: Position;
  zoom: number;
  isPanning: boolean;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  hoveredNodeId: string | null;
  draggedNodeId: string | null;
  isConnecting: boolean;
  connectionSourceId: string | null;
  mousePos: Position;
  theme: ThemeClasses;
  darkMode: boolean;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  // Event handlers
  onCanvasMouseDown: (e: React.MouseEvent) => void;
  onCanvasMouseMove: (e: React.MouseEvent) => void;
  onCanvasMouseUp: (e: React.MouseEvent) => void;
  onCanvasWheel: (e: React.WheelEvent) => void;
  onCanvasContextMenu: (e: React.MouseEvent) => void;
  onNodeMouseDown: (e: React.MouseEvent, nodeId: string) => void;
  onNodeMouseUp: (e: React.MouseEvent, nodeId: string) => void;
  onNodeHover: (nodeId: string | null) => void;
  onNodeContextMenu: (e: React.MouseEvent, nodeId: string) => void;
  onConnectionStart: (e: React.MouseEvent, nodeId: string) => void;
  onEdgeClick: (e: React.MouseEvent, edgeId: string) => void;
  onEdgeContextMenu: (e: React.MouseEvent, edgeId: string) => void;
  getNodeById: (id: string) => Node | undefined;
}

export const Canvas: React.FC<CanvasProps> = ({
  nodes,
  edges,
  panOffset,
  zoom,
  isPanning,
  selectedNodeId,
  selectedEdgeId,
  hoveredNodeId,
  draggedNodeId,
  isConnecting,
  connectionSourceId,
  mousePos,
  theme,
  darkMode,
  canvasRef,
  onCanvasMouseDown,
  onCanvasMouseMove,
  onCanvasMouseUp,
  onCanvasWheel,
  onCanvasContextMenu,
  onNodeMouseDown,
  onNodeMouseUp,
  onNodeHover,
  onNodeContextMenu,
  onConnectionStart,
  onEdgeClick,
  onEdgeContextMenu,
  getNodeById,
}) => {
  // Pre-calculate edge paths with offsets
  const edgePathData = useMemo(() => {
    return edges
      .map((edge) => {
        const source = getNodeById(edge.source);
        const target = getNodeById(edge.target);
        if (!source || !target) return null;

        const isSelf = edge.source === edge.target;
        const curveOffset = getEdgeCurveOffset(edge, edges);
        const pathData = getEdgePath(
          source.x,
          source.y,
          target.x,
          target.y,
          curveOffset,
          isSelf
        );

        return { edge, pathData, isSelf };
      })
      .filter(Boolean);
  }, [edges, getNodeById]);

  return (
    <div
      ref={canvasRef as React.RefObject<HTMLDivElement>}
      className={`flex-1 relative overflow-hidden ${
        isPanning && !draggedNodeId ? "cursor-grabbing" : "cursor-default"
      }`}
      onMouseDown={onCanvasMouseDown}
      onMouseMove={onCanvasMouseMove}
      onMouseUp={onCanvasMouseUp}
      onMouseLeave={onCanvasMouseUp}
      onWheel={onCanvasWheel}
      onContextMenu={onCanvasContextMenu}
    >
      {/* Grid background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle, ${
            darkMode ? "#374151" : "#d1d5db"
          } 1.5px, transparent 1.5px)`,
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
          backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
          opacity: 0.4,
        }}
      />

      {/* SVG Layer for Edges */}
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{ width: "100%", height: "100%", overflow: "visible" }}
      >
        {/* Arrow markers */}
        <defs>
          {edges.map((edge) => (
            <marker
              key={`marker-${edge.id}`}
              id={`arrow-${edge.id}`}
              markerWidth="12"
              markerHeight="8"
              refX="10"
              refY="4"
              orient="auto"
            >
              <polygon
                points="0 0, 12 4, 0 8"
                fill={
                  selectedEdgeId === edge.id
                    ? "#3b82f6"
                    : edge.data.color || "#6b7280"
                }
              />
            </marker>
          ))}
        </defs>

        <g
          transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoom})`}
        >
          {/* Edges */}
          {edgePathData.map((item) => {
            if (!item) return null;
            const { edge, pathData } = item;
            const isSelected = selectedEdgeId === edge.id;
            const strokeColor = isSelected
              ? "#3b82f6"
              : edge.data.color || "#6b7280";

            return (
              <g key={edge.id}>
                {/* Invisible hit area */}
                <path
                  d={pathData.path}
                  stroke="transparent"
                  strokeWidth={24}
                  fill="none"
                  className="pointer-events-auto cursor-pointer"
                  onClick={(e) => onEdgeClick(e, edge.id)}
                  onContextMenu={(e) => onEdgeContextMenu(e, edge.id)}
                />
                {/* Visible path */}
                <path
                  d={pathData.path}
                  stroke={strokeColor}
                  strokeWidth={isSelected ? 4 : 3}
                  fill="none"
                  markerEnd={`url(#arrow-${edge.id})`}
                  className="pointer-events-none"
                  style={{
                    filter: isSelected
                      ? "drop-shadow(0 0 4px rgba(59, 130, 246, 0.5))"
                      : undefined,
                  }}
                />
                {/* Label background */}
                <rect
                  x={
                    pathData.labelX -
                    edge.data.relationshipType.length * 4.5 -
                    10
                  }
                  y={pathData.labelY - 14}
                  width={edge.data.relationshipType.length * 9 + 20}
                  height={28}
                  rx={6}
                  fill={darkMode ? "#1f2937" : "#ffffff"}
                  stroke={
                    isSelected ? "#3b82f6" : darkMode ? "#374151" : "#e5e7eb"
                  }
                  strokeWidth={isSelected ? 2 : 1}
                  className="pointer-events-none"
                  style={{
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                  }}
                />
                {/* Label text */}
                <text
                  x={pathData.labelX}
                  y={pathData.labelY + 5}
                  fill={
                    isSelected ? "#3b82f6" : darkMode ? "#e5e7eb" : "#374151"
                  }
                  fontSize="13"
                  fontWeight="600"
                  fontFamily="'Google Sans', sans-serif"
                  textAnchor="middle"
                  className="pointer-events-none select-none"
                >
                  {edge.data.relationshipType}
                </text>
              </g>
            );
          })}

          {/* Connection preview line */}
          {isConnecting &&
            connectionSourceId &&
            (() => {
              const sourceNode = getNodeById(connectionSourceId);
              if (!sourceNode) return null;
              return (
                <line
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={mousePos.x}
                  y2={mousePos.y}
                  stroke="#3b82f6"
                  strokeWidth={3}
                  strokeDasharray="10,6"
                  className="pointer-events-none"
                  style={{
                    filter: "drop-shadow(0 0 6px rgba(59, 130, 246, 0.6))",
                  }}
                />
              );
            })()}
        </g>
      </svg>

      {/* Nodes Layer */}
      <div
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        {nodes.map((node) => {
          const isSelected = selectedNodeId === node.id;
          const isHovered = hoveredNodeId === node.id;
          const isDragging = draggedNodeId === node.id;
          const panelPos = calculatePanelPosition(
            node.x,
            node.y,
            node.id,
            nodes,
            node.data.propertyPanelPosition
          );

          return (
            <div
              key={node.id}
              style={{
                position: "absolute",
                left: node.x - NODE_RADIUS,
                top: node.y - NODE_RADIUS,
              }}
            >
              {/* Node Circle */}
              <div
                className={`flex items-center justify-center relative select-none
                  ${isDragging ? "cursor-grabbing" : "cursor-grab"}
                `}
                style={{
                  width: NODE_RADIUS * 2,
                  height: NODE_RADIUS * 2,
                  borderRadius: "50%",
                  backgroundColor: node.data.color,
                  boxShadow: isSelected
                    ? `0 0 0 4px #3b82f6, 0 0 24px ${node.data.color}80, 0 8px 24px rgba(0,0,0,0.2)`
                    : isHovered
                    ? `0 0 0 3px rgba(59, 130, 246, 0.5), 0 6px 20px rgba(0,0,0,0.15)`
                    : "0 4px 16px rgba(0,0,0,0.15)",
                  transform:
                    isHovered && !isDragging ? "scale(1.02)" : "scale(1)",
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}
                onMouseDown={(e) => onNodeMouseDown(e, node.id)}
                onMouseUp={(e) => onNodeMouseUp(e, node.id)}
                onMouseEnter={() => onNodeHover(node.id)}
                onMouseLeave={() => !isConnecting && onNodeHover(null)}
                onContextMenu={(e) => onNodeContextMenu(e, node.id)}
              >
                {/* Node Label */}
                <span
                  className="text-white font-semibold text-center px-3 pointer-events-none"
                  style={{
                    fontSize: "15px",
                    textShadow: "0 1px 3px rgba(0,0,0,0.3)",
                    fontFamily: "'Google Sans', sans-serif",
                    letterSpacing: "0.02em",
                    maxWidth: NODE_RADIUS * 2 - 16,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {node.data.label}
                </span>

                {/* Connection Handle */}
                {isHovered && (
                  <div
                    className="absolute -right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-blue-500 rounded-full cursor-crosshair hover:bg-blue-600 flex items-center justify-center shadow-xl transition-all hover:scale-110"
                    onMouseDown={(e) => onConnectionStart(e, node.id)}
                    title="Drag to create relationship"
                    style={{
                      boxShadow: "0 4px 12px rgba(59, 130, 246, 0.4)",
                    }}
                  >
                    <Plus size={20} className="text-white" strokeWidth={2.5} />
                  </div>
                )}
              </div>

              {/* Property Panel */}
              {node.data.properties.length > 0 && (
                <div
                  className={`absolute ${theme.surface} border ${theme.border} rounded-xl p-3.5 shadow-xl pointer-events-none animate-fade-in`}
                  style={{
                    left: panelPos.left,
                    top: panelPos.top,
                    minWidth: "200px",
                    maxWidth: "280px",
                  }}
                >
                  {/* Panel header */}
                  <div
                    className={`text-xs font-semibold ${theme.textMuted} uppercase tracking-wider mb-2.5 pb-2 border-b ${theme.border}`}
                  >
                    Properties
                  </div>
                  {/* Properties list */}
                  <div className="space-y-2">
                    {node.data.properties.map((prop, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between gap-3 ${theme.text}`}
                      >
                        <span className="font-medium text-sm truncate">
                          {prop.name}
                        </span>
                        <div className="flex items-center gap-2 ">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-md ${
                              darkMode ? "bg-gray-700" : "bg-gray-100"
                            } ${theme.textMuted}`}
                          >
                            {prop.type}
                          </span>
                          {prop.required && (
                            <span
                              className="text-red-500 text-xs font-bold"
                              title="Required"
                            >
                              *
                            </span>
                          )}
                          {prop.unique && (
                            <span
                              className="text-blue-500 text-xs font-bold"
                              title="Unique"
                            >
                              U
                            </span>
                          )}
                          {prop.indexed && (
                            <span
                              className="text-green-500 text-xs font-bold"
                              title="Indexed"
                            >
                              I
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Canvas;
