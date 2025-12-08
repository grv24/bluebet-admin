import React, { useState } from "react";
import {
  getBlackShapes,
  getNumberCard,
  getRedShapes,
  getCardByCode,
} from "../../../utils/card";
import { RiLockFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import IndividualResultModal from "@/components/modals/IndividualResultModal";
import { memoizeCasinoComponent } from "../../../utils/casinoMemo";

const BollywoodtableComponent = ({
  casinoData,
  remainingTime,
  results,
  gameSlug,
  gameCode,
  gameName,
}: {
  casinoData: any;
  remainingTime: number;
  results: any;
  gameSlug?: string;
  gameCode?: string;
  gameName?: string;
}) => {
  const navigate = useNavigate();

  // Modal state for individual result details
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);

  // Keep original gameCode/gameSlug for API calls (e.g., "BOLLYWOOD_TABLE")
  const apiGameType = React.useMemo(() => {
    return gameCode || gameSlug || "BOLLYWOOD_TABLE";
  }, [gameCode, gameSlug]);


  // Check if this is btable2 format - fix data source path
  const isBtable2 = casinoData?.data?.sub || casinoData?.data?.data?.data?.sub;
  const dataSource = isBtable2
    ? casinoData?.data?.sub || casinoData?.data?.data?.data?.sub
    : casinoData?.data?.data?.data?.t2;


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

  // Handle result click to open modal
  const handleResultClick = (item: any) => {
    // Extract matchId from result item
    const matchId = item?.mid || item?.result?.mid || item?.roundId || item?.id || item?.matchId;
    
    if (matchId && apiGameType) {
      setSelectedResultId(String(matchId));
      setIsResultModalOpen(true);
    }
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
                  </div>
                </div>
                <div className="flex gap- justify-center items-center w-full px-2">
                  <div
                    className={`bg-[var(--bg-back)] w-full relative`}
                  >
                    {isSuspended(item.nat) && <Lock />}
                    <h2 className="leading-10 text-[var(--bg-secondary)] flex items-center justify-center w-full">
                      {getRate(item.nat, "back")}
                    </h2>
                  </div>
                  <div
                    className={`bg-[var(--bg-lay)] w-full relative`}
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
              </div>
            </div>

            <div className="flex gap-1 justify-center items-center w-full px-2">
              <div
                className={`bg-[var(--bg-back)] w-full relative`}
              >
                {isSuspended("Odd") && <Lock />}
                <h2 className="leading-10 text-[var(--bg-secondary)] flex items-center justify-center w-full">
                  {getRate("Odd", "back")}
                </h2>
              </div>
              <div
                className={`bg-[var(--bg-lay)] w-full relative`}
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
              return (
                <div
                  key={index}
                  className="lg:flex-col flex-row items-center justify-center gap-2"
                >
                  <h2 className="flex justify-center items-center w-full px-2 py-1">
                    {getRate(item.nat, "back")}
                  </h2>
                  <button
                    className={`bg-gradient-to-r from-[var(--bg-primary)] to-[var(--bg-secondary)] py-2 text-white px-4 w-full relative`}
                  >
                    {isSuspended(item.nat) && <Lock />}
                    {item.name}
                  </button>
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
              return (
                <div
                  key={index}
                  className="flex flex-col justify-center items-center w-full"
                >
                  <h2 className="px-2 py-1 mb-1">
                    {getRate(item.nat, "back")}
                  </h2>
                  <button
                    className={`bg-gradient-to-r from-[var(--bg-primary)] to-[var(--bg-secondary)] py-2 text-white px-4 w-full relative`}
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
                  return (
                    <div
                      key={id}
                      className={`card-image relative w-full md:h-10 h-8`}
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
            onClick={() => navigate(`/reports/casino-result-report?game=${gameCode || gameSlug || "BOLLYWOOD_TABLE"}`)}
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
              const matchId = item?.mid || item?.result?.mid || item?.roundId || item?.id || item?.matchId;
              return (
                <div
                  key={item?.mid || item?.roundId || index}
                  className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-sm font-semibold text-yellow-400 ${
                    matchId ? "cursor-pointer hover:scale-110 transition-transform select-none" : ""
                  }`}
                  title={`Movie: ${resultValue}${matchId ? " - Click to view details" : ""}`}
                  onClick={(e) => {
                    if (matchId) {
                      e.preventDefault();
                      e.stopPropagation();
                      handleResultClick(item);
                    }
                  }}
                  role="button"
                  tabIndex={matchId ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (matchId && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      handleResultClick(item);
                    }
                  }}
                >
                  {displayText}
                </div>
              );
            })}
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
        title={`${gameName || "Bollywood Table"} Result Details`}
        enableBetFiltering={true}
      />
    </React.Fragment>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const Bollywoodtable = memoizeCasinoComponent(BollywoodtableComponent);
Bollywoodtable.displayName = "Bollywoodtable";

export default Bollywoodtable;
