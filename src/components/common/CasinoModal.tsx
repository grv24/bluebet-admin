import React from "react";
import { FaTimes } from "react-icons/fa";

interface CasinoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  showCloseButton?: boolean;
  className?: string;
  banner?: boolean;
  rules?: boolean;
  resultDetails?: boolean;
}

const CasinoModal: React.FC<CasinoModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
  className = "",
  banner = false,
  rules = false,
  resultDetails = false,
}) => {
  if (!isOpen) return null;

  // Determine modal width based on type and size
  const getModalWidth = () => {
    if (rules) {
      // Rules modal - extra large for responsive content
      return "max-w-6xl w-[95%]";
    } else if (resultDetails) {
      // Result details modal - large for tables
      return "max-w-5xl w-[90%]";
    } else {
      // Default modal - use size prop
      const sizeClasses = {
        sm: "max-w-sm w-[90%]",
        md: "max-w-md w-[90%]",
        lg: "max-w-lg w-[90%]",
        xl: "max-w-2xl w-[90%]",
      };
      return sizeClasses[size];
    }
  };

  // Determine header width based on modal type
  const getHeaderWidth = () => {
    if (rules) {
      return "w-full";
    } else if (resultDetails) {
      return "w-full";
    } else {
      return "w-full";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-999 flex items-start justify-center w-full">
      <div
        className={`bg-white shadow-lg ${getModalWidth()} max-h-[90vh] overflow-y-auto ${className}`}
      >
        {/* Modal Header */}
        <div
          className={`flex ${getHeaderWidth()} items-center justify-between bg-[var(--bg-primary)] p-2 sticky top-0 z-10`}
        >
          <h3 className="text-lg font-semibold text-white truncate pr-4">{title}</h3>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="text-white hover:cursor-pointer hover:text-gray-300 text-xl transition-colors flex-shrink-0"
            >
              <FaTimes />
            </button>
          )}
        </div>

        {/* Modal Content */}
        <div className="">{children}</div>
      </div>
    </div>
  );
};

export default CasinoModal;

