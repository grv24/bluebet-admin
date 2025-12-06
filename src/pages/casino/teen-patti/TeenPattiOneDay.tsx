import React from "react";
import { RiLockFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
// import { getCardByCode } from "@/utils/card";
// import IndividualResultModal from "@/components/casino/IndividualResultModal";
// import { useIndividualResultModal } from "@/hooks/useIndividualResultModal";
import { memoizeCasinoComponent } from "../../../utils/casinoMemo";

interface TeenBetClickOptions {
  outcome?: "Odd" | "Even";
  displayName?: string;
  rate?: number;
  parentNat?: string;
}

interface TeenPattiOneDayProps {
  casinoData: any;
  remainingTime: number;
  onBetClick: (
    sid: string,
    type: "back" | "lay",
    options?: TeenBetClickOptions
  ) => void;
  results: any[];
  gameCode: string;
  gameName: string;
  currentBet: any;
}

const TeenPattiOneDayComponent: React.FC<TeenPattiOneDayProps> = ({
  casinoData,
  remainingTime,
  onBetClick,
  results,
  gameCode,
  gameName,
  currentBet,
}) => {
  const navigate = useNavigate();
  // const resultModal = useIndividualResultModal();

  // Convert gameCode to gameSlug if gameCode is provided
  // gameCode format: "POKER_1_DAY" -> gameSlug format: "poker1day"
  const actualGameSlug = React.useMemo(() => {
    if (gameCode) {
      // Convert "POKER_1_DAY" to "poker1day"
      return gameCode.toLowerCase().replace(/_/g, "");
    }
    return "poker1day"; // Default fallback
  }, [gameCode]);

  // Debug: Log results data
  console.log("🎰 Teen results data:", results);
  console.log("🎰 Teen casino data:", casinoData);
  console.log("🎰 Teen data structure:", {
    hasData: !!casinoData,
    hasSub: !!casinoData?.data?.sub,
    subLength: casinoData?.data?.sub?.length,
    subSids: casinoData?.data?.sub?.map((item: any) => item.sid),
    hasLegacyT2: !!casinoData?.data?.data?.data?.t2,
    t2Length: casinoData?.data?.data?.data?.t2?.length,
  });

  // Function to parse cards from API response
  const parseCards = (cardsString: string) => {
    if (!cardsString) return { playerA: [], playerB: [] };

    const cards = cardsString.split(",").filter((card) => card && card.trim());

    // First 3 cards are Player A, next 3 are Player B
    const playerACards = cards.slice(0, 3).filter((card) => card !== "1");
    const playerBCards = cards.slice(3, 6).filter((card) => card !== "1");

    return { playerA: playerACards, playerB: playerBCards };
  };

  // Function to get winner information
  const getWinnerInfo = (resultData: any) => {
    if (!resultData)
      return {
        winner: null,
        description: "",
        cards: [],
        oddEven: [],
        consecutive: "",
        cardDetails: [],
        descriptionSegments: [],
      };

    const win = resultData.win;
    const desc = resultData.desc || resultData.newdesc || "";

    let winner: string | null = null;
    if (win === "1") winner = "Player A";
    else if (win === "2") winner = "Player B";
    else if (win === "0") winner = "Tie";

    let cards: string[] = [];
    let oddEven: string[] = [];
    let consecutive = "";
    let descriptionSegments: string[] = [];

    const safeSplit = (value: string | undefined) =>
      value
        ? value
            .trim()
            .split(/\s+/)
            .map((token) => token.trim())
            .filter(Boolean)
        : [];

    const parseStructuredDescription = (raw: string) => {
      const segments = raw.split("#").map((segment) => segment.trim());
      descriptionSegments = segments.filter((segment) => segment.length > 0);

      if (!winner && segments[0]) {
        winner = segments[0];
      }

      if (segments[1]) {
        cards = safeSplit(segments[1]);
      }

      if (segments[2]) {
        oddEven = safeSplit(segments[2]);
      }

      if (segments[3]) {
        consecutive = segments[3]
          .split("|")
          .map((part) => part.replace(/\s+/g, " ").trim())
          .filter(Boolean)
          .join(" | ");
      }
    };

    if (resultData.newdesc && resultData.newdesc.includes("#")) {
      parseStructuredDescription(resultData.newdesc);
    } else if (desc && desc.includes("#")) {
      parseStructuredDescription(desc);
    } else if (desc) {
      descriptionSegments = [desc];
    }

    const cardDetails = cards.map((label, index) => ({
      position: index + 1,
      label,
      oddEven: oddEven[index] || "",
    }));

    return {
      winner,
      description: desc,
      cards,
      oddEven,
      consecutive,
      cardDetails,
      descriptionSegments,
    };
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
        case "deleted":
          return status === "deleted" || status === "cancelled";
        default:
          return true;
      }
    });
  };

  const getOddsData = (sid: string) => {
    // Handle new API response format
    if (casinoData?.data?.sub) {
      const found = casinoData.data.sub.find(
        (item: any) => String(item.sid) === String(sid)
      );
      console.log(`🎰 Teen getOddsData for sid ${sid}:`, found);
      return found;
    }
    // Handle legacy format
    if (!casinoData?.data?.data?.data?.t2) return null;
    const found = casinoData.data.data.data.t2?.find(
      (item: any) => String(item.sid) === String(sid)
    );
    console.log(`🎰 Teen getOddsData for sid ${sid}:`, found);
    return found;
  };

  /**
   * Handle clicking on individual result to show details
   */
  const handleResultClick = (result: any) => {
    const resultId = result?.mid || result?.roundId || result?.id || result?.matchId;
    
    if (!resultId) {
      console.error("🎰 TeenPattiOneDay: No result ID found in result", result);
      return;
    }
    
    if (!actualGameSlug) {
      console.error("🎰 TeenPattiOneDay: No gameSlug available", { gameCode, actualGameSlug });
      return;
    }
    
    // resultModal.openModal(String(resultId), result); 
  };

  const isSuspended = (sid: string) => {
    const oddsData = getOddsData(sid);
    // For Teen, gstatus "OPEN" means active, "SUSPENDED" means suspended
    return (
      oddsData?.gstatus === "SUSPENDED" ||
      oddsData?.gstatus === "0" ||
      String(oddsData?.gstatus) === "0" ||
      oddsData?.visible === 0 ||
      remainingTime <= 3
    );
  };

  // Get overall profit/loss for Player A vs Player B (cross-calculation like Dragon/Tiger)
  const getProfitLoss = (betType: "Main" | "Consecutive") => {
    if (!currentBet?.data || !casinoData?.data?.mid)
      return { "Player A": 0, "Player B": 0 };

    const currentMatchId = casinoData.data.mid;
    let book: Record<string, number> = { "Player A": 0, "Player B": 0 };

    // Only bets for this match
    const bets = currentBet.data.filter(
      (bet: any) => String(bet.matchId) === String(currentMatchId)
    );

    console.log(`🎰 Teen getProfitLoss - betType: ${betType}, totalBets: ${bets.length}`);

    bets.forEach((bet: any) => {
      const { betName, oddCategory, stake, betRate } = bet.betData;

      // Check if this bet matches the bet type (Main or Consecutive)
      const normalizedBetName = betName?.toLowerCase() || "";
      const normalizedBetType = betType.toLowerCase();

      let isMatch = false;
      if (normalizedBetType === "main") {
        // Main bets: "Player A" or "Player B"
        isMatch = normalizedBetName === "player a" || normalizedBetName === "player b";
      } else if (normalizedBetType === "consecutive") {
        // Consecutive bets: "Player A Consecutive" or "Player B Consecutive"
        isMatch = normalizedBetName.includes("consecutive");
      }

      console.log(`🎰 Teen getProfitLoss - betName: ${betName}, betType: ${betType}, isMatch: ${isMatch}`);

      if (isMatch) {
        const isPlayerA = normalizedBetName.includes("player a");

        if (oddCategory.toLowerCase() === "back") {
          const profit = stake * (betRate - 1);
          const loss = -stake;

          if (isPlayerA) {
            book["Player A"] += profit;
            book["Player B"] += loss;
            console.log(`🎰 Teen Player A BACK - stake: ${stake}, betRate: ${betRate}, profit: ${profit}, loss: ${loss}`);
          } else {
            book["Player B"] += profit;
            book["Player A"] += loss;
            console.log(`🎰 Teen Player B BACK - stake: ${stake}, betRate: ${betRate}, profit: ${profit}, loss: ${loss}`);
          }
        } else if (oddCategory.toLowerCase() === "lay") {
          const loss = stake * (betRate - 1);
          const profit = stake;

          if (isPlayerA) {
            book["Player A"] -= loss;
            book["Player B"] += profit;
            console.log(`🎰 Teen Player A LAY - stake: ${stake}, betRate: ${betRate}, loss: ${loss}, profit: ${profit}`);
          } else {
            book["Player B"] -= loss;
            book["Player A"] += profit;
            console.log(`🎰 Teen Player B LAY - stake: ${stake}, betRate: ${betRate}, loss: ${loss}, profit: ${profit}`);
          }
        }
      }
    });

    console.log(`🎰 Teen getProfitLoss result - betType: ${betType}, book:`, book);
    return book;
  };

  // Get profit/loss for individual bet types (independent calculation like DT6 Odd/Even)
  const getBetProfitLoss = (betType: string, cardPosition?: string): number => {
    if (!currentBet?.data || !casinoData?.data?.mid) return 0;

    const currentMatchId = casinoData.data.mid;
    let profitLoss = 0;

    // Only bets for this match
    const bets = currentBet.data.filter(
      (bet: any) => String(bet.matchId) === String(currentMatchId)
    );

    bets.forEach((bet: any) => {
      const {
        betName,
        oddCategory,
        stake,
        betRate,
        betOutcome,
        cardNat,
      } = bet.betData || {};

      // Normalize bet name for comparison
      const normalizedBetName = betName?.toLowerCase() || "";
      const normalizedBetType = betType.toLowerCase();
      const normalizedCardPosition = cardPosition?.toLowerCase();

      // Check if this bet matches the current bet type
      let isMatch = false;

      // Handle Card-specific Odd/Even bets
      if (cardPosition) {
        const hasCardMatch =
          (normalizedCardPosition
            ? normalizedBetName.includes(normalizedCardPosition)
            : false) ||
          (cardNat
            ? String(cardNat).toLowerCase() === normalizedCardPosition
            : false);

        const outcomeMatchFromField =
          betOutcome &&
          normalizedBetType &&
          betOutcome.toLowerCase() === normalizedBetType;

        const outcomeMatchFromName =
          normalizedBetType.includes("odd") && normalizedBetName.includes("odd")
            ? true
            : normalizedBetType.includes("even") &&
              normalizedBetName.includes("even");

        isMatch = hasCardMatch && (outcomeMatchFromField || outcomeMatchFromName);
      } else {
        // Handle general Odd/Even bets (fallback)
        if (normalizedBetType.includes("odd") && normalizedBetName.includes("odd")) {
          isMatch = true;
        } else if (normalizedBetType.includes("even") && normalizedBetName.includes("even")) {
          isMatch = true;
        }
      }

      console.log(
        `🎰 Teen getBetProfitLoss - betName: ${betName}, betType: ${betType}, cardPosition: ${cardPosition}, isMatch: ${isMatch}`
      );

      if (isMatch) {
        // Calculate profit/loss for Odd/Even bets (loss-only display like DT6 Odd/Even)
        if (oddCategory.toLowerCase() === "back") {
          profitLoss += -stake; // Show loss potential
          console.log(`🎰 Teen BACK bet - stake: ${stake}, loss: ${-stake}`);
        } else if (oddCategory.toLowerCase() === "lay") {
          profitLoss += stake; // Show profit potential
          console.log(`🎰 Teen LAY bet - stake: ${stake}, profit: ${stake}`);
        }
      }
    });

    console.log(`🎰 Teen getBetProfitLoss result - betType: ${betType}, cardPosition: ${cardPosition}, profitLoss: ${profitLoss}`);
    return profitLoss;
  };

  const playerA = {
    main:
      casinoData?.data?.sub?.find((item: any) => item?.sid === 1) ||
      casinoData?.data?.data?.data?.t2?.find((item: any) => item?.sid === "1"),
    consecutive:
      casinoData?.data?.sub?.find((item: any) => item?.sid === 17) ||
      casinoData?.data?.data?.data?.t2?.find((item: any) => item?.sid === "17"),
  };

  const playerB = {
    main:
      casinoData?.data?.sub?.find((item: any) => item?.sid === 2) ||
      casinoData?.data?.data?.data?.t2?.find((item: any) => item?.sid === "2"),
    consecutive:
      casinoData?.data?.sub?.find((item: any) => item?.sid === 18) ||
      casinoData?.data?.data?.data?.t2?.find((item: any) => item?.sid === "18"),
  };

  const players = [
    { name: "Player A", ...playerA },
    { name: "Player B", ...playerB },
  ];

  return (
    <div className="w-full flex flex-col gap-1.5 p-1">
      {/* Betting Table */}
      <div className="bg-[var(--bg-table)] flex flex-col gap-1.5 border border-gray-300">
        <div className="flex md:flex-row flex-col gap-1.5">
          {players.map(({ name, main, consecutive }) => {
            const mainBook = getProfitLoss("Main");
            const consecutiveBook = getProfitLoss("Consecutive");
            const playerProfitLoss = name === "Player A" ? mainBook["Player A"] : mainBook["Player B"];
            const consecutiveProfitLoss = name === "Player A" ? consecutiveBook["Player A"] : consecutiveBook["Player B"];

            return (
              <table key={name} className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border w-[59%] border-gray-300 px-2 py-1 text-left text-xs bg-gray-100">
                      <div className="flex flex-col">
                        <span>{name}</span>
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
                    <td className="border px-2 py-2  border-gray-300 text-sm font-semibold">
                      Main
                      <h2
                          className={`text-xs font-semibold ${
                            playerProfitLoss > 0
                              ? "text-green-600"
                              : playerProfitLoss < 0
                                ? "text-red-600"
                                : "text-gray-600"
                          }`}
                        >
                          {playerProfitLoss > 0 ? "+" : ""}
                          {playerProfitLoss.toFixed(0)}
                        </h2>
                    </td>
                    <td
                      className="border px-2 py-2 border-gray-300 text-center cursor-pointer bg-[var(--bg-back)] relative"
                      onClick={() =>
                        !isSuspended(main?.sid) && onBetClick(main?.sid, "back")
                      }
                    >
                      {isSuspended(main?.sid) && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                          <RiLockFill className="text-white text-xl" />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span>{main?.b || main?.b1 || 0}</span>
                     
                      </div>
                    </td>
                    <td
                      className="border px-2 py-2 border-gray-300 text-center cursor-pointer bg-[var(--bg-lay)] relative"
                      onClick={() =>
                        !isSuspended(main?.sid) && onBetClick(main?.sid, "lay")
                      }
                    >
                      {isSuspended(main?.sid) && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                          <RiLockFill className="text-white text-xl" />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span>{main?.l || main?.l1 || 0}</span>
                       
                      </div>
                    </td>
                  </tr>

                  {/* Consecutive Row */}
                  <tr className="hover:bg-gray-50">
                    <td className="border px-2 border-gray-300 py-2 text-sm font-semibold">
                      Consecutive
                      <h2
                          className={`text-xs font-semibold ${
                            consecutiveProfitLoss > 0
                              ? "text-green-600"
                              : consecutiveProfitLoss < 0
                                ? "text-red-600"
                                : "text-gray-600"
                          }`}
                        >
                          {consecutiveProfitLoss > 0 ? "+" : ""}
                          {consecutiveProfitLoss.toFixed(0)}
                        </h2>
                    </td>
                    <td
                      className="border px-2 py-2 border-gray-300 text-center cursor-pointer bg-[var(--bg-back)] relative"
                      onClick={() =>
                        !isSuspended(consecutive?.sid) &&
                        onBetClick(consecutive?.sid, "back")
                      }
                    >
                      {isSuspended(consecutive?.sid) && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                          <RiLockFill className="text-white text-xl" />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span>{consecutive?.b || consecutive?.b1 || 0}</span>
                      
                      </div>
                    </td>
                    <td
                      className="border border-gray-300 px-2 py-2 text-center cursor-pointer bg-[var(--bg-lay)] relative"
                      onClick={() =>
                        !isSuspended(consecutive?.sid) &&
                        onBetClick(consecutive?.sid, "lay")
                      }
                    >
                      {isSuspended(consecutive?.sid) && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                          <RiLockFill className="text-white text-xl" />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span>{consecutive?.l || consecutive?.l1 || 0}</span>
                       
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            );
          })}
        </div>

        {/* Card Bets Table */}
        <div className="flex flex-col">
          <div className="grid grid-cols-8">
            <div className="col-span-2 border border-gray-300 leading-5 flex justify-center items-center">
              {/* Odd */}
            </div>
            {(casinoData?.data?.sub || casinoData?.data?.data?.data?.t2)
              ?.filter((item: any) => item?.nat?.startsWith("Card"))
              ?.map((i: any) => (
                <div
                  key={i.sid}
                  className="col-span-1 border border-gray-300 leading-5 text-sm font-semibold flex justify-center items-center"
                >
                  {i.nat}
                </div>
              ))}
          </div>
          {/* first */}
          <div className="grid grid-cols-8">
            <div className="col-span-2 border text-sm font-semibold border-gray-300 leading-10 flex justify-center items-center">
              Odd
            </div>
            {(casinoData?.data?.sub || casinoData?.data?.data?.data?.t2)
              ?.filter((item: any) => item?.nat?.startsWith("Card")) // ✅ filter only cards
              ?.map((i: any) => {
                // Handle new API format with nested odds array
                const oddOdds = i.odds?.find((odd: any) => odd.nat === "Odd");
                const oddValue = oddOdds?.b || i.b1 || i.b || 0;
                const profitLoss = getBetProfitLoss("Odd", i.nat);

                return (
                  <div
                    key={i.sid}
                    onClick={() =>
                      !isSuspended(i?.sid) &&
                      onBetClick(i?.sid, "back", {
                        outcome: "Odd",
                        displayName: `Odd ${i.nat}`,
                        rate: oddValue,
                        parentNat: i.nat,
                      })
                    }
                    className="col-span-1 relative border bg-[var(--bg-back)] border-gray-300 leading-10 flex flex-col justify-center items-center"
                  >
                    {isSuspended(i?.sid) && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-20">
                        <RiLockFill className="text-white text-xl" />
                        <h2
                          className={`text-xs font-semibold ${
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
                    )}

                    <div className="flex flex-col">
                      <span>{oddValue || 0}</span>
                      <h2
                        className={`text-xs font-semibold ${
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
                  </div>
                );
              })}
          </div>
          {/* second */}
          <div className="grid grid-cols-8">
            <div className="col-span-2 border text-sm font-semibold border-gray-300 leading-10 flex items-center justify-center">
              Even
            </div>
            {(casinoData?.data?.sub || casinoData?.data?.data?.data?.t2)
              ?.filter((item: any) => item?.nat?.startsWith("Card")) // ✅ filter only cards
              ?.map((i: any) => {
                // Handle new API format with nested odds array
                const evenOdds = i.odds?.find((odd: any) => odd.nat === "Even");
                const evenValue = evenOdds?.b || i.b1 || i.b || 0;
                const profitLoss = getBetProfitLoss("Even", i.nat);

                return (
                  <div
                    key={i.sid}
                    onClick={() =>
                      !isSuspended(i?.sid) &&
                      onBetClick(i?.sid, "back", {
                        outcome: "Even",
                        displayName: `Even ${i.nat}`,
                        rate: evenValue,
                        parentNat: i.nat,
                      })
                    }
                    className="col-span-1 relative border border-gray-300 bg-[var(--bg-back)] leading-10 flex flex-col justify-center items-center"
                  >
                    {isSuspended(i?.sid) && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-20">
                        <RiLockFill className="text-white text-xl" />
                        <h2
                          className={`text-xs font-semibold ${
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
                    )}
                    <div className="flex flex-col">
                      <span>{evenValue || 0}</span>
                      <h2
                        className={`text-xs font-semibold ${
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
                  </div>
                );
              })}
          </div>
        </div>
      </div>
      {(() => {
        const remarkText =
          casinoData?.data?.remark || casinoData?.data?.t1?.remark;
        return (
          <div className="w-full text-[var(--bg-primary)] overflow-hidden">
            <div className="whitespace-nowrap text-xs leading-6 font-extrabold uppercase tracking-wide animate-marquee">
              {remarkText}
            </div>
          </div>
        );
      })()}

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
        <div className="flex justify-end items-center mb-2 gap-2 mx-2">
          {Array.isArray(results) &&
            results?.slice(0, 10).map((item: any, index: number) => {
              const result = String(item?.result || item?.win || "");
              let label = "";
              let color = "text-gray-200";

              if (result === "1") {
                label = "A"; // Player A
                color = "text-red-500";
              } else if (result === "2") {
                label = "B"; // Player B
                color = "text-yellow-500";
              }

              return (
                <h2
                  key={index}
                  className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-sm font-semibold ${color} cursor-pointer hover:scale-110 transition-transform`}
                  onClick={() => handleResultClick(item)}
                  title="Click to view details"
                >
                  {label}
                </h2>
              );
            })}
        </div>
      </div>

      {/* Individual Result Modal */}
      {/* <IndividualResultModal
        isOpen={resultModal.isOpen}
        onClose={resultModal.closeModal}
        resultId={resultModal.selectedResultId || undefined}
        gameType={actualGameSlug}
        title={`${gameName || 'Teen'} Result Details`}
        customGetFilteredBets={getFilteredBets}
      /> */}
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const TeenPattiOneDay = memoizeCasinoComponent(TeenPattiOneDayComponent);
TeenPattiOneDay.displayName = "TeenPattiOneDay";

export default TeenPattiOneDay;
