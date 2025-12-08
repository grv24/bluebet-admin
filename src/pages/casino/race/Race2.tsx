import React, { useMemo, useState } from "react";
import { RiLockFill } from "react-icons/ri";
import IndividualResultModal from "@/components/modals/IndividualResultModal";
import { useNavigate } from "react-router-dom";
import { memoizeCasinoComponent } from "../../../utils/casinoMemo";

interface Race2Props {
  casinoData: any;
  remainingTime: number;
  results?: any[];
  gameCode?: string;
  gameName?: string;
}

const Race2Component: React.FC<Race2Props> = ({
  casinoData,
  remainingTime,
  results = [],
  gameCode,
}) => {
  const navigate = useNavigate();

  // Modal state for individual result details
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);

  // Keep original gameCode for API calls (e.g., "RACE_2")
  const apiGameType = useMemo(() => {
    return gameCode || "RACE_2";
  }, [gameCode]);

  // Get odds data from sub array
  // Handle both API format (data.sub) and socket format (data.current.sub)
  const getOddsData = () => {
    const subArray =
      casinoData?.data?.sub ||
      casinoData?.data?.current?.sub ||
      casinoData?.data?.data?.data?.sub ||
      casinoData?.data?.current?.data?.sub ||
      [];
    return subArray;
  };

  // Check if betting is suspended
  const isLocked = (row: any): boolean => {
    if (!row) return true;

    const status = row.gstatus;
    const gval = row.gval;

    // Check gstatus - if status is explicitly "OPEN", it should be unlocked (unless gval overrides)
    const isStatusOpen = status === "OPEN" || status === "open";
    
    // Check gstatus - if status is suspended/closed
    const isStatusSuspended =
      status === "SUSPENDED" ||
      status === "CLOSED" ||
      Number(status) === 0 ||
      status === "0" ||
      String(status) === "0";

    // Check gval - if gval === 1, betting is suspended (only if gval is explicitly set)
    // gval can override OPEN status, but if gval is undefined/missing, trust gstatus
    const isGvalSuspended = gval !== undefined && gval !== null && (gval === 1 || gval === "1");

    const isTimeSuspended = remainingTime <= 3;

    // Check if both odds are 0 (no betting available)
    const hasNoBackOdds = !row.b || Number(row.b) === 0;
    const hasNoLayOdds = !row.l || Number(row.l) === 0;
    const hasNoOdds = hasNoBackOdds && hasNoLayOdds;

    // If status is explicitly OPEN and gval is not 1 (or undefined), it should be unlocked
    // unless time is low or both odds are 0
    if (isStatusOpen && !isGvalSuspended) {
      return isTimeSuspended || hasNoOdds;
    }

    // Lock if:
    // 1. Status is suspended/closed
    // 2. gval is 1 (suspended) - this can override OPEN status
    // 3. Time is low (<= 3 seconds)
    // 4. Both odds are 0 (no betting available)
    return (
      isStatusSuspended ||
      isGvalSuspended ||
      isTimeSuspended ||
      hasNoOdds
    );
  };

  // Format odds display
  const formatOdds = (value: number | string | undefined): string => {
    if (value === undefined || value === null) return "0";
    const num = Number(value);
    if (isNaN(num) || num === 0) return "0";
    return num.toFixed(2);
  };

  // Get all odds data
  const oddsData = getOddsData();

  // Get odds by sid
  const getOddsBySid = (sid: number) => {
    return (
      oddsData.find((item: any) => String(item.sid) === String(sid)) || null
    );
  };

  // Get odds for each player
  // Player A - sid: 1
  const playerA = getOddsBySid(1);
  // Player B - sid: 2
  const playerB = getOddsBySid(2);
  // Player C - sid: 3
  const playerC = getOddsBySid(3);
  // Player D - sid: 4
  const playerD = getOddsBySid(4);

  // Handle result click to open modal
  const handleResultClick = (item: any) => {
    // Extract matchId from result item
    const matchId = item?.mid || item?.result?.mid || item?.roundId || item?.id || item?.matchId;
    
    if (matchId && apiGameType) {
      setSelectedResultId(String(matchId));
      setIsResultModalOpen(true);
    }
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
        case "pending":
          return status === "pending" || status === "matched";
        case "won":
          return status === "won" || status === "settled";
        case "lost":
          return status === "lost" || status === "settled";
        default:
          return true;
      }
    });
  };

  // Map win value to display info
  // win "1" = Player A, "2" = Player B, "3" = Player C, "4" = Player D
  const getResultDisplay = (win: string) => {
    // Find the odds data for this win value (win is the sid)
    const odd = oddsData.find((item: any) => String(item.sid) === String(win));

    if (odd) {
      // Use the nat field from odds data
      const nat = odd.nat || "";
      // Extract player letter (A, B, C, D)
      const playerLetter = nat.replace("Player ", "").trim();
      return {
        label: playerLetter,
        color: "text-yellow-500",
        title: nat,
      };
    }

    // Fallback mapping
    const winMap: {
      [key: string]: { label: string; color: string; title: string };
    } = {
      "1": { label: "A", color: "text-yellow-500", title: "Player A" },
      "2": { label: "B", color: "text-yellow-500", title: "Player B" },
      "3": { label: "C", color: "text-yellow-500", title: "Player C" },
      "4": { label: "D", color: "text-yellow-500", title: "Player D" },
    };

    return (
      winMap[win] || { label: win, color: "text-gray-400", title: "Unknown" }
    );
  };

  // Render a betting section
  const renderBettingSection = (label: string, oddsItem: any, sid: number) => {
    const locked = isLocked(oddsItem);
    const backOdds = formatOdds(oddsItem?.b);
    const layOdds = formatOdds(oddsItem?.l);

    return (
      <div className="flex flex-col w-full gap-1">
        <h1 className="text-sm font-semibold text-black text-center">
          {label}
        </h1>
        <div className="flex w-full gap-1 relative">
          {/* Back Odds */}
          <h2 className="text-sm w-full font-semibold text-black text-center leading-10 bg-[var(--bg-back)] relative">
            {locked && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                <RiLockFill className="text-white text-lg" />
              </div>
            )}
            {backOdds}
          </h2>
          {/* Lay Odds */}
          <h2 className="text-sm w-full font-semibold text-black text-center leading-10 bg-[var(--bg-lay)] relative">
            {locked && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                <RiLockFill className="text-white text-lg" />
              </div>
            )}
            {layOdds}
          </h2>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-1.5">
      {/* Betting Grid */}
      <div className="grid md:grid-cols-4 grid-cols-2 gap-1">
        {renderBettingSection("Player A", playerA, 1)}
        {renderBettingSection("Player B", playerB, 2)}
        {renderBettingSection("Player C", playerC, 3)}
        {renderBettingSection("Player D", playerD, 4)}
      </div>

      {/* Results Section */}
      <div className="mt-1 flex flex-col gap-1">
        <div className="bg-[var(--bg-secondary85)] border border-gray-300 flex justify-between px-2 py-0.5 items-center">
          <h2 className="text-sm font-normal leading-8 text-white">
            Last Result
          </h2>
          <h2
            onClick={() => navigate(`/reports/casino-result-report?game=${apiGameType}`)}
            className="text-sm font-normal leading-8 text-white cursor-pointer hover:underline"
          >
            View All
          </h2>
        </div>
        <div className="flex justify-end items-center mb-2 gap-2 mx-2 flex-wrap">
          {Array.isArray(results) && results.length > 0 ? (
            results.slice(0, 10).map((item: any, index: number) => {
              const resultDisplay = getResultDisplay(item.win || "");
              const matchId = item?.mid || item?.result?.mid || item?.roundId || item?.id || item?.matchId;
              return (
                <div
                  key={item.mid || `result-${item.win}-${index}`}
                  className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-xs font-semibold ${resultDisplay.color} ${
                    matchId ? "cursor-pointer hover:scale-110 transition-transform select-none" : ""
                  }`}
                  title={`Round ID: ${item.mid || "N/A"} - ${resultDisplay.title}${matchId ? " - Click to view details" : ""}`}
                  onClick={(e) => {
                    if (matchId) {
                      e.preventDefault();
                      e.stopPropagation();
                      handleResultClick(item);
                    }
                  }}
                  role="button"
                  tabIndex={matchId ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (matchId && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      handleResultClick(item);
                    }
                  }}
                >
                  {resultDisplay.label}
                </div>
              );
            })
          ) : (
            <div className="text-gray-400 text-sm py-2">
              No results available
            </div>
          )}
        </div>
      </div>

      {/* Individual Result Details Modal */}
      <IndividualResultModal
        isOpen={isResultModalOpen}
        onClose={() => {
          setIsResultModalOpen(false);
          setSelectedResultId(null);
        }}
        resultId={selectedResultId}
        gameType={apiGameType}
        title="Race 2 Result Details"
        enableBetFiltering={true}
      />
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const Race2 = memoizeCasinoComponent(Race2Component);
Race2.displayName = "Race2";

export default Race2;
