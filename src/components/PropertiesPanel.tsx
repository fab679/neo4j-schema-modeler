import React from "react";
import {
  Edit3,
  Plus,
  Trash2,
  ArrowLeftRight,
  Info,
  Palette,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type {
  Node,
  Edge,
  ThemeClasses,
  Neo4jPropertyType,
  PropertyType,
  PropertyPanelPosition,
  RelationshipLabelStyle,
} from "../types";
import {
  PROPERTY_TYPE_GROUPS,
  DEFAULT_NODE_COLORS,
  DEFAULT_EDGE_COLORS,
} from "../constants";

interface PropertiesPanelProps {
  selectedNode: Node | null;
  selectedEdge: Edge | null;
  theme: ThemeClasses;
  darkMode: boolean;
  // Node actions
  onUpdateNodeData: (id: string, data: Partial<Node["data"]>) => void;
  onAddNodeProperty: (nodeId: string) => void;
  onUpdateNodeProperty: (
    nodeId: string,
    index: number,
    property: PropertyType
  ) => void;
  onDeleteNodeProperty: (nodeId: string, index: number) => void;
  onDeleteNode: (nodeId: string) => void;
  onOpenColorPicker?: (nodeId: string) => void;
  // Edge actions
  onUpdateEdgeData: (id: string, data: Partial<Edge["data"]>) => void;
  onAddEdgeProperty: (edgeId: string) => void;
  onUpdateEdgeProperty: (
    edgeId: string,
    index: number,
    property: PropertyType
  ) => void;
  onDeleteEdgeProperty: (edgeId: string, index: number) => void;
  onReverseEdge: (edgeId: string) => void;
  onDeleteEdge: (edgeId: string) => void;
  onOpenEdgeColorPicker?: (edgeId: string) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedNode,
  selectedEdge,
  theme,
  darkMode,
  onUpdateNodeData,
  onAddNodeProperty,
  onUpdateNodeProperty,
  onDeleteNodeProperty,
  onDeleteNode,
  onOpenColorPicker,
  onUpdateEdgeData,
  onAddEdgeProperty,
  onUpdateEdgeProperty,
  onDeleteEdgeProperty,
  onReverseEdge,
  onDeleteEdge,
  onOpenEdgeColorPicker,
}) => {
  const [expandedProperties, setExpandedProperties] = React.useState<
    Set<number>
  >(new Set());

  const togglePropertyExpanded = (index: number) => {
    const newSet = new Set(expandedProperties);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setExpandedProperties(newSet);
  };

  const PropertyTypeSelect: React.FC<{
    value: Neo4jPropertyType;
    onChange: (type: Neo4jPropertyType) => void;
  }> = ({ value, onChange }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Neo4jPropertyType)}
      className={`w-full px-3 py-2.5 border ${theme.border} rounded-lg text-sm ${theme.input} ${theme.text} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
    >
      {Object.entries(PROPERTY_TYPE_GROUPS).map(([group, types]) => (
        <optgroup key={group} label={group}>
          {types.map((type) => (
            <option key={type} value={type}>
              {type.includes("Array") ? type.replace("Array", "[]") : type}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );

  const ColorPicker: React.FC<{
    colors: string[];
    currentColor: string;
    onChange: (color: string) => void;
    onOpenAdvanced?: () => void;
  }> = ({ colors, currentColor, onChange, onOpenAdvanced }) => (
    <div>
      <div className="flex gap-2 flex-wrap mb-2.5">
        {colors.map((color) => (
          <button
            key={color}
            onClick={() => onChange(color)}
            className={`w-8 h-8 rounded-lg transition-all hover:scale-110 flex items-center justify-center ${
              currentColor === color
                ? "ring-2 ring-blue-500 ring-offset-2 scale-110"
                : "hover:ring-2 hover:ring-gray-400"
            }`}
            style={{
              backgroundColor: color,
            }}
          />
        ))}
        {onOpenAdvanced && (
          <button
            onClick={onOpenAdvanced}
            className={`w-8 h-8 rounded-lg border-2 border-dashed ${theme.border} ${theme.hover} flex items-center justify-center transition-all hover:scale-110`}
            title="More colors"
          >
            <Palette size={16} className={theme.textMuted} />
          </button>
        )}
      </div>
    </div>
  );

  // 9-Direction Position Selector with visual grid
  const PositionSelector9: React.FC<{
    value: PropertyPanelPosition;
    onChange: (position: PropertyPanelPosition) => void;
  }> = ({ value, onChange }) => {
    const positions: {
      pos: PropertyPanelPosition;
      icon: string;
      row: number;
      col: number;
    }[] = [
      { pos: "top-left", icon: "↖", row: 0, col: 0 },
      { pos: "top", icon: "↑", row: 0, col: 1 },
      { pos: "top-right", icon: "↗", row: 0, col: 2 },
      { pos: "left", icon: "←", row: 1, col: 0 },
      { pos: "auto", icon: "●", row: 1, col: 1 },
      { pos: "right", icon: "→", row: 1, col: 2 },
      { pos: "bottom-left", icon: "↙", row: 2, col: 0 },
      { pos: "bottom", icon: "↓", row: 2, col: 1 },
      { pos: "bottom-right", icon: "↘", row: 2, col: 2 },
    ];

    return (
      <div className={`p-3 rounded-xl border ${theme.border} ${theme.input}`}>
        <div className="grid grid-cols-3 gap-1.5 max-w-32 mx-auto">
          {positions.map(({ pos, icon }) => (
            <button
              key={pos}
              onClick={() => onChange(pos)}
              className={`w-10 h-10 rounded-lg text-lg font-medium flex items-center justify-center transition-all ${
                value === pos
                  ? "bg-blue-500 text-white shadow-md scale-105"
                  : `${theme.surface} ${theme.text} ${theme.hover} border ${theme.border}`
              }`}
              title={pos}
            >
              {icon}
            </button>
          ))}
        </div>
        <p className={`text-xs text-center mt-2 ${theme.textMuted}`}>
          Current: <span className="font-medium">{value || "auto"}</span>
        </p>
      </div>
    );
  };

  // Relationship Label Style Selector - Updated: inline (on line), top (above), bottom (below)
  const LabelStyleSelector: React.FC<{
    value: RelationshipLabelStyle;
    onChange: (style: RelationshipLabelStyle) => void;
  }> = ({ value, onChange }) => {
    const styles: {
      style: RelationshipLabelStyle;
      label: string;
      desc: string;
      icon: string;
    }[] = [
      {
        style: "inline",
        label: "Inline",
        desc: "Text on the line",
        icon: "─A─",
      },
      { style: "top", label: "Top", desc: "Label above line", icon: "A̅" },
      { style: "bottom", label: "Bottom", desc: "Label below line", icon: "A̲" },
    ];

    return (
      <div className="flex gap-2">
        {styles.map(({ style, label, desc, icon }) => (
          <button
            key={style}
            onClick={() => onChange(style)}
            className={`flex-1 py-2.5 px-2 rounded-lg text-sm font-medium transition-all flex flex-col items-center gap-1 ${
              value === style
                ? "bg-blue-500 text-white shadow-md"
                : `${theme.input} ${theme.text} ${theme.hover} border ${theme.border}`
            }`}
            title={desc}
          >
            <span className="text-xs font-mono">{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>
    );
  };

  const SectionHeader: React.FC<{ children: React.ReactNode }> = ({
    children,
  }) => (
    <label className={`block text-sm font-semibold mb-2 ${theme.text}`}>
      {children}
    </label>
  );

  return (
    <div
      className={`w-96 ${theme.surface} border-l ${theme.border} flex flex-col shadow-xl`}
    >
      {/* Header */}
      <div className={`p-4 border-b ${theme.border}`}>
        <h2
          className={`text-lg font-bold flex items-center gap-2.5 ${theme.text}`}
        >
          <Edit3 size={22} className="text-blue-500" />
          Properties
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Node Editor */}
        {selectedNode && (
          <div className="space-y-5">
            {/* Label */}
            <div>
              <SectionHeader>Node Label</SectionHeader>
              <input
                type="text"
                value={selectedNode.data.label}
                onChange={(e) =>
                  onUpdateNodeData(selectedNode.id, {
                    label: e.target.value.replace(/[^a-zA-Z0-9_]/g, ""),
                  })
                }
                className={`w-full px-4 py-3 border ${theme.border} rounded-xl ${theme.input} ${theme.text} font-semibold text-lg focus:ring-2 focus:ring-blue-500`}
                placeholder="NodeLabel"
              />
              <p className={`text-xs ${theme.textMuted} mt-2`}>
                PascalCase recommended (e.g., UserProfile)
              </p>
            </div>

            {/* Definition/Description */}
            <div>
              <SectionHeader>Definition (Optional)</SectionHeader>
              <textarea
                value={selectedNode.data.definition || ""}
                onChange={(e) =>
                  onUpdateNodeData(selectedNode.id, {
                    definition: e.target.value,
                  })
                }
                className={`w-full px-4 py-3 border ${theme.border} rounded-xl ${theme.input} ${theme.text} text-sm resize-none focus:ring-2 focus:ring-blue-500`}
                rows={3}
                placeholder="Describe what this node represents..."
              />
            </div>

            {/* Color */}
            <div>
              <SectionHeader>Color</SectionHeader>
              <ColorPicker
                colors={DEFAULT_NODE_COLORS}
                currentColor={selectedNode.data.color}
                onChange={(color) =>
                  onUpdateNodeData(selectedNode.id, { color })
                }
                onOpenAdvanced={
                  onOpenColorPicker
                    ? () => onOpenColorPicker(selectedNode.id)
                    : undefined
                }
              />
            </div>

            {/* Property Panel Position */}
            <div>
              <SectionHeader>Property Panel Position</SectionHeader>
              <PositionSelector9
                value={selectedNode.data.propertyPanelPosition || "auto"}
                onChange={(position) =>
                  onUpdateNodeData(selectedNode.id, {
                    propertyPanelPosition: position,
                  })
                }
              />
            </div>

            {/* Properties */}
            <div>
              <div className="flex justify-between items-center mb-2.5">
                <SectionHeader>
                  Properties ({selectedNode.data.properties.length})
                </SectionHeader>
                <button
                  onClick={() => onAddNodeProperty(selectedNode.id)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors shadow-sm"
                >
                  <Plus size={16} /> Add
                </button>
              </div>

              {selectedNode.data.properties.length === 0 ? (
                <div
                  className={`text-center py-8 px-4 border-2 border-dashed ${theme.border} rounded-xl ${theme.input} card-shadow`}
                >
                  <p className={`text-sm ${theme.textMuted}`}>
                    No properties defined yet.
                  </p>
                  <p className={`text-xs ${theme.textMuted} mt-1`}>
                    Click "Add" to create a property
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {selectedNode.data.properties.map((prop, idx) => (
                    <div
                      key={idx}
                      className={`border ${theme.border} rounded-xl ${theme.input} overflow-hidden card-shadow`}
                    >
                      {/* Property Header */}
                      <div
                        className={`px-4 py-3 flex items-center justify-between cursor-pointer ${theme.hover}`}
                        onClick={() => togglePropertyExpanded(idx)}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`font-medium ${theme.text}`}>
                            {prop.name || "unnamed"}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-md ${
                              darkMode ? "bg-gray-600" : "bg-gray-200"
                            } ${theme.textMuted}`}
                          >
                            {prop.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {prop.required && (
                            <span className="text-red-500 text-xs font-bold">
                              *
                            </span>
                          )}
                          {prop.unique && (
                            <span className="text-blue-500 text-xs font-bold">
                              U
                            </span>
                          )}
                          {prop.indexed && (
                            <span className="text-green-500 text-xs font-bold">
                              I
                            </span>
                          )}
                          {expandedProperties.has(idx) ? (
                            <ChevronUp size={18} className={theme.textMuted} />
                          ) : (
                            <ChevronDown
                              size={18}
                              className={theme.textMuted}
                            />
                          )}
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {expandedProperties.has(idx) && (
                        <div
                          className={`px-4 py-3 border-t ${theme.border} space-y-3.5`}
                        >
                          <input
                            type="text"
                            value={prop.name}
                            onChange={(e) =>
                              onUpdateNodeProperty(selectedNode.id, idx, {
                                ...prop,
                                name: e.target.value,
                              })
                            }
                            placeholder="Property name"
                            className={`w-full px-3 py-2.5 border ${theme.border} rounded-lg text-sm ${theme.input} ${theme.text} focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                          />
                          <PropertyTypeSelect
                            value={prop.type}
                            onChange={(type) =>
                              onUpdateNodeProperty(selectedNode.id, idx, {
                                ...prop,
                                type,
                              })
                            }
                          />
                          {/* Constraints */}
                          <div className="flex gap-4">
                            <label
                              className={`flex items-center gap-2 text-sm ${theme.text} cursor-pointer`}
                            >
                              <input
                                type="checkbox"
                                checked={prop.required || false}
                                onChange={(e) =>
                                  onUpdateNodeProperty(selectedNode.id, idx, {
                                    ...prop,
                                    required: e.target.checked,
                                  })
                                }
                                className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                              />
                              <span className="text-red-500 font-semibold">
                                Required
                              </span>
                            </label>
                            <label
                              className={`flex items-center gap-2 text-sm ${theme.text} cursor-pointer`}
                            >
                              <input
                                type="checkbox"
                                checked={prop.unique || false}
                                onChange={(e) =>
                                  onUpdateNodeProperty(selectedNode.id, idx, {
                                    ...prop,
                                    unique: e.target.checked,
                                  })
                                }
                                className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                              />
                              <span className="text-blue-500 font-semibold">
                                Unique
                              </span>
                            </label>
                            <label
                              className={`flex items-center gap-2 text-sm ${theme.text} cursor-pointer`}
                            >
                              <input
                                type="checkbox"
                                checked={prop.indexed || false}
                                onChange={(e) =>
                                  onUpdateNodeProperty(selectedNode.id, idx, {
                                    ...prop,
                                    indexed: e.target.checked,
                                  })
                                }
                                className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                              />
                              <span className="text-green-500 font-semibold">
                                Indexed
                              </span>
                            </label>
                          </div>
                          <button
                            onClick={() =>
                              onDeleteNodeProperty(selectedNode.id, idx)
                            }
                            className="flex items-center gap-2 text-red-500 text-sm font-medium hover:text-red-600"
                          >
                            <Trash2 size={14} /> Delete Property
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Delete Node */}
            <button
              onClick={() => onDeleteNode(selectedNode.id)}
              className="w-full bg-red-500 text-white py-2.5 rounded-lg hover:bg-red-600 flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg transition-all"
            >
              <Trash2 size={18} /> Delete Node
            </button>
          </div>
        )}

        {/* Edge Editor */}
        {selectedEdge && (
          <div className="space-y-5">
            {/* Relationship Type */}
            <div>
              <SectionHeader>Relationship Type</SectionHeader>
              <input
                type="text"
                value={selectedEdge.data.relationshipType}
                onChange={(e) =>
                  onUpdateEdgeData(selectedEdge.id, {
                    relationshipType: e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9_]/g, "_"),
                  })
                }
                className={`w-full px-4 py-3 border ${theme.border} rounded-xl ${theme.input} ${theme.text} font-mono text-base focus:ring-2 focus:ring-blue-500`}
              />
              <p className={`text-xs ${theme.textMuted} mt-2`}>
                Auto-formatted to SCREAMING_SNAKE_CASE
              </p>
            </div>

            {/* Reverse Direction */}
            <button
              onClick={() => onReverseEdge(selectedEdge.id)}
              className="w-full bg-blue-500 text-white py-2.5 rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg transition-all"
            >
              <ArrowLeftRight size={18} /> Reverse Direction
            </button>

            {/* Label Style */}
            <div>
              <SectionHeader>Label Position</SectionHeader>
              <LabelStyleSelector
                value={selectedEdge.data.labelStyle || "top"}
                onChange={(style) =>
                  onUpdateEdgeData(selectedEdge.id, { labelStyle: style })
                }
              />
            </div>

            {/* Color */}
            <div>
              <SectionHeader>Color</SectionHeader>
              <ColorPicker
                colors={DEFAULT_EDGE_COLORS}
                currentColor={selectedEdge.data.color}
                onChange={(color) =>
                  onUpdateEdgeData(selectedEdge.id, { color })
                }
                onOpenAdvanced={
                  onOpenEdgeColorPicker
                    ? () => onOpenEdgeColorPicker(selectedEdge.id)
                    : undefined
                }
              />
            </div>

            {/* Properties */}
            <div>
              <div className="flex justify-between items-center mb-2.5">
                <SectionHeader>
                  Properties ({selectedEdge.data.properties.length})
                </SectionHeader>
                <button
                  onClick={() => onAddEdgeProperty(selectedEdge.id)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors shadow-sm"
                >
                  <Plus size={16} /> Add
                </button>
              </div>

              {selectedEdge.data.properties.length === 0 ? (
                <div
                  className={`text-center py-8 px-4 border-2 border-dashed ${theme.border} rounded-xl ${theme.input} card-shadow`}
                >
                  <p className={`text-sm ${theme.textMuted}`}>
                    No properties defined yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {selectedEdge.data.properties.map((prop, idx) => (
                    <div
                      key={idx}
                      className={`p-4 border ${theme.border} rounded-xl ${theme.input} space-y-3.5 card-shadow`}
                    >
                      <input
                        type="text"
                        value={prop.name}
                        onChange={(e) =>
                          onUpdateEdgeProperty(selectedEdge.id, idx, {
                            ...prop,
                            name: e.target.value,
                          })
                        }
                        placeholder="Property name"
                        className={`w-full px-3 py-2.5 border ${theme.border} rounded-lg text-sm ${theme.input} ${theme.text} focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                      />
                      <PropertyTypeSelect
                        value={prop.type}
                        onChange={(type) =>
                          onUpdateEdgeProperty(selectedEdge.id, idx, {
                            ...prop,
                            type,
                          })
                        }
                      />
                      <button
                        onClick={() =>
                          onDeleteEdgeProperty(selectedEdge.id, idx)
                        }
                        className="flex items-center gap-2 text-red-500 text-sm font-medium hover:text-red-600"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Delete Edge */}
            <button
              onClick={() => onDeleteEdge(selectedEdge.id)}
              className="w-full bg-red-500 text-white py-2.5 rounded-lg hover:bg-red-600 flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg transition-all"
            >
              <Trash2 size={18} /> Delete Relationship
            </button>
          </div>
        )}

        {/* Empty State */}
        {!selectedNode && !selectedEdge && (
          <div className="text-center py-10">
            <div
              className={`w-16 h-16 mx-auto mb-4 rounded-full ${
                darkMode ? "bg-gray-700" : "bg-gray-100"
              } flex items-center justify-center`}
            >
              <Info size={32} className={theme.textMuted} />
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${theme.text}`}>
              No Selection
            </h3>
            <p className={`${theme.textMuted} mb-5`}>
              Select a node or relationship to edit its properties
            </p>

            <div
              className={`text-left p-4 ${theme.input} rounded-xl border ${theme.border}`}
            >
              <p className={`font-semibold mb-2.5 ${theme.text}`}>
                ⌨️ Keyboard Shortcuts
              </p>
              <ul className={`space-y-2 ${theme.textMuted} text-sm`}>
                <li className="flex items-center gap-3">
                  <kbd
                    className={`px-2 py-1 ${
                      darkMode ? "bg-gray-600" : "bg-gray-200"
                    } rounded text-xs font-mono`}
                  >
                    Delete
                  </kbd>
                  <span>Delete selected item</span>
                </li>
                <li className="flex items-center gap-3">
                  <kbd
                    className={`px-2 py-1 ${
                      darkMode ? "bg-gray-600" : "bg-gray-200"
                    } rounded text-xs font-mono`}
                  >
                    Ctrl+D
                  </kbd>
                  <span>Duplicate selected node</span>
                </li>
                <li className="flex items-center gap-3">
                  <kbd
                    className={`px-2 py-1 ${
                      darkMode ? "bg-gray-600" : "bg-gray-200"
                    } rounded text-xs font-mono`}
                  >
                    Esc
                  </kbd>
                  <span>Deselect all</span>
                </li>
                <li className="flex items-center gap-3">
                  <kbd
                    className={`px-2 py-1 ${
                      darkMode ? "bg-gray-600" : "bg-gray-200"
                    } rounded text-xs font-mono`}
                  >
                    Scroll
                  </kbd>
                  <span>Zoom in/out</span>
                </li>
                <li className="flex items-center gap-3">
                  <kbd
                    className={`px-2 py-1 ${
                      darkMode ? "bg-gray-600" : "bg-gray-200"
                    } rounded text-xs font-mono`}
                  >
                    Shift+Scroll
                  </kbd>
                  <span>Pan left/right</span>
                </li>
              </ul>

              <p className={`font-semibold mt-4 mb-2.5 ${theme.text}`}>
                🖱️ Mouse Actions
              </p>
              <ul className={`space-y-2 ${theme.textMuted} text-sm`}>
                <li>• Click node to select</li>
                <li>• Drag node to move</li>
                <li>
                  • Drag <span className="text-blue-500 font-medium">+</span>{" "}
                  button to connect
                </li>
                <li>• Right-click for context menu</li>
                <li>• Drag empty canvas to pan</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesPanel;
