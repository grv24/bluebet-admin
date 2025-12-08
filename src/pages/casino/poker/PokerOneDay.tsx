import React, { useState, useMemo } from "react";
import { RiLockFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
// import IndividualResultModal from "@/components/casino/IndividualResultModal";
// import { useIndividualResultModal } from "@/hooks/useIndividualResultModal";
import { memoizeCasinoComponent } from "../../../utils/casinoMemo";

type PokerOneDayProps = {
  casinoData: any;
  remainingTime: number;
  results?: any[];
  gameSlug: string;
  gameName: string;
};

const getT2Odds = (casinoData: any, sid: string) => {
  // Handle new API response format
  if (casinoData?.data?.sub) {
    return (
      casinoData.data.sub.find((x: any) => x.sid === parseInt(sid)) || null
    );
  }
  // Handle legacy format
  const list = casinoData?.data?.data?.data?.t2;
  if (!Array.isArray(list)) return null;
  return list.find((x: any) => x.sid === sid) || null;
};

const getT3Odds = (casinoData: any, sid: string) => {
  // Handle new API response format
  if (casinoData?.data?.sub) {
    return (
      casinoData.data.sub.find((x: any) => x.sid === parseInt(sid)) || null
    );
  }
  // Handle legacy format
  const list = casinoData?.data?.data?.data?.t3;
  if (!Array.isArray(list)) return null;
  return list.find((x: any) => x.sid === sid) || null;
};

const isSuspended = (odds: any, remainingTime: number) => {
  const status = odds?.gstatus as string | number | undefined;
  return (
    status === "SUSPENDED" ||
    status === 1 ||
    status === "1" ||
    remainingTime <= 3
  );
};

const PokerOneDayComponent: React.FC<PokerOneDayProps> = ({
  casinoData,
  remainingTime,
  results = [],
  gameSlug,
  gameName,
}) => {
  const navigate = useNavigate();
  // const resultModal = useIndividualResultModal();

  // Normalize gameSlug to lowercase format (e.g., "POKER_1DAY" -> "poker1day" or "poker")
  const normalizedGameType = useMemo(() => {
    if (!gameSlug) return "poker";
    const normalized = gameSlug.toLowerCase().replace(/_/g, "");
    // Handle variations like "poker1day", "pokeroneday", etc. - normalize to "poker"
    if (normalized.includes("poker")) {
      return "poker";
    }
    return normalized;
  }, [gameSlug]);
  const playerA = getT2Odds(casinoData, "1");
  const playerB = getT2Odds(casinoData, "2");

  const a2Card = getT3Odds(casinoData, "3");
  const a7Card = getT3Odds(casinoData, "4");
  const b2Card = getT3Odds(casinoData, "5");
  const b7Card = getT3Odds(casinoData, "6");

  const remark =
    casinoData?.data?.remark ||
    casinoData?.data?.data?.data?.t1?.[0]?.remark ||
    "";

  // Debug logging to understand data structure
  React.useEffect(() => {
    console.log("🎰 Poker casinoData structure:", casinoData);
    console.log("🎰 Poker playerA odds:", playerA);
    console.log("🎰 Poker playerB odds:", playerB);
    console.log("🎰 Poker a2Card odds:", a2Card);
    console.log("🎰 Poker a7Card odds:", a7Card);
    console.log("🎰 Poker b2Card odds:", b2Card);
    console.log("🎰 Poker b7Card odds:", b7Card);
  }, [casinoData, playerA, playerB, a2Card, a7Card, b2Card, b7Card]);

  // Function to parse cards from API response
  const parseCards = (cardsString: string) => {
    if (!cardsString)
      return { playerACards: [], playerBCards: [], boardCards: [] };

    const cards = cardsString.split(",").filter((card) => card && card.trim());

    // For poker: exactly 9 cards total
    // First 2 cards = Player A (hole cards)
    // Next 2 cards = Player B (hole cards)
    // Remaining 5 cards = Board (flop, turn, river)

    let playerACards: string[] = [];
    let playerBCards: string[] = [];
    let boardCards: string[] = [];

    if (cards.length >= 2) {
      // First 2 cards are Player A's hole cards
      playerACards = cards.slice(0, 2);
    }

    if (cards.length >= 4) {
      // Next 2 cards are Player B's hole cards
      playerBCards = cards.slice(2, 4);
    }

    if (cards.length >= 9) {
      // Remaining 5 cards are the board (flop, turn, river)
      boardCards = cards.slice(4, 9);
    } else if (cards.length > 4) {
      // If less than 9 cards, take remaining as board
      boardCards = cards.slice(4);
    }

    return { playerACards, playerBCards, boardCards };
  };

  // Function to get winner information
  const getWinnerInfo = (resultData: any) => {
    if (!resultData) return { winner: null, description: "" };

    const win = resultData.win;
    const desc = resultData.desc || resultData.newdesc || "";

    let winner = null;
    
    // Parse description for winner information
    if (desc) {
      const parts = desc.split("#");
      if (parts.length >= 1) {
        winner = parts[0] || null;
      }
    }
    
    // Fallback to win field if description parsing fails
    if (!winner) {
      if (win === "11" || win === "1") winner = "Player A";
      else if (win === "21" || win === "2") winner = "Player B";
    }

    return { winner, description: desc };
  };

  // Function to format description for better display
  const formatDescription = (desc: string): string[] => {
    if (!desc) return [];

    // Split by # character and filter out empty parts
    return desc
      .split("#")
      .filter((line) => line.trim());
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



  return (
    <div className="w-full flex flex-col gap-1.5">
      <div className="md:p-0 p-1">
        {/* Top row: Player A | Player B with inline odds boxes */}
        <div className="grid md:grid-cols-2 grid-cols-1 md:gap-1.5">
          {/* Player A header + odds */}
          <div className="bg-white border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold px-2">
                Player A
              </div>
              
              <div className="grid grid-cols-2 w-28 sm:w-36">
                <div className="relative h-10 sm:h-12 flex flex-col items-center justify-center text-base sm:text-lg font-semibold bg-[var(--bg-back)] text-black border border-gray-200">
                  {isSuspended(playerA, remainingTime) && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                      <RiLockFill className="text-white text-xl" />
                     
                    </div>
                  )}
                  <h2 className="text-sm font-semibold">
                    {playerA?.b || playerA?.b1 || 0}
                  </h2>
                 
                </div>
                <div className="relative h-10 sm:h-12 flex flex-col items-center justify-center text-base sm:text-lg font-semibold bg-[var(--bg-lay)] text-black border border-gray-200">
                  {isSuspended(playerA, remainingTime) && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                      <RiLockFill className="text-white text-xl" />
                     
                    </div>
                  )}
                  <h2 className="text-sm font-semibold">
                    {playerA?.l || playerA?.l1 || 0}
                  </h2>
                
                </div>
              </div>
            </div>
          </div>

          {/* Player B header + odds */}
          <div className="bg-white border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold px-2">Player B
              </div>
              <div className="grid grid-cols-2 w-28 sm:w-36">
                <div className="relative h-10 sm:h-12 flex flex-col items-center justify-center text-base sm:text-lg font-semibold bg-[var(--bg-back)] text-black border border-gray-200">
                  {isSuspended(playerB, remainingTime) && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                      <RiLockFill className="text-white text-xl" />
                      
                    </div>
                  )}
                  <h2 className="text-sm font-semibold">
                    {(playerB?.b || playerB?.b1) ?? "0"}
                  </h2>
                 
                </div>
                <div className="relative h-10 sm:h-12 flex flex-col items-center justify-center text-base sm:text-lg font-semibold bg-[var(--bg-lay)] text-black border border-gray-200">
                  {isSuspended(playerB, remainingTime) && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                      <RiLockFill className="text-white text-xl" />
                     
                    </div>
                  )}
                  <h2 className="text-sm font-semibold">
                    {(playerB?.l || playerB?.l1) ?? "0"}
                  </h2>
                
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Bonus rows */}
        <div className="grid md:grid-cols-2 grid-cols-1 gap-1.5">
          {/* Player A bonuses */}
          <h2 className="text-base md:hidden block font-semibold px-2 mt-2">
            Player A
          </h2>
          <div className="grid grid-cols-2 gap-1.5">
            <button className="relative w-full bg-[var(--bg-back)] text-sm leading-10 font-extrabold tracking-wide border border-gray-300 flex flex-col items-center justify-center">
              {isSuspended(a2Card, remainingTime) && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                  <RiLockFill className="text-white text-2xl" />
                </div>
              )}
              <h2 className="text-sm font-semibold">2 Cards Bonus</h2>
            </button>
            <button className="relative w-full bg-[var(--bg-back)] text-sm leading-10 font-extrabold tracking-wide border border-gray-300 flex flex-col items-center justify-center">
              {isSuspended(a7Card, remainingTime) && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                  <RiLockFill className="text-white text-2xl" />
                </div>
              )}
              <h2 className="text-sm font-semibold">7 Cards Bonus</h2>
            </button>
          </div>

          {/* Player B bonuses */}
          <h2 className="text-base md:hidden block font-semibold px-2 mt-2">
            Player B
          </h2>
          <div className="grid grid-cols-2 gap-1.5">
            <button className="relative w-full bg-[var(--bg-back)] text-sm leading-10 font-extrabold tracking-wide border border-gray-300 flex flex-col items-center justify-center">
              {isSuspended(b2Card, remainingTime) && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                  <RiLockFill className="text-white text-2xl" />
                </div>
              )}
              <h2 className="text-sm font-semibold">2 Cards Bonus</h2>
            </button>
            <button className="relative w-full bg-[var(--bg-back)] text-sm leading-10 font-extrabold tracking-wide border border-gray-300 flex flex-col items-center justify-center">
              {isSuspended(b7Card, remainingTime) && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                  <RiLockFill className="text-white text-2xl" />
                </div>
              )}
              <h2 className="text-sm font-semibold">7 Cards Bonus</h2>
            </button>
          </div>
        </div>
        {/* Bottom remark bar */}
        {(() => {
          const remarkText = remark;
          return (
            <div className="w-full bg-white text-[var(--bg-primary)]/90 overflow-hidden">
              <div className="whitespace-nowrap text-[10px] leading-6 font-extrabold uppercase tracking-wide animate-marquee">
                {remarkText}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Results */}
      <div className="flex flex-col gap-1">
        <div className="bg-[var(--bg-secondary85)] border border-gray-300 flex justify-between px-2 py-.5 items-center">
          <h2 className="text-sm font-normal leading-8 text-white">
            Last Result
          </h2>
          <h2
            onClick={() => navigate(`/reports/casino-result-report?game=${gameCode || gameSlug || "POKER_1_DAY"}`)}
            className="text-sm font-normal leading-8 text-white"
          >
            View All
          </h2>
        </div>
        <div className="flex justify-end items-center mb-2 gap-1 mx-2">
          {Array.isArray(results) &&
            results.slice(0, 10).map((item: any, index: number) => {
              const isA = item?.win === "1" || item?.win === "11"; // 1 or 11 => A, 2 or 21 => B
              return (
                <h2
                  key={index}
                  className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-sm font-semibold ${isA ? "text-red-500" : "text-yellow-500"}`}
                >
                  {isA ? "A" : "B"}
                </h2>
              );
            })}
        </div>
      </div>

      {/* Individual Result Details Modal */}
      {/* <IndividualResultModal
        isOpen={isModalOpen}
        onClose={closeModal}
        resultId={selectedResult?.mid}
        gameType={normalizedGameType}
        title={`${gameName || "Poker One Day"} Result Details`}
        enableBetFiltering={true}
        customGetFilteredBets={getFilteredBets}
      /> */}
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const PokerOneDay = memoizeCasinoComponent(PokerOneDayComponent);
PokerOneDay.displayName = "PokerOneDay";

export default PokerOneDay;
