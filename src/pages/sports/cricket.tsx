import React, { useState, useRef, useEffect, useMemo } from "react";
import { FaTimes } from "react-icons/fa";
import { useCookies } from "react-cookie";
import { baseUrl, SERVER_URL } from "@/helper/auth";
import toast from "react-hot-toast";
import ViewMore from "./modal/ViewMore";
import UserBook from "./modal/UserBook";

interface CricketProps {
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

const Cricket: React.FC<CricketProps> = ({
  matchOdds,
  competition,
  date,
  match,
  market,
  eventId,
  sportId,
  downlinesBets,
}) => {
  const [showMatchOdds, setShowMatchOdds] = useState<boolean>(true);
  const [showBookmaker, setShowBookmaker] = useState<boolean>(true);
  const [showNormalFancy, setShowNormalFancy] = useState<boolean>(true);
  const [showOverByOver, setShowOverByOver] = useState<boolean>(true);
  const [showBookSummary, setShowBookSummary] = useState<boolean>(true);
  const [showScoreCard, setShowScoreCard] = useState<boolean>(false);
  const [showMyBets, setShowMyBets] = useState<boolean>(false);
  const [activeBetTab, setActiveBetTab] = useState<
    "matched" | "settled" | "unmatched"
  >("matched");
  const [showOddEven, setShowOddEven] = useState<boolean>(true);
  const [showTournamentWinner, setShowTournamentWinner] =
    useState<boolean>(true);
  const [showTiedMatch, setShowTiedMatch] = useState<boolean>(true);
  const [showFancy1, setShowFancy1] = useState<boolean>(true);
  const [showLiveMatch, setShowLiveMatch] = useState<boolean>(false);
  const [showUserBookModal, setShowUserBookModal] = useState<boolean>(false);
  const [showBetLockModal, setShowBetLockModal] = useState<boolean>(false);
  const [showViewMoreModal, setShowViewMoreModal] = useState<boolean>(false);
  const [showMyBetsModal, setShowMyBetsModal] = useState<boolean>(false);
  const [showBetDetailsModal, setShowBetDetailsModal] =
    useState<boolean>(false);
  const [betDetails, setBetDetails] = useState<any>(null);
  const [loadingBetDetails, setLoadingBetDetails] = useState<boolean>(false);
  const [selectedResult, setSelectedResult] = useState<"win" | "loss" | null>(
    null
  );
  const [resultValue, setResultValue] = useState<string>("");
  const [isProcessingBet, setIsProcessingBet] = useState<boolean>(false);
  const [viewMoreData, setViewMoreData] = useState<any>(null);
  const [loadingViewMore, setLoadingViewMore] = useState<boolean>(false);
  const normalizedMatchOdds = matchOdds?.data?.data?.matchOdds || [];
  const normalizedBookMakerOdds = matchOdds?.data?.data?.bookMakerOdds || [];
  const normalizedOtherMarketOdds =
    matchOdds?.data?.data?.otherMarketOdds || [];
  const fancyOdds = matchOdds?.data?.data?.fancyOdds || [];

  // Get authentication token from cookies
  const [cookies] = useCookies([
    baseUrl.includes("techadmin") ? "TechAdmin" : "Admin",
  ]);
  const authToken =
    cookies[baseUrl.includes("techadmin") ? "TechAdmin" : "Admin"];

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
      const response = await fetch(
        `https://api.2xbat.com/api/v1/sports/bet/${betId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${authToken}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: selectedResult === "win" ? "won" : "lost",
            result: {
              winner: resultValue,
              score: "", // You can add score input if needed
              outcome: `${resultValue} ${selectedResult === "win" ? "wins" : "loses"}`,
            },
            betData: {
              profit: selectedResult === "win" ? betDetails.betProfit : 0,
              stake: betDetails.betAmount,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to proceed bet: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        toast.success(
          `Bet ${selectedResult === "win" ? "won" : "lost"} successfully!`
        );
        setShowBetDetailsModal(false);
        setSelectedResult(null);
        setResultValue("");
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
      const response = await fetch(
        `https://api.2xbat.com/api/v1/sports/bets/reopen/${betId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${authToken}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

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

  // Fetch view more bets data
  const fetchViewMoreBets = async () => {
    if (!authToken || !eventId) {
      console.error("No auth token or eventId available");
      toast.error("Unable to fetch view more data");
      return;
    }

    setLoadingViewMore(true);
    try {
      const response = await fetch(
        `${SERVER_URL}/api/v1/sports/user-event-bets/${eventId}/view-more`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch view more data: ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log(data,'data before modal');
      if (data.success) {
        setViewMoreData(data);
        setShowMyBetsModal(true);
      } else {
        toast.error(data.message || "Failed to fetch view more data");
        console.error("Failed to fetch view more data:", data.message);
      }
    } catch (error) {
      console.error("Error fetching view more data:", error);
      toast.error("Error fetching view more data. Please try again.");
    } finally {
      setLoadingViewMore(false);
    }
  };

  // Filter bets based on status
  const matchedBets =
    downlinesBets?.bets?.filter((bet: any) => bet.betStatus === "pending") ||
    [];
  const settledBets =
    downlinesBets?.bets?.filter((bet: any) =>
      ["won", "lost", "settled"].includes(bet.betStatus)
    ) || [];

  const cricketMatchOddsRender = () => {
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
                <div className="font-bold text-lg py-1 flex items-center px-2 bg-[var(--bg-secondary70)] gap-2 justify-between">
                  <h2
                    onClick={() => setShowMatchOdds(!showMatchOdds)}
                    className="text-sm font-normal hover:cursor-pointer text-white/90 leading-6 tracking-tight"
                  >
                    Match Odds
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowBetLockModal(true)}
                      className="text-xs px-2 hover:cursor-pointer font-semibold leading-6 tracking-tight bg-[var(--bg-secondary)] text-white/90"
                    >
                      BET LOCK
                    </button>
                    <button
                      onClick={() => setShowUserBookModal(true)}
                      className="text-xs px-2 hover:cursor-pointer font-semibold leading-6 tracking-tight bg-[var(--bg-secondary)] text-white/90"
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
                        <td className="text-xs font-bold text-[var(--bg-primary90)] pl-2 md:w-72">
                          {/* Min: {data?.min || 0} Max: {data?.max || 0} */}
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
                      {matchOdd?.oddDatas?.map((teamData: any, idx: number) => {
                        const teamName = teamData.rname || `Team ${idx + 1}`;
                        const isLocked = isStatusLocked(
                          teamData?.status || matchOdd?.status || ""
                        );

                        return (
                          <tr
                            key={`tournament-team-${idx}-${teamData.sid || idx}`}
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
                                      onClick={() =>
                                        !isLocked &&
                                        item.value &&
                                        item.value !== "0.0" &&
                                        console.log(
                                          "Bet clicked:",
                                          teamData,
                                          item.type,
                                          item.value
                                        )
                                      }
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

        {/* Bookmaker */}
        {normalizedBookMakerOdds?.length > 0 &&
          (() => {
            const bookmakerItem = normalizedBookMakerOdds[0];
            const bookmakerMarkets = [];

            for (const key in bookmakerItem) {
              if (key.startsWith("bm") && bookmakerItem[key]) {
                bookmakerMarkets.push(bookmakerItem[key]);
              }
            }

            return (
              <div className="flex flex-col">
                <div
                 
                  className="font-bold text-lg py-1 flex items-center px-2 bg-[var(--bg-secondary70)] gap-2 justify-between "
                >
                  <h2
                   onClick={() => setShowBookmaker(!showBookmaker)}
                  className="text-sm font-normal hover:cursor-pointer text-white/90 leading-6 tracking-tight">
                    Bookmaker
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowBetLockModal(true)}
                      className="text-xs px-2 hover:cursor-pointer font-semibold leading-6 tracking-tight bg-[var(--bg-secondary)] text-white/90"
                    >
                      BET LOCK
                    </button>
                    <button
                      onClick={() => setShowUserBookModal(true)}
                      className="text-xs px-2 hover:cursor-pointer font-semibold leading-6 tracking-tight bg-[var(--bg-secondary)] text-white/90"
                    >
                      USER BOOK
                    </button>
                  </div>
                </div>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    showBookmaker
                      ? "max-h-[1000px] opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  {bookmakerMarkets.map((market, index) => (
                    <div key={`bookmaker-${index}`} className="flex flex-col">
                      <table className="w-full">
                        <thead>
                          <tr>
                            <td className="text-xs font-bold text-[var(--bg-primary90)] pl-2 md:w-72">
                              Bookmaker {index + 1}
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
                          {market.oddDatas?.map(
                            (teamData: any, idx: number) => {
                              const teamName =
                                teamData.rname || `Team ${idx + 1}`;
                              const isLocked = isStatusLocked(
                                teamData?.status || market?.status || ""
                              );

                              return (
                                <tr
                                  key={`bookmaker-team-${idx}-${teamData.sid || idx}`}
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
                                            market?.status ||
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
                                            onClick={() =>
                                              !isLocked &&
                                              item.value &&
                                              item.value !== "0.0" &&
                                              console.log(
                                                "Bet clicked:",
                                                teamData,
                                                item.type,
                                                item.value
                                              )
                                            }
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              );
                            }
                          )}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

        {/* Fancy Odds */}
        {fancyOdds?.length > 0 &&
          (() => {
            const normal = fancyOdds.find(
              (item: any) => item.market == "Normal"
            );
            const overbyover = fancyOdds.filter(
              (item: any) =>
                item.market === "Over By Over" || item.market === "Ball By Ball"
            );
            const fancy1 = fancyOdds.find(
              (item: any) => item.market === "fancy1"
            );
            const oddEven = fancyOdds.find(
              (item: any) => item.market === "oddeven"
            );

            return (
              <div className="grid grid-cols-2 gap-1">
                {normal && (
                  <div key={normal.mid} className="flex flex-col">
                    <div
                      
                      className="font-bold text-lg py-1 flex items-center px-2 bg-[var(--bg-secondary70)] gap-2 justify-between cursor-pointer"
                    >
                      <h2
                       onClick={() => setShowNormalFancy(!showNormalFancy)}
                      className="text-sm font-normal hover:cursor-pointer text-white/90 leading-6 tracking-tight">
                        Normal Fancy
                      </h2>
                      <div className="flex items-center gap-2">
                        <button className="text-xs px-2 hover:cursor-pointer font-semibold leading-6 tracking-tight bg-[var(--bg-secondary)] text-white/90">
                          BET LOCK
                        </button>
                        <button className="text-xs px-2 hover:cursor-pointer font-semibold leading-6 tracking-tight bg-[var(--bg-secondary)] text-white/90">
                          USER BOOK
                        </button>
                      </div>
                    </div>
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        showNormalFancy
                          ? "max-h-[1000px] opacity-100"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      <table className="w-full">
                        <thead>
                          <tr className="border-white/10 border-b">
                            <td className="text-xs font-bold text-[var(--bg-primary90)] pl-2"></td>
                            <td className="p-0 border-white/10 w-full">
                              <div className="flex justify-center">
                                <div className="text-center text-xs md:text-sm py-1 bg-[var(--lay)] font-semibold w-16 md:w-28">
                                  No
                                </div>
                                <div className="text-center flex justify-center items-center text-xs md:text-sm py-1 bg-[var(--back)] font-semibold w-16 md:w-28">
                                  Yes
                                </div>
                              </div>
                            </td>
                          </tr>
                        </thead>
                        <tbody className="border-[var(--border)]">
                          {normal.oddDatas?.map((item: any) => {
                            const isLocked = isStatusLocked(
                              item?.status || normal?.status || ""
                            );
                            return (
                              <tr
                                key={`fancy-row-${item?.sid}`}
                                className="border-white/10"
                              >
                                <td className="border-white/10 bg-gray-100 border-b  align-top">
                                  <div className="flex flex-col justify-start pt-1">
                                    <span className="truncate max-w-64 text-sm px-1 md:px-2">
                                      {item?.rname}
                                    </span>
                                  </div>
                                </td>
                                <td className="border-white/10 w-full">
                                  <div className="relative w-full">
                                    {/* Locked Status Overlay */}
                                    {isLocked &&
                                      renderLockedOverlay(
                                        item?.status ||
                                          normal?.status ||
                                          "LOCKED"
                                      )}
                                    <div className="flex justify-center w-full">
                                      <div className="w-16 md:w-28">
                                        <BlinkingOddsCell
                                          value={item?.l1}
                                          vol={item?.ls1}
                                          type="lay"
                                          index={0}
                                          isLocked={isLocked}
                                          onClick={() =>
                                            !isLocked &&
                                            item?.ls1 &&
                                            item?.ls1 !== "0.0" &&
                                            console.log(
                                              "Bet clicked:",
                                              item,
                                              "lay",
                                              item.ls1,
                                              item.l1
                                            )
                                          }
                                          width={true}
                                        />
                                      </div>
                                      <div className="w-16 md:w-28">
                                        <BlinkingOddsCell
                                          value={item?.b1}
                                          vol={item?.bs1}
                                          type="back"
                                          index={0}
                                          isLocked={isLocked}
                                          onClick={() =>
                                            !isLocked &&
                                            item?.bs1 &&
                                            item?.bs1 !== "0.0" &&
                                            console.log(
                                              "Bet clicked:",
                                              item,
                                              "back",
                                              item.bs1,
                                              item.b1
                                            )
                                          }
                                          width={true}
                                        />
                                      </div>
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
                )}

                {fancy1 && (
                  <div className="flex flex-col">
                    <div
                     
                      className="font-bold text-lg py-1 flex items-center px-2 bg-[var(--bg-secondary70)] gap-2 justify-between cursor-pointer"
                    >
                      <h2
                       onClick={() => setShowFancy1(!showFancy1)}
                      className="text-sm font-normal hover:cursor-pointer text-white/90 leading-6 tracking-tight">
                        Fancy 1
                      </h2>
                      <div className="flex items-center gap-2">
                        <button className="text-xs px-2 hover:cursor-pointer font-semibold leading-6 tracking-tight bg-[var(--bg-secondary)] text-white/90">
                          BET LOCK
                        </button>
                        <button className="text-xs px-2 hover:cursor-pointer font-semibold leading-6 tracking-tight bg-[var(--bg-secondary)] text-white/90">
                          USER BOOK
                        </button>
                      </div>
                    </div>
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        showFancy1
                          ? "max-h-[1000px] opacity-100"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      <table className="w-full">
                        <thead>
                          <tr className="border-white/10 border-b">
                            <td className="text-xs font-bold text-[var(--bg-primary90)] pl-2 md:w-72 w-1/2"></td>
                            <td className="p-0 border-white/10 w-full">
                              <div className="flex justify-end">
                                <div className="text-center text-xs md:text-sm py-1 bg-[var(--lay)] font-semibold w-16 md:w-28">
                                  No
                                </div>
                                <div className="text-center flex justify-center items-center text-xs md:text-sm py-1 bg-[var(--back)] font-semibold w-16 md:w-28">
                                  Yes
                                </div>
                              </div>
                            </td>
                          </tr>
                        </thead>
                        <tbody className="border-[var(--border)]">
                          {fancy1.oddDatas?.map((item: any) => {
                            const isLocked = isStatusLocked(
                              item?.status || fancy1?.status || ""
                            );
                            return (
                              <tr
                                key={`fancy1-row-${item?.sid}`}
                                className="border-white/10"
                              >
                                <td className="border-white/10 bg-gray-100 border-b md:w-72 w-1/2 align-top">
                                  <div className="flex flex-col justify-start pt-1">
                                    <span className="truncate max-w-64  text-xs md:text-sm font-normal whitespace-nowrap px-1 md:px-2">
                                      {item?.rname}
                                    </span>
                                  </div>
                                </td>
                                <td className="border-white/10 w-full">
                                  <div className="relative w-full">
                                    {/* Locked Status Overlay */}
                                    {isLocked &&
                                      renderLockedOverlay(
                                        item?.status ||
                                          fancy1?.status ||
                                          "LOCKED"
                                      )}
                                    <div className="flex justify-center w-full">
                                      <div className="w-16 md:w-28">
                                        <BlinkingOddsCell
                                          value={item?.l1}
                                          vol={item?.ls1}
                                          type="lay"
                                          index={0}
                                          isLocked={isLocked}
                                          onClick={() =>
                                            !isLocked &&
                                            item?.ls1 &&
                                            item?.ls1 !== "0.0" &&
                                            console.log(
                                              "Bet clicked:",
                                              item,
                                              "lay",
                                              item.ls1,
                                              item.l1
                                            )
                                          }
                                          width={true}
                                        />
                                      </div>
                                      <div className="w-16 md:w-28">
                                        <BlinkingOddsCell
                                          value={item?.b1}
                                          vol={item?.bs1}
                                          type="back"
                                          index={0}
                                          isLocked={isLocked}
                                          onClick={() =>
                                            !isLocked &&
                                            item?.bs1 &&
                                            item?.bs1 !== "0.0" &&
                                            console.log(
                                              "Bet clicked:",
                                              item,
                                              "back",
                                              item.bs1,
                                              item.b1
                                            )
                                          }
                                          width={true}
                                        />
                                      </div>
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
                )}

                {Array.isArray(overbyover) && overbyover.length > 0 && (
                  <div className="flex flex-col">
                    <div

                      className="font-bold text-lg py-1 flex items-center px-2 bg-[var(--bg-secondary70)] gap-2 justify-between cursor-pointer"
                    >
                      <h2
                       onClick={() => setShowOverByOver(!showOverByOver)}
                      className="text-sm font-normal hover:cursor-pointer text-white/90 leading-6 tracking-tight">
                        Over By Over
                      </h2>
                      <div className="flex items-center gap-2">
                        <button className="text-xs px-2 hover:cursor-pointer font-semibold leading-6 tracking-tight bg-[var(--bg-secondary)] text-white/90">
                          BET LOCK
                        </button>
                        <button className="text-xs px-2 hover:cursor-pointer font-semibold leading-6 tracking-tight bg-[var(--bg-secondary)] text-white/90">
                          USER BOOK
                        </button>
                      </div>
                    </div>
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        showOverByOver
                          ? "max-h-[1000px] opacity-100"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      {overbyover.map((item: any, index: number) => (
                        <div key={index} className="mb-4">
                          {/* <h4 className="font-medium text-sm px-2 py-1 bg-gray-100">
                            {item.market}
                          </h4> */}
                          <table className="w-full">
                            <thead>
                              <tr className="border-white/10 border-b">
                                <td className="text-xs font-bold text-[var(--bg-primary90)] pl-2 md:w-72 w-1/2"></td>
                                <td className="p-0 border-white/10 w-full">
                                  <div className="flex justify-end">
                                    <div className="text-center text-xs md:text-sm py-1 bg-[var(--lay)] font-semibold w-16 md:w-28">
                                      No
                                    </div>
                                    <div className="text-center flex justify-center items-center text-xs md:text-sm py-1 bg-[var(--back)] font-semibold w-16 md:w-28">
                                      Yes
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            </thead>
                            <tbody className="border-[var(--border)]">
                              {item.oddDatas?.map((oddItem: any) => {
                                const isLocked = isStatusLocked(
                                  oddItem?.status || item?.status || ""
                                );
                                return (
                                  <tr
                                    key={`overbyover-row-${oddItem?.sid}`}
                                    className="border-white/10"
                                  >
                                    <td className="border-white/10 bg-gray-100 border-b w-full align-top">
                                      <div className="flex flex-col justify-start pt-1">
                                        <span className="truncate text-xs md:text-sm font-normal whitespace-nowrap px-1 md:px-2">
                                          {oddItem?.rname}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="border-white/10 w-full">
                                      <div className="relative w-full">
                                        {/* Locked Status Overlay */}
                                        {isLocked &&
                                          renderLockedOverlay(
                                            oddItem?.status ||
                                              item?.status ||
                                              "LOCKED"
                                          )}
                                        <div className="flex justify-center w-full">
                                          <div className="w-16 md:w-28">
                                            <BlinkingOddsCell
                                              value={oddItem?.l1}
                                              vol={oddItem?.ls1}
                                              type="lay"
                                              index={0}
                                              isLocked={isLocked}
                                              onClick={() =>
                                                !isLocked &&
                                                oddItem?.ls1 &&
                                                oddItem?.ls1 !== "0.0" &&
                                                console.log(
                                                  "Bet clicked:",
                                                  oddItem,
                                                  "lay",
                                                  oddItem.ls1,
                                                  oddItem.l1
                                                )
                                              }
                                              width={true}
                                            />
                                          </div>
                                          <div className="w-16 md:w-28">
                                            <BlinkingOddsCell
                                              value={oddItem?.b1}
                                              vol={oddItem?.bs1}
                                              type="back"
                                              index={0}
                                              isLocked={isLocked}
                                              onClick={() =>
                                                !isLocked &&
                                                oddItem?.bs1 &&
                                                oddItem?.bs1 !== "0.0" &&
                                                console.log(
                                                  "Bet clicked:",
                                                  oddItem,
                                                  "back",
                                                  oddItem.bs1,
                                                  oddItem.b1
                                                )
                                              }
                                              width={true}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {oddEven && (
                  <div className="flex flex-col">
                    <div

                      className="font-bold text-lg py-1 flex items-center px-2 bg-[var(--bg-secondary70)] gap-2 justify-between cursor-pointer"
                    >
                      <h2
                       onClick={() => setShowOddEven(!showOddEven)}
                      className="text-sm font-normal hover:cursor-pointer text-white/90 leading-6 tracking-tight">
                        Odd Even
                      </h2>
                      <div className="flex items-center gap-2">
                        <button className="text-xs px-2 hover:cursor-pointer font-semibold leading-6 tracking-tight bg-[var(--bg-secondary)] text-white/90">
                          BET LOCK
                        </button>
                        <button className="text-xs px-2 hover:cursor-pointer font-semibold leading-6 tracking-tight bg-[var(--bg-secondary)] text-white/90">
                          USER BOOK
                        </button>
                      </div>
                    </div>
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        showOddEven
                          ? "max-h-[1000px] opacity-100"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      <table className="w-full">
                        <thead>
                          <tr className="border-white/10 border-b">
                            <td className="text-xs font-bold text-[var(--bg-primary90)] pl-2"></td>
                            <td className="p-0 border-white/10 w-full">
                              <div className="flex justify-end">
                                <div className="text-center text-xs md:text-sm py-1 bg-[var(--lay)] font-semibold w-16 md:w-28">
                                  No
                                </div>
                                <div className="text-center flex justify-center items-center text-xs md:text-sm py-1 bg-[var(--back)] font-semibold w-16 md:w-28">
                                  Yes
                                </div>
                              </div>
                            </td>
                          </tr>
                        </thead>
                        <tbody className="border-[var(--border)]">
                          {oddEven.oddDatas?.map((item: any) => {
                            const isLocked = isStatusLocked(
                              item?.status || oddEven?.status || ""
                            );
                            return (
                              <tr
                                key={`oddeven-row-${item?.sid}`}
                                className="border-white/10"
                              >
                                <td className="border-white/10 bg-gray-100 border-b w-full align-top">
                                  <div className="flex flex-col justify-start pt-1 w-full">
                                    <span className="truncate max-w-64 text-sm px-1 md:px-2">
                                      {item?.rname}
                                    </span>
                                  </div>
                                </td>
                                <td className="border-white/10 w-full">
                                  <div className="relative w-full">
                                    {/* Locked Status Overlay */}
                                    {isLocked &&
                                      renderLockedOverlay(
                                        item?.status ||
                                          oddEven?.status ||
                                          "LOCKED"
                                      )}
                                    <div className="flex justify-center w-full">
                                      <div className="w-16 md:w-28">
                                        <BlinkingOddsCell
                                          value={item?.l1}
                                          vol={item?.ls1}
                                          type="lay"
                                          index={0}
                                          isLocked={isLocked}
                                          onClick={() =>
                                            !isLocked &&
                                            item?.ls1 &&
                                            item?.ls1 !== "0.0" &&
                                            console.log(
                                              "Bet clicked:",
                                              item,
                                              "lay",
                                              item.ls1,
                                              item.l1
                                            )
                                          }
                                          width={true}
                                        />
                                      </div>
                                      <div className="w-16 md:w-28">
                                        <BlinkingOddsCell
                                          value={item?.b1}
                                          vol={item?.bs1}
                                          type="back"
                                          index={0}
                                          isLocked={isLocked}
                                          onClick={() =>
                                            !isLocked &&
                                            item?.bs1 &&
                                            item?.bs1 !== "0.0" &&
                                            console.log(
                                              "Bet clicked:",
                                              item,
                                              "back",
                                              item.bs1,
                                              item.b1
                                            )
                                          }
                                          width={true}
                                        />
                                      </div>
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
                )}
              </div>
            );
          })()}
        {/* Other Market Odds */}
        {normalizedOtherMarketOdds?.length > 0 &&
          (() => {
            const tournamentWinner = normalizedOtherMarketOdds.find(
              (item: any) => item.market === "TOURNAMENT_WINNER"
            );
            const tiedMatchOdd = normalizedOtherMarketOdds.find(
              (item: any) => item.market == "TIED_MATCH"
            );

            return (
              <>
                {tournamentWinner && (
                  <div key={tournamentWinner.mid} className="flex flex-col">
                    <div
                      
                      className="font-bold text-lg py-1 flex items-center px-2 bg-[var(--bg-secondary70)] gap-2 justify-between cursor-pointer"
                    >
                      <h2
                       onClick={() => setShowTournamentWinner(!showTournamentWinner)}
                      className="text-sm font-normal hover:cursor-pointer text-white/90 leading-6 tracking-tight">
                        Tournament Winner
                      </h2>
                      <div className="flex items-center gap-2">
                        <button className="text-xs px-2 hover:cursor-pointer font-semibold leading-6 tracking-tight bg-[var(--bg-secondary)] text-white/90">
                          BET LOCK
                        </button>
                        <button className="text-xs px-2 hover:cursor-pointer font-semibold leading-6 tracking-tight bg-[var(--bg-secondary)] text-white/90">
                          USER BOOK
                        </button>
                      </div>
                    </div>
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        showTournamentWinner
                          ? "max-h-[1000px] opacity-100"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      <table className="w-full">
                        <thead>
                          <tr>
                            <td className="text-xs font-bold text-[var(--bg-primary90)] pl-2 md:w-72">
                              {/* Min: {tournamentWinner?.min || 0} Max: {tournamentWinner?.max || 0} */}
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
                          {tournamentWinner.oddDatas?.map(
                            (teamData: any, idx: number) => {
                              const teamName =
                                teamData.rname || `Team ${idx + 1}`;
                              const isLocked = isStatusLocked(
                                teamData?.status ||
                                  tournamentWinner?.status ||
                                  ""
                              );

                              return (
                                <tr
                                  key={`tournament-team-${idx}-${teamData.sid || idx}`}
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
                                            tournamentWinner?.status ||
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
                                            onClick={() =>
                                              !isLocked &&
                                              item.value &&
                                              item.value !== "0.0" &&
                                              console.log(
                                                "Bet clicked:",
                                                teamData,
                                                item.type,
                                                item.value
                                              )
                                            }
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              );
                            }
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {tiedMatchOdd && (
                  <div key={tiedMatchOdd.mid} className="flex flex-col">
                    <div

                      className="font-bold text-lg py-1 flex items-center px-2 bg-[var(--bg-secondary70)] gap-2 justify-between cursor-pointer"
                    >
                      <h2
                       onClick={() => setShowTiedMatch(!showTiedMatch)}
                      className="text-sm font-normal hover:cursor-pointer text-white/90 leading-6 tracking-tight">
                        Tied Match
                      </h2>
                      <div className="flex items-center gap-2">
                        <button className="text-xs px-2 hover:cursor-pointer font-semibold leading-6 tracking-tight bg-[var(--bg-secondary)] text-white/90">
                          BET LOCK
                        </button>
                        <button className="text-xs px-2 hover:cursor-pointer font-semibold leading-6 tracking-tight bg-[var(--bg-secondary)] text-white/90">
                          USER BOOK
                        </button>
                      </div>
                    </div>
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        showTiedMatch
                          ? "max-h-[1000px] opacity-100"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      <table className="w-full">
                        <thead>
                          <tr>
                            <td className="text-xs font-bold text-[var(--bg-primary90)] pl-2 md:w-72">
                              {/* Min: {tiedMatchOdd?.min || 0} Max: {tiedMatchOdd?.max || 0} */}
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
                          {tiedMatchOdd.oddDatas?.map(
                            (teamData: any, idx: number) => {
                              const teamName =
                                teamData.rname || `Team ${idx + 1}`;
                              const isLocked = isStatusLocked(
                                teamData?.status || tiedMatchOdd?.status || ""
                              );

                              return (
                                <tr
                                  key={`tied-team-${idx}-${teamData.sid || idx}`}
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
                                            tiedMatchOdd?.status ||
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
                                            onClick={() =>
                                              !isLocked &&
                                              item.value &&
                                              item.value !== "0.0" &&
                                              console.log(
                                                "Bet clicked:",
                                                teamData,
                                                item.type,
                                                item.value
                                              )
                                            }
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              );
                            }
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
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
        <div className="space-y-4">{cricketMatchOddsRender()}</div>
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
            <table className="w-full">
              <thead>
                <tr>
                  <td className="text-xs font-bold text-[var(--bg-primary90)] pl-2"></td>
                </tr>
              </thead>
            </table>
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
            className={`bg-black/89 border-gray-200 ${showScoreCard ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"}`}
          >
            <iframe
              // src={`https://apis.professorji.in/api/scorecard?eventId=${eventId}&sport=${sportId == "4" ? "cricket" : sportId == "1" ? "soccer" : "tennis"}`}
              src={`https://bluebet9.com/public-iframe/scorecard?eventId=${eventId}&sportId=${sportId}`}
              className="w-full md:h-38 h-44 border-0"
              title="Scoreboard"
              loading="lazy"
            />
          </div>
        </div>
        {(normalizedMatchOdds?.some(
          (market: any) => market?.isPlay === "true"
        ) ||
          normalizedBookMakerOdds?.some(
            (market: any) => market?.isPlay === "true"
          ) ||
          normalizedOtherMarketOdds?.some(
            (market: any) => market?.isPlay === "true"
          ) ||
          fancyOdds?.some((market: any) => market?.isPlay === "true")) && (
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
                // src={`https://apis.professorji.in/api/tv?eventId=${eventId}&sport=${sportId == "4" ? "cricket" : sportId == "1" ? "soccer" : "tennis"}`}
                src={`https://bluebet9.com/public-iframe/sport-tv?eventId=${eventId}&sportId=${sportId}`}
                className="w-full md:h-68 h-44"
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
              onClick={fetchViewMoreBets}
              disabled={loadingViewMore}
              className="bg-[var(--bg-secondary)] text-white/90 leading-6 tracking-tight text-sm px-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingViewMore ? "Loading..." : "View More"}
            </button>
          </div>
          <div
            className={`bg-gray-100 border-gray-200 max-h-[60vh] overflow-y-auto `}
          >
            {downlinesBets?.success && downlinesBets?.bets?.length > 0 ? (
              <div className="p-2">
                {/* Old Card-Based UI - Commented Out */}
                {/* <div className="flex justify-between items-center mb-2 text-xs">
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
                <div className="space-y-3 min-h-60 overflow-y-auto">
                  {(activeBetTab === 'matched' ? matchedBets : 
                    settledBets).map((bet: any, index: number) => (
                    <div key={bet.betId} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800 text-sm">{bet.rname}</div>
                          <div className="text-gray-500 text-xs mt-1">{bet.market}</div>
                        </div>
                        <div className="text-right">
                          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            bet.betStatus === 'pending' ? 'bg-amber-100 text-amber-800' :
                            bet.betStatus === 'won' ? 'bg-emerald-100 text-emerald-800' :
                            bet.betStatus === 'lost' ? 'bg-red-100 text-red-800' :
                            bet.betStatus === 'settled' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {bet.betStatus.toUpperCase()}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="text-center">
                          <div className="text-gray-500 text-xs">Amount</div>
                          <div className="font-bold text-sm text-gray-800">₹{bet.betAmount}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-500 text-xs">Profit</div>
                          <div className="font-bold text-sm text-emerald-600">₹{bet.betProfit}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-500 text-xs">Loss</div>
                          <div className="font-bold text-sm text-red-600">₹{bet.betLoss}</div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 mb-3 text-center">
                        {new Date(bet.createdAt).toLocaleString()}
                      </div>
                      <div className="flex gap-1 mt-3">
                        {activeBetTab === 'matched' && (
                          <>
                            <button
                              onClick={() => fetchBetDetails(bet.betId)}
                              disabled={loadingBetDetails}
                              className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-[10px] font-medium hover:from-green-600 hover:to-green-700 disabled:opacity-50 transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                              {loadingBetDetails ? "Loading..." : "Proceed"}
                            </button>
                            <button
                              onClick={() => handleDeleteBet(bet.betId)}
                              className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg text-[10px] font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-sm hover:shadow-md"
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
                              className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-[10px] font-medium hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                              {loadingBetDetails ? "Loading..." : "Details"}
                            </button>
                            <button
                              onClick={() => handleReopenBet(bet.betId)}
                              className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg text-[10px] font-medium hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                              Reopen
                            </button>
                          </>
                        )}
                      </div>
            </div>
        ))}
        </div>
      </div> */}

                {/* New Table-Based UI - Screenshot Style */}
                <div className="flex border-b mb-2">
                  <button
                    onClick={() => setActiveBetTab("matched")}
                    className={`px-3 py-2 font-medium text-xs ${
                      activeBetTab === "matched"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Matched Bets
                  </button>
                  <button
                    onClick={() => setActiveBetTab("unmatched")}
                    className={`px-3 py-2 font-medium text-xs ${
                      activeBetTab === "unmatched"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Unmatched Bets
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left p-2 font-medium text-gray-700">
                          UserName
                        </th>
                        <th className="text-left p-2 font-medium text-gray-700">
                          Nation
                        </th>
                        <th className="text-left p-2 font-medium text-gray-700">
                          Rate
                        </th>
                        <th className="text-left p-2 font-medium text-gray-700">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(activeBetTab === "matched"
                        ? matchedBets
                        : downlinesBets?.bets?.filter(
                            (bet: any) =>
                              bet.betStatus !== "pending" &&
                              !["won", "lost", "settled"].includes(
                                bet.betStatus
                              )
                          ) || []
                      ).map((bet: any, index: number) => {
                        // Determine background color based on bet type
                        const betType = bet.betData?.betType;
                        const isBackType = betType?.toLowerCase() === "back";
                        const bgColor = isBackType
                          ? "bg-[var(--bg-back)]/60"
                          : "bg-[var(--bg-lay)]/60";

                        return (
                          <React.Fragment key={bet.betId}>
                            {/* First Row - Normal and Timestamp */}
                            <tr className={bgColor}>
                              <td className="px-2 py-1 border-l-2 border-blue-500">
                                {bet?.market}
                              </td>
                              <td className="px-2"></td>
                              <td className="px-2 text-nowrap">
                                {new Date(bet.createdAt)
                                  .toLocaleString("en-GB", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                    hour12: false,
                                  })
                                  .replace(",", "")}
                              </td>
                              <td className="px-2"></td>
                            </tr>
                            {/* Second Row - Username, Bet Description, Rate, Amount */}
                            <tr className={bgColor}>
                              <td className="px-2 border-l-2 border-blue-500">
                                {bet.username || bet.userName}
                              </td>
                              <td className="px-2">
                                {bet.rname ? `${bet.rname}` : ""}
                              </td>
                              <td className="px-2 text-center">
                                {bet.betData?.odd || "-"}
                              </td>
                              <td className="px-2">{bet.betAmount}</td>
                            </tr>
                            {/* Spacer row for gap between entries */}
                            <tr>
                              <td colSpan={4} className="h-0.5"></td>
                            </tr>
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
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
      {/* User Book Modal */}
      <UserBook
        isOpen={showUserBookModal}
        onClose={() => setShowUserBookModal(false)}
        eventId={eventId}
        matchTeams={{
          team1: normalizedMatchOdds?.[0]?.oddDatas?.[0]?.rname || "Australia",
          team2: normalizedMatchOdds?.[0]?.oddDatas?.[1]?.rname || "England",
        }}
      />

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
      <ViewMore
        isOpen={showMyBetsModal}
        onClose={() => setShowMyBetsModal(false)}
        data={viewMoreData}
        eventId={eventId}
        onBetDetailClick={fetchBetDetails}
      />

      {/* Bet Details Modal */}
      {showBetDetailsModal && betDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-5xl max-h-[95vh] overflow-hidden animate-fadein">
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 bg-[var(--bg-primary)] text-white rounded-full w-8 h-8 cursor-pointer flex items-center justify-center text-md z-10"
              onClick={() => setShowBetDetailsModal(false)}
            >
              <FaTimes />
            </button>

            {/* Header */}
            <h2 className="text-xl p-4 font-normal mb-2">Bet Details</h2>

            <div className="px-8 py-4 pb-4 overflow-y-auto max-h-[calc(95vh-120px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Bet Information */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100 shadow-sm">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Bet Information
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <span className="text-gray-600 font-medium">
                        Event ID
                      </span>
                      <span className="font-medium text-gray-800">
                        {betDetails.eventId}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <span className="text-gray-600 font-medium">Status</span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          betDetails.status === "pending"
                            ? "bg-amber-100 text-amber-800"
                            : betDetails.status === "won"
                              ? "bg-emerald-100 text-emerald-800"
                              : betDetails.status === "lost"
                                ? "bg-red-100 text-red-800"
                                : betDetails.status === "settled"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {betDetails.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <span className="text-gray-600 font-medium">
                        Bet Amount
                      </span>
                      <span className="font-bold text-lg text-gray-800">
                        ₹{betDetails.betAmount}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <span className="text-gray-600 font-medium">
                        Bet Rate
                      </span>
                      <span className="font-semibold text-gray-800">
                        {betDetails.betRate}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <span className="text-gray-600 font-medium">
                        Potential Profit
                      </span>
                      <span className="font-bold text-lg text-emerald-600">
                        ₹{betDetails.betProfit}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <span className="text-gray-600 font-medium">
                        Potential Loss
                      </span>
                      <span className="font-bold text-lg text-red-600">
                        ₹{betDetails.betLoss}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <span className="text-gray-600 font-medium">Created</span>
                      <span className="text-sm text-gray-700">
                        {new Date(betDetails.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 font-medium">Updated</span>
                      <span className="text-sm text-gray-700">
                        {new Date(betDetails.updatedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* User Information */}
                <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl p-6 border border-emerald-100 shadow-sm">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                      <svg
                        className="w-5 h-5 text-emerald-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      User Information
                    </h3>
                  </div>
                  {betDetails.userDetails && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                        <span className="text-gray-600 font-medium">Name</span>
                        <span className="font-semibold text-gray-800">
                          {betDetails.userDetails.userName}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                        <span className="text-gray-600 font-medium">
                          Login ID
                        </span>
                        <span className="font-medium text-gray-800">
                          {betDetails.userDetails.loginId}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                        <span className="text-gray-600 font-medium">
                          Mobile
                        </span>
                        <span className="font-medium text-gray-800">
                          {betDetails.userDetails.mobile}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                        <span className="text-gray-600 font-medium">
                          Balance
                        </span>
                        <span className="font-bold text-lg text-emerald-600">
                          ₹{betDetails.userDetails.balance}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                        <span className="text-gray-600 font-medium">
                          Exposure
                        </span>
                        <span className="font-bold text-lg text-orange-600">
                          ₹{betDetails.userDetails.exposure}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600 font-medium">
                          Status
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            betDetails.userDetails.isActive
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {betDetails.userDetails.isActive
                            ? "ACTIVE"
                            : "INACTIVE"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Technical Information */}
              <div className="mt-8 bg-gradient-to-br from-purple-50 to-white rounded-xl p-6 border border-purple-100 shadow-sm">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <svg
                      className="w-5 h-5 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Technical Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">
                      IP Address
                    </span>
                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      {betDetails.ipAddress}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">
                      User Agent
                    </span>
                    <span
                      className="font-medium text-xs truncate max-w-xs bg-gray-100 px-2 py-1 rounded"
                      title={betDetails.userAgent}
                    >
                      {betDetails.userAgent}
                    </span>
                  </div>
                </div>
              </div>

              {/* Raw Bet Data */}
              {betDetails.rawBetData && (
                <div className="mt-8 bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100 shadow-sm">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                      <svg
                        className="w-5 h-5 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Raw Bet Data
                    </h3>
                  </div>
                  <div className="bg-gray-900 p-4 rounded-lg">
                    <pre className="text-xs text-gray-300 overflow-x-auto font-mono">
                      {JSON.stringify(betDetails.rawBetData, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Bet Result Section */}
              {betDetails.status === "pending" && (
                <div className="mt-8 bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 border border-blue-100 shadow-sm">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Declare Bet Result
                    </h3>
                  </div>

                  <div className="space-y-6">
                    {/* Result Type Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Select Result
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="result"
                            value="win"
                            checked={selectedResult === "win"}
                            onChange={(e) =>
                              setSelectedResult(e.target.value as "win")
                            }
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
                            checked={selectedResult === "loss"}
                            onChange={(e) =>
                              setSelectedResult(e.target.value as "loss")
                            }
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
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Result Preview:
                        </h4>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              selectedResult === "win"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {selectedResult.toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-600">-</span>
                          <span className="text-sm font-medium text-gray-800">
                            {resultValue}
                          </span>
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
                    setResultValue("");
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Close
                </button>
                {betDetails.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleProceedBet(betDetails.betId)}
                      disabled={
                        !selectedResult ||
                        !resultValue.trim() ||
                        isProcessingBet
                      }
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
                {betDetails.status === "settled" && (
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

          <style>{`
            .animate-fadein { animation: fadein 0.2s; }
            @keyframes fadein { from { opacity: 0; } to { opacity: 1; } }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default Cricket;
