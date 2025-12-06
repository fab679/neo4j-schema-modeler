import React, { useMemo } from "react";
import { Plus } from "lucide-react";
import type {
  Node,
  Edge,
  ThemeClasses,
  Position,
  RelationshipLabelStyle,
} from "../types";
import { NODE_RADIUS } from "../constants";
import {
  getEdgeCurveOffset,
  getSelfLoopIndex,
  calculatePanelPosition,
} from "../utils";

// Larger self-loop constants for better visibility
const SELF_LOOP_BASE_SIZE = 80;
const SELF_LOOP_INCREMENT = 45;

interface EdgePathData {
  path: string;
  labelX: number;
  labelY: number;
  perpX: number;
  perpY: number;
  arrowX: number;
  arrowY: number;
  arrowAngle: number;
}

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
  onCanvasMouseDown: (e: React.MouseEvent) => void;
  onCanvasMouseMove: (e: React.MouseEvent) => void;
  onCanvasMouseUp: (e: React.MouseEvent) => void;
  onCanvasWheel: (e: React.WheelEvent) => void;
  onCanvasContextMenu: (e: React.MouseEvent) => void;
  onNodeMouseDown: (e: React.MouseEvent, nodeId: string) => void;
  onNodeMouseUp: (e: React.MouseEvent, nodeId: string) => void;
  onNodeDoubleClick: (e: React.MouseEvent, nodeId: string) => void;
  onNodeHover: (nodeId: string | null) => void;
  onNodeContextMenu: (e: React.MouseEvent, nodeId: string) => void;
  onConnectionStart: (e: React.MouseEvent, nodeId: string) => void;
  onEdgeClick: (e: React.MouseEvent, edgeId: string) => void;
  onEdgeContextMenu: (e: React.MouseEvent, edgeId: string) => void;
  getNodeById: (id: string) => Node | undefined;
}

