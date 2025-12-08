import React, { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCookies } from "react-cookie";
import { getCasinoIndividualResult } from "@/helper/casino";
import CasinoModal from "@/components/common/CasinoModal";
import CasinoMatchDetailsDisplay from "@/components/casino/CasinoMatchDetailsDisplay";

interface IndividualResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  resultId: string | null | undefined;
  gameType: string | undefined;
  title?: string;
  enableBetFiltering?: boolean;
  customGetFilteredBets?: (bets: any[], filter: string) => any[];
  hideUserBets?: boolean;
  showUserName?: boolean;
}

/**
 * Centralized Individual Result Modal Component
 * 
 * This component handles displaying individual casino result details
 * Used across AccountStatement, CasinoResult, and individual game components
 */
const IndividualResultModal: React.FC<IndividualResultModalProps> = ({
  isOpen,
  onClose,
  resultId,
  gameType,
  title = "Result Details",
  enableBetFiltering = true,
  customGetFilteredBets,
  hideUserBets = false,
  showUserName = false,
}) => {
  const [cookies] = useCookies(["Admin", "TechAdmin", "token", "clientToken"]);
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

  const getFilteredBets = customGetFilteredBets || defaultGetFilteredBets;

  // Fetch individual result details
  const {
    data: resultDetails,
    isLoading,
    error,
  } = useQuery<any>({
    queryKey: ["casinoIndividualResult", resultId, gameType],
    queryFn: () => getCasinoIndividualResult(resultId || undefined, cookies, gameType || ""),
    enabled: !!resultId && !!gameType && isOpen && !!(cookies.Admin || cookies.TechAdmin || cookies.token || cookies.clientToken),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: 2,
  });

  // Reset bet filter when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setBetFilter("all");
    }
  }, [isOpen]);

  // Get match data from result details
  const matchData = resultDetails?.data?.matchData || null;
  const userBets = resultDetails?.data?.userBets || [];

  return (
    <CasinoModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="xl"
      resultDetails={true}
    >
      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--bg-primary)]"></div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="text-red-500 text-center">
            <p>Failed to load result details</p>
            <p className="text-sm text-gray-500 mt-1">
              Please try again later
            </p>
          </div>
        </div>
      )}

      {/* Show message if gameType is missing */}
      {!gameType && !isLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="text-gray-500 text-center">
            <p>Game type is required to display result details</p>
          </div>
        </div>
      )}

      {/* No Data State */}
      {!isLoading && !error && !matchData && gameType && (
        <div className="flex justify-center items-center py-8">
          <div className="text-gray-500 text-center">
            <p>No result data available</p>
          </div>
        </div>
      )}

      {/* Success State - Show content when data is loaded */}
      {!isLoading && !error && matchData && gameType && (
        <CasinoMatchDetailsDisplay
          matchData={matchData}
          gameType={gameType}
          betFilter={enableBetFiltering ? betFilter : "all"}
          setBetFilter={enableBetFiltering ? setBetFilter : () => {}}
          getFilteredBets={getFilteredBets}
          userBets={hideUserBets ? [] : userBets}
          showUserName={showUserName}
        />
      )}
    </CasinoModal>
  );
};

export default IndividualResultModal;

