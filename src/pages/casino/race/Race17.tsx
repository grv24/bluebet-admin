import React, { useMemo } from "react";
import { RiLockFill } from "react-icons/ri";
// import IndividualResultModal from "@/components/casino/IndividualResultModal";
// import { useIndividualResultModal } from "@/hooks/useIndividualResultModal";
import { useNavigate } from "react-router-dom";
import { memoizeCasinoComponent } from "../../../utils/casinoMemo";

interface Race17Props {
  casinoData: any;
  remainingTime: number;
  onBetClick: (sid: string, type: "back" | "lay") => void;
  results?: any[];
  gameCode?: string;
  gameName?: string;
  currentBet?: any;
}

const Race17Component: React.FC<Race17Props> = ({
  casinoData,
  remainingTime,
  onBetClick,
  results = [],
  gameCode,
}) => {
  const navigate = useNavigate();
  // const resultModal = useIndividualResultModal();
  
  // Get game slug from gameCode for navigation
  const gameSlug = gameCode || "";
  
  // Normalize game slug for IndividualResultModal
  const normalizedGameSlug = useMemo(() => {
    if (gameCode) {
      const lowerCaseCode = gameCode.toLowerCase();
      if (lowerCaseCode === "race_17" || lowerCaseCode === "race17") {
        return "race17";
      }
      return lowerCaseCode.replace(/[^a-z0-9]/g, "");
    }
    return "race17"; // Default fallback
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

  // Get odds for each betting option
  // Race to 17 - sid: 1
  const raceTo17 = getOddsBySid(1);
  
  // Big Card (7,8,9) - 3 - sid: 4
  const bigCard3 = getOddsBySid(4);
  
  // Zero Card - 3 - sid: 9
  const zeroCard3 = getOddsBySid(9);
  
  // Any Zero - sid: 12
  const anyZero = getOddsBySid(12);

  // Handle clicking on individual result to show details
  const handleResultClick = (result: any) => {
    if (!result?.mid) return;
    // resultModal.openModal(result.mid, result);
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
  // win "0" = Race to 17 didn't win (didn't reach 17)
  // win "1" = Race to 17 won (reached 17)
  const getResultDisplay = (win: string) => {
    // Find the odds data for this win value (win is the sid)
    const odd = oddsData.find((item: any) => String(item.sid) === String(win));

    if (odd) {
      // Use the nat field from odds data
      const nat = odd.nat || "";
      return { label: win === "1" ? "Y" : "N", color: win === "1" ? "text-yellow-500" : "text-red-500", title: nat };
    }

    // Fallback mapping
    const winMap: {
      [key: string]: { label: string; color: string; title: string };
    } = {
      "0": { label: "N", color: "text-red-500", title: "Lost (Didn't reach 17)" },
      "1": { label: "Y", color: "text-yellow-500", title: "Won (Reached 17)" },
    };

    return (
      winMap[win] || { label: win, color: "text-gray-400", title: "Unknown" }
    );
  };

  // Render a betting section
  const renderBettingSection = (
    label: string,
    oddsItem: any,
    sid: number
  ) => {
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
          <h2
            className={`text-sm w-full font-semibold text-black text-center leading-10 bg-[var(--bg-back)] relative ${
              !locked && oddsItem?.b ? "cursor-pointer hover:opacity-90" : ""
            }`}
            onClick={() =>
              !locked && oddsItem?.b && onBetClick(String(sid), "back")
            }
          >
            {locked && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                <RiLockFill className="text-white text-lg" />
              </div>
            )}
            {backOdds}
          </h2>
          {/* Lay Odds */}
          <h2
            className={`text-sm w-full font-semibold text-black text-center leading-10 bg-[var(--bg-lay)] relative ${
              !locked && oddsItem?.l ? "cursor-pointer hover:opacity-90" : ""
            }`}
            onClick={() =>
              !locked && oddsItem?.l && onBetClick(String(sid), "lay")
            }
          >
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
        {renderBettingSection("Race to 17", raceTo17, 1)}
        {renderBettingSection("Big Card (7,8,9) - 3", bigCard3, 4)}
        {renderBettingSection("Zero Card - 3", zeroCard3, 9)}
        {renderBettingSection("Any Zero", anyZero, 12)}
      </div>

      {/* Results Section */}
      <div className="mt-1 flex flex-col gap-1">
        <div className="bg-[var(--bg-secondary85)] border border-gray-300 flex justify-between px-2 py-0.5 items-center">
          <h2 className="text-sm font-normal leading-8 text-white">
            Last Result
          </h2>
        
          <h2
            onClick={() => navigate(`/casino-result?game=${gameSlug}`)}
            className="text-sm font-normal leading-8 text-white cursor-pointer hover:underline"
          >
            View All
          </h2>
        </div>
        <div className="flex justify-end items-center mb-2 gap-2 mx-2 flex-wrap">
          {Array.isArray(results) && results.length > 0 ? (
            results.slice(0, 10).map((item: any, index: number) => {
              const resultDisplay = getResultDisplay(item.win || "");
              return (
                <div
                  key={item.mid || `result-${item.win}-${index}`}
                  className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-xs font-semibold ${resultDisplay.color} cursor-pointer hover:scale-110 transition-transform`}
                  onClick={() => handleResultClick(item)}
                  title={`Round ID: ${item.mid || "N/A"} - ${resultDisplay.title} - Click to view details`}
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
      {/* <IndividualResultModal
        isOpen={resultModal.isOpen}
        onClose={resultModal.closeModal}
        resultId={resultModal.selectedResultId || undefined}
        gameType={normalizedGameSlug}
        title="Race to 17 Result Details"
        enableBetFiltering={true}
        customGetFilteredBets={getFilteredBets}
      /> */}
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const Race17 = memoizeCasinoComponent(Race17Component);
Race17.displayName = "Race17";

export default Race17;
