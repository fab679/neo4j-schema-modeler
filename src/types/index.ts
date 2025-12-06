// Complete Neo4j Property Types - Extended
export const NEO4J_PROPERTY_TYPES = [
  // Scalar Types
  "String",
  "Boolean",
  "Any",
  // Numeric Types
  "Integer",
  "Long",
  "Float",
  "Double",
  // Temporal Types
  "Date",
  "Time",
  "LocalTime",
  "DateTime",
  "LocalDateTime",
  "Duration",
  "ZonedDateTime",
  "ZonedTime",
  // Spatial Types
  "Point",
  "CartesianPoint",
  "WGS84Point",
  "Cartesian3DPoint",
  "WGS843DPoint",
  // Composite Types
  "Map",
  "List",
  // Array Types
  "StringArray",
  "IntegerArray",
  "LongArray",
  "FloatArray",
  "DoubleArray",
  "BooleanArray",
  "DateArray",
  "DateTimeArray",
  "DurationArray",
  "PointArray",
  "ByteArray",
  // Graph Types
  "Node",
  "Relationship",
  "Path",
] as const;

export type Neo4jPropertyType = (typeof NEO4J_PROPERTY_TYPES)[number];

// 9-direction property panel position options
export type PropertyPanelPosition =
  | "auto"
  | "top"
  | "top-left"
  | "top-right"
  | "bottom"
  | "bottom-left"
  | "bottom-right"
  | "left"
  | "right";

// Relationship label style options: inline (on line), top (above), bottom (below)
export type RelationshipLabelStyle = "inline" | "top" | "bottom";

export interface PropertyType {
  name: string;
  type: Neo4jPropertyType;
  required?: boolean;
  unique?: boolean;
  indexed?: boolean;
}

export interface Neo4jNodeData {
  label: string;
  properties: PropertyType[];
  color: string;
  definition?: string;
  propertyPanelPosition?: PropertyPanelPosition;
}

export interface Neo4jEdgeData {
  relationshipType: string;
  properties: PropertyType[];
  color: string;
  labelStyle?: RelationshipLabelStyle;
}

export interface Node {
  id: string;
  x: number;
  y: number;
  data: Neo4jNodeData;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  data: Neo4jEdgeData;
}

export interface SchemaModel {
  nodes: Node[];
  edges: Edge[];
  metadata?: {
    version: string;
    exportedAt: string;
    name?: string;
  };
}

export interface ContextMenuState {
  x: number;
  y: number;
  type: "node" | "edge" | "canvas";
  targetId?: string;
}

export interface Position {
  x: number;
  y: number;
}

export interface ThemeClasses {
  bg: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  input: string;
  hover: string;
}
