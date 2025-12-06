import React, { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import type { ThemeClasses } from "../../types";
import { DEFAULT_NODE_COLORS } from "../../constants";

interface ColorPickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (color: string) => void;
  currentColor: string;
  title?: string;
  presetColors?: string[];
  theme: ThemeClasses;
  darkMode: boolean;
}

export const ColorPickerDialog: React.FC<ColorPickerDialogProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentColor,
  title = "Choose Color",
  presetColors = DEFAULT_NODE_COLORS,
  theme,
}) => {
  const [customColor, setCustomColor] = useState(currentColor);
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [lightness, setLightness] = useState(50);

  useEffect(() => {
    setCustomColor(currentColor);
  }, [currentColor]);

  if (!isOpen) return null;

  const hslToHex = (h: number, s: number, l: number): string => {
    s /= 100;
    l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  const hslColor = hslToHex(hue, saturation, lightness);

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`${theme.surface} rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <h3 className={`text-xl font-bold ${theme.text}`}>{title}</h3>
          <button onClick={onClose} className={`p-2 rounded-lg ${theme.hover}`}>
            <X size={22} className={theme.textMuted} />
          </button>
        </div>

        {/* Preset Colors */}
        <div className="mb-5">
          <label className={`block text-sm font-semibold mb-3 ${theme.text}`}>
            Preset Colors
          </label>
          <div className="grid grid-cols-6 gap-2.5">
            {presetColors.map((color) => (
              <button
                key={color}
                onClick={() => {
                  setCustomColor(color);
                  onSelect(color);
                }}
                className={`w-12 h-12 rounded-xl transition-all hover:scale-110 flex items-center justify-center shadow-sm ${
                  currentColor === color
                    ? "ring-3 ring-blue-500 ring-offset-2 scale-110"
                    : "hover:shadow-md"
                }`}
                style={{
                  backgroundColor: color,
                }}
              >
                {currentColor === color && (
                  <Check size={20} className="text-white drop-shadow-md" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Color Input */}
        <div className="mb-5">
          <label className={`block text-sm font-semibold mb-3 ${theme.text}`}>
            Custom Color
          </label>
          <div className="flex gap-2.5">
            <input
              type="color"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              className="w-16 h-14 rounded-xl cursor-pointer border-0 shadow-sm"
            />
            <input
              type="text"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              className={`flex-1 px-4 py-3 border ${theme.border} rounded-xl ${theme.input} ${theme.text} font-mono text-base`}
              placeholder="#FF6B6B"
            />
          </div>
        </div>

        {/* HSL Sliders */}
        <div className="mb-5 space-y-4">
          <label className={`block text-sm font-semibold ${theme.text}`}>
            HSL Picker
          </label>

          <div>
            <div className="flex justify-between mb-2">
              <span className={`text-xs font-medium ${theme.textMuted}`}>
                Hue
              </span>
              <span className={`text-xs font-medium ${theme.text}`}>
                {hue}°
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              value={hue}
              onChange={(e) => setHue(parseInt(e.target.value))}
              className="w-full h-3 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, 
                  hsl(0, 100%, 50%), hsl(60, 100%, 50%), hsl(120, 100%, 50%), 
                  hsl(180, 100%, 50%), hsl(240, 100%, 50%), hsl(300, 100%, 50%), hsl(360, 100%, 50%))`,
              }}
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className={`text-xs font-medium ${theme.textMuted}`}>
                Saturation
              </span>
              <span className={`text-xs font-medium ${theme.text}`}>
                {saturation}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={saturation}
              onChange={(e) => setSaturation(parseInt(e.target.value))}
              className="w-full h-3 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, hsl(${hue}, 0%, ${lightness}%), hsl(${hue}, 100%, ${lightness}%))`,
              }}
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className={`text-xs font-medium ${theme.textMuted}`}>
                Lightness
              </span>
              <span className={`text-xs font-medium ${theme.text}`}>
                {lightness}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={lightness}
              onChange={(e) => setLightness(parseInt(e.target.value))}
              className="w-full h-3 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, hsl(${hue}, ${saturation}%, 0%), hsl(${hue}, ${saturation}%, 50%), hsl(${hue}, ${saturation}%, 100%))`,
              }}
            />
          </div>

          <button
            onClick={() => {
              setCustomColor(hslColor);
              onSelect(hslColor);
            }}
            className="w-full py-3 rounded-xl text-white font-medium shadow-lg hover:shadow-xl transition-all"
            style={{ backgroundColor: hslColor }}
          >
            Apply HSL Color
          </button>
        </div>

        {/* Preview & Actions */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label
              className={`block text-xs font-medium ${theme.textMuted} mb-2`}
            >
              Preview
            </label>
            <div
              className="h-14 rounded-xl shadow-lg border-2 border-dashed border-gray-400"
              style={{ backgroundColor: customColor }}
            />
          </div>
          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => {
                onSelect(customColor);
                onClose();
              }}
              className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-medium shadow-lg hover:shadow-xl transition-all"
            >
              Apply
            </button>
            <button
              onClick={onClose}
              className={`px-6 py-3 rounded-xl ${theme.hover} border ${theme.border} ${theme.text} font-medium`}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorPickerDialog;
