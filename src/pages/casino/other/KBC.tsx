import React, { useState } from "react";
import { RiLockFill } from "react-icons/ri";
import {
  shapeColors,
  getRedShapes,
  getBlackShapes,
} from "../../../utils/card";
import { useNavigate } from "react-router-dom";
import IndividualResultModal from "@/components/modals/IndividualResultModal";
import { memoizeCasinoComponent } from "@/utils/casinoMemo";

interface KBCProps {
  casinoData: any;
  remainingTime: number;
  results?: any[];
  gameCode?: string;
  gameName?: string;
}

const KBCComponent: React.FC<KBCProps> = ({
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

  // Keep original gameCode for API calls (e.g., "KBC")
  const apiGameType = React.useMemo(() => {
    return gameCode || "KBC";
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
    // Socket format: data.current.sub (normalized to data.sub by index.tsx)
    // API format: data.sub or data.data.data.sub
    const subArray =
      casinoData?.data?.sub ||
      (casinoData?.data as any)?.current?.sub ||
      casinoData?.data?.data?.data?.sub ||
      (casinoData?.data as any)?.current?.data?.sub ||
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

  // Get sub-odds by nat from a parent odds item
  const getSubOdds = (parentOdds: any, nat: string) => {
    if (!parentOdds || !Array.isArray(parentOdds.odds)) return null;
    return (
      parentOdds.odds.find((item: any) => item.nat === nat) || null
    );
  };

  // Check if betting is suspended
  const isLocked = (parentOdds: any, subOdds?: any): boolean => {
    if (!parentOdds) return true;

    const status = parentOdds.gstatus;
    const isStatusSuspended =
      status === "SUSPENDED" ||
      status === "CLOSED" ||
      Number(status) === 0 ||
      status === "0" ||
      String(status) === "0";

    // If status is explicitly SUSPENDED or CLOSED, always lock
    if (isStatusSuspended) return true;

    // Check time suspension
    const isTimeSuspended = remainingTime <= 3;
    if (isTimeSuspended) return true;

    // If status is OPEN and time is not suspended, trust the status
    // Don't check odds values - if status is OPEN, allow betting
    // The bet placement handler will validate actual odds values
    // This prevents false locks when odds are temporarily 0 or updating
    return false;
  };

  // Format odds display
  const formatOdds = (value: number | string | undefined): string => {
    if (value === undefined || value === null) return "0";
    const num = Number(value);
    if (isNaN(num) || num === 0) return "0";
    return num.toFixed(2);
  };

  // Get odds for each section
  const redBlackOdds = getOddsBySid(1);
  const oddEvenOdds = getOddsBySid(2);
  const upDownOdds = getOddsBySid(3);
  const cardJudgementOdds = getOddsBySid(4);
  const suitsOdds = getOddsBySid(5);

  // Get sub-odds
  const redOdds = getSubOdds(redBlackOdds, "Red");
  const blackOdds = getSubOdds(redBlackOdds, "Black");
  const oddOdds = getSubOdds(oddEvenOdds, "Odd");
  const evenOdds = getSubOdds(oddEvenOdds, "Even");
  const upOdds = getSubOdds(upDownOdds, "Up");
  const downOdds = getSubOdds(upDownOdds, "Down");
  const a23Odds = getSubOdds(cardJudgementOdds, "A23");
  const a456Odds = getSubOdds(cardJudgementOdds, "456");
  const a8910Odds = getSubOdds(cardJudgementOdds, "8910");
  const jqkOdds = getSubOdds(cardJudgementOdds, "JQK");
  const spadeOdds = getSubOdds(suitsOdds, "Spade");
  const heartOdds = getSubOdds(suitsOdds, "Heart");
  const clubOdds = getSubOdds(suitsOdds, "Club");
  const diamondOdds = getSubOdds(suitsOdds, "Diamond");


  // Helper functions for card parsing and calculations
  const getCardRank = (cardCode: string): string => {
    if (!cardCode || cardCode === "1") return "";
    return cardCode.slice(0, -2); // Everything except last 2 characters (suit)
  };

  const getCardSuit = (cardCode: string): string => {
    if (!cardCode || cardCode === "1") return "";
    const suitCode = cardCode.slice(-2); // Last 2 characters
    const suitMap: { [key: string]: string } = {
      HH: "Heart",
      SS: "Spade",
      DD: "Diamond",
      CC: "Club",
    };
    return suitMap[suitCode] || "";
  };

  const getCardValue = (cardCode: string): number => {
    if (!cardCode || cardCode === "1") return 0;
    const rank = getCardRank(cardCode);
    if (rank === "A") return 1;
    if (rank === "J") return 11;
    if (rank === "Q") return 12;
    if (rank === "K") return 13;
    const num = parseInt(rank, 10);
    return isNaN(num) ? 0 : num;
  };

  const isRedCard = (cardCode: string): boolean => {
    if (!cardCode || cardCode === "1") return false;
    const suitCode = cardCode.slice(-2);
    return suitCode === "HH" || suitCode === "DD"; // Heart or Diamond
  };

  const isCardOdd = (cardCode: string): boolean => {
    const value = getCardValue(cardCode);
    return value % 2 !== 0;
  };

  // Parse cards from result data for modal display
  const parseResultCards = () => {
    const cardString =
      resultData?.card ||
      resultData?.cards ||
      resultData?.cardData ||
      resultData?.lcard ||
      "";

    if (!cardString) return [];

    const cards = cardString
      .split(",")
      .filter((c: string) => c && c !== "1" && c.trim());
    return cards;
  };

  // Calculate KBC result breakdown
  const getKBCResultBreakdown = () => {
    const cards = parseResultCards();
    if (cards.length < 5) return null;

    // Q1: Red-Black (based on 5th card)
    const fifthCard = cards[4];
    const q1Result = isRedCard(fifthCard) ? "Red" : "Black";

    // Q2: Odd-Even (based on 5th card)
    const q2Result = isCardOdd(fifthCard) ? "Odd" : "Even";

    // Q3: 7 Up-7 Down (based on 5th card value)
    const fifthCardValue = getCardValue(fifthCard);
    const q3Result = fifthCardValue >= 7 ? "Up" : "Down";

    // Q4: 3 Card Judgement (based on first 3 cards)
    const firstThreeCards = cards.slice(0, 3);
    const firstThreeValues = firstThreeCards.map((card: string) =>
      getCardValue(card)
    );
    const firstThreeRanks = firstThreeCards.map((card: string) =>
      getCardRank(card)
    );

    let q4Result = "";
    // Check for A23 pattern
    if (
      firstThreeRanks.includes("A") &&
      firstThreeRanks.includes("2") &&
      firstThreeRanks.includes("3")
    ) {
      q4Result = "A23";
    }
    // Check for 456 pattern
    else if (
      firstThreeValues.includes(4) &&
      firstThreeValues.includes(5) &&
      firstThreeValues.includes(6)
    ) {
      q4Result = "456";
    }
    // Check for 8910 pattern
    else if (
      firstThreeValues.includes(8) &&
      firstThreeValues.includes(9) &&
      firstThreeValues.includes(10)
    ) {
      q4Result = "8 9 10";
    }
    // Check for JQK pattern
    else if (
      firstThreeRanks.includes("J") &&
      firstThreeRanks.includes("Q") &&
      firstThreeRanks.includes("K")
    ) {
      q4Result = "JQK";
    } else {
      // Fallback: show the ranks
      q4Result = firstThreeRanks.join(" ");
    }

    // Q5: Suits (based on 5th card)
    const q5Result = getCardSuit(fifthCard);

    return {
      cards,
      q1Result,
      q2Result,
      q3Result,
      q4Result,
      q5Result,
    };
  };

  // Map win value to display info
  const getResultDisplay = (win: string) => {
    // For KBC, win values might be different - need to map based on actual data
    const winMap: {
      [key: string]: { label: string; color: string; title: string };
    } = {
      "0": { label: "R", color: "text-yellow-500", title: "No" },
      "1": { label: "Y", color: "text-green-500", title: "Yes" },
    };

    return (
      winMap[win] || { label: win, color: "text-gray-400", title: "Unknown" }
    );
  };

  // Get red and black shapes
  const redShapes = getRedShapes();
  const blackShapes = getBlackShapes();

  return (
    <div className="flex flex-col gap-1 py-1">
      <div className="grid md:grid-cols-3 grid-cols-1 gap-1">
        {/* Q1: Red Black */}
        <div>
          <h2 className="w-full bg-[var(--bg-secondary)] flex justify-start items-center px-2 text-sm font-semibold text-white leading-8 rounded-lg">
            [Q1] Red Black
          </h2>
          <div className="flex justify-center items-center px-2 gap-2">
            <button
              className={`bg-[var(--bg-back)] border-2 border-yellow-400 w-full flex gap-1 p-2 justify-center items-center relative ${
                !isLocked(redBlackOdds, redOdds)
                  ? "hover:opacity-90"
                  : ""
              }`}
              disabled={isLocked(redBlackOdds, redOdds)}
            >
              {isLocked(redBlackOdds, redOdds) && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                  <RiLockFill className="text-white text-sm" />
                </div>
              )}
              <img
                src={redShapes.Diamond}
                className="w-6 leading-6"
                alt="red Diamond"
              />
              <img
                src={blackShapes.Spade}
                className="w-6 leading-6"
                alt="black Spade"
              />
              {/* {redOdds?.b && (
                <span className="text-xs font-semibold text-black ml-1">
                  {formatOdds(redOdds.b)}
                </span>
              )} */}
            </button>
            <button
              className={`bg-[var(--bg-back)] border-2 border-yellow-400 w-full flex gap-1 p-2 justify-center items-center relative ${
                !isLocked(redBlackOdds, blackOdds)
                  ? "hover:opacity-90"
                  : ""
              }`}
              disabled={isLocked(redBlackOdds, blackOdds)}
            >
              {isLocked(redBlackOdds, blackOdds) && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                  <RiLockFill className="text-white text-sm" />
            </div>
              )}
              <img
                src={redShapes.Heart}
                className="w-6 leading-6"
                alt="red Heart"
              />
              <img
                src={blackShapes.Club}
                className="w-6 leading-6"
                alt="black Club"
              />
              {/* {blackOdds?.b && (
                <span className="text-xs font-semibold text-black ml-1">
                  {formatOdds(blackOdds.b)}
                </span>
              )} */}
            </button>
          </div>
        </div>

        {/* Q2: Odd Even */}
        <div>
          <h2 className="w-full bg-[var(--bg-secondary)] flex justify-start items-center px-2 text-sm font-semibold text-white leading-8 rounded-lg">
            [Q2] Odd Even
          </h2>
          <div className="flex justify-center items-center px-2 gap-2">
            <button
              className={`bg-[var(--bg-back)] border-2 border-yellow-400 w-full flex gap-1 p-2 justify-center items-center relative ${
                !isLocked(oddEvenOdds, oddOdds)
                  ? "hover:opacity-90"
                  : ""
              }`}
              disabled={isLocked(oddEvenOdds, oddOdds)}
            >
              {isLocked(oddEvenOdds, oddOdds) && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                  <RiLockFill className="text-white text-sm" />
            </div>
              )}
              <h2 className="text-sm font-semibold text-black">Odd</h2>
              {/* {oddOdds?.b && (
                <span className="text-xs font-semibold text-black ml-1">
                  {formatOdds(oddOdds.b)}
                </span>
              )} */}
            </button>
            <button
              className={`bg-[var(--bg-back)] border-2 border-yellow-400 w-full flex gap-1 p-2 justify-center items-center relative ${
                !isLocked(oddEvenOdds, evenOdds)
                  ? "hover:opacity-90"
                  : ""
              }`}
              disabled={isLocked(oddEvenOdds, evenOdds)}
            >
              {isLocked(oddEvenOdds, evenOdds) && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                  <RiLockFill className="text-white text-sm" />
            </div>
              )}
              <h2 className="text-sm font-semibold text-black">Even</h2>
              {/* {evenOdds?.b && (
                <span className="text-xs font-semibold text-black ml-1">
                  {formatOdds(evenOdds.b)}
                </span>
              )} */}
            </button>
          </div>
        </div>

        {/* Q3: 7 Up-7 Down */}
        <div>
          <h2 className="w-full bg-[var(--bg-secondary)] flex justify-start items-center px-2 text-sm font-semibold text-white leading-8 rounded-lg">
            [Q3] 7 Up-7 Down
          </h2>
          <div className="flex justify-center items-center px-2 gap-2">
            <button
              className={`bg-[var(--bg-back)] border-2 border-yellow-400 w-full flex gap-1 p-2 justify-center items-center relative ${
                !isLocked(upDownOdds, upOdds)
                  ? "hover:opacity-90"
                  : ""
              }`}
              disabled={isLocked(upDownOdds, upOdds)}
            >
              {isLocked(upDownOdds, upOdds) && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                  <RiLockFill className="text-white text-sm" />
            </div>
              )}
              <h2 className="text-sm font-semibold text-black">Up</h2>
              {/* {upOdds?.b && (
                <span className="text-xs font-semibold text-black ml-1">
                  {formatOdds(upOdds.b)}
                </span>
              )} */}
            </button>
            <button
              className={`bg-[var(--bg-back)] border-2 border-yellow-400 w-full flex gap-1 p-2 justify-center items-center relative ${
                !isLocked(upDownOdds, downOdds)
                  ? "hover:opacity-90"
                  : ""
              }`}
              disabled={isLocked(upDownOdds, downOdds)}
            >
              {isLocked(upDownOdds, downOdds) && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                  <RiLockFill className="text-white text-sm" />
            </div>
              )}
              <h2 className="text-sm font-semibold text-black">Down</h2>
              {/* {downOdds?.b && (
                <span className="text-xs font-semibold text-black ml-1">
                  {formatOdds(downOdds.b)}
                </span>
              )} */}
            </button>
          </div>
        </div>

        {/* Q4: 3 Card Judgement */}
        <div>
          <h2 className="w-full bg-[var(--bg-secondary)] flex justify-start items-center px-2 text-sm font-semibold text-white leading-8 rounded-lg">
            [Q4] 3 Card Judgement
          </h2>
          <div className="flex justify-center items-center px-2 gap-2">
            <button
              className={`bg-[var(--bg-back)] border-2 border-yellow-400 w-full flex gap-1 p-2 justify-center items-center relative ${
                !isLocked(cardJudgementOdds, a23Odds)
                  ? "hover:opacity-90"
                  : ""
              }`}
              disabled={isLocked(cardJudgementOdds, a23Odds)}
            >
              {isLocked(cardJudgementOdds, a23Odds) && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                  <RiLockFill className="text-white text-sm" />
                </div>
              )}
              <h2 className="text-sm font-semibold text-black">A23</h2>
              {/* {a23Odds?.b && (
                <span className="text-xs font-semibold text-black ml-1">
                  {formatOdds(a23Odds.b)}
                </span>
              )} */}
            </button>
            <button
              className={`bg-[var(--bg-back)] border-2 border-yellow-400 w-full flex gap-1 p-2 justify-center items-center relative ${
                !isLocked(cardJudgementOdds, a456Odds)
                  ? "hover:opacity-90"
                  : ""
              }`}
              disabled={isLocked(cardJudgementOdds, a456Odds)}
            >
              {isLocked(cardJudgementOdds, a456Odds) && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                  <RiLockFill className="text-white text-sm" />
            </div>
              )}
              <h2 className="text-sm font-semibold text-black">456</h2>
              {/* {a456Odds?.b && (
                <span className="text-xs font-semibold text-black ml-1">
                  {formatOdds(a456Odds.b)}
                </span>
              )} */}
            </button>
            </div>
          <div className="flex justify-center items-center px-2 gap-2 mt-1">
            <button
              className={`bg-[var(--bg-back)] border-2 border-yellow-400 w-full flex gap-1 p-2 justify-center items-center relative ${
                !isLocked(cardJudgementOdds, a8910Odds)
                  ? "hover:opacity-90"
                  : ""
              }`}
              disabled={isLocked(cardJudgementOdds, a8910Odds)}
            >
              {isLocked(cardJudgementOdds, a8910Odds) && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                  <RiLockFill className="text-white text-sm" />
            </div>
              )}
              <h2 className="text-sm font-semibold text-black">8910</h2>
              {/* {a8910Odds?.b && (
                <span className="text-xs font-semibold text-black ml-1">
                  {formatOdds(a8910Odds.b)}
                </span>
              )} */}
            </button>
            <button
              className={`bg-[var(--bg-back)] border-2 border-yellow-400 w-full flex gap-1 p-2 justify-center items-center relative ${
                !isLocked(cardJudgementOdds, jqkOdds)
                  ? "hover:opacity-90"
                  : ""
              }`}
              disabled={isLocked(cardJudgementOdds, jqkOdds)}
            >
              {isLocked(cardJudgementOdds, jqkOdds) && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                  <RiLockFill className="text-white text-sm" />
            </div>
              )}
              <h2 className="text-sm font-semibold text-black">JQK</h2>
              {/* {jqkOdds?.b && (
                <span className="text-xs font-semibold text-black ml-1">
                  {formatOdds(jqkOdds.b)}
                </span>
              )} */}
            </button>
          </div>
        </div>

        {/* Q5: Suits */}
        <div>
          <h2 className="w-full bg-[var(--bg-secondary)] flex justify-start items-center px-2 text-sm font-semibold text-white leading-8 rounded-lg">
            [Q5] Suits
          </h2>
          <div className="flex justify-center items-center px-2 gap-2">
            <button
              className={`bg-[var(--bg-back)] border-2 border-yellow-400 w-full flex gap-1 p-2 justify-center items-center relative ${
                !isLocked(suitsOdds, heartOdds)
                  ? "hover:opacity-90"
                  : ""
              }`}
              disabled={isLocked(suitsOdds, heartOdds)}
            >
              {isLocked(suitsOdds, heartOdds) && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                  <RiLockFill className="text-white text-sm" />
                </div>
              )}
              <img
                src={redShapes.Heart}
                className="w-6 leading-6"
                alt="red Heart"
              />
              {/* {heartOdds?.b && (
                <span className="text-xs font-semibold text-black ml-1">
                  {formatOdds(heartOdds.b)}
                </span>
              )} */}
            </button>
            <button
              className={`bg-[var(--bg-back)] border-2 border-yellow-400 w-full flex gap-1 p-2 justify-center items-center relative ${
                !isLocked(suitsOdds, diamondOdds)
                  ? "hover:opacity-90"
                  : ""
              }`}
              disabled={isLocked(suitsOdds, diamondOdds)}
            >
              {isLocked(suitsOdds, diamondOdds) && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                  <RiLockFill className="text-white text-sm" />
            </div>
              )}
            <img
                src={redShapes.Diamond}
                className="w-6 leading-6"
                alt="red Diamond"
              />
              {/* {diamondOdds?.b && (
                <span className="text-xs font-semibold text-black ml-1">
                  {formatOdds(diamondOdds.b)}
                </span>
              )} */}
            </button>
          </div>
          <div className="flex justify-center items-center px-2 gap-2 mt-1">
            <button
              className={`bg-[var(--bg-back)] border-2 border-yellow-400 w-full flex gap-1 p-2 justify-center items-center relative ${
                !isLocked(suitsOdds, clubOdds)
                  ? "hover:opacity-90"
                  : ""
              }`}
              disabled={isLocked(suitsOdds, clubOdds)}
            >
              {isLocked(suitsOdds, clubOdds) && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                  <RiLockFill className="text-white text-sm" />
            </div>
              )}
               <img
                src={blackShapes.Club}
                className="w-6 leading-6"
                alt="black Club"
              />
              {/* {clubOdds?.b && (
                <span className="text-xs font-semibold text-black ml-1">
                  {formatOdds(clubOdds.b)}
                </span>
              )} */}
            </button>
            <button
              className={`bg-[var(--bg-back)] border-2 border-yellow-400 w-full flex gap-1 p-2 justify-center items-center relative ${
                !isLocked(suitsOdds, spadeOdds)
                  ? "hover:opacity-90"
                  : ""
              }`}
              disabled={isLocked(suitsOdds, spadeOdds)}
            >
              {isLocked(suitsOdds, spadeOdds) && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                  <RiLockFill className="text-white text-sm" />
            </div>
              )}
              <img
                src={blackShapes.Spade}
                className="w-6 leading-6"
                alt="black Spade"
              />
              {/* {spadeOdds?.b && (
                <span className="text-xs font-semibold text-black ml-1">
                  {formatOdds(spadeOdds.b)}
                </span>
              )} */}
            </button>
          </div>
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
        title={`${gameName || "KBC"} Result Details`}
        enableBetFiltering={true}
      />
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const KBC = memoizeCasinoComponent(KBCComponent);
KBC.displayName = "KBC";

export default KBC;
