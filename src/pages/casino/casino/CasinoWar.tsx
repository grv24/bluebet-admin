import {
    cardImage,
    cardType,
    getBlackShapes,
    getCardByCode,
    getRedShapes,
    getShapeColor,
  } from "@/utils/card";
  import React, { useState } from "react";
  import { RiLockFill } from "react-icons/ri";
  import IndividualResultModal from "@/components/casino/IndividualResultModal";
  import { useIndividualResultModal } from "@/hooks/useIndividualResultModal";
  import { useNavigate } from "react-router-dom";
  import { memoizeCasinoComponent } from "@/utils/casinoMemo";
  
  const CasinoWarComponent = ({
    casinoData,
    remainingTime,
    onBetClick,
    results,
    gameSlug,
    gameName,
    currentBet,
  }: any) => {
    const resultModal = useIndividualResultModal();
    const navigate = useNavigate();
  
    const t2: any[] =
      casinoData?.data?.sub || casinoData?.data?.data?.data?.t2 || [];
    const [activeTab, setActiveTab] = useState(1);
  
    // Normalize game slug to match what CasinoMatchDetailsDisplay expects
    const normalizedGameSlug = React.useMemo(() => {
      if (!gameSlug) return "war";
      
      const slugLower = gameSlug.toLowerCase();
      
      // Map specific slugs to expected game types
      const slugMap: { [key: string]: string } = {
        "casino_war": "war",
        "casinowar": "war",
        "war": "war",
      };
  
      // Check exact match first
      if (slugMap[slugLower]) {
        return slugMap[slugLower];
      }
      
      // Check normalized version (without underscores)
      const normalized = slugLower.replace(/_/g, "");
      if (slugMap[normalized]) {
        return slugMap[normalized];
      }
  
      // Return normalized version as fallback
      return normalized || "war";
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
  
    // Debug logging for War component
    console.log("🎰 War component debug:", {
      casinoData,
      t2,
      t2Length: t2.length,
      results,
      resultsLength: results?.length || 0,
      firstResult: results?.[0],
      sampleT2Item: t2[0],
      cardData: casinoData?.data?.card,
      remark: casinoData?.data?.remark,
    });
  
    /**
     * Calculate profit/loss for individual War betting types
     * @param betType - The type of bet to calculate profit/loss for (e.g., "Winner 1", "Red 2", "Odd 3")
     * @returns The profit/loss amount (negative for loss-only display like dt6 Odd/Even)
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
        const { betName, oddCategory, stake } = bet.betData;
  
        // Normalize bet name for comparison
        const normalizedBetName = betName?.toLowerCase() || "";
        const normalizedBetType = betType.toLowerCase();
  
        // Check if this bet matches the current bet type
        let isMatch = false;
  
        // Handle different War bet types
        if (
          normalizedBetType.includes("winner") &&
          normalizedBetName.includes("winner")
        ) {
          // Extract position number from bet type (e.g., "Winner 1" -> "1")
          const positionMatch = betType.match(/(\d+)/);
          const betPositionMatch = betName?.match(/(\d+)/);
  
          if (positionMatch && betPositionMatch) {
            isMatch = positionMatch[1] === betPositionMatch[1];
          }
        } else if (
          normalizedBetType.includes("red") &&
          normalizedBetName.includes("red")
        ) {
          const positionMatch = betType.match(/(\d+)/);
          const betPositionMatch = betName?.match(/(\d+)/);
  
          if (positionMatch && betPositionMatch) {
            isMatch = positionMatch[1] === betPositionMatch[1];
          }
        } else if (
          normalizedBetType.includes("black") &&
          normalizedBetName.includes("black")
        ) {
          const positionMatch = betType.match(/(\d+)/);
          const betPositionMatch = betName?.match(/(\d+)/);
  
          if (positionMatch && betPositionMatch) {
            isMatch = positionMatch[1] === betPositionMatch[1];
          }
        } else if (
          normalizedBetType.includes("odd") &&
          normalizedBetName.includes("odd")
        ) {
          const positionMatch = betType.match(/(\d+)/);
          const betPositionMatch = betName?.match(/(\d+)/);
  
          if (positionMatch && betPositionMatch) {
            isMatch = positionMatch[1] === betPositionMatch[1];
          }
        } else if (
          normalizedBetType.includes("even") &&
          normalizedBetName.includes("even")
        ) {
          const positionMatch = betType.match(/(\d+)/);
          const betPositionMatch = betName?.match(/(\d+)/);
  
          if (positionMatch && betPositionMatch) {
            isMatch = positionMatch[1] === betPositionMatch[1];
          }
        } else if (
          normalizedBetType.includes("spade") &&
          normalizedBetName.includes("spade")
        ) {
          const positionMatch = betType.match(/(\d+)/);
          const betPositionMatch = betName?.match(/(\d+)/);
  
          if (positionMatch && betPositionMatch) {
            isMatch = positionMatch[1] === betPositionMatch[1];
          }
        } else if (
          normalizedBetType.includes("heart") &&
          normalizedBetName.includes("heart")
        ) {
          const positionMatch = betType.match(/(\d+)/);
          const betPositionMatch = betName?.match(/(\d+)/);
  
          if (positionMatch && betPositionMatch) {
            isMatch = positionMatch[1] === betPositionMatch[1];
          }
        } else if (
          normalizedBetType.includes("diamond") &&
          normalizedBetName.includes("diamond")
        ) {
          const positionMatch = betType.match(/(\d+)/);
          const betPositionMatch = betName?.match(/(\d+)/);
  
          if (positionMatch && betPositionMatch) {
            isMatch = positionMatch[1] === betPositionMatch[1];
          }
        } else if (
          normalizedBetType.includes("club") &&
          normalizedBetName.includes("club")
        ) {
          const positionMatch = betType.match(/(\d+)/);
          const betPositionMatch = betName?.match(/(\d+)/);
  
          if (positionMatch && betPositionMatch) {
            isMatch = positionMatch[1] === betPositionMatch[1];
          }
        }
  
        if (isMatch) {
          // Calculate profit/loss for War bets (loss-only display like dt6 Odd/Even)
          if (oddCategory.toLowerCase() === "back") {
            profitLoss += -stake; // Show loss potential
          } else if (oddCategory.toLowerCase() === "lay") {
            profitLoss += stake; // Show profit potential
          }
        }
      });
  
      return profitLoss;
    };
  
    /**
     * Handle clicking on individual result to show details
     */
    const handleResultClick = (result: any) => {
      const resultId = result?.mid || result?.roundId || result?.id || result?.matchId;
      
      if (!resultId) {
        console.error("🎰 CasinoWar: No result ID found in result", result);
        return;
      }
      
      if (!normalizedGameSlug) {
        console.error("🎰 CasinoWar: No gameSlug available", { gameSlug, normalizedGameSlug });
        return;
      }
      
      resultModal.openModal(String(resultId), result);
    };
  
    const isLocked = (row: any) => {
      const status = row?.gstatus as string | number | undefined;
      return (
        status === "SUSPENDED" ||
        status === "CLOSED" ||
        status === 1 ||
        status === "0" ||
        (remainingTime ?? 0) <= 3
      );
    };
  
    const getByNat = (nat: string) =>
      t2.find(
        (x) =>
          String(x?.nat || x?.nation || "").toLowerCase() === nat.toLowerCase()
      );
  
    const renderRow = (baseLabel: string) => (
      <tr className="w-full border border-gray-300">
        <td className="w-4/12 text-[var(--bg-secondary)] border text-base font-semibold leading-10 px-2 border-gray-300">
          {baseLabel === "Red" ? (
            <div className="flex gap-2 items-center">
              <h2 className="md:text-base text-sm font-semibold">Red</h2>
              <div className="flex gap-1 items-center">
                <img src={getRedShapes()?.Diamond} className="w-3 h-3" />{" "}
                <img src={getBlackShapes()?.Spade} className="w-3 h-3" />{" "}
              </div>
            </div>
          ) : baseLabel === "Black" ? (
            <div className="flex gap-2 items-center">
              <h2 className="md:text-base text-sm font-semibold">Black</h2>
              <div className="flex gap-1 items-center">
                <img src={getRedShapes()?.Heart} className="w-3 h-3" />{" "}
                <img src={getBlackShapes()?.Club} className="w-3 h-3" />{" "}
              </div>
            </div>
          ) : baseLabel === "Spade" ? (
            <div className="flex gap-2 items-center">
              {/* <h2 className="text-base font-semibold">Spade</h2> */}
              <div className="flex gap-1 items-center">
                <img src={cardType.Heart} className="w-3 h-3" alt="Spade" />
              </div>
            </div>
          ) : baseLabel === "Heart" ? (
            <div className="flex gap-2 items-center">
              {/* <h2 className="text-base font-semibold">Heart</h2> */}
              <div className="flex gap-1 items-center">
                <img src={cardType.Diamond} className="w-3 h-3" alt="Heart" />
              </div>
            </div>
          ) : baseLabel === "Diamond" ? (
            <div className="flex gap-2 items-center">
              {/* <h2 className="text-base font-semibold">Diamond</h2> */}
              <div className="flex gap-1 items-center">
                <img src={cardType.Club} className="w-3 h-3" alt="Diamond" />
              </div>
            </div>
          ) : baseLabel === "Club" ? (
            <div className="flex gap-2 items-center">
              {/* <h2 className="text-base font-semibold">Club</h2> */}
              <div className="flex gap-1 items-center">
                <img src={cardType.Spade} className="w-3 h-3" alt="Club" />
              </div>
            </div>
          ) : (
            baseLabel
          )}
        </td>
        {[1, 2, 3, 4, 5, 6].map((col) => {
          const nat = `${baseLabel} ${col}`;
          const row = getByNat(nat) || {};
          const locked = isLocked(row);
          const value = (row?.b || row?.b1) ?? "-";
          return (
            <td
              key={`${baseLabel}-${col}`}
              className="relative border min-w-14 leading-10 text-sm font-semibold text-[var(--bg-secondary)] bg-[var(--bg-back)] text-center border-gray-300 cursor-pointer"
              onClick={() => !locked && onBetClick?.(String(row?.sid), "back")}
            >
              {locked && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center gap-3.5 justify-center">
                  <RiLockFill className="text-white text-lg" />
                  {/* profit loss book */}
                  <h2
                    className={`text-xs font-semibold text-center ${
                      getBetProfitLoss(`${baseLabel} ${col}`) > 0
                        ? "text-green-600"
                        : getBetProfitLoss(`${baseLabel} ${col}`) < 0
                          ? "text-red-600"
                          : "text-gray-600"
                    }`}
                  >
                    {getBetProfitLoss(`${baseLabel} ${col}`) > 0 ? "+" : ""}
                    {getBetProfitLoss(`${baseLabel} ${col}`).toFixed(0)}
                  </h2>
                </div>
              )}
              {value}
              {/* profit loss book */}
              <h2
                className={`text-xs font-semibold leading-2 mb-2 text-center ${
                  getBetProfitLoss(`${baseLabel} ${col}`) > 0
                    ? "text-green-600"
                    : getBetProfitLoss(`${baseLabel} ${col}`) < 0
                      ? "text-red-600"
                      : "text-gray-600"
                }`}
              >
                {getBetProfitLoss(`${baseLabel} ${col}`) > 0 ? "+" : ""}
                {getBetProfitLoss(`${baseLabel} ${col}`).toFixed(0)}
              </h2>
            </td>
          );
        })}
      </tr>
    );
  
    // Render betting option row for mobile tabs
    const renderMobileBettingRow = (baseLabel: string, position: number) => {
      const nat = `${baseLabel} ${position}`;
      const row = getByNat(nat) || {};
      const locked = isLocked(row);
      const value = (row?.b || row?.b1) ?? "-";
  
      return (
        <div
          key={`${baseLabel}-${position}`}
          className="flex items-center justify-between h-12 border-b border-gray-200 bg-white"
          onClick={() => !locked && onBetClick?.(String(row?.sid), "back")}
        >
          <div className="flex w-full items-center gap-2 ps-2">
            {baseLabel === "Red" ? (
              <div className="flex gap-1 items-center">
                <span className="text-sm font-semibold text-[var(--bg-secondary)]">
                  Red
                </span>
                <img src={getRedShapes()?.Diamond} className="w-4 h-4" />
                <img src={getBlackShapes()?.Spade} className="w-4 h-4" />
              </div>
            ) : baseLabel === "Black" ? (
              <div className="flex gap-1 items-center">
                <span className="text-sm font-semibold text-[var(--bg-secondary)]">
                  Black
                </span>
                <img src={getRedShapes()?.Heart} className="w-4 h-4" />
                <img src={getBlackShapes()?.Club} className="w-4 h-4" />
              </div>
            ) : baseLabel === "Spade" ? (
              <div className="flex gap-1 items-center">
                   <img src={getRedShapes()?.Heart} className="w-4 h-4" />
                
                {/* <span className="text-sm font-semibold text-[var(--bg-secondary)]">Spade</span> */}
              </div>
            ) : baseLabel === "Heart" ? (
              <div className="flex gap-1 items-center">
             <img src={getBlackShapes()?.Club} className="w-4 h-4" />
                {/* <span className="text-sm font-semibold text-[var(--bg-secondary)]">Heart</span> */}
              </div>
            ) : baseLabel === "Diamond" ? (
              <div className="flex gap-1 items-center">
                <img src={getRedShapes()?.Diamond} className="w-4 h-4" />
                {/* <span className="text-sm font-semibold text-[var(--bg-secondary)]">Diamond</span> */}
              </div>
            ) : baseLabel === "Club" ? (
              <div className="flex gap-1 items-center">
                <img src={getBlackShapes()?.Spade} className="w-4 h-4" />
                {/* <span className="text-sm font-semibold text-[var(--bg-secondary)]">Club</span> */}
              </div>
            ) : (
              <span className="text-sm font-semibold text-[var(--bg-secondary)]">
                {baseLabel}
              </span>
            )}
          </div>
          <div className="relative w-full h-full">
            {locked && (
              <div className="absolute inset-0 bg-black/60 flex flex-col gap-1.5 items-center justify-center">
                <RiLockFill className="text-white text-sm" />
                <h2
                  className={`text-xs font-semibold text-center ${
                    getBetProfitLoss(`${baseLabel} ${position}`) > 0
                      ? "text-green-600"
                      : getBetProfitLoss(`${baseLabel} ${position}`) < 0
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                  {getBetProfitLoss(`${baseLabel} ${position}`) > 0 ? "+" : ""}
                  {getBetProfitLoss(`${baseLabel} ${position}`).toFixed(0)}
                </h2>
              </div>
            )}
            <div className="flex flex-col justify-center items-center text-[var(--bg-secondary)] bg-[var(--bg-back)] h-full w-full">
              <h2 className="text-sm font-semibold">{value}</h2>
              <h2
                className={`text-xs font-semibold ${
                  getBetProfitLoss(`${baseLabel} ${position}`) > 0
                    ? "text-green-600"
                    : getBetProfitLoss(`${baseLabel} ${position}`) < 0
                      ? "text-red-600"
                      : "text-gray-600"
                }`}
              >
                {getBetProfitLoss(`${baseLabel} ${position}`) > 0 ? "+" : ""}
                {getBetProfitLoss(`${baseLabel} ${position}`).toFixed(0)}
              </h2>
            </div>
          </div>
        </div>
      );
    };
  
    return (
      <div className="flex flex-col gap-1">
        <table className="md:block hidden bg-[var(--bg-table-row)]">
          <thead className="bg-[var(--bg-table-row)]">
            <tr className="w-full border border-gray-300">
              <th className="w-1/2"></th>
              {[1, 2, 3, 4, 5, 6].map((i, idx) => {
                // Handle new API format
                const cardString = casinoData?.data?.card;
                let cardCode = null;
  
                if (cardString) {
                  const cards = cardString.split(",");
                  cardCode = cards[i - 1]; // i is 1-based, array is 0-based
                } else {
                  // Handle legacy format
                  const t1 = casinoData?.data?.data?.data?.t1?.[0];
                  cardCode = t1?.[`C${i}`];
                }
  
                return (
                  <th
                    key={idx}
                    className="border w-12 text-center border-gray-300"
                  >
                    <img
                      src={
                        cardCode && cardCode !== "1"
                          ? getCardByCode(cardCode, "war")
                          : cardImage.back
                      }
                      className="w-6 mx-auto my-2"
                      alt={cardCode || "back"}
                    />
                  </th>
                );
              })}
            </tr>
            <tr>
              <th className="w-4/12"></th>
              {[1, 2, 3, 4, 5, 6].map((i, idx) => (
                <th className="border w-18 text-center border-gray-300">{i}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-[var(--bg-table-row)]">
            {renderRow("Winner")}
            {renderRow("Black")}
            {renderRow("Red")}
            {renderRow("Odd")}
            {renderRow("Even")}
            {renderRow("Spade")}
            {renderRow("Heart")}
            {renderRow("Diamond")}
            {renderRow("Club")}
          </tbody>
        </table>
  
        {/* Mobile Tabbed Interface */}
        <div className="md:hidden flex flex-col">
          {/* Card Header */}
          <div className="grid grid-cols-6 border border-gray-200">
            {[1, 2, 3, 4, 5, 6].map((i, idx) => {
              // Handle new API format
              const cardString = casinoData?.data?.card;
              let cardCode = null;
  
              if (cardString) {
                const cards = cardString.split(",");
                cardCode = cards[i - 1]; // i is 1-based, array is 0-based
              } else {
                // Handle legacy format
                const t1 = casinoData?.data?.data?.data?.t1?.[0];
                cardCode = t1?.[`C${i}`];
              }
  
              return (
                <div
                  key={idx}
                  className="col-span-1 border-r border-gray-200 last:border-r-0 p-2"
                >
                  <img
                    src={
                      cardCode && cardCode !== "1"
                        ? getCardByCode(cardCode, "war")
                        : cardImage.back
                    }
                    className="w-8 mx-auto"
                    alt={cardCode || "back"}
                  />
                </div>
              );
            })}
          </div>
  
          {/* Tab Headers */}
          <div className="grid grid-cols-6 bg-[var(--bg-primary)]">
            {[1, 2, 3, 4, 5, 6].map((i, idx) => (
              <button
                key={idx}
                className={`border text-white text-center border-gray-300 py-2 ${
                  activeTab === i ? "border-t-4 border-white" : ""
                }`}
                onClick={() => setActiveTab(i)}
              >
                {i}
              </button>
            ))}
          </div>
  
          {/* Tab Content */}
          <div className="bg-white border border-gray-200">
            {renderMobileBettingRow("Winner", activeTab)}
            {renderMobileBettingRow("Black", activeTab)}
            {renderMobileBettingRow("Red", activeTab)}
            {renderMobileBettingRow("Odd", activeTab)}
            {renderMobileBettingRow("Even", activeTab)}
            {renderMobileBettingRow("Spade", activeTab)}
            {renderMobileBettingRow("Heart", activeTab)}
            {renderMobileBettingRow("Diamond", activeTab)}
            {renderMobileBettingRow("Club", activeTab)}
          </div>
        </div>
  
        {/* Results */}
        <div className="mt-1 flex flex-col gap-1">
          <div className="bg-[var(--bg-secondary85)] border border-gray-300 flex justify-between px-2 py-.5 items-center">
            <h2 className="text-sm font-normal leading-8 text-white">
              Last Result
            </h2>
            <h2
              onClick={() => navigate(`/casino-result?game=CASINO_WAR`)}
              className="text-sm font-normal leading-8 text-white cursor-pointer hover:text-gray-200"
            >
              View All
            </h2>
          </div>
          <div className="flex justify-end items-center mb-2 gap-1 mx-2">
            {results?.slice(0, 10).map((item: any, index: number) => {
              // Parse the result string (e.g., "3,6" -> ["3", "6"])
              const resultNumbers = item.result
                ? item.result.split(",").map((num: string) => num.trim())
                : [];
  
              // Determine display text and color based on result
              let displayText = "";
              let textColor = "";
  
              if (resultNumbers.length === 0) {
                displayText = "?";
                textColor = "text-gray-400";
              } else if (resultNumbers.length === 1) {
                displayText = resultNumbers[0];
                textColor = "text-blue-500";
              } else if (resultNumbers.length === 2) {
                displayText = resultNumbers[0];
                textColor = "text-green-500";
              } else if (resultNumbers.length >= 3) {
                displayText = resultNumbers[0];
                textColor = "text-red-500";
              }
  
              return (
                <h2
                  key={index}
                  className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-sm font-semibold text-yellow-400 cursor-pointer hover:scale-110 transition-transform`}
                  onClick={() => handleResultClick(item)}
                  title={`Result: ${item.result}`}
                >
                  {"R"}
                </h2>
              );
            })}
          </div>
        </div>
  
        {/* Individual Result Details Modal */}
        <IndividualResultModal
          isOpen={resultModal.isOpen}
          onClose={resultModal.closeModal}
          resultId={resultModal.selectedResultId || undefined}
          gameType={normalizedGameSlug}
          title={`${gameName || "Casino War"} Result Details`}
          customGetFilteredBets={getFilteredBets}
        />
      </div>
    );
  };
  
  // 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
  const CasinoWar = memoizeCasinoComponent(CasinoWarComponent);
  CasinoWar.displayName = "CasinoWar";
  
  export default CasinoWar;
  