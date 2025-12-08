import React, { useState } from "react";
import { RiLockFill } from "react-icons/ri";
import {
  getCardByCode,
  cardImage,
  getRedShapes,
  getBlackShapes,
} from "../../../utils/card";
import { useNavigate } from "react-router-dom";
import IndividualResultModal from "@/components/modals/IndividualResultModal";
import { memoizeCasinoComponent } from "../../../utils/casinoMemo";

interface DuskadumProps {
  casinoData: any;
  remainingTime: number;
  results?: any[];
  gameCode?: string;
  gameName?: string;
}

const DuskadumComponent: React.FC<DuskadumProps> = ({
  casinoData,
  remainingTime,
  results = [],
  gameCode,
  gameName,
}) => {
  const navigate = useNavigate();
  const [cardScrollIndex, setCardScrollIndex] = useState(0);

  // Modal state for individual result details
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);

  // Keep original gameCode for API calls (e.g., "DUM_10")
  const apiGameType = React.useMemo(() => {
    return gameCode || "DUM_10";
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

    // Check gstatus
    const isStatusSuspended =
      status === "SUSPENDED" ||
      status === "CLOSED" ||
      Number(status) === 0 ||
      status === "0" ||
      String(status) === "0";

    // Check gval - if gval === 1, betting is suspended
    const isGvalSuspended = gval === 1 || gval === "1";

    const isTimeSuspended = remainingTime <= 3;

    // Check if both odds are 0 (no betting available)
    const hasNoBackOdds = !row.b || Number(row.b) === 0;
    const hasNoLayOdds = !row.l || Number(row.l) === 0;
    const hasNoOdds = hasNoBackOdds && hasNoLayOdds;

    // Lock if:
    // 1. Status is suspended/closed
    // 2. gval is 1 (suspended)
    // 3. Time is low (<= 3 seconds)
    // 4. Both odds are 0 (no betting available)
    return isStatusSuspended || isGvalSuspended || isTimeSuspended || hasNoOdds;
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
  // Next Total 60 or More - sid: 1
  const nextTotal60 = getOddsBySid(1);
  // Red - sid: 3
  const red = getOddsBySid(3);
  // Black - sid: 4
  const black = getOddsBySid(4);
  // Even - sid: 5
  const even = getOddsBySid(5);
  // Odd - sid: 6
  const odd = getOddsBySid(6);

  // Get current total and card count
  const currentTotal = casinoData?.data?.csum || 0;
  const lastCards = casinoData?.data?.lcard || "";
  const cardCount = lastCards
    ? lastCards.split(",").filter((c: string) => c && c !== "1").length
    : 0;

  // Parse cards from lcard
  const parseCards = () => {
    if (!lastCards) return [];
    const cards = lastCards
      .split(",")
      .filter((c: string) => c && c !== "1" && c.trim());
    return cards;
  };

  const cards = parseCards();
  const displayedCards = cards.slice(cardScrollIndex, cardScrollIndex + 3);

  // Handle card navigation
  const scrollCardsLeft = () => {
    if (cardScrollIndex > 0) {
      setCardScrollIndex(cardScrollIndex - 1);
    }
  };

  const scrollCardsRight = () => {
    if (cardScrollIndex < cards.length - 3) {
      setCardScrollIndex(cardScrollIndex + 1);
    }
  };


  /**
   * Handle clicking on individual result to show details
   */



  // Map win value to display info
  // win "0" = No (didn't reach 60), "1" = Yes (reached 60 or more)
  const getResultDisplay = (win: string) => {
    // Fallback mapping
    const winMap: {
      [key: string]: { label: string; color: string; title: string };
    } = {
      "2": { label: "N", color: "text-red-500", title: "No (Didn't reach 60)" },
      "1": {
        label: "Y",
        color: "text-yellow-500",
        title: "Yes (Reached 60 or more)",
      },
    };

    return (
      winMap[win] || { label: win, color: "text-gray-400", title: "Unknown" }
    );
  };

  // Get red and black shapes
  const redShapes = getRedShapes();
  const blackShapes = getBlackShapes();

  return (
    <div className="flex flex-col gap-1.5">
      {/* Next Total 60 or More Section */}
    <div className="flex flex-col gap-1 bg-gray-50">
        <table className="w-full">
          <thead>
            <tr>
              <th className="min-w-1/2"></th>
              <th className="bg-[var(--bg-back)]">
                <h2 className="text-sm font-semibold text-black text-center py-1">
                  Back
                </h2>
              </th>
              <th className="bg-[var(--bg-lay)]">
                <h2 className="text-sm font-semibold text-black text-center py-1">
                  Lay
                </h2>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="text-sm font-semibold text-black text-center py-2">
                Next Total 60 or More
              </td>
              <td
                className={`bg-[var(--bg-back)] relative ${
                  !isLocked(nextTotal60) && nextTotal60?.b
                    ? "hover:opacity-90"
                    : ""
                }`}
                
              >
                {isLocked(nextTotal60) && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                    <RiLockFill className="text-white text-sm" />
                  </div>
                )}
                <h2 className="text-sm font-semibold text-black text-center py-2">
                  {formatOdds(nextTotal60?.b)}
                </h2>
              </td>
              <td
                className={`bg-[var(--bg-lay)] relative ${
                  !isLocked(nextTotal60) && nextTotal60?.l
                    ? "hover:opacity-90"
                    : ""
                }`}
                
              >
                {isLocked(nextTotal60) && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                    <RiLockFill className="text-white text-sm" />
                  </div>
                )}
                <h2 className="text-sm font-semibold text-black text-center py-2">
                  {formatOdds(nextTotal60?.l)}
                </h2>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Even/Odd and Red/Black Section */}
        <div className="grid grid-cols-2 gap-2">
        {/* Even - First Row */}
        <div className="flex flex-col w-full">
          <h2 className="text-sm font-semibold leading-6 text-center text-black">
            {formatOdds(even?.b)}
          </h2>
          <button
            className={`relative bg-gradient-to-r leading-10 from-[var(--bg-primary)] to-[var(--bg-secondary)] text-white w-full ${
              !isLocked(even) && even?.b
                ? "hover:opacity-90"
                : ""
            }`}
            disabled={isLocked(even)}
            
          >
            {isLocked(even) && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                        <RiLockFill className="text-white" />
                      </span>
            )}

            <span className="text-sm font-semibold">Even</span>
          </button>
        </div>

        {/* Red - First Row */}
        <div className="flex flex-col w-full">
          <h2 className="text-sm font-semibold leading-6 text-center text-black">
            {formatOdds(red?.b)}
          </h2>
          <button
            className={`relative bg-gradient-to-r leading-10 from-[var(--bg-primary)] to-[var(--bg-secondary)] text-white w-full ${
              !isLocked(red) && red?.b ? "hover:opacity-90" : ""
            }`}
            disabled={isLocked(red)}
            
          >
            {isLocked(red) && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                        <RiLockFill className="text-white" />
                      </span>
            )}
                      <div className="flex gap-1 py-2.5 justify-center items-center">
              <img className="w-5" src={redShapes.Diamond} alt="Red Diamond" />
              <img className="w-5" src={blackShapes.Spade} alt="Red Spade" />
                      </div>
          </button>
        </div>

        {/* Odd - Second Row */}
        <div className="flex flex-col w-full">
          <h2 className="text-sm font-semibold leading-6 text-center text-black">
            {formatOdds(odd?.b)}
          </h2>
          <button
            className={`relative bg-gradient-to-r leading-10 from-[var(--bg-primary)] to-[var(--bg-secondary)] text-white w-full ${
              !isLocked(odd) && odd?.b ? "hover:opacity-90" : ""
            }`}
            disabled={isLocked(odd)}
            
          >
            {isLocked(odd) && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                        <RiLockFill className="text-white" />
                      </span>
            )}

            <span className="text-sm font-semibold">Odd</span>
          </button>
        </div>

        {/* Black - Second Row */}
        <div className="flex flex-col w-full">
          <h2 className="text-sm font-semibold leading-6 text-center text-black">
            {formatOdds(black?.b)}
          </h2>
          <button
            className={`relative bg-gradient-to-r leading-10 from-[var(--bg-primary)] to-[var(--bg-secondary)] text-white w-full ${
              !isLocked(black) && black?.b
                ? "hover:opacity-90"
                : ""
            }`}
            disabled={isLocked(black)}
            
          >
            {isLocked(black) && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                        <RiLockFill className="text-white" />
                      </span>
            )}
                      <div className="flex gap-1 py-2.5 justify-center items-center">
              <img className="w-5" src={redShapes.Heart} alt="Black Heart" />
              <img className="w-5" src={blackShapes.Club} alt="Black Club" />
                      </div>
          </button>
        </div>
        </div>
       
      {/* Results Section */}
      <div className="mt-1 flex flex-col gap-1">
        <div className="bg-[var(--bg-secondary85)] border border-gray-300 flex justify-between px-2 py-0.5 items-center">
          <h2 className="text-sm font-normal leading-8 text-white">
            Last Result
          </h2>
          <button
            onClick={() => navigate(`/reports/casino-result-report?game=${apiGameType}`)}
            className="text-xs text-white hover:underline"
          >
            View All
          </button>
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
        title={`${gameName || "Dus Ka Dum"} Result Details`}
        enableBetFiltering={true}
      />
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const Duskadum = memoizeCasinoComponent(DuskadumComponent);
Duskadum.displayName = "Duskadum";

export default Duskadum;
