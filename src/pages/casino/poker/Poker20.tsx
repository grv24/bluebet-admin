import React, { useState } from "react";
import { RiLockFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import IndividualResultModal from "@/components/casino/IndividualResultModal";
import { useIndividualResultModal } from "@/hooks/useIndividualResultModal";
import { memoizeCasinoComponent } from "@/utils/casinoMemo";

const Poker20Component = ({
  casinoData,
  remainingTime,
  onBetClick,
  results,
  gameSlug,
  gameName,
  currentBet,
}: {
  casinoData: any;
  remainingTime: number;
  onBetClick: (sid: string, type: string) => void;
  results: any[];
  gameSlug: string;
  gameName: string;
  currentBet: any;
}) => {
  const navigate = useNavigate();
  const resultModal = useIndividualResultModal();

  // Convert gameSlug to actual game slug format if needed
  // gameSlug might be "poker20" or "POKER_20", normalize it
  const actualGameSlug = React.useMemo(() => {
    if (gameSlug) {
      return gameSlug.toLowerCase().replace(/[^a-z0-9]/g, "");
    }
    return "poker20"; // Default fallback
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


  // Handle both new API format (casinoData?.data?.sub) and legacy format (casinoData?.data?.data?.data?.t2)
  const t2 =
    (casinoData as any)?.data?.sub ||
    (casinoData as any)?.data?.data?.data?.t2 ||
    [];

  console.log("🎰 Poker20 component debug:", {
    casinoData,
    t2,
    t2Length: t2.length,
    sampleT2Item: t2[0],
    hasSub: !!(casinoData as any)?.data?.sub,
    hasLegacyT2: !!(casinoData as any)?.data?.data?.data?.t2,
  });

  /**
   * Handle clicking on individual result to show details
   */
  const handleResultClick = (result: any) => {
    const resultId = result?.mid || result?.roundId || result?.id || result?.matchId;
    
    if (!resultId) {
      console.error("🎰 Poker20: No result ID found in result", result);
      return;
    }
    
    if (!actualGameSlug) {
      console.error("🎰 Poker20: No gameSlug available", { gameSlug, actualGameSlug });
      return;
    }
    
    resultModal.openModal(String(resultId), result);
  };

  const findSide = (nation: string, side: "A" | "B") => {
    const pref = side === "A" ? "1" : "2"; // 1x for A, 2x for B
    return (
      t2.find(
        (m: any) =>
          String(m.nat).toLowerCase() === nation.toLowerCase() &&
          String(m.sid).startsWith(pref)
      ) || null
    );
  };

  const isSuspended = (m: any) => {
    const s = m?.gstatus as string | number | undefined;
    return (
      s === "SUSPENDED" ||
      s === 0 ||
      s === "0" ||
      String(s) === "0" ||
      remainingTime <= 3
    );
  };

  const getProfitLoss = () => {
    if (!currentBet?.data || !casinoData?.data?.mid)
      return { Dragon: 0, Tiger: 0 };

    const currentMatchId = casinoData.data.mid;
    let book: Record<string, number> = { Dragon: 0, Tiger: 0 };

    // Only bets for this match
    const bets = currentBet.data.filter(
      (bet: any) => String(bet.matchId) === String(currentMatchId)
    );

    bets.forEach((bet: any) => {
      const { sid, betName, name, nation, oddCategory, stake, betRate } = bet.betData;
      const result = bet.betData?.result;

      if (!result || !result.settled) return;

      // Use the actual profit/loss from the result
      let profitLoss = 0;

      if (result.status === "won" || result.status === "profit") {
        profitLoss = Number(result.profitLoss) || 0;
      } else if (result.status === "lost") {
        profitLoss = Number(result.profitLoss) || 0;
      }

      // Determine which side this bet belongs to based on sid
      if (sid) {
        const sidStr = String(sid);
        if (sidStr.startsWith('1')) {
          // Player A bets
          book.Dragon += profitLoss;
        } else if (sidStr.startsWith('2')) {
          // Player B bets
          book.Tiger += profitLoss;
        }
      }
    });

    console.log(book, "📘 book (combined Dragon & Tiger)");
    return book;
  };

  const getBetProfitLoss = (nation: string, side: "A" | "B") => {
    if (!currentBet?.data || !casinoData?.data?.mid) return 0;

    const currentMatchId = casinoData.data.mid;
    
    // Only bets for this match
    const bets = currentBet.data.filter(
      (bet: any) => String(bet.matchId) === String(currentMatchId)
    );

    let totalProfitLoss = 0;

    bets.forEach((bet: any) => {
      const { sid, betName: currentBetName, name, nation: betNation, oddCategory, stake, betRate } = bet.betData;
      const result = bet.betData?.result;

      // Determine which side this bet belongs to based on sid
      let betSide = null;
      if (sid) {
        const sidStr = String(sid);
        if (sidStr.startsWith('1')) {
          betSide = 'A';
        } else if (sidStr.startsWith('2')) {
          betSide = 'B';
        }
      }

      // Use either betName, name, or nation field
      const actualBetName = currentBetName || name || betNation;
      
      if (actualBetName && typeof actualBetName === 'string' && betSide === side) {
        const actualBetNameLower = actualBetName.toLowerCase();
        const requestedNationLower = nation.toLowerCase();
        
        // Match by poker hand type - more flexible matching
        const isMatch = 
          actualBetNameLower === requestedNationLower ||
          actualBetNameLower.includes(requestedNationLower) ||
          requestedNationLower.includes(actualBetNameLower) ||
          // Match by poker hand type
          (requestedNationLower.includes('winner') && actualBetNameLower.includes('winner')) ||
          (requestedNationLower.includes('one pair') && actualBetNameLower.includes('one pair')) ||
          (requestedNationLower.includes('two pair') && actualBetNameLower.includes('two pair')) ||
          (requestedNationLower.includes('three of a kind') && actualBetNameLower.includes('three of a kind')) ||
          (requestedNationLower.includes('straight') && actualBetNameLower.includes('straight')) ||
          (requestedNationLower.includes('flush') && actualBetNameLower.includes('flush')) ||
          (requestedNationLower.includes('full house') && actualBetNameLower.includes('full house')) ||
          (requestedNationLower.includes('four of a kind') && actualBetNameLower.includes('four of a kind')) ||
          (requestedNationLower.includes('straight flush') && actualBetNameLower.includes('straight flush'));
        
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
            // For unsettled bets, show the stake as potential loss (like DT6 does)
            totalProfitLoss -= Number(stake) || 0;
          }
        }
      }
    });

    return totalProfitLoss;
  };

  const RateBox: React.FC<{ nation: string; side: "A" | "B" }> = ({
    nation,
    side,
  }) => {
    const market = findSide(nation, side);
    const suspended = isSuspended(market);
    
    // Get profit/loss for this specific nation and side
    const profitLoss = getBetProfitLoss(nation, side);
    
    return (
      <div
        className="flex flex-col items-center bg-[var(--bg-back)] leading-6 py-2 w-full justify-center text-sm font-semibold relative cursor-pointer"
        onClick={() => {
          if (!suspended && market?.sid) onBetClick(String(market.sid), "back");
        }}
      >
        {/* Odds display */}
        <div className="text-sm font-semibold">
          {(market?.b || market?.rate) ?? "0"}
        </div>
        
        {/* Profit/Loss display */}
        <div
          className={`text-xs font-semibold leading-3 text-center ${
            profitLoss > 0
              ? "text-green-600"
              : profitLoss < 0
                ? "text-red-600"
                : "text-gray-600"
          }`}
        >
          {profitLoss > 0 ? "+" : ""}
          {profitLoss.toFixed(0)}
        </div>
        
        {/* Suspended overlay */}
        {suspended && (
          <div className="absolute inset-0 bg-black/60 flex flex-col gap-1 items-center justify-center">
            <RiLockFill className="text-white text-xl" />
            <div
              className={`text-xs font-semibold leading-3 text-center ${
                profitLoss > 0
                  ? "text-green-400"
                  : profitLoss < 0
                    ? "text-red-400"
                    : "text-gray-400"
              }`}
            >
              {profitLoss > 0 ? "+" : ""}
              {profitLoss.toFixed(0)}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <React.Fragment>
      <div className="w-full flex md:flex-row flex-col gap-1.5 p-1 bg-[var(--bg-table)] border border-gray-100">
        <div className="flex flex-col gap-1.5 w-full">
          <h2 className="text-base md:hidden block font-semibold leading-6 px-2">
            Player A
          </h2>
          <div className="grid w-full md:grid-cols-3 grid-cols-3 gap-1.5">
            <div className="col-span-1">
              <div className="flex flex-col items-center justify-center gap-1.5">
                <h2 className="text-sm font-semibold leading-6">Winner</h2>
                <RateBox nation="Winner" side="A" />
              </div>
            </div>
            <div className="col-span-1">
              <div className="flex flex-col items-center justify-center gap-1.5">
                <h2 className="text-sm font-semibold leading-6">One Pair</h2>
                <RateBox nation="One Pair" side="A" />
              </div>
            </div>
            <div className="col-span-1">
              <div className="flex flex-col items-center justify-center gap-1.5">
                <h2 className="text-sm font-semibold leading-6">Two Pair</h2>
                <RateBox nation="Two Pair" side="A" />
              </div>
            </div>
            <div className="col-span-1">
              <div className="flex flex-col items-center justify-center gap-1.5">
                <h2 className="text-sm font-semibold leading-6">
                  Three of a Kind
                </h2>
                <RateBox nation="Three of a Kind" side="A" />
              </div>
            </div>
            <div className="col-span-1">
              <div className="flex flex-col items-center justify-center gap-1.5">
                <h2 className="text-sm font-semibold leading-6">Straight</h2>
                <RateBox nation="Straight" side="A" />
              </div>
            </div>
            <div className="col-span-1">
              <div className="flex flex-col items-center justify-center gap-1.5">
                <h2 className="text-sm font-semibold leading-6">Flush</h2>
                <RateBox nation="Flush" side="A" />
              </div>
            </div>
            <div className="col-span-1">
              <div className="flex flex-col items-center justify-center gap-1.5">
                <h2 className="text-sm font-semibold leading-6">Full House</h2>
                <RateBox nation="Full House" side="A" />
              </div>
            </div>
            <div className="col-span-1">
              <div className="flex flex-col items-center justify-center gap-1.5">
                <h2 className="text-sm font-semibold leading-6">
                  Four of a Kind
                </h2>
                <RateBox nation="Four of a Kind" side="A" />
              </div>
            </div>
            <div className="col-span-1">
              <div className="flex flex-col items-center justify-center gap-1.5">
                <h2 className="text-sm font-semibold leading-6">
                  Straight Flush
                </h2>
                <RateBox nation="Straight Flush" side="A" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 w-full">
          <h2 className="text-base md:hidden block font-semibold leading-6 px-2">
            Player B
          </h2>
          <div className="grid w-full md:grid-cols-3 grid-cols-3 gap-1.5">
            {/* Right side (B) - keep layout identical, just map B side */}
            <div className="col-span-1">
              <div className="flex flex-col items-center justify-center gap-1.5">
                <h2 className="text-sm font-semibold leading-6">Winner</h2>
                <RateBox nation="Winner" side="B" />
              </div>
            </div>
            <div className="col-span-1">
              <div className="flex flex-col items-center justify-center gap-1.5">
                <h2 className="text-sm font-semibold leading-6">One Pair</h2>
                <RateBox nation="One Pair" side="B" />
              </div>
            </div>
            <div className="col-span-1">
              <div className="flex flex-col items-center justify-center gap-1.5">
                <h2 className="text-sm font-semibold leading-6">Two Pair</h2>
                <RateBox nation="Two Pair" side="B" />
              </div>
            </div>
            <div className="col-span-1">
              <div className="flex flex-col items-center justify-center gap-1.5">
                <h2 className="text-sm font-semibold leading-6">
                  Three of a Kind
                </h2>
                <RateBox nation="Three of a Kind" side="B" />
              </div>
            </div>
            <div className="col-span-1">
              <div className="flex flex-col items-center justify-center gap-1.5">
                <h2 className="text-sm font-semibold leading-6">Straight</h2>
                <RateBox nation="Straight" side="B" />
              </div>
            </div>
            <div className="col-span-1">
              <div className="flex flex-col items-center justify-center gap-1.5">
                <h2 className="text-sm font-semibold leading-6">Flush</h2>
                <RateBox nation="Flush" side="B" />
              </div>
            </div>
            <div className="col-span-1">
              <div className="flex flex-col items-center justify-center gap-1.5">
                <h2 className="text-sm font-semibold leading-6">Full House</h2>
                <RateBox nation="Full House" side="B" />
              </div>
            </div>
            <div className="col-span-1">
              <div className="flex flex-col items-center justify-center gap-1.5">
                <h2 className="text-sm font-semibold leading-6">
                  Four of a Kind
                </h2>
                <RateBox nation="Four of a Kind" side="B" />
              </div>
            </div>
            <div className="col-span-1">
              <div className="flex flex-col items-center justify-center gap-1.5">
                <h2 className="text-sm font-semibold leading-6">
                  Straight Flush
                </h2>
                <RateBox nation="Straight Flush" side="B" />
              </div>
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
            onClick={() => navigate(`/casino-result?game=POKER_20`)}
            className="text-sm font-normal leading-8 text-white cursor-pointer hover:text-gray-200"
          >
            View All
          </h2>
        </div>
        <div className="flex justify-end items-center mb-2 gap-1 mx-2">
          {Array.isArray(results) &&
            results.slice(0, 10).map((item: any, index: number) => (
              <h2
                key={index}
                className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-sm font-semibold ${item?.win == 1 ? "text-red-400" : "text-yellow-400"} cursor-pointer hover:scale-110 transition-transform`}
                onClick={() => handleResultClick(item)}
                title="Click to view details"
              >
                {item?.win == "2" ? "B" : "A"}
              </h2>
            ))}
        </div>
      </div>

      {/* Individual Result Details Modal */}
      <IndividualResultModal
        isOpen={resultModal.isOpen}
        onClose={resultModal.closeModal}
        resultId={resultModal.selectedResultId || undefined}
        gameType={actualGameSlug}
        title={`${gameName || "Poker 20"} Result Details`}
        customGetFilteredBets={getFilteredBets}
      />
    </React.Fragment>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const Poker20 = memoizeCasinoComponent(Poker20Component);
Poker20.displayName = "Poker20";

export default Poker20;
