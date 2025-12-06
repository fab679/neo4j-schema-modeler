import React from "react";
import {
  Circle,
  Edit3,
  Info,
  Copy,
  Trash2,
  ArrowLeftRight,
  Palette,
  Download,
  Upload,
  Image,
  FileCode,
  RotateCcw,
} from "lucide-react";
import type { ContextMenuState, ThemeClasses } from "../types";

interface ContextMenuProps {
  contextMenu: ContextMenuState | null;
  onClose: () => void;
  theme: ThemeClasses;
  // Canvas actions
  onAddNode?: (x: number, y: number) => void;
  onResetView?: () => void;
  onClearCanvas?: () => void;
  onExportJSON?: () => void;
  onExportImage?: () => void;
  onExportCypher?: () => void;
  onImport?: () => void;
  // Node actions
  onEditNode?: (nodeId: string) => void;
  onViewNodeDetails?: (nodeId: string) => void;
  onDuplicateNode?: (nodeId: string) => void;
  onChangeNodeColor?: (nodeId: string) => void;
  onDeleteNode?: (nodeId: string) => void;
  // Edge actions
  onEditEdge?: (edgeId: string) => void;
  onReverseEdge?: (edgeId: string) => void;
  onChangeEdgeColor?: (edgeId: string) => void;
  onDeleteEdge?: (edgeId: string) => void;
  // Coordinate conversion
  screenToCanvas?: (x: number, y: number) => { x: number; y: number };
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  contextMenu,
  onClose,
  theme,
  onAddNode,
  onResetView,
  onClearCanvas,
  onExportJSON,
  onExportImage,
  onExportCypher,
  onImport,
  onEditNode,
  onViewNodeDetails,
  onDuplicateNode,
  onChangeNodeColor,
  onDeleteNode,
  onEditEdge,
  onReverseEdge,
  onChangeEdgeColor,
  onDeleteEdge,
  screenToCanvas,
}) => {
  if (!contextMenu) return null;

  const MenuItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    danger?: boolean;
    disabled?: boolean;
    shortcut?: string;
  }> = ({ icon, label, onClick, danger, disabled, shortcut }) => (
    <button
      onClick={() => {
        if (!disabled) {
          onClick();
          onClose();
        }
      }}
      disabled={disabled}
      className={`w-full px-3.5 py-2.5 text-left flex items-center gap-3 text-sm font-medium transition-all ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : danger
          ? "hover:bg-red-500/10 text-red-500"
          : `${theme.hover} ${theme.text}`
      }`}
    >
      <span className={danger ? "text-red-500" : theme.textMuted}>{icon}</span>
      <span className="flex-1">{label}</span>
      {shortcut && (
        <span className={`text-xs ${theme.textMuted}`}>{shortcut}</span>
      )}
    </button>
  );

  const Divider = () => <div className={`border-t ${theme.border} my-1`} />;

  const MenuHeader: React.FC<{ children: React.ReactNode }> = ({
    children,
  }) => (
    <div
      className={`px-3.5 py-2 text-xs font-semibold uppercase tracking-wider ${theme.textMuted}`}
    >
      {children}
    </div>
  );

  return (
    <div
      className={`absolute ${theme.surface} border ${theme.border} rounded-2xl shadow-2xl p-1.5 z-50 min-w-56 overflow-hidden animate-fade-in`}
      style={{
        left: contextMenu.x,
        top: contextMenu.y,
        backdropFilter: "blur(8px)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Canvas Context Menu */}
      {contextMenu.type === "canvas" && (
        <>
          <MenuHeader>Create</MenuHeader>
          <MenuItem
            icon={<Circle size={18} />}
            label="Add Node Here"
            onClick={() => {
              if (onAddNode && screenToCanvas) {
                const canvasPos = screenToCanvas(contextMenu.x, contextMenu.y);
                onAddNode(canvasPos.x, canvasPos.y);
              }
            }}
          />
          <Divider />
          <MenuHeader>Export</MenuHeader>
          <MenuItem
            icon={<Download size={18} />}
            label="Export as JSON"
            onClick={() => onExportJSON?.()}
          />
          <MenuItem
            icon={<Image size={18} />}
            label="Export as Image"
            onClick={() => onExportImage?.()}
          />
          <MenuItem
            icon={<FileCode size={18} />}
            label="Export as Cypher"
            onClick={() => onExportCypher?.()}
          />
          <MenuItem
            icon={<Upload size={18} />}
            label="Import JSON"
            onClick={() => onImport?.()}
          />
          <Divider />
          <MenuHeader>View</MenuHeader>
          <MenuItem
            icon={<RotateCcw size={18} />}
            label="Reset View"
            onClick={() => onResetView?.()}
          />
          <Divider />
          <MenuItem
            icon={<Trash2 size={18} />}
            label="Clear Canvas"
            onClick={() => onClearCanvas?.()}
            danger
          />
        </>
      )}

      {/* Node Context Menu */}
      {contextMenu.type === "node" && contextMenu.targetId && (
        <>
          <MenuHeader>Node Actions</MenuHeader>
          <MenuItem
            icon={<Edit3 size={18} />}
            label="Edit Properties"
            onClick={() => onEditNode?.(contextMenu.targetId!)}
          />
          <MenuItem
            icon={<Info size={18} />}
            label="View Details"
            onClick={() => onViewNodeDetails?.(contextMenu.targetId!)}
          />
          <Divider />
          <MenuItem
            icon={<Copy size={18} />}
            label="Duplicate Node"
            onClick={() => onDuplicateNode?.(contextMenu.targetId!)}
            shortcut="Ctrl+D"
          />
          <MenuItem
            icon={<Palette size={18} />}
            label="Change Color"
            onClick={() => onChangeNodeColor?.(contextMenu.targetId!)}
          />
          <Divider />
          <MenuItem
            icon={<Trash2 size={18} />}
            label="Delete Node"
            onClick={() => onDeleteNode?.(contextMenu.targetId!)}
            danger
            shortcut="Del"
          />
        </>
      )}

      {/* Edge Context Menu */}
      {contextMenu.type === "edge" && contextMenu.targetId && (
        <>
          <MenuHeader>Relationship Actions</MenuHeader>
          <MenuItem
            icon={<Edit3 size={18} />}
            label="Edit Properties"
            onClick={() => onEditEdge?.(contextMenu.targetId!)}
          />
          <MenuItem
            icon={<ArrowLeftRight size={18} />}
            label="Reverse Direction"
            onClick={() => onReverseEdge?.(contextMenu.targetId!)}
          />
          <MenuItem
            icon={<Palette size={18} />}
            label="Change Color"
            onClick={() => onChangeEdgeColor?.(contextMenu.targetId!)}
          />
          <Divider />
          <MenuItem
            icon={<Trash2 size={18} />}
            label="Delete Relationship"
            onClick={() => onDeleteEdge?.(contextMenu.targetId!)}
            danger
            shortcut="Del"
          />
        </>
      )}
    </div>
  );
};

export default ContextMenu;
