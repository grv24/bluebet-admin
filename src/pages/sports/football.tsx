import React, { useState, useRef, useEffect, useMemo } from "react";
import { useCookies } from "react-cookie";
import { baseUrl, SERVER_URL } from "@/helper/auth";
import toast from "react-hot-toast";

interface FootballProps {
  matchOdds: any;
  competition: any;
  date: any;
  match: any;
  market: any;
  eventId: any;
  sportId: any;
  downlinesBets?: any;
}

/**
 * Status values that indicate a betting market is locked/closed
 */
const LOCKED_STATUSES = {
  MATCH_ODDS: ["SUSPENDED", "CLOSED"],
};

/**
 * Check if a status is locked for match odds
 * @param status - The status to check
 * @returns boolean indicating if the status is locked
 */
const isStatusLocked = (status: string): boolean => {
  return LOCKED_STATUSES.MATCH_ODDS.includes(status);
};

/**
 * Render locked status overlay component
 * @param status - The status message to display
 * @returns JSX element for the locked overlay
 */
const renderLockedOverlay = (status: string) => (
  <div className="absolute uppercase inset-0 bg-gray-700 text-[#ff0000] font-bold text-center opacity-95 flex items-center justify-center z-10 h-full text-sm">
    {status}
  </div>
);

/**
 * Custom hook to track value changes and trigger blink effect
 * @param value - The value to track for changes
 * @param vol - Volume value to include in change detection
 * @returns boolean indicating if the value is currently blinking
 */
const useBlinkOnChange = (value: any, vol: any) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const prevValueRef = useRef<any>(null);
  const prevVolRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if either value or volume has changed
    const valueChanged =
      prevValueRef.current !== null && prevValueRef.current !== value;
    const volChanged =
      prevVolRef.current !== null && prevVolRef.current !== vol;

    if (valueChanged || volChanged) {
      // Clear existing timer if any
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      setIsBlinking(true);
      timerRef.current = setTimeout(() => {
        setIsBlinking(false);
        timerRef.current = null;
      }, 800); // Reduced blink duration for better UX
    }

    prevValueRef.current = value;
    prevVolRef.current = vol;
  }, [value, vol]);

  // Cleanup timer on unmount
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
 * Component for odds display with blink effect
 */
const BlinkingOddsCell = ({
  value,
  vol,
  type,
  index,
  isLocked,
  onClick,
  width,
}: {
  value: any;
  vol: any;
  type: "back" | "lay";
  index: number;
  isLocked?: boolean;
  onClick?: () => void;
  width?: boolean;
}) => {
  const isBlinking = useBlinkOnChange(value, vol);

  const backgroundClass = useMemo(() => {
    const baseClass = `text-center cursor-pointer min-h-[40px] flex flex-col justify-center ${width ? "w-full" : "w-1/6"}`;

    if (isBlinking) {
      return `${baseClass} bg-yellow-300 shadow-lg transform scale-105 animate-pulse`;
    }

    if (type === "back") {
      if (index === 0)
        return `${baseClass} bg-[var(--back2)] hover:bg-[var(--back-hover)] transition-colors duration-200`;
      if (index === 1)
        return `${baseClass} bg-[var(--back1)] hover:bg-[var(--back-hover)] transition-colors duration-200`;
      if (index === 2)
        return `${baseClass} bg-[var(--back)] hover:bg-[var(--back-hover)] transition-colors duration-200`;
    } else {
      if (index === 0)
        return `${baseClass} bg-[var(--lay)] hover:bg-[var(--lay-hover)] transition-colors duration-200`;
      if (index === 1)
        return `${baseClass} bg-[var(--lay1)] hover:bg-[var(--lay-hover)] transition-colors duration-200`;
      if (index === 2)
        return `${baseClass} bg-[var(--lay2)] hover:bg-[var(--lay-hover)] transition-colors duration-200`;
    }

    return `${baseClass} bg-gray-100 hover:bg-gray-200 transition-colors duration-200`;
  }, [isBlinking, type, index]);

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
        {vol && vol !== "0.0" && vol !== 0 && vol !== "0" ? vol : "-"}
      </span>
    </div>
  );
};

BlinkingOddsCell.displayName = "BlinkingOddsCell";

/**
 * Component for individual correct score set
 */
const CorrectSet = ({ data, market, sportType }: { data: any; market: string; sportType: string }) => {
  const isLocked = isStatusLocked(data?.status || "");
  const isBlinking = useBlinkOnChange(data.b1, data.bs1);
  
  const backgroundClass = useMemo(() => {
    const baseClass = `text-center cursor-pointer min-h-[40px] flex flex-col justify-center`;
    
    if (isBlinking) {
      return `${baseClass} bg-yellow-300 shadow-lg transform scale-105 animate-pulse`;
    }
    
    return `${baseClass} bg-[var(--back)] hover:bg-[var(--back-hover)] transition-colors duration-200`;
  }, [isBlinking]);

  return (
    <table>
      <thead></thead>
      <tbody>
        <tr className="border-white/10 w-full bg-gray-100 flex justify-between items-start border-b">
          <td className="text-sm font-normal px-2 py-1">{data.rname}</td>
          <td className={backgroundClass}>
            <div className="relative">
              {/* Locked Status Overlay */}
              {isLocked && renderLockedOverlay(data?.status || "LOCKED")}
              <div className="flex flex-col min-w-20 items-center justify-center">
                <h2 className={`text-sm font-semibold ${isBlinking ? "text-gray-900" : ""}`}>
                  {data.b1 && data.b1 !== "0.0" && data.b1 !== 0 && data.b1 !== "0"
                    ? data.b1
                    : "-"}
                </h2>
                <p className={`text-xs ${isBlinking ? "text-gray-700" : "text-gray-600"}`}>
                  {data.bs1 && data.bs1 !== "0.0" && data.bs1 !== 0 && data.bs1 !== "0"
                    ? data.bs1
                    : "-"}
                </p>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );
};

