import React, { useState } from "react";
import { RiLockFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
// import IndividualResultModal from "@/components/casino/IndividualResultModal";
import { memoizeCasinoComponent } from "../../../utils/casinoMemo";

interface JackTopProps {
  casinoData: any;
  remainingTime: number;
  onBetClick: (sid: string, type: "back" | "lay") => void;
  results?: any[];
  gameCode?: string;
  gameName?: string;
  currentBet?: any;
}

const JackTopComponent: React.FC<JackTopProps> = ({
  casinoData,
  remainingTime,
  onBetClick,
  results = [],
  gameCode,
  gameName,
  currentBet,
}) => {
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  // Get game slug from gameCode and normalize it
  const normalizedGameType = React.useMemo(() => {
    if (gameCode) {
      // Convert "TEEN_42" -> "teen42"
      return gameCode.toLowerCase().replace(/_/g, "");
    }
    return "teen42"; // Default fallback
  }, [gameCode]);
  // Get odds data from sub array
  // Handle both API format (data.sub) and socket format (data.current.sub)
  const getOddsData = (sid: number) => {
    // Try different possible data structures
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

  // Get odds data for all betting options
  const playerA = getOddsData(1);
  const playerB = getOddsData(2);
  const playerBUnder21 = getOddsData(3);
  const playerBOver21 = getOddsData(4);

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
        let isOppositeMatch = false; // For mutually exclusive bets (Under 21 vs Over 21, Player A vs Player B)
        
        // Exact match first
        if (actualBetNameLower === requestedBetTypeLower) {
          isMatch = true;
        }
        // Match "Player A" - must be exactly "Player A" (not "Player A Under 21" etc.)
        else if (requestedBetTypeLower === "player a") {
          isMatch = actualBetNameLower === "player a" || 
                   (actualBetNameLower.includes("player a") && 
                    !actualBetNameLower.includes("under") && 
                    !actualBetNameLower.includes("over"));
          // Also check for opposite (Player B) for cross-calculation
          isOppositeMatch = actualBetNameLower === "player b" || 
                          (actualBetNameLower.includes("player b") && 
                           !actualBetNameLower.includes("under") && 
                           !actualBetNameLower.includes("over"));
        }
        // Match "Player B" - must be exactly "Player B" (not "Player B Under 21" etc.)
        else if (requestedBetTypeLower === "player b") {
          isMatch = actualBetNameLower === "player b" || 
                   (actualBetNameLower.includes("player b") && 
                    !actualBetNameLower.includes("under") && 
                    !actualBetNameLower.includes("over"));
          // Also check for opposite (Player A) for cross-calculation
          isOppositeMatch = actualBetNameLower === "player a" || 
                          (actualBetNameLower.includes("player a") && 
                           !actualBetNameLower.includes("under") && 
                           !actualBetNameLower.includes("over"));
        }
        // Match "Player B Under 21" - must include both "player b" and "under 21"
        else if (requestedBetTypeLower === "player b under 21") {
          isMatch = actualBetNameLower.includes("player b") && 
                   actualBetNameLower.includes("under 21");
          // Also check for opposite (Over 21) for cross-calculation
          isOppositeMatch = actualBetNameLower.includes("player b") && 
                           actualBetNameLower.includes("over 21");
        }
        // Match "Player B Over 21" - must include both "player b" and "over 21"
        else if (requestedBetTypeLower === "player b over 21") {
          isMatch = actualBetNameLower.includes("player b") && 
                   actualBetNameLower.includes("over 21");
          // Also check for opposite (Under 21) for cross-calculation
          isOppositeMatch = actualBetNameLower.includes("player b") && 
                           actualBetNameLower.includes("under 21");
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
          // - If betting on Under 21, Over 21 shows profit (and vice versa)
          // - If betting on Player A, Player B shows profit (and vice versa)
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
        {/* Player A Table */}
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border w-[59%] border-gray-300 px-2 py-1 text-left text-xs bg-gray-100">
                <div className="flex flex-col">
                  <span>Player A</span>
                </div>
              </th>
              <th className="border border-gray-300 px-2 py-1 text-center text-sm bg-[var(--bg-back)]">
                BACK
              </th>
              <th className="border border-gray-300 px-2 py-1 text-center text-sm bg-[var(--bg-lay)]">
                LAY
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Main Row */}
            <tr className="hover:bg-gray-50">
              <td className="border px-2 py-2 border-gray-300 text-sm font-semibold">
                <div className="flex flex-col">
                  <span>Main</span>
                  <h2
                    className={`text-xs font-semibold ${
                      getBetProfitLoss("Player A") > 0
                        ? "text-green-600"
                        : getBetProfitLoss("Player A") < 0
                          ? "text-red-600"
                          : "text-gray-600"
                    }`}
                  >
                    {getBetProfitLoss("Player A") > 0 ? "+" : ""}
                    {getBetProfitLoss("Player A").toFixed(0)}
                  </h2>
                </div>
              </td>
              <td
                className="border px-2 py-2 border-gray-300 text-center cursor-pointer bg-[var(--bg-back)] relative"
                onClick={() =>
                  !isSuspended(playerA) && onBetClick("1", "back")
                }
              >
                {isSuspended(playerA) && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                    <RiLockFill className="text-white text-xl" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span>{formatOdds(playerA?.b)}</span>
                </div>
              </td>
              <td
                className="border px-2 py-2 border-gray-300 text-center cursor-pointer bg-[var(--bg-lay)] relative"
                onClick={() =>
                  !isSuspended(playerA) && onBetClick("1", "lay")
                }
              >
                {isSuspended(playerA) && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                    <RiLockFill className="text-white text-xl" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span>{formatOdds(playerA?.l)}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Player B Table */}
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border w-[59%] border-gray-300 px-2 py-1 text-left text-xs bg-gray-100">
                <div className="flex flex-col">
                  <span>Player B</span>
                </div>
              </th>
              <th className="border border-gray-300 px-2 py-1 text-center text-sm bg-[var(--bg-back)]">
                BACK
              </th>
              <th className="border border-gray-300 px-2 py-1 text-center text-sm bg-[var(--bg-lay)]">
                LAY
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Main Row */}
            <tr className="hover:bg-gray-50">
              <td className="border px-2 py-2 border-gray-300 text-sm font-semibold">
                <div className="flex flex-col">
                  <span>Main</span>
                  <h2
                    className={`text-xs font-semibold ${
                      getBetProfitLoss("Player B") > 0
                        ? "text-green-600"
                        : getBetProfitLoss("Player B") < 0
                          ? "text-red-600"
                          : "text-gray-600"
                    }`}
                  >
                    {getBetProfitLoss("Player B") > 0 ? "+" : ""}
                    {getBetProfitLoss("Player B").toFixed(0)}
                  </h2>
                </div>
              </td>
              <td
                className="border px-2 py-2 border-gray-300 text-center cursor-pointer bg-[var(--bg-back)] relative"
                onClick={() =>
                  !isSuspended(playerB) && onBetClick("2", "back")
                }
              >
                {isSuspended(playerB) && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                    <RiLockFill className="text-white text-xl" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span>{formatOdds(playerB?.b)}</span>
                </div>
              </td>
              <td
                className="border px-2 py-2 border-gray-300 text-center cursor-pointer bg-[var(--bg-lay)] relative"
                onClick={() =>
                  !isSuspended(playerB) && onBetClick("2", "lay")
                }
              >
                {isSuspended(playerB) && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                    <RiLockFill className="text-white text-xl" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span>{formatOdds(playerB?.l)}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Player B Under/Over 21 Section */}
      <div className="grid md:grid-cols-2 grid-cols-1 gap-1.5">
        {/* Empty space for Player A side */}
        <div className="w-full"></div>

        {/* Player B Under/Over 21 Tables */}
        <div className="w-full grid grid-cols-2 gap-1.5">
          {/* Player B Under 21 */}
          <table className="w-full border-collapse">
            <thead></thead>
            <tbody>
              <tr className="hover:bg-gray-50">
                <td className="border px-2 py-2 border-gray-300 text-sm font-semibold">
                  <div className="flex flex-col">
                    <span>Player B Under 21</span>
                    <h2
                      className={`text-xs font-semibold ${
                        getBetProfitLoss("Player B Under 21") > 0
                          ? "text-green-600"
                          : getBetProfitLoss("Player B Under 21") < 0
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {getBetProfitLoss("Player B Under 21") > 0 ? "+" : ""}
                      {getBetProfitLoss("Player B Under 21").toFixed(0)}
                    </h2>
                  </div>
                </td>
                <td
                  className="border px-2 py-2 border-gray-300 text-center cursor-pointer bg-[var(--bg-back)] relative"
                  onClick={() =>
                    !isSuspended(playerBUnder21) && onBetClick("3", "back")
                  }
                >
                  {isSuspended(playerBUnder21) && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                      <RiLockFill className="text-white text-xl" />
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span>{formatOdds(playerBUnder21?.b)}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Player B Over 21 */}
          <table className="w-full border-collapse">
            <thead></thead>
            <tbody>
              <tr className="hover:bg-gray-50">
                <td className="border px-2 py-2 border-gray-300 text-sm font-semibold">
                  <div className="flex flex-col">
                    <span>Player B Over 21</span>
                    <h2
                      className={`text-xs font-semibold ${
                        getBetProfitLoss("Player B Over 21") > 0
                          ? "text-green-600"
                          : getBetProfitLoss("Player B Over 21") < 0
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {getBetProfitLoss("Player B Over 21") > 0 ? "+" : ""}
                      {getBetProfitLoss("Player B Over 21").toFixed(0)}
                    </h2>
                  </div>
                </td>
                <td
                  className="border px-2 py-2 border-gray-300 text-center cursor-pointer bg-[var(--bg-back)] relative"
                  onClick={() =>
                    !isSuspended(playerBOver21) && onBetClick("4", "back")
                  }
                >
                  {isSuspended(playerBOver21) && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                      <RiLockFill className="text-white text-xl" />
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span>{formatOdds(playerBOver21?.b)}</span>
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
            onClick={() => navigate(`/casino-result?game=TEEN_42`)}
            className="text-sm font-normal leading-8 text-white cursor-pointer hover:underline"
          >
            View All
          </h2>
        </div>
        <div className="flex justify-end items-center mb-2 gap-2 mx-2">
          {Array.isArray(results) && results.length > 0 ? (
            results.slice(0, 10).map((item: any) => {
              // Handle win field: "1" = Player A, "2" = Player B
              const isPlayerA = item.win === "1" || item.win === "A";
              return (
                <div
                  key={item.mid || `result-${item.win}-${Math.random()}`}
                  className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-sm font-semibold ${
                    isPlayerA ? "text-red-500" : "text-yellow-500"
                  } cursor-pointer hover:scale-110 transition-transform`}
                  onClick={() => handleResultClick(item)}
                  title={`Round ID: ${item.mid || "N/A"} - Click to view details`}
                >
                  {isPlayerA ? "A" : "B"}
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
        isOpen={isModalOpen}
        onClose={closeModal}
        resultId={selectedResult?.mid}
        gameType={normalizedGameType}
        title={`${gameName || "Jack Top Teenpatti"} Result Details`}
        enableBetFiltering={false}
      /> */}
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const JackTop = memoizeCasinoComponent(JackTopComponent);
JackTop.displayName = "JackTop";

export default JackTop;
