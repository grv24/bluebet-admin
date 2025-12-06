import React from "react";
import { RiLockFill } from "react-icons/ri";
// import IndividualResultModal from "@/components/casino/IndividualResultModal";
// import { useIndividualResultModal } from "@/hooks/useIndividualResultModal";
import { useNavigate } from "react-router-dom";
import { memoizeCasinoComponent } from "../../../utils/casinoMemo";

interface Lucky715Props {
  casinoData: any;
  remainingTime: number;
  onBetClick: (sid: string, type: "back" | "lay") => void;
  results?: any[];
  gameCode?: string;
  gameName?: string;
  currentBet?: any;
}

const Lucky715Component: React.FC<Lucky715Props> = ({
  casinoData,
  remainingTime,
  onBetClick,
  results = [],
  gameCode,
  gameName,
  currentBet,
}) => {
  // const resultModal = useIndividualResultModal();
  const navigate = useNavigate();
  // Get game slug from gameCode for navigation
  const gameSlug = React.useMemo(() => {
    if (gameCode) {
      return gameCode.toLowerCase().replace(/[^a-z0-9]/g, "");
    }
    return "lucky15"; // Default fallback
  }, [gameCode]);
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
    const hasNoOdds = !row.b || row.b === 0;

    return isStatusSuspended || isTimeSuspended || hasNoOdds;
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

  // Profit/Loss calculation function
  const getBetProfitLoss = React.useCallback((betType: string): number => {
    if (!currentBet?.data || !casinoData?.data?.mid) return 0;

    const currentMatchId = casinoData.data.mid;
    let totalProfitLoss = 0;

    // Only bets for this match
    const bets = currentBet.data.filter(
      (bet: any) => String(bet.matchId) === String(currentMatchId)
    );

    // Find the sid for the requested bet type by matching with odds data
    const requestedOdd = oddsData.find((odd: any) => 
      odd?.nat && odd.nat.toLowerCase().trim() === betType.toLowerCase().trim()
    );
    const requestedSid = requestedOdd?.sid ? String(requestedOdd.sid) : null;

    bets.forEach((bet: any) => {
      const { sid, betName: currentBetName, name, nation: betNation, oddCategory, stake, betRate } = bet.betData;
      const result = bet.betData?.result;

      // Use either betName, name, or nation field
      const actualBetName = currentBetName || name || betNation;
      const betSid = sid ? String(sid) : null;
      
      // Check if this bet matches the requested bet type
      let isMatch = false;
      
      // Match by sid first (most reliable)
      if (requestedSid && betSid && requestedSid === betSid) {
        isMatch = true;
      }
      // Match by name
      else if (actualBetName && typeof actualBetName === 'string') {
        const actualBetNameLower = actualBetName.toLowerCase().trim();
        const requestedBetTypeLower = betType.toLowerCase().trim();
        
        // Exact match
        if (actualBetNameLower === requestedBetTypeLower) {
          isMatch = true;
        }
        // Match "0 Runs", "1 Runs", etc. - need to match the full number
        else if (requestedBetTypeLower.includes("runs") && actualBetNameLower.includes("runs")) {
          // Extract numbers from both
          const requestedNum = requestedBetTypeLower.match(/\d+/)?.[0];
          const actualNum = actualBetNameLower.match(/\d+/)?.[0];
          if (requestedNum && actualNum && requestedNum === actualNum) {
            isMatch = true;
          }
        }
        // Match "Wicket" exactly
        else if (requestedBetTypeLower.includes("wicket") && actualBetNameLower.includes("wicket")) {
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
          
          if (oddCategory?.toLowerCase() === "back") {
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
          }
        }
      } else {
        // For other options (mutually exclusive), show potential loss if this bet loses
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
  }, [currentBet, casinoData, oddsData]);

  // Handle clicking on individual result to show details
  const handleResultClick = (result: any) => {
    const resultId = result?.mid || result?.roundId || result?.id || result?.matchId;
    
    if (!resultId) {
      console.error("🎰 Lucky715: No result ID found in result", result);
      return;
    }
    
    if (!gameSlug) {
      console.error("🎰 Lucky715: No gameSlug available", { gameCode, gameSlug });
      return;
    }
    
    // resultModal.openModal(String(resultId), result);
  };

  // Map win value to display info
  const getResultDisplay = (win: string) => {
    // Find the odds data for this win value (win is the sid)
    const odd = oddsData.find((item: any) => String(item.sid) === String(win));

    if (odd) {
      // Extract label from nat (e.g., "0 Runs" -> "0", "1 Runs" -> "1", "Wicket" -> "W")
      const nat = odd.nat || "";
      if (nat.includes("Runs")) {
        const runsMatch = nat.match(/(\d+)\s*Runs?/i);
        if (runsMatch) {
          return { label: runsMatch[1], color: "text-blue-500", title: nat };
        }
      } else if (nat.toLowerCase().includes("wicket")) {
        return { label: "W", color: "text-red-500", title: nat };
      }
    }

    // Fallback mapping
    const winMap: {
      [key: string]: { label: string; color: string; title: string };
    } = {
      "1": { label: "0", color: "text-white", title: "0 Runs" },
      "2": { label: "1", color: "text-white", title: "1 Runs" },
      "3": { label: "2", color: "text-white", title: "2 Runs" },
      "4": { label: "4", color: "text-white", title: "4 Runs" },
      "5": { label: "6", color: "text-white", title: "6 Runs" },
      "6": { label: "W", color: "text-white", title: "Wicket" },
    };

    return (
      winMap[win] || { label: win, color: "text-gray-400", title: "Unknown" }
    );
  };

  return (
    <div>
      <div className="bg-[var(--bg-secondary85)]">
        <h1 className="text-white text-sm leading-6 px-2 font-semibold">
          Runs
        </h1>
      </div>
      {/* table */}
      <div className="md:grid grid-cols-3 hidden place-items-center place-content-center">
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
            {[oddsData[0], oddsData[3]]?.map((odd: any) => {
              const locked = isLocked(odd);
              const oddsValue = odd?.b || 0;
              const profitLoss = currentBet?.data ? getBetProfitLoss(odd?.nat || "") : 0;

              return (
                <tr
                  key={odd?.sid}
                  className="border-b border-t border-gray-300"
                >
                  <td className="w-1/2">
                    <div className="flex items-center gap-1">
                      <h2 className="text-sm font-normal px-2">{odd?.nat}</h2>
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
                  </td>
                  <td
                    className="bg-[var(--bg-back)] text-sm font-semibold relative cursor-pointer"
                    onClick={() =>
                      !locked &&
                      odd?.sid &&
                      onBetClick(odd?.sid.toString(), "back")
                    }
                  >
                    {locked && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                        <span className="text-white">
                          <RiLockFill className="text-xl" />
                        </span>
                      </div>
                    )}
                    <div className="flex flex-col justify-center items-center h-full">
                      <h2 className="text-sm font-semibold">
                        {formatOdds(oddsValue)}
                      </h2>
                    </div>
                  </td>
                  <td className="px-2">
                    <h2 className="text-[var(--bg-primary)] text-[11px] font-semibold">
                      Min {odd?.min || 0}
                    </h2>
                    <h2 className="text-[var(--bg-primary)] text-[11px] font-semibold">
                      Max {odd?.max || 0}
                    </h2>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <table className="w-full">
          <thead>
            <tr className="">
              <th className="w-1/2"></th>
              <th className="w-1/4 bg-[var(--bg-back)]">
                <h2 className="text-xs font-semibold leading-8">Back</h2>
              </th>
              <th className="w-1/4"></th>
            </tr>
          </thead>
          <tbody>
            {[oddsData[1], oddsData[4]].map((odd: any) => {
              const locked = isLocked(odd);
              const oddsValue = odd?.b || 0;
              const profitLoss = currentBet?.data ? getBetProfitLoss(odd?.nat || "") : 0;

              return (
                <tr
                  key={odd?.sid}
                  className="border-b md:border-t border-gray-300"
                >
                  <td className="w-1/2">
                    <div className="flex items-center gap-1">
                      <h2 className="text-sm font-normal px-2">{odd?.nat}</h2>
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
                  </td>
                  <td
                    className="bg-[var(--bg-back)] w-1/4 text-sm font-semibold relative cursor-pointer"
                    onClick={() =>
                      !locked &&
                      odd?.sid &&
                      onBetClick(odd?.sid.toString(), "back")
                    }
                  >
                    {locked && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                        <span className="text-white">
                          <RiLockFill className="text-xl" />
                        </span>
                      </div>
                    )}
                    <div className="flex flex-col justify-center items-center h-full">
                      <h2 className="text-sm font-semibold">
                        {formatOdds(oddsValue)}
                      </h2>
                    </div>
                  </td>
                  <td className="px-2">
                    <h2 className="text-[var(--bg-primary)] text-[11px] font-semibold">
                      Min {odd?.min || 0}
                    </h2>
                    <h2 className="text-[var(--bg-primary)] text-[11px] font-semibold">
                      Max {odd?.max || 0}
                    </h2>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>{" "}
        <table className="w-full">
          <thead>
            <tr className="">
              <th className="w-1/2"></th>
              <th className="w-1/4 bg-[var(--bg-back)]">
                <h2 className="text-xs font-semibold leading-8">Back</h2>
              </th>
              <th className="w-1/4"></th>
            </tr>
          </thead>
          <tbody>
            {[oddsData[2], oddsData[5]].map((odd: any) => {
              const locked = isLocked(odd);
              const oddsValue = odd?.b || 0;
              const profitLoss = currentBet?.data ? getBetProfitLoss(odd?.nat || "") : 0;

              return (
                <tr
                  key={odd?.sid}
                  className="border-b border-t border-gray-300"
                >
                  <td className="w-1/2">
                    <div className="flex items-center gap-1">
                      <h2 className="text-sm font-normal px-2">{odd?.nat}</h2>
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
                  </td>
                  <td
                    className="bg-[var(--bg-back)] w-1/4 text-sm font-semibold relative cursor-pointer"
                    onClick={() =>
                      !locked &&
                      odd?.sid &&
                      onBetClick(odd?.sid.toString(), "back")
                    }
                  >
                    {locked && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                        <span className="text-white">
                          <RiLockFill className="text-xl" />
                        </span>
                      </div>
                    )}
                    <div className="flex flex-col justify-center items-center h-full">
                      <h2 className="text-sm font-semibold">
                        {formatOdds(oddsValue)}
                      </h2>
                    </div>
                  </td>
                  <td className="px-2">
                    <h2 className="text-[var(--bg-primary)] text-[11px] font-semibold">
                      Min {odd?.min || 0}
                    </h2>
                    <h2 className="text-[var(--bg-primary)] text-[11px] font-semibold">
                      Max {odd?.max || 0}
                    </h2>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="md:hidden grid grid-cols-1 place-items-center place-content-center">
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
            {oddsData?.map((odd: any) => {
              const locked = isLocked(odd);
              const oddsValue = odd?.b || 0;
              const profitLoss = currentBet?.data ? getBetProfitLoss(odd?.nat || "") : 0;

              return (
                <tr
                  key={odd?.sid}
                  className="border-b border-t border-gray-300"
                >
                  <td className="w-1/2">
                    <div className="flex items-center gap-1">
                      <h2 className="text-sm font-normal px-2">{odd?.nat}</h2>
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
                  </td>
                  <td
                    className="bg-[var(--bg-back)] text-sm font-semibold relative cursor-pointer"
                    onClick={() =>
                      !locked &&
                      odd?.sid &&
                      onBetClick(odd?.sid.toString(), "back")
                    }
                  >
                    {locked && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                        <span className="text-white">
                          <RiLockFill className="text-xl" />
                        </span>
                      </div>
                    )}
                    <div className="flex flex-col justify-center items-center h-full">
                      <h2 className="text-sm font-semibold">
                        {formatOdds(oddsValue)}
                      </h2>
                    </div>
                  </td>
                  <td className="px-2">
                    <h2 className="text-[var(--bg-primary)] text-[11px] font-semibold">
                      Min {odd?.min || 0}
                    </h2>
                    <h2 className="text-[var(--bg-primary)] text-[11px] font-semibold">
                      Max {odd?.max || 0}
                    </h2>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Results Section */}
      <div className="mt-1 flex flex-col gap-1">
        <div className="bg-[var(--bg-secondary85)] border border-gray-300 flex justify-between px-2 py-.5 items-center">
          <h2 className="text-sm font-normal leading-8 text-white">
            Last Result
          </h2>
          <h2
            onClick={() => navigate(`/casino-result?game=LUCKY15`)}
            className="text-sm font-normal leading-8 text-white"
          >
            View All
          </h2>
        </div>
        <div className="flex justify-end items-center mb-2 gap-2 mx-2 flex-wrap">
          {Array.isArray(results) && results.length > 0 ? (
            results.slice(0, 10).map((item: any, index: number) => {
              const resultDisplay = getResultDisplay(item.win || "");
              return (
                <div
                  key={item.mid || `result-${item.win}-${index}`}
                  className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-xs font-semibold text-white cursor-pointer hover:scale-110 transition-transform`}
                  onClick={() => handleResultClick(item)}
                  title={`Round ID: ${item.mid || "N/A"} - Winner: ${resultDisplay.title} - Click to view details`}
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
      {/* <IndividualResultModal
        isOpen={resultModal.isOpen}
        onClose={resultModal.closeModal}
        resultId={resultModal.selectedResultId || undefined}
        gameType={gameSlug}
        title={`${gameName || "Lucky15"} Result Details`}
      /> */}
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const Lucky715 = memoizeCasinoComponent(Lucky715Component);
Lucky715.displayName = "Lucky715";

export default Lucky715;
