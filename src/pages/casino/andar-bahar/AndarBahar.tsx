import React, { useState } from "react";
import { cardImage, getCardByCode, getNumberCard } from "../../../utils/card";
// import { getCasinoIndividualResult } from "../../../helper/casino";
import { useCookies } from "react-cookie";
import { useQuery } from "@tanstack/react-query";
// import CasinoModal from "../../components/common/CasinoModal";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { memoizeCasinoComponent } from "../../../utils/casinoMemo";

const formatDateTime = (
  value: string | number | Date | null | undefined
): string => {
  if (value === undefined || value === null) return "N/A";

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "N/A";
    return value.toLocaleString();
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();
    if (!trimmedValue) return "N/A";

    const dateFromString = new Date(trimmedValue);
    if (!Number.isNaN(dateFromString.getTime())) {
      return dateFromString.toLocaleString();
    }

    const numericValue = Number(trimmedValue);
    if (!Number.isNaN(numericValue)) {
      const dateFromNumeric = new Date(numericValue);
      if (!Number.isNaN(dateFromNumeric.getTime())) {
        return dateFromNumeric.toLocaleString();
      }
    }

    return trimmedValue;
  }

  const dateFromNumber = new Date(value);
  if (!Number.isNaN(dateFromNumber.getTime())) {
    return dateFromNumber.toLocaleString();
  }

  return String(value);
};

