import React, { useMemo, useState } from "react";
import { RiLockFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import IndividualResultModal from "@/components/modals/IndividualResultModal";
import { memoizeCasinoComponent } from "../../../utils/casinoMemo";

interface Onecard2020Props {
  casinoData: any;
  remainingTime: number;
  results?: any[];
  gameCode?: string;
  gameName?: string;
}

const Onecard2020Component: React.FC<Onecard2020Props> = ({
  casinoData,
  remainingTime,
  results = [],
  gameCode,
  gameName,
}) => {
  const navigate = useNavigate();

  // Modal state for individual result details
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);

  // Keep original gameCode for API calls (e.g., "TEEN_120")
  const apiGameType = useMemo(() => {
    return gameCode || "TEEN_120";
  }, [gameCode]);

  // Handle result click to open modal
  const handleResultClick = (item: any) => {
    // Extract matchId from result item
    const matchId = item?.mid || item?.result?.mid || item?.roundId || item?.id || item?.matchId;
    
    if (matchId && apiGameType) {
      setSelectedResultId(String(matchId));
      setIsResultModalOpen(true);
    }
  };
  // Get odds data from sub array
  // Handle both API format (data.sub) and socket format (data.current.sub)
  const getOddsData = (sid: number) => {
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

    // If status is explicitly OPEN and gval is not 1 (or undefined), it should be unlocked
    // unless time is low
    if (isStatusOpen && !isGvalSuspended) {
      return isTimeSuspended;
    }

    // Lock if:
    // 1. Status is suspended/closed
    // 2. gval is 1 (suspended) - this can override OPEN status
    // 3. Time is low (<= 3 seconds)
    return (
      isStatusSuspended ||
      isGvalSuspended ||
      isTimeSuspended
    );
  };

  // Format odds display
  const formatOdds = (value: number | string | undefined): string => {
    if (value === undefined || value === null) return "0";
    const num = Number(value);
    if (isNaN(num) || num === 0) return "0";
    return num.toFixed(2);
  };

  // Profit/Loss calculation function


  // Get odds data for each betting option
  const playerRow = getOddsData(1); // Player
  const dealerRow = getOddsData(2); // Dealer
  const tieRow = getOddsData(3); // Tie
  const pairRow = getOddsData(4); // Pair

  // Map win value to display info
  const getResultDisplay = (win: string) => {
    switch (win) {
      case "1":
        return { label: "P", color: "text-red-500", title: "Player" };
      case "2":
        return { label: "D", color: "text-yellow-500", title: "Dealer" };
      case "3":
        return { label: "T", color: "text-yellow-500", title: "Tie" };
      case "4":
        return { label: "PR", color: "text-green-500", title: "Pair" };
      default:
        return { label: "N", color: "text-gray-400", title: "Unknown" };
    }
  };

  return (
    <div className="">
      <div className="flex bg-[var(--bg-table-row)] justify-center gap-1 items-stretch overflow-x-auto min-h-30">
        {/* Player */}
        <div className="shrink-0 basis-[25%]">
          <div className="h-full flex flex-col gap-1 p-1">
            <h2 className="text-base font-semibold leading-10 text-center">
              {formatOdds(playerRow?.b)}
            </h2>
            <div className="relative">
              <button
                className="relative h-10 sm:h-12 bg-gradient-to-r from-[var(--bg-primary)] to-[var(--bg-secondary)] text-base font-semibold text-white w-full"
                disabled={isLocked(playerRow)}
              >
                {isLocked(playerRow) && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <RiLockFill className="text-white" />
                  </span>
                )}
                Player
              </button>
              
            </div>
          </div>
        </div>
        {/* Tie */}
        <div className="shrink-0 basis-[16.6667%]">
          <div className="h-full flex flex-col gap-1 p-1">
            <h2 className="text-base font-semibold leading-10 text-center">
              {formatOdds(tieRow?.b)}
            </h2>
            <div className="relative">
              <button
                className="relative h-10 sm:h-12 bg-gradient-to-r from-[var(--bg-primary)] to-[var(--bg-secondary)] text-base font-semibold text-white w-full"
                disabled={isLocked(tieRow)}
              >
                {isLocked(tieRow) && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <RiLockFill className="text-white" />
                  </span>
                )}
                Tie
              </button>
              
            </div>
          </div>
        </div>
        {/* Dealer */}
        <div className="shrink-0 basis-[25%]">
          <div className="h-full flex flex-col gap-1 p-1">
            <h2 className="text-base font-semibold leading-10 text-center">
              {formatOdds(dealerRow?.b)}
            </h2>
            <div className="relative">
              <button
                className="relative h-10 sm:h-12 bg-gradient-to-r from-[var(--bg-primary)] to-[var(--bg-secondary)] text-base font-semibold text-white w-full"
                disabled={isLocked(dealerRow)}
              >
                {isLocked(dealerRow) && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <RiLockFill className="text-white" />
                  </span>
                )}
                Dealer
              </button>
              
            </div>
          </div>
        </div>
        {/* vertical separator */}
        <div className="shrink-0 w-2 bg-[var(--bg-secondary)] mx-1" />
        {/* Pair */}
        <div className="shrink-0 basis-[25%]">
          <div className="h-full flex flex-col gap-1 p-1">
            <h2 className="text-base font-semibold leading-10 text-center">
              {formatOdds(pairRow?.b)}
            </h2>
            <div className="relative">
              <button
                className="relative h-10 sm:h-12 bg-gradient-to-r from-[var(--bg-primary)] to-[var(--bg-secondary)] text-base font-semibold text-white w-full"
                disabled={isLocked(pairRow)}
              >
                {isLocked(pairRow) && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <RiLockFill className="text-white" />
                  </span>
                )}
                Pair
              </button>
              
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="mt-1 flex flex-col gap-1">
        <div className="bg-[var(--bg-secondary85)] border border-gray-300 flex justify-between px-2 py-.5 items-center">
          <h2 className="text-sm font-normal leading-8 text-white">
            Last Result
          </h2>
          <h2
            onClick={() => navigate(`/reports/casino-result-report?game=${apiGameType}`)}
            className="text-sm font-normal leading-8 text-white hover:underline"
          >
            View All
          </h2>
        </div>
        <div className="flex justify-end items-center mb-2 gap-2 mx-2">
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
                  title={`Round ID: ${item.mid || "N/A"} - Winner: ${resultDisplay.title}${matchId ? " - Click to view details" : ""}`}
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
            <div className="text-gray-400 text-sm py-2">No results available</div>
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
        title={`${gameName || "1 Card 20-20"} Result Details`}
        enableBetFiltering={true}
      />
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const Onecard2020 = memoizeCasinoComponent(Onecard2020Component);
Onecard2020.displayName = "Onecard2020";

export default Onecard2020;
