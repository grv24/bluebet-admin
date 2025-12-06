import React, { useMemo, useEffect, useRef, useState, useContext } from "react";
import { PlaceBetUseContext } from "@/context/placebet";
import { useNavigate } from "react-router-dom";
import IndividualResultModal from "@/components/casino/IndividualResultModal";
import { useIndividualResultModal } from "@/hooks/useIndividualResultModal";

interface MiniSuperOverProps {
  casinoData: any;
  remainingTime: number;
  onBetClick?: (sid: string, type: "back" | "lay") => void;
  results?: any[];
  gameCode?: string;
  gameName?: string;
  currentBet?: any;
}

/**
 * Status values that indicate a betting market is locked/closed
 */
const LOCKED_STATUSES = {
  BOOKMAKER: [
    "CLOSED",
    "SUSPENDED",
    "Starting Soon.",
    "Ball Running",
    "LOSER",
    "WINNER",
    "THE DRAW",
    "INACTIVE",
    "DISABLED",
  ],
  FANCY: ["CLOSED", "SUSPENDED", "Starting Soon.", "Ball Running", "INACTIVE"],
};

/**
 * Check if a status is locked for bookmaker odds
 */
const isStatusLocked = (status: string, marketType: "BOOKMAKER" | "FANCY"): boolean => {
  return LOCKED_STATUSES[marketType].includes(status);
};

/**
 * Custom hook to track value changes and trigger blink effect
 */
const useBlinkOnChange = (value: any, vol: any) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const prevValueRef = useRef<any>(null);
  const prevVolRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const valueChanged =
      prevValueRef.current !== null && prevValueRef.current !== value;
    const volChanged =
      prevVolRef.current !== null && prevVolRef.current !== vol;

    if (valueChanged || volChanged) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      setIsBlinking(true);
      timerRef.current = setTimeout(() => {
        setIsBlinking(false);
        timerRef.current = null;
      }, 800);
    }

    prevValueRef.current = value;
    prevVolRef.current = vol;
  }, [value, vol]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return isBlinking;
};

/**
 * Component for odds display with blink effect (Bookmaker - 1 back, 1 lay)
 */
const BlinkingOddsCell = ({
  value,
  vol,
  type,
  isLocked,
  onClick,
}: {
  value: any;
  vol: any;
  type: "back" | "lay";
  isLocked?: boolean;
  onClick?: () => void;
}) => {
  const isBlinking = useBlinkOnChange(value, vol);

  const backgroundClass = useMemo(() => {
    const baseClass =
      "text-center w-1/2 cursor-pointer border-r border-[var(--border)] min-h-[40px] flex flex-col justify-center";

    if (isBlinking) {
      return `${baseClass} bg-yellow-300 shadow-lg transform scale-105 animate-pulse`;
    }

    return type === "back"
      ? `${baseClass} bg-[var(--bg-back)] hover:bg-[var(--bg-back)]/90 transition-colors duration-200`
      : `${baseClass} bg-[var(--bg-lay)] hover:bg-[var(--bg-lay)]/90 transition-colors duration-200`;
  }, [isBlinking, type]);

  return (
    <div className={backgroundClass} onClick={onClick}>
      <span
        className={`font-semibold text-xs leading-tight ${isBlinking ? "text-gray-900" : ""}`}
      >
        {value && value !== "0.0" && value !== 0 && value !== "0" ? value : "-"}
      </span>
      <span
        className={`text-[10px] text-gray-600 leading-tight hidden lg:block ${isBlinking ? "text-gray-700" : ""}`}
      >
        {vol && vol !== "0.0" && vol !== 0 && vol !== "0" ? vol : "-"}
      </span>
      <span
        className={`text-[10px] text-gray-600 block lg:hidden ${isBlinking ? "text-gray-700" : ""}`}
      >
        {vol && vol !== "0.0" && vol !== 0 && vol !== "0"
          ? Number(vol).toFixed(0)
          : "-"}
      </span>
    </div>
  );
};

BlinkingOddsCell.displayName = "BlinkingOddsCell";

/**
 * Component for odds display with blink effect (Fancy - 1 back, 1 lay)
 */
