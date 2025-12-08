import React, { useState } from "react";
import SportMatchDetailsDisplay from "@/components/sport/SportMatchDetailsDisplay";

interface SportMatchDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchData: any;
}

const SportMatchDetailsModal: React.FC<SportMatchDetailsModalProps> = ({
  isOpen,
  onClose,
  matchData,
}) => {
  const [betFilter, setBetFilter] = useState("all");

  if (!isOpen || !matchData) return null;

  // Helper function to filter bets
  const getFilteredBets = (bets: any[], filter: string) => {
    if (filter === "all") return bets;
    if (filter === "deleted") return bets.filter((bet) => bet.isDeleted);
    return bets.filter((bet) => {
      const betType =
        bet.betData?.betType?.toLowerCase() ||
        bet.betData?.oddCategory?.toLowerCase() ||
        "";
      return betType === filter;
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            Sport Match Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <SportMatchDetailsDisplay
            responseData={matchData}
            betFilter={betFilter}
            setBetFilter={setBetFilter}
            getFilteredBets={getFilteredBets}
          />
        </div>
      </div>
    </div>
  );
};

export default SportMatchDetailsModal;

