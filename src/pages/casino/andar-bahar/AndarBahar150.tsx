import React, { useState } from "react";
import { cardImage, getCardByCode, getNumberCard } from "../../../utils/card";
// import { getCasinoIndividualResult } from "../../../helper/casino";
import { useCookies } from "react-cookie";
import { useQuery } from "@tanstack/react-query";
// import CasinoModal from "../../../components/common/CasinoModal";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { RiLockFill } from "react-icons/ri";
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

const AndarBahar150Component = ({
  casinoData,
  remainingTime,
  onBetClick,
  results,
}: {
  casinoData: any;
  remainingTime: number;
  onBetClick: (sid: string, type: string, options?: any) => void;
  results: any;
}) => {
  const [cookies] = useCookies(["clientToken"]);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [firstRowIndex, setFirstRowIndex] = useState(0);
  const [secondRowIndex, setSecondRowIndex] = useState(0);
  const [betFilter, setBetFilter] = useState("all");

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

  // Get odds data from child array (primary) or sub array (fallback)
  // Handle both API format and socket format
  const oddsDataRaw =
    casinoData?.data?.child ||
    casinoData?.data?.sub ||
    casinoData?.data?.current?.child ||
    casinoData?.data?.current?.sub ||
    casinoData?.data?.data?.data?.child ||
    casinoData?.data?.data?.data?.sub ||
    [];

  // Generate full card betting options and merge with odds data
  // Card ranks: A, 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K
  const cardRanksList = [
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
  
  // Create a map of existing odds by nat name for quick lookup
  const oddsMap = new Map<string, any>();
  oddsDataRaw.forEach((item: any) => {
    if (item?.nat) {
      oddsMap.set(item.nat, item);
    }
  });

  // Generate complete odds data structure for all cards
  const oddsData: any[] = [];
  
  // Generate Andar odds (sid: 1-13)
  cardRanksList.forEach((rank, index) => {
    const nat = `Andar ${rank}`;
    const existingOdds = oddsMap.get(nat);
    oddsData.push(
      existingOdds || {
        sid: index + 1,
        nat: nat,
        b: 0,
        l: 0,
        gstatus: "SUSPENDED",
      }
    );
  });

  // Generate Bahar odds (sid: 21-33)
  cardRanksList.forEach((rank, index) => {
    const nat = `Bahar ${rank}`;
    const existingOdds = oddsMap.get(nat);
    oddsData.push(
      existingOdds || {
        sid: index + 21,
        nat: nat,
        b: 0,
        l: 0,
        gstatus: "SUSPENDED",
      }
    );
  });
  
  // Also include any other odds that don't match the standard pattern
  oddsDataRaw.forEach((item: any) => {
    if (
      item?.nat &&
      !item.nat.includes("Andar") &&
      !item.nat.includes("Bahar")
    ) {
      oddsData.push(item);
    }
  });

  // React Query for individual result details
  // const {
  //   data: resultDetails,
  //   isLoading,
  //   error,
  // } = useQuery<any>({
  //   queryKey: ["casinoIndividualResult", selectedResult?.mid],
  //   queryFn: () =>
  //     getCasinoIndividualResult(selectedResult?.mid, cookies, "ab4"),
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

  // Calculate next card side (Andar or Bahar) based on next card count
  // Extract next card count from sub array
  const nextCardItem = casinoData?.data?.sub?.[0];
  const nextCardNat = nextCardItem?.nat || "";
  // Extract card number from nat string (e.g., "Card 94" -> "94")
  const nextCardCountStr = nextCardNat.match(/\d+/)?.[0] || "0";
  const nextCardCount = parseInt(nextCardCountStr, 10) || 0;
  // Determine if next card is Andar or Bahar
  // Based on card distribution: even indices (0,2,4...) -> Andar, odd indices (1,3,5...) -> Bahar
  // Card count is 1-indexed, so convert to 0-indexed: (count - 1) % 2
  // If (count - 1) % 2 === 0 (even index) -> Andar, else (odd index) -> Bahar
  const nextCardSide = (nextCardCount - 1) % 2 === 0 ? "Andar" : "Bahar";

  const isSuspended = (item: any) => {
    // Check if the specific item is suspended
    // Child items might not have gstatus, so check parent status or default to OPEN
    const status = item?.gstatus || casinoData?.data?.gstatus;

    // Check if the item's side (Andar/Bahar) matches the next card side
    // Only the side matching nextCardSide should be unlocked
    const itemSide = item?.nat?.includes("Andar")
      ? "Andar"
      : item?.nat?.includes("Bahar")
        ? "Bahar"
        : null;
    const isSideLocked = itemSide && itemSide !== nextCardSide;

    return (
      !item ||
      status === "SUSPENDED" ||
      status === "CLOSED" ||
      remainingTime <= 3 ||
      isSideLocked
    );
  };

  // Sort odds by card rank order (A, 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K)
  const cardOrder = [
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
  const getCardOrder = (rank: string) => {
    const index = cardOrder.indexOf(rank);
    return index >= 0 ? index : 99; // Put unknown cards at the end
  };

  const handleBetClick = (
    item: any,
    cardItem: any,
    betType: "back" | "lay"
  ) => {
    console.log("🎰 AB4 bet click:", { 
      andarBaharItem: item, 
      cardItem: cardItem, 
      betType: betType 
    });

    // Don't check Andar/Bahar item status - it's always suspended
    // Only check Card X item status and general conditions
    
    // Check general betting conditions (time-based suspension)
    if (remainingTime <= 3) {
      console.log("🎰 AB4 bet suspended: remaining time too low");
      return;
    }

    // Check if card item is available and open (this is the only status check we need)
    if (!cardItem || cardItem?.gstatus !== "OPEN") {
      console.log("🎰 AB4 card item not available or not open:", cardItem);
      return;
    }

    // Use the Card X item's sid for placing bets
    // The sid should be the Card X sid (e.g., 93), not the Andar/Bahar sid (e.g., 25)
    const betSid = cardItem.sid;
    
    // Combine nat: "Bahar 5 / Card 93"
    const combinedNat = `${item.nat} / ${cardItem.nat}`;
    
    // Use the Card X item's back odds (b) as the rate
    const betRate = cardItem.b || 0;
    
    console.log("🎰 AB4 placing bet with:", {
      betSid: betSid,
      combinedNat: combinedNat,
      betRate: betRate,
      betType: betType,
      andarBaharItem: item,
      cardItem: cardItem,
    });

    // Trigger global bet popup handled in parent/component registry
    // Pass the Card X sid, combined nat, and rate from card item
    onBetClick(String(betSid), betType, {
      nat: combinedNat,
      rate: betRate,
      displayName: combinedNat,
    });
  };

  // const cards = resultDetails?.data?.matchData?.cards?.split(",") || [];

  // Filter and split cards into two rows with alternating pattern
  // const validCards = cards.filter((card: string) => card && card.trim());

  // Distribute cards alternately: 0th index -> second row, 1st index -> first row, etc.
  const firstRowCards: string[] = [];
  const secondRowCards: string[] = [];

  //   validCards.forEach((card: string, index: number) => {
  //     if (index % 2 === 0) {
  //       // Even indices (0, 2, 4, ...) go to second row
  //       secondRowCards.push(card);
  //     } else {
  //       // Odd indices (1, 3, 5, ...) go to first row
  //       firstRowCards.push(card);
  //     }
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
      <div className="grid grid-cols-6 bg-[#fc424280]">
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
          {nextCardSide !== "Andar" && (
            <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
              <span className="text-white">
                <RiLockFill className="text-xl" />
              </span>
            </div>
          )}
          <div className="flex justify-center">
          <div className="grid grid-cols-8 place-content-center justify-center lg:grid-cols-13 gap-2 p-2">
              {oddsData
                ?.filter((item: any) => item?.nat?.includes("Andar"))
                ?.sort((a: any, b: any) => {
                  const rankA =
                    a?.nat?.replace("Andar", "").trim().split(" ").pop() || "";
                  const rankB =
                    b?.nat?.replace("Andar", "").trim().split(" ").pop() || "";
                  return getCardOrder(rankA) - getCardOrder(rankB);
                })
                ?.map((item: any) => {
                  const suspended = isSuspended(item);
                  const rank = item?.nat
                    ?.replace("Andar", "")
                    .trim()
                    .split(" ")
                    .pop();

                  const backRate = Number(item?.b || 0);
                  const layRate = Number(item?.l || 0);
                  const isSideLocked = nextCardSide !== "Andar";
                  
                  // For unlocked side: show back odds if available, otherwise lay odds
                  // For locked side: show lay odds
                  const displayRate = isSideLocked 
                    ? layRate
                    : (backRate > 0 ? backRate : layRate);
                  
                  // Get the open "Card X" item from oddsDataRaw (not oddsData, since oddsData filters out Card X items)
                  const openCardItem = oddsDataRaw.find(
                    (cardItem: any) =>
                      cardItem?.nat?.startsWith("Card ") && cardItem?.gstatus === "OPEN"
                  );

                  return (
                    <div
                      key={item.sid}
                      className="col-span-1 flex flex-col items-center gap-1 justify-center relative"
                    >
                      {/* <span
                        className={`text-[10px] font-semibold text-black
                        `}
                      >
                        {displayRate}
                      </span> */}
                      <img
                        src={
                          isSideLocked
                            ? cardImage?.back
                            : getNumberCard(rank || "")
                        }
                        className={`w-8 h-full 
                         `}
                        onClick={
                          isSideLocked
                            ? undefined
                            : () => handleBetClick(item, openCardItem, "back")
                        }
                        title={
                          isSideLocked
                            ? "Bet suspended"
                            : `Back: ${displayRate || 0}`
                        }
                      />
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* second row - Bahar */}
      <div className="grid grid-cols-6 bg-[#fdcf1380]">
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
          {nextCardSide !== "Bahar" && (
            <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
              <span className="text-white">
                <RiLockFill className="text-xl" />
              </span>
            </div>
          )}
          <div className="flex justify-center ">
            <div className="grid grid-cols-8 place-content-center justify-center lg:grid-cols-13 gap-2 p-2">
              {oddsData
                ?.filter((item: any) => item?.nat?.includes("Bahar"))
                ?.sort((a: any, b: any) => {
                  const rankA =
                    a?.nat?.replace("Bahar", "").trim().split(" ").pop() || "";
                  const rankB =
                    b?.nat?.replace("Bahar", "").trim().split(" ").pop() || "";
                  return getCardOrder(rankA) - getCardOrder(rankB);
                })
                ?.map((item: any) => {
                  const suspended = isSuspended(item);
                  const rank = item?.nat
                    ?.replace("Bahar", "")
                    .trim()
                    .split(" ")
                    .pop();
                  const backRate = Number(item?.b || 0);
                  const layRate = Number(item?.l || 0);
                  const isSideLocked = nextCardSide !== "Bahar";
                  
                  // For unlocked side: show back odds if available, otherwise lay odds
                  // For locked side: show lay odds
                  const displayRate = isSideLocked 
                    ? layRate
                    : (backRate > 0 ? backRate : layRate);
                  
                  // Get the open "Card X" item from oddsDataRaw (not oddsData, since oddsData filters out Card X items)
                  const openCardItem = oddsDataRaw.find(
                    (cardItem: any) =>
                      cardItem?.nat?.startsWith("Card ") && cardItem?.gstatus === "OPEN"
                  );
                  
                  return (
                    <div
                      key={item.sid}
                      className="col-span-1 flex flex-col items-center gap-1 justify-center relative"
                    >
                      {/* <span
                        className={`text-[10px] font-semibold text-black`}
                      >
                        {displayRate > 0 ? displayRate : "--"}
                      </span> */}
                      <img
                        src={
                          isSideLocked
                            ? cardImage?.back
                            : getNumberCard(rank || "")
                        }
                        className={`w-8 h-full`}
                        alt={item?.nat || "card"}
                        onClick={
                          isSideLocked
                            ? undefined
                            : () => handleBetClick(item, openCardItem, "back")
                        }
                        title={
                          isSideLocked
                            ? "Bahar side is locked"
                            : `Back: ${displayRate || 0}`
                        }
                      />
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
const AndarBahar150 = memoizeCasinoComponent(AndarBahar150Component);
AndarBahar150.displayName = "AndarBahar150";

export default AndarBahar150;
