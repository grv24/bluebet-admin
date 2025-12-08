import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RiLockFill } from "react-icons/ri";
import { numberCards, shapeColors, individualCards, cardImage, getCardByCode } from "../../../utils/card";
import IndividualResultModal from "@/components/modals/IndividualResultModal";
import { memoizeCasinoComponent } from "../../../utils/casinoMemo";


interface NotenumberProps {
  casinoData: any;
  remainingTime: number;
  results?: any[];
  gameCode?: string;
  gameName?: string;
}

/**
 * Status values that indicate a betting market is locked/closed
 */
const LOCKED_STATUSES = [
  "CLOSED",
  "SUSPENDED",
  "Starting Soon.",
  "Ball Running",
  "INACTIVE",
];

/**
 * Check if a status is locked
 */
const isStatusLocked = (status: string): boolean => {
  return LOCKED_STATUSES.includes(status);
};

const NotenumberComponent: React.FC<NotenumberProps> = ({
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

  // Keep original gameCode for API calls (e.g., "NOTE_NUM")
  const apiGameType = React.useMemo(() => {
    return gameCode || "NOTE_NUM";
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


  // Get odds data from sub array (API format) or current.sub (socket format)
  const oddsData = useMemo(() => {
    return casinoData?.data?.current?.sub || casinoData?.data?.sub || [];
  }, [casinoData]);

  // Get match ID
  const matchId = useMemo(() => {
    return casinoData?.data?.current?.mid || casinoData?.data?.mid || null;
  }, [casinoData]);

  // Helper function to find odds by subtype or nat
  const getOddsBySubtype = (subtype: string, nat?: string) => {
    return (
      oddsData.find((item: any) => {
        if (nat) {
          return item.subtype === subtype && item.nat === nat;
        }
        return item.subtype === subtype;
      }) || null
    );
  };

  // Helper function to find odds by nat
  const getOddsByNat = (nat: string) => {
    return oddsData.find((item: any) => item.nat === nat) || null;
  };

  // Get odds for each betting option
  // Try to find by nat first (supporting both Card 4 and Card 6), then by subtype
  const oddCard6 = useMemo(() => {
    return (
      getOddsByNat("Odd Card 6") ||
      getOddsByNat("Odd Card 4") ||
      getOddsBySubtype("odd")
    );
  }, [oddsData]);

  const evenCard6 = useMemo(() => {
    return (
      getOddsByNat("Even Card 6") ||
      getOddsByNat("Even Card 4") ||
      getOddsBySubtype("even")
    );
  }, [oddsData]);

  const lowCard6 = useMemo(() => {
    return (
      getOddsByNat("Low Card 6") ||
      getOddsByNat("Low Card 4") ||
      getOddsBySubtype("low")
    );
  }, [oddsData]);

  const highCard6 = useMemo(() => {
    return (
      getOddsByNat("High Card 6") ||
      getOddsByNat("High Card 4") ||
      getOddsBySubtype("high")
    );
  }, [oddsData]);

  const redCard = useMemo(() => {
    return getOddsBySubtype("red");
  }, [oddsData]);

  const blackCard = useMemo(() => {
    return getOddsBySubtype("black");
  }, [oddsData]);

  const baccarat1 = useMemo(() => {
    return getOddsByNat("Baccarat 1");
  }, [oddsData]);

  const baccarat2 = useMemo(() => {
    return getOddsByNat("Baccarat 2");
  }, [oddsData]);

  const card6 = useMemo(() => {
    return getOddsBySubtype("card");
  }, [oddsData]);

  // Check if betting is locked
  const isLocked = (oddsItem: any): boolean => {
    if (!oddsItem) return true;

    const status = oddsItem.gstatus;
    const gval = oddsItem.gval;

    // Check gstatus - if status is explicitly "OPEN", it should be unlocked (unless gval overrides)
    const isStatusOpen = status === "OPEN" || status === "open";

    // Check gstatus - if status is suspended/closed
    const isStatusSuspended =
      status === "SUSPENDED" ||
      status === "CLOSED" ||
      Number(status) === 0 ||
      status === "0" ||
      String(status) === "0" ||
      isStatusLocked(status);

    // Check gval - if gval === 1, betting is suspended (only if gval is explicitly set)
    // gval can override OPEN status, but if gval is undefined/missing, trust gstatus
    const isGvalSuspended =
      gval !== undefined && gval !== null && (gval === 1 || gval === "1");

    const isTimeSuspended = remainingTime <= 3;

    // Check if both odds are 0 (no betting available)
    const hasNoBackOdds = !oddsItem.b || Number(oddsItem.b) === 0;
    const hasNoLayOdds = !oddsItem.l || Number(oddsItem.l) === 0;
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
    if (value === undefined || value === null || value === 0) return "0";
    const num = Number(value);
    if (isNaN(num) || num === 0) return "0";
    return num.toFixed(2);
  };



  // Handle clicking on individual result to show details


  // Map win value to display info
  const getResultDisplay = (win: string) => {
    const winMap: {
      [key: string]: { label: string; color: string; title: string };
    } = {
      "0": { label: "0", color: "text-gray-500", title: "No Result" },
      "1": { label: "1", color: "text-blue-500", title: "Result 1" },
      "2": { label: "2", color: "text-green-500", title: "Result 2" },
    };

    return (
      winMap[win] || { label: win, color: "text-gray-400", title: "Unknown" }
    );
  };
  const oddCard6Locked = isLocked(oddCard6);
  const evenCard6Locked = isLocked(evenCard6);
  const lowCard6Locked = isLocked(lowCard6);
  const highCard6Locked = isLocked(highCard6);
  const redCardLocked = isLocked(redCard);
  const blackCardLocked = isLocked(blackCard);
  const baccarat1Locked = isLocked(baccarat1);
  const baccarat2Locked = isLocked(baccarat2);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid md:grid-cols-3 grid-cols-1 gap-1 gap-y-2 py-2">
        <div className="flex flex-col w-full gap-1">
          <h1 className="text-sm font-semibold text-black text-center">
            {oddCard6?.nat || "Odd Card 6"}
          </h1>
          <div className="flex w-full gap-1 relative">
            {/* Back Odds */}
            <h2
              className={`text-sm w-full font-semibold text-black text-center leading-10 bg-[var(--bg-back)] relative ${
                !oddCard6Locked && oddCard6?.b
                  ? "hover:opacity-90"
                  : ""
              }`}
            >
              {oddCard6Locked && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                <RiLockFill className="text-white text-lg" />
              </div>
              )}
              {formatOdds(oddCard6?.b)}
            </h2>
            {/* Lay Odds */}
            <h2
              className={`text-sm w-full font-semibold text-black text-center leading-10 bg-[var(--bg-lay)] relative ${
                !oddCard6Locked && oddCard6?.l
                  ? "hover:opacity-90"
                  : ""
              }`}
            >
              {oddCard6Locked && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                  <RiLockFill className="text-white text-lg" />
                </div>
              )}
              {formatOdds(oddCard6?.l)}
            </h2>
          </div>
        </div>
        <div className="flex flex-col w-full gap-1">
          <div className="flex gap-2 justify-center items-center">
            <img
              src={shapeColors.red.Heart}
              className="w-6 leading-6"
              alt="red Heart"
            />
            <img
              src={shapeColors.black.Club}
              className="w-6 leading-6"
              alt="black Club"
            />
          </div>
          <div className="flex w-full gap-1 relative">
            {/* Red Card Back Odds */}
            <h2
              className={`text-sm w-full font-semibold text-black text-center leading-10 bg-[var(--bg-back)] relative ${
                !redCardLocked && redCard?.b
                  ? "hover:opacity-90"
                  : ""
              }`}
              
            >
              {redCardLocked && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                <RiLockFill className="text-white text-lg" />
              </div>
              )}
              {formatOdds(redCard?.b)}
            </h2>
            {/* Red Card Lay Odds */}
            <h2
              className={`text-sm w-full font-semibold text-black text-center leading-10 bg-[var(--bg-lay)] relative ${
                !redCardLocked && redCard?.l
                  ? "hover:opacity-90"
                  : ""
              }`}
              
            >
              {redCardLocked && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                  <RiLockFill className="text-white text-lg" />
                </div>
              )}
              {formatOdds(redCard?.l)}
            </h2>
          </div>
        </div>
        <div className="flex flex-col w-full gap-1">
          <h1 className="text-sm font-semibold text-black text-center">
            {lowCard6?.nat || "Low Card 6"}
          </h1>
          <div className="flex w-full gap-1 relative">
            {/* Back Odds */}
            <h2
              className={`text-sm w-full font-semibold text-black text-center leading-10 bg-[var(--bg-back)] relative ${
                !lowCard6Locked && lowCard6?.b
                  ? "hover:opacity-90"
                  : ""
              }`}
            >
              {lowCard6Locked && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                <RiLockFill className="text-white text-lg" />
              </div>
              )}
              {formatOdds(lowCard6?.b)}
            </h2>
            {/* Lay Odds */}
            <h2
              className={`text-sm w-full font-semibold text-black text-center leading-10 bg-[var(--bg-lay)] relative ${
                !lowCard6Locked && lowCard6?.l
                  ? "hover:opacity-90"
                  : ""
              }`}
            >
              {lowCard6Locked && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                  <RiLockFill className="text-white text-lg" />
                </div>
              )}
              {formatOdds(lowCard6?.l)}
            </h2>
          </div>
        </div>
        <div className="flex flex-col w-full gap-1">
          <h1 className="text-sm font-semibold text-black text-center">
            {evenCard6?.nat || "Even Card 6"}
          </h1>
          <div className="flex w-full gap-1 relative">
            {/* Back Odds */}
            <h2
              className={`text-sm w-full font-semibold text-black text-center leading-10 bg-[var(--bg-back)] relative ${
                !evenCard6Locked && evenCard6?.b
                  ? "hover:opacity-90"
                  : ""
              }`}
            >
              {evenCard6Locked && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                <RiLockFill className="text-white text-lg" />
              </div>
              )}
              {formatOdds(evenCard6?.b)}
            </h2>
            {/* Lay Odds */}
            <h2
              className={`text-sm w-full font-semibold text-black text-center leading-10 bg-[var(--bg-lay)] relative ${
                !evenCard6Locked && evenCard6?.l
                  ? "hover:opacity-90"
                  : ""
              }`}
            >
              {evenCard6Locked && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                  <RiLockFill className="text-white text-lg" />
                </div>
              )}
              {formatOdds(evenCard6?.l)}
            </h2>
          </div>
        </div>
        <div className="flex flex-col w-full gap-1">
          <div className="flex gap-2 justify-center items-center">
            <img
              src={shapeColors.red.Diamond}
              className="w-6 leading-6"
              alt="red Diamond"
            />
            <img
              src={shapeColors.black.Spade}
              className="w-6 leading-6"
              alt="black Spade"
            />
          </div>
          <div className="flex w-full gap-1 relative">
            {/* Black Card Back Odds */}
            <h2
              className={`text-sm w-full font-semibold text-black text-center leading-10 bg-[var(--bg-back)] relative ${
                !blackCardLocked && blackCard?.b
                  ? "hover:opacity-90"
                  : ""
              }`}
            >
              {blackCardLocked && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                <RiLockFill className="text-white text-lg" />
              </div>
              )}
              {formatOdds(blackCard?.b)}
            </h2>
            {/* Black Card Lay Odds */}
            <h2
              className={`text-sm w-full font-semibold text-black text-center leading-10 bg-[var(--bg-lay)] relative ${
                !blackCardLocked && blackCard?.l
                  ? "hover:opacity-90"
                  : ""
              }`}
            >
              {blackCardLocked && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                  <RiLockFill className="text-white text-lg" />
                </div>
              )}
              {formatOdds(blackCard?.l)}
            </h2>
          </div>
        </div>
        <div className="flex flex-col w-full gap-1">
          <h1 className="text-sm font-semibold text-black text-center">
            {highCard6?.nat || "High Card 6"}
          </h1>
          <div className="flex w-full gap-1 relative">
            {/* Back Odds */}
            <h2
              className={`text-sm w-full font-semibold text-black text-center leading-10 bg-[var(--bg-back)] relative ${
                !highCard6Locked && highCard6?.b
                  ? "hover:opacity-90"
                  : ""
              }`}
            >
              {highCard6Locked && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                <RiLockFill className="text-white text-lg" />
              </div>
              )}
              {formatOdds(highCard6?.b)}
            </h2>
            {/* Lay Odds */}
            <h2
              className={`text-sm w-full font-semibold text-black text-center leading-10 bg-[var(--bg-lay)] relative ${
                !highCard6Locked && highCard6?.l
                  ? "hover:opacity-90"
                  : ""
              }`}
            >
              {highCard6Locked && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                  <RiLockFill className="text-white text-lg" />
                </div>
              )}
              {formatOdds(highCard6?.l)}
            </h2>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-5 grid-cols-1 gap-2 place-content-center place-items-center">
        <div className="col-span-2 w-full p-2 border border-gray-200 rounded bg-gray-50">
          <div className="flex flex-col w-full gap-1">
            <h1 className="text-sm font-semibold text-black text-center">
              {baccarat1?.nat || "Baccarat 1"} (1st, 2nd, 3rd card)
            </h1>
            <div className="flex w-full gap-1 relative">
              {/* Back Odds */}
              <h2
                className={`text-sm w-full font-semibold text-black text-center leading-10 bg-[var(--bg-back)] relative ${
                  !baccarat1Locked && baccarat1?.b
                    ? "hover:opacity-90"
                    : ""
                }`}
              >
                {baccarat1Locked && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                <RiLockFill className="text-white text-lg" />
              </div>
                )}
                {formatOdds(baccarat1?.b)}
              </h2>
            </div>
          </div>
          <div className="flex flex-col w-full gap-1">
            <h1 className="text-sm font-semibold text-black text-center">
              {baccarat2?.nat || "Baccarat 2"} (4th, 5th, 6th card)
            </h1>
            <div className="flex w-full gap-1 relative">
              {/* Back Odds */}
              <h2
                className={`text-sm w-full font-semibold text-black text-center leading-10 bg-[var(--bg-back)] relative ${
                  !baccarat2Locked && baccarat2?.b
                    ? "hover:opacity-90"
                    : ""
                }`}
              >
                {baccarat2Locked && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                <RiLockFill className="text-white text-lg" />
              </div>
                )}
                {formatOdds(baccarat2?.b)}
              </h2>
            </div>
          </div>
        </div>
        <div className="col-span-3 w-full">
          <div className="flex justify-center items-center gap-2 border border-gray-200 rounded bg-gray-50 p-2">
            {["A", "2", "3", "4", "5", "6", "7", "8", "9", "10"].map(
              (item, index) => {
                const cardOdd = card6?.odds?.find((odd: any) => {
                  if (!odd.nat) return false;
                  // Match "Card A" with "A", "Card 2" with "2", etc.
                  const cardName = odd.nat.replace("Card ", "").trim();
                  return cardName === item;
                });
                const cardLocked = isLocked(card6) || !card6?.odds;
                return (
                  <div
                    key={index}
                    className="flex flex-col justify-center items-center gap-1 "
                  >
                    <span
                      className={`text-sm font-semibold text-black text-center `}
                    >
                      {formatOdds(cardOdd?.b)}
                    </span>
                    <div className="relative">
                    {cardLocked && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10 rounded">
                        <RiLockFill className="text-white text-xs" />
              </div>
                    )}
                    <img
                      className="w-8 leading-6"
                      src={
                        numberCards[item as keyof typeof numberCards] as string
                      }
                      alt={item}
                    />
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </div>

      {/* Results Section */}
      {/* {results && results.length > 0 && ( */}
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
            {results.slice(0, 10).map((item: any, index: number) => {
              const resultDisplay = getResultDisplay(item.win || "");
              const matchId = item?.mid || item?.result?.mid || item?.roundId || item?.id || item?.matchId;
              return (
                <div
                  key={item.mid || `result-${item.win}-${index}`}
                  className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-xs font-semibold text-yellow-500 ${
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
                  R
                </div>
              );
            })}
          </div>
        </div>
      {/* )} */}

      {/* Individual Result Details Modal */}
      <IndividualResultModal
        isOpen={isResultModalOpen}
        onClose={() => {
          setIsResultModalOpen(false);
          setSelectedResultId(null);
        }}
        resultId={selectedResultId}
        gameType={apiGameType}
        title={`${gameName || "Note Number"} Result Details`}
        enableBetFiltering={true}
      />
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const Notenumber = memoizeCasinoComponent(NotenumberComponent);
Notenumber.displayName = "Notenumber";

export default Notenumber;
