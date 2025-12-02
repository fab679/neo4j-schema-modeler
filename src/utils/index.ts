import type { Node, Edge, ThemeClasses, PropertyPanelPosition } from "../types";
import { NODE_RADIUS } from "../constants";

// Generate unique ID
export const generateId = () =>
  Date.now().toString() + Math.random().toString(36).substr(2, 9);

// Calculate curve offset for multiple edges between same nodes
export function getEdgeCurveOffset(edge: Edge, allEdges: Edge[]): number {
  const relatedEdges = allEdges.filter(
    (e) =>
      (e.source === edge.source && e.target === edge.target) ||
      (e.source === edge.target && e.target === edge.source)
  );
  if (relatedEdges.length <= 1) return 0;
  const idx = relatedEdges.findIndex((e) => e.id === edge.id);
  return (idx - (relatedEdges.length - 1) / 2) * 0.6;
}

// Calculate edge path data
export interface EdgePathData {
  path: string;
  labelX: number;
  labelY: number;
  arrowX: number;
  arrowY: number;
  arrowAngle: number;
}

export function getEdgePath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  curveOffset: number,
  isSelf: boolean
): EdgePathData {
  if (isSelf) {
    const loopSize = 60;
    const startX = sourceX + NODE_RADIUS * 0.7;
    const startY = sourceY - NODE_RADIUS * 0.7;
    const endX = sourceX + NODE_RADIUS * 0.7;
    const endY = sourceY + NODE_RADIUS * 0.7;

    return {
      path: `M ${startX} ${startY} C ${sourceX + loopSize * 2} ${
        sourceY - loopSize * 1.5
      }, ${sourceX + loopSize * 2} ${
        sourceY + loopSize * 1.5
      }, ${endX} ${endY}`,
      labelX: sourceX + loopSize * 1.8,
      labelY: sourceY,
      arrowX: endX,
      arrowY: endY,
      arrowAngle: 90,
    };
  }

  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);

  const sx = sourceX + Math.cos(angle) * NODE_RADIUS;
  const sy = sourceY + Math.sin(angle) * NODE_RADIUS;
  const tx = targetX - Math.cos(angle) * NODE_RADIUS;
  const ty = targetY - Math.sin(angle) * NODE_RADIUS;

  const perpX = -dy / dist;
  const perpY = dx / dist;
  const curveAmount = curveOffset * 60;

  const midX = (sx + tx) / 2 + perpX * curveAmount;
  const midY = (sy + ty) / 2 + perpY * curveAmount;

  const t = 0.5;
  const labelX = (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * midX + t * t * tx;
  const labelY = (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * midY + t * t * ty;

  return {
    path: `M ${sx} ${sy} Q ${midX} ${midY} ${tx} ${ty}`,
    labelX,
    labelY: labelY - 12 - Math.abs(curveOffset) * 8,
    arrowX: tx,
    arrowY: ty,
    arrowAngle: (Math.atan2(ty - midY, tx - midX) * 180) / Math.PI,
  };
}

// Calculate property panel position with custom positioning support
export function calculatePanelPosition(
  nodeX: number,
  nodeY: number,
  nodeId: string,
  allNodes: Node[],
  customPosition?: PropertyPanelPosition
): { left: number; top: number } {
  const panelWidth = 200;
  const panelHeight = 120;
  const offset = NODE_RADIUS + 16;

  // If custom position is set, use it
  if (customPosition && customPosition !== "auto") {
    switch (customPosition) {
      case "top":
        return {
          left: -panelWidth / 2 + NODE_RADIUS,
          top: -panelHeight - offset,
        };
      case "bottom":
        return {
          left: -panelWidth / 2 + NODE_RADIUS,
          top: NODE_RADIUS * 2 + 16,
        };
      case "left":
        return { left: -panelWidth - 16, top: -panelHeight / 2 + NODE_RADIUS };
      case "right":
        return {
          left: NODE_RADIUS * 2 + 16,
          top: -panelHeight / 2 + NODE_RADIUS,
        };
    }
  }

  // Auto positioning based on nearby nodes
  const threshold = 250;
  const hasRightNeighbor = allNodes.some(
    (n) =>
      n.id !== nodeId &&
      n.x > nodeX &&
      n.x < nodeX + threshold &&
      Math.abs(n.y - nodeY) < 120
  );
  const hasLeftNeighbor = allNodes.some(
    (n) =>
      n.id !== nodeId &&
      n.x < nodeX &&
      n.x > nodeX - threshold &&
      Math.abs(n.y - nodeY) < 120
  );
  const hasTopNeighbor = allNodes.some(
    (n) =>
      n.id !== nodeId &&
      n.y < nodeY &&
      n.y > nodeY - threshold &&
      Math.abs(n.x - nodeX) < 120
  );
  const hasBottomNeighbor = allNodes.some(
    (n) =>
      n.id !== nodeId &&
      n.y > nodeY &&
      n.y < nodeY + threshold &&
      Math.abs(n.x - nodeX) < 120
  );

  // Priority: right > left > bottom > top
  if (!hasRightNeighbor) {
    return { left: NODE_RADIUS * 2 + 16, top: -panelHeight / 2 + NODE_RADIUS };
  } else if (!hasLeftNeighbor) {
    return { left: -panelWidth - 16, top: -panelHeight / 2 + NODE_RADIUS };
  } else if (!hasBottomNeighbor) {
    return { left: -panelWidth / 2 + NODE_RADIUS, top: NODE_RADIUS * 2 + 16 };
  } else if (!hasTopNeighbor) {
    return { left: -panelWidth / 2 + NODE_RADIUS, top: -panelHeight - offset };
  }

  // Default to right
  return { left: NODE_RADIUS * 2 + 16, top: -panelHeight / 2 + NODE_RADIUS };
}

// Theme utilities
export function getThemeClasses(darkMode: boolean): ThemeClasses {
  return {
    bg: darkMode ? "bg-gray-900" : "bg-gray-50",
    surface: darkMode ? "bg-gray-800" : "bg-white",
    text: darkMode ? "text-gray-100" : "text-gray-900",
    textMuted: darkMode ? "text-gray-400" : "text-gray-500",
    border: darkMode ? "border-gray-700" : "border-gray-200",
    input: darkMode ? "bg-gray-700" : "bg-gray-50",
    hover: darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100",
  };
}

// Export utilities
export function generateCypher(
  nodes: Node[],
  edges: Edge[],
  getNodeById: (id: string) => Node | undefined
): string {
  let cypher = "// Neo4j Schema - Generated Cypher Script\n";
  cypher += `// Generated at: ${new Date().toISOString()}\n\n`;

  // Constraints
  cypher += "// === CONSTRAINTS ===\n";
  nodes.forEach((node) => {
    node.data.properties
      .filter((p) => p.unique)
      .forEach((prop) => {
        cypher += `CREATE CONSTRAINT ${node.data.label.toLowerCase()}_${
          prop.name
        }_unique IF NOT EXISTS FOR (n:${node.data.label}) REQUIRE n.${
          prop.name
        } IS UNIQUE;\n`;
      });
    node.data.properties
      .filter((p) => p.required)
      .forEach((prop) => {
        cypher += `CREATE CONSTRAINT ${node.data.label.toLowerCase()}_${
          prop.name
        }_exists IF NOT EXISTS FOR (n:${node.data.label}) REQUIRE n.${
          prop.name
        } IS NOT NULL;\n`;
      });
  });

  // Indexes
  cypher += "\n// === INDEXES ===\n";
  nodes.forEach((node) => {
    node.data.properties
      .filter((p) => p.indexed && !p.unique)
      .forEach((prop) => {
        cypher += `CREATE INDEX ${node.data.label.toLowerCase()}_${
          prop.name
        }_idx IF NOT EXISTS FOR (n:${node.data.label}) ON (n.${prop.name});\n`;
      });
  });

  // Sample node creation
  cypher += "\n// === SAMPLE NODE CREATION ===\n";
  nodes.forEach((node) => {
    const props = node.data.properties
      .map((p) => `${p.name}: $${p.name}`)
      .join(", ");
    cypher += `// CREATE (n:${node.data.label}${props ? ` {${props}}` : ""})\n`;
  });

  // Sample relationships
  cypher += "\n// === SAMPLE RELATIONSHIPS ===\n";
  edges.forEach((edge) => {
    const source = getNodeById(edge.source);
    const target = getNodeById(edge.target);
    if (source && target) {
      const props = edge.data.properties
        .map((p) => `${p.name}: $${p.name}`)
        .join(", ");
      cypher += `// MATCH (a:${source.data.label}), (b:${
        target.data.label
      }) CREATE (a)-[:${edge.data.relationshipType}${
        props ? ` {${props}}` : ""
      }]->(b)\n`;
    }
  });

  return cypher;
}

export function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
