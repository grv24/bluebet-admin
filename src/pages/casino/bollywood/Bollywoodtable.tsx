import React from "react";
import {
  getBlackShapes,
  getNumberCard,
  getRedShapes,
  getCardByCode,
} from "../../../utils/card";
import { RiLockFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
// import IndividualResultModal from "@/components/casino/IndividualResultModal";
// import { useIndividualResultModal } from "@/hooks/useIndividualResultModal";
import { memoizeCasinoComponent } from "../../../utils/casinoMemo";

const BollywoodtableComponent = ({
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
  results: any;
  gameSlug: string;
  gameName: string;
  currentBet: any;
}) => {
  const navigate = useNavigate();
  // const resultModal = useIndividualResultModal();

  // Convert gameSlug to actual game slug format if needed
  const actualGameSlug = React.useMemo(() => {
    if (gameSlug) {
      return gameSlug.toLowerCase().replace(/[^a-z0-9]/g, "");
    }
    return "btable2"; // Default fallback
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

  // Profit/Loss calculation functions
  const getProfitLoss = () => {
    if (!currentBet?.data || !casinoData?.data?.mid)
      return {
        Don: 0,
        "Amar Akbar Anthony": 0,
        "Sahib Bibi Aur Ghulam": 0,
        "Dharam Veer": 0,
        "Kis Kis Ko Pyaar Karoon": 0,
        Ghulam: 0,
        Odd: 0,
        Red: 0,
        Black: 0,
        "Card J": 0,
        "Card Q": 0,
        "card K": 0,
        "card A": 0,
        "Dulha Dulhan K-Q": 0,
        "Barati J-A": 0,
      };

    const currentMatchId = casinoData.data.mid;
    let book: Record<string, number> = {
      Don: 0,
      "Amar Akbar Anthony": 0,
      "Sahib Bibi Aur Ghulam": 0,
      "Dharam Veer": 0,
      "Kis Kis ko Pyaar Karoon": 0,
      Ghulam: 0,
      Odd: 0,
      Red: 0,
      Black: 0,
      "Card J": 0,
      "Card Q": 0,
      "card K": 0,
      "card A": 0,
      "Dulha Dulhan K-Q": 0,
      "Barati J-A": 0,
    };

    // Only bets for this match
    const bets = currentBet.data.filter(
      (bet: any) => String(bet.matchId) === String(currentMatchId)
    );

    bets.forEach((bet: any) => {
      const { betName, oddCategory, stake, betRate } = bet.betData;

      // Map bet names to our book keys
      const betNameMap: { [key: string]: string } = {
        Don: "Don",
        "Amar Akbar Anthony": "Amar Akbar Anthony",
        "Sahib Bibi Aur Ghulam": "Sahib Bibi Aur Ghulam",
        "Dharam Veer": "Dharam Veer",
        "Kis Kis Ko Pyaar Karoon": "Kis Kis Ko Pyaar Karoon",
        Ghulam: "Ghulam",
        Odd: "Odd",
        Red: "Red",
        Black: "Black",
        "Card J": "Card J",
        "Card Q": "Card Q",
        "card K": "card K",
        "card A": "card A",
        "Dulha Dulhan K-Q": "Dulha Dulhan K-Q",
        "Barati J-A": "Barati J-A",
      };

      const bookKey = betNameMap[betName];
      if (!bookKey) return;

      if (oddCategory.toLowerCase() === "back") {
        const profit = stake * (betRate - 1);
        const loss = -stake;
        book[bookKey] += profit;
      } else if (oddCategory.toLowerCase() === "lay") {
        const loss = stake * (betRate - 1);
        const profit = stake;
        book[bookKey] += profit - loss;
      }
    });

    console.log(book, "📘 btable2 profit/loss book");
    return book;
  };

  /**
   * Universal profit/loss calculation function for all betting types
   * @param betType - The type of bet to calculate profit/loss for
   * @returns The profit/loss amount (like dt6 Dragon/Tiger calculation)
   */
  const getBetProfitLoss = (betType: string): number => {
    if (!currentBet?.data || !casinoData?.data?.mid) return 0;

    const currentMatchId = casinoData.data.mid;
    let profitLoss = 0;

    // Only bets for this match
    const bets = currentBet.data.filter(
      (bet: any) => String(bet.matchId) === String(currentMatchId)
    );

    // Define movie names for cross-calculation
    const movieNames = [
      "Don",
      "Amar Akbar Anthony",
      "Sahib Bibi Aur Ghulam",
      "Dharam Veer",
      "Kis Kis Ko Pyaar Karoon",
      "Ghulam",
    ];

    bets.forEach((bet: any) => {
      const { betName, oddCategory, stake, betRate } = bet.betData;

      // Normalize bet name for comparison
      const normalizedBetName = betName?.toLowerCase() || "";
      const normalizedBetType = betType.toLowerCase();

      // Check if this is a movie bet
      const isMovieBet = movieNames.some(
        (movie) => normalizedBetName === movie.toLowerCase()
      );
      const isTargetMovie = movieNames.some(
        (movie) => normalizedBetType === movie.toLowerCase()
      );

      if (isMovieBet && isTargetMovie) {
        // Direct match - calculate profit/loss for the specific movie
        let isMatch = false;

        // Exact match first
        if (normalizedBetName === normalizedBetType) {
          isMatch = true;
        }
        // Handle movie names with exact matching
        else if (betType === "Don" && normalizedBetName === "don") {
          isMatch = true;
        } else if (
          betType === "Amar Akbar Anthony" &&
          normalizedBetName === "amar akbar anthony"
        ) {
          isMatch = true;
        } else if (
          betType === "Sahib Bibi Aur Ghulam" &&
          normalizedBetName === "sahib bibi aur ghulam"
        ) {
          isMatch = true;
        } else if (
          betType === "Dharam Veer" &&
          normalizedBetName === "dharam veer"
        ) {
          isMatch = true;
        } else if (
          betType === "Kis Kis Ko Pyaar Karoon" &&
          normalizedBetName === "kis kis ko pyaar karoon"
        ) {
          isMatch = true;
        } else if (betType === "Ghulam" && normalizedBetName === "ghulam") {
          isMatch = true;
        }

        if (isMatch) {
          // Calculate profit/loss like dt6 Dragon/Tiger
          if (oddCategory.toLowerCase() === "back") {
            const profit = stake * (betRate - 1);
            profitLoss += profit; // Show profit potential
          } else if (oddCategory.toLowerCase() === "lay") {
            const loss = stake * (betRate - 1);
            const profit = stake;
            profitLoss += profit - loss; // Show net profit/loss
          }
        } else {
          // This is a different movie - show loss (like Dragon/Tiger cross-calculation)
          if (oddCategory.toLowerCase() === "back") {
            profitLoss += -stake; // Loss if this movie wins instead
          } else if (oddCategory.toLowerCase() === "lay") {
            profitLoss += stake; // Profit if this movie wins instead
          }
        }
      } else {
        // Handle non-movie bets - each section is independent
        let isMatch = false;

        // Handle Odd/Even bets (independent section)
        if (betType === "Odd" && normalizedBetName === "odd") {
          isMatch = true;
        }
        // Handle Dulha Dulhan/Barati bets (independent section)
        else if (
          betType === "Dulha Dulhan K-Q" &&
          normalizedBetName === "dulha dulhan k-q"
        ) {
          isMatch = true;
        } else if (
          betType === "Barati J-A" &&
          normalizedBetName === "barati j-a"
        ) {
          isMatch = true;
        }
        // Handle Red/Black bets (independent section)
        else if (betType === "Red" && normalizedBetName === "red") {
          isMatch = true;
        } else if (betType === "Black" && normalizedBetName === "black") {
          isMatch = true;
        }
        // Handle Card bets (independent section)
        else if (betType === "Card J" && normalizedBetName === "card j") {
          isMatch = true;
        } else if (betType === "Card Q" && normalizedBetName === "card q") {
          isMatch = true;
        } else if (betType === "card K" && normalizedBetName === "card k") {
          isMatch = true;
        } else if (betType === "card A" && normalizedBetName === "card a") {
          isMatch = true;
        }

        if (isMatch) {
          // Calculate profit/loss for non-movie bets (loss-only display like dt6)
          if (oddCategory.toLowerCase() === "back") {
            profitLoss += -stake; // Show loss potential
          } else if (oddCategory.toLowerCase() === "lay") {
            profitLoss += stake; // Show profit potential
          }
        }
      }
    });

    return profitLoss;
  };

  // Check if this is btable2 format - fix data source path
  const isBtable2 = casinoData?.data?.sub || casinoData?.data?.data?.data?.sub;
  const dataSource = isBtable2
    ? casinoData?.data?.sub || casinoData?.data?.data?.data?.sub
    : casinoData?.data?.data?.data?.t2;

  /**
   * Handle clicking on individual result to show details
   */
  const handleResultClick = (result: any) => {
    const resultId =
      result?.mid || result?.roundId || result?.id || result?.matchId;

    if (!resultId) {
      console.error("🎰 Bollywoodtable: No result ID found in result", result);
      return;
    }

    if (!actualGameSlug) {
      console.error("🎰 Bollywoodtable: No gameSlug available", {
        gameSlug,
        actualGameSlug,
      });
      return;
    }

    // resultModal.openModal(String(resultId), result);
  };

  // Helper functions
  const getMarket = (nation: string) => {
    if (!dataSource) return null;
    return dataSource.find((m: any) => m.nat === nation) || null;
  };

  const getRate = (nation: string, type: "back" | "lay" = "back") => {
    const market = getMarket(nation);
    if (!market) return 0;

    if (isBtable2) {
      return type === "back" ? market.b || 0 : market.l || 0;
    } else {
      return market.rate ? parseFloat(market.rate) : 0;
    }
  };

  const isSuspended = (nation: string) => {
    const market = getMarket(nation);
    if (!market) return true;

    const status = market.gstatus as string | number | undefined;
    const gval = market.gval as number | undefined;

    const suspended =
      status === "SUSPENDED" ||
      status === 1 ||
      status === "1" ||
      gval === 1 ||
      remainingTime <= 3;

    // Debug logging for lock state
    if (suspended) {
      console.log(`🔒 BTable2 Lock Debug - ${nation}:`, {
        status,
        gval,
        remainingTime,
        market,
      });
    }

    return suspended;
  };

  const Lock = () => (
    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
      <RiLockFill className="text-white text-xl" />
    </div>
  );

  // Custom bet handling
  const handleBetClick = (sid: string, type: string) => {
    if (!dataSource) return;

    const market = dataSource.find(
      (m: any) => m.sid === sid || m.sid === parseInt(sid)
    );
    if (!market) return;

    const status = market.gstatus as string | number | undefined;
    const gval = market.gval as number | undefined;
    const isSuspended =
      status === "SUSPENDED" ||
      status === 1 ||
      status === "1" ||
      gval === 1 ||
      remainingTime <= 3;

    if (isSuspended) return;

    onBetClick(sid, type);
  };

  // Movie titles mapping
  const movieTitles = [
    { name: "A.Don", sid: "1", nat: "Don" },
    { name: "B.Amar Akbar Anthony", sid: "2", nat: "Amar Akbar Anthony" },
    { name: "C.Sahib Bibi Aur Ghulam", sid: "3", nat: "Sahib Bibi Aur Ghulam" },
    { name: "D.Dharam Veer", sid: "4", nat: "Dharam Veer" },
    {
      name: "E.Kis Kis ko Pyaar Karoon",
      sid: "5",
      nat: "Kis Kis Ko Pyaar Karoon",
    },
    { name: "F.Ghulam", sid: "6", nat: "Ghulam" },
  ];

  // Card options mapping
  const cardOptions = [
    { name: "Card J", sid: "10", nat: "Card J" },
    { name: "Card Q", sid: "11", nat: "Card Q" },
    { name: "Card K", sid: "12", nat: "card K" },
    { name: "Card A", sid: "13", nat: "card A" },
  ];

  return (
    <React.Fragment>
      <div className="w-full flex flex-col gap-2 bg-[var(--bg-table-row)] mt-1">
        {/* first row - Movie titles */}
        <div className="w-full grid lg:grid-cols-3 grid-cols-1">
          {movieTitles.map((item, index) => {
            const profitLoss = getBetProfitLoss(item.nat);
            return (
              <div
                key={index}
                className="flex lg:flex-col flex-row items-center justify-center w-full"
              >
                <div className="flex w-full lg:justify-center items-center justify-start">
                  <div className="flex flex-col ">
                    <h2 className="text-nowrap   px-2 bg-gray-100 ">
                      {item.name}
                    </h2>
                    <h2
                      className={`text-xs font-semibold px-2 ${
                        profitLoss > 0
                          ? "text-green-600"
                          : profitLoss < 0
                            ? "text-red-600"
                            : "text-gray-500"
                      }`}
                    >
                      {profitLoss > 0 ? "+" : ""}
                      {profitLoss.toFixed(2)}
                    </h2>
                  </div>
                </div>
                <div className="flex gap- justify-center items-center w-full px-2">
                  <div
                    className={`bg-[var(--bg-back)] w-full relative ${isSuspended(item.nat) ? "" : "cursor-pointer"}`}
                    onClick={() => handleBetClick(item.sid, "back")}
                  >
                    {isSuspended(item.nat) && <Lock />}
                    <h2 className="leading-10 text-[var(--bg-secondary)] flex items-center justify-center w-full">
                      {getRate(item.nat, "back")}
                    </h2>
                  </div>
                  <div
                    className={`bg-[var(--bg-lay)] w-full relative ${isSuspended(item.nat) ? "" : "cursor-pointer"}`}
                    onClick={() => handleBetClick(item.sid, "lay")}
                  >
                    {isSuspended(item.nat) && <Lock />}
                    <h2 className="leading-10 text-[var(--bg-secondary)] flex items-center justify-center w-full">
                      {getRate(item.nat, "lay")}
                    </h2>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* second row - Odd and Game options */}
        <div className="w-full grid lg:grid-cols-3 grid-cols-1 gap-2">
          <div className="flex col-span-1 border border-[var(--border)] p-2 lg:flex-col flex-row items-center justify-center w-full">
            <div className="w-full flex lg:justify-center items-center justify-start">
              <div className="flex flex-col justify-center items-center">
                <h2 className="text-nowrap px-2 bg-gray-100 ">Odd</h2>
                <h2
                  className={`text-xs font-semibold text-center px-2 ${(() => {
                    const profitLoss = getBetProfitLoss("Odd");
                    return profitLoss > 0
                      ? "text-green-600"
                      : profitLoss < 0
                        ? "text-red-600"
                        : "text-gray-500";
                  })()}`}
                >
                  {(() => {
                    const profitLoss = getBetProfitLoss("Odd");
                    return `${profitLoss > 0 ? "+" : ""}${profitLoss.toFixed(2)}`;
                  })()}
                </h2>
              </div>
            </div>

            <div className="flex gap-1 justify-center items-center w-full px-2">
              <div
                className={`bg-[var(--bg-back)] w-full relative ${isSuspended("Odd") ? "" : "cursor-pointer"}`}
                onClick={() => handleBetClick("7", "back")}
              >
                {isSuspended("Odd") && <Lock />}
                <h2 className="leading-10 text-[var(--bg-secondary)] flex items-center justify-center w-full">
                  {getRate("Odd", "back")}
                </h2>
              </div>
              <div
                className={`bg-[var(--bg-lay)] w-full relative ${isSuspended("Odd") ? "" : "cursor-pointer"}`}
                onClick={() => handleBetClick("7", "lay")}
              >
                {isSuspended("Odd") && <Lock />}
                <h2 className="leading-10 text-[var(--bg-secondary)] flex items-center justify-center w-full">
                  {getRate("Odd", "lay")}
                </h2>
              </div>
            </div>
          </div>
          <div className="col-span-2 border border-[var(--border)] p-2 grid grid-cols-2 gap-2 w-full">
            {[
              { name: "Dulha Dulhan K-Q", sid: "14", nat: "Dulha Dulhan K-Q" },
              { name: "Barati J-A", sid: "15", nat: "Barati J-A" },
            ].map((item, index) => {
              const profitLoss = getBetProfitLoss(item.nat);
              return (
                <div
                  key={index}
                  className="lg:flex-col flex-row items-center justify-center gap-2"
                >
                  <h2 className="flex justify-center items-center w-full px-2 py-1">
                    {getRate(item.nat, "back")}
                  </h2>
                  <button
                    className={`bg-gradient-to-r from-[var(--bg-primary)] to-[var(--bg-secondary)] py-2 text-white px-4  w-full relative ${isSuspended(item.nat) ? "" : "cursor-pointer"}`}
                    onClick={() => handleBetClick(item.sid, "back")}
                  >
                    {isSuspended(item.nat) && <Lock />}
                    {item.name}
                  </button>
                  <h2
                    className={`text-xs font-semibold leading-6 text-center ${
                      profitLoss > 0
                        ? "text-green-600"
                        : profitLoss < 0
                          ? "text-red-600"
                          : "text-gray-500"
                    }`}
                  >
                    {profitLoss > 0 ? "+" : ""}
                    {profitLoss.toFixed(2)}
                  </h2>
                </div>
              );
            })}
          </div>
        </div>
        {/* third row - Suits and Cards */}
        <div className="w-full grid lg:grid-cols-2 grid-cols-1 gap-2">
          <div className="border border-[var(--border)] p-2 flex justify-center items-center w-full gap-2">
            {[
              { name: "Red", sid: "8", nat: "Red" },
              { name: "Black", sid: "9", nat: "Black" },
            ].map((item, index) => {
              const profitLoss = getBetProfitLoss(item.nat);
              return (
                <div
                  key={index}
                  className="flex flex-col justify-center items-center w-full"
                >
                  <h2 className="px-2 py-1 mb-1">
                    {getRate(item.nat, "back")}
                  </h2>
                  <button
                    className={`bg-gradient-to-r from-[var(--bg-primary)] to-[var(--bg-secondary)] py-2 text-white px-4  w-full relative ${isSuspended(item.nat) ? "" : "cursor-pointer"}`}
                    onClick={() => handleBetClick(item.sid, "back")}
                  >
                    {isSuspended(item.nat) && <Lock />}
                    {item.name === "Red" ? (
                      <div className="flex gap-1 justify-center items-center">
                        <img
                          src={getRedShapes().Diamond}
                          alt=""
                          className="w-5"
                        />
                        <img
                          src={getBlackShapes().Spade}
                          alt=""
                          className="w-5"
                        />
                      </div>
                    ) : (
                      <div className="flex gap-1 justify-center items-center">
                        <img
                          src={getRedShapes().Heart}
                          alt=""
                          className="w-5"
                        />
                        <img
                          src={getBlackShapes().Club}
                          alt=""
                          className="w-5"
                        />
                      </div>
                    )}
                  </button>
                  <h2
                    className={`text-xs font-semibold leading-6 text-center ${
                      profitLoss > 0
                        ? "text-green-600"
                        : profitLoss < 0
                          ? "text-red-600"
                          : "text-gray-500"
                    }`}
                  >
                    {profitLoss > 0 ? "+" : ""}
                    {profitLoss.toFixed(2)}
                  </h2>
                </div>
              );
            })}
          </div>
          <div className="border border-[var(--border)] p-2 flex justify-center items-center w-full">
            <div className="flex flex-col gap-1 justify-center items-center w-full">
              <h2 className="text-nowrap w-full flex justify-center items-center px-2 py-1">
                {getRate("Card J", "back")}
              </h2>
              <div className="flex gap-1 justify-center items-center h-fit w-full ">
                {cardOptions.map((card, id) => {
                  const profitLoss = getBetProfitLoss(card.nat);
                  return (
                    <div
                      key={id}
                      className={`card-image relative ${isSuspended(card.nat) ? "" : "cursor-pointer"} w-full md:h-10 h-8`}
                      onClick={() => handleBetClick(card.sid, "back")}
                      title={
                        profitLoss !== 0
                          ? `${profitLoss > 0 ? "+" : ""}${profitLoss.toFixed(2)}`
                          : ""
                      }
                    >
                      {isSuspended(card.nat) && <Lock />}

                      <img
                        src={getNumberCard(card.name.split(" ")[1])}
                        alt={card.name.split(" ")[1]}
                        className="h-full w-8"
                      />
                    </div>
                  );
                })}
              </div>
              {(() => {
                const totalCardProfitLoss = cardOptions.reduce((sum, card) => {
                  return sum + getBetProfitLoss(card.nat);
                }, 0);
                return (
                  totalCardProfitLoss !== 0 && (
                    <span
                      className={`ml-2 text-xs font-semibold ${
                        totalCardProfitLoss > 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {totalCardProfitLoss > 0 ? "+" : ""}
                      {totalCardProfitLoss.toFixed(2)}
                    </span>
                  )
                );
              })()}
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
            onClick={() => navigate(`/casino-result?game=BOLLYWOOD_TABLE`)}
            className="text-sm font-normal leading-8 text-white cursor-pointer hover:text-gray-200"
          >
            View All
          </h2>
        </div>
        <div className="flex justify-end items-center mb-2 gap-1 mx-2">
          {Array.isArray(results) &&
            results?.slice(0, 10).map((item: any, index: number) => {
              const resultValue = item?.win;
              // Map win values to movie titles: 1=Don, 2=Amar Akbar Anthony, 3=Sahib Bibi Aur Ghulam, etc.
              const movieMap: { [key: string]: string } = {
                "1": "A", // Don
                "2": "B", // Amar Akbar Anthony
                "3": "C", // Sahib Bibi Aur Ghulam
                "4": "D", // Dharam Veer
                "5": "E", // Kis Kis ko Pyaar Karoon
                "6": "F", // Ghulam
              };
              const displayText = movieMap[resultValue] || resultValue;
              return (
                <h2
                  key={index}
                  className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-sm font-semibold text-yellow-400 cursor-pointer hover:scale-110 transition-transform`}
                  onClick={() => handleResultClick(item)}
                  title={`Movie: ${resultValue}`}
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
        title={`${gameName || "Bollywood Table"} Result Details`}
        customGetFilteredBets={getFilteredBets}
      /> */}
    </React.Fragment>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const Bollywoodtable = memoizeCasinoComponent(BollywoodtableComponent);
Bollywoodtable.displayName = "Bollywoodtable";

export default Bollywoodtable;
