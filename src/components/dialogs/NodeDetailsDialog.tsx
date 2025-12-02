import React from "react";
import { X, ArrowRight, ArrowLeft, RotateCw, Copy, Check } from "lucide-react";
import type { Node, Edge, ThemeClasses } from "../../types";

interface NodeDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  node: Node | null;
  edges: Edge[];
  getNodeById: (id: string) => Node | undefined;
  theme: ThemeClasses;
  darkMode: boolean;
}

export const NodeDetailsDialog: React.FC<NodeDetailsDialogProps> = ({
  isOpen,
  onClose,
  node,
  edges,
  getNodeById,
  theme,
  darkMode,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !node) return null;

  const outgoingEdges = edges.filter(
    (e) => e.source === node.id && e.target !== node.id
  );
  const incomingEdges = edges.filter(
    (e) => e.target === node.id && e.source !== node.id
  );
  const selfEdges = edges.filter(
    (e) => e.source === node.id && e.target === node.id
  );

  const cypherPreview = `CREATE (n:${node.data.label}${
    node.data.properties.length > 0
      ? ` {
  ${node.data.properties.map((p) => `${p.name}: $${p.name}`).join(",\n  ")}
}`
      : ""
  })`;

  const copyCypher = () => {
    navigator.clipboard.writeText(cypherPreview);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`${theme.surface} rounded-2xl p-6 max-w-3xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ backgroundColor: node.data.color }}
            >
              <span className="text-white font-bold text-2xl">
                {node.data.label.charAt(0)}
              </span>
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${theme.text}`}>
                {node.data.label}
              </h2>
              {node.data.definition && (
                <p className={`text-sm ${theme.textMuted} mt-2 max-w-md`}>
                  {node.data.definition}
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className={`p-3 rounded-xl ${theme.hover}`}>
            <X size={24} className={theme.textMuted} />
          </button>
        </div>

        {/* Properties */}
        <div className="mb-6">
          <h3 className={`font-bold mb-3 text-lg ${theme.text}`}>
            Properties ({node.data.properties.length})
          </h3>
          {node.data.properties.length > 0 ? (
            <div
              className={`${theme.input} rounded-xl overflow-hidden border ${theme.border}`}
            >
              <table className="w-full">
                <thead
                  className={`${darkMode ? "bg-gray-700" : "bg-gray-100"}`}
                >
                  <tr>
                    <th
                      className={`px-5 py-4 text-left font-semibold ${theme.text}`}
                    >
                      Name
                    </th>
                    <th
                      className={`px-5 py-4 text-left font-semibold ${theme.text}`}
                    >
                      Type
                    </th>
                    <th
                      className={`px-5 py-4 text-left font-semibold ${theme.text}`}
                    >
                      Constraints
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {node.data.properties.map((prop, idx) => (
                    <tr key={idx} className={`border-t ${theme.border}`}>
                      <td
                        className={`px-5 py-4 font-mono font-medium ${theme.text}`}
                      >
                        {prop.name}
                      </td>
                      <td className={`px-5 py-4`}>
                        <span
                          className={`px-3 py-1 rounded-lg text-sm ${
                            darkMode ? "bg-gray-600" : "bg-gray-200"
                          } ${theme.textMuted}`}
                        >
                          {prop.type}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2 flex-wrap">
                          {prop.required && (
                            <span className="px-3 py-1 bg-red-500/20 text-red-500 rounded-lg text-sm font-medium">
                              Required
                            </span>
                          )}
                          {prop.unique && (
                            <span className="px-3 py-1 bg-blue-500/20 text-blue-500 rounded-lg text-sm font-medium">
                              Unique
                            </span>
                          )}
                          {prop.indexed && (
                            <span className="px-3 py-1 bg-green-500/20 text-green-500 rounded-lg text-sm font-medium">
                              Indexed
                            </span>
                          )}
                          {!prop.required && !prop.unique && !prop.indexed && (
                            <span className={`${theme.textMuted} text-sm`}>
                              None
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              className={`text-center py-8 border-2 border-dashed ${theme.border} rounded-xl`}
            >
              <p className={`${theme.textMuted}`}>No properties defined</p>
            </div>
          )}
        </div>

        {/* Relationships */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <h3
              className={`font-bold mb-2.5 flex items-center gap-2 ${theme.text}`}
            >
              <ArrowRight size={18} className="text-green-500" />
              Outgoing ({outgoingEdges.length})
            </h3>
            <div
              className={`${theme.input} rounded-xl p-3 min-h-28 border ${theme.border}`}
            >
              {outgoingEdges.length > 0 ? (
                <div className="space-y-2.5">
                  {outgoingEdges.map((e) => {
                    const targetNode = getNodeById(e.target);
                    return (
                      <div key={e.id} className={`text-sm ${theme.text}`}>
                        <span className="font-mono text-green-500 font-medium">
                          :{e.data.relationshipType}
                        </span>
                        <span className={theme.textMuted}> → </span>
                        <span className="font-medium">
                          {targetNode?.data.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <span className={`${theme.textMuted} text-sm`}>None</span>
              )}
            </div>
          </div>

          <div>
            <h3
              className={`font-bold mb-2.5 flex items-center gap-2 ${theme.text}`}
            >
              <ArrowLeft size={18} className="text-orange-500" />
              Incoming ({incomingEdges.length})
            </h3>
            <div
              className={`${theme.input} rounded-xl p-3 min-h-28 border ${theme.border}`}
            >
              {incomingEdges.length > 0 ? (
                <div className="space-y-2.5">
                  {incomingEdges.map((e) => {
                    const sourceNode = getNodeById(e.source);
                    return (
                      <div key={e.id} className={`text-sm ${theme.text}`}>
                        <span className="font-medium">
                          {sourceNode?.data.label}
                        </span>
                        <span className={theme.textMuted}> → </span>
                        <span className="font-mono text-orange-500 font-medium">
                          :{e.data.relationshipType}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <span className={`${theme.textMuted} text-sm`}>None</span>
              )}
            </div>
          </div>

          <div>
            <h3
              className={`font-bold mb-2.5 flex items-center gap-2 ${theme.text}`}
            >
              <RotateCw size={18} className="text-purple-500" />
              Self ({selfEdges.length})
            </h3>
            <div
              className={`${theme.input} rounded-xl p-3 min-h-28 border ${theme.border}`}
            >
              {selfEdges.length > 0 ? (
                <div className="space-y-2.5">
                  {selfEdges.map((e) => (
                    <div key={e.id} className={`text-sm ${theme.text}`}>
                      <span className="font-mono text-purple-500 font-medium">
                        :{e.data.relationshipType}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className={`${theme.textMuted} text-sm`}>None</span>
              )}
            </div>
          </div>
        </div>

        {/* Cypher Preview */}
        <div>
          <div className="flex justify-between items-center mb-2.5">
            <h3 className={`font-bold text-lg ${theme.text}`}>
              Cypher Preview
            </h3>
            <button
              onClick={copyCypher}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                copied
                  ? "bg-green-500 text-white"
                  : `${theme.hover} ${theme.text} border ${theme.border}`
              }`}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre
            className={`${
              theme.input
            } rounded-xl p-4 text-sm font-mono overflow-x-auto border ${
              theme.border
            } ${darkMode ? "text-green-400" : "text-green-600"}`}
          >
            {cypherPreview}
          </pre>
        </div>
      </div>
    </div>
  );
};
