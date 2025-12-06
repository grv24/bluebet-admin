import React, { useState } from "react";
import { RiLockFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
// import IndividualResultModal from "@/components/casino/IndividualResultModal";
// import { useIndividualResultModal } from "@/hooks/useIndividualResultModal";
import { memoizeCasinoComponent } from "../../../utils/casinoMemo";

type ThirtyTwoCardAProps = {
  casinoData: any;
  remainingTime: number;
  onBetClick: (sid: string, type: "back" | "lay") => void;
  results: any[];
  gameSlug: string;
  gameName: string;
  currentBet?: any;
};

const ThirtyTwoCardAComponent: React.FC<ThirtyTwoCardAProps> = ({
  casinoData,
  remainingTime,
  onBetClick,
  results,
  gameSlug,
  gameName,
  currentBet,
}) => {
  const navigate = useNavigate();
  // const resultModal = useIndividualResultModal();

  // Normalize gameSlug for display in CasinoMatchDetailsDisplay
  // The API expects the original format (e.g., "CARD_32"), but display needs normalized version
  const normalizedGameSlug = React.useMemo(() => {
    if (gameSlug) {
      return gameSlug.toLowerCase().replace(/[^a-z0-9]/g, "");
    }
    return "card32"; // Default fallback
  }, [gameSlug]);

  // Keep original gameSlug for API calls (e.g., "CARD_32")
  // The API expects the original format with underscores
  const apiGameType = React.useMemo(() => {
    if (gameSlug) {
      // Use original gameSlug for API (e.g., "CARD_32")
      return gameSlug;
    }
    return "CARD_32"; // Default fallback
  }, [gameSlug]);

  // Handle both new API format (casinoData?.data?.sub) and legacy format (casinoData?.data?.data?.data?.t2)
  const t2: any[] =
    casinoData?.data?.sub || casinoData?.data?.data?.data?.t2 || [];

  // Filter players (sid 1-4 for Player 8-11)
  const players = t2.filter((x: any) => x?.sr >= 1 && x?.sr <= 4);

  /**
   * Handle clicking on individual result to show details
   */
  const handleResultClick = (result: any) => {
    const resultId = result?.mid || result?.roundId || result?.id || result?.matchId;
    
    if (!resultId) {
      console.error("🎰 32cardA: No result ID found in result", result);
      return;
    }
    
    if (!apiGameType) {
      console.error("🎰 32cardA: No gameSlug available", { gameSlug, apiGameType });
      return;
    }
    
    // resultModal.openModal(String(resultId), result);
  };

  const isSuspended = (odds: any) => {
    const status = odds?.gstatus as string | number | undefined;
    const isStatusSuspended =
      status === "SUSPENDED" || status === "1" || status === 1;
    return isStatusSuspended || remainingTime <= 3;
  };

  const getByNation = (name: string) =>
    players.find(
      (x) =>
        String(x?.nation || x?.nat || "").toLowerCase() === name.toLowerCase()
    );

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

  // Map win value (1-4) to player name
  const getPlayerByWin = (win: string | number) => {
    const winNum = parseInt(String(win));
    if (winNum === 1) return "Player 8";
    if (winNum === 2) return "Player 9";
    if (winNum === 3) return "Player 10";
    if (winNum === 4) return "Player 11";
    return null;
  };

  // Get profit/loss book for all players (cross-calculation: betting on one player affects others)
  const getProfitLoss = () => {
    if (!currentBet?.data || !casinoData?.data?.mid)
      return {
        "Player 8": 0,
        "Player 9": 0,
        "Player 10": 0,
        "Player 11": 0,
      };

    const currentMatchId = casinoData.data.mid;
    let book: Record<string, number> = {
      "Player 8": 0,
      "Player 9": 0,
      "Player 10": 0,
      "Player 11": 0,
    };

    // Only bets for this match
    const bets = currentBet.data.filter(
      (bet: any) => String(bet.matchId) === String(currentMatchId)
    );

    bets.forEach((bet: any) => {
      const { betName, oddCategory, stake, betRate } = bet.betData;

      // Handle main players (Player 8, 9, 10, 11)
      if (
        betName === "Player 8" ||
        betName === "Player 9" ||
        betName === "Player 10" ||
        betName === "Player 11"
      ) {
        const playerName = betName;

        if (oddCategory.toLowerCase() === "back") {
          const profit = stake * (betRate - 1);
          const loss = -stake;

          book[playerName] += profit;
          // Add loss to other players
          Object.keys(book).forEach((key) => {
            if (key !== playerName) {
              book[key] += loss;
            }
          });
        } else if (oddCategory.toLowerCase() === "lay") {
          const loss = stake * (betRate - 1);
          const profit = stake;

          book[playerName] -= loss;
          // Add profit to other players
          Object.keys(book).forEach((key) => {
            if (key !== playerName) {
              book[key] += profit;
            }
          });
        }
      }
    });

    return book;
  };

  // Memoize profit/loss book to avoid recalculating on every render
  const profitLossBook = React.useMemo(() => getProfitLoss(), [
    currentBet?.data,
    casinoData?.data?.mid,
  ]);

  return (
    <div className="w-full flex flex-col gap-1 mt-1">
      <div className="grid md:grid-cols-2 grid-cols-1 gap-1">
        <div className="col-span-1">
          <table className="bg-[var(--bg-table-row)] w-full table-fixed">
            <thead>
              <tr className="w-full border border-gray-300">
                <th className="border border-gray-300 bg-[var(--bg-table-row)] w-auto">
                  <div className="h-full"></div>
                </th>
                <th className="bg-[var(--bg-back)] leading-8 border text-base font-semibold text-[var(--bg-secondary)] border-gray-300 w-1/4">
                  Back
                </th>
                <th className="bg-[var(--bg-lay)] leading-8 border text-base font-semibold text-[var(--bg-secondary)] border-gray-300 w-1/4">
                  Lay
                </th>
              </tr>
            </thead>
            <tbody>
              {["Player 8", "Player 9"].map((label) => {
                const row = getByNation(label) || {};
                const backLocked = isSuspended(row);
                const layLocked = isSuspended(row);
                const playerProfitLoss = profitLossBook[label] || 0;

                return (
                  <tr key={label} className="w-full border border-gray-300">
                    <td className="text-base font-semibold px-2 text-[var(--bg-secondary)]">
                      <div className="flex flex-col">
                        <span>{label}</span>
                        <h2
                          className={`text-xs font-semibold ${
                            playerProfitLoss > 0
                              ? "text-green-600"
                              : playerProfitLoss < 0
                                ? "text-red-600"
                                : "text-gray-600"
                          }`}
                        >
                          {playerProfitLoss > 0 ? "+" : ""}
                          {playerProfitLoss.toFixed(0)}
                        </h2>
                      </div>
                    </td>
                    <td
                      className="relative text-base border border-gray-300 text-center leading-10 font-semibold bg-[var(--bg-back)] text-[var(--bg-secondary)] cursor-pointer hover:bg-gray-100"
                      onClick={() =>
                        !backLocked && onBetClick(String(row?.sid), "back")
                      }
                    >
                      {backLocked && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <RiLockFill className="text-white text-xl" />
                        </div>
                      )}
                      {row?.b || row?.b1 || 0}
                    </td>
                    <td
                      className="relative text-base border border-gray-300 text-center leading-10 font-semibold bg-[var(--bg-lay)] text-[var(--bg-secondary)] cursor-pointer hover:bg-gray-100"
                      onClick={() =>
                        !layLocked && onBetClick(String(row?.sid), "lay")
                      }
                    >
                      {layLocked && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <RiLockFill className="text-white text-xl" />
                        </div>
                      )}
                      {row?.l || row?.l1 || 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="col-span-1">
          <table className="bg-[var(--bg-table-row)] w-full table-fixed">
            <thead>
              <tr className="w-full border border-gray-300">
                <th className="border border-gray-300 bg-[var(--bg-table-row)] w-auto">
                  <div className="h-full"></div>
                </th>
                <th className="bg-[var(--bg-back)] leading-8 border text-base font-semibold text-[var(--bg-secondary)] border-gray-300 w-1/4">
                  Back
                </th>
                <th className="bg-[var(--bg-lay)] leading-8 border text-base font-semibold text-[var(--bg-secondary)] border-gray-300 w-1/4">
                  Lay
                </th>
              </tr>
            </thead>
            <tbody>
              {["Player 10", "Player 11"].map((label) => {
                const row = getByNation(label) || {};
                const backLocked = isSuspended(row);
                const layLocked = isSuspended(row);
                const playerProfitLoss = profitLossBook[label] || 0;

                return (
                  <tr key={label} className="w-full border border-gray-300">
                    <td className="text-base font-semibold px-2 text-[var(--bg-secondary)]">
                      <div className="flex flex-col">
                        <span>{label}</span>
                        <h2
                          className={`text-xs font-semibold ${
                            playerProfitLoss > 0
                              ? "text-green-600"
                              : playerProfitLoss < 0
                                ? "text-red-600"
                                : "text-gray-600"
                          }`}
                        >
                          {playerProfitLoss > 0 ? "+" : ""}
                          {playerProfitLoss.toFixed(0)}
                        </h2>
                      </div>
                    </td>
                    <td
                      className="relative text-base border border-gray-300 text-center leading-10 font-semibold bg-[var(--bg-back)] text-[var(--bg-secondary)] cursor-pointer hover:bg-gray-100"
                      onClick={() =>
                        !backLocked && onBetClick(String(row?.sid), "back")
                      }
                    >
                      {backLocked && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <RiLockFill className="text-white text-xl" />
                        </div>
                      )}
                      {row?.b || row?.b1 || 0}
                    </td>
                    <td
                      className="relative text-base border border-gray-300 text-center leading-10 font-semibold bg-[var(--bg-lay)] text-[var(--bg-secondary)] cursor-pointer hover:bg-gray-100"
                      onClick={() =>
                        !layLocked && onBetClick(String(row?.sid), "lay")
                      }
                    >
                      {layLocked && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <RiLockFill className="text-white text-xl" />
                        </div>
                      )}
                      {row?.l || row?.l1 || 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results */}
      <div className="flex flex-col gap-1">
        <div className="bg-[var(--bg-secondary85)] border border-gray-300 flex justify-between px-2 py-.5 items-center">
          <h2 className="text-sm font-normal leading-8 text-white">
            Last Result
          </h2>
          <h2
            onClick={() => navigate(`/casino-result?game=CARD_32`)}
            className="text-sm font-normal leading-8 text-white cursor-pointer hover:text-gray-200"
          >
            View All
          </h2>
        </div>
        <div className="flex justify-end items-center mb-2 gap-1 mx-2">
          {Array.isArray(results) &&
            results.slice(0, 10).map((item: any, index: number) => {
              const result = item?.result || item?.win;
              const playerName = getPlayerByWin(result);
              let displayText = "";
              let color = "text-gray-200";

              if (result === "1" || result === 1) {
                displayText = "8";
                color = "text-yellow-500";
              } else if (result === "2" || result === 2) {
                displayText = "9";
                color = "text-yellow-500";
              } else if (result === "3" || result === 3) {
                displayText = "10";
                color = "text-yellow-500";
              } else if (result === "4" || result === 4) {
                displayText = "11";
                color = "text-yellow-500";
              } else {
                displayText = "?";
                color = "text-gray-400";
              }

              return (
                <h2
                  key={index}
                  className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-sm font-semibold ${color} cursor-pointer hover:scale-110 transition-transform`}
                  onClick={() => handleResultClick(item)}
                  title={`${playerName || "Unknown"} - Click to view details`}
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
        gameType={apiGameType}
        title={`${gameName || "32 Card A"} Result Details`}
        customGetFilteredBets={getFilteredBets}
      /> */}
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const ThirtyTwoCardA = memoizeCasinoComponent(ThirtyTwoCardAComponent);
ThirtyTwoCardA.displayName = "ThirtyTwoCardA";

export default ThirtyTwoCardA;
