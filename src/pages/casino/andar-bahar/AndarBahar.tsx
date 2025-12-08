import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cardImage, getNumberCard } from "../../../utils/card";
import IndividualResultModal from "@/components/modals/IndividualResultModal";
import { memoizeCasinoComponent } from "../../../utils/casinoMemo";

const AndarBaharComponent = ({
  casinoData,
  remainingTime,
  results,
  gameSlug,
  gameName,
}: {
  casinoData: any;
  remainingTime: number;
  results: any;
  gameSlug?: string;
  gameName?: string;
}) => {
  const navigate = useNavigate();
  
  // Modal state for individual result details
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);

  // Use gameSlug prop or default to "AB_20"
  const apiGameType = React.useMemo(() => {
    return gameSlug || "AB_20";
  }, [gameSlug]);

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

  // Check if item is suspended (for display purposes only)
  const isSuspended = (item: any) => {
    return (
      !item ||
      item.gstatus === "SUSPENDED" ||
      item.gstatus === "CLOSED" ||
      remainingTime <= 3
    );
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
                        className="w-8 h-full"
                        alt={
                          suspended && !isCardRevealed ? "card back" : item?.nat
                        }
                        title={`Rate: ${displayRate || 0}`}
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
                        className="w-8 h-full"
                        alt={
                          suspended && !isCardRevealed ? "card back" : item?.nat
                        }
                        title={`Rate: ${displayRate || 0}`}
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
          <h2
            onClick={() => navigate(`/reports/casino-result-report?game=${gameSlug || "AB_20"}`)}
            className="text-sm font-normal leading-8 text-white cursor-pointer hover:text-gray-200"
          >
            View All
          </h2>
        </div>
        <div className="flex justify-end items-center mb-2 gap-1 mx-2">
          {results && Array.isArray(results)
            ? results.slice(0, 10).map((item: any, index: number) => {
                // Parse the result to determine Andar/Bahar and card
                const resultValue = item?.win || item?.result || "?";
                const matchId = item?.mid || item?.result?.mid || item?.roundId;

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
                    key={item?.mid || item?.roundId || index}
                    className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-sm font-semibold ${textColor} ${
                      matchId ? "cursor-pointer hover:scale-110 transition-transform" : ""
                    }`}
                    title={`Result: ${resultValue}${matchId ? " - Click to view details" : ""}`}
                    onClick={() => {
                      if (matchId) {
                        setSelectedResultId(String(matchId));
                        setIsResultModalOpen(true);
                      }
                    }}
                  >
                   R
                  </h2>
                );
              })
            : null}
        </div>
      </div>

      {/* Individual Result Details Modal */}
      <IndividualResultModal
        isOpen={isResultModalOpen}
        onClose={() => {
          setIsResultModalOpen(false);
          setSelectedResultId(null);
        }}
        resultId={selectedResultId}
        gameType={apiGameType}
        title={`${gameName || "Andar Bahar"} Result Details`}
        enableBetFiltering={true}
      />
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const AndarBahar = memoizeCasinoComponent(AndarBaharComponent);
AndarBahar.displayName = "AndarBahar";

export default AndarBahar;
