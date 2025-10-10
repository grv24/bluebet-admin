import React, { useState, useRef, useEffect, useMemo } from "react";

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
  const [showMatchOdds, setShowMatchOdds] = useState<boolean>(false);
  const [showBookmaker, setShowBookmaker] = useState<boolean>(false);
  const [showNormalFancy, setShowNormalFancy] = useState<boolean>(false);
  const [showOverByOver, setShowOverByOver] = useState<boolean>(false);
  const [showBookSummary, setShowBookSummary] = useState<boolean>(false);
  const [showScoreCard, setShowScoreCard] = useState<boolean>(false);
  const [showMyBets, setShowMyBets] = useState<boolean>(false);
  const [activeBetTab, setActiveBetTab] = useState<'matched' | 'unmatched' | 'settled'>('matched');
  const [showOddEven, setShowOddEven] = useState<boolean>(false);
  const [showTournamentWinner, setShowTournamentWinner] =
    useState<boolean>(false);
  const [showTiedMatch, setShowTiedMatch] = useState<boolean>(false);
  const [showFancy1, setShowFancy1] = useState<boolean>(false);
  const [showLiveMatch, setShowLiveMatch] = useState<boolean>(false);
  const [showUserBookModal, setShowUserBookModal] = useState<boolean>(false);
  const [showBetLockModal, setShowBetLockModal] = useState<boolean>(false);
  const [showViewMoreModal, setShowViewMoreModal] = useState<boolean>(false);
  const [showMyBetsModal, setShowMyBetsModal] = useState<boolean>(false);
  const normalizedMatchOdds = matchOdds?.data?.data?.matchOdds || [];
  const normalizedBookMakerOdds = matchOdds?.data?.data?.bookMakerOdds || [];
  const normalizedOtherMarketOdds =
    matchOdds?.data?.data?.otherMarketOdds || [];
  const fancyOdds = matchOdds?.data?.data?.fancyOdds || [];

  // Log downlines bets data for debugging
  console.log("Downlines Bets:", downlinesBets);

  // Helper functions for bet actions
  const handleProceedBet = (betId: string) => {
    console.log("Proceed bet:", betId);
    // TODO: Implement proceed bet logic
  };

  const handleDeleteBet = (betId: string) => {
    console.log("Delete bet:", betId);
    // TODO: Implement delete bet logic
  };

  const handleRevertBet = (betId: string) => {
    console.log("Revert bet:", betId);
    // TODO: Implement revert bet logic
  };

  // Filter bets based on status
  const matchedBets = downlinesBets?.bets?.filter((bet: any) => bet.betStatus === 'pending') || [];
  const unmatchedBets = downlinesBets?.bets?.filter((bet: any) => bet.betStatus === 'unmatched') || [];
  const settledBets = downlinesBets?.bets?.filter((bet: any) => ['won', 'lost', 'settled'].includes(bet.betStatus)) || [];

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
                  onClick={() => setShowBookmaker(!showBookmaker)}
                  className="font-bold text-lg py-1 flex items-center px-2 bg-[var(--bg-secondary70)] gap-2 justify-between cursor-pointer"
                >
                  <h2 className="text-sm font-normal text-white/90 leading-6 tracking-tight">
                    Bookmaker
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
                      onClick={() => setShowNormalFancy(!showNormalFancy)}
                      className="font-bold text-lg py-1 flex items-center px-2 bg-[var(--bg-secondary70)] gap-2 justify-between cursor-pointer"
                    >
                      <h2 className="text-sm font-normal text-white/90 leading-6 tracking-tight">
                        Normal Fancy
                      </h2>
                      <div className="flex items-center gap-2">
                        <button className="text-xs px-2 font-semibold leading-6 tracking-tight bg-[var(--bg-secondary)] text-white/90">
                          BET LOCK
                        </button>
                        <button className="text-xs px-2 font-semibold leading-6 tracking-tight bg-[var(--bg-secondary)] text-white/90">
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
                      onClick={() => setShowFancy1(!showFancy1)}
                      className="font-bold text-lg py-1 flex items-center px-2 bg-[var(--bg-secondary70)] gap-2 justify-between cursor-pointer"
                    >
                      <h2 className="text-sm font-normal text-white/90 leading-6 tracking-tight">
                        Fancy 1
                      </h2>
                      <div className="flex items-center gap-2">
                        <button className="text-xs px-2 font-semibold leading-6 tracking-tight bg-[var(--bg-secondary)] text-white/90">
                          BET LOCK
                        </button>
                        <button className="text-xs px-2 font-semibold leading-6 tracking-tight bg-[var(--bg-secondary)] text-white/90">
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
                      onClick={() => setShowOverByOver(!showOverByOver)}
                      className="font-bold text-lg py-1 flex items-center px-2 bg-[var(--bg-secondary70)] gap-2 justify-between cursor-pointer"
                    >
                      <h2 className="text-sm font-normal text-white/90 leading-6 tracking-tight">
                        Over By Over
                      </h2>
                      <div className="flex items-center gap-2">
                        <button className="text-xs px-2 font-semibold leading-6 tracking-tight bg-[var(--bg-secondary)] text-white/90">
                          BET LOCK
                        </button>
                        <button className="text-xs px-2 font-semibold leading-6 tracking-tight bg-[var(--bg-secondary)] text-white/90">
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
                      onClick={() => setShowOddEven(!showOddEven)}
                      className="font-bold text-lg py-1 flex items-center px-2 bg-[var(--bg-secondary70)] gap-2 justify-between cursor-pointer"
                    >
                      <h2 className="text-sm font-normal text-white/90 leading-6 tracking-tight">
                        Odd Even
                      </h2>
                      <div className="flex items-center gap-2">
                        <button className="text-xs px-2 font-semibold leading-6 tracking-tight bg-[var(--bg-secondary)] text-white/90">
                          BET LOCK
                        </button>
                        <button className="text-xs px-2 font-semibold leading-6 tracking-tight bg-[var(--bg-secondary)] text-white/90">
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
                      onClick={() =>
                        setShowTournamentWinner(!showTournamentWinner)
                      }
                      className="font-bold text-lg py-1 flex items-center px-2 bg-[var(--bg-secondary70)] gap-2 justify-between cursor-pointer"
                    >
                      <h2 className="text-sm font-normal text-white/90 leading-6 tracking-tight">
                        Tournament Winner
                      </h2>
                      <div className="flex items-center gap-2">
                        <button className="text-xs px-2 font-semibold leading-6 tracking-tight bg-[var(--bg-secondary)] text-white/90">
                          BET LOCK
                        </button>
                        <button className="text-xs px-2 font-semibold leading-6 tracking-tight bg-[var(--bg-secondary)] text-white/90">
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
                      onClick={() => setShowTiedMatch(!showTiedMatch)}
                      className="font-bold text-lg py-1 flex items-center px-2 bg-[var(--bg-secondary70)] gap-2 justify-between cursor-pointer"
                    >
                      <h2 className="text-sm font-normal text-white/90 leading-6 tracking-tight">
                        Tied Match
                      </h2>
                      <div className="flex items-center gap-2">
                        <button className="text-xs px-2 font-semibold leading-6 tracking-tight bg-[var(--bg-secondary)] text-white/90">
                          BET LOCK
                        </button>
                        <button className="text-xs px-2 font-semibold leading-6 tracking-tight bg-[var(--bg-secondary)] text-white/90">
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
          normalizedBookMakerOdds?.some((market: any) => market?.isPlay === "true") || 
          normalizedOtherMarketOdds?.some((market: any) => market?.isPlay === "true") || 
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
                    onClick={() => setActiveBetTab('unmatched')}
                    className={`px-3 py-2 font-medium text-xs ${
                      activeBetTab === 'unmatched' 
                        ? 'text-blue-600 border-b-2 border-blue-600' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Unmatched ({unmatchedBets.length})
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
                    activeBetTab === 'unmatched' ? unmatchedBets : 
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
                              onClick={() => handleProceedBet(bet.betId)}
                              className="px-2 py-1 bg-green-500 text-white rounded text-[9px] hover:bg-green-600"
                            >
                              Proceed
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
                          <button
                            onClick={() => handleRevertBet(bet.betId)}
                            className="px-2 py-1 bg-orange-500 text-white rounded text-[9px] hover:bg-orange-600"
                          >
                            Revert
                          </button>
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
      {showUserBookModal && (
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
      )}

      {/* Bet Lock Modal */}
      {showBetLockModal && (
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
      )}

      {/* My Bets Modal */}
      {showMyBetsModal && (
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
      )}

      {/* View More Modal */}
      {showViewMoreModal && (
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
      )}
    </div>
  );
};

export default Cricket;
