import React from "react";
import { AlertTriangle, Info, AlertCircle, X } from "lucide-react";
import type { ThemeClasses } from "../../types";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  theme: ThemeClasses;
  darkMode: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  theme,
  darkMode,
}) => {
  if (!isOpen) return null;

  const icons = {
    danger: <AlertTriangle size={28} className="text-red-500" />,
    warning: <AlertCircle size={28} className="text-yellow-500" />,
    info: <Info size={28} className="text-blue-500" />,
  };

  const iconBg = {
    danger: darkMode ? "bg-red-500/20" : "bg-red-100",
    warning: darkMode ? "bg-yellow-500/20" : "bg-yellow-100",
    info: darkMode ? "bg-blue-500/20" : "bg-blue-100",
  };

  const buttonColors = {
    danger: "bg-red-500 hover:bg-red-600",
    warning: "bg-yellow-500 hover:bg-yellow-600",
    info: "bg-blue-500 hover:bg-blue-600",
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`${theme.surface} rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${iconBg[variant]}`}>
            {icons[variant]}
          </div>
          <div className="flex-1">
            <h3 className={`text-xl font-bold ${theme.text}`}>{title}</h3>
            <p className={`mt-2.5 ${theme.textMuted} leading-relaxed`}>
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${theme.hover} -mt-1 -mr-1`}
          >
            <X size={22} className={theme.textMuted} />
          </button>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className={`px-6 py-3 rounded-xl ${theme.hover} border ${theme.border} ${theme.text} font-medium transition-all`}
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-6 py-3 rounded-xl text-white font-medium shadow-lg hover:shadow-xl transition-all ${buttonColors[variant]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
