import React from "react";
import { RiLockFill } from "react-icons/ri";
import { getCasinoIndividualResult } from "@/helper/casino";
import { useCookies } from "react-cookie";
import { useQuery } from "@tanstack/react-query";
import CasinoModal from "@/components/common/CasinoModal";
import { getCardByCode } from "@/utils/card";
import { memoizeCasinoComponent } from "@/utils/casinoMemo";

interface CasinoQueenProps {
  casinoData: any;
  remainingTime: number;
  results?: any[];
  gameCode?: string;
  gameName?: string;
}

const CasinoQueenComponent: React.FC<CasinoQueenProps> = ({
  casinoData,
  remainingTime,
  results = [],
  gameCode,
}) => {
  const [cookies] = useCookies(["clientToken"]);

  // Get game slug from gameCode for navigation
  const gameSlug = gameCode?.toLowerCase() || "casino_queen";

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
    const isStatusSuspended =
      status === "SUSPENDED" ||
      status === "CLOSED" ||
      Number(status) === 0 ||
      status === "0" ||
      String(status) === "0";

    const isTimeSuspended = remainingTime <= 3;
    const hasNoBackOdds = !row.b || row.b === 0;
    const hasNoLayOdds = !row.l || row.l === 0;

    return (
      isStatusSuspended || isTimeSuspended || (hasNoBackOdds && hasNoLayOdds)
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

  // Get odds for each Total (sid: 1 = Total 0, sid: 2 = Total 1, sid: 3 = Total 2, sid: 4 = Total 3)
  const getOddsBySid = (sid: number) => {
    return (
      oddsData.find((item: any) => String(item.sid) === String(sid)) || null
    );
  };

  const total0 = getOddsBySid(1);
  const total1 = getOddsBySid(2);
  const total2 = getOddsBySid(3);
  const total3 = getOddsBySid(4);


  // Result details query disabled for admin view
  // const {
  //   data: resultDetails,
  //   isLoading: isLoadingResult,
  //   error: resultError,
  // } = useQuery<any>({
  //   queryKey: ["casinoIndividualResult", null, gameSlug],
  //   queryFn: () => getCasinoIndividualResult(null, cookies, gameSlug),
  //   enabled: false,
  //   staleTime: 1000 * 60 * 5,
  //   gcTime: 1000 * 60 * 10,
  //   retry: 2,
  // });

  // Parse result data - disabled for admin view
  // const resultData = resultDetails?.data?.matchData;
  // const winnerSid = resultData?.win || null;
  // const winnerInfo = oddsData.find(
  //   (item: any) => String(item.sid) === String(winnerSid)
  // );
  // const winnerName = winnerInfo?.nat || "Unknown";

  // Parse cards from result data - disabled for admin view
  /* const parseCards = () => {
    const cardString =
      resultData?.card || resultData?.cards || resultData?.cardData || "";

    if (!cardString) return { total0: [], total1: [], total2: [], total3: [] };

    const cards = cardString.split(",").filter((c: string) => c && c !== "1");

    // Based on game rules: 21 cards (2,3,4,5,6 x 4 = 20 + 1 Queen)
    // Cards are distributed to Totals, need to parse from result data
    // If result has card distribution info, use it; otherwise distribute sequentially
    if (resultData?.total0Cards || resultData?.cards?.total0) {
      // If cards are pre-distributed in result data
      return {
        total0: resultData.total0Cards || resultData.cards?.total0 || [],
        total1: resultData.total1Cards || resultData.cards?.total1 || [],
        total2: resultData.total2Cards || resultData.cards?.total2 || [],
        total3: resultData.total3Cards || resultData.cards?.total3 || [],
      };
    }

    // Fallback: distribute cards sequentially (each Total gets cards in order)
    // This is a simplified distribution - actual distribution may vary
    const total0Cards: string[] = [];
    const total1Cards: string[] = [];
    const total2Cards: string[] = [];
    const total3Cards: string[] = [];

    // Simple distribution: 2 cards per Total (except Total 3 might get 1)
    cards.forEach((card: string, index: number) => {
      const totalIndex = index % 4;
      if (totalIndex === 0 && total0Cards.length < 2) total0Cards.push(card);
      else if (totalIndex === 1 && total1Cards.length < 2)
        total1Cards.push(card);
      else if (totalIndex === 2 && total2Cards.length < 2)
        total2Cards.push(card);
      else if (totalIndex === 3 && total3Cards.length < 2)
        total3Cards.push(card);
    });

    return {
      total0: total0Cards,
      total1: total1Cards,
      total2: total2Cards,
      total3: total3Cards,
    };
  }; */

  // Calculate scores disabled for admin view
  /* const calculateScores = (cards: {
    total0: string[];
    total1: string[];
    total2: string[];
    total3: string[];
  }) => {
    // Helper to get card value (for Queen game, Queen = 10)
    const getCardValue = (cardCode: string): number => {
      if (!cardCode) return 0;
      // Check if it's a Queen (Q in the card code)
      if (cardCode.toUpperCase().includes("Q")) return 10;

      // Extract rank from card code (e.g., "3SS" -> 3, "10DD" -> 10)
      const rankMatch = cardCode.match(/(\d+|[A-Z])/);
      if (!rankMatch) return 0;

      const rank = rankMatch[1];
      if (rank === "A") return 1;
      if (rank === "J") return 11;
      if (rank === "Q") return 10;
      if (rank === "K") return 13;
      return parseInt(rank) || 0;
    };

    // Calculate score for a set of cards
    const calculateTotal = (cardList: string[]): number => {
      return cardList.reduce((sum, card) => sum + getCardValue(card), 0);
    };

    // Get scores from result data if available
    const scores = {
      total0:
        resultData?.total0Score ||
        resultData?.scores?.total0 ||
        calculateTotal(cards.total0),
      total1:
        resultData?.total1Score ||
        resultData?.scores?.total1 ||
        calculateTotal(cards.total1),
      total2:
        resultData?.total2Score ||
        resultData?.scores?.total2 ||
        calculateTotal(cards.total2),
      total3:
        resultData?.total3Score ||
        resultData?.scores?.total3 ||
        calculateTotal(cards.total3),
    };

    return scores;
  }; */

  // const cardsData = parseCards();
  // const scores = calculateScores(cardsData);

  // Determine winner - disabled for admin view
  // const winnerTotalNumber = winnerSid ? parseInt(winnerSid) - 1 : null; // sid 1 = Total 0, sid 2 = Total 1, etc.

  // Map win value to display info
  // win "1" = Total 0 (sid: 1), "2" = Total 1 (sid: 2), "3" = Total 2 (sid: 3), "4" = Total 3 (sid: 4)
  const getResultDisplay = (win: string) => {
    // Find the odds data for this win value (win is the sid)
    const odd = oddsData.find((item: any) => String(item.sid) === String(win));

    if (odd) {
      // Extract label from nat (e.g., "Total 0" -> "0", "Total 1" -> "1")
      const nat = odd.nat || "";
      const totalMatch = nat.match(/Total\s*(\d+)/i);
      if (totalMatch) {
        const totalValue = totalMatch[1];
        return { label: totalValue, color: "text-white", title: nat };
      }
    }

    // Fallback mapping
    const winMap: {
      [key: string]: { label: string; color: string; title: string };
    } = {
      "1": { label: "0", color: "text-white", title: "Total 0" },
      "2": { label: "1", color: "text-white", title: "Total 1" },
      "3": { label: "2", color: "text-white", title: "Total 2" },
      "4": { label: "3", color: "text-white", title: "Total 3" },
    };

    return (
      winMap[win] || { label: win, color: "text-gray-400", title: "Unknown" }
    );
  };

  // Render a Total section
  const renderTotalSection = (
    totalLabel: string,
    oddsItem: any,
    sid: number
  ) => {
    const locked = isLocked(oddsItem);
    const backOdds = formatOdds(oddsItem?.b);
    const layOdds = formatOdds(oddsItem?.l);
    const minStake = oddsItem?.min || 0;
    const maxStake = oddsItem?.max || 0;

    return (
      <div className="flex flex-col w-full gap-1">
        <h1 className="text-sm font-semibold text-black text-center">
          {totalLabel}
        </h1>
        <div className="flex w-full gap-1 relative">
          {/* Back Odds */}
          <h2
            className={`text-sm w-full font-semibold text-black text-center leading-10 bg-[var(--bg-back)] relative ${
              !locked && oddsItem?.b ? "cursor-pointer hover:opacity-90" : ""
            }`}
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
    <div className="flex flex-col gap-1 py-1">
      {/* Betting Grid */}
      <div className="grid md:grid-cols-4 grid-cols-2 place-content-center gap-1">
        {renderTotalSection("Total 0", total0, 1)}
        {renderTotalSection("Total 1", total1, 2)}
        {renderTotalSection("Total 2", total2, 3)}
        {renderTotalSection("Total 3", total3, 4)}
      </div>

      {/* Results Section */}
      <div className="mt-1 flex flex-col gap-1">
        <div className="bg-[var(--bg-secondary85)] border border-gray-300 flex justify-between px-2 py-0.5 items-center">
          <h2 className="text-sm font-normal leading-8 text-white">
            Last Result
          </h2>
        </div>
        <div className="flex justify-end items-center mb-2 gap-2 mx-2 flex-wrap">
          {Array.isArray(results) && results.length > 0 ? (
            results.slice(0, 10).map((item: any, index: number) => {
              const resultDisplay = getResultDisplay(item.win || "");
              return (
                <div
                  key={item.mid || `result-${item.win}-${index}`}
                  className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-xs font-semibold text-white`}
                  title={`Round ID: ${item.mid || "N/A"} - Winner: ${resultDisplay.title}`}
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
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const CasinoQueen = memoizeCasinoComponent(CasinoQueenComponent);
CasinoQueen.displayName = "CasinoQueen";

export default CasinoQueen;