const FancyOddsCell = ({
  value,
  vol,
  type,
  isLocked,
  onClick,
}: {
  value: any;
  vol: any;
  type: "back" | "lay";
  isLocked?: boolean;
  onClick?: () => void;
}) => {
  const isBlinking = useBlinkOnChange(value, vol);

  const backgroundClass = useMemo(() => {
    const baseClass =
      "text-center w-full cursor-pointer border-r border-[var(--border)] min-h-[40px] flex flex-col justify-center";

    if (isBlinking) {
      return `${baseClass} bg-yellow-300 shadow-lg transform scale-105 animate-pulse`;
    }

    return type === "back"
      ? `${baseClass} bg-[var(--bg-back)] hover:bg-[var(--bg-back)]/90 transition-colors duration-200`
      : `${baseClass} bg-[var(--bg-lay)] hover:bg-[var(--bg-lay)]/90 transition-colors duration-200`;
  }, [isBlinking, type]);

  return (
    <div className={backgroundClass} onClick={onClick}>
      <span
        className={`font-semibold text-xs leading-tight ${isBlinking ? "text-gray-900" : ""}`}
      >
        {value && value !== "0.0" && value !== 0 && value !== "0"
          ? value
          : "-"}
      </span>
      <span
        className={`text-[10px] text-gray-600 leading-tight hidden lg:block ${isBlinking ? "text-gray-700" : ""}`}
      >
        {vol && vol !== "0.0" && vol !== 0 && vol !== "0" ? vol : "-"}
      </span>
      <span
        className={`text-[10px] text-gray-600 block lg:hidden ${isBlinking ? "text-gray-700" : ""}`}
      >
        {vol && vol !== "0.0" && vol !== 0 && vol !== "0"
          ? Number(vol).toFixed(0)
          : "-"}
      </span>
    </div>
  );
};

FancyOddsCell.displayName = "FancyOddsCell";

/**
 * Render locked status overlay component
 */
const renderLockedOverlay = (status: string) => (
  <div className="absolute uppercase inset-0 bg-gray-700 text-[#ff0000] font-bold text-center opacity-95 flex items-center justify-center z-10 h-full text-sm">
    {status}
  </div>
);

// Extract odds from section odds array
const getOddsFromSection = (section: any, oname: string) => {
  if (!section?.odds || !Array.isArray(section.odds)) return null;
  return section.odds.find((odd: any) => odd.oname === oname) || null;
};

