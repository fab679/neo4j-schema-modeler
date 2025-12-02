// Complete Neo4j Property Types
export const NEO4J_PROPERTY_TYPES = [
  // Scalar Types
  "String",
  "Boolean",
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
  // Spatial Types
  "Point",
  "CartesianPoint",
  // Array Types
  "StringArray",
  "IntegerArray",
  "FloatArray",
  "BooleanArray",
  "DateArray",
  "PointArray",
] as const;

export type Neo4jPropertyType = (typeof NEO4J_PROPERTY_TYPES)[number];

// Property panel position options
export type PropertyPanelPosition =
  | "auto"
  | "top"
  | "bottom"
  | "left"
  | "right";

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
  propertyPanelPosition?: PropertyPanelPosition; // Custom positioning
}

export interface Neo4jEdgeData {
  relationshipType: string;
  properties: PropertyType[];
  color: string;
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
