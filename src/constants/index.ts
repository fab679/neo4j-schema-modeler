export const NODE_RADIUS = 50;

export const DEFAULT_NODE_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#FFA07A",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E2",
  "#F8B500",
  "#2ECC71",
  "#E74C3C",
  "#9B59B6",
];

export const DEFAULT_EDGE_COLORS = [
  "#6b7280",
  "#ef4444",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
];

export const ZOOM_MIN = 0.2;
export const ZOOM_MAX = 3;
export const ZOOM_STEP = 0.1;

export const PROPERTY_TYPE_GROUPS = {
  Scalar: ["String", "Boolean", "Any"],
  Numeric: ["Integer", "Long", "Float", "Double"],
  Temporal: [
    "Date",
    "Time",
    "LocalTime",
    "DateTime",
    "LocalDateTime",
    "Duration",
    "ZonedDateTime",
    "ZonedTime",
  ],
  Spatial: [
    "Point",
    "CartesianPoint",
    "WGS84Point",
    "Cartesian3DPoint",
    "WGS843DPoint",
  ],
  Composite: ["Map", "List"],
  Arrays: [
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
  ],
  Graph: ["Node", "Relationship", "Path"],
} as const;

// Self-loop configuration - larger sizes for better visibility
export const SELF_LOOP_BASE_SIZE = 75;
export const SELF_LOOP_INCREMENT = 40;

// Edge spacing for parallel edges
export const EDGE_CURVE_SPACING = 60;

// Minimum spacing between parallel edges
export const MIN_EDGE_SPACING = 40;

// Arrow marker size
export const ARROW_MARKER_WIDTH = 8;
export const ARROW_MARKER_HEIGHT = 6;
