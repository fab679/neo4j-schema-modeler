import React from "react";
import {
  Plus,
  Download,
  Upload,
  Image,
  FileCode,
  ZoomIn,
  ZoomOut,
  Maximize,
  Moon,
  Sun,
  Trash2,
} from "lucide-react";
import type { ThemeClasses } from "../types";

interface ToolbarProps {
  theme: ThemeClasses;
  zoom: number;
  darkMode: boolean;
  onAddNode: () => void;
  onExportJSON: () => void;
  onExportImage: () => void;
  onExportCypher: () => void;
  onImport: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onClearCanvas: () => void;
  onToggleDarkMode: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  theme,
  zoom,
  darkMode,
  onAddNode,
  onExportJSON,
  onExportImage,
  onExportCypher,
  onImport,
  onZoomIn,
  onZoomOut,
  onResetView,
  onClearCanvas,
  onToggleDarkMode,
}) => {
  const iconColor = darkMode ? "text-gray-300" : "text-gray-600";

  const ToolButton: React.FC<{
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    primary?: boolean;
    danger?: boolean;
  }> = ({ onClick, icon, label, primary, danger }) => (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium
        transition-all duration-200 text-sm
        ${
          primary
            ? "bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/25"
            : danger
            ? `${theme.surface} ${iconColor} ${theme.hover} hover:bg-red-500/10 hover:text-red-500`
            : `${theme.surface} ${iconColor} ${theme.hover} hover:shadow-md`
        }
      `}
      title={label}
    >
      {icon}
      <span className="hidden lg:inline">{label}</span>
    </button>
  );

  return (
    <div
      className={`${theme.surface} border-b ${theme.border} px-6 py-3.5 flex items-center justify-between shadow-sm`}
    >
      {/* Left section - Logo and Add Node */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">N</span>
          </div>
          <div>
            <h1 className={`text-lg font-bold ${theme.text}`}>
              Schema Modeler
            </h1>
            <p className={`text-xs ${theme.textMuted}`}>
              Neo4j Visual Designer
            </p>
          </div>
        </div>

        <div className={`h-8 w-px ${theme.border} mx-2`} />

        <ToolButton
          onClick={onAddNode}
          icon={<Plus size={18} />}
          label="Add Node"
          primary
        />
      </div>

      {/* Center section - Zoom controls */}
      <div className="flex items-center gap-2">
        <ToolButton
          onClick={onZoomOut}
          icon={<ZoomOut size={18} />}
          label="Zoom Out"
        />
        <div
          className={`px-4 py-2 rounded-xl ${theme.surface} ${theme.text} font-mono text-sm min-w-[80px] text-center border ${theme.border}`}
        >
          {Math.round(zoom * 100)}%
        </div>
        <ToolButton
          onClick={onZoomIn}
          icon={<ZoomIn size={18} />}
          label="Zoom In"
        />
        <ToolButton
          onClick={onResetView}
          icon={<Maximize size={18} />}
          label="Reset View"
        />
      </div>

      {/* Right section - File operations and settings */}
      <div className="flex items-center gap-2">
        <ToolButton
          onClick={onImport}
          icon={<Upload size={18} />}
          label="Import"
        />
        <ToolButton
          onClick={onExportJSON}
          icon={<Download size={18} />}
          label="Export JSON"
        />
        <ToolButton
          onClick={onExportImage}
          icon={<Image size={18} />}
          label="Export Image"
        />
        <ToolButton
          onClick={onExportCypher}
          icon={<FileCode size={18} />}
          label="Export Cypher"
        />

        <div className={`h-8 w-px ${theme.border} mx-2`} />

        <ToolButton
          onClick={onClearCanvas}
          icon={<Trash2 size={18} />}
          label="Clear All"
          danger
        />

        <div className={`h-8 w-px ${theme.border} mx-2`} />

        <button
          onClick={onToggleDarkMode}
          className={`p-2.5 rounded-xl ${theme.surface} ${theme.hover} transition-all duration-200`}
          title={darkMode ? "Light Mode" : "Dark Mode"}
        >
          {darkMode ? (
            <Sun size={20} className="text-yellow-400" />
          ) : (
            <Moon size={20} className="text-gray-600" />
          )}
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
