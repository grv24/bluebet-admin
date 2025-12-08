import React, { useState } from "react";
import { RiLockFill } from "react-icons/ri";
import { getCardByCode } from "../../../utils/card";
import { useNavigate } from "react-router-dom";
import IndividualResultModal from "@/components/modals/IndividualResultModal";
import { memoizeCasinoComponent } from "../../../utils/casinoMemo";

interface InstantProps {
  casinoData: any;
  remainingTime: number;
  onBetClick: (sid: string, type: "back" | "lay") => void;
  results?: any[];
  gameCode?: string;
  gameName?: string;
  currentBet?: any;
}

const InstantComponent: React.FC<InstantProps> = ({
  casinoData,
  remainingTime,
  onBetClick,
  results = [],
  gameCode,
  currentBet,
}) => {
  const navigate = useNavigate();
  
  // Modal state for individual result details
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);

  // Convert gameCode to gameSlug if gameCode is provided (for display)
  // gameCode format: "TEEN_3" -> gameSlug format: "teen3"
  const actualGameSlug = React.useMemo(() => {
    if (gameCode) {
      // Convert "TEEN_3" to "teen3"
      return gameCode.toLowerCase().replace(/_/g, "");
    }
    return "teen3"; // Default fallback
  }, [gameCode]);

  // Keep original gameCode for API calls (e.g., "TEEN_3")
  const apiGameType = React.useMemo(() => {
    if (gameCode) {
      return gameCode; // Use original gameCode for API
    }
    return "TEEN_3"; // Default fallback
  }, [gameCode]);
  // Get odds data from sub array
  // Handle both API format (data.sub) and socket format (data.current.sub)
  const getOddsData = (sid: number) => {
    // Try different possible data structures
    const subArray =
      casinoData?.data?.sub ||
      casinoData?.data?.current?.sub ||
      casinoData?.data?.data?.data?.sub ||
      casinoData?.data?.current?.data?.sub ||
      [];
    return (
      subArray.find(
        (item: any) => item.sid === sid || String(item.sid) === String(sid)
      ) || null
    );
  };

  // Check if betting is suspended
  const isSuspended = (oddsData: any): boolean => {
    if (!oddsData) return true;

    const status = oddsData.gstatus;
    const isStatusSuspended =
      status === "SUSPENDED" ||
      status === "CLOSED" ||
      Number(status) === 0 ||
      status === "0" ||
      String(status) === "0";

    const isTimeSuspended = remainingTime <= 3;

    return isStatusSuspended || isTimeSuspended;
  };

  // Get odds data for Player A and Player B
  const playerA = getOddsData(1);
  const playerB = getOddsData(2);

  // Format odds display
  const formatOdds = (value: number | string | undefined): string => {
    if (value === undefined || value === null) return "0";
    const num = Number(value);
    if (isNaN(num) || num === 0) return "0";
    return num.toFixed(2);
  };

  // Function to parse cards from API response
  const parseCards = (cardsString: string) => {
    if (!cardsString) return [];
    const cards = cardsString.split(",").filter((card) => card && card.trim());
    return cards;
  };

  // Function to filter user bets based on selected filter
  const getFilteredBets = (bets: any[], filter: string) => {
    if (filter === "all") return bets;

    return bets.filter((bet: any) => {
      const oddCategory = bet.betData?.oddCategory?.toLowerCase();
      const status = bet.status?.toLowerCase();

      switch (filter) {
        case "back":
          return oddCategory === "back";
        case "lay":
          return oddCategory === "lay";
        case "deleted":
          return status === "deleted" || status === "cancelled";
        default:
          return true;
      }
    });
  };

  // Handle clicking on individual result to show details
  const handleResultClick = (result: any) => {
    const resultId = result?.mid || result?.roundId || result?.id || result?.matchId || result?.result?.mid;
    
    if (!resultId) {
      console.error("🎰 Instant: No result ID found in result", result);
      return;
    }
    
    setSelectedResultId(String(resultId));
    setIsResultModalOpen(true);
  };

  return (
    <div>
      <div className="grid md:grid-cols-2 grid-cols-1 gap-1.5">
        {/* Player A Table */}
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border w-[59%] border-gray-300 px-2 py-1 text-left text-xs bg-gray-100">
                <div className="flex flex-col">
                  <span>Player A</span>
                </div>
              </th>
              <th className="border border-gray-300 px-2 py-1 text-center text-sm bg-[var(--bg-back)]">
                BACK
              </th>
              <th className="border border-gray-300 px-2 py-1 text-center text-sm bg-[var(--bg-lay)]">
                LAY
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Main Row */}
            <tr className="hover:bg-gray-50">
              <td className="border px-2 py-2 border-gray-300 text-sm font-semibold">
                Main
              </td>
              <td
                className="border px-2 py-2 border-gray-300 text-center cursor-pointer bg-[var(--bg-back)] relative"
                onClick={() =>
                  !isSuspended(playerA) && onBetClick("1", "back")
                }
              >
                {isSuspended(playerA) && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                    <RiLockFill className="text-white text-xl" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span>{formatOdds(playerA?.b)}</span>
                </div>
              </td>
              <td
                className="border px-2 py-2 border-gray-300 text-center cursor-pointer bg-[var(--bg-lay)] relative"
                onClick={() =>
                  !isSuspended(playerA) && onBetClick("1", "lay")
                }
              >
                {isSuspended(playerA) && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                    <RiLockFill className="text-white text-xl" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span>{formatOdds(playerA?.l)}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Player B Table */}
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border w-[59%] border-gray-300 px-2 py-1 text-left text-xs bg-gray-100">
                <div className="flex flex-col">
                  <span>Player B</span>
                </div>
              </th>
              <th className="border border-gray-300 px-2 py-1 text-center text-sm bg-[var(--bg-back)]">
                BACK
              </th>
              <th className="border border-gray-300 px-2 py-1 text-center text-sm bg-[var(--bg-lay)]">
                LAY
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Main Row */}
            <tr className="hover:bg-gray-50">
              <td className="border px-2 py-2 border-gray-300 text-sm font-semibold">
                Main
              </td>
              <td
                className="border px-2 py-2 border-gray-300 text-center cursor-pointer bg-[var(--bg-back)] relative"
                onClick={() =>
                  !isSuspended(playerB) && onBetClick("2", "back")
                }
              >
                {isSuspended(playerB) && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                    <RiLockFill className="text-white text-xl" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span>{formatOdds(playerB?.b)}</span>
                </div>
              </td>
              <td
                className="border px-2 py-2 border-gray-300 text-center cursor-pointer bg-[var(--bg-lay)] relative"
                onClick={() =>
                  !isSuspended(playerB) && onBetClick("2", "lay")
                }
              >
                {isSuspended(playerB) && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                    <RiLockFill className="text-white text-xl" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span>{formatOdds(playerB?.l)}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Results */}
      <div className="mt-1 flex flex-col gap-1">
        <div className="bg-[var(--bg-secondary85)] border border-gray-300 flex justify-between px-2 py-.5 items-center">
          <h2 className="text-sm font-normal leading-8 text-white">
            Last Result
          </h2>
          <button
            onClick={() => navigate(`/reports/casino-result-report?game=${gameCode || "TEEN_3"}`)}
            className="text-xs text-white hover:underline"
          >
            View All
          </button>
        </div>
        <div className="flex justify-end items-center mb-2 gap-2 mx-2">
          {Array.isArray(results) && results.length > 0 ? (
            results.slice(0, 10).map((item: any) => {
              // Handle win field: "1" = Player A, "2" = Player B
              const isPlayerA = item.win === "1" || item.win === "A";
              return (
                <div
                  key={item.mid || `result-${item.win}-${Math.random()}`}
                  className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-sm font-semibold ${
                    isPlayerA ? "text-red-500" : "text-yellow-500"
                  } cursor-pointer hover:scale-110 transition-transform`}
                  onClick={() => handleResultClick(item)}
                  title={`Round ID: ${item.mid || "N/A"} - Click to view details`}
                >
                  {isPlayerA ? "A" : "B"}
                </div>
              );
            })
          ) : (
            <div className="text-gray-400 text-sm py-2">No results available</div>
          )}
        </div>
      </div>

      {/* Individual Result Modal */}
      <IndividualResultModal
        isOpen={isResultModalOpen}
        onClose={() => {
          setIsResultModalOpen(false);
          setSelectedResultId(null);
        }}
        resultId={selectedResultId}
        gameType={apiGameType}
        title="Result Details"
        enableBetFiltering={true}
      />
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const Instant = memoizeCasinoComponent(InstantComponent);
Instant.displayName = "Instant";

export default Instant;
