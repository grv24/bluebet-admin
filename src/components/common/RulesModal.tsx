import React from 'react';

interface CustomModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  headerExtras?: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  minWidth?: string;
}

const CustomModal: React.FC<CustomModalProps> = ({
  open,
  onClose,
  title,
  children,
  headerExtras,
  footer,
  maxWidth = '45vw',
  minWidth = '340px',
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fadein">
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-h-[90vh] flex flex-col  border-gray-300"
        style={{ maxWidth, minWidth }}
      >
        {/* Header */}
        <div className="bg-[#3b5160] px-6 py-3 rounded-t-lg flex flex-col items-center relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-3 text-2xl text-gray-200 hover:text-yellow-400 font-bold focus:outline-none"
            aria-label="Close"
          >
            ×
          </button>
          <div className="text-lg md:text-xl font-semibold text-yellow-400 tracking-wide text-center">
            {title}
          </div>
        </div>
        {/* Header Extras (e.g., language switch) */}
        {headerExtras && (
          <div className="flex gap-2 min-h-10 mt-1 ps-4 border-b border-gray-300">{headerExtras}</div>
        )}
        {/* Content */}
        <div className="p-6 overflow-y-auto text-gray-900 text-base max-h-[60vh] min-h-[200px]">
          {children}
        </div>
        {/* Footer */}
        {footer && (
          <div className="flex justify-center items-center py-2 bg-[#2c4a66] rounded-b-lg">{footer}</div>
        )}
      </div>
      <style>{`
        .animate-fadein {
          animation: fadein 0.2s;
        }
        @keyframes fadein {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default CustomModal; 