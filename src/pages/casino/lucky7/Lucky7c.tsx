import {
  cardImage,
  getBlackShapes,
  getNumberCard,
  getRedShapes,
  getCardByCode,
} from "../../../utils/card";
import React, { useState } from "react";
import { RiLockFill } from "react-icons/ri";
// import { getCasinoIndividualResult } from "../../../helper/casino";
import { useCookies } from "react-cookie";
import { useQuery } from "@tanstack/react-query";
// import CasinoModal from "../../../components/common/CasinoModal";
import { useNavigate } from "react-router-dom";
import { memoizeCasinoComponent } from "../../../utils/casinoMemo";

const formatDateTime = (value: string | number | undefined | null): string => {
  if (value === undefined || value === null) return "N/A";

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

const Lucky7cComponent = ({
  casinoData,
  remainingTime,
  results,
  gameSlug,
  name,
}: any) => {
  const [cookies] = useCookies(["clientToken"]);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [betFilter, setBetFilter] = useState("all");
  const navigate = useNavigate();

  const t2: any[] =
    casinoData?.data?.sub || casinoData?.data?.data?.data?.t2 || [];

  /**
   * Universal profit/loss calculation function for all Lucky7EU betting types
   * @param betType - The type of bet to calculate profit/loss for
   * @returns The profit/loss amount (negative for loss-only display)
   */


  // Function to parse cards from API response
  const parseCards = (cardsString: string) => {
    if (!cardsString) return [];

    const cards = cardsString.split(",").filter((card) => card && card.trim());
    return cards;
  };

  // Function to get winner information
  const getWinnerInfo = (resultData: any) => {
    if (!resultData) return { winner: null, description: "" };

    const win = resultData.win;
    const desc = resultData.desc || resultData.newdesc || "";

    let winner = null;

    // Parse description for winner information
    if (desc) {
      const parts = desc.split("#");
      if (parts.length >= 1) {
        winner = parts[0] || null;
      }
    }

    // Fallback to win field if description parsing fails
    if (!winner) {
      if (win === "1") winner = "Low Card";
      else if (win === "2") winner = "High Card";
      else if (win === "0") winner = "Tie";
    }

    return { winner, description: desc };
  };

  // Function to parse Lucky7EU description and extract details
  const parseLucky7Description = (desc: string, newdesc: string) => {
    // Use desc if newdesc is not available
    const descriptionToParse = newdesc || desc;

    if (!descriptionToParse)
      return {
        result: "N/A",
        oddEven: "N/A",
        color: "N/A",
        card: "N/A",
        cardSequence: "N/A",
      };

    // Parse the description field which has the format:
    // "Low Card#Even#Red#6#4 5 6"
    const sections = descriptionToParse.split("#");

    return {
      result: sections[0] || "N/A",
      oddEven: sections[1] || "N/A",
      color: sections[2] || "N/A",
      card: sections[3] || "N/A",
      cardSequence: sections[4] || "N/A",
    };
  };

  // Function to format description for better display
  const formatDescription = (desc: string): string[] => {
    if (!desc) return [];

    // Split by # character and filter out empty parts
    return desc.split("#").filter((line) => line.trim());
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



  // React Query for individual result details
  // const {
  //   data: resultDetails,
  //   isLoading,
  //   error,
  // } = useQuery<any>({
  //   queryKey: ["casinoIndividualResult", selectedResult?.mid],
  //   queryFn: () =>
  //     getCasinoIndividualResult(selectedResult?.mid, cookies, gameSlug),
  //   enabled: !!selectedResult?.mid && isModalOpen,
  //   staleTime: 1000 * 60 * 5, // 5 minutes
  //   gcTime: 1000 * 60 * 10, // 10 minutes
  //   retry: 2,
  // });

  // Parse cards and winner info from result details
  // const resultData = resultDetails?.data?.matchData;
  // const cards = parseCards(resultData?.cards || "");
  // const { winner, description } = getWinnerInfo(resultData);
  // const formattedDescription = formatDescription(description);
  // const {
  //   result: lucky7Result,
  //   oddEven,
  //   color,
  //   card,
  //   cardSequence,
  // } = parseLucky7Description(resultData?.desc || "", resultData?.newdesc || "");


  /**
   * Handle clicking on individual result to show details
   */


  /**
   * Close the result details modal
   */
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedResult(null);
  };

  const getByNat = (name: string) =>
    t2.find(
      (x) =>
        String(x?.nat || x?.nation || "").toLowerCase() === name.toLowerCase()
    );

  const isLocked = (row: any) => {
    const s = row?.gstatus as string | number | undefined;
    return s !== "OPEN" || (remainingTime ?? 0) <= 3;
  };

  return (
    <div className="w-full flex flex-col gap-2">
      {/* top row */}
      <div className="flex bg-[var(--bg-table-row)] p-4 items-center justify-center gap-2">
        <div className="flex flex-col w-full">
          {(() => {
            const row = getByNat("Low Card") || {};
            const locked = isLocked(row);
            const value = row?.b ?? "0";
            return (
              <>
                <h2 className="text-black text-md font-bold text-center">
                  {value}
                </h2>
                <button
                  className="relative bg-gradient-to-r from-[var(--bg-primary)] text-white font-semibold to-[var(--bg-secondary)] w-full py-2"
                  disabled={locked}
                  }
                >
                  {locked && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <RiLockFill className="text-white" />
                    </span>
                  )}
                  Low Card
                </button>
                <h2
                  className={`text-xs font-semibold leading-5 text-center ${
                      ? "text-green-600"
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                </h2>
              </>
            );
          })()}
        </div>
        <div className="flex items-center justify-center w-26">
          <img src={getNumberCard("7")} className="w-full" />
        </div>
        <div className="flex flex-col w-full">
          {(() => {
            const row = getByNat("High Card") || {};
            const locked = isLocked(row);
            const value = row?.b ?? "0";
            return (
              <>
                <h2 className="text-black text-md font-bold text-center">
                  {value}
                </h2>
                <button
                  className="relative bg-gradient-to-r from-[var(--bg-primary)] text-white font-semibold to-[var(--bg-secondary)] w-full py-2"
                  disabled={locked}
                  }
                >
                  {locked && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <RiLockFill className="text-white" />
                    </span>
                  )}
                  High Card
                </button>
                <h2
                  className={`text-xs font-semibold leading-5 text-center ${
                      ? "text-green-600"
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                </h2>
              </>
            );
          })()}
        </div>
      </div>
      {/* second row */}
      <div className=" place-items-center gap-2  grid md:grid-cols-2 grid-cols-1">
        <div className="flex items-center py-4 bg-[var(--bg-table-row)] w-full gap-2 px-4">
          <div className="flex flex-col w-full">
            {(() => {
              const row = getByNat("Even") || {};
              const locked = isLocked(row);
              const value = row?.b ?? "0";
              return (
                <>
                  <h2 className="text-black text-md font-bold text-center">
                    {value}
                  </h2>
                  <button
                    className="relative bg-gradient-to-r from-[var(--bg-primary)] text-white font-semibold to-[var(--bg-secondary)] w-full py-2.5"
                    disabled={locked}
                      !locked &&
                      row?.sid &&
                    }
                  >
                    {locked && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <RiLockFill className="text-white" />
                      </span>
                    )}
                    Even
                  </button>
                  <h2
                    className={`text-xs font-semibold leading-5 text-center ${
                        ? "text-green-600"
                          ? "text-red-600"
                          : "text-gray-600"
                    }`}
                  >
                  </h2>
                </>
              );
            })()}
          </div>
          <div className="flex flex-col w-full">
            {(() => {
              const row = getByNat("Odd") || {};
              const locked = isLocked(row);
              const value = row?.b ?? "0";
              return (
                <>
                  <h2 className="text-black text-md font-bold text-center">
                    {value}
                  </h2>
                  <button
                    className="relative bg-gradient-to-r from-[var(--bg-primary)] text-white font-semibold to-[var(--bg-secondary)] w-full py-2.5"
                    disabled={locked}
                      !locked &&
                      row?.sid &&
                    }
                  >
                    {locked && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <RiLockFill className="text-white" />
                      </span>
                    )}
                    Odd
                  </button>
                  <h2
                    className={`text-xs font-semibold leading-5 text-center ${
                        ? "text-green-600"
                          ? "text-red-600"
                          : "text-gray-600"
                    }`}
                  >
                  </h2>
                </>
              );
            })()}
          </div>
        </div>
        <div className="flex items-center py-4  bg-[var(--bg-table-row)] w-full gap-2 px-4">
          <div className="flex flex-col w-full">
            {(() => {
              const row = getByNat("Red") || {};
              const locked = isLocked(row);
              const value = row?.b ?? "0";
              return (
                <>
                  <h2 className="text-black text-md font-bold text-center">
                    {value}
                  </h2>
                  <button
                    className="relative bg-gradient-to-r from-[var(--bg-primary)] text-white font-semibold to-[var(--bg-secondary)] w-full py-2.5"
                    disabled={locked}
                      !locked &&
                      row?.sid &&
                    }
                  >
                    {locked && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <RiLockFill className="text-white" />
                      </span>
                    )}
                    <div className="flex gap-1  justify-center items-center">
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
                  </button>
                  <h2
                    className={`text-xs font-semibold leading-5 text-center ${
                        ? "text-green-600"
                          ? "text-red-600"
                          : "text-gray-600"
                    }`}
                  >
                  </h2>
                </>
              );
            })()}
          </div>
          <div className="flex flex-col w-full">
            {(() => {
              const row = getByNat("Black") || {};
              const locked = isLocked(row);
              const value = row?.b ?? "0";
              return (
                <>
                  <h2 className="text-black text-md font-bold text-center">
                    {value}
                  </h2>
                  <button
                    className="relative bg-gradient-to-r from-[var(--bg-primary)] text-white font-semibold to-[var(--bg-secondary)] w-full py-2.5"
                    disabled={locked}
                      !locked &&
                      row?.sid &&
                    }
                  >
                    {locked && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <RiLockFill className="text-white" />
                      </span>
                    )}
                    <div className="flex gap-1  justify-center items-center">
                      <img src={getRedShapes().Heart} alt="" className="w-5" />
                      <img src={getBlackShapes().Club} alt="" className="w-5" />
                    </div>
                  </button>
                  <h2
                    className={`text-xs font-semibold leading-5 text-center ${
                        ? "text-green-600"
                          ? "text-red-600"
                          : "text-gray-600"
                    }`}
                  >
                  </h2>
                </>
              );
            })()}
          </div>
        </div>
      </div>
      {/* third row */}
      <div className="grid md:grid-cols-4 grid-cols-2 gap-2">
        {/* Line 1: Cards 1, 2, 3 */}
        <div className="flex flex-col items-center justify-center gap-2 bg-[var(--bg-table-row)] p-2">
          <h2 className="text-black text-md font-bold text-center">
            {getByNat("Line 1")?.b ?? "0"}
          </h2>
          <div className="flex gap-2 bg-[var(--bg-table-row)] p-2 justify-center items-center">
            {["1", "2", "3"].map((item, index) => {
              const lineRow = getByNat("Line 1") || {};
              const locked = isLocked(lineRow);
              return (
                <div key={item} className="flex flex-col items-center gap-1">
                  <button
                    className="relative"
                    disabled={locked}
                      !locked &&
                      lineRow?.sid &&
                    }
                  >
                    {locked && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
                        <RiLockFill className="text-white text-xs" />
                      </span>
                    )}
                    <img
                      src={getNumberCard(item === "1" ? "A" : item)}
                      alt=""
                      className="lg:w-8 w-6"
                    />
                  </button>
                </div>
              );
            })}
          </div>
          <h2
            className={`text-xs font-semibold leading-3 ${
                ? "text-green-600"
                  ? "text-red-600"
                  : "text-gray-600"
            }`}
          >
          </h2>
        </div>
        {/* Line 2: Cards 4, 5, 6 */}
        <div className="flex flex-col items-center justify-center gap-2 bg-[var(--bg-table-row)] p-2">
          <h2 className="text-black text-md font-bold text-center">
            {getByNat("Line 2")?.b ?? "0"}
          </h2>
          <div className="flex gap-2 bg-[var(--bg-table-row)] p-2 justify-center items-center">
            {["4", "5", "6"].map((item, index) => {
              const lineRow = getByNat("Line 2") || {};
              const locked = isLocked(lineRow);
              return (
                <div key={item} className="flex flex-col items-center gap-1">
                  <button
                    className="relative"
                    disabled={locked}
                      !locked &&
                      lineRow?.sid &&
                    }
                  >
                    {locked && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
                        <RiLockFill className="text-white text-xs" />
                      </span>
                    )}
                    <img
                      src={getNumberCard(item)}
                      alt=""
                      className="lg:w-8 w-6"
                    />
                  </button>
                </div>
              );
            })}
          </div>
          <h2
            className={`text-xs font-semibold leading-3 ${
                ? "text-green-600"
                  ? "text-red-600"
                  : "text-gray-600"
            }`}
          >
          </h2>
        </div>
        {/* Line 3: Cards 7, 8, 9 */}
        <div className="flex flex-col items-center justify-center gap-2 bg-[var(--bg-table-row)] p-2">
          <h2 className="text-black text-md font-bold text-center">
            {getByNat("Line 3")?.b ?? "0"}
          </h2>
          <div className="flex gap-2 bg-[var(--bg-table-row)] p-2 justify-center items-center">
            {["8", "9", "10"].map((item, index) => {
              const lineRow = getByNat("Line 3") || {};
              const locked = isLocked(lineRow);
              return (
                <div key={item} className="flex flex-col items-center gap-1">
                  <button
                    className="relative"
                    disabled={locked}
                      !locked &&
                      lineRow?.sid &&
                    }
                  >
                    {locked && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
                        <RiLockFill className="text-white text-xs" />
                      </span>
                    )}
                    <img
                      src={getNumberCard(item)}
                      alt=""
                      className="lg:w-8 w-6"
                    />
                  </button>
                </div>
              );
            })}
          </div>
          <h2
            className={`text-xs font-semibold leading-3 ${
                ? "text-green-600"
                  ? "text-red-600"
                  : "text-gray-600"
            }`}
          >
          </h2>
        </div>
        {/* Line 4: Cards 10, J, Q, K (or 10, J, Q if only 3) */}
        <div className="flex flex-col items-center justify-center gap-2 bg-[var(--bg-table-row)] p-2">
          <h2 className="text-black text-md font-bold text-center">
            {getByNat("Line 4")?.b ?? "0"}
          </h2>
          <div className="flex gap-2 bg-[var(--bg-table-row)] p-2 justify-center items-center">
            {["J", "Q", "K"].slice(0, 3).map((item, index) => {
              const lineRow = getByNat("Line 4") || {};
              const locked = isLocked(lineRow);
              return (
                <div key={item} className="flex flex-col items-center gap-1">
                  <button
                    className="relative"
                    disabled={locked}
                      !locked &&
                      lineRow?.sid &&
                    }
                  >
                    {locked && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
                        <RiLockFill className="text-white text-xs" />
                      </span>
                    )}
                    <img
                      src={getNumberCard(item)}
                      alt=""
                      className="lg:w-8 w-6"
                    />
                  </button>
                </div>
              );
            })}
          </div>
          <h2
            className={`text-xs font-semibold leading-3 ${
                ? "text-green-600"
                  ? "text-red-600"
                  : "text-gray-600"
            }`}
          >
          </h2>
        </div>
      </div>
      {/* fourth row - All Cards (Card 1 to Card K) */}
      <div className="flex flex-col gap-2 py-4 bg-[var(--bg-table-row)]">
        <h2 className="text-black text-md font-bold text-center">
          {getByNat("Card 1")?.b ?? "0"}
        </h2>
        <div className="flex items-center justify-center gap-2">
          {[
            "1",
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
          ].map((item, index) => {
            const row = getByNat(`Card ${item}`) || {};
            const locked = isLocked(row);
            return (
              <div key={item} className="flex flex-col items-center gap-1">
                <button
                  className="relative"
                  disabled={locked}
                  }
                >
                  {locked && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
                      <RiLockFill className="text-white text-xs" />
                    </span>
                  )}
                  <img
                    src={getNumberCard(item === "1" ? "A" : item)}
                    alt=""
                    className="lg:w-8 w-6"
                  />
                </button>
                <h2
                  className={`text-xs font-semibold leading-3 ${
                      ? "text-green-600"
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                </h2>
              </div>
            );
          })}
        </div>
      </div>
      {/* Results */}
      <div className="mt-1 flex flex-col gap-1">
        <div className="bg-[var(--bg-secondary85)] border border-gray-300 flex justify-between px-2 py-.5 items-center">
          <h2 className="text-sm font-normal leading-8 text-white">
            Last Result
          </h2>
          <h2
            onClick={() => navigate(`/casino-result?game=${gameSlug}`)}
            className="text-sm font-normal leading-8 text-white"
          >
            View All
          </h2>
        </div>
        <div className="flex justify-end items-center mb-2 gap-1 mx-2">
          {results?.slice(0, 10).map((item: any, index: number) => {
            let displayText = "";
            let textColor = "";

            if (item.win === "1") {
              displayText = "L";
              textColor = "text-red-500";
            } else if (item.win === "0") {
              displayText = "T";
              textColor = "text-white";
            } else if (item.win === "2") {
              displayText = "H";
              textColor = "text-yellow-400";
            } else {
              displayText = "?";
              textColor = "text-gray-400";
            }

            return (
              <h2
                key={index}
                className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-sm font-semibold ${textColor} `}
              >
                {displayText}
              </h2>
            );
          })}
        </div>
      </div>

      
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const Lucky7c = memoizeCasinoComponent(Lucky7cComponent);
Lucky7c.displayName = "Lucky7c";

export default Lucky7c;
