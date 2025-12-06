import React, { useMemo } from "react";
import { RiLockFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
// import IndividualResultModal from "@/components/casino/IndividualResultModal";
// import { useIndividualResultModal } from "@/hooks/useIndividualResultModal";
import { memoizeCasinoComponent } from "../../../utils/casinoMemo";

interface Onecard2020Props {
  casinoData: any;
  remainingTime: number;
  onBetClick: (sid: string, type: "back" | "lay") => void;
  results?: any[];
  gameCode?: string;
  gameName?: string;
  currentBet?: any;
}

const Onecard2020Component: React.FC<Onecard2020Props> = ({
  casinoData,
  remainingTime,
  onBetClick,
  results = [],
  gameCode,
  currentBet,
}) => {
  const navigate = useNavigate();
  // const resultModal = useIndividualResultModal();

  // Get game slug from gameCode for navigation
  const gameSlug = gameCode?.toLowerCase() || "teen120";
  
  // Normalize game slug for IndividualResultModal
  const normalizedGameSlug = useMemo(() => {
    if (gameCode) {
      const lowerCaseCode = gameCode.toLowerCase();
      if (lowerCaseCode === "teen_120" || lowerCaseCode === "teen120" || lowerCaseCode === "onecard2020") {
        return "teen120";
      }
      return lowerCaseCode.replace(/[^a-z0-9]/g, "");
    }
    return "teen120"; // Default fallback
  }, [gameCode]);
  // Get odds data from sub array
  // Handle both API format (data.sub) and socket format (data.current.sub)
  const getOddsData = (sid: number) => {
    const subArray =
      casinoData?.data?.sub ||
      casinoData?.data?.current?.sub ||
      casinoData?.data?.data?.data?.sub ||
      casinoData?.data?.current?.data?.sub ||
      [];
    return (
      subArray.find(
        (item: any) => item.sid === sid || String(item.sid) === String(sid)
      ) || null
    );
  };

  // Check if betting is suspended
  const isLocked = (row: any): boolean => {
    if (!row) return true;

    const status = row.gstatus;
    const gval = row.gval;

    // Check gstatus - if status is explicitly "OPEN", it should be unlocked (unless gval overrides)
    const isStatusOpen = status === "OPEN" || status === "open";
    
    // Check gstatus - if status is suspended/closed
    const isStatusSuspended =
      status === "SUSPENDED" ||
      status === "CLOSED" ||
      Number(status) === 0 ||
      status === "0" ||
      String(status) === "0";

    // Check gval - if gval === 1, betting is suspended (only if gval is explicitly set)
    // gval can override OPEN status, but if gval is undefined/missing, trust gstatus
    const isGvalSuspended = gval !== undefined && gval !== null && (gval === 1 || gval === "1");

    const isTimeSuspended = remainingTime <= 3;

    // If status is explicitly OPEN and gval is not 1 (or undefined), it should be unlocked
    // unless time is low
    if (isStatusOpen && !isGvalSuspended) {
      return isTimeSuspended;
    }

    // Lock if:
    // 1. Status is suspended/closed
    // 2. gval is 1 (suspended) - this can override OPEN status
    // 3. Time is low (<= 3 seconds)
    return (
      isStatusSuspended ||
      isGvalSuspended ||
      isTimeSuspended
    );
  };

  // Format odds display
  const formatOdds = (value: number | string | undefined): string => {
    if (value === undefined || value === null) return "0";
    const num = Number(value);
    if (isNaN(num) || num === 0) return "0";
    return num.toFixed(2);
  };

  // Profit/Loss calculation function
  const getBetProfitLoss = (betType: string): number => {
    if (!currentBet?.data || !casinoData?.data?.mid) return 0;

    const currentMatchId = casinoData.data.mid;
    let totalProfitLoss = 0;

    // Only bets for this match
    const bets = currentBet.data.filter(
      (bet: any) => String(bet.matchId) === String(currentMatchId)
    );

    bets.forEach((bet: any) => {
      const { sid, betName: currentBetName, name, nation: betNation, oddCategory, stake, betRate } = bet.betData;
      const result = bet.betData?.result;

      // Use either betName, name, or nation field
      const actualBetName = currentBetName || name || betNation;
      
      if (actualBetName && typeof actualBetName === 'string') {
        const actualBetNameLower = actualBetName.toLowerCase().trim();
        const requestedBetTypeLower = betType.toLowerCase().trim();
        
        // Precise matching to avoid cross-matching between different bet types
        let isMatch = false;
        let isOppositeMatch = false; // For mutually exclusive bets (Player vs Dealer)
        
        // Exact match first
        if (actualBetNameLower === requestedBetTypeLower) {
          isMatch = true;
        }
        // Match "Player" - must be exactly "Player" (not "Player A" etc.)
        else if (requestedBetTypeLower === "player") {
          isMatch = actualBetNameLower === "player" || 
                   actualBetNameLower.includes("player");
          // Also check for opposite (Dealer) for cross-calculation
          isOppositeMatch = actualBetNameLower === "dealer" || 
                          actualBetNameLower.includes("dealer");
        }
        // Match "Dealer" - must be exactly "Dealer"
        else if (requestedBetTypeLower === "dealer") {
          isMatch = actualBetNameLower === "dealer" || 
                   actualBetNameLower.includes("dealer");
          // Also check for opposite (Player) for cross-calculation
          isOppositeMatch = actualBetNameLower === "player" || 
                          actualBetNameLower.includes("player");
        }
        // Match "Tie" - independent bet
        else if (requestedBetTypeLower === "tie") {
          isMatch = actualBetNameLower === "tie" || 
                   actualBetNameLower.includes("tie");
        }
        // Match "Pair" - independent bet
        else if (requestedBetTypeLower === "pair") {
          isMatch = actualBetNameLower === "pair" || 
                   actualBetNameLower.includes("pair");
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
        } else if (isOppositeMatch) {
          // Cross-calculation: For mutually exclusive bets (Player vs Dealer)
          // If betting on Player, Dealer shows profit (and vice versa)
          // This is because they are mutually exclusive - if one loses, the other wins
          if (result && result.settled) {
            // If the opposite bet is settled, use its result
            let profitLoss = 0;
            if (result.status === "won" || result.status === "profit") {
              profitLoss = Number(result.profitLoss) || 0;
            } else if (result.status === "lost") {
              profitLoss = Number(result.profitLoss) || 0;
            }
            totalProfitLoss += profitLoss;
          } else {
            // For unsettled opposite bets, calculate potential profit
            const stakeAmount = Number(stake) || 0;
            const rate = Number(betRate) || 0;
            
            if (oddCategory.toLowerCase() === "back") {
              // If opposite bet wins, you get profit
              const profit = rate > 0 ? stakeAmount * (rate - 1) : 0;
              totalProfitLoss += profit;
            } else if (oddCategory.toLowerCase() === "lay") {
              // If opposite bet wins (your lay loses), you pay out
              const loss = rate > 0 ? stakeAmount * (rate - 1) : 0;
              const profit = stakeAmount;
              totalProfitLoss += profit - loss;
            }
          }
        }
      }
    });

    return totalProfitLoss;
  };

  // Get odds data for each betting option
  const playerRow = getOddsData(1); // Player
  const dealerRow = getOddsData(2); // Dealer
  const tieRow = getOddsData(3); // Tie
  const pairRow = getOddsData(4); // Pair

  // Map win value to display info
  const getResultDisplay = (win: string) => {
    switch (win) {
      case "1":
        return { label: "P", color: "text-red-500", title: "Player" };
      case "2":
        return { label: "D", color: "text-yellow-500", title: "Dealer" };
      case "3":
        return { label: "T", color: "text-yellow-500", title: "Tie" };
      case "4":
        return { label: "PR", color: "text-green-500", title: "Pair" };
      default:
        return { label: "N", color: "text-gray-400", title: "Unknown" };
    }
  };

  // Handle clicking on individual result to show details
  const handleResultClick = (result: any) => {
    if (!result?.mid) return;
    // resultModal.openModal(result.mid, result);
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
        case "pending":
          return status === "pending" || status === "matched";
        case "won":
          return status === "won" || status === "settled";
        case "lost":
          return status === "lost" || status === "settled";
        default:
          return true;
      }
    });
  };

  return (
    <div className="">
      <div className="flex bg-[var(--bg-table-row)] justify-center gap-1 items-stretch overflow-x-auto min-h-30">
        {/* Player */}
        <div className="shrink-0 basis-[25%]">
          <div className="h-full flex flex-col gap-1 p-1">
            <h2 className="text-base font-semibold leading-10 text-center">
              {formatOdds(playerRow?.b)}
            </h2>
            <div className="relative">
              <button
                className="relative h-10 sm:h-12 bg-gradient-to-r from-[var(--bg-primary)] to-[var(--bg-secondary)] text-base font-semibold text-white w-full"
                disabled={isLocked(playerRow)}
                onClick={() => {
                  console.log("🎰 Onecard2020 Player bet click:", {
                    sid: playerRow?.sid,
                    odds: playerRow,
                    locked: isLocked(playerRow),
                  });
                  if (!isLocked(playerRow) && playerRow?.sid) {
                    onBetClick?.(String(playerRow.sid), "back");
                  }
                }}
              >
                {isLocked(playerRow) && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <RiLockFill className="text-white" />
                  </span>
                )}
                Player
              </button>
              <div className="absolute -bottom-6 left-0 right-0 text-center">
                <span
                  className={`text-xs font-semibold ${
                    getBetProfitLoss("Player") > 0
                      ? "text-green-600"
                      : getBetProfitLoss("Player") < 0
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                  {getBetProfitLoss("Player") > 0 ? "+" : ""}
                  {getBetProfitLoss("Player").toFixed(0)}
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* Tie */}
        <div className="shrink-0 basis-[16.6667%]">
          <div className="h-full flex flex-col gap-1 p-1">
            <h2 className="text-base font-semibold leading-10 text-center">
              {formatOdds(tieRow?.b)}
            </h2>
            <div className="relative">
              <button
                className="relative h-10 sm:h-12 bg-gradient-to-r from-[var(--bg-primary)] to-[var(--bg-secondary)] text-base font-semibold text-white w-full"
                disabled={isLocked(tieRow)}
                onClick={() => {
                  console.log("🎰 Onecard2020 Tie bet click:", {
                    sid: tieRow?.sid,
                    odds: tieRow,
                    locked: isLocked(tieRow),
                  });
                  if (!isLocked(tieRow) && tieRow?.sid) {
                    onBetClick?.(String(tieRow.sid), "back");
                  }
                }}
              >
                {isLocked(tieRow) && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <RiLockFill className="text-white" />
                  </span>
                )}
                Tie
              </button>
              <div className="absolute -bottom-6 left-0 right-0 text-center">
                <span
                  className={`text-xs font-semibold ${
                    getBetProfitLoss("Tie") > 0
                      ? "text-green-600"
                      : getBetProfitLoss("Tie") < 0
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                  {getBetProfitLoss("Tie") > 0 ? "+" : ""}
                  {getBetProfitLoss("Tie").toFixed(0)}
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* Dealer */}
        <div className="shrink-0 basis-[25%]">
          <div className="h-full flex flex-col gap-1 p-1">
            <h2 className="text-base font-semibold leading-10 text-center">
              {formatOdds(dealerRow?.b)}
            </h2>
            <div className="relative">
              <button
                className="relative h-10 sm:h-12 bg-gradient-to-r from-[var(--bg-primary)] to-[var(--bg-secondary)] text-base font-semibold text-white w-full"
                disabled={isLocked(dealerRow)}
                onClick={() => {
                  console.log("🎰 Onecard2020 Dealer bet click:", {
                    sid: dealerRow?.sid,
                    odds: dealerRow,
                    locked: isLocked(dealerRow),
                  });
                  if (!isLocked(dealerRow) && dealerRow?.sid) {
                    onBetClick?.(String(dealerRow.sid), "back");
                  }
                }}
              >
                {isLocked(dealerRow) && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <RiLockFill className="text-white" />
                  </span>
                )}
                Dealer
              </button>
              <div className="absolute -bottom-6 left-0 right-0 text-center">
                <span
                  className={`text-xs font-semibold ${
                    getBetProfitLoss("Dealer") > 0
                      ? "text-green-600"
                      : getBetProfitLoss("Dealer") < 0
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                  {getBetProfitLoss("Dealer") > 0 ? "+" : ""}
                  {getBetProfitLoss("Dealer").toFixed(0)}
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* vertical separator */}
        <div className="shrink-0 w-2 bg-[var(--bg-secondary)] mx-1" />
        {/* Pair */}
        <div className="shrink-0 basis-[25%]">
          <div className="h-full flex flex-col gap-1 p-1">
            <h2 className="text-base font-semibold leading-10 text-center">
              {formatOdds(pairRow?.b)}
            </h2>
            <div className="relative">
              <button
                className="relative h-10 sm:h-12 bg-gradient-to-r from-[var(--bg-primary)] to-[var(--bg-secondary)] text-base font-semibold text-white w-full"
                disabled={isLocked(pairRow)}
                onClick={() => {
                  console.log("🎰 Onecard2020 Pair bet click:", {
                    sid: pairRow?.sid,
                    odds: pairRow,
                    locked: isLocked(pairRow),
                  });
                  if (!isLocked(pairRow) && pairRow?.sid) {
                    onBetClick?.(String(pairRow.sid), "back");
                  }
                }}
              >
                {isLocked(pairRow) && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <RiLockFill className="text-white" />
                  </span>
                )}
                Pair
              </button>
              <div className="absolute -bottom-6 left-0 right-0 text-center">
                <span
                  className={`text-xs font-semibold ${
                    getBetProfitLoss("Pair") > 0
                      ? "text-green-600"
                      : getBetProfitLoss("Pair") < 0
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                  {getBetProfitLoss("Pair") > 0 ? "+" : ""}
                  {getBetProfitLoss("Pair").toFixed(0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="mt-1 flex flex-col gap-1">
        <div className="bg-[var(--bg-secondary85)] border border-gray-300 flex justify-between px-2 py-.5 items-center">
          <h2 className="text-sm font-normal leading-8 text-white">
            Last Result
          </h2>
          <h2
            onClick={() => navigate(`/casino-result?game=TEEN_120`)}
            className="text-sm font-normal leading-8 text-white cursor-pointer hover:underline"
          >
            View All
          </h2>
        </div>
        <div className="flex justify-end items-center mb-2 gap-2 mx-2">
          {Array.isArray(results) && results.length > 0 ? (
            results.slice(0, 10).map((item: any, index: number) => {
              const resultDisplay = getResultDisplay(item.win || "");
              return (
                <div
                  key={item.mid || `result-${item.win}-${index}`}
                  className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-xs font-semibold ${resultDisplay.color} cursor-pointer hover:scale-110 transition-transform`}
                  onClick={() => handleResultClick(item)}
                  title={`Round ID: ${item.mid || "N/A"} - Winner: ${resultDisplay.title} - Click to view details`}
                >
                  {resultDisplay.label}
                </div>
              );
            })
          ) : (
            <div className="text-gray-400 text-sm py-2">No results available</div>
          )}
        </div>
      </div>

      {/* Individual Result Details Modal */}
      {/* <IndividualResultModal
        isOpen={resultModal.isOpen}
        onClose={resultModal.closeModal}
        resultId={resultModal.selectedResultId || undefined}
        gameType={normalizedGameSlug}
        title="1 CARD 20-20 Result Details"
        enableBetFiltering={true}
        customGetFilteredBets={getFilteredBets}
      /> */}
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const Onecard2020 = memoizeCasinoComponent(Onecard2020Component);
Onecard2020.displayName = "Onecard2020";

export default Onecard2020;
