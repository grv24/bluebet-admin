import React from "react";
import { FaExclamationTriangle, FaClock, FaSignOutAlt } from "react-icons/fa";
import { ForceLogoutData } from "@/utils/socketService";

/**
 * Props interface for ForceLogoutModal component
 * Defines the properties required for the force logout modal
 */
interface ForceLogoutModalProps {
  isOpen: boolean;                    // Whether the modal is open
  data: ForceLogoutData | null;      // Force logout data from server
  onClose: () => void;               // Function to close the modal
}

/**
 * ForceLogoutModal Component
 * 
 * Modal component that displays when a force logout event is triggered.
 * Shows information about why the user was logged out and provides
 * a way to close the modal and redirect to login.
 * 
 * @param isOpen - Whether the modal should be displayed
 * @param data - Force logout data containing reason and metadata
 * @param onClose - Function to handle modal close action
 * @returns JSX element representing the force logout modal
 */
const ForceLogoutModal: React.FC<ForceLogoutModalProps> = ({
  isOpen,
  data,
  onClose,
}) => {
  if (!isOpen || !data) return null;

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0">
            <FaExclamationTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Session Terminated
            </h3>
            <p className="text-sm text-gray-600">
              Your session has been ended by the system
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason
            </label>
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-800 text-sm font-medium">{data.reason}</p>
              {data.message && (
                <p className="text-red-700 text-sm mt-1">{data.message}</p>
              )}
            </div>
          </div>

          {/* Timestamp */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time
            </label>
            <div className="flex items-center gap-2 text-gray-600">
              <FaClock className="w-4 h-4" />
              <span className="text-sm">
                {formatTimestamp(data.timestamp)}
              </span>
            </div>
          </div>

          {/* New Login Location (if available) */}
          {data.newLoginLocation && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Login Location
              </label>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-blue-800 text-sm">{data.newLoginLocation}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
          >
            <FaSignOutAlt className="w-4 h-4" />
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForceLogoutModal;
