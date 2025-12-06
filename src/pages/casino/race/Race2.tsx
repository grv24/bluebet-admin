import React, { useMemo, useCallback } from "react";
import { RiLockFill } from "react-icons/ri";
// import IndividualResultModal from "@/components/casino/IndividualResultModal";
// import { useIndividualResultModal } from "@/hooks/useIndividualResultModal";
import { useNavigate } from "react-router-dom";
import { memoizeCasinoComponent } from "../../../utils/casinoMemo";

interface Race2Props {
  casinoData: any;
  remainingTime: number;
  results?: any[];
  gameCode?: string;
  gameName?: string;
}

const Race2Component: React.FC<Race2Props> = ({
  casinoData,
  remainingTime,
  results = [],
  gameCode,
}) => {
  const navigate = useNavigate();
  // const resultModal = useIndividualResultModal();
  
  // Get game slug from gameCode for navigation
  const gameSlug = gameCode || "";
  
  // Normalize game slug for IndividualResultModal
  const normalizedGameSlug = useMemo(() => {
    if (gameCode) {
      const lowerCaseCode = gameCode.toLowerCase();
      if (lowerCaseCode === "race_2" || lowerCaseCode === "race2") {
        return "race2";
      }
      return lowerCaseCode.replace(/[^a-z0-9]/g, "");
    }
    return "race2"; // Default fallback
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

    // Check if both odds are 0 (no betting available)
    const hasNoBackOdds = !row.b || Number(row.b) === 0;
    const hasNoLayOdds = !row.l || Number(row.l) === 0;
    const hasNoOdds = hasNoBackOdds && hasNoLayOdds;

    // If status is explicitly OPEN and gval is not 1 (or undefined), it should be unlocked
    // unless time is low or both odds are 0
    if (isStatusOpen && !isGvalSuspended) {
      return isTimeSuspended || hasNoOdds;
    }

    // Lock if:
    // 1. Status is suspended/closed
    // 2. gval is 1 (suspended) - this can override OPEN status
    // 3. Time is low (<= 3 seconds)
    // 4. Both odds are 0 (no betting available)
    return (
      isStatusSuspended ||
      isGvalSuspended ||
      isTimeSuspended ||
      hasNoOdds
    );
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

  // Get odds by sid
  const getOddsBySid = (sid: number) => {
    return (
      oddsData.find((item: any) => String(item.sid) === String(sid)) || null
    );
  };

  // Get odds for each player
  // Player A - sid: 1
  const playerA = getOddsBySid(1);
  // Player B - sid: 2
  const playerB = getOddsBySid(2);
  // Player C - sid: 3
  const playerC = getOddsBySid(3);
  // Player D - sid: 4
  const playerD = getOddsBySid(4);

  // Profit/Loss calculation function

    const currentMatchId = casinoData.data.mid;
    let totalProfitLoss = 0;

    // Only bets for this match
      (bet: any) => String(bet.matchId) === String(currentMatchId)
    );

    bets.forEach((bet: any) => {
      const result = bet.betData?.result;

      // Use either betName, name, or nation field
      const betSid = sid ? Number(sid) : null;
      
      // Check if this bet matches the requested player
      let isMatch = false;
      
      // Match by sid first (most reliable)
      if (betSid && betSid === playerSid) {
        isMatch = true;
      }
      // Match by name (Player A, Player B, etc.)
      else if (actualBetName && typeof actualBetName === 'string') {
        const actualBetNameLower = actualBetName.toLowerCase().trim();
        const playerLabels: { [key: number]: string[] } = {
          1: ["player a", "a"],
          2: ["player b", "b"],
          3: ["player c", "c"],
          4: ["player d", "d"],
        };
        
        const playerLabelsLower = playerLabels[playerSid] || [];
        if (playerLabelsLower.some(label => actualBetNameLower.includes(label))) {
          isMatch = true;
        }
      }
      
      if (isMatch) {
        // If bet is settled, use the actual profit/loss from the result
        if (result && result.settled) {

          if (result.status === "won" || result.status === "profit") {
          } else if (result.status === "lost") {
          }

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
          } else if (oddCategory?.toLowerCase() === "lay") {
            // For lay bets, if it wins, you get the stake, if it loses, you pay the loss
            // For unsettled lay bets, show potential profit (stake)
            totalProfitLoss += stakeAmount;
          }
        }
      } else {
        // For other players (mutually exclusive), show potential loss if this bet loses
        // If bet is settled and lost, show the loss
        if (result && result.settled) {
          if (result.status === "lost") {
          }
        } else {
          // For unsettled bets on other players, show potential loss (stake)
          totalProfitLoss -= Number(stake) || 0;
        }
      }
    });

    return totalProfitLoss;
  }, [, casinoData]);

  // Handle clicking on individual result to show details


  // Function to filter user bets based on selected filter


  // Map win value to display info
  // win "1" = Player A, "2" = Player B, "3" = Player C, "4" = Player D
  const getResultDisplay = (win: string) => {
    // Find the odds data for this win value (win is the sid)
    const odd = oddsData.find((item: any) => String(item.sid) === String(win));

    if (odd) {
      // Use the nat field from odds data
      const nat = odd.nat || "";
      // Extract player letter (A, B, C, D)
      const playerLetter = nat.replace("Player ", "").trim();
      return {
        label: playerLetter,
        color: "text-yellow-500",
        title: nat,
      };
    }

    // Fallback mapping
    const winMap: {
      [key: string]: { label: string; color: string; title: string };
    } = {
      "1": { label: "A", color: "text-yellow-500", title: "Player A" },
      "2": { label: "B", color: "text-yellow-500", title: "Player B" },
      "3": { label: "C", color: "text-yellow-500", title: "Player C" },
      "4": { label: "D", color: "text-yellow-500", title: "Player D" },
    };

    return (
      winMap[win] || { label: win, color: "text-gray-400", title: "Unknown" }
    );
  };

  // Render a betting section
  const renderBettingSection = (label: string, oddsItem: any, sid: number) => {
    const locked = isLocked(oddsItem);
    const backOdds = formatOdds(oddsItem?.b);
    const layOdds = formatOdds(oddsItem?.l);

    return (
      <div className="flex flex-col w-full gap-1">
        <h1 className="text-sm font-semibold text-black text-center">
          {label}
        </h1>
        <div className="flex w-full gap-1 relative">
          {/* Back Odds */}
          <h2
            className={`text-sm w-full font-semibold text-black text-center leading-10 bg-[var(--bg-back)] relative ${
              !locked && oddsItem?.b ? "hover:opacity-90" : ""
            }`}
            onClick={() =>
            }
          >
            {locked && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                <RiLockFill className="text-white text-lg" />
              </div>
            )}
            {backOdds}
          </h2>
          {/* Lay Odds */}
          <h2
            className={`text-sm w-full font-semibold text-black text-center leading-10 bg-[var(--bg-lay)] relative ${
              !locked && oddsItem?.l ? "hover:opacity-90" : ""
            }`}
            onClick={() =>
            }
          >
            {locked && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                <RiLockFill className="text-white text-lg" />
              </div>
            )}
            {layOdds}
          </h2>
        </div>
        {/* Profit/Loss Display */}
          <div className="text-center">
            <span
              className={`text-sm font-semibold ${
              }`}
            >
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-1.5">
      {/* Betting Grid */}
      <div className="grid md:grid-cols-4 grid-cols-2 gap-1">
        {renderBettingSection("Player A", playerA, 1)}
        {renderBettingSection("Player B", playerB, 2)}
        {renderBettingSection("Player C", playerC, 3)}
        {renderBettingSection("Player D", playerD, 4)}
      </div>

      {/* Results Section */}
      <div className="mt-1 flex flex-col gap-1">
        <div className="bg-[var(--bg-secondary85)] border border-gray-300 flex justify-between px-2 py-0.5 items-center">
          <h2 className="text-sm font-normal leading-8 text-white">
            Last Result
          </h2>
          <h2
            onClick={() => navigate(`/casino-result?game=${gameSlug}`)}
            className="text-sm font-normal leading-8 text-white hover:underline"
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
                  className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-xs font-semibold ${resultDisplay.color} hover:scale-110 transition-transform`}
                  
                  title={`Round ID: ${item.mid || "N/A"} - ${resultDisplay.title} - Click to view details`}
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
        gameType={normalizedGameSlug}
        title="Race 2 Result Details"
        enableBetFiltering={true}
        customGetFilteredBets={getFilteredBets}
      /> */}
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const Race2 = memoizeCasinoComponent(Race2Component);
Race2.displayName = "Race2";

export default Race2;
