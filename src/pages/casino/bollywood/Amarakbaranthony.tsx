import { cardImage, cardType, getBlackShapes, getNumberCard, getRedShapes } from "../../../utils/card";
import { RiLockFill } from "react-icons/ri";
import React from "react";
// import IndividualResultModal from "@/components/casino/IndividualResultModal";
// import { useIndividualResultModal } from "@/hooks/useIndividualResultModal";
import { useNavigate } from "react-router-dom";
import { memoizeCasinoComponent } from "../../../utils/casinoMemo";

const AmarakbaranthonyComponent = ({
  casinoData,
  remainingTime,
  onBetClick,
  results,
  gameSlug,
  gameName,
  currentBet,
}: any) => {
  // const resultModal = useIndividualResultModal();
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

  // Normalize game slug for IndividualResultModal
  const normalizedGameSlug = React.useMemo(() => {
    if (gameSlug) {
      const lowerCaseSlug = gameSlug.toLowerCase();
      if (lowerCaseSlug === "aaa" || lowerCaseSlug === "aaa_2") {
        return "aaa";
      }
      return lowerCaseSlug.replace(/[^a-z0-9]/g, "");
    }
    return "aaa"; // Default fallback
  }, [gameSlug]);

  /**
   * Handle clicking on individual result to show details
   */
  const handleResultClick = (result: any) => {
    const resultId = result?.mid || result?.roundId || result?.id || result?.matchId;
    if (!resultId) {
      console.error("🎰 AAA: No result ID found in result", result);
      alert("Unable to open result details: Missing result ID");
      return;
    }
    // resultModal.openModal(String(resultId), result);
  };
  // Handle both new API format (casinoData?.data?.sub) and legacy format (casinoData?.data?.data?.data?.t2)
  const t2: any[] = casinoData?.data?.sub || casinoData?.data?.data?.data?.t2 || [];
  
  console.log("🎰 AAA data filtering:", {
    t2Length: t2.length,
    hasSub: !!(casinoData?.data?.sub),
    hasLegacyT2: !!(casinoData?.data?.data?.data?.t2),
    t2Data: t2.map(item => ({ sid: item.sid, nat: item.nat, nation: item.nation, gstatus: item.gstatus, b: item.b, b1: item.b1, l: item.l, l1: item.l1 }))
  });
  const isLocked = (row: any) => {
    const s = row?.gstatus as string | number | undefined;
    // For AAA, gstatus "1" means active, "0" means suspended, "SUSPENDED" means suspended
    return (
      s === "SUSPENDED" ||
      s === "CLOSED" ||
      s === 0 ||
      s === "0" ||
      (remainingTime ?? 0) <= 3
    );
  };
  const getByNat = (name: string) => {
    const found = t2.find(
      (x) =>
        String(x?.nat || x?.nation || "").toLowerCase() === name.toLowerCase()
    );
    console.log(`🎰 AAA getByNat lookup for "${name}":`, found);
    return found;
  };
  const toCardNat = (key: string) => {
    if (key === "1") return "Card A";
    if (key === "11") return "Card J";
    if (key === "11") return "Card Q";
    if (key === "13") return "Card K";
    return `Card ${key}`;
  };

  /**
   * Calculate profit/loss for main player bets (Amar, Akbar, Anthony) using book calculation
   */
  const getPlayerBetProfitLoss = (playerName: string): number => {
    if (!currentBet?.data || !casinoData?.data?.mid) return 0;

    const currentMatchId = casinoData.data.mid;
    let book: Record<string, number> = {
      "Amar": 0,
      "Akbar": 0,
      "Anthony": 0
    };

    const bets = currentBet.data.filter(
      (bet: any) => String(bet.matchId) === String(currentMatchId)
    );

    bets.forEach((bet: any) => {
      const { betName, stake, betRate, oddCategory } = bet.betData;

      if (betName === "Amar" || betName === "Akbar" || betName === "Anthony") {
        const currentPlayer = betName;

        if (oddCategory.toLowerCase() === "back") {
          const profit = stake * (betRate - 1);
          const loss = -stake;

          book[currentPlayer] += profit;
          Object.keys(book).forEach(key => {
            if (key !== currentPlayer) {
              book[key] += loss;
            }
          });
        } else if (oddCategory.toLowerCase() === "lay") {
          const loss = stake * (betRate - 1);
          const profit = stake;

          book[currentPlayer] -= loss;
          Object.keys(book).forEach(key => {
            if (key !== currentPlayer) {
              book[key] += profit;
            }
          });
        }
      }
    });

    return book[playerName] || 0;
  };

  /**
   * Calculate profit/loss for specific betting types (Even, Odd, Red, Black, Under/Over, Cards) - loss-only display
   */
  const getBetProfitLoss = (betType: string): number => {
    if (!currentBet?.data || !casinoData?.data?.mid) return 0;

    const currentMatchId = casinoData.data.mid;
    let profitLoss = 0;

    const bets = currentBet.data.filter(
      (bet: any) => String(bet.matchId) === String(currentMatchId)
    );

    bets.forEach((bet: any) => {
      const { betName, stake } = bet.betData;

      const normalizedBetName = betName?.toLowerCase() || "";
      const normalizedBetType = betType.toLowerCase();

      let isMatch = false;

      // Exact match first
      if (normalizedBetName === normalizedBetType) {
        isMatch = true;
      }
      // Handle Even/Odd
      else if (betType === "Even" && normalizedBetName === "even") {
        isMatch = true;
      }
      else if (betType === "Odd" && normalizedBetName === "odd") {
        isMatch = true;
      }
      // Handle Red/Black
      else if (betType === "Red" && normalizedBetName === "red") {
        isMatch = true;
      }
      else if (betType === "Black" && normalizedBetName === "black") {
        isMatch = true;
      }
      // Handle Under/Over
      else if (betType === "Under 7" && normalizedBetName.includes("under")) {
        isMatch = true;
      }
      else if (betType === "Over 7" && normalizedBetName.includes("over")) {
        isMatch = true;
      }
      // Handle Cards
      else if (betType.startsWith("Card") && normalizedBetName.startsWith("card")) {
        const cardNumber = betType.split(" ")[1];
        isMatch = normalizedBetName.includes(cardNumber.toLowerCase());
      }

      if (isMatch) {
        profitLoss = -stake; // Loss-only display
      }
    });

    return profitLoss;
  };
  return (
    <div className="flex flex-col gap-1 bg-[var(--bg-table-row)] mt-1.5">
      {/* first row */}
      <div className="grid lg:grid-cols-3 grid-cols-1 place-items-center lg:gap-1 gap-0 py-1">
        {["Amar", "Akbar", "Anthony"].map((name, idx) => {
          const row = getByNat(name) || {};
          const locked = isLocked(row);
          const profitLoss = getPlayerBetProfitLoss(name);
          return (
            <div
              key={idx}
              className="col-span-1 flex lg:flex-col flex-row lg:border-0 border border-gray-300 lg:gap-1 gap-0 justify-center items-center w-full"
            >
              <h2 className="text-base font-semibold text-[var(--bg-secondary)] w-full lg:text-center text-left">
              <span className="inline-block md:hidden ps-2">{name==="Amar"?"A.":name==="Akbar"?"B.":"C."}</span>  {name}
              </h2>
              <h2 
                className={`text-xs md:me-0 me-2 font-medium ${
                  profitLoss > 0
                    ? "text-green-600"
                    : profitLoss < 0
                      ? "text-red-600"
                      : "text-gray-600"
                }`}
              >
                {profitLoss > 0 ? "+" : ""}
                {profitLoss.toFixed(0)}
              </h2>
              <div className="flex lg:gap-1 gap-0 items-center w-full">
                <div
                  className="relative bg-[var(--bg-back)] w-full border border-gray-300 text-center text-base font-semibold leading-10 text-[var(--bg-secondary)] cursor-pointer"
                  onClick={() => {
                    console.log("🎰 AAA Back bet click:", { name, sid: row?.sid, odds: row, locked });
                    if (!locked) {
                      onBetClick?.(String(row?.sid), "back");
                    }
                  }}
                >
                  {locked && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <RiLockFill className="text-white text-lg" />
                    </div>
                  )}
                  {(row?.b || row?.b1) ?? "-"}
                </div>
                <div
                  className="relative bg-[var(--bg-lay)] w-full border border-gray-300 text-center text-base font-semibold leading-10 text-[var(--bg-secondary)] cursor-pointer"
                  onClick={() => {
                    console.log("🎰 AAA Lay bet click:", { name, sid: row?.sid, odds: row, locked });
                    if (!locked) {
                      onBetClick?.(String(row?.sid), "lay");
                    }
                  }}
                >
                  {locked && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <RiLockFill className="text-white text-lg" />
                    </div>
                  )}
                  {(row?.l || row?.l1) ?? "-"}
                        </div>
      </div>

      {/* Individual Result Details Modal */}
      {/* <IndividualResultModal
        isOpen={resultModal.isOpen}
        onClose={resultModal.closeModal}
        resultId={resultModal.selectedResultId || undefined}
        gameType={normalizedGameSlug}
        title={`${gameName || "Amar Akbar Anthony"} Result Details`}
        enableBetFiltering={true}
        customGetFilteredBets={getFilteredBets}
      /> */}
    </div>
  );
        })}
      </div>
      {/* second row */}
      <div className="grid grid-cols-3 gap-1  w-full">
        {[
          ["Even", "Odd"],
          ["Red", "Black"],
          ["Under 7", "Over 7"],
        ].map((pair, colIdx) => (
          <div
            key={colIdx}
            className="col-span-1 flex flex-col border border-gray-300 gap-1 p-1"
          >
            {pair.map((label, idx) => {
              const row = getByNat(label) || {};
              const locked = isLocked(row);
              const profitLoss = getBetProfitLoss(label);
              return (
                <div
                  key={idx}
                  className="flex flex-col items-center justify-center"
                >
                  <h2>{(row?.b || row?.b1) ?? "-"}</h2>
                 
                  <button
                    className="relative gradient left to right bg-gradient-to-r from-[var(--bg-primary)] to-[var(--bg-secondary)] text-white w-full leading-10"
                    disabled={locked}
                    onClick={() => {
                      console.log("🎰 AAA Button bet click:", { label, sid: row?.sid, odds: row, locked });
                      if (!locked) {
                        onBetClick?.(String(row?.sid), "back");
                      }
                    }}
                  >
                    {locked && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <RiLockFill className="text-white text-lg" />
                      </div>
                    )}
                    {label === "Red" ? (<div className="flex gap-1 py-2.5 justify-center items-center" >
                      <img className="w-5" src={getRedShapes().Diamond} alt="Red Diamond" />
                      <img className="w-5" src={getBlackShapes().Spade} alt="Red Spade" />
                    </div>
                    ) : label === "Black" ? (
                      <div className="flex gap-1 py-2.5 justify-center items-center">
                        <img className="w-5" src={getRedShapes().Heart} alt="Black Heart" />
                        <img className="w-5" src={getBlackShapes().Club} alt="Black Club" />
                      </div>
                    ) : (
                      label
                    )}
                    
                  </button>
                  <h2 
                    className={`text-xs mt-1 font-medium ${
                      profitLoss > 0
                        ? "text-green-600"
                        : profitLoss < 0
                          ? "text-red-600"
                          : "text-gray-600"
                    }`}
                  >
                    {profitLoss > 0 ? "+" : ""}
                    {profitLoss.toFixed(0)}
                  </h2>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* third row */}
      <div className="w-full flex flex-col gap-2 py-4">
        <h2 className="text-center">{(getByNat("Card J")?.b || getByNat("Card J")?.b1) ?? "0"}</h2>
        {/* Desktop: 13 in a single row */}
        <div className="w-8/12 mx-auto hidden lg:grid lg:grid-cols-[repeat(13,minmax(0,1fr))] gap-1 place-items-center place-content-center">
          {[
            "A",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "10",
            "J",
            "Q",
            "K",
          ].map((key, idx) => {
            const row = getByNat(toCardNat(key)) || {};
            const locked = isLocked(row);
            const profitLoss = getBetProfitLoss(toCardNat(key));
            return (
              <div
                key={idx}
                className="w-full  text-center text-base font-semibold text-[var(--bg-secondary)] flex flex-col items-center justify-center"
              >
                
                <button
                  className="relative w-full h-full flex items-center justify-center"
                  disabled={locked}
                  onClick={() => {
                    console.log("🎰 AAA Card bet click:", { key, sid: row?.sid, odds: row, locked });
                    if (!locked) {
                      onBetClick?.(String(row?.sid), "back");
                    }
                  }}
                >
                  {locked && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <RiLockFill className="text-white text-lg" />
                    </div>
                  )}
                  <img src={getNumberCard(key)} alt="" className="w-8" />
                </button>
                <h2 
                  className={`text-xs mt-1 font-medium ${
                    profitLoss > 0
                      ? "text-green-600"
                      : profitLoss < 0
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                  {profitLoss > 0 ? "+" : ""}
                  {profitLoss.toFixed(0)}
                </h2>
              </div>
            );
          })}
        </div>
        {/* Mobile: 10 on first row, then centered J Q K */}
        <div className="w-11/12 mx-auto grid lg:hidden gap-2">
          <div className="grid grid-cols-10 gap-1 place-items-center">
            {["A", "2", "3", "4", "5", "6", "7", "8", "9", "10"].map(
              (key, idx) => {
                const row = getByNat(toCardNat(key)) || {};
                const locked = isLocked(row);
                const profitLoss = getBetProfitLoss(toCardNat(key));
                return (
                  <div
                    key={idx}
                    className="w-full  text-center text-base font-semibold text-[var(--bg-secondary)] flex flex-col items-center justify-center"
                  >
                   
                  <button
                    className="relative w-full h-full flex items-center justify-center"
                      disabled={locked}
                      onClick={() => {
                        console.log("🎰 AAA Mobile card bet click:", { key, sid: row?.sid, odds: row, locked });
                        if (!locked) {
                          onBetClick?.(String(row?.sid), "back");
                        }
                      }}
                    >
                    {locked && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <RiLockFill className="text-white text-lg" />
                      </div>
                    )}
                    <img src={getNumberCard(key)} alt="" className="w-8" />
                    </button>
                    <h2 
                      className={`text-xs mt-1 font-medium ${
                        profitLoss > 0
                          ? "text-green-600"
                          : profitLoss < 0
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {profitLoss > 0 ? "+" : ""}
                      {profitLoss.toFixed(0)}
                    </h2>
                  </div>
                );
              }
            )}
          </div>
          <div className="w-full mt-4 flex justify-center">
            <div className="grid grid-cols-3 gap-1 place-items-center">
              {["J", "Q", "K"].map((key, idx) => {
                const row = getByNat(toCardNat(key)) || {};
                const locked = isLocked(row);
                const profitLoss = getBetProfitLoss(toCardNat(key));
                return (
                  <div
                    key={idx}
                    className="w-full  text-center text-base font-semibold text-[var(--bg-secondary)] flex flex-col items-center justify-center"
                  >
                  
                    <button
                      className="relative w-full h-full flex items-center justify-center"
                      disabled={locked}
                      onClick={() => {
                        console.log("🎰 AAA Mobile JQK bet click:", { key, sid: row?.sid, odds: row, locked });
                        if (!locked) {
                          onBetClick?.(String(row?.sid), "back");
                        }
                      }}
                    >
                      {locked && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <RiLockFill className="text-white text-lg" />
                        </div>
                      )}
                      <img src={getNumberCard(key)} alt="" className="w-8" />
                    </button>
                    <h2 
                      className={`text-xs mt-1 font-medium ${
                        profitLoss > 0
                          ? "text-green-600"
                          : profitLoss < 0
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {profitLoss > 0 ? "+" : ""}
                      {profitLoss.toFixed(0)}
                    </h2>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      {/* Results */}
      <div className="mt-1 flex flex-col gap-1">
        <div className="bg-[var(--bg-secondary85)] border border-gray-300 flex justify-between px-2 py-.5 items-center">
          <h2 className="text-sm font-normal leading-8 text-white">
            Last Result
          </h2>
          <h2 
            onClick={() => navigate(`/casino-result?game=AAA`)}
            className="text-sm font-normal leading-8 text-white cursor-pointer hover:text-gray-200"
          >
            View All
          </h2>
        </div>
        <div className="flex justify-end items-center mb-2 gap-1 mx-2">
          {Array.isArray(results) &&
            results?.slice(0, 10).map((item: any, index: number) => {
              const result = item?.result || item?.win;
              let displayText = "";
              let color = "text-gray-200";
              
              if (result === "1") {
                displayText = "A"; // Amar
                color = "text-red-500";
              } else if (result === "2") {
                displayText = "B"; // Akbar
                color = "text-yellow-500";
              } else if (result === "3") {
                displayText = "C"; // Anthony
                color = "text-blue-300";
              } else {
                displayText = "?";
                color = "text-gray-400";
              }
              
              return (
                <h2
                  key={index}
                  className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-sm font-semibold ${color} cursor-pointer hover:scale-110 transition-transform`}
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
        gameType={normalizedGameSlug}
        title={`${gameName || "Amar Akbar Anthony"} Result Details`}
        enableBetFiltering={true}
        customGetFilteredBets={getFilteredBets}
      /> */}
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const Amarakbaranthony = memoizeCasinoComponent(AmarakbaranthonyComponent);
Amarakbaranthony.displayName = "Amarakbaranthony";

export default Amarakbaranthony;