CorrectSet.displayName = "CorrectSet";

const Football: React.FC<FootballProps> = ({
  matchOdds,
  competition,
  date,
  match,
  market,
  eventId,
  sportId,
  downlinesBets,
}) => {
  const [showMatchOdds, setShowMatchOdds] = useState<boolean>(false);
  const [showOtherMarkets, setShowOtherMarkets] = useState<boolean>(false);
  const [showFancyOdds, setShowFancyOdds] = useState<boolean>(false);
  const [showCorrectScore, setShowCorrectScore] = useState<boolean>(false);
  const [showOverUnder05, setShowOverUnder05] = useState<boolean>(false);
  const [showOverUnder15, setShowOverUnder15] = useState<boolean>(false);
  const [showOverUnder25, setShowOverUnder25] = useState<boolean>(false);
  const [showPeriodWinner, setShowPeriodWinner] = useState<boolean>(false);
  const [showCorrectScoreSets, setShowCorrectScoreSets] = useState<{ [key: string]: boolean }>({});
  const [showBookSummary, setShowBookSummary] = useState<boolean>(false);
  const [showScoreCard, setShowScoreCard] = useState<boolean>(false);
  const [showMyBets, setShowMyBets] = useState<boolean>(false);
  const [activeBetTab, setActiveBetTab] = useState<'matched' | 'settled'>('matched');
  const [showLiveMatch, setShowLiveMatch] = useState<boolean>(false);
  const [showUserBookModal, setShowUserBookModal] = useState<boolean>(false);
  const [showBetLockModal, setShowBetLockModal] = useState<boolean>(false);
  const [showViewMoreModal, setShowViewMoreModal] = useState<boolean>(false);
  const [showMyBetsModal, setShowMyBetsModal] = useState<boolean>(false);
  const [showBetDetailsModal, setShowBetDetailsModal] = useState<boolean>(false);
  const [betDetails, setBetDetails] = useState<any>(null);
  const [loadingBetDetails, setLoadingBetDetails] = useState<boolean>(false);
  const [selectedResult, setSelectedResult] = useState<'win' | 'loss' | null>(null);
  const [resultValue, setResultValue] = useState<string>('');
  const [isProcessingBet, setIsProcessingBet] = useState<boolean>(false);
  
  const normalizedMatchOdds = matchOdds?.data?.data?.matchOddsResponseDTO || [];
  const normalizedOtherMarketOdds = matchOdds?.data?.data?.other_market_odds || [];

  // Get authentication token from cookies
  const [cookies] = useCookies([
    baseUrl.includes("techadmin") ? "TechAdmin" : "Admin",
  ]);
  const authToken = cookies[baseUrl.includes("techadmin") ? "TechAdmin" : "Admin"];

  // Log downlines bets data for debugging
  console.log("Downlines Bets:", downlinesBets);

  // Helper functions for bet actions
  const handleProceedBet = async (betId: string) => {
    if (!selectedResult || !resultValue.trim()) {
      toast.error("Please select result type and enter result value");
      return;
    }

    setIsProcessingBet(true);
    try {
      const response = await fetch(`https://api.2xbat.com/api/v1/sports/bet/${betId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: selectedResult === 'win' ? 'won' : 'lost',
          result: {
            winner: resultValue,
            score: "", // You can add score input if needed
            outcome: `${resultValue} ${selectedResult === 'win' ? 'wins' : 'loses'}`
          },
          betData: {
            profit: selectedResult === 'win' ? betDetails.betProfit : 0,
            stake: betDetails.betAmount
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to proceed bet: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        toast.success(`Bet ${selectedResult === 'win' ? 'won' : 'lost'} successfully!`);
        setShowBetDetailsModal(false);
        setSelectedResult(null);
        setResultValue('');
        // TODO: Refresh bet list or update state
      } else {
        toast.error(`Failed to proceed bet: ${data.message}`);
      }
    } catch (error) {
      console.error("Error proceeding bet:", error);
      toast.error("Error proceeding bet. Please try again.");
    } finally {
      setIsProcessingBet(false);
    }
  };

  const handleDeleteBet = (betId: string) => {
    console.log("Delete bet:", betId);
    // TODO: Implement delete bet logic
  };

  const handleReopenBet = async (betId: string) => {
    setIsProcessingBet(true);
    try {
      const response = await fetch(`https://api.2xbat.com/api/v1/sports/bets/reopen/${betId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to reopen bet: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        toast.success("Bet reopened successfully!");
        setShowBetDetailsModal(false);
        // TODO: Refresh bet list or update state
      } else {
        toast.error(`Failed to reopen bet: ${data.message}`);
      }
    } catch (error) {
      console.error("Error reopening bet:", error);
      toast.error("Error reopening bet. Please try again.");
    } finally {
      setIsProcessingBet(false);
    }
  };

  // Fetch bet details by betId
  const fetchBetDetails = async (betId: string) => {
    if (!authToken) {
      console.error("No auth token available");
      return;
    }

    setLoadingBetDetails(true);
    try {
      const response = await fetch(`${SERVER_URL}/api/v1/sports/bet/${betId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch bet details: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        setBetDetails(data.data);
        setShowBetDetailsModal(true);
      } else {
        console.error("Failed to fetch bet details:", data.message);
      }
    } catch (error) {
      console.error("Error fetching bet details:", error);
    } finally {
      setLoadingBetDetails(false);
    }
  };


  // Filter bets based on status
  const matchedBets = downlinesBets?.bets?.filter((bet: any) => bet.betStatus === 'pending') || [];
  const settledBets = downlinesBets?.bets?.filter((bet: any) => ['won', 'lost', 'settled'].includes(bet.betStatus)) || [];

  const footballMatchOddsRender = () => {
    return (
      <React.Fragment>
        {/* Match Odds */}
        {normalizedMatchOdds?.length > 0 &&
          (() => {
            const matchOdd = normalizedMatchOdds.find(
              (item: any) => item.market == "Match Odds"
            );
            return (
              <div key={matchOdd?.mid} className="flex flex-col">
                <div
                  onClick={() => setShowMatchOdds(!showMatchOdds)}
                  className="font-bold text-lg py-1 flex items-center px-2 bg-[var(--bg-secondary70)] gap-2 justify-between"
                >
                  <h2 className="text-sm font-normal text-white/90 leading-6 tracking-tight">
                    Match Odds
                  </h2>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setShowBetLockModal(true)}
                      className="text-xs px-2 font-semibold leading-6 tracking-tight bg-[var(--bg-secondary)] text-white/90"
                    >
                      BET LOCK
                    </button>
                    <button 
                      onClick={() => setShowUserBookModal(true)}
                      className="text-xs px-2 font-semibold leading-6 tracking-tight bg-[var(--bg-secondary)] text-white/90"
                    >
                      USER BOOK
                    </button>
                  </div>
                </div>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    showMatchOdds
                      ? "max-h-[1000px] opacity-100 "
                      : "max-h-0 opacity-0  bg-[var(--bg-secondary70)]"
                  }`}
                >
                  <table className="w-full">
                    <thead>
                      <tr>
                        <td className="text-xs font-bold text-[var(--bg-primary90)] pl-2 md:w-72"></td>
                        <td>
                          <div className="w-10 md:w-16"></div>
                        </td>
                        <td>
                          <div className="w-10 md:w-16"></div>
                        </td>
                        <td className="flex justify-end">
                          <div className="text-center text-sm md:text-base py-1 bg-[var(--back)] font-semibold w-11 md:w-16">
                            Back
                          </div>
                        </td>
                        <td>
                          <div className="text-center text-sm md:text-base py-1 bg-[var(--lay)] font-semibold w-11 md:w-16">
                            Lay
                          </div>
                        </td>
                        <td>
                          <div className="w-10 md:w-16"></div>
                        </td>
                        <td>
                          <div className="w-10 md:w-16"></div>
                        </td>
                      </tr>
                    </thead>
                    <tbody>
                      {matchOdd?.oddDatas?.map((teamData: any, idx: number) => {
                        const teamName = teamData.rname || `Team ${idx + 1}`;
                        const isLocked = isStatusLocked(
                          teamData?.status || matchOdd?.status || ""
                        );

                        return (
                          <tr
                            key={`match-team-${idx}-${teamData.sid || idx}`}
                            className="border-b border-t border-white/10 relative"
                          >
                            <td className="md:pl-2 pl-0 max-w-[80px] bg-gray-100 md:max-w-full align-top">
                              <div className="flex flex-col justify-start pt-1">
                                <span className="truncate text-sm font-normal whitespace-nowrap">
                                  {teamName}
                                </span>
                              </div>
                            </td>
                            <td colSpan={6} className="relative p-0">
                              <div className="relative">
                                {/* Locked Status Overlay */}
                                {isLocked &&
                                  renderLockedOverlay(
                                    teamData?.status ||
                                      matchOdd?.status ||
                                      "LOCKED"
                                  )}
                                <div className="flex">
                                  {[
                                    {
                                      value: teamData.b3,
                                      vol: teamData.bs3,
                                      type: "back" as const,
                                      index: 0,
                                    },
                                    {
                                      value: teamData.b2,
                                      vol: teamData.bs2,
                                      type: "back" as const,
                                      index: 1,
                                    },
                                    {
                                      value: teamData.b1,
                                      vol: teamData.bs1,
                                      type: "back" as const,
                                      index: 2,
                                    },
                                    {
                                      value: teamData.l1,
                                      vol: teamData.ls1,
                                      type: "lay" as const,
                                      index: 0,
                                    },
                                    {
                                      value: teamData.l2,
                                      vol: teamData.ls2,
                                      type: "lay" as const,
                                      index: 1,
                                    },
                                    {
                                      value: teamData.l3,
                                      vol: teamData.ls3,
                                      type: "lay" as const,
                                      index: 2,
                                    },
                                  ].map((item, i) => (
                                    <BlinkingOddsCell
                                      key={i}
                                      value={item.value}
                                      vol={item.vol}
                                      type={item.type}
                                      index={item.index}
                                      isLocked={isLocked}
                                    />
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

        {/* Other Market Odds */}
        {normalizedOtherMarketOdds?.length > 0 &&
          (() => {
            const otherMarketOdds = normalizedOtherMarketOdds.filter(
              (item: any) =>
                item.market.includes("OVER_UNDER") ||
                item.market.includes("Period Winner") ||
                item.market.includes("Next Goal") ||
                item.market.includes("BOTH_TEAMS_TO_SCORE") ||
                item.market.includes("Match Time Result") ||
                item.market.includes("1X2 Corners")
            );

            return (
              <>
                {otherMarketOdds?.map((item: any, index: number) => (
                  <div key={index} className="flex flex-col mb-4">
                    {/* Header for each Over/Under market */}
                    <div
                      onClick={() => {
                        // Toggle specific market visibility based on market type
                        if (item.market.includes("OVER_UNDER_05")) {
                          setShowOverUnder05(!showOverUnder05);
                        } else if (item.market.includes("OVER_UNDER_15")) {
                          setShowOverUnder15(!showOverUnder15);
                        } else if (item.market.includes("OVER_UNDER_25")) {
                          setShowOverUnder25(!showOverUnder25);
                        } else if (item.market.includes("Period Winner")) {
                          setShowPeriodWinner(!showPeriodWinner);
                        } else {
                          setShowOtherMarkets(!showOtherMarkets);
                        }
                      }}
                      className="font-bold text-lg py-1 flex items-center px-2 bg-[var(--bg-secondary70)] gap-2 justify-between cursor-pointer"
                    >
                      <h2 className="text-sm font-normal text-white/90 leading-6 tracking-tight">
                        {item.market}
                      </h2>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setShowBetLockModal(true)}
                          className="text-xs px-2 font-semibold leading-6 tracking-tight bg-[var(--bg-secondary)] text-white/90"
                        >
                          BET LOCK
                        </button>
                        <button 
                          onClick={() => setShowUserBookModal(true)}
                          className="text-xs px-2 font-semibold leading-6 tracking-tight bg-[var(--bg-secondary)] text-white/90"
                        >
                          USER BOOK
                        </button>
                      </div>
                    </div>

                    {/* Collapsible content with animation */}
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        (item.market.includes("OVER_UNDER_05") && showOverUnder05) ||
                        (item.market.includes("OVER_UNDER_15") && showOverUnder15) ||
                        (item.market.includes("OVER_UNDER_25") && showOverUnder25) ||
                        (item.market.includes("Period Winner") && showPeriodWinner) ||
                        (!item.market.includes("OVER_UNDER") && !item.market.includes("Period Winner") && showOtherMarkets)
                          ? "max-h-[1000px] opacity-100"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      {/* Table for each market */}
                      <table className="w-full">
                      <thead>
                        <tr>
                          <td className="text-xs font-bold text-[var(--bg-primary90)] pl-2 md:w-72">
                            {/* Min: {item?.min || 0} Max: {item?.max || 0} */}
                          </td>
                          <td>
                            <div className="w-10 md:w-16"></div>
                          </td>
                          <td>
                            <div className="w-10 md:w-16"></div>
                          </td>
                          <td className="flex justify-end">
                            <div className="text-center text-sm md:text-base py-1 bg-[var(--back)] font-semibold w-11 md:w-16">
                              Back
                            </div>
                          </td>
                          <td>
                            <div className="text-center text-sm md:text-base py-1 bg-[var(--lay)] font-semibold w-11 md:w-16">
                              Lay
                            </div>
                          </td>
                          <td>
                            <div className="w-10 md:w-16"></div>
                          </td>
                          <td>
                            <div className="w-10 md:w-16"></div>
                          </td>
                        </tr>
                      </thead>
                      <tbody>
                        {item.oddDatas?.map((teamData: any, idx: number) => {
                          const teamName = teamData.rname || `Team ${idx + 1}`;
                          const isLocked = isStatusLocked(
                            teamData?.status || item?.status || ""
                          );

                          return (
                            <tr
                              key={`over-under-team-${idx}-${teamData.sid || idx}`}
                              className="border-b border-t border-white/10 relative"
                            >
                              <td className="md:pl-2 pl-0 max-w-[80px] bg-gray-100 md:max-w-full align-top">
                                <div className="flex flex-col justify-start pt-1">
                                  <span className="truncate text-sm font-normal whitespace-nowrap">
                                    {teamName}
                                  </span>
                                </div>
                              </td>
                              <td colSpan={6} className="relative p-0">
                                <div className="relative">
                                  {/* Locked Status Overlay */}
                                  {isLocked &&
                                    renderLockedOverlay(
                                      teamData?.status ||
                                        item?.status ||
                                        "LOCKED"
                                    )}
                                  <div className="flex">
                                    {[
                                      {
                                        value: teamData.b3,
                                        vol: teamData.bs3,
                                        type: "back" as const,
                                        index: 0,
                                      },
                                      {
                                        value: teamData.b2,
                                        vol: teamData.bs2,
                                        type: "back" as const,
                                        index: 1,
                                      },
                                      {
                                        value: teamData.b1,
                                        vol: teamData.bs1,
                                        type: "back" as const,
                                        index: 2,
                                      },
                                      {
                                        value: teamData.l1,
                                        vol: teamData.ls1,
                                        type: "lay" as const,
                                        index: 0,
                                      },
                                      {
                                        value: teamData.l2,
                                        vol: teamData.ls2,
                                        type: "lay" as const,
                                        index: 1,
                                      },
                                      {
                                        value: teamData.l3,
                                        vol: teamData.ls3,
                                        type: "lay" as const,
                                        index: 2,
                                      },
                                    ].map((item, i) => (
                                      <BlinkingOddsCell
                                        key={i}
                                        value={item.value}
                                        vol={item.vol}
                                        type={item.type}
                                        index={item.index}
                                        isLocked={isLocked}
                                     
                                      />
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </>
            );
          })()}

        {/* Match Result/Both Teams */}
    <div>
          {normalizedOtherMarketOdds
            ?.filter((item: any) =>
              item.market.includes("Match Result/Both Teams")
            )
            .map((correctSet: any, setIndex: number) => {
              const data = correctSet?.oddDatas || [];
              const colCount = data.length >= 6 ? 3 : data.length >= 2 ? 2 : 1;

              // Pre-resolve Tailwind cols (no dynamic class issue)
              const gridClass =
                data.length >= 6
                  ? "md:grid-cols-3"
                  : data.length >= 2
                    ? "md:grid-cols-2"
                    : "md:grid-cols-1";

              const marketKey = `correctScore_${setIndex}`;

              return (
                <div key={setIndex} className="flex flex-col mb-4">
                  {/* Header for each Correct Score set */}
                  <div
                    onClick={() => {
                      setShowCorrectScoreSets(prev => ({
                        ...prev,
                        [marketKey]: !prev[marketKey]
                      }));
                    }}
                    className="font-bold text-lg py-1 flex items-center px-2 bg-[var(--bg-secondary70)] gap-2 justify-between cursor-pointer"
                  >
                    <h2 className="text-sm font-normal text-white/90 leading-6 tracking-tight">
                      {correctSet.market}
                    </h2>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setShowBetLockModal(true)}
                        className="text-xs px-2 font-semibold leading-6 tracking-tight bg-[var(--bg-secondary)] text-white/90"
                      >
                        BET LOCK
                      </button>
                      <button 
                        onClick={() => setShowUserBookModal(true)}
                        className="text-xs px-2 font-semibold leading-6 tracking-tight bg-[var(--bg-secondary)] text-white/90"
                      >
                        USER BOOK
                      </button>
                    </div>
                  </div>

                  {/* Collapsible content with animation */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      showCorrectScoreSets[marketKey]
                        ? "max-h-[1000px] opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    {/* Grid of odds */}
                    <div className={`grid grid-cols-1 gap-x-2 ${gridClass}`}>
                      {data.map((item: any, idx: number) => (
                        <CorrectSet 
                          key={idx} 
                          data={item} 
                          market={correctSet.market}
                          sportType={sportId == "4" ? "cricket" : sportId == "1" ? "soccer" : "tennis"}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

     
      </React.Fragment>
    );
  };

  return (
    <div className="grid grid-cols-3 gap-2 p-2">
      <div className=" col-span-2 flex flex-col">
        <div className="bg-[var(--bg-secondary)] text-white flex items-center px-2 justify-between p-1">
          <h2 className="text-sm font-normal leading-6 tracking-wide">
            {competition} {">"} {match}
          </h2>
          <h2 className="text-sm font-normal leading-6 tracking-wide">
            {date}
          </h2>
        </div>
        <div className="space-y-4">{footballMatchOddsRender()}</div>
      </div>
        <div className="flex flex-col gap-2">
        <div className="flex flex-col">
          <h2
            onClick={() => setShowBookSummary(!showBookSummary)}
            className="bg-[var(--bg-secondary70)] text-white/90 leading-6 tracking-tight text-sm px-2 cursor-pointer"
          >
            Book Summary
          </h2>
          <div
            className={`bg-gray-100 border-gray-200 ${showBookSummary ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"}`}
          >
            <h2 className="text-sm font-normal leading-6 tracking-tight text-gray-500 px-2">
              No data found
            </h2>
          </div>
        </div>
        <div className="flex flex-col">
          <h2
            onClick={() => setShowScoreCard(!showScoreCard)}
            className="bg-[var(--bg-secondary70)] text-white/90 leading-6 tracking-tight text-sm px-2 cursor-pointer"
          >
            Score Card
          </h2>
          <div
            className={`bg-gray-100 border-gray-200 ${showScoreCard ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"}`}
          >
            <iframe
              src={`https://apis.professorji.in/api/scorecard?eventId=${eventId}&sport=${sportId == "4" ? "cricket" : sportId == "1" ? "soccer" : "tennis"}`}
              className="w-full h-full border-0"
              title="Scoreboard"
              loading="lazy"
            />
          </div>
        </div>
        {(normalizedMatchOdds?.some((market: any) => market?.isPlay === "true") || 
          normalizedOtherMarketOdds?.some((market: any) => market?.isPlay === "true")) && (
          <div className="flex flex-col">
            <h2
              onClick={() => setShowLiveMatch(!showLiveMatch)}
              className="bg-[var(--bg-secondary70)] text-white/90 leading-6 tracking-tight text-sm px-2 cursor-pointer"
            >
              Live Match
            </h2>
            <div
              className={`bg-gray-100 border-gray-200 ${showLiveMatch ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"}`}
            >
              <iframe
                src={`https://apis.professorji.in/api/tv?eventId=${eventId}&sport=${sportId == "4" ? "cricket" : sportId == "1" ? "soccer" : "tennis"}`}
                className="w-full h-full"
                frameBorder="0"
                allowFullScreen
                title="Live Sport Stream"
              />
            </div>
          </div>
        )}
        <div className="flex flex-col">
          <div className="flex items-center bg-[var(--bg-secondary70)] py-1 px-2 justify-between">
            <h2
              onClick={() => setShowMyBets(!showMyBets)}
              className=" text-white/90 leading-6 tracking-tight text-sm px-2 cursor-pointer"
            >
              My Bets
            </h2>
            <button
              onClick={() => setShowMyBetsModal(true)}
              className="bg-[var(--bg-secondary)] text-white/90 leading-6 tracking-tight text-sm px-2 cursor-pointer"
            >
              View More
            </button>
          </div>
          <div
            className={`bg-gray-100 border-gray-200 ${showMyBets ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"}`}
          >
            {downlinesBets?.success && downlinesBets?.bets?.length > 0 ? (
              <div className="p-2">
                <div className="flex justify-between items-center mb-2 text-xs">
                  <span className="text-gray-600">Total Bets: {downlinesBets.totalBets}</span>
                  <span className="text-gray-600">Users: {downlinesBets.downlineUserCount}</span>
                </div>
                <div className="flex border-b mb-2">
                  <button 
                    onClick={() => setActiveBetTab('matched')}
                    className={`px-3 py-2 font-medium text-xs ${
                      activeBetTab === 'matched' 
                        ? 'text-blue-600 border-b-2 border-blue-600' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Matched ({matchedBets.length})
                  </button>
                  <button 
                    onClick={() => setActiveBetTab('settled')}
                    className={`px-3 py-2 font-medium text-xs ${
                      activeBetTab === 'settled' 
                        ? 'text-blue-600 border-b-2 border-blue-600' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Settled ({settledBets.length})
                  </button>
                </div>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {(activeBetTab === 'matched' ? matchedBets : 
                    settledBets).map((bet: any, index: number) => (
                    <div key={bet.betId} className="p-2 bg-white rounded text-xs border">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{bet.rname}</div>
                          <div className="text-gray-500 text-[10px]">{bet.market}</div>
                        </div>
                        <div className="text-right">
                          <div className={`px-2 py-1 rounded text-[10px] ${
                            bet.betStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            bet.betStatus === 'won' ? 'bg-green-100 text-green-800' :
                            bet.betStatus === 'lost' ? 'bg-red-100 text-red-800' :
                            bet.betStatus === 'settled' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {bet.betStatus}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <div>
                          <span className="text-gray-500">Amount:</span>
                          <span className="font-medium ml-1">₹{bet.betAmount}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Profit:</span>
                          <span className="font-medium ml-1 text-green-600">₹{bet.betProfit}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Loss:</span>
                          <span className="font-medium ml-1 text-red-600">₹{bet.betLoss}</span>
                        </div>
                      </div>
                      <div className="text-[9px] text-gray-400 mt-1">
                        {new Date(bet.createdAt).toLocaleString()}
                      </div>
                      {/* Action Buttons */}
                      <div className="flex gap-1 mt-2">
                        {activeBetTab === 'matched' && (
                          <>
                            <button
                              onClick={() => fetchBetDetails(bet.betId)}
                              disabled={loadingBetDetails}
                              className="px-2 py-1 bg-green-500 text-white rounded text-[9px] hover:bg-green-600 disabled:opacity-50"
                            >
                              {loadingBetDetails ? "Loading..." : "Proceed"}
                            </button>
                            <button
                              onClick={() => handleDeleteBet(bet.betId)}
                              className="px-2 py-1 bg-red-500 text-white rounded text-[9px] hover:bg-red-600"
                            >
                              Delete
                            </button>
                          </>
                        )}
                        {activeBetTab === 'settled' && (
                          <>
                            <button
                              onClick={() => fetchBetDetails(bet.betId)}
                              disabled={loadingBetDetails}
                              className="px-2 py-1 bg-blue-500 text-white rounded text-[9px] hover:bg-blue-600 disabled:opacity-50"
                            >
                              {loadingBetDetails ? "Loading..." : "Details"}
                            </button>
                            <button
                              onClick={() => handleReopenBet(bet.betId)}
                              className="px-2 py-1 bg-orange-500 text-white rounded text-[9px] hover:bg-orange-600"
                            >
                              Reopen
                            </button>
                          </>
                        )}
                      </div>
            </div>
        ))}
                </div>
              </div>
            ) : (
              <h2 className="text-sm font-normal leading-6 tracking-tight text-gray-500 px-2">
                No data found
              </h2>
            )}
          </div>
        </div>
      </div>

      {/* User Book Modal */}
      {/* {showUserBookModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">User Book</h2>
              <button
                onClick={() => setShowUserBookModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
            <div className="text-center text-gray-500 py-8">
              No Record Found
            </div>
          </div>
        </div>
      )} */}

      {/* Bet Lock Modal */}
      {/* {showBetLockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Bet Lock</h2>
              <button
                onClick={() => setShowBetLockModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Code
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter transaction code"
              />
            </div>
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Accounts:</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {[
                  "All Account",
                  "Rrttvkl", 
                  "Trad777",
                  "Sona777777",
                  "Smr77777",
                  "Noida777",
                  "Jkh7",
                  "Pnk210"
                ].map((account, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gray-200 rounded"></div>
                    <span className="text-sm">{account}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between">
              <div className="bg-blue-500 text-white px-4 py-2 rounded text-center">
                <div className="text-lg font-bold">42</div>
                <div className="text-xs">1L</div>
              </div>
              <div className="bg-pink-500 text-white px-4 py-2 rounded text-center">
                <div className="text-lg font-bold">46</div>
                <div className="text-xs">1L</div>
              </div>
            </div>
          </div>
        </div>
      )} */}

      {/* My Bets Modal */}
      {/* {showMyBetsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[95vw] max-w-7xl h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-bold">My Bets</h2>
              <button
                onClick={() => setShowMyBetsModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
            
            {downlinesBets?.success && downlinesBets?.bets?.length > 0 ? (
              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-center p-3 bg-gray-50 text-sm">
                  <span className="text-gray-600">Total Bets: {downlinesBets.totalBets}</span>
                  <span className="text-gray-600">Users: {downlinesBets.downlineUserCount}</span>
                </div>
                
                <div className="flex border-b">
                  <button 
                    onClick={() => setActiveBetTab('matched')}
                    className={`px-4 py-2 font-medium ${
                      activeBetTab === 'matched' 
                        ? 'text-blue-600 border-b-2 border-blue-600' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Matched ({matchedBets.length})
                  </button>
                  <button 
                    onClick={() => setActiveBetTab('unmatched')}
                    className={`px-4 py-2 font-medium ${
                      activeBetTab === 'unmatched' 
                        ? 'text-blue-600 border-b-2 border-blue-600' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Unmatched ({unmatchedBets.length})
                  </button>
                  <button 
                    onClick={() => setActiveBetTab('settled')}
                    className={`px-4 py-2 font-medium ${
                      activeBetTab === 'settled' 
                        ? 'text-blue-600 border-b-2 border-blue-600' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Settled ({settledBets.length})
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="text-left p-2 text-xs font-medium text-gray-600">Bet Name</th>
                        <th className="text-left p-2 text-xs font-medium text-gray-600">Market</th>
                        <th className="text-left p-2 text-xs font-medium text-gray-600">Status</th>
                        <th className="text-right p-2 text-xs font-medium text-gray-600">Amount</th>
                        <th className="text-right p-2 text-xs font-medium text-gray-600">Profit</th>
                        <th className="text-right p-2 text-xs font-medium text-gray-600">Loss</th>
                        <th className="text-left p-2 text-xs font-medium text-gray-600">Created</th>
                        <th className="text-center p-2 text-xs font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(activeBetTab === 'matched' ? matchedBets : 
                        activeBetTab === 'unmatched' ? unmatchedBets : 
                        settledBets).map((bet: any) => (
                        <tr key={bet.betId} className="border-b hover:bg-gray-50">
                          <td className="p-2">
                            <div className="font-medium text-sm text-gray-800">{bet.rname}</div>
                            <div className="text-xs text-gray-500">{bet.eventName}</div>
                          </td>
                          <td className="p-2 text-sm text-gray-600">{bet.market}</td>
                          <td className="p-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              bet.betStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              bet.betStatus === 'won' ? 'bg-green-100 text-green-800' :
                              bet.betStatus === 'lost' ? 'bg-red-100 text-red-800' :
                              bet.betStatus === 'settled' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {bet.betStatus}
                            </span>
                          </td>
                          <td className="p-2 text-right font-medium text-sm">₹{bet.betAmount}</td>
                          <td className="p-2 text-right font-medium text-sm text-green-600">₹{bet.betProfit}</td>
                          <td className="p-2 text-right font-medium text-sm text-red-600">₹{bet.betLoss}</td>
                          <td className="p-2 text-xs text-gray-500">
                            {new Date(bet.createdAt).toLocaleString()}
                          </td>
                          <td className="p-2 text-center">
                            <div className="flex gap-1 justify-center">
                              {activeBetTab === 'matched' && (
                                <>
                                  <button
                                    onClick={() => handleProceedBet(bet.betId)}
                                    className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                                    title="Proceed Bet"
                                  >
                                    ✓
                                  </button>
                                  <button
                                    onClick={() => handleDeleteBet(bet.betId)}
                                    className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                                    title="Delete Bet"
                                  >
                                    ✕
                                  </button>
                                </>
                              )}
                              {activeBetTab === 'settled' && (
                                <button
                                  onClick={() => handleRevertBet(bet.betId)}
                                  className="px-2 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600"
                                  title="Revert Bet"
                                >
                                  ↶
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                No data found
              </div>
            )}
          </div>
        </div>
      )} */}

      {/* View More Modal */}
      {/* {showViewMoreModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">View More</h2>
              <button
                onClick={() => setShowViewMoreModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
            <div className="mb-4">
              <div className="flex border-b">
                <button className="px-4 py-2 text-blue-600 border-b-2 border-blue-600 font-medium">
                  Matched Bets
                </button>
                <button className="px-4 py-2 text-gray-500 hover:text-gray-700">
                  Deleted Bets
                </button>
              </div>
            </div>
            <div className="text-center text-gray-500 py-8">
              No records found
            </div>
          </div>
        </div>
      )} */}

      {/* Bet Details Modal */}
      {showBetDetailsModal && betDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Bet Details</h2>
                  <p className="text-blue-100 text-sm mt-1">Complete bet information and user details</p>
                </div>
                <button
                  onClick={() => setShowBetDetailsModal(false)}
                  className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Bet Information */}
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Bet Information</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <span className="text-gray-600 font-medium">Event ID</span>
                    <span className="font-medium text-gray-800">{betDetails.eventId}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <span className="text-gray-600 font-medium">Status</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      betDetails.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                      betDetails.status === 'won' ? 'bg-emerald-100 text-emerald-800' :
                      betDetails.status === 'lost' ? 'bg-red-100 text-red-800' :
                      betDetails.status === 'settled' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {betDetails.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <span className="text-gray-600 font-medium">Bet Amount</span>
                    <span className="font-bold text-lg text-gray-800">₹{betDetails.betAmount}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <span className="text-gray-600 font-medium">Bet Rate</span>
                    <span className="font-semibold text-gray-800">{betDetails.betRate}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <span className="text-gray-600 font-medium">Potential Profit</span>
                    <span className="font-bold text-lg text-emerald-600">₹{betDetails.betProfit}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <span className="text-gray-600 font-medium">Potential Loss</span>
                    <span className="font-bold text-lg text-red-600">₹{betDetails.betLoss}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <span className="text-gray-600 font-medium">Created</span>
                    <span className="text-sm text-gray-700">{new Date(betDetails.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 font-medium">Updated</span>
                    <span className="text-sm text-gray-700">{new Date(betDetails.updatedAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* User Information */}
              <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl p-6 border border-emerald-100 shadow-sm">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">User Information</h3>
                </div>
                {betDetails.userDetails && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <span className="text-gray-600 font-medium">Name</span>
                      <span className="font-semibold text-gray-800">{betDetails.userDetails.userName}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <span className="text-gray-600 font-medium">Login ID</span>
                      <span className="font-medium text-gray-800">{betDetails.userDetails.loginId}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <span className="text-gray-600 font-medium">Mobile</span>
                      <span className="font-medium text-gray-800">{betDetails.userDetails.mobile}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <span className="text-gray-600 font-medium">Balance</span>
                      <span className="font-bold text-lg text-emerald-600">₹{betDetails.userDetails.balance}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <span className="text-gray-600 font-medium">Exposure</span>
                      <span className="font-bold text-lg text-orange-600">₹{betDetails.userDetails.exposure}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 font-medium">Status</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        betDetails.userDetails.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {betDetails.userDetails.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                  </div>
                )}
                </div>
              </div>

              {/* Bet Result Section */}
              {betDetails.status === 'pending' && (
                <div className="mt-8 bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 border border-blue-100 shadow-sm">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">Declare Bet Result</h3>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Result Type Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Select Result</label>
                      <div className="flex gap-4">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="result"
                            value="win"
                            checked={selectedResult === 'win'}
                            onChange={(e) => setSelectedResult(e.target.value as 'win')}
                            className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500"
                          />
                          <span className="ml-2 text-sm font-medium text-gray-700 flex items-center">
                            <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                            Win
                          </span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="result"
                            value="loss"
                            checked={selectedResult === 'loss'}
                            onChange={(e) => setSelectedResult(e.target.value as 'loss')}
                            className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 focus:ring-red-500"
                          />
                          <span className="ml-2 text-sm font-medium text-gray-700 flex items-center">
                            <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                            Loss
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Result Value Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Result Value <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={resultValue}
                        onChange={(e) => setResultValue(e.target.value)}
                        placeholder="Enter result value (e.g., Team A, Yes, 150, etc.)"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter the actual result that occurred for this bet
                      </p>
                    </div>

                    {/* Preview */}
                    {selectedResult && resultValue && (
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Result Preview:</h4>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            selectedResult === 'win' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {selectedResult.toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-600">-</span>
                          <span className="text-sm font-medium text-gray-800">{resultValue}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowBetDetailsModal(false);
                    setSelectedResult(null);
                    setResultValue('');
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Close
                </button>
                {betDetails.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleProceedBet(betDetails.betId)}
                      disabled={!selectedResult || !resultValue.trim() || isProcessingBet}
                      className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      {isProcessingBet ? "Processing..." : "Proceed Bet"}
                    </button>
                    <button
                      onClick={() => handleDeleteBet(betDetails.betId)}
                      className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      Delete Bet
                    </button>
                  </>
                )}
                {betDetails.status === 'settled' && (
                  <button
                    onClick={() => handleReopenBet(betDetails.betId)}
                    disabled={isProcessingBet}
                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    {isProcessingBet ? "Processing..." : "Reopen Bet"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Football;