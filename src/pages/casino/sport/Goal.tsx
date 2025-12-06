import React, { useState, useMemo } from "react";
import { RiLockFill } from "react-icons/ri";
// import IndividualResultModal from "@/components/casino/IndividualResultModal";
// import { useIndividualResultModal } from "@/hooks/useIndividualResultModal";
import { useNavigate } from "react-router-dom";
import { memoizeCasinoComponent } from "../../../utils/casinoMemo";

interface GoalProps {
  casinoData: any;
  remainingTime: number;
  onBetClick: (sid: string, type: "back" | "lay") => void;
  results: any;
  gameSlug?: string;
  gameName?: string;
  currentBet: any;
}

const GoalComponent: React.FC<GoalProps> = ({
  casinoData,
  remainingTime,
  onBetClick,
  results,
  gameSlug = "goal",
  gameName = "Goal",
  currentBet,
}) => {
  const navigate = useNavigate();
  // const resultModal = useIndividualResultModal();

  // Normalize game slug for IndividualResultModal
  const normalizedGameSlug = useMemo(() => {
    if (gameSlug) {
      const lowerCaseSlug = gameSlug.toLowerCase();
      if (lowerCaseSlug === "goal") {
        return "goal";
      }
      return lowerCaseSlug.replace(/[^a-z0-9]/g, "");
    }
    return "goal"; // Default fallback
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

  const getOddsData = (sid: string) => {
    // Handle new API response format (goal game)
    if (casinoData?.data?.sub) {
      return casinoData.data.sub.find(
        (item: any) => item.sid === parseInt(sid)
      );
    }
    // Handle legacy format
    if (!casinoData?.data?.data?.data?.sub) return null;
    return casinoData.data.data.data.sub.find(
      (item: any) => item.sid === parseInt(sid)
    );
  };

  /**
   * Handle clicking on individual result to show details
   */
  const handleResultClick = (result: any) => {
    const resultId = result?.mid || result?.roundId || result?.id || result?.matchId;
    if (!resultId) {
      console.error("🎯 Goal: No result ID found in result", result);
      alert("Unable to open result details: Missing result ID");
      return;
    }
    // resultModal.openModal(String(resultId), result);
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

  // Get player odds (sid 1-10)
  const getPlayerOdds = () => {
    // Handle new API response format (goal game)
    if (casinoData?.data?.sub) {
      return casinoData.data.sub.filter(
        (item: any) => item.subtype === "player" && item.sid <= 10
      );
    }
    // Handle legacy format
    if (!casinoData?.data?.data?.data?.sub) return [];
    return casinoData.data.data.data.sub.filter(
      (item: any) => item.subtype === "player" && item.sid <= 10
    );
  };

  // Get goal method odds (sid 11-15)
  const getGoalMethodOdds = () => {
    // Handle new API response format (goal game)
    if (casinoData?.data?.sub) {
      return casinoData.data.sub.filter((item: any) => item.subtype === "goal");
    }
    // Handle legacy format
    if (!casinoData?.data?.data?.data?.sub) return [];
    return casinoData.data.data.data.sub.filter(
      (item: any) => item.subtype === "goal"
    );
  };

  const playerOdds = getPlayerOdds();
  const goalMethodOdds = getGoalMethodOdds();
  const remark =
    casinoData?.data?.remark ||
    casinoData?.data?.data?.data?.remark ||
    "Results are based on stream only";

  const getResultDisplay = (win: string) => {
    // Map win values to display names
    const resultMap: { [key: string]: string } = {
      "1": "CR7",
      "2": "Messi",
      "3": "Lewa",
      "4": "Neymar",
      "5": "Kane",
      "6": "Ibra",
      "7": "Lukaku",
      "8": "Mbappe",
      "9": "Haaland",
      "10": "No Goal",
      "11": "Shot",
      "12": "Header",
      "13": "Penalty",
      "14": "Free Kick",
      "15": "No Goal",
    };
    return resultMap[win] || win;
  };

  /**
   * Calculate profit/loss for individual Goal betting types with cross-calculation like Dragon/Tiger
   * @param betType - The type of bet to calculate profit/loss for (e.g., "CR7", "Messi", "Shot", "Header")
   * @param groupType - The group type: "player" or "method"
   * @returns The profit/loss amount with cross-calculation
   */
  const getBetProfitLoss = (betType: string, groupType: "player" | "method"): number => {
    if (!currentBet?.data || !casinoData?.data?.mid) return 0;

    const currentMatchId = casinoData.data.mid;
    let profitLoss = 0;

    // Only bets for this match
    const bets = currentBet.data.filter(
      (bet: any) => String(bet.matchId) === String(currentMatchId)
    );

    bets.forEach((bet: any) => {
      const { betName, oddCategory, stake, betRate } = bet.betData;

      // Normalize bet name for comparison
      const normalizedBetName = betName?.toLowerCase() || "";
      const normalizedBetType = betType.toLowerCase();

      // Check if this bet belongs to the same group
      let isSameGroup = false;
      let isExactMatch = false;

      if (groupType === "player") {
        // Handle player bets (Who Will Goal Next?)
        const playerMap: { [key: string]: string[] } = {
          "cr7": ["cr7", "cristiano", "ronaldo"],
          "messi": ["messi", "lionel"],
          "lewa": ["lewa", "lewandowski"],
          "neymar": ["neymar"],
          "kane": ["kane", "harry"],
          "ibra": ["ibra", "ibrahimovic"],
          "lukaku": ["lukaku"],
          "mbappe": ["mbappe"],
          "haaland": ["haaland"],
          "no goal": ["no goal", "no-goal", "nogal"]
        };

        // Check if this bet is a player bet
        const allPlayerVariations = Object.values(playerMap).flat();
        isSameGroup = allPlayerVariations.some(variation => 
          normalizedBetName.includes(variation) || variation.includes(normalizedBetName)
        );

        // Check if it's an exact match
        const playerVariations = playerMap[normalizedBetType] || [normalizedBetType];
        isExactMatch = playerVariations.some(variation => 
          normalizedBetName.includes(variation) || variation.includes(normalizedBetName)
        );
      } else if (groupType === "method") {
        // Handle method bets (Method Of Next Goal)
        const methodMap: { [key: string]: string[] } = {
          "shot": ["shot", "shots"],
          "header": ["header", "headers"],
          "penalty": ["penalty", "penalties"],
          "free kick": ["free kick", "free-kick", "freekick"],
          "no goal": ["no goal", "no-goal", "nogal"]
        };

        // Check if this bet is a method bet
        const allMethodVariations = Object.values(methodMap).flat();
        isSameGroup = allMethodVariations.some(variation => 
          normalizedBetName.includes(variation) || variation.includes(normalizedBetName)
        );

        // Check if it's an exact match
        const methodVariations = methodMap[normalizedBetType] || [normalizedBetType];
        isExactMatch = methodVariations.some(variation => 
          normalizedBetName.includes(variation) || variation.includes(normalizedBetName)
        );
      }

      if (isSameGroup) {
        if (isExactMatch) {
          // Exact match - calculate profit/loss like Dragon/Tiger
          if (oddCategory.toLowerCase() === "back") {
            const profit = stake * (betRate - 1);
            profitLoss += profit; // Show profit potential
          } else if (oddCategory.toLowerCase() === "lay") {
            const loss = stake * (betRate - 1);
            const profit = stake;
            profitLoss += profit - loss; // Show net profit/loss
          }
        } else {
          // Different option in same group - show loss (like Dragon/Tiger cross-calculation)
          if (oddCategory.toLowerCase() === "back") {
            profitLoss += -stake; // Loss if this option wins instead
          } else if (oddCategory.toLowerCase() === "lay") {
            profitLoss += stake; // Profit if this option wins instead
          }
        }
      }
    });

    return profitLoss;
  };

  console.log(results, "from goal");
  return (
    <div className="w-full flex flex-col gap-1">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mt-1">
        {/* Who Will Goal Next */}
        <div className="w-full bg-[var(--bg-table-row)]">
          <div className="border bg-[var(--bg-secondary85)] text-start text-white px-2 py-1">
            <h2 className="text-sm font-semibold">Who Will Goal Next?</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr>
                <th className="w-1/2"></th>
                <th className="w-1/4 bg-[var(--bg-back)]">
                  <h2 className="text-xs font-semibold leading-8">Back</h2>
                </th>
                <th className="w-1/4"></th>
              </tr>
            </thead>
            <tbody>
              {playerOdds.map((player: any) => (
                <tr
                  key={player.sid}
                  className="border-b border-t border-gray-300"
                >
                  <td className="w-1/2">
                    <h2 className="text-sm font-semibold px-2">{player.nat}</h2>
                    <h2 className={`text-xs px-2 font-semibold ${
                        getBetProfitLoss(player.nat, "player") > 0
                          ? "text-green-600"
                          : getBetProfitLoss(player.nat, "player") < 0
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}>
                        {getBetProfitLoss(player.nat, "player") > 0 ? "+" : ""}
                        {getBetProfitLoss(player.nat, "player").toFixed(0)}
                      </h2>
                  </td>
                  <td
                    className="bg-[var(--bg-back)] text-sm font-semibold relative cursor-pointer"
                    onClick={() =>
                      !isSuspended(player.sid.toString()) &&
                      onBetClick(player.sid.toString(), "back")
                    }
                  >
                    {isSuspended(player.sid.toString()) && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                        <span className="text-white">
                          <RiLockFill className="text-xl" />
                        </span>
                       
                      </div>
                    )}
                    <div className="flex flex-col justify-center items-center h-full">
                      <h2 className="text-sm font-semibold">
                        {player.b}
                      </h2>
                    
                    </div>
                  </td>
                  <td className="px-2">
                    <h2 className="text-[var(--bg-primary)] text-xs font-semibold">
                      Min {player.min}
                    </h2>
                    <h2 className="text-[var(--bg-primary)] text-xs font-semibold">
                      Max {player.max}
                    </h2>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Method Of Next Goal */}
        <div className="w-full bg-[var(--bg-table-row)]">
          <div className="border bg-[var(--bg-secondary85)] text-start text-white px-2 py-1">
            <h2 className="text-sm font-semibold">Method Of Next Goal</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr>
                <th className="w-1/2"></th>
                <th className="w-1/4 bg-[var(--bg-back)]">
                  <h2 className="text-xs font-semibold leading-8">Back</h2>
                </th>
                <th className="w-1/4"></th>
              </tr>
            </thead>
            <tbody>
              {goalMethodOdds.map((method: any) => (
                <tr
                  key={method.sid}
                  className="border-b border-t border-gray-300"
                >
                  <td className="w-1/2">
                    <h2 className="text-sm font-semibold px-2">{method.nat}</h2>
                    <h2 className={`text-xs font-semibold px-2 ${
                        getBetProfitLoss(method.nat, "method") > 0
                          ? "text-green-600"
                          : getBetProfitLoss(method.nat, "method") < 0
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}>
                        {getBetProfitLoss(method.nat, "method") > 0 ? "+" : ""}
                        {getBetProfitLoss(method.nat, "method").toFixed(0)}
                      </h2>
                  </td>
                  <td
                    className="bg-[var(--bg-back)] relative cursor-pointer hover:bg-blue-100"
                    onClick={() =>
                      !isSuspended(method.sid.toString()) &&
                      onBetClick(method.sid.toString(), "back")
                    }
                  >
                    {isSuspended(method.sid.toString()) && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                        <span className="text-white">
                          <RiLockFill className="text-xl" />
                        </span>
                      
                      </div>
                    )}
                    <div className="flex flex-col justify-center items-center h-full">
                      <h2 className="text-sm font-semibold">
                        {method.b}
                      </h2>
                    
                    </div>
                  </td>
                  <td className="px-2">
                    <h2 className="text-[var(--bg-primary)] text-xs font-semibold">
                      Min {method.min}
                    </h2>
                    <h2 className="text-[var(--bg-primary)] text-xs font-semibold">
                      Max {method.max}
                    </h2>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* marquee */}
      <div className="w-full  flex bg-white text-[var(--bg-primary)] overflow-hidden">
        <div className="whitespace-nowrap flex items-center text-xs h-6 font-extrabold uppercase tracking-wide animate-marquee">
          {remark}
        </div>
      </div>

      {/* Results */}
      <div className="flex flex-col gap-1">
        <div className="bg-[var(--bg-secondary85)] border border-gray-300 flex justify-between px-2 py-.5 items-center">
          <h2 className="text-sm font-normal leading-8 text-white">
            Last Result
          </h2>
          <h2
            onClick={() => navigate(`/casino-result?game=GOAL`)}
            className="text-sm font-normal leading-8 text-white cursor-pointer"
          >
            View All
          </h2>
        </div>
        <div className="flex justify-end items-center mb-2 gap-1 mx-2">
          {Array.isArray(results) &&
            results?.slice(0, 10).map((item: any, index: number) => (
              <h2
                key={index}
                className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-sm font-semibold text-yellow-400 cursor-pointer hover:scale-110 transition-transform`}
                onClick={() => handleResultClick(item)}
                title="Click to view details"
              >
                {/* {getResultDisplay(item?.win)} */}R
              </h2>
            ))}
        </div>
      </div>

      {/* Individual Result Details Modal */}
      {/* <IndividualResultModal
        isOpen={resultModal.isOpen}
        onClose={resultModal.closeModal}
        resultId={resultModal.selectedResultId || undefined}
        gameType={normalizedGameSlug}
        title={`${gameName || "Goal"} Result Details`}
        enableBetFiltering={true}
        customGetFilteredBets={getFilteredBets}
      /> */}
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const Goal = memoizeCasinoComponent(GoalComponent);
Goal.displayName = "Goal";

export default Goal;