const MiniSuperOverComponent: React.FC<MiniSuperOverProps> = ({
  casinoData,
  remainingTime,
  onBetClick,
  results = [],
  gameCode,
  currentBet,
}) => {
  const navigate = useNavigate();
  const placeBetContext = useContext(PlaceBetUseContext);
  const { setPlaceBet, setBetData, setLatestBetData } = placeBetContext || {};
  const resultModal = useIndividualResultModal();

  // Get data from t1 and t2 structure
  const gameInfo = useMemo(() => {
    return casinoData?.data?.t1 || casinoData?.data?.current?.t1 || {};
  }, [casinoData]);
  
  const markets = useMemo(() => {
    return casinoData?.data?.t2 || casinoData?.data?.current?.t2 || [];
  }, [casinoData]);

  // Get match ID from gameInfo (gmid) - this is the actual match ID
  const matchId = useMemo(() => {
    return (
      gameInfo?.gmid ||
      (casinoData?.data as any)?.current?.mid ||
      (casinoData?.data as any)?.mid ||
      gameInfo?.mid ||
      null
    );
  }, [casinoData, gameInfo]);

  // 🚀 PERFORMANCE: Memoize market finding operations
  // Get Bookmaker market
  const bookmakerMarket = useMemo(() => {
    return markets.find((market: any) => market.mname === "Bookmaker");
  }, [markets]);

  // Get Fancy market (separate from Fancy1)
  const fancyMarket = useMemo(() => {
    return markets.find((market: any) => market.mname === "Fancy");
  }, [markets]);

  // Get Fancy1 market (contains Tie and other options)
  const fancy1Market = useMemo(() => {
    return markets.find((market: any) => market.mname === "Fancy1");
  }, [markets]);

  // Profit/Loss calculation function
  const getBetProfitLoss = React.useCallback((sectionSid: string | number, sectionName: string, marketName: string): number => {
    if (!currentBet?.data || !matchId) return 0;

    let totalProfitLoss = 0;

    // Only bets for this match
    const bets = currentBet.data.filter(
      (bet: any) => String(bet.matchId) === String(matchId)
    );

    bets.forEach((bet: any) => {
      const { sid, betName: currentBetName, name, nation: betNation, oddCategory, stake, betRate, market: betMarket, mname: betMname } = bet.betData;
      const result = bet.betData?.result;

      // Use either betName, name, or nation field
      const actualBetName = currentBetName || name || betNation;
      const betSid = sid ? String(sid) : null;
      const requestedSid = sectionSid ? String(sectionSid) : null;
      
      // Match by market name first (Bookmaker vs Fancy vs Fancy1)
      const betMarketName = betMarket || betMname || "";
      const isSameMarket = betMarketName === marketName;
      
      if (!isSameMarket) {
        // Different markets don't affect each other
        return;
      }
      
      // Check if this bet matches the requested section
      let isMatch = false;
      
      // Match by sid first (most reliable)
      if (requestedSid && betSid && requestedSid === betSid) {
        isMatch = true;
      }
      // Match by name
      else if (actualBetName && typeof actualBetName === 'string' && sectionName) {
        const actualBetNameLower = actualBetName.toLowerCase().trim();
        const requestedNameLower = sectionName.toLowerCase().trim();
        
        // Exact match
        if (actualBetNameLower === requestedNameLower) {
          isMatch = true;
        }
        // Partial match for team names
        else if (actualBetNameLower.includes(requestedNameLower) || requestedNameLower.includes(actualBetNameLower)) {
          isMatch = true;
        }
      }
      
      if (isMatch) {
        // If bet is settled, use the actual profit/loss from the result
        if (result && result.settled) {
          let profitLoss = 0;

          if (result.status === "won" || result.status === "profit") {
            profitLoss = Number(result.profitLoss) || 0;
          } else if (result.status === "lost") {
            profitLoss = Number(result.profitLoss) || 0;
          }

          totalProfitLoss += profitLoss;
        } else {
          // For unsettled bets, calculate potential profit
          const stakeAmount = Number(stake) || 0;
          const rate = Number(betRate) || 0;
          
          if (oddCategory?.toLowerCase() === "back" || oddCategory?.toLowerCase() === "yes") {
            // Calculate profit if this bet wins
            let profit = 0;
            if (rate > 0) {
              if (rate < 1) {
                profit = stakeAmount * rate;
              } else {
                profit = stakeAmount * (rate - 1);
              }
            }
            totalProfitLoss += profit;
          } else if (oddCategory?.toLowerCase() === "lay" || oddCategory?.toLowerCase() === "no") {
            // For lay bets, if it wins, you get the stake, if it loses, you pay the loss
            // For unsettled lay bets, show potential profit (stake)
            totalProfitLoss += stakeAmount;
          }
        }
      } else {
        // For other options in the same market (mutually exclusive), show potential loss if this bet loses
        // If bet is settled and lost, show the loss
        if (result && result.settled) {
          if (result.status === "lost") {
            totalProfitLoss += Number(result.profitLoss) || 0;
          }
        } else {
          // For unsettled bets on other options, show potential loss (stake)
          totalProfitLoss -= Number(stake) || 0;
        }
      }
    });

    return totalProfitLoss;
  }, [currentBet, matchId]);

  // Format max value (convert to "L" notation if >= 100000, "K" for 10000)
  const formatMax = (max: number | string | undefined): string => {
    if (!max) return "";
    const num = Number(max);
    if (isNaN(num)) return "";
    if (num >= 100000) {
      const lakhs = num / 100000;
      return `${lakhs}L`;
    }
    if (num >= 1000) {
      const thousands = num / 1000;
      return `${thousands}K`;
    }
    return num.toString();
  };

  // Handle bet click for Bookmaker
  const handleBookmakerBetClick = (
    section: any,
    betType: "back" | "lay",
    oddsValue: string | number
  ) => {
    if (!setPlaceBet || !setBetData || !setLatestBetData) {
      // Fallback to onBetClick if context not available
      if (onBetClick) {
        onBetClick(String(section.sid), betType);
      }
      return;
    }

    const oddsNum = parseFloat(String(oddsValue));
    const betData = {
      sid: section.sid,
      rname: section.nat,
      mid: matchId || bookmakerMarket?.mid,
      market: bookmakerMarket?.mname,
      mname: bookmakerMarket?.mname,
      mstatus: bookmakerMarket?.status,
      status: section.gstatus,
      gtype: bookmakerMarket?.gtype,
      isPlay: gameInfo?.iplay,
      odd: oddsNum,
      stake: 0,
      profit: 0,
      loss: 0,
      oddType: "bookmaker",
      marketType: "bookMakerOdds",
      betType: betType,
      betName: section.nat,
      boxColor: betType === "back" ? "bg-[#B2D6F0]" : "bg-[#FAA9BA]",
      matchOddVariant: betType === "back" ? "b1" : "l1",
      matchOdd: oddsNum,
      betRate: oddsNum,
      oddCategory: betType === "back" ? "Back" : "Lay",
      oddSubType: "normal",
      otherInfo: {},
      name: section.nat,
      sportType: "cricket",
      stakeLimit: section.max || bookmakerMarket?.max || 10000,
      minStake: section.min || bookmakerMarket?.min || 10,
      maxStake: section.max || bookmakerMarket?.max || 10000,
      gameSlug: gameCode,
      gameName: gameCode,
    };

    setBetData(betData);
    setLatestBetData(betData);
    setPlaceBet(true);
  };

  // Handle bet click for Fancy
  const handleFancyBetClick = (
    section: any,
    market: any,
    betType: "back" | "lay",
    oddsValue: string | number
  ) => {
    if (!setPlaceBet || !setBetData || !setLatestBetData) {
      // Fallback to onBetClick if context not available
      if (onBetClick) {
        onBetClick(String(section.sid), betType);
      }
      return;
    }

    const oddsNum = parseFloat(String(oddsValue));
    const betData = {
      sid: section.sid,
      rname: section.nat,
      mid: matchId || market?.mid,
      market: market?.mname,
      mname: market?.mname,
      mstatus: market?.status,
      status: section.gstatus,
      gtype: market?.gtype,
      isPlay: gameInfo?.iplay,
      odd: oddsNum,
      stake: 0,
      profit: 0,
      loss: 0,
      oddType: "fancy",
      marketType: "fancyOdds",
      betType: betType,
      betName: section.nat,
      boxColor: betType === "back" ? "bg-[#B2D6F0]" : "bg-[#FAA9BA]",
      matchOddVariant: betType === "back" ? "b1" : "l1",
      matchOdd: oddsNum,
      betRate: oddsNum,
      oddCategory: betType === "back" ? "Yes" : "No",
      oddSubType: "fancy1",
      otherInfo: {},
      name: section.nat,
      sportType: "cricket",
      stakeLimit: section.max || market?.max || 10000,
      minStake: section.min || market?.min || 10,
      maxStake: section.max || market?.max || 10000,
      gameSlug: gameCode,
      gameName: gameCode,
    };

    setBetData(betData);
    setLatestBetData(betData);
    setPlaceBet(true);
  };

  // Map win value to display info
  // Based on screenshot, results show "A" badges
  // win "1" = Team 1 (IND), "2" = Team 2 (AUS)
  const getResultDisplay = (win: string) => {
    const winMap: {
      [key: string]: { label: string; color: string; title: string };
    } = {
      "1": { label: "I", color: "text-red-500", title: "Team 1" },
      "2": { label: "A", color: "text-yellow-500", title: "Team 2" },
    };

    return (
      winMap[win] || { label: win, color: "text-gray-400", title: "Unknown" }
    );
  };

  // Get game slug
  const gameSlug = gameCode?.toLowerCase() || "superover_3";

  // Normalize game slug for IndividualResultModal
  const normalizedGameSlug = useMemo(() => {
    if (gameCode) {
      const lowerCaseSlug = gameCode.toLowerCase();
      if (lowerCaseSlug === "superover_3" || lowerCaseSlug === "minisuperover") {
        return "superover";
      }
      return lowerCaseSlug.replace(/[^a-z0-9]/g, "");
    }
    return "superover"; // Default fallback
  }, [gameCode]);

  // Handle clicking on individual result to show details
  const handleResultClick = (result: any) => {
    const resultId = result?.mid || result?.roundId || result?.id || result?.matchId;
    if (!resultId) {
      console.error("🎰 MiniSuperOver: No result ID found in result", result);
      alert("Unable to open result details: Missing result ID");
      return;
    }
    resultModal.openModal(String(resultId), result);
  };

  // Function to filter user bets based on selected filter (kept for customGetFilteredBets)
  const getFilteredBets = (bets: any[], filter: string) => {
    if (filter === "all") return bets;
    return bets.filter((bet: any) => {
      const oddCategory = bet.betData?.oddCategory?.toLowerCase();
      const status = bet.status?.toLowerCase();
      switch (filter) {
        case "back": return oddCategory === "back";
        case "lay": return oddCategory === "lay";
        case "deleted": return status === "deleted" || status === "cancelled";
        default: return true;
      }
    });
  };

  return (
    <div className="flex flex-col gap-1">
     
        {/* Bookmaker Section */}
        {bookmakerMarket && (
          <div className="bg-[var(--border)]/20 w-full">
            <div className="bg-[var(--bg-secondary85)] flex items-center justify-between px-2">
              <h1 className="text-white text-sm px-1 font-normal leading-7">
                {bookmakerMarket.mname}
              </h1>
            </div>
            <table className="w-full">
              <thead>
                <tr>
                  <td className="text-xs font-bold text-[var(--bg-primary90)] pl-2 md:w-72"></td>
                  <td className="flex justify-end">
                    <div className="text-center text-sm md:text-base py-1 bg-[var(--bg-back)] font-semibold w-11 md:w-16">
                      Back
                    </div>
                  </td>
                  <td>
                    <div className="text-center text-sm md:text-base py-1 bg-[var(--bg-lay)] font-semibold w-11 md:w-16">
                      Lay
                    </div>
                  </td>
                </tr>
              </thead>
              <tbody>
                {bookmakerMarket.section?.map((section: any, idx: number) => {
                  const teamName = section.nat || `Team ${idx + 1}`;
                  const isLocked = isStatusLocked(
                    section?.gstatus || bookmakerMarket?.status || "",
                    "BOOKMAKER"
                  );

                  // Extract odds - only back1 and lay1 for Bookmaker
                  const back1 = getOddsFromSection(section, "back1");
                  const lay1 = getOddsFromSection(section, "lay1");
                  
                  // Calculate profit/loss
                  const profitLoss = currentBet?.data ? getBetProfitLoss(section.sid, teamName, bookmakerMarket.mname) : 0;

                  return (
                    <tr
                      key={`bookmaker-${idx}-${section.sid || idx}`}
                      className="border-b border-t border-[var(--border)] relative"
                    >
                      <td className="md:pl-2 pl-0 max-w-[80px] md:max-w-full align-top">
                        <div className="flex flex-col justify-start pt-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate md:text-[12px] text-xs md:font-semibold font-normal px-2 text-wrap">
                              {teamName}
                            </span>
                            {profitLoss !== 0 && (
                              <span
                                className={`text-[10px] font-semibold ${
                                  profitLoss > 0 ? "text-green-500" : "text-red-500"
                                }`}
                              >
                                {profitLoss > 0 ? "+" : ""}
                                {profitLoss.toFixed(0)}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td colSpan={2} className="relative p-0">
                        <div className="relative">
                          {isLocked &&
                            renderLockedOverlay(
                              section?.gstatus ||
                                bookmakerMarket?.status ||
                                "LOCKED"
                            )}
                          <div className="flex">
                            <BlinkingOddsCell
                              value={back1?.odds}
                              vol={back1?.size}
                              type="back"
                              isLocked={isLocked}
                              onClick={() =>
                                !isLocked &&
                                back1?.odds &&
                                back1.odds !== "0.0" &&
                                handleBookmakerBetClick(section, "back", back1.odds)
                              }
                            />
                            <BlinkingOddsCell
                              value={lay1?.odds}
                              vol={lay1?.size}
                              type="lay"
                              isLocked={isLocked}
                              onClick={() =>
                                !isLocked &&
                                lay1?.odds &&
                                lay1.odds !== "0.0" &&
                                handleBookmakerBetClick(section, "lay", lay1.odds)
                              }
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
        {/* Right Column: Fancy, Tie, Fancy1 */}
         {/* Fancy1 Section (excluding Tie) */}
         {fancy1Market && (
            <div>
              <div className="bg-[var(--bg-secondary85)] flex items-center justify-between px-2">
                <h1 className="text-white text-sm px-1 font-normal leading-7">
                  Fancy1
                </h1>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-[var(--border)] border-b">
                    <td className="text-xs font-bold text-[var(--bg-primary90)] pl-2 md:w-72 w-50"></td>
                    <td className="p-0 border-[var(--border)] w-full">
                      <div className="flex justify-end">
                        <div className="text-center text-sm md:text-base py-1 bg-[var(--bg-back)] font-semibold w-full">
                          Back
                        </div>
                        <div className="text-center text-sm md:text-base py-1 bg-[var(--bg-lay)] font-semibold w-full">
                          Lay
                        </div>
                      </div>
                    </td>
                  </tr>
                </thead>
                <tbody className="border-[var(--border)]">
                  {fancy1Market.section
                    ?.filter((section: any) => section.nat !== "Tie")
                    .map((section: any, idx: number) => {
                      const isLocked = isStatusLocked(
                        section?.gstatus || fancy1Market?.status || "",
                        "FANCY"
                      );

                      const back1 = getOddsFromSection(section, "back1");
                      const lay1 = getOddsFromSection(section, "lay1");
                      
                      // Calculate profit/loss
                      const profitLoss = currentBet?.data ? getBetProfitLoss(section.sid, section.nat, fancy1Market.mname) : 0;

                      return (
                        <tr key={`fancy1-${idx}-${section.sid || idx}`} className="border-[var(--border)]">
                          <td className="border-[var(--border)] border-b md:w-72 w-50 align-top">
                            <div className="flex flex-col justify-start pt-1">
                              <div className="flex items-center gap-2">
                                <span className="truncate md:w-72 w-50 md:text-[12px] md:font-semibold text-xs font-normal px-2 text-wrap">
                                  {section.nat}
                                </span>
                                {profitLoss !== 0 && (
                                  <span
                                    className={`text-[10px] pe-2 font-semibold ${
                                      profitLoss > 0 ? "text-green-500" : "text-red-500"
                                    }`}
                                  >
                                    {profitLoss > 0 ? "+" : ""}
                                    {profitLoss.toFixed(0)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="border-[var(--border)] w-full">
                            <div className="relative">
                              {isLocked &&
                                renderLockedOverlay(
                                  section?.gstatus || fancy1Market?.status || "LOCKED"
                                )}
                              <div className="flex justify-end">
                                <FancyOddsCell
                                  value={back1?.odds}
                                  vol={back1?.size}
                                  type="back"
                                  isLocked={isLocked}
                                  onClick={() =>
                                    !isLocked &&
                                    back1?.odds &&
                                    back1.odds !== "0.0" &&
                                    handleFancyBetClick(
                                      section,
                                      fancy1Market,
                                      "back",
                                      back1.odds
                                    )
                                  }
                                />
                                <FancyOddsCell
                                  value={lay1?.odds}
                                  vol={lay1?.size}
                                  type="lay"
                                  isLocked={isLocked}
                                  onClick={() =>
                                    !isLocked &&
                                    lay1?.odds &&
                                    lay1.odds !== "0.0" &&
                                    handleFancyBetClick(
                                      section,
                                      fancy1Market,
                                      "lay",
                                      lay1.odds
                                    )
                                  }
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
          {/* Fancy Section */}
          {fancyMarket && (
            <div>
              <div className="bg-[var(--bg-secondary85)] flex items-center justify-between px-2">
                <h1 className="text-white text-sm px-1 font-normal leading-7">
                  {fancyMarket.mname}
                </h1>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-[var(--border)] border-b">
                    <td className="text-xs font-bold text-[var(--bg-primary90)] pl-2 md:w-72 w-50"></td>
                    <td className="p-0 border-[var(--border)] w-full">
                      <div className="flex justify-end">
                        <div className="text-center text-sm md:text-base py-1 bg-[var(--bg-lay)] font-semibold w-full">
                          No
                        </div>
                        <div className="text-center text-sm md:text-base py-1 bg-[var(--bg-back)] font-semibold w-full">
                          Yes
                        </div>
                      </div>
                    </td>
                  </tr>
                </thead>
                <tbody className="border-[var(--border)]">
                  {fancyMarket.section?.map((section: any, idx: number) => {
                    const isLocked = isStatusLocked(
                      section?.gstatus || fancyMarket?.status || "",
                      "FANCY"
                    );

                    const back1 = getOddsFromSection(section, "back1");
                    const lay1 = getOddsFromSection(section, "lay1");
                    
                    // Calculate profit/loss
                    const profitLoss = currentBet?.data ? getBetProfitLoss(section.sid, section.nat, fancyMarket.mname) : 0;

                    return (
                      <tr key={`fancy-${idx}-${section.sid || idx}`} className="border-[var(--border)]">
                        <td className="border-[var(--border)] border-b md:w-72 w-50 align-top">
                          <div className="flex flex-col justify-start pt-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate md:w-72 w-50 md:text-[12px] md:font-semibold text-xs font-normal px-2 text-wrap">
                                {section.nat}
                              </span>
                              {profitLoss !== 0 && (
                                <span
                                  className={`text-[10px] pe-2 font-semibold ${
                                    profitLoss > 0 ? "text-green-500" : "text-red-500"
                                  }`}
                                >
                                  {profitLoss > 0 ? "+" : ""}
                                  {profitLoss.toFixed(0)}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="border-[var(--border)] w-full">
                          <div className="relative">
                            {isLocked &&
                              renderLockedOverlay(
                                section?.gstatus || fancyMarket?.status || "LOCKED"
                              )}
                            <div className="flex justify-end">
                              <FancyOddsCell
                                value={lay1?.odds}
                                vol={lay1?.size}
                                type="lay"
                                isLocked={isLocked}
                                onClick={() =>
                                  !isLocked &&
                                  lay1?.odds &&
                                  lay1.odds !== "0.0" &&
                                  handleFancyBetClick(
                                    section,
                                    fancyMarket,
                                    "lay",
                                    lay1.odds
                                  )
                                }
                              />
                              <FancyOddsCell
                                value={back1?.odds}
                                vol={back1?.size}
                                type="back"
                                isLocked={isLocked}
                                onClick={() =>
                                  !isLocked &&
                                  back1?.odds &&
                                  back1.odds !== "0.0" &&
                                  handleFancyBetClick(
                                    section,
                                    fancyMarket,
                                    "back",
                                    back1.odds
                                  )
                                }
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Tie Section (from Fancy1 market) */}
          {fancy1Market && (
            <div>
              <div className="bg-[var(--bg-secondary85)] flex items-center justify-between px-2">
                <h1 className="text-white text-sm px-1 font-normal leading-7">
                  Tie
                </h1>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-[var(--border)] border-b">
                    <td className="text-xs font-bold text-[var(--bg-primary90)] pl-2 md:w-72 w-50"></td>
                    <td className="p-0 border-[var(--border)] w-full">
                      <div className="flex justify-end">
                        <div className="text-center text-sm md:text-base py-1 bg-[var(--bg-back)] font-semibold w-full">
                          Back
                        </div>
                        <div className="text-center text-sm md:text-base py-1 bg-[var(--bg-lay)] font-semibold w-full">
                          Lay
                        </div>
                      </div>
                    </td>
                  </tr>
                </thead>
                <tbody className="border-[var(--border)]">
                  {fancy1Market.section
                    ?.filter((section: any) => section.nat === "Tie")
                    .map((section: any, idx: number) => {
                      const isLocked = isStatusLocked(
                        section?.gstatus || fancy1Market?.status || "",
                        "FANCY"
                      );

                      const back1 = getOddsFromSection(section, "back1");
                      const lay1 = getOddsFromSection(section, "lay1");
                      
                      // Calculate profit/loss
                      const profitLoss = currentBet?.data ? getBetProfitLoss(section.sid, section.nat, fancy1Market.mname) : 0;

                      return (
                        <tr key={`tie-${idx}-${section.sid || idx}`} className="border-[var(--border)]">
                          <td className="border-[var(--border)] border-b md:w-72 w-50 align-top">
                            <div className="flex flex-col justify-start pt-1">
                              <div className="flex items-center gap-2">
                                <span className="truncate md:w-72 w-50 md:text-[12px] md:font-semibold text-xs font-normal px-2 text-wrap">
                                  {section.nat}
                                </span>
                                {profitLoss !== 0 && (
                                  <span
                                    className={`text-[10px] pe-2 font-semibold ${
                                      profitLoss > 0 ? "text-green-500" : "text-red-500"
                                    }`}
                                  >
                                    {profitLoss > 0 ? "+" : ""}
                                    {profitLoss.toFixed(0)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="border-[var(--border)] w-full">
                            <div className="relative">
                              {isLocked &&
                                renderLockedOverlay(
                                  section?.gstatus || fancy1Market?.status || "LOCKED"
                                )}
                              <div className="flex justify-end">
                                <FancyOddsCell
                                  value={back1?.odds}
                                  vol={back1?.size}
                                  type="back"
                                  isLocked={isLocked}
                                  onClick={() =>
                                    !isLocked &&
                                    back1?.odds &&
                                    back1.odds !== "0.0" &&
                                    handleFancyBetClick(
                                      section,
                                      fancy1Market,
                                      "back",
                                      back1.odds
                                    )
                                  }
                                />
                                <FancyOddsCell
                                  value={lay1?.odds}
                                  vol={lay1?.size}
                                  type="lay"
                                  isLocked={isLocked}
                                  onClick={() =>
                                    !isLocked &&
                                    lay1?.odds &&
                                    lay1.odds !== "0.0" &&
                                    handleFancyBetClick(
                                      section,
                                      fancy1Market,
                                      "lay",
                                      lay1.odds
                                    )
                                  }
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}

         
       
      </div>

      {/* Results Section */}
      {results && results.length > 0 && (
        <div className="mt-1 flex flex-col gap-1">
          <div className="bg-[var(--bg-secondary85)] border border-gray-300 flex justify-between px-2 py-0.5 items-center">
            <h2 className="text-sm font-normal leading-8 text-white">
              Last Result
            </h2>
            <button
              onClick={() => navigate(`/casino-result?game=SUPEROVER_3`)}
              className="text-xs text-white hover:underline"
            >
              View All
            </button>
          </div>
          <div className="flex justify-end items-center mb-2 gap-2 mx-2 flex-wrap">
            {results.slice(0, 10).map((item: any, index: number) => {
              const resultDisplay = getResultDisplay(item.win || "");
              return (
                <div
                  key={item.mid || `result-${item.win}-${index}`}
                  className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-xs font-semibold ${resultDisplay.color} cursor-pointer hover:scale-110 transition-transform`}
                  title={`Round ID: ${item.mid || "N/A"} - ${resultDisplay.title}`}
                  onClick={() => handleResultClick(item)}
                >
                  {resultDisplay.label}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Individual Result Details Modal */}
      <IndividualResultModal
        isOpen={resultModal.isOpen}
        onClose={resultModal.closeModal}
        resultId={resultModal.selectedResultId || undefined}
        gameType={normalizedGameSlug}
        title={`${gameCode || "MiniSuperOver"} Result Details`}
        enableBetFiltering={true}
        customGetFilteredBets={getFilteredBets}
      />
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
// Only re-render when casinoData actually changes (not just reference)
const MiniSuperOver = React.memo(MiniSuperOverComponent, (prevProps, nextProps) => {
  // Shallow compare primitive props
  if (
    prevProps.remainingTime !== nextProps.remainingTime ||
    prevProps.gameCode !== nextProps.gameCode ||
    prevProps.gameName !== nextProps.gameName ||
    prevProps.onBetClick !== nextProps.onBetClick
  ) {
    return false; // Props changed, should re-render
  }

  // Deep compare casinoData (main prop that changes frequently)
  if (prevProps.casinoData !== nextProps.casinoData) {
    // If references are different, do deep comparison
    const prevData = JSON.stringify(prevProps.casinoData);
    const nextData = JSON.stringify(nextProps.casinoData);
    if (prevData !== nextData) {
      return false; // Data changed, should re-render
    }
  }

  // Deep compare results array
  if (prevProps.results !== nextProps.results) {
    const prevResults = JSON.stringify(prevProps.results);
    const nextResults = JSON.stringify(nextProps.results);
    if (prevResults !== nextResults) {
      return false; // Results changed, should re-render
    }
  }

  // Deep compare currentBet
  if (prevProps.currentBet !== nextProps.currentBet) {
    const prevBet = JSON.stringify(prevProps.currentBet);
    const nextBet = JSON.stringify(nextProps.currentBet);
    if (prevBet !== nextBet) {
      return false; // Current bet changed, should re-render
    }
  }

  // All props are equal, skip re-render
  return true;
});

MiniSuperOver.displayName = "MiniSuperOver";

export default MiniSuperOver;
