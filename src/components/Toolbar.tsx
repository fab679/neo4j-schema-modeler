import React from "react";
import {
  Circle,
  Save,
  FolderOpen,
  Image,
  FileCode,
  ZoomIn,
  ZoomOut,
  Undo2,
  Redo2,
  Maximize2,
} from "lucide-react";
import type { ThemeClasses } from "../types";

interface ToolbarProps {
  theme: ThemeClasses;
  zoom: number;
  onAddNode: () => void;
  onExportJSON: () => void;
  onExportImage: () => void;
  onExportCypher: () => void;
  onImport: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  theme,
  zoom,
  onAddNode,
  onExportJSON,
  onExportImage,
  onExportCypher,
  onImport,
  onZoomIn,
  onZoomOut,
  onResetView,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}) => {
  const ToolButton: React.FC<{
    icon: React.ReactNode;
    title: string;
    onClick: () => void;
    disabled?: boolean;
    primary?: boolean;
  }> = ({ icon, title, onClick, disabled, primary }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-3 rounded-xl transition-all duration-200 flex items-center justify-center
        ${
          disabled
            ? "opacity-40 cursor-not-allowed"
            : primary
            ? "bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl"
            : `${theme.hover} hover:shadow-md`
        }
      `}
      title={title}
    >
      {icon}
    </button>
  );

  const Divider = () => (
    <div className={`w-10 h-px my-2.5 ${theme.border} opacity-50`} />
  );

  const SectionLabel: React.FC<{ children: React.ReactNode }> = ({
    children,
  }) => (
    <span
      className={`text-[10px] font-medium uppercase tracking-wider ${theme.textMuted} mt-2.5 mb-1`}
    >
      {children}
    </span>
  );

  return (
    <div
      className={`w-20 ${theme.surface} border-r ${theme.border} flex flex-col items-center py-5 px-2.5 gap-1.5 shadow-lg`}
    >
      {/* Add Node - Primary Action */}
      <SectionLabel>Create</SectionLabel>
      <ToolButton
        icon={<Circle size={24} strokeWidth={2.5} />}
        title="Add Node"
        onClick={onAddNode}
        primary
      />

      <Divider />

      {/* Export/Import */}
      <SectionLabel>File</SectionLabel>
      <ToolButton
        icon={<Save size={22} />}
        title="Export JSON"
        onClick={onExportJSON}
      />
      <ToolButton
        icon={<FolderOpen size={22} />}
        title="Import JSON"
        onClick={onImport}
      />
      <ToolButton
        icon={<Image size={22} />}
        title="Export Image"
        onClick={onExportImage}
      />
      <ToolButton
        icon={<FileCode size={22} />}
        title="Export Cypher"
        onClick={onExportCypher}
      />

      <Divider />

      {/* Zoom Controls */}
      <SectionLabel>View</SectionLabel>
      <ToolButton
        icon={<ZoomIn size={22} />}
        title="Zoom In"
        onClick={onZoomIn}
      />
      <div
        className={`py-2 px-3 rounded-lg ${theme.input} ${theme.text} text-sm font-medium min-w-14 text-center`}
      >
        {Math.round(zoom * 100)}%
      </div>
      <ToolButton
        icon={<ZoomOut size={22} />}
        title="Zoom Out"
        onClick={onZoomOut}
      />
      <ToolButton
        icon={<Maximize2 size={22} />}
        title="Reset View"
        onClick={onResetView}
      />

      {/* Undo/Redo - if available */}
      {(onUndo || onRedo) && (
        <>
          <Divider />
          <SectionLabel>Edit</SectionLabel>
          {onUndo && (
            <ToolButton
              icon={<Undo2 size={22} />}
              title="Undo (Ctrl+Z)"
              onClick={onUndo}
              disabled={!canUndo}
            />
          )}
          {onRedo && (
            <ToolButton
              icon={<Redo2 size={22} />}
              title="Redo (Ctrl+Y)"
              onClick={onRedo}
              disabled={!canRedo}
            />
          )}
        </>
      )}

      {/* Spacer to push version to bottom */}
      <div className="flex-1" />

      {/* Version indicator */}
      <span className={`text-[10px] ${theme.textMuted} opacity-50`}>v2.0</span>
    </div>
  );
};

export default Toolbar;
