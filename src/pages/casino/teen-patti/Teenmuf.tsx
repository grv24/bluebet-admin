import React from "react";
import { RiLockFill } from "react-icons/ri";
import { getCardByCode } from "../../../utils/card";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import IndividualResultModal from "@/components/modals/IndividualResultModal";
import { memoizeCasinoComponent } from "../../../utils/casinoMemo";

interface TeenMufProps {
  casinoData: any;
  remainingTime: number;
  onBetClick: (sid: string, type: "back" | "lay") => void;
  results: any[];
  gameSlug: string;
  gameName: string;
  currentBet: any;
}

const TeenMufComponent: React.FC<TeenMufProps> = ({
  casinoData,
  remainingTime,
  onBetClick,
  results,
  gameSlug,
  gameName,
  currentBet,
}) => {
  const navigate = useNavigate();

  // Modal state for individual result details
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);

  // Keep original gameSlug/gameCode for API calls (e.g., "TEEN_MUF")
  const apiGameType = React.useMemo(() => {
    return gameSlug || "TEEN_MUF";
  }, [gameSlug]);

  // Function to parse cards from API response
  const parseCards = (cardsString: string) => {
    if (!cardsString) return [];

    const cards = cardsString.split(",").filter((card) => card && card.trim());
    return cards;
  };

  // Function to get winner information
  const getWinnerInfo = (resultData: any) => {
    if (!resultData) return { winner: null, description: "" };

    const win = resultData.win;
    const winnat = resultData.winnat;
    const desc = resultData.desc || resultData.newdesc || "";

    let winner = null;
    // Use winnat as primary source, fallback to win field
    if (winnat === "Player A" || win === "1") winner = "Player A";
    else if (winnat === "Player B" || win === "2") winner = "Player B";

    return { winner, description: desc };
  };

  // Function to parse TeenMuf description and extract details
  const parseTeenMufDescription = (desc: string, newdesc: string) => {
    // Use desc if newdesc is not available
    const descriptionToParse = newdesc || desc;

    if (!descriptionToParse)
      return {
        top9: "N/A",
        mBaccarat: "N/A",
      };

    // Parse the description field which has the format:
    // Example: "Player A#-#Player B (A : 7  |  B : 0)"
    // Or: "Player A#A : Card 9#Player A (A : 6  |  B : 7)"
    const sections = descriptionToParse.split("#");

    return {
      top9: sections[1] || "N/A",
      mBaccarat: sections[2] || "N/A",
    };
  };

  // Function to format description for better display
  const formatDescription = (desc: string): string[] => {
    if (!desc) return [];

    // Replace ##- with line breaks for better readability
    return desc
      .replace(/##-/g, "\n")
      .split("\n")
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

  const getOddsData = (sid: string) => {
    if (casinoData?.data?.sub) {
      return casinoData.data.sub.find(
        (item: any) => item.sid.toString() === sid
      );
    }

    // Handle legacy format (data in data.data.data.sub)
    if (casinoData?.data?.data?.data?.sub) {
      return casinoData.data.data.data.sub.find(
        (item: any) => item.sid.toString() === sid
      );
    }

    return null;
  };

  /**
   * Handle clicking on individual result to show details
   */
  const handleResultClick = (item: any) => {
    // Extract matchId from result item
    const matchId = item?.mid || item?.roundId || item?.id || item?.matchId || item?.result?.mid;
    
    if (matchId && apiGameType) {
      setSelectedResultId(String(matchId));
      setIsResultModalOpen(true);
    }
  };

  const isSuspended = (sid: string) => {
    const oddsData = getOddsData(sid);
    return (
      oddsData?.gstatus === "SUSPENDED" ||
      oddsData?.gstatus === "1" ||
      String(oddsData?.gstatus) === "1" ||
      remainingTime <= 3
    );
  };

  /**
   * Calculate profit/loss for individual TeenMuf betting types
   * @param betType - The type of bet to calculate profit/loss for (e.g., "Player A", "Player B", "Top 9 A", "Top 9 B", "M Baccarat A", "M Baccarat B")
   * @param groupType - The group type: "winner", "top9", or "mbaccarat"
   * @returns The profit/loss amount (uses settled bet results when available, otherwise shows potential loss)
   */
  const getBetProfitLoss = (
    betType: string,
    groupType: "winner" | "top9" | "mbaccarat"
  ): number => {
    if (!currentBet?.data || !casinoData?.data?.mid) return 0;

    const currentMatchId = casinoData.data.mid;
    let totalProfitLoss = 0;

    // Only bets for this match
    const bets = currentBet.data.filter(
      (bet: any) => String(bet.matchId) === String(currentMatchId)
    );

    bets.forEach((bet: any) => {
      const { betName, oddCategory, stake } = bet.betData;
      const result = bet.betData?.result;

      // Normalize bet name for comparison
      const normalizedBetName = betName?.toLowerCase() || "";
      const normalizedBetType = betType.toLowerCase();

      // Check if this bet matches the current bet type and group
      let isMatch = false;

      if (groupType === "winner") {
        // Handle winner bets (Player A vs Player B)
        if (
          normalizedBetType.includes("player a") &&
          normalizedBetName.includes("player a")
        ) {
          isMatch = true;
        } else if (
          normalizedBetType.includes("player b") &&
          normalizedBetName.includes("player b")
        ) {
          isMatch = true;
        }
      } else if (groupType === "top9") {
        // Handle Top 9 bets (A vs B)
        if (
          normalizedBetType.includes("top 9 a") &&
          normalizedBetName.includes("top 9 a")
        ) {
          isMatch = true;
        } else if (
          normalizedBetType.includes("top 9 b") &&
          normalizedBetName.includes("top 9 b")
        ) {
          isMatch = true;
        } else if (
          normalizedBetType.includes("a") &&
          normalizedBetName.includes("top 9 a")
        ) {
          isMatch = true;
        } else if (
          normalizedBetType.includes("b") &&
          normalizedBetName.includes("top 9 b")
        ) {
          isMatch = true;
        }
      } else if (groupType === "mbaccarat") {
        // Handle M Baccarat bets (A vs B)
        if (
          normalizedBetType.includes("m baccarat a") &&
          normalizedBetName.includes("m baccarat a")
        ) {
          isMatch = true;
        } else if (
          normalizedBetType.includes("m baccarat b") &&
          normalizedBetName.includes("m baccarat b")
        ) {
          isMatch = true;
        } else if (
          normalizedBetType.includes("mbaccarat a") &&
          normalizedBetName.includes("mbaccarat a")
        ) {
          isMatch = true;
        } else if (
          normalizedBetType.includes("mbaccarat b") &&
          normalizedBetName.includes("mbaccarat b")
        ) {
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
          // For unsettled bets, show the stake as potential loss
          totalProfitLoss -= Number(stake) || 0;
        }
      }
    });

    return totalProfitLoss;
  };

  // Get odds data for each betting option
  const playerAOdds = getOddsData("1");
  const playerBOdds = getOddsData("2");
  const top9AOdds = getOddsData("3");
  const top9BOdds = getOddsData("4");
  const mbaccAOdds = getOddsData("5");
  const mbaccBOdds = getOddsData("6");

  return (
    <div className="w-full flex flex-col gap-1.5">
      {/* Betting Table */}
      <div className="bg-[var(--bg-table)] flex flex-col gap-1.5 border border-gray-100 p-1 md:p-0">
        <div className="flex md:flex-row flex-col gap-1.5">
          {/* Player A Section */}
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-300 px-2 py-1 text-left text-xs bg-gray-100">
                  Player A
                </th>
              </tr>
              <tr>
                <th className="border border-gray-300 px-2 py-1 text-center text-sm bg-gray-100">
                  Winner
                </th>
                <th className="border border-gray-300 px-2 py-1 text-center text-sm bg-gray-100">
                  Top 9
                </th>
                <th className="border border-gray-300 px-2 py-1 text-center text-sm bg-gray-100">
                  M Baccarat A
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-gray-50">
                <td
                  className="border border-gray-300 px-2 py-2 text-center text-sm cursor-pointer hover:bg-blue-100 bg-[var(--bg-back)] relative font-bold"
                  onClick={() => !isSuspended("1") && onBetClick("1", "back")}
                >
                  {isSuspended("1") && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                      <span className="text-white">
                        <RiLockFill className="text-xl" />
                      </span>
                      <h2
                        className={`text-xs font-semibold text-center ${
                          getBetProfitLoss("Player A", "winner") > 0
                            ? "text-green-600"
                            : getBetProfitLoss("Player A", "winner") < 0
                              ? "text-red-600"
                              : "text-gray-600"
                        }`}
                      >
                        {getBetProfitLoss("Player A", "winner") > 0 ? "+" : ""}
                        {getBetProfitLoss("Player A", "winner").toFixed(0)}
                      </h2>
                    </div>
                  )}
                  <div className="flex flex-col justify-center items-center h-full">
                    <h2 className="text-sm font-semibold">{playerAOdds?.b}</h2>
                    <h2
                      className={`text-xs font-semibold ${
                        getBetProfitLoss("Player A", "winner") > 0
                          ? "text-green-600"
                          : getBetProfitLoss("Player A", "winner") < 0
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {getBetProfitLoss("Player A", "winner") > 0 ? "+" : ""}
                      {getBetProfitLoss("Player A", "winner").toFixed(0)}
                    </h2>
                  </div>
                </td>
                <td
                  className="border border-gray-300 px-2 py-2 text-center text-sm cursor-pointer hover:bg-blue-100 bg-[var(--bg-back)] relative font-bold"
                  onClick={() => !isSuspended("3") && onBetClick("3", "back")}
                >
                  {isSuspended("3") && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                      <span className="text-white">
                        <RiLockFill className="text-xl" />
                      </span>
                      <h2
                        className={`text-xs font-semibold text-center ${
                          getBetProfitLoss("Top 9 A", "top9") > 0
                            ? "text-green-600"
                            : getBetProfitLoss("Top 9 A", "top9") < 0
                              ? "text-red-600"
                              : "text-gray-600"
                        }`}
                      >
                        {getBetProfitLoss("Top 9 A", "top9") > 0 ? "+" : ""}
                        {getBetProfitLoss("Top 9 A", "top9").toFixed(0)}
                      </h2>
                    </div>
                  )}
                  <div className="flex flex-col justify-center items-center h-full">
                    <h2 className="text-sm font-semibold">A</h2>
                    <h2
                      className={`text-xs font-semibold ${
                        getBetProfitLoss("Top 9 A", "top9") > 0
                          ? "text-green-600"
                          : getBetProfitLoss("Top 9 A", "top9") < 0
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {getBetProfitLoss("Top 9 A", "top9") > 0 ? "+" : ""}
                      {getBetProfitLoss("Top 9 A", "top9").toFixed(0)}
                    </h2>
                  </div>
                </td>
                <td
                  className="border border-gray-300 px-2 py-2 text-center text-sm cursor-pointer hover:bg-blue-100 bg-[var(--bg-back)] relative font-bold"
                  onClick={() => !isSuspended("5") && onBetClick("5", "back")}
                >
                  {isSuspended("5") && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                      <span className="text-white">
                        <RiLockFill className="text-xl" />
                      </span>
                      <h2
                        className={`text-xs font-semibold text-center ${
                          getBetProfitLoss("M Baccarat A", "mbaccarat") > 0
                            ? "text-green-600"
                            : getBetProfitLoss("M Baccarat A", "mbaccarat") < 0
                              ? "text-red-600"
                              : "text-gray-600"
                        }`}
                      >
                        {getBetProfitLoss("M Baccarat A", "mbaccarat") > 0
                          ? "+"
                          : ""}
                        {getBetProfitLoss("M Baccarat A", "mbaccarat").toFixed(
                          0
                        )}
                      </h2>
                    </div>
                  )}
                  <div className="flex flex-col justify-center items-center h-full">
                    <h2 className="text-sm font-semibold">{mbaccAOdds?.b}</h2>
                    <h2
                      className={`text-xs font-semibold ${
                        getBetProfitLoss("M Baccarat A", "mbaccarat") > 0
                          ? "text-green-600"
                          : getBetProfitLoss("M Baccarat A", "mbaccarat") < 0
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {getBetProfitLoss("M Baccarat A", "mbaccarat") > 0
                        ? "+"
                        : ""}
                      {getBetProfitLoss("M Baccarat A", "mbaccarat").toFixed(0)}
                    </h2>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Player B Section */}
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-300 px-2 py-1 text-left text-xs bg-gray-100">
                  Player B
                </th>
              </tr>
              <tr>
                <th className="border border-gray-300 px-2 py-1 text-center text-sm bg-gray-100">
                  Winner
                </th>
                <th className="border border-gray-300 px-2 py-1 text-center text-sm bg-gray-100">
                  Top 9
                </th>
                <th className="border border-gray-300 px-2 py-1 text-center text-sm bg-gray-100">
                  M Baccarat B
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-gray-50">
                <td
                  className="border border-gray-300 px-2 py-2 text-center text-sm cursor-pointer hover:bg-blue-100 bg-[var(--bg-back)] relative font-bold"
                  onClick={() => !isSuspended("2") && onBetClick("2", "back")}
                >
                  {isSuspended("2") && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                      <span className="text-white">
                        <RiLockFill className="text-xl" />
                      </span>
                      <h2
                        className={`text-xs font-semibold text-center ${
                          getBetProfitLoss("Player B", "winner") > 0
                            ? "text-green-600"
                            : getBetProfitLoss("Player B", "winner") < 0
                              ? "text-red-600"
                              : "text-gray-600"
                        }`}
                      >
                        {getBetProfitLoss("Player B", "winner") > 0 ? "+" : ""}
                        {getBetProfitLoss("Player B", "winner").toFixed(0)}
                      </h2>
                    </div>
                  )}
                  <div className="flex flex-col justify-center items-center h-full">
                    <h2 className="text-sm font-semibold">{playerBOdds?.b}</h2>
                    <h2
                      className={`text-xs font-semibold ${
                        getBetProfitLoss("Player B", "winner") > 0
                          ? "text-green-600"
                          : getBetProfitLoss("Player B", "winner") < 0
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {getBetProfitLoss("Player B", "winner") > 0 ? "+" : ""}
                      {getBetProfitLoss("Player B", "winner").toFixed(0)}
                    </h2>
                  </div>
                </td>
                <td
                  className="border border-gray-300 px-2 py-2 text-center text-sm cursor-pointer hover:bg-blue-100 bg-[var(--bg-back)] relative font-bold"
                  onClick={() => !isSuspended("4") && onBetClick("4", "back")}
                >
                  {isSuspended("4") && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                      <span className="text-white">
                        <RiLockFill className="text-xl" />
                      </span>
                      <h2
                        className={`text-xs font-semibold text-center ${
                          getBetProfitLoss("Top 9 B", "top9") > 0
                            ? "text-green-600"
                            : getBetProfitLoss("Top 9 B", "top9") < 0
                              ? "text-red-600"
                              : "text-gray-600"
                        }`}
                      >
                        {getBetProfitLoss("Top 9 B", "top9") > 0 ? "+" : ""}
                        {getBetProfitLoss("Top 9 B", "top9").toFixed(0)}
                      </h2>
                    </div>
                  )}
                  <div className="flex flex-col justify-center items-center h-full">
                    <h2 className="text-sm font-semibold">B</h2>
                    <h2
                      className={`text-xs font-semibold ${
                        getBetProfitLoss("Top 9 B", "top9") > 0
                          ? "text-green-600"
                          : getBetProfitLoss("Top 9 B", "top9") < 0
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {getBetProfitLoss("Top 9 B", "top9") > 0 ? "+" : ""}
                      {getBetProfitLoss("Top 9 B", "top9").toFixed(0)}
                    </h2>
                  </div>
                </td>
                <td
                  className="border border-gray-300 px-2 py-2 text-center text-sm cursor-pointer hover:bg-blue-100 bg-[var(--bg-back)] relative font-bold"
                  onClick={() => !isSuspended("6") && onBetClick("6", "back")}
                >
                  {isSuspended("6") && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                      <span className="text-white">
                        <RiLockFill className="text-xl" />
                      </span>
                      <h2
                        className={`text-xs font-semibold text-center ${
                          getBetProfitLoss("M Baccarat B", "mbaccarat") > 0
                            ? "text-green-600"
                            : getBetProfitLoss("M Baccarat B", "mbaccarat") < 0
                              ? "text-red-600"
                              : "text-gray-600"
                        }`}
                      >
                        {getBetProfitLoss("M Baccarat B", "mbaccarat") > 0
                          ? "+"
                          : ""}
                        {getBetProfitLoss("M Baccarat B", "mbaccarat").toFixed(
                          0
                        )}
                      </h2>
                    </div>
                  )}
                  <div className="flex flex-col justify-center items-center h-full">
                    <h2 className="text-sm font-semibold">{mbaccBOdds?.b}</h2>
                    <h2
                      className={`text-xs font-semibold ${
                        getBetProfitLoss("M Baccarat B", "mbaccarat") > 0
                          ? "text-green-600"
                          : getBetProfitLoss("M Baccarat B", "mbaccarat") < 0
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {getBetProfitLoss("M Baccarat B", "mbaccarat") > 0
                        ? "+"
                        : ""}
                      {getBetProfitLoss("M Baccarat B", "mbaccarat").toFixed(0)}
                    </h2>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Results */}
      <div className="mt-1 flex flex-col gap-1">
        <div className="bg-[var(--bg-secondary85)] border border-gray-300 flex justify-between px-2 py-.5 items-center">
          <h2 className="text-sm font-normal leading-8 text-white">
            Last Result
          </h2>
          <h2
            onClick={() => navigate(`/reports/casino-result-report?game=${apiGameType}`)}
            className="text-sm font-normal leading-8 text-white cursor-pointer hover:text-gray-200"
          >
            View All
          </h2>
        </div>
        <div className="flex justify-end items-center mb-2 gap-2 mx-2">
          {Array.isArray(results) &&
            results?.map((item: any, index: number) => {
              const matchId = item?.mid || item?.roundId || item?.id || item?.matchId || item?.result?.mid;
              return (
                <div
                  key={item?.mid || index}
                  className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-sm font-semibold ${item.win === "1" ? "text-red-500" : "text-yellow-500"} ${
                    matchId ? "cursor-pointer hover:scale-110 transition-transform select-none" : ""
                  }`}
                  title={`${item.win === "1" ? "A" : "B"}${matchId ? " - Click to view details" : ""}`}
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
                  {item.win === "1" ? "A" : "B"}
                </div>
              );
            })}
        </div>
      </div>

      {/* Individual Result Modal */}
      <IndividualResultModal
        isOpen={isResultModalOpen}
        onClose={() => {
          setIsResultModalOpen(false);
          setSelectedResultId(null);
        }}
        resultId={selectedResultId}
        gameType={apiGameType}
        title={`${gameName || "Teen Muf"} Result Details`}
        enableBetFiltering={true}
      />
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const TeenMuf = memoizeCasinoComponent(TeenMufComponent);
TeenMuf.displayName = "TeenMuf";

export default TeenMuf;
