import {
  getBlackShapes,
  getCardByCode,
  getNumberCard,
  getRedShapes,
} from "../../../utils/card";
import React, { useState } from "react";
import { RiLockFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
    // import IndividualResultModal from "@/components/casino/IndividualResultModal";
    // import { useIndividualResultModal } from "@/hooks/useIndividualResultModal";
import { memoizeCasinoComponent } from "../../../utils/casinoMemo";

const DragonTiger202Component = ({
  casinoData,
  remainingTime,
  onBetClick,
  results,
  gameSlug,
  gameName,
  currentBet,
}: {
  casinoData: any;
  remainingTime: number;
  onBetClick: (sid: string, type: string) => void;
  results: any[];
  gameSlug: string;
  gameName: string;
  currentBet: any;
}) => {
  const navigate = useNavigate();
  // const resultModal = useIndividualResultModal();

  // Convert gameSlug to actual game slug format if needed
  const actualGameSlug = React.useMemo(() => {
    if (gameSlug) {
      return gameSlug.toLowerCase().replace(/[^a-z0-9]/g, "");
    }
    return "dt202"; // Default fallback
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

  // Debug: Log data
  console.log("🎰 DT20 casino data:", casinoData);
  console.log("🎰 DT20 results data:", results);

  /**
   * Handle clicking on individual result to show details
   */
  const handleResultClick = (result: any) => {
    const resultId = result?.mid || result?.roundId || result?.id || result?.matchId;
    
    if (!resultId) {
      console.error("🎰 DragonTiger202: No result ID found in result", result);
      return;
    }
    
    if (!actualGameSlug) {
      console.error("🎰 DragonTiger202: No gameSlug available", { gameSlug, actualGameSlug });
      return;
    }
    
    // resultModal.openModal(String(resultId), result);
  };

  // Debug logging for DT20 results
  React.useEffect(() => {
    if (results && Array.isArray(results) && results.length > 0) {
      console.log("🎰 DT20 component: Processing results:", {
        resultsCount: results.length,
        firstResult: results[0],
        hasWinField: results.some((r: any) => r.win !== undefined),
        hasResultField: results.some((r: any) => r.result !== undefined),
        sampleResults: results
          .slice(0, 3)
          .map((r: any) => ({ win: r.win, result: r.result })),
        allResults: results.map((r: any) => ({ win: r.win, result: r.result })),
      });
    }
  }, [results]);

  // Handle both old and new API structures
  const t2: any[] = casinoData?.data?.sub || casinoData?.data?.data?.data?.t2 || [];

  console.log("🎰 DT20 data filtering:", {
    t2Length: t2.length,
    t2Data: t2.map((item) => ({
      sid: item.sid,
      nation: item.nat || item.nation,
      gstatus: item.gstatus,
      rate: item.b || item.rate,
    })),
  });
  const getByNat = (name: string) => {
    const found = t2.find(
      (x) =>
        String(x?.nat || x?.nation || "").toLowerCase() === name.toLowerCase()
    );
    console.log(`🎰 DT20 getByNat lookup for "${name}":`, found);
    return found;
  };
  const isLocked = (row: any) => {
    const s = row?.gstatus as string | number | undefined;
    // For DT20, "OPEN" means active, "SUSPENDED"/"CLOSED" means suspended
    return (
      s === "SUSPENDED" ||
      s === "CLOSED" ||
      s === 0 ||
      s === "0" ||
      (remainingTime ?? 0) <= 3
    );
  };

  // Helper function to map card display names to API names
  const getCardApiName = (type: "Dragon" | "Tiger", card: string) => {
    // Map display names to API names
    const cardMap: { [key: string]: string } = {
      A: "1",
      J: "J",
      Q: "Q",
      K: "K",
    };

    const apiCard = cardMap[card] || card;
    return `${type} Card ${apiCard}`;
  };

  /**
   * Universal profit/loss calculation function for all betting types
   * @param betType - The type of bet to calculate profit/loss for
   * @returns The profit/loss amount (negative for loss-only display)
   */
  const getBetProfitLoss = (betType: string): number => {
    if (!currentBet?.data || !casinoData?.data?.mid) return 0;

    const currentMatchId = casinoData.data.mid;
    let profitLoss = 0;

    // Only bets for this match
    const bets = currentBet.data.filter(
      (bet: any) => String(bet.matchId) === String(currentMatchId)
    );

    bets.forEach((bet: any) => {
      const { betName, stake } = bet.betData;

      // Normalize bet name for comparison
      const normalizedBetName = betName?.toLowerCase() || "";
      const normalizedBetType = betType.toLowerCase();

      // More precise matching to avoid cross-contamination between Dragon/Tiger
      let isMatch = false;

      // Exact match first
      if (normalizedBetName === normalizedBetType) {
        isMatch = true;
      }
      // Handle Pair specifically
      else if (betType === "Pair" && normalizedBetName === "pair") {
        isMatch = true;
      }
      // Handle Even/Odd with exact Dragon/Tiger prefix
      else if (betType.includes("Even") && normalizedBetName.includes("even")) {
        const dragonTigerPrefix = betType.split(" ")[0].toLowerCase(); // "dragon" or "tiger"
        isMatch = normalizedBetName.startsWith(dragonTigerPrefix);
      }
      else if (betType.includes("Odd") && normalizedBetName.includes("odd")) {
        const dragonTigerPrefix = betType.split(" ")[0].toLowerCase(); // "dragon" or "tiger"
        isMatch = normalizedBetName.startsWith(dragonTigerPrefix);
      }
      // Handle Red/Black with exact Dragon/Tiger prefix
      else if (betType.includes("Red") && normalizedBetName.includes("red")) {
        const dragonTigerPrefix = betType.split(" ")[0].toLowerCase(); // "dragon" or "tiger"
        isMatch = normalizedBetName.startsWith(dragonTigerPrefix);
      }
      else if (betType.includes("Black") && normalizedBetName.includes("black")) {
        const dragonTigerPrefix = betType.split(" ")[0].toLowerCase(); // "dragon" or "tiger"
        isMatch = normalizedBetName.startsWith(dragonTigerPrefix);
      }

      if (isMatch) {
        profitLoss += -stake; // Accumulate loss-only display for multiple bets
      }
    });

    return profitLoss;
  };

  return (
    <div className="w-full flex flex-col gap-1 mt-1">
      {/* first row */}
      <div className="flex bg-[var(--bg-table-row)]  gap-1 items-stretch overflow-x-auto">
        {/* Dragon */}
        <div className="shrink-0 basis-[25%]">
          <div className="h-full flex flex-col gap-1 p-1">
            {(() => {
              const row = getByNat("Dragon") || {};
              const locked = isLocked(row);
              const value = row?.b || row?.rate || "";
              return (
                <>
                  <h2 className="text-base font-semibold leading-10 text-center">
                    {value}
                  </h2>
                  <button
                    className="relative h-10 sm:h-12 bg-gradient-to-r from-[var(--bg-primary)] to-[var(--bg-secondary)] text-base font-semibold text-white w-full"
                    disabled={locked}
                    onClick={() => {
                      console.log("🎰 DT20 Dragon bet click:", {
                        sid: row?.sid,
                        odds: row,
                        locked,
                      });
                      if (!locked && row?.sid) {
                        onBetClick?.(String(row.sid), "back");
                      }
                    }}
                  >
                    {locked && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <RiLockFill className="text-white" />
                      </span>
                    )}
                    Dragon
                  </button>
                  <h2 
                    className={`text-xs font-semibold leading-5 text-center ${
                      getBetProfitLoss("Dragon") > 0
                        ? "text-green-600"
                        : getBetProfitLoss("Dragon") < 0
                          ? "text-red-600"
                          : "text-gray-600"
                    }`}
                  >
                    {getBetProfitLoss("Dragon") > 0 ? "+" : ""}
                    {getBetProfitLoss("Dragon").toFixed(0)}
                  </h2>
                </>
              );
            })()}
          </div>
        </div>
        {/* Tie */}
        <div className="shrink-0 basis-[16.6667%]">
          <div className="h-full flex flex-col gap-1 p-1">
            {(() => {
              const row = getByNat("Tie") || {};
              const locked = isLocked(row);
              const value = row?.b || row?.rate || "";
              return (
                <>
                  <h2 className="text-base font-semibold leading-10 text-center">
                    {value}
                  </h2>
                  <button
                    className="relative h-10 sm:h-12 bg-gradient-to-r from-[var(--bg-primary)] to-[var(--bg-secondary)] text-base font-semibold text-white w-full"
                    disabled={locked}
                    onClick={() => {
                      console.log("🎰 DT20 Tie bet click:", {
                        sid: row?.sid,
                        odds: row,
                        locked,
                      });
                      if (!locked && row?.sid) {
                        onBetClick?.(String(row.sid), "back");
                      }
                    }}
                  >
                    {locked && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <RiLockFill className="text-white" />
                      </span>
                    )}
                    Tie
                  </button>
                  <h2 
                    className={`text-xs font-semibold leading-5 text-center ${
                      getBetProfitLoss("Tie") > 0
                        ? "text-green-600"
                        : getBetProfitLoss("Tie") < 0
                          ? "text-red-600"
                          : "text-gray-600"
                    }`}
                  >
                    {getBetProfitLoss("Tie") > 0 ? "+" : ""}
                    {getBetProfitLoss("Tie").toFixed(0)}
                  </h2>
                </>
              );
            })()}
          </div>
        </div>
        {/* Tiger */}
        <div className="shrink-0 basis-[25%]">
          <div className="h-full flex flex-col gap-1 p-1">
            {(() => {
              const row = getByNat("Tiger") || {};
              const locked = isLocked(row);
              const value = row?.b || row?.rate || "";
              return (
                <>
                  <h2 className="text-base font-semibold leading-10 text-center">
                    {value}
                  </h2>
                  <button
                    className="relative h-10 sm:h-12 bg-gradient-to-r from-[var(--bg-primary)] to-[var(--bg-secondary)] text-base font-semibold text-white w-full"
                    disabled={locked}
                    onClick={() => {
                      console.log("🎰 DT20 Tiger bet click:", {
                        sid: row?.sid,
                        odds: row,
                        locked,
                      });
                      if (!locked && row?.sid) {
                        onBetClick?.(String(row.sid), "back");
                      }
                    }}
                  >
                    {locked && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <RiLockFill className="text-white" />
                      </span>
                    )}
                    Tiger
                  </button>
                  <h2 
                    className={`text-xs font-semibold leading-5 text-center ${
                      getBetProfitLoss("Tiger") > 0
                        ? "text-green-600"
                        : getBetProfitLoss("Tiger") < 0
                          ? "text-red-600"
                          : "text-gray-600"
                    }`}
                  >
                    {getBetProfitLoss("Tiger") > 0 ? "+" : ""}
                    {getBetProfitLoss("Tiger").toFixed(0)}
                  </h2>
                </>
              );
            })()}
          </div>
        </div>
        {/* vertical separator */}
        <div className="shrink-0 w-2 bg-[var(--bg-secondary)] mx-1" />
        {/* Pair */}
        <div className="shrink-0 basis-[25%]">
          <div className="h-full flex flex-col gap-1 p-1">
            {(() => {
              const row = getByNat("Pair") || {};
              const locked = isLocked(row);
              const value = row?.b || row?.rate || "";
              return (
                <>
                  <h2 className="text-base font-semibold leading-10 text-center">
                    {value}
                  </h2>
                  <button
                    className="relative h-10 sm:h-12 bg-gradient-to-r from-[var(--bg-primary)] to-[var(--bg-secondary)] text-base font-semibold text-white w-full "
                    disabled={locked}
                    onClick={() => {
                      console.log("🎰 DT20 Pair bet click:", {
                        sid: row?.sid,
                        odds: row,
                        locked,
                      });
                      if (!locked && row?.sid) {
                        onBetClick?.(String(row.sid), "back");
                      }
                    }}
                  >
                    {locked && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <RiLockFill className="text-white" />
                      </span>
                    )}
                    Pair
                  </button>
                  <h2 
                    className={`text-xs font-semibold leading-5 text-center ${
                      getBetProfitLoss("Pair") > 0
                        ? "text-green-600"
                        : getBetProfitLoss("Pair") < 0
                          ? "text-red-600"
                          : "text-gray-600"
                    }`}
                  >
                    {getBetProfitLoss("Pair") > 0 ? "+" : ""}
                    {getBetProfitLoss("Pair").toFixed(0)}
                  </h2>
                </>
              );
            })()}
          </div>
        </div>
      </div>
      {/* second row */}
      <div className="flex lg:flex-row flex-col gap-1 justify-center items-center">
        <div className="flex flex-col bg-[var(--bg-table-row)] w-full  gap-1">
          <h2 className="text-base text-center font-semibold">Dragon</h2>
          <div className="grid grid-cols-4 gap-1 p-1 w-full">
            {(
              [
                "Dragon Even",
                "Dragon Odd",
                "Dragon Red",
                "Dragon Black",
              ] as const
            ).map((name) => {
              const row = getByNat(name) || {};
              const locked = isLocked(row);
              const value = row?.b || row?.rate;
              const label = name.split(" ")[1];
              return (
                <div key={name} className="flex flex-col w-full">
                  <h2 className="text-sm font-semibold leading-6 text-center">
                    {value}
                  </h2>
                  <button
                    className="relative bg-gradient-to-r leading-10 from-[var(--bg-primary)] to-[var(--bg-secondary)] text-white w-full "
                    disabled={locked}
                    onClick={() => {
                      console.log("🎰 DT20 Dragon secondary bet click:", {
                        name,
                        sid: row?.sid,
                        odds: row,
                        locked,
                      });
                      if (!locked && row?.sid) {
                        onBetClick?.(String(row.sid), "back");
                      }
                    }}
                  >
                    {locked && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <RiLockFill className="text-white" />
                      </span>
                    )}
                    {label === "Red" ? (
                      <div className="flex gap-1 py-2.5 justify-center items-center">
                        <img
                          className="w-5"
                          src={getRedShapes().Diamond}
                          alt="Red Diamond"
                        />
                        <img
                          className="w-5"
                          src={getBlackShapes().Spade}
                          alt="Black Spade"
                        />
                      </div>
                    ) : label === "Black" ? (
                      <div className="flex gap-1 py-2.5 justify-center items-center">
                        <img
                          className="w-5"
                          src={getRedShapes().Heart}
                          alt="Red Heart"
                        />
                        <img
                          className="w-5"
                          src={getBlackShapes().Club}
                          alt="Black Club"
                        />
                      </div>
                    ) : (
                      label
                    )}
                  </button>
                  <h2 
                    className={`text-xs font-semibold leading-4 mt-1 text-center ${
                      getBetProfitLoss(name) > 0
                        ? "text-green-600"
                        : getBetProfitLoss(name) < 0
                          ? "text-red-600"
                          : "text-gray-600"
                    }`}
                  >
                    {getBetProfitLoss(name) > 0 ? "+" : ""}
                    {getBetProfitLoss(name).toFixed(0)}
                  </h2>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col bg-[var(--bg-table-row)] w-full  gap-1">
          <h2 className="text-base text-center font-semibold">Tiger</h2>
          <div className="grid grid-cols-4 gap-1 p-1 w-full">
            {(
              ["Tiger Even", "Tiger Odd", "Tiger Red", "Tiger Black"] as const
            ).map((name) => {
              const row = getByNat(name) || {};
              const locked = isLocked(row);
              const value = row?.b || row?.rate;
              const label = name.split(" ")[1];
              return (
                <div key={name} className="flex flex-col w-full">
                  <h2 className="text-sm font-semibold leading-6 text-center">
                    {value}
                  </h2>
                  <button
                    className="relative bg-gradient-to-r leading-10 from-[var(--bg-primary)] to-[var(--bg-secondary)] text-white w-full"
                    disabled={locked}
                    onClick={() => {
                      console.log("🎰 DT20 Tiger secondary bet click:", {
                        name,
                        sid: row?.sid,
                        odds: row,
                        locked,
                      });
                      if (!locked && row?.sid) {
                        onBetClick?.(String(row.sid), "back");
                      }
                    }}
                  >
                    {locked && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <RiLockFill className="text-white" />
                      </span>
                    )}
                    {label === "Red" ? (
                      <div className="flex gap-1 py-2.5 justify-center items-center">
                        <img
                          className="w-5"
                          src={getRedShapes().Diamond}
                          alt="Red Diamond"
                        />

                        <img
                          className="w-5"
                          src={getBlackShapes().Spade}
                          alt="Black Spade"
                        />
                      </div>
                    ) : label === "Black" ? (
                      <div className="flex gap-1 py-2.5 justify-center items-center">
                        <img
                          className="w-5"
                          src={getRedShapes().Heart}
                          alt="Red Heart"
                        />
                        <img
                          className="w-5"
                          src={getBlackShapes().Club}
                          alt="Black Club"
                        />
                      </div>
                    ) : (
                      label
                    )}
                  </button>
                  <h2 
                    className={`text-xs font-semibold leading-4 mt-1 text-center ${
                      getBetProfitLoss(name) > 0
                        ? "text-green-600"
                        : getBetProfitLoss(name) < 0
                          ? "text-red-600"
                          : "text-gray-600"
                    }`}
                  >
                    {getBetProfitLoss(name) > 0 ? "+" : ""}
                    {getBetProfitLoss(name).toFixed(0)}
                  </h2>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* third row */}
      <div className="flex lg:flex-row flex-col gap-1 justify-center items-start">
        {/* Dragon Cards */}
        <div className="w-full bg-[var(--bg-table-row)] flex flex-col gap-2 py-2">
          <div className="flex justify-center items-center gap-2">
            <h2 className="text-center text-base font-semibold text-[var(--bg-secondary)]">
              Dragon
            </h2>
            <h2 className="text-center text-base font-semibold text-[var(--bg-secondary)]">
              {getByNat("Dragon Card J")?.b ?? "0"}
            </h2>
          </div>
          {/* Desktop: 13 in a single row */}
          <div className="w-11/12 mx-auto grid gap-2">
            <div className="grid grid-cols-10 gap-2 place-items-center">
              {["A", "2", "3", "4", "5", "6", "7", "8", "9", "10"].map(
                (key) => {
                  const row = getByNat(getCardApiName("Dragon", key)) || {};
                  const locked = isLocked(row);
                  const betName = getCardApiName("Dragon", key);
                  return (
                    <div
                      key={`dm-${key}`}
                      className="w-full flex flex-col items-center justify-center"
                    >
                      <button
                        className="relative w-full h-full flex items-center justify-center text-[var(--bg-secondary)] font-semibold"
                        disabled={locked}
                        onClick={() => {
                          console.log("🎰 DT20 Dragon card bet click:", {
                            key,
                            sid: row?.sid,
                            odds: row,
                            locked,
                          });
                          if (!locked && row?.sid) {
                            onBetClick?.(String(row.sid), "back");
                          }
                        }}
                      >
                        {locked && (
                          <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <RiLockFill className="text-white" />
                          </span>
                        )}
                        <img className="w-8" src={getNumberCard(key)} alt="" />
                      </button>
                      <h2 
                        className={`text-xs font-semibold leading-3 mt-1 text-center ${
                          getBetProfitLoss(betName) > 0
                            ? "text-green-600"
                            : getBetProfitLoss(betName) < 0
                              ? "text-red-600"
                              : "text-gray-600"
                        }`}
                      >
                        {getBetProfitLoss(betName) > 0 ? "+" : ""}
                        {getBetProfitLoss(betName).toFixed(0)}
                      </h2>
                    </div>
                  );
                }
              )}
            </div>
            <div className="w-full flex justify-center">
              <div className="grid grid-cols-3 gap-2 place-items-center">
                {["J", "Q", "K"].map((key) => {
                  const row = getByNat(getCardApiName("Dragon", key)) || {};
                  const locked = isLocked(row);
                  const betName = getCardApiName("Dragon", key);
                  return (
                    <div
                      key={`dmj-${key}`}
                      className="w-full flex flex-col items-center justify-center"
                    >
                      <button
                        className="relative w-full h-full flex items-center justify-center text-[var(--bg-secondary)] font-semibold "
                        disabled={locked}
                        onClick={() => {
                          console.log("🎰 DT20 Dragon JQK bet click:", {
                            key,
                            sid: row?.sid,
                            odds: row,
                            locked,
                          });
                          if (!locked && row?.sid) {
                            onBetClick?.(String(row.sid), "back");
                          }
                        }}
                      >
                        {locked && (
                          <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <RiLockFill className="text-white" />
                          </span>
                        )}
                        <img className="w-8" src={getNumberCard(key)} alt="" />
                      </button>
                      <h2 
                        className={`text-xs font-semibold leading-3 mt-1 text-center ${
                          getBetProfitLoss(betName) > 0
                            ? "text-green-600"
                            : getBetProfitLoss(betName) < 0
                              ? "text-red-600"
                              : "text-gray-600"
                        }`}
                      >
                        {getBetProfitLoss(betName) > 0 ? "+" : ""}
                        {getBetProfitLoss(betName).toFixed(0)}
                      </h2>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        {/* Tiger Cards */}
        <div className="w-full bg-[var(--bg-table-row)] flex flex-col gap-2 py-2">
          <div className="flex justify-center items-center gap-2">
            <h2 className="text-center text-base font-semibold text-[var(--bg-secondary)]">
              Tiger
            </h2>
            <h2 className="text-center text-base font-semibold text-[var(--bg-secondary)]">
              {getByNat("Tiger Card J")?.b ?? "0"}
            </h2>
          </div>

          <div className="w-11/12 mx-auto grid">
            <div className="grid grid-cols-10 gap-2 place-items-center">
              {["A", "2", "3", "4", "5", "6", "7", "8", "9", "10"].map(
                (key) => {
                  const row = getByNat(getCardApiName("Tiger", key)) || {};
                  const locked = isLocked(row);
                  const betName = getCardApiName("Tiger", key);
                  return (
                    <div
                      key={`tm-${key}`}
                      className="w-full flex flex-col items-center justify-center"
                    >
                      <button
                        className="relative w-full h-full flex items-center justify-center text-[var(--bg-secondary)] font-semibold "
                        disabled={locked}
                        onClick={() => {
                          console.log("🎰 DT20 Tiger card bet click:", {
                            key,
                            sid: row?.sid,
                            odds: row,
                            locked,
                          });
                          if (!locked && row?.sid) {
                            onBetClick?.(String(row.sid), "back");
                          }
                        }}
                      >
                        {locked && (
                          <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <RiLockFill className="text-white" />
                          </span>
                        )}
                        <img className="w-8" src={getNumberCard(key)} alt="" />
                      </button>
                      <h2 
                        className={`text-xs font-semibold leading-3 mt-1 text-center ${
                          getBetProfitLoss(betName) > 0
                            ? "text-green-600"
                            : getBetProfitLoss(betName) < 0
                              ? "text-red-600"
                              : "text-gray-600"
                        }`}
                      >
                        {getBetProfitLoss(betName) > 0 ? "+" : ""}
                        {getBetProfitLoss(betName).toFixed(0)}
                      </h2>
                    </div>
                  );
                }
              )}
            </div>
            <div className="w-full flex justify-center">
              <div className="grid grid-cols-3 gap-2 place-items-center">
                {["J", "Q", "K"].map((key) => {
                  const row = getByNat(getCardApiName("Tiger", key)) || {};
                  const locked = isLocked(row);
                  const betName = getCardApiName("Tiger", key);
                  return (
                    <div
                      key={`tmj-${key}`}
                      className="w-full mt-4 pb-2 flex flex-col items-center justify-center"
                    >
                      <button
                        className="relative w-full h-full flex items-center justify-center text-[var(--bg-secondary)] font-semibold"
                        disabled={locked}
                        onClick={() => {
                          console.log("🎰 DT20 Tiger JQK bet click:", {
                            key,
                            sid: row?.sid,
                            odds: row,
                            locked,
                          });
                          if (!locked && row?.sid) {
                            onBetClick?.(String(row.sid), "back");
                          }
                        }}
                      >
                        {locked && (
                          <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <RiLockFill className="text-white" />
                          </span>
                        )}
                        <img className="w-8" src={getNumberCard(key)} alt="" />
                      </button>
                      <h2 
                        className={`text-xs font-semibold leading-3 mt-1 text-center ${
                          getBetProfitLoss(betName) > 0
                            ? "text-green-600"
                            : getBetProfitLoss(betName) < 0
                              ? "text-red-600"
                              : "text-gray-600"
                        }`}
                      >
                        {getBetProfitLoss(betName) > 0 ? "+" : ""}
                        {getBetProfitLoss(betName).toFixed(0)}
                      </h2>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Results */}
      <div className="mt-1 flex flex-col gap-1">
        <div className="bg-[var(--bg-secondary85)] border border-gray-300 flex justify-between px-2 py-.5 items-center">
          <h2 className="text-sm font-normal leading-8 text-white">
            Last Result
          </h2>
          <h2 onClick={() => navigate(`/casino-result?game=DRAGON_TIGER_20_2`)} className="text-sm font-normal leading-8 text-white cursor-pointer hover:text-gray-200">View All</h2>
        </div>
        <div className="flex justify-end items-center mb-2 gap-1 mx-2">
          {Array.isArray(results) &&
            results?.slice(0, 10).map((item: any, index: number) => {
              const result = item?.win || item?.result;
              let displayText = "";
              let color = "text-gray-200";

              if (result === "1") {
                displayText = "D"; // Dragon
                color = "text-red-500";
              } else if (result === "2") {
                displayText = "T"; // Tiger
                color = "text-yellow-500";
              } else if (result === "3") {
                displayText = "Tie"; // Tie
                color = "text-green-500";
              } else {
                displayText = "?";
                color = "text-gray-400";
              }

              // Debug logging for first few results
              if (index < 3) {
                console.log(`🎰 DT20 result ${index}:`, {
                  item,
                  result,
                  displayText,
                  color,
                });
              }

              return (
                <h2
                  key={index}
                  className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-sm font-semibold ${color} cursor-pointer hover:scale-110 transition-transform`}
                  onClick={() => handleResultClick(item)}
                  title="Click to view details"
                >
                  {displayText}
                </h2>
              );
            })}
        </div>
      </div>

      {/* Individual Result Details Modal */}
      {/* <IndividualResultModal
        isOpen={resultModal.isOpen}
        onClose={resultModal.closeModal}
        resultId={resultModal.selectedResultId || undefined}
        gameType={actualGameSlug}
        title={`${gameName || "Dragon Tiger 202"} Result Details`}
        customGetFilteredBets={getFilteredBets}
      /> */}
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const DragonTiger202 = memoizeCasinoComponent(DragonTiger202Component);
DragonTiger202.displayName = "DragonTiger202";

export default DragonTiger202;