const AndarBaharComponent = ({
  casinoData,
  remainingTime,
  onBetClick,
  results,
}: {
  casinoData: any;
  remainingTime: number;
  onBetClick: (sid: string, type: string) => void;
  results: any;
}) => {
  const [cookies] = useCookies(["clientToken"]);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [firstRowIndex, setFirstRowIndex] = useState(0);
  const [secondRowIndex, setSecondRowIndex] = useState(0);
  const [betFilter, setBetFilter] = useState("all");

  const cardSequence =
    casinoData?.data?.card || casinoData?.data?.data?.data?.card || "";

  const { andarCardSet, baharCardSet } = React.useMemo(() => {
    const andarSet = new Set<string>();
    const baharSet = new Set<string>();
    if (!cardSequence) return { andarCardSet: andarSet, baharCardSet: baharSet };

    cardSequence
      .split(",")
      .map((card: string) => card && card.trim())
      .filter(
        (card: string | undefined): card is string => !!card && card !== "1"
      )
      .forEach((card: string, index: number) => {
        const rank = card.slice(0, Math.max(card.length - 2, 1));
        if (!rank) return;

        if (index % 2 === 0) {
          // Assign to Andar only if Bahar doesn't already have this rank
          if (!baharSet.has(rank)) {
            andarSet.add(rank);
          }
        } else {
          // Assign to Bahar only if Andar doesn't already have this rank
          if (!andarSet.has(rank)) {
            baharSet.add(rank);
          }
        }
      });

    return { andarCardSet: andarSet, baharCardSet: baharSet };
  }, [cardSequence]);

  // Debug logging for AndarBahar150 component
  console.log("🎰 AndarBahar150 component debug:", {
    casinoData,
    results,
    resultsLength: results?.length || 0,
    firstResult: results?.[0],
    isArray: Array.isArray(results),
    oddsDataLength: casinoData?.data?.child?.length || 0,
    oddsData: casinoData?.data?.child,
  });

  // Get odds data from the sub array
  const oddsData = casinoData?.data?.sub || [];

  // React Query for individual result details
  // const {
  //   data: resultDetails,
  //   isLoading,
  //   error,
  // } = useQuery<any>({
  //   queryKey: ["casinoIndividualResult", selectedResult?.mid],
  //   queryFn: () =>
  //     // getCasinoIndividualResult(selectedResult?.mid, cookies, "ab4"),
  //     Promise.resolve(null),
  //   enabled: !!selectedResult?.mid && isModalOpen,
  //   staleTime: 1000 * 60 * 5, // 5 minutes
  //   gcTime: 1000 * 60 * 10, // 10 minutes
  //   retry: 2,
  // });

  // Debug logging for individual result details
  // React.useEffect(() => {
  //   if (resultDetails?.data?.matchData) {
  //     console.log("🎰 AB4 Individual Result Details:", {
  //       mid: resultDetails.data.matchData.mid,
  //       win: resultDetails.data.matchData.win,
  //       cards: resultDetails.data.matchData.cards,
  //       desc: resultDetails.data.matchData.desc,
  //       winAt: resultDetails.data.matchData.winAt,
  //       dateAndTime: resultDetails.data.matchData.dateAndTime,
  //       // Legacy format fields
  //       resultMid: resultDetails.data.matchData.result?.mid,
  //       resultWin: resultDetails.data.matchData.result?.win,
  //       resultCards: resultDetails.data.matchData.result?.cards,
  //     });
  //   }
  // }, [resultDetails]);

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

  const getFilteredBets = (bets: any[], filter: string) => {
    if (!Array.isArray(bets) || bets.length === 0) return [];
    if (filter === "all") return bets;

    return bets.filter((bet: any) => {
      const oddCategory =
        bet.betData?.oddCategory?.toLowerCase() ||
        bet.betData?.betType?.toLowerCase() ||
        "";
      const status = bet.status?.toLowerCase();

      switch (filter) {
        case "back":
          return oddCategory === "back" || oddCategory === "yes";
        case "lay":
          return oddCategory === "lay" || oddCategory === "no";
        case "deleted":
          return status === "deleted" || status === "cancelled";
        default:
          return true;
      }
    });
  };

  // Array of card ranks to display
  const cardRanks = [
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
  ];

  const isSuspended = (item: any) => {
    // Check if the specific item is suspended
    return (
      !item ||
      item.gstatus === "SUSPENDED" ||
      item.gstatus === "CLOSED" ||
      remainingTime <= 3
    );
  };

  const handleBetClick = (item: any, betType: "back" | "lay") => {
    console.log("🎰 AB4 bet click:", { item, betType, sid: item?.sid });

    // Check if betting is suspended for this item
    if (isSuspended(item)) {
      console.log("🎰 AB4 bet suspended for item:", item);
      return;
    }

    // // Check if the specific bet type is available
    // if (betType === "back" && (!item.b || item.b === 0 || item.b === "0")) {
    //   console.log("🎰 AB4 back bet not available for item:", item);
    //   return;
    // }

    // if (betType === "lay" && (!item.l || item.l === 0 || item.l === "0")) {
    //   console.log("🎰 AB4 lay bet not available for item:", item);
    //   return;
    // }

    // Trigger global bet popup handled in parent/component registry
    onBetClick(String(item.sid), betType);
  };

  // const cards = resultDetails?.data?.matchData?.cards?.split(",") || [];

  // Filter and split cards into two rows with alternating pattern
  // const validCards = cards.filter((card: string) => card && card.trim());

  // Distribute cards alternately: 0th index -> second row, 1st index -> first row, etc.
  const firstRowCards: string[] = [];
  const secondRowCards: string[] = [];

  // validCards.forEach((card: string, index: number) => {
  //   if (index % 2 === 0) {
  //     // Even indices (0, 2, 4, ...) go to second row
  //     secondRowCards.push(card);
  //   } else {
  //     // Odd indices (1, 3, 5, ...) go to first row
  //     firstRowCards.push(card);
  //   }
  // });

  // Get visible cards for each row based on current index
  const getVisibleCards = (
    cards: string[],
    startIndex: number,
    maxVisible: number = 5
  ) => {
    return cards.slice(startIndex, startIndex + maxVisible);
  };

  const visibleFirstRow = getVisibleCards(firstRowCards, firstRowIndex);
  const visibleSecondRow = getVisibleCards(secondRowCards, secondRowIndex);

  // Navigation functions
  const nextFirstRow = () => {
    if (firstRowIndex + 5 < firstRowCards.length) {
      setFirstRowIndex(firstRowIndex + 1);
    }
  };

  const prevFirstRow = () => {
    if (firstRowIndex > 0) {
      setFirstRowIndex(firstRowIndex - 1);
    }
  };

  const nextSecondRow = () => {
    if (secondRowIndex + 5 < secondRowCards.length) {
      setSecondRowIndex(secondRowIndex + 1);
    }
  };

  const prevSecondRow = () => {
    if (secondRowIndex > 0) {
      setSecondRowIndex(secondRowIndex - 1);
    }
  };

  return (
    <div className="flex flex-col mt-1">
      {/* first row - Andar */}
      <div className="grid grid-cols-6 bg-[#ffa07a]">
        <div className="col-span-1 border">
          <h2 className="flex md:hidden flex-col items-center justify-center h-full text-sm font-semibold">
            A <br />
            N <br />
            D <br />
            A <br />R{" "}
          </h2>
          <h2 className="text-base uppercase leading-16 hidden md:flex justify-center items-center font-semibold">
            Andar
          </h2>
        </div>
        <div className="col-span-5 border relative flex justify-center items-center">
          <div className="flex justify-center">
          <div className="grid grid-cols-8 place-content-center justify-center lg:grid-cols-13 gap-2 p-2">
              {oddsData
                ?.filter((item: any) => item?.nat?.includes("Bahar"))
                ?.map((item: any) => {
                  const suspended = isSuspended(item);
                  const rank = item?.nat
                    ?.replace("Bahar", "")
                    .trim()
                    .split(" ")
                    .pop();
                  const isCardRevealed = rank ? baharCardSet.has(rank) : false;
                  const displayRate = Number(
                    item?.b ||
                      item?.b1 ||
                      item?.l ||
                      item?.rate ||
                      item?.odds ||
                      0
                  );
                  return (
                    <div
                      key={item.sid}
                      className="col-span-1 flex flex-col items-center gap-1 justify-center relative"
                    >
                      <img
                        src={
                          suspended && !isCardRevealed
                            ? cardImage?.back
                            : getNumberCard(rank || "")
                        }
                        className={`w-8 h-full ${
                          suspended
                            ? "cursor-not-allowed opacity"
                            : "cursor-pointer"
                        }`}
                        alt={
                          suspended && !isCardRevealed ? "card back" : item?.nat
                        }
                        onClick={
                          suspended
                            ? undefined
                            : () => handleBetClick(item, "back")
                        }
                        title={
                          suspended && !isCardRevealed
                            ? "Bet suspended"
                            : `Back: ${displayRate || 0}`
                        }
                      />
                      <span
                        className={`text-[10px] font-semibold ${
                          suspended
                            ? "text-gray-400"
                            : "text-[var(--bg-secondary)]"
                        }`}
                      >
                        {displayRate > 0 ? displayRate : "--"}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* second row - Bahar */}
      <div className="grid grid-cols-6 bg-[#90ee90]">
        <div className="col-span-1 border border-t-0">
          <h2 className="flex md:hidden flex-col items-center justify-center h-full text-sm font-semibold">
            B <br />
            A <br />
            H <br />
            A <br />R{" "}
          </h2>
          <h2 className="text-base uppercase leading-16 md:flex hidden justify-center items-center font-semibold">
            Bahar
          </h2>
        </div>
        <div className="col-span-5 relative border border-t-0 flex justify-center items-center">
          <div className="flex justify-center">
           
            <div className="grid grid-cols-8 place-content-center justify-center lg:grid-cols-13 gap-2 p-2">
              {oddsData
                ?.filter((item: any) => item?.nat?.includes("Andar"))
                ?.map((item: any) => {
                  const suspended = isSuspended(item);
                  const rank = item?.nat
                    ?.replace("Andar", "")
                    .trim()
                    .split(" ")
                    .pop();
                  const isCardRevealed = rank ? andarCardSet.has(rank) : false;
                  const displayRate = Number(
                    item?.b ||
                      item?.b1 ||
                      item?.l ||
                      item?.rate ||
                      item?.odds ||
                      0
                  );
                  return (
                    <div
                      key={item.sid}
                      className="col-span-1 flex flex-col items-center gap-1 justify-center relative"
                    >
                      <img
                        src={
                          suspended && !isCardRevealed
                            ? cardImage?.back
                            : getNumberCard(rank || "")
                        }
                        className={`w-8 h-full ${
                          suspended
                            ? "cursor-not-allowed"
                            : "cursor-pointer"
                        }`}
                        alt={
                          suspended && !isCardRevealed ? "card back" : item?.nat
                        }
                        onClick={
                          suspended
                            ? undefined
                            : () => handleBetClick(item, "back")
                        }
                        title={
                          suspended && !isCardRevealed
                            ? "Bet suspended"
                            : `Back: ${displayRate || 0}`
                        }
                      />
                      <span
                        className={`text-[10px] font-semibold ${
                          suspended
                            ? "text-gray-400"
                            : "text-[var(--bg-primary)]"
                        }`}
                      >
                        {displayRate > 0 ? displayRate : "--"}
                      </span>
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
          <h2 className="text-sm font-normal leading-8 text-white">View All</h2>
        </div>
        <div className="flex justify-end items-center mb-2 gap-1 mx-2">
          {results && Array.isArray(results)
            ? results.slice(0, 10).map((item: any, index: number) => {
                // Parse the result to determine Andar/Bahar and card
                const resultValue = item?.win || item?.result || "?";

                // Map result to display text
                let displayText = "?";
                let textColor = "text-black";

                if (resultValue === "1") {
                  displayText = "A"; // Andar
                  textColor = "text-green-500";
                } else if (resultValue === "2") {
                  displayText = "B"; // Bahar
                  textColor = "text-yellow-500";
                } else if (resultValue && resultValue !== "?") {
                  displayText = resultValue;
                  textColor = "text-yellow-500";
                }

                return (
                  <h2
                    key={index}
                    className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-sm font-semibold ${textColor} cursor-pointer hover:scale-110 transition-transform`}
                    onClick={() => handleResultClick(item)}
                    title={`Result: ${resultValue}`}
                  >
                    R
                  </h2>
                );
              })
            : null}
        </div>
      </div>

   

    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const AndarBahar = memoizeCasinoComponent(AndarBaharComponent);
AndarBahar.displayName = "AndarBahar";

export default AndarBahar;
