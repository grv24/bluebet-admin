import React, { useState, useCallback, useEffect } from "react";
import CasinoModal from "@/components/common/CasinoModal";
import CasinoMatchDetailsDisplay from "@/components/casino/CasinoMatchDetailsDisplay";

interface CasinoMatchDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchData: any;
  casinoType: string;
}

const CasinoMatchDetailsModal: React.FC<CasinoMatchDetailsModalProps> = ({
  isOpen,
  onClose,
  matchData,
  casinoType,
}) => {
  // All hooks must be called before any early returns
  const [betFilter, setBetFilter] = useState("all");

  // Default bet filtering function
  const defaultGetFilteredBets = useCallback((bets: any[], filter: string) => {
    if (filter === "all") return bets;
    return bets.filter((bet: any) => {
      const betType = bet.betData?.betType?.toLowerCase() || 
                     bet.betData?.oddCategory?.toLowerCase() || "";
      const status = bet.status?.toLowerCase();
      switch (filter) {
        case "back":
          return betType === "back" || betType === "yes";
        case "lay":
          return betType === "lay" || betType === "no";
        case "deleted":
          return status === "deleted" || status === "cancelled";
        default:
          return true;
      }
    });
  }, []);

  // Reset bet filter when modal opens
  useEffect(() => {
    if (isOpen) {
      setBetFilter("all");
    }
  }, [isOpen]);

  // Early return after all hooks
  if (!isOpen || !matchData) return null;

  // Extract data from API response structure
  const data = matchData?.data || matchData;
  const matchDataObj = data?.matchData || data?.match || data;
  const userBets = data?.userBets || data?.bets || [];

  const getMatchTitle = () => {
    return `${casinoType ? casinoType.toUpperCase() : "Casino"} - Match Details`;
  };

  return (
    <CasinoModal
      isOpen={isOpen}
      onClose={onClose}
      title={getMatchTitle()}
      size="xl"
      resultDetails={true}
    >
      {!matchDataObj ? (
        <div className="flex justify-center items-center py-8">
          <div className="text-gray-500 text-center">
            <p>No match data available</p>
          </div>
        </div>
      ) : (
        <CasinoMatchDetailsDisplay
          matchData={matchDataObj}
          gameType={casinoType}
          betFilter={betFilter}
          setBetFilter={setBetFilter}
          getFilteredBets={defaultGetFilteredBets}
          userBets={userBets}
        />
      )}
    </CasinoModal>
  );
};

export default CasinoMatchDetailsModal;