// Calculate edge path with perpendicular direction for label positioning
function calculateEdgePath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  curveOffset: number
): EdgePathData {
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist === 0) {
    return {
      path: `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`,
      labelX: sourceX,
      labelY: sourceY,
      perpX: 0,
      perpY: -1,
      arrowX: targetX,
      arrowY: targetY,
      arrowAngle: 0,
    };
  }

  const angle = Math.atan2(dy, dx);

  const sx = sourceX + Math.cos(angle) * NODE_RADIUS;
  const sy = sourceY + Math.sin(angle) * NODE_RADIUS;
  const tx = targetX - Math.cos(angle) * NODE_RADIUS;
  const ty = targetY - Math.sin(angle) * NODE_RADIUS;

  const perpX = -dy / dist;
  const perpY = dx / dist;

  const curveAmount = curveOffset * 70;
  const midX = (sx + tx) / 2 + perpX * curveAmount;
  const midY = (sy + ty) / 2 + perpY * curveAmount;

  const t = 0.5;
  const labelX = (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * midX + t * t * tx;
  const labelY = (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * midY + t * t * ty;

  const tangentX = tx - sx;
  const tangentY = ty - sy;
  const tangentLen = Math.sqrt(tangentX * tangentX + tangentY * tangentY);

  const labelPerpX = tangentLen > 0 ? -tangentY / tangentLen : 0;
  const labelPerpY = tangentLen > 0 ? tangentX / tangentLen : -1;

  return {
    path: `M ${sx} ${sy} Q ${midX} ${midY} ${tx} ${ty}`,
    labelX,
    labelY,
    perpX: labelPerpX,
    perpY: labelPerpY,
    arrowX: tx,
    arrowY: ty,
    arrowAngle: (Math.atan2(ty - midY, tx - midX) * 180) / Math.PI,
  };
}

// Self-loop path calculation
function getSelfLoopPath(
  nodeX: number,
  nodeY: number,
  selfLoopIndex: number = 0
): EdgePathData {
  const loopSize = SELF_LOOP_BASE_SIZE + selfLoopIndex * SELF_LOOP_INCREMENT;
  const angleOffset = selfLoopIndex * 35;
  const baseAngle = -90 + angleOffset;
  const radians = (baseAngle * Math.PI) / 180;

  const arcSpread = 0.55;
  const startAngle = radians - arcSpread;
  const endAngle = radians + arcSpread;

  const startX = nodeX + Math.cos(startAngle) * NODE_RADIUS;
  const startY = nodeY + Math.sin(startAngle) * NODE_RADIUS;
  const endX = nodeX + Math.cos(endAngle) * NODE_RADIUS;
  const endY = nodeY + Math.sin(endAngle) * NODE_RADIUS;

  const controlDistance = loopSize * 1.8;
  const cx = nodeX + Math.cos(radians) * controlDistance;
  const cy = nodeY + Math.sin(radians) * controlDistance;

  const labelDistance = loopSize * 1.15;
  const labelX = nodeX + Math.cos(radians) * labelDistance;
  const labelY = nodeY + Math.sin(radians) * labelDistance;

  const perpX = Math.cos(radians);
  const perpY = Math.sin(radians);

  return {
    path: `M ${startX} ${startY} Q ${cx} ${cy}, ${endX} ${endY}`,
    labelX,
    labelY,
    perpX,
    perpY,
    arrowX: endX,
    arrowY: endY,
    arrowAngle: (endAngle * 180) / Math.PI + 90,
  };
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
  onNodeDoubleClick,
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

        if (isSelf) {
          const selfLoopIndex = getSelfLoopIndex(edge, edges);
          const pathData = getSelfLoopPath(source.x, source.y, selfLoopIndex);
          return { edge, pathData, isSelf };
        } else {
          const curveOffset = getEdgeCurveOffset(edge, edges);
          const pathData = calculateEdgePath(
            source.x,
            source.y,
            target.x,
            target.y,
            curveOffset
          );
          return { edge, pathData, isSelf };
        }
      })
      .filter(Boolean);
  }, [edges, getNodeById]);

  // Render edge label based on style
  const renderEdgeLabel = (
    edge: Edge,
    pathData: EdgePathData,
    isSelected: boolean,
    labelStyle: RelationshipLabelStyle = "top"
  ) => {
    const text = edge.data.relationshipType;
    const fontSize = 12;
    const paddingX = 12;
    const paddingY = 6;
    const labelWidth = text.length * 7 + paddingX * 2;
    const labelHeight = fontSize + paddingY * 2;

    const bgColor = darkMode ? "#1f2937" : "#ffffff";
    const borderColor = isSelected
      ? "#3b82f6"
      : darkMode
      ? "#374151"
      : "#e5e7eb";
    const textColor = isSelected ? "#3b82f6" : darkMode ? "#e5e7eb" : "#374151";

    let offsetDistance = 0;
    if (labelStyle === "top") {
      offsetDistance = -22;
    } else if (labelStyle === "bottom") {
      offsetDistance = 22;
    }

    const finalX = pathData.labelX + pathData.perpX * offsetDistance;
    const finalY = pathData.labelY + pathData.perpY * offsetDistance;

    if (labelStyle === "inline") {
      return (
        <g className="pointer-events-none">
          <rect
            x={finalX - labelWidth / 2}
            y={finalY - labelHeight / 2}
            width={labelWidth}
            height={labelHeight}
            rx={4}
            fill={bgColor}
          />
          <text
            x={finalX}
            y={finalY}
            fill={
              isSelected
                ? "#3b82f6"
                : edge.data.color || (darkMode ? "#d1d5db" : "#4b5563")
            }
            fontSize={fontSize}
            fontWeight="600"
            fontFamily="'Google Sans', sans-serif"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {text}
          </text>
        </g>
      );
    }

    return (
      <g className="pointer-events-none">
        <rect
          x={finalX - labelWidth / 2}
          y={finalY - labelHeight / 2 + 1}
          width={labelWidth}
          height={labelHeight}
          rx={6}
          fill="rgba(0,0,0,0.08)"
        />
        <rect
          x={finalX - labelWidth / 2}
          y={finalY - labelHeight / 2}
          width={labelWidth}
          height={labelHeight}
          rx={6}
          fill={bgColor}
          stroke={borderColor}
          strokeWidth={isSelected ? 2 : 1}
        />
        <text
          x={finalX}
          y={finalY}
          fill={textColor}
          fontSize={fontSize}
          fontWeight="600"
          fontFamily="'Google Sans', sans-serif"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {text}
        </text>
      </g>
    );
  };

  // Render edge property panel - positioned to avoid overlapping label
  const renderEdgePropertyPanel = (
    edge: Edge,
    pathData: EdgePathData,
    isSelected: boolean
  ) => {
    if (edge.data.properties.length === 0) return null;

    const panelWidth = 150;
    const rowHeight = 18;
    const headerHeight = 24;
    const paddingY = 8;
    const propsToShow = edge.data.properties.slice(0, 4);
    const panelHeight =
      headerHeight + propsToShow.length * rowHeight + paddingY;

    const labelStyle = edge.data.labelStyle || "top";

    // Position panel on OPPOSITE side of the label to avoid overlap
    // Label offset determines where label is, panel goes opposite direction
    let panelOffsetDistance = 0;
    if (labelStyle === "top") {
      // Label is above (-22), so panel goes below (+55)
      panelOffsetDistance = 55;
    } else if (labelStyle === "bottom") {
      // Label is below (+22), so panel goes above (-55)
      panelOffsetDistance = -55;
    } else {
      // Inline - put panel below the line
      panelOffsetDistance = 50;
    }

    const panelX = pathData.labelX;
    const panelY = pathData.labelY + pathData.perpY * panelOffsetDistance;

    const bgColor = darkMode ? "#1f2937" : "#ffffff";
    const borderColor = isSelected
      ? "#3b82f6"
      : darkMode
      ? "#374151"
      : "#e5e7eb";
    const headerColor = darkMode ? "#9ca3af" : "#6b7280";
    const textColor = darkMode ? "#e5e7eb" : "#374151";
    const mutedColor = darkMode ? "#6b7280" : "#9ca3af";

    return (
      <g className="pointer-events-none">
        {/* Shadow */}
        <rect
          x={panelX - panelWidth / 2}
          y={panelY - panelHeight / 2 + 2}
          width={panelWidth}
          height={panelHeight}
          rx={8}
          fill="rgba(0,0,0,0.1)"
        />
        {/* Background */}
        <rect
          x={panelX - panelWidth / 2}
          y={panelY - panelHeight / 2}
          width={panelWidth}
          height={panelHeight}
          rx={8}
          fill={bgColor}
          stroke={borderColor}
          strokeWidth={isSelected ? 2 : 1}
        />
        {/* Header */}
        <text
          x={panelX - panelWidth / 2 + 10}
          y={panelY - panelHeight / 2 + 16}
          fill={headerColor}
          fontSize={9}
          fontWeight="600"
          fontFamily="'Google Sans', sans-serif"
          textAnchor="start"
        >
          PROPERTIES
        </text>
        {/* Divider line */}
        <line
          x1={panelX - panelWidth / 2 + 8}
          y1={panelY - panelHeight / 2 + headerHeight}
          x2={panelX + panelWidth / 2 - 8}
          y2={panelY - panelHeight / 2 + headerHeight}
          stroke={borderColor}
          strokeWidth={1}
        />
        {/* Properties */}
        {propsToShow.map((prop, idx) => {
          const propY =
            panelY -
            panelHeight / 2 +
            headerHeight +
            6 +
            idx * rowHeight +
            rowHeight / 2;
          return (
            <g key={idx}>
              <text
                x={panelX - panelWidth / 2 + 10}
                y={propY}
                fill={textColor}
                fontSize={10}
                fontWeight="500"
                fontFamily="'Google Sans', sans-serif"
                textAnchor="start"
                dominantBaseline="middle"
              >
                {prop.name.length > 10
                  ? prop.name.slice(0, 10) + "…"
                  : prop.name}
              </text>
              <text
                x={panelX + panelWidth / 2 - 10}
                y={propY}
                fill={mutedColor}
                fontSize={9}
                fontFamily="'Google Sans', sans-serif"
                textAnchor="end"
                dominantBaseline="middle"
              >
                {prop.type}
              </text>
            </g>
          );
        })}
        {/* More indicator */}
        {edge.data.properties.length > 4 && (
          <text
            x={panelX}
            y={panelY + panelHeight / 2 - 8}
            fill={mutedColor}
            fontSize={9}
            fontStyle="italic"
            fontFamily="'Google Sans', sans-serif"
            textAnchor="middle"
          >
            +{edge.data.properties.length - 4} more
          </text>
        )}
      </g>
    );
  };

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
          {edges.map((edge) => {
            const isSelected = selectedEdgeId === edge.id;
            const color = isSelected ? "#3b82f6" : edge.data.color || "#6b7280";

            return (
              <marker
                key={`marker-${edge.id}`}
                id={`arrow-${edge.id}`}
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <polygon points="0 0, 8 3, 0 6" fill={color} />
              </marker>
            );
          })}
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
                  strokeWidth={20}
                  fill="none"
                  className="pointer-events-auto cursor-pointer"
                  onClick={(e) => onEdgeClick(e, edge.id)}
                  onContextMenu={(e) => onEdgeContextMenu(e, edge.id)}
                />
                {/* Visible path */}
                <path
                  d={pathData.path}
                  stroke={strokeColor}
                  strokeWidth={isSelected ? 3 : 2.5}
                  fill="none"
                  markerEnd={`url(#arrow-${edge.id})`}
                  className="pointer-events-none"
                  style={{
                    filter: isSelected
                      ? "drop-shadow(0 0 4px rgba(59, 130, 246, 0.5))"
                      : undefined,
                  }}
                />
                {/* Edge label */}
                {renderEdgeLabel(
                  edge,
                  pathData,
                  isSelected,
                  edge.data.labelStyle || "top"
                )}
                {/* Edge property panel */}
                {renderEdgePropertyPanel(edge, pathData, isSelected)}
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
                onDoubleClick={(e) => onNodeDoubleClick(e, node.id)}
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
                  <div
                    className={`text-xs font-semibold ${theme.textMuted} uppercase tracking-wider mb-2.5 pb-2 border-b ${theme.border}`}
                  >
                    Properties
                  </div>
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
