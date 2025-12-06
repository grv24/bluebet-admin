import React, { useState } from "react";
import { RiLockFill } from "react-icons/ri";
import { getCardByCode, cardImage } from "../../../utils/card";
import { useNavigate } from "react-router-dom";
// import IndividualResultModal from "@/components/casino/IndividualResultModal";
// import { useIndividualResultModal } from "@/hooks/useIndividualResultModal";
import { memoizeCasinoComponent } from "../../../utils/casinoMemo";

type Poker6PlayerProps = {  
  casinoData: any;
  remainingTime: number;
  results: any;
  gameSlug: string;
  gameName: string;
};

const Poker6PlayerComponent: React.FC<Poker6PlayerProps> = (_props) => {
  const { casinoData, remainingTime, results, gameSlug, gameName } =
    _props;

  const navigate = useNavigate();
  // const resultModal = useIndividualResultModal();

  // Convert gameSlug to actual game slug format if needed
  // gameSlug might be "poker6" or "POKER_6", normalize it
  const actualGameSlug = React.useMemo(() => {
    if (gameSlug) {
      return gameSlug.toLowerCase().replace(/[^a-z0-9]/g, "");
    }
    return "poker6"; // Default fallback
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

  // Debug: Log data
  console.log("🎰 Poker6 casino data:", casinoData);
  console.log("🎰 Poker6 results data:", results);

  /**
   * Handle clicking on individual result to show details
   */
  const handleResultClick = (result: any) => {
    const resultId = result?.mid || result?.roundId || result?.id || result?.matchId;
    
    if (!resultId) {
      console.error("🎰 Poker6Player: No result ID found in result", result);
      return;
    }
    
    if (!actualGameSlug) {
      console.error("🎰 Poker6Player: No gameSlug available", { gameSlug, actualGameSlug });
      return;
    }
    
    // resultModal.openModal(String(resultId), result);
  };
  // Handle both new API format (casinoData?.data?.sub) and legacy format (casinoData?.data?.data?.data?.t2)
  const t1 = (casinoData as any)?.data?.data?.data?.t1?.[0] ?? null;
  const t2 =
    (casinoData as any)?.data?.sub ||
    ((casinoData as any)?.data?.data?.data?.t2 as any[]) ||
    [];
  const players = t2.filter((x: any) => x?.sr >= 1 && x?.sr <= 6);
  const patternOdds = t2.filter((x: any) => x?.sr >= 7 && x?.sr <= 15);

  console.log("🎰 Poker6 data filtering:", {
    t2Length: t2.length,
    playersCount: players.length,
    patternOddsCount: patternOdds.length,
    players: players.map((p: any) => ({
      sid: p.sid,
      nat: p.nat,
      sr: p.sr,
      gstatus: p.gstatus,
    })),
    patternOdds: patternOdds.map((p: any) => ({
      sid: p.sid,
      nat: p.nat,
      sr: p.sr,
      gstatus: p.gstatus,
    })),
    hasSub: !!(casinoData as any)?.data?.sub,
    hasLegacyT2: !!(casinoData as any)?.data?.data?.data?.t2,
  });
  const isSusp = (item: any) => {
    const status: any = item?.gstatus;
    // For Poker6, gstatus "1" means active, "0" means suspended
    return (
      status === "SUSPENDED" ||
      status === "0" ||
      status === 0 ||
      (remainingTime ?? 0) <= 3
    );
  };
  const display = (v: any) => (v && v !== "0" ? v : "-");
  const [activeTab, setActiveTab] = useState<"hands" | "patterns">("hands");
  return (
    <div className="w-full flex flex-col gap-1.5">
      {/* tab */}
      <div className="flex items-center justify-items-start mt-1">
        <h2
          onClick={() => {
            setActiveTab("hands");
          }}
          className={`text-base font-normal px-4 py-1.5 ${
            activeTab === "hands"
              ? "bg-[var(--bg-secondary)] text-white"
              : "bg-[var(--bg-table-row)] text-[var(--bg-secondary)]"
          }`}
        >
          Hands
        </h2>
        <h2
          onClick={() => {
            setActiveTab("patterns");
          }}
          className={`text-base font-normal px-4 py-1.5 ${
            activeTab === "patterns"
              ? "bg-[var(--bg-secondary)] text-white"
              : "bg-[var(--bg-table-row)] text-[var(--bg-secondary)]"
          }`}
        >
          Patterns
        </h2>
      </div>
      {/* content */}
      <div className="w-full">
        {/* hands */}
        {activeTab === "hands" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {players.map((item: any) => (
              <div
                key={item?.sid}
                className="flex relative justify-between bg-[var(--bg-back)] py-1.5 px-2 items-center hover:bg-gray-100"
                onClick={() => {
                  console.log("🎰 Poker6 Player bet click:", {
                    sid: item.sid,
                    odds: item,
                    suspended: isSusp(item),
                  });
                  if (!isSusp(item)) {
                  }
                }}
              >
                {isSusp(item) && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <RiLockFill className="text-white text-xl" />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-[var(--bg-secondary)]">
                    {item?.nat ?? item?.nation}
                  </h2>
                  {(() => {
                    // Handle both new API format (casinoData?.data?.card) and legacy format (t1)
                    const playerNumber = item?.sr;
                    let card1, card2;

                    // Try new API format first
                    const cardString = (casinoData as any)?.data?.card;
                    if (cardString) {
                      const cards = cardString.split(",");
                      // For poker6: first 6 cards for each player's first card, next 6 for second card
                      if (playerNumber >= 1 && playerNumber <= 6) {
                        // First card: playerNumber - 1 (positions 0-5)
                        // Second card: playerNumber + 5 (positions 6-11)
                        const cardIndex1 = playerNumber - 1;
                        const cardIndex2 = playerNumber + 5;
                        card1 = cards[cardIndex1];
                        card2 = cards[cardIndex2];

                        console.log(`🎰 Poker6 Player ${playerNumber} cards:`, {
                          cardIndex1,
                          cardIndex2,
                          card1,
                          card2,
                          allCards: cards,
                        });
                      }
                    } else {
                      // Fallback to legacy format
                      let card1Index, card2Index;
                      if (playerNumber === 1) {
                        card1Index = "C1";
                        card2Index = "C7";
                      } else if (playerNumber === 2) {
                        card1Index = "C2";
                        card2Index = "C8";
                      } else if (playerNumber === 3) {
                        card1Index = "C3";
                        card2Index = "C9";
                      } else if (playerNumber === 4) {
                        card1Index = "C4";
                        card2Index = "C10";
                      } else if (playerNumber === 5) {
                        card1Index = "C5";
                        card2Index = "C11";
                      } else if (playerNumber === 6) {
                        card1Index = "C6";
                        card2Index = "C12";
                      }

                      card1 = card1Index
                        ? t1?.[card1Index as keyof typeof t1]
                        : null;
                      card2 = card2Index
                        ? t1?.[card2Index as keyof typeof t1]
                        : null;
                    }

                    // Don't render container if both cards are "1"
                    if (card1 === "1" && card2 === "1") {
                      return null;
                    }

                    // Filter out cards with value "1"
                    const validCards = [card1, card2].filter(
                      (cardCode) => cardCode !== "1"
                    );

                    // Don't render container if no valid cards
                    if (validCards.length === 0) {
                      return null;
                    }

                    return (
                      <div className="bg-white w-12 flex items-center justify-center gap-2 h-fit ">
                        {validCards.map((cardCode, idx) => (
                          <div key={idx} className="w-4 h-6">
                            <img
                              src={
                                cardCode
                                  ? getCardByCode(cardCode, "poker6")
                                  : cardImage.back
                              }
                              className="w-full h-full object-cover"
                              alt={cardCode || "back"}
                            />
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
                <h2 className="text-base text-[var(--bg-secondary)] font-semibold">
                  {(item?.b || item?.b1) ?? "0"}
                </h2>
              </div>
            ))}
          </div>
        )}
        {/* patterns */}
        {activeTab === "patterns" && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {patternOdds.map((item: any) => (
              <div
                key={item?.sid}
                className="flex relative justify-between bg-[var(--bg-back)] py-1.5 px-2 items-center hover:bg-gray-100"
                onClick={() => {
                  console.log("🎰 Poker6 Pattern bet click:", {
                    sid: item.sid,
                    odds: item,
                    suspended: isSusp(item),
                  });
                  if (!isSusp(item)) {
                  }
                }}
              >
                {isSusp(item) && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <RiLockFill className="text-white text-xl" />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-[var(--bg-secondary)]">
                    {item?.nat ?? item?.nation}
                  </h2>
                </div>
                <h2 className="text-base text-[var(--bg-secondary)] font-semibold">
                  {(item?.b || item?.b1) ?? "0"}
                </h2>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* hamburger */}
      {/* {(() => {
        const remarkText = t1?.remark ?? "";
        return (
          <div className="w-full bg-white text-[var(--bg-primary)] overflow-hidden">
            <div className="whitespace-nowrap text-xs h-4 font-extrabold uppercase tracking-wide animate-marquee">
              {remarkText}
            </div>
          </div>
        );
      })()} */}

      {/* Results */}
      <div className="flex flex-col gap-1">
        <div className="bg-[var(--bg-secondary85)] border border-gray-300 flex justify-between px-2 py-.5 items-center">
          <h2 className="text-sm font-normal leading-8 text-white">
            Last Result
          </h2>
          <h2
            onClick={() => navigate(`/casino-result?game=POKER_9`)}
            className="text-sm font-normal leading-8 text-white hover:text-gray-200"
          >
            View All
          </h2>
        </div>
        <div className="flex justify-end items-center mb-2 gap-1 mx-2">
          {Array.isArray(results) &&
            results.slice(0, 10).map((item: any, index: number) => {
              const result = item?.result || item?.win;
              let displayText = "";
              let color = "text-gray-200";

              if (result === 0 || result === "0") {
                displayText = "T";
                color = "text-red-500";
              } else if (result >= 11 && result <= 16) {
                // Player results (11-16 map to Player 1-6)
                displayText = (result - 10).toString();
                color = "text-yellow-500";
              } else if (result >= 21 && result <= 29) {
                // Pattern results (21-29 map to patterns)
                const patternMap: { [key: number]: string } = {
                  21: "HC", // High Card
                  22: "P", // Pair
                  23: "2P", // Two Pair
                  24: "3K", // Three of a Kind
                  25: "S", // Straight
                  26: "F", // Flush
                  27: "FH", // Full House
                  28: "4K", // Four of a Kind
                  29: "SF", // Straight Flush
                };
                displayText = patternMap[result] || "?";
                color = "text-green-500";
              } else {
                displayText = "?";
                color = "text-gray-400";
              }

              return (
                <h2
                  key={index}
                  className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-sm font-semibold ${color} hover:scale-110 transition-transform`}
                  onClick={() => handleResultClick(item)}
                  title="Click to view details"
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
        gameType={actualGameSlug}
        title={`${gameName || "Poker 6 Player"} Result Details`}
        customGetFilteredBets={getFilteredBets}
      /> */}
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const Poker6Player = memoizeCasinoComponent(Poker6PlayerComponent);
Poker6Player.displayName = "Poker6Player";

export default Poker6Player;
