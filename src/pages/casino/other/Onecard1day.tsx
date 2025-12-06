import React, { useState, useMemo } from "react";
import { RiLockFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
// import IndividualResultModal from "@/components/casino/IndividualResultModal";
import { memoizeCasinoComponent } from "../../../utils/casinoMemo";

interface Onecard1dayProps {
  casinoData: any;
  remainingTime: number;
  onBetClick: (sid: string, type: "back" | "lay") => void;
  results?: any[];
  gameCode?: string;
  gameName?: string;
  currentBet?: any;
}

const Onecard1dayComponent: React.FC<Onecard1dayProps> = ({
  casinoData,
  remainingTime,
  onBetClick,
  results = [],
  gameCode,
  gameName,
  currentBet,
}) => {
  const navigate = useNavigate();
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get game slug from gameCode for navigation
  const gameSlug = gameCode || "";

  // Normalize gameCode to lowercase format (e.g., "TEEN_1" -> "teen1" or "ONECARD_1DAY" -> "onecard1day")
  const normalizedGameType = useMemo(() => {
    if (!gameCode) return undefined;
    return gameCode.toLowerCase().replace(/_/g, "");
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
  const isSuspended = (oddsData: any): boolean => {
    if (!oddsData) return true;

    const status = oddsData.gstatus;
    const isStatusSuspended =
      status === "SUSPENDED" ||
      status === "CLOSED" ||
      Number(status) === 0 ||
      status === "0" ||
      String(status) === "0";

    const isTimeSuspended = remainingTime <= 3;

    return isStatusSuspended || isTimeSuspended;
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
        let isOppositeMatch = false; // For mutually exclusive bets
        
        // Exact match first
        if (actualBetNameLower === requestedBetTypeLower) {
          isMatch = true;
        }
        // Match "Player" - must be exactly "Player" (not "7 Up Player" etc.)
        else if (requestedBetTypeLower === "player") {
          isMatch = actualBetNameLower === "player" || 
                   (actualBetNameLower.includes("player") && 
                    !actualBetNameLower.includes("7") && 
                    !actualBetNameLower.includes("seven") &&
                    !actualBetNameLower.includes("up") &&
                    !actualBetNameLower.includes("down"));
          // Also check for opposite (Dealer) for cross-calculation - but NOT 7 Up/Down Dealer
          isOppositeMatch = actualBetNameLower === "dealer" || 
                          (actualBetNameLower.includes("dealer") && 
                           !actualBetNameLower.includes("7") && 
                           !actualBetNameLower.includes("seven") &&
                           !actualBetNameLower.includes("up") &&
                           !actualBetNameLower.includes("down"));
        }
        // Match "Dealer" - must be exactly "Dealer" (not "7 Up Dealer" etc.)
        else if (requestedBetTypeLower === "dealer") {
          isMatch = actualBetNameLower === "dealer" || 
                   (actualBetNameLower.includes("dealer") && 
                    !actualBetNameLower.includes("7") && 
                    !actualBetNameLower.includes("seven") &&
                    !actualBetNameLower.includes("up") &&
                    !actualBetNameLower.includes("down"));
          // Also check for opposite (Player) for cross-calculation - but NOT 7 Up/Down Player
          isOppositeMatch = actualBetNameLower === "player" || 
                          (actualBetNameLower.includes("player") && 
                           !actualBetNameLower.includes("7") && 
                           !actualBetNameLower.includes("seven") &&
                           !actualBetNameLower.includes("up") &&
                           !actualBetNameLower.includes("down"));
        }
        // Match "7 Up Player" - must include "7", "up", and "player" (exclude main Player/Dealer)
        else if (requestedBetTypeLower === "7 up player" || requestedBetTypeLower === "7up player") {
          isMatch = (actualBetNameLower.includes("7") || actualBetNameLower.includes("seven")) && 
                   actualBetNameLower.includes("up") && 
                   actualBetNameLower.includes("player");
          // Also check for opposite (7 Down Player) for cross-calculation
          isOppositeMatch = (actualBetNameLower.includes("7") || actualBetNameLower.includes("seven")) && 
                          actualBetNameLower.includes("down") && 
                          actualBetNameLower.includes("player");
        }
        // Match "7 Down Player" - must include "7", "down", and "player" (exclude main Player/Dealer)
        else if (requestedBetTypeLower === "7 down player" || requestedBetTypeLower === "7down player") {
          isMatch = (actualBetNameLower.includes("7") || actualBetNameLower.includes("seven")) && 
                   actualBetNameLower.includes("down") && 
                   actualBetNameLower.includes("player");
          // Also check for opposite (7 Up Player) for cross-calculation
          isOppositeMatch = (actualBetNameLower.includes("7") || actualBetNameLower.includes("seven")) && 
                          actualBetNameLower.includes("up") && 
                          actualBetNameLower.includes("player");
        }
        // Match "7 Up Dealer" - must include "7", "up", and "dealer" (exclude main Player/Dealer)
        else if (requestedBetTypeLower === "7 up dealer" || requestedBetTypeLower === "7up dealer") {
          isMatch = (actualBetNameLower.includes("7") || actualBetNameLower.includes("seven")) && 
                   actualBetNameLower.includes("up") && 
                   actualBetNameLower.includes("dealer");
          // Also check for opposite (7 Down Dealer) for cross-calculation
          isOppositeMatch = (actualBetNameLower.includes("7") || actualBetNameLower.includes("seven")) && 
                          actualBetNameLower.includes("down") && 
                          actualBetNameLower.includes("dealer");
        }
        // Match "7 Down Dealer" - must include "7", "down", and "dealer" (exclude main Player/Dealer)
        else if (requestedBetTypeLower === "7 down dealer" || requestedBetTypeLower === "7down dealer") {
          isMatch = (actualBetNameLower.includes("7") || actualBetNameLower.includes("seven")) && 
                   actualBetNameLower.includes("down") && 
                   actualBetNameLower.includes("dealer");
          // Also check for opposite (7 Up Dealer) for cross-calculation
          isOppositeMatch = (actualBetNameLower.includes("7") || actualBetNameLower.includes("seven")) && 
                          actualBetNameLower.includes("up") && 
                          actualBetNameLower.includes("dealer");
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
          // Cross-calculation: For mutually exclusive bets
          // - If betting on Player, Dealer shows profit (and vice versa)
          // - If betting on 7 Up Player, 7 Down Player shows profit (and vice versa)
          // - If betting on 7 Up Dealer, 7 Down Dealer shows profit (and vice versa)
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

  // Get odds data for Player and Dealer
  const playerRow = getOddsData(1); // Player
  const dealerRow = getOddsData(2); // Dealer
  
  // Get odds data for 7 Up/Down betting options
  const playerUpRow = getOddsData(3); // 7 Up Player
  const playerDownRow = getOddsData(4); // 7 Down Player
  const dealerUpRow = getOddsData(5); // 7 Up Dealer
  const dealerDownRow = getOddsData(6); // 7 Down Dealer

  // Map win value to display info
  const getResultDisplay = (win: string) => {
    switch (win) {
      case "1":
        return { label: "P", color: "text-red-500", title: "Player" };
      case "2":
        return { label: "D", color: "text-yellow-500", title: "Dealer" };
      default:
        return { label: "N", color: "text-gray-400", title: "Unknown" };
    }
  };


  // Handle clicking on individual result to show details
  const handleResultClick = (result: any) => {
    if (!result?.mid) return;
    setSelectedResult(result);
    setIsModalOpen(true);
  };

  // Close the result details modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedResult(null);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid md:grid-cols-2 grid-cols-1 gap-1.5">
        {/* Player Table */}
        <table className="w-full border-collapse">
          <thead></thead>
          <tbody>
            {/* Main Row */}
            <tr className="hover:bg-gray-50">
              <td className="border px-2 py-2 border-gray-300 text-sm font-semibold">
                <div className="flex flex-col">
                  <span>Player</span>
                  <h2
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
                  </h2>
                </div>
              </td>
              <td
                className="border px-2 py-2 border-gray-300 text-center cursor-pointer bg-[var(--bg-back)] relative"
                onClick={() =>
                  !isSuspended(playerRow) && onBetClick("1", "back")
                }
              >
                {isSuspended(playerRow) && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                    <RiLockFill className="text-white text-xl" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span>{formatOdds(playerRow?.b)}</span>
                </div>
              </td>
              <td
                className="border px-2 py-2 border-gray-300 text-center cursor-pointer bg-[var(--bg-lay)] relative"
                onClick={() =>
                  !isSuspended(playerRow) && onBetClick("1", "lay")
                }
              >
                {isSuspended(playerRow) && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                    <RiLockFill className="text-white text-xl" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span>{formatOdds(playerRow?.l)}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Dealer Table */}
        <table className="w-full border-collapse">
          <thead></thead>
          <tbody>
            {/* Main Row */}
            <tr className="hover:bg-gray-50">
              <td className="border px-2 py-2 border-gray-300 text-sm font-semibold">
                <div className="flex flex-col">
                  <span>Dealer</span>
                  <h2
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
                  </h2>
                </div>
              </td>
              <td
                className="border px-2 py-2 border-gray-300 text-center cursor-pointer bg-[var(--bg-back)] relative"
                onClick={() =>
                  !isSuspended(dealerRow) && onBetClick("2", "back")
                }
              >
                {isSuspended(dealerRow) && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                    <RiLockFill className="text-white text-xl" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span>{formatOdds(dealerRow?.b)}</span>
                </div>
              </td>
              <td
                className="border px-2 py-2 border-gray-300 text-center cursor-pointer bg-[var(--bg-lay)] relative"
                onClick={() =>
                  !isSuspended(dealerRow) && onBetClick("2", "lay")
                }
              >
                {isSuspended(dealerRow) && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                    <RiLockFill className="text-white text-xl" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span>{formatOdds(dealerRow?.l)}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="grid md:grid-cols-2 grid-cols-1 gap-1.5">
        {/* Player Up/Down Section */}
        <div className="border-2 border-[var(--bg-primary)] w-full flex justify-center gap-14 items-center relative">
          {/* 7 Down Player Button */}
          <div 
            className={`flex flex-col items-end justify-center w-full cursor-pointer relative ${isSuspended(playerDownRow) ? 'opacity-50' : ''}`}
            onClick={() => !isSuspended(playerDownRow) && onBetClick("4", "back")}
          >
            {isSuspended(playerDownRow) && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 ">
                <RiLockFill className="text-white text-xl" />
              </div>
            )}
            <h2 className="text-xs font-semibold leading-4">{formatOdds(playerDownRow?.b)}</h2>
            <h2 className="text-sm uppercase">down</h2>
          </div>
          {/* 7 Icon */}
          <img 
            src="https://versionobj.ecoassetsservice.com/v80/static/front/img/trape-seven.png" 
            className="absolute -top-.5 md:left-50 left-42 md:w-12 w-10" 
            alt="7" 
          />
          {/* 7 Up Player Button */}
          <div 
            className={`flex flex-col items-start justify-center w-full cursor-pointer relative ${isSuspended(playerUpRow) ? 'opacity-50' : ''}`}
            onClick={() => !isSuspended(playerUpRow) && onBetClick("3", "back")}
          >
            {isSuspended(playerUpRow) && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 ">
                <RiLockFill className="text-white text-xl" />
              </div>
            )}
            <h2 className="text-xs font-semibold leading-4">{formatOdds(playerUpRow?.b)}</h2>
            <h2 className="text-sm uppercase">Up</h2>
          </div>
        </div>
        
        {/* Dealer Up/Down Section */}
        <div className="border-2 border-[var(--bg-primary)] w-full flex justify-center gap-14 items-center relative">
          {/* 7 Down Dealer Button */}
          <div 
            className={`flex flex-col items-end justify-center w-full cursor-pointer relative ${isSuspended(dealerDownRow) ? 'opacity-50' : ''}`}
            onClick={() => !isSuspended(dealerDownRow) && onBetClick("6", "back")}
          >
            {isSuspended(dealerDownRow) && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 ">
                <RiLockFill className="text-white text-xl" />
              </div>
            )}
            <h2 className="text-xs font-semibold leading-4">{formatOdds(dealerDownRow?.b)}</h2>
            <h2 className="text-sm uppercase">down</h2>
          </div>
          {/* 7 Icon */}
          <img 
            src="https://versionobj.ecoassetsservice.com/v80/static/front/img/trape-seven.png" 
            className="absolute -top-.5 md:left-50 left-42 md:w-12 w-10" 
            alt="7" 
          />
          {/* 7 Up Dealer Button */}
          <div 
            className={`flex flex-col items-start justify-center w-full cursor-pointer relative ${isSuspended(dealerUpRow) ? 'opacity-50' : ''}`}
            onClick={() => !isSuspended(dealerUpRow) && onBetClick("5", "back")}
          >
            {isSuspended(dealerUpRow) && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                <RiLockFill className="text-white text-xl" />
              </div>
            )}
            <h2 className="text-xs font-semibold leading-4">{formatOdds(dealerUpRow?.b)}</h2>
            <h2 className="text-sm uppercase">Up</h2>
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
            onClick={() => navigate(`/casino-result?game=${gameSlug}`)}
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
            <div className="text-gray-400 text-sm py-2">
              No results available
            </div>
          )}
        </div>
      </div>

      {/* Result Details Modal */}
      {/* <IndividualResultModal
        isOpen={isModalOpen}
        onClose={closeModal}
        resultId={selectedResult?.mid}
        gameType={normalizedGameType}
        title={`${gameName || "1 CARD ONE-DAY"} Result Details`}
      /> */}
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const Onecard1day = memoizeCasinoComponent(Onecard1dayComponent);
Onecard1day.displayName = "Onecard1day";

export default Onecard1day;
