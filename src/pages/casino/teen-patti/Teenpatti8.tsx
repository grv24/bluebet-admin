import React, { useState } from "react";
import { RiLockFill } from "react-icons/ri";
import { getCardByCode } from "../../../utils/card";
import { useNavigate } from "react-router-dom";
// import IndividualResultModal from "@/components/casino/IndividualResultModal";
import { memoizeCasinoComponent } from "../../../utils/casinoMemo";


const Teenpatti8Component = ({
  casinoData,
  remainingTime,
  onBetClick,
  results,
  gameCode,
  gameName,
  currentBet,
}: {
  casinoData: any;
  remainingTime: number;
  onBetClick: (sid: string, type: string) => void;
  results: any[];
  gameCode: string;
  gameName: string;
  currentBet: any;
}) => {
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

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


  /**
   * Calculate profit/loss for individual Teen8 betting types
   * @param betType - The type of bet to calculate profit/loss for (e.g., "Player 1", "Pair Plus 1", "Total 1")
   * @returns The profit/loss amount (only profit is displayed)
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
      const { betName, oddCategory, stake, betRate } = bet.betData;

      // Normalize bet name for comparison
      const normalizedBetName = betName?.toLowerCase() || "";
      const normalizedBetType = betType.toLowerCase();

      // Check if this bet matches the current bet type
      let isMatch = false;

      // Handle Teen8 bets - each bet type is independent (profit-only display)
      if (normalizedBetType.includes("player") && normalizedBetName.includes("player")) {
        // Extract player number from bet type (e.g., "Player 1" -> "1")
        const playerMatch = betType.match(/player\s+(\d+)/i);
        const betPlayerMatch = betName?.match(/player\s+(\d+)/i);
        
        if (playerMatch && betPlayerMatch) {
          isMatch = playerMatch[1] === betPlayerMatch[1];
        }
      } else if (normalizedBetType.includes("pair plus") && normalizedBetName.includes("pair plus")) {
        // Extract player number from bet type (e.g., "Pair Plus 1" -> "1")
        const pairMatch = betType.match(/pair plus\s+(\d+)/i);
        const betPairMatch = betName?.match(/pair plus\s+(\d+)/i);
        
        if (pairMatch && betPairMatch) {
          isMatch = pairMatch[1] === betPairMatch[1];
        }
      } else if (normalizedBetType.includes("total") && normalizedBetName.includes("total")) {
        // Extract player number from bet type (e.g., "Total 1" -> "1")
        const totalMatch = betType.match(/total\s+(\d+)/i);
        const betTotalMatch = betName?.match(/total\s+(\d+)/i);
        
        if (totalMatch && betTotalMatch) {
          isMatch = totalMatch[1] === betTotalMatch[1];
        }
      }

      if (isMatch) {
        // Calculate profit/loss for Teen8 bets (profit-only display)
        if (oddCategory.toLowerCase() === "back") {
          const profit = stake * (betRate - 1);
          profitLoss += profit; // Show profit potential only
        } else if (oddCategory.toLowerCase() === "lay") {
          const loss = stake * (betRate - 1);
          const profit = stake;
          profitLoss += profit - loss; // Show net profit/loss
        }
      }
    });

    return profitLoss;
  };

  // Debug: Log data
  console.log("🎰 Teen8 casino data:", casinoData);
  console.log("🎰 Teen8 results data:", results);

  /**
   * Handle clicking on individual result to show details
   */
  const handleResultClick = (result: any) => {
    if (!result?.mid) return;

    setSelectedResult(result);
    setIsModalOpen(true);
  };

  /**
   * Close the result details modal
   */
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedResult(null);
  };
  // helpers
  const byNation = (n: string) => {
    const found = (casinoData?.data?.sub || []).find(
      (m: any) => String(m.nat).toLowerCase() === n.toLowerCase()
    );
    console.log(`🎰 Teen8 byNation lookup for "${n}":`, found);
    return found;
  };

  const isSuspended = (odds: any) => {
    const status = odds?.gstatus as string | number | undefined;
    // For Teen8, gstatus "SUSPENDED" means suspended, "1" means active
    return (
      status === "SUSPENDED" ||
      status === 0 ||
      status === "0" ||
      remainingTime <= 3
    );
  };

  const renderCell = (odds: any, sid: string, betType: string) => {
    const suspended = isSuspended(odds);
    const profitLoss = getBetProfitLoss(betType);
    
    return (
      <td
        className={`border border-gray-300 relative bg-[var(--bg-back)] ${!suspended && sid ? 'cursor-pointer' : ''}`}
        onClick={() => {
          console.log("🎰 Teen8 Cell clicked:", { sid, odds, suspended });
          if (!suspended) {
            onBetClick(String(sid), "back");
          }
        }}
      >
        {suspended && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
            <RiLockFill className="text-white text-xl" />
            <h2 className={`text-xs font-semibold text-center ${
              profitLoss > 0 ? "text-green-600" : "text-gray-600"
            }`}>
              {profitLoss > 0 ? "+" : ""}{profitLoss.toFixed(0)}
            </h2>
          </div>
        )}
        <div className="h-10 flex flex-col items-center justify-center text-sm font-semibold">
          <h2 className="text-sm font-semibold">
            {odds?.b || "0"}
          </h2>
          <h2 className={`text-xs font-semibold ${
            profitLoss > 0 ? "text-green-600" : "text-gray-600"
          }`}>
            {profitLoss > 0 ? "+" : ""}{profitLoss.toFixed(0)}
          </h2>
        </div>
      </td>
    );
  };

  const rows = Array.from({ length: 8 }, (_, i) => i + 1);

  return (
    <div className="w-full flex flex-col gap-1.5">
      <div className="w-full bg-[var(--bg-table)] border border-gray-100">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border border-gray-300 w-5/12"></th>
              <th className="border border-gray-300 bg-[var(--bg-back)]">
                <h2 className="text-sm font-semibold leading-6">Odd</h2>
              </th>
              <th className="border border-gray-300 bg-[var(--bg-back)]">
                <h2 className="text-sm font-semibold leading-6">Pair Plus</h2>
              </th>
              <th className="border border-gray-300 bg-[var(--bg-back)]">
                <h2 className="text-sm font-semibold leading-6">Total</h2>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((n) => {
              const player = byNation(`Player ${n}`);
              const pair = byNation(`Pair Plus ${n}`);
              const total = byNation(`Total ${n}`);
              return (
                <tr key={n}>
                  <td className="border border-gray-300 w-5/12">
                    <div className="flex md:flex-row flex-col md:items-center items-start justify-start md:gap-2 md:mb-0 mb-1 ">
                      <h2 className="text-sm font-semibold px-2 py-1 leading-6">
                        {`Player ${n}`}
                      </h2>
                      <div className="md:bg-white bg-gray-300 flex items-center justify-center gap-1 w-12 h-5 p-1">
                        {(() => {
                          const cardsString = casinoData?.data?.card || "";
                          const cards = cardsString.split(",").filter((card: string) => card && card.trim());

                          // For Teen8, cards are distributed in round-robin fashion: one card per player per round
                          // Round 1: Player 1 gets cards[0], Player 2 gets cards[1], ..., Player 8 gets cards[7]
                          // Round 2: Player 1 gets cards[8], Player 2 gets cards[9], ..., Player 8 gets cards[15]
                          // Round 3: Player 1 gets cards[16], Player 2 gets cards[17], ..., Player 8 gets cards[23]
                          // Dealer: cards[24], cards[25], cards[26]
                          
                          // For player n (1-8), get cards at indices: (n-1), (n-1+8), (n-1+16)
                          const playerIndex = n - 1; // Convert to 0-based index
                          const playerCards = [
                            cards[playerIndex],           // 1st round
                            cards[playerIndex + 8],       // 2nd round
                            cards[playerIndex + 16],      // 3rd round
                          ].filter((cardCode: string) => cardCode && cardCode !== "1" && cardCode !== undefined);

                          return playerCards.map((cardCode: string, idx: number) => (
                            <div key={idx} className="w-3 h-4">
                              <img
                                src={getCardByCode(cardCode, gameCode)}
                                alt={cardCode}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </td>
                  {renderCell(player, player?.sid || String(n), `Player ${n}`)}
                  {renderCell(pair, pair?.sid || String(8 + n), `Pair Plus ${n}`)}
                  {renderCell(total, total?.sid || String(16 + n), `Total ${n}`)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Results */}
      <div className="mt-1 flex flex-col gap-1">
        <div className="bg-[var(--bg-secondary85)] border border-gray-300 flex justify-between px-2 py-.5 items-center">
          <h2 className="text-sm font-normal leading-8 text-white">
            Last Result
          </h2>
          <h2 
            onClick={() => navigate(`/casino-result?game=${gameCode}`)}
            className="text-sm font-normal leading-8 text-white cursor-pointer hover:text-gray-200"
          >
            View All
          </h2>
        </div>
        <div className="flex justify-end items-center mb-2 gap-1 mx-2">
          {Array.isArray(results) &&
            results.slice(0, 10).map((item: any, index: number) => {
              // const result = item?.result;
              // let displayText = "";
              // let color = "text-gray-200";

              // if (result === 0 || result === "0") {
              //   displayText = "0";
              //   color = "text-red-500";
              // } else if (typeof result === "string" && result.includes(",")) {
              //   // Multiple winners - show count
              //   const winners = result.split(",").filter(w => w.trim() !== "");
              //   displayText = winners.length.toString();
              //   color = "text-green-500";
              // } else if (typeof result === "string" && result.trim() !== "") {
              //   // Single winner
              //   displayText = result;
              //   color = "text-yellow-500";
              // } else {
              //   displayText = "?";
              //   color = "text-gray-400";
              // }

              return (
                <h2
                  key={index}
                  className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-sm font-semibold text-yellow-400 cursor-pointer hover:scale-110 transition-transform`}
                  onClick={() => handleResultClick(item)}
                  title="Click to view details"
                >
                  {"R"}
                </h2>
              );
            })}
        </div>
      </div>

      {/* Individual Result Details Modal */}
      {/* <IndividualResultModal
        isOpen={isModalOpen}
        onClose={closeModal}
        resultId={selectedResult?.mid}
        gameType={gameCode}
        title={`${gameName || "Teen Patti 8"} Result Details`}
        enableBetFiltering={true}
        customGetFilteredBets={getFilteredBets}
      /> */}
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const Teenpatti8 = memoizeCasinoComponent(Teenpatti8Component);
Teenpatti8.displayName = "Teenpatti8";

export default Teenpatti8;
