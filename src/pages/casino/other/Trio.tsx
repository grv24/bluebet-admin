import React, { useState } from "react";
import { RiLockFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
// import IndividualResultModal from "@/components/casino/IndividualResultModal";
// import { useIndividualResultModal } from "@/hooks/useIndividualResultModal";
import { memoizeCasinoComponent } from "../../../utils/casinoMemo";

interface TrioProps {
  casinoData: any;
  remainingTime: number;
  onBetClick: (sid: string, type: "back" | "lay") => void;
  results?: any[];
  gameCode?: string;
  gameName?: string;
  currentBet?: any;
}

const TrioComponent: React.FC<TrioProps> = ({
  casinoData,
  remainingTime,
  onBetClick,
  results = [],
  gameCode,
  gameName,
  currentBet,
}) => {
  const navigate = useNavigate();
  // const resultModal = useIndividualResultModal();

  // Get game slug from gameCode and normalize it
  const gameSlug = gameCode || "";
  const actualGameSlug = React.useMemo(() => {
    if (gameSlug) {
      return gameSlug.toLowerCase().replace(/[^a-z0-9]/g, "");
    }
    return "trio"; // Default fallback
  }, [gameSlug]);

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

  // Get odds by sid
  const getOddsBySid = (sid: number) => {
    const oddsData = getOddsData();
    return (
      oddsData.find((item: any) => String(item.sid) === String(sid)) || null
    );
  };

  // Check if betting is suspended
  const isLocked = (oddsItem: any): boolean => {
    if (!oddsItem) return true;

    const status = oddsItem.gstatus;
    const isStatusSuspended =
      status === "SUSPENDED" ||
      status === "CLOSED" ||
      Number(status) === 0 ||
      status === "0" ||
      String(status) === "0";

    const isTimeSuspended = remainingTime <= 3;

    // Check if both odds are 0 (no betting available)
    const hasNoBackOdds = !oddsItem.b || Number(oddsItem.b) === 0;
    const hasNoLayOdds = !oddsItem.l || Number(oddsItem.l) === 0;
    const hasNoOdds = hasNoBackOdds && hasNoLayOdds;

    return isStatusSuspended || isTimeSuspended || hasNoOdds;
  };

  // Format odds display
  const formatOdds = (value: number | string | undefined): string => {
    if (value === undefined || value === null) return "0";
    const num = Number(value);
    if (isNaN(num) || num === 0) return "0";
    return num.toFixed(2);
  };

  // Get odds for each betting option
  const sessionOdds = getOddsBySid(1);
  const cardJudgement124Odds = getOddsBySid(2);
  const cardJudgementJQKOdds = getOddsBySid(3);
  const twoRedOnlyOdds = getOddsBySid(4);
  const twoBlackOnlyOdds = getOddsBySid(5);
  const twoOddOnlyOdds = getOddsBySid(6);
  const twoEvenOnlyOdds = getOddsBySid(7);
  const pairOdds = getOddsBySid(8);
  const flushOdds = getOddsBySid(9);
  const straightOdds = getOddsBySid(10);
  const trioOdds = getOddsBySid(11);
  const straightFlushOdds = getOddsBySid(12);

  // Render a betting section with back and lay
  const renderBettingSection = (
    label: string,
    oddsItem: any,
    sid: number,
    showLay: boolean = true
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
          {/* Lay Odds - only show if showLay is true */}
          {showLay && (
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
          )}
        </div>
      </div>
    );
  };

  /**
   * Handle clicking on individual result to show details
   */
  const handleResultClick = (result: any) => {
    const resultId = result?.mid || result?.roundId || result?.id || result?.matchId;
    
    if (!resultId) {
      console.error("🎰 Trio: No result ID found in result", result);
      return;
    }
    
    if (!actualGameSlug) {
      console.error("🎰 Trio: No gameSlug available", { gameCode, gameSlug, actualGameSlug });
      return;
    }
    
    // resultModal.openModal(String(resultId), result);
  };


  // Map win value to display info
  const getResultDisplay = (win: string) => {
    // For Trio, win values might be different - need to map based on actual data
    const winMap: {
      [key: string]: { label: string; color: string; title: string };
    } = {
      "0": { label: "R", color: "text-yellow-500", title: "No" },
      "1": { label: "R", color: "text-yellow-500", title: "Yes" },
    };

    return (
      winMap[win] || { label: win, color: "text-gray-400", title: "Unknown" }
    );
  };

  return (
    <div className="flex flex-col gap-2 bg-gray-50 p-2">
      {/* First Row - 3 columns */}
      <div className="grid md:grid-cols-3 grid-cols-2 place-content-center place-items-center gap-1">
        {renderBettingSection("Session", sessionOdds, 1)}
        {renderBettingSection(
          "3 Card Judgement(1 2 4)",
          cardJudgement124Odds,
          2
        )}
        {renderBettingSection(
          "3 Card Judgement(J Q K)",
          cardJudgementJQKOdds,
          3
        )}
      </div>

      {/* Second Row - 4 columns */}
      <div className="grid md:grid-cols-4 grid-cols-2 place-content-center place-items-center gap-1">
        {renderBettingSection("Two Red Only", twoRedOnlyOdds, 4)}
        {renderBettingSection("Two Black Only", twoBlackOnlyOdds, 5)}
        {renderBettingSection("Two Odd Only", twoOddOnlyOdds, 6)}
        {renderBettingSection("Two Even Only", twoEvenOnlyOdds, 7)}
      </div>

      {/* Third Row - 5 columns (only back odds) */}
      <div className="grid md:grid-cols-5 grid-cols-2 place-content-center place-items-center gap-1">
        {renderBettingSection("Pair", pairOdds, 8, false)}
        {renderBettingSection("Flush", flushOdds, 9, false)}
        {renderBettingSection("Straight", straightOdds, 10, false)}
        {renderBettingSection("Trio", trioOdds, 11, false)}
        {renderBettingSection("Straight Flush", straightFlushOdds, 12, false)}
      </div>

      {/* Results Section */}
      <div className="mt-1 flex flex-col gap-1">
        <div className="bg-[var(--bg-secondary85)] border border-gray-300 flex justify-between px-2 py-0.5 items-center">
          <h2 className="text-sm font-normal leading-8 text-white">
            Last Result
          </h2>
          <button
            onClick={() => navigate(`/casino-result?game=${gameSlug}`)}
            className="text-xs text-white hover:underline"
          >
            View All
          </button>
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
        gameType={actualGameSlug}
        title="Trio Result Details"
        customGetFilteredBets={getFilteredBets}
      /> */}
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const Trio = memoizeCasinoComponent(TrioComponent);
Trio.displayName = "Trio";

export default Trio;
