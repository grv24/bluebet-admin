import { cardImage, getCardByCode } from "../../../utils/card";
import React, { useState, useMemo } from "react";
import { RiLockFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
// import IndividualResultModal from "@/components/casino/IndividualResultModal";
import { memoizeCasinoComponent } from "../../../utils/casinoMemo";

interface Baccarat2Props {
  casinoData?: any;
  remainingTime?: number;
  results?: any[];
  gameSlug?: string;
  gameCode?: string;
  gameName?: string;
}

const Baccarat2Component: React.FC<Baccarat2Props> = ({
  casinoData,
  remainingTime,
  results = [],
  gameSlug,
  gameCode,
  gameName,
}) => {
  const navigate = useNavigate();

  // Normalize gameSlug/gameCode to lowercase format (e.g., "BACCARAT2" -> "baccarat2")
  // Use gameCode as fallback if gameSlug is not provided
  const normalizedGameType = useMemo(() => {
    const gameType = gameSlug || gameCode;
    if (!gameType) return "baccarat2"; // Default fallback for Baccarat2
    return gameType.toLowerCase().replace(/_/g, "");
  }, [gameSlug, gameCode]);

  // Extract data for cards and odds
  const t1 = casinoData?.data?.data?.t1 || [];
  const t2 = casinoData?.data?.sub || [];

  // Get current card data - parse the card string
  const cardString = t1[0] || casinoData?.data?.card || "";
  const cards = cardString ? cardString.split(",") : [];
  const currentCards = {
    C1: cards[0] || "1",
    C2: cards[1] || "1",
    C3: cards[2] || "1",
    C4: cards[3] || "1",
    C5: cards[4] || "1",
    C6: cards[5] || "1",
  };


  // Helper function to get data by nat
  const getByNat = (nat: string) => {
    return t2.find((item: any) => item.nat === nat);
  };

  // Get rates from betting data
  const playerRate = getByNat("Player")?.b;
  const bankerRate = getByNat("Banker")?.b;

  // Helper function to check if betting is locked
  const isLocked = (nat: string) => {
    const data = getByNat(nat);
    return (
      data?.gstatus === "0" ||
      data?.gstatus === "SUSPENDED" ||
      data?.gstatus === "CLOSED"
    );
  };

  // Helper function to get card image by card code
  const getCardImage = (cardCode: string) => {
    if (!cardCode || cardCode === "1") return cardImage.back;
    return getCardByCode(cardCode, "baccarat2") || cardImage.back;
  };



  return (
    <div className="flex mt-1 flex-col gap-1">
      {/* Statistics Section */}
      <div className="border border-[var(--border)] flex lg:flex-row flex-col">
        <div className="lg:w-4/12 w-full p-4">
          <h2 className="text-sm font-semibold w-full mb-4">Statistics</h2>

          {/* Google Charts Style 3D Pie Chart */}
          <div className="relative w-full h-30">
            <svg
              className="w-full h-full cursor-pointer"
              viewBox="0 0 412 160"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Legend */}
              <g>
                <g column-id="Player">
                  <text
                    text-anchor="start"
                    x="288"
                    y="11.5"
                    font-family="Arial"
                    font-size="10"
                    fill="#222222"
                  >
                    Player
                  </text>
                  <circle cx="279" cy="8" r="5" fill="#086cb8"></circle>
                </g>
                <g column-id="Banker">
                  <text
                    text-anchor="start"
                    x="288"
                    y="27.5"
                    font-family="Arial"
                    font-size="10"
                    fill="#222222"
                  >
                    Banker
                  </text>
                  <circle cx="279" cy="24" r="5" fill="#ae2130"></circle>
                </g>
                <g column-id="Tie">
                  <text
                    text-anchor="start"
                    x="288"
                    y="43.5"
                    font-family="Arial"
                    font-size="10"
                    fill="#222222"
                  >
                    Tie
                  </text>
                  <circle cx="279" cy="40" r="5" fill="#279532"></circle>
                </g>
              </g>

              {/* 3D Pie Chart Slices with Click Effects */}
              <g>
                {/* Player (Blue) - 38% - Top Slice */}
                <g>
                  <path
                    d="M210,72.3L210,87.7A77,61.6,0,0,1,185.71012715650903,132.60446744915896L185.71012715650903,117.20446744915895A77,61.6,0,0,0,210,72.3"
                    stroke="#06518a"
                    strokeWidth="1"
                    fill="#06518a"
                    className="transition-all duration-200 hover:fill-blue-700"
                  ></path>
                  <path
                    d="M133,72.3L133,87.7L185.71012715650903,132.60446744915896L185.71012715650903,117.20446744915895"
                    stroke="#06518a"
                    strokeWidth="1"
                    fill="#06518a"
                    className="transition-all duration-200 hover:fill-blue-700"
                  ></path>
                  <path
                    d="M133,72.3L133,10.699999999999996A77,61.6,0,0,1,185.71012715650903,117.20446744915895L133,72.3A0,0,0,0,0,133,72.3"
                    stroke="#086cb8"
                    strokeWidth="1"
                    fill="#086cb8"
                    className="transition-all duration-200 hover:fill-blue-500"
                  ></path>
                  <text
                    text-anchor="start"
                    x="174.3895598191997"
                    y="60.13010730809122"
                    font-family="Arial"
                    font-size="10"
                    fill="#ffffff"
                  >
                    38%
                  </text>
                </g>

                {/* Tie (Green) - 10% - Left Slice */}
                <g>
                  <path
                    d="M133,72.3L133,87.7L87.74053557347956,37.86455314650324L87.74053557347956,22.464553146503242"
                    stroke="#1d7026"
                    strokeWidth="1"
                    fill="#1d7026"
                    className="transition-all duration-200 hover:fill-green-700"
                  ></path>
                  <path
                    d="M133,72.3L87.74053557347956,22.464553146503242A77,61.6,0,0,1,133,10.699999999999996L133,72.3A0,0,0,0,0,133,72.3"
                    stroke="#279532"
                    strokeWidth="1"
                    fill="#279532"
                    className="transition-all duration-200 hover:fill-green-500"
                  ></path>
                  <text
                    text-anchor="start"
                    x="105.28907859559388"
                    y="33.8202337357829"
                    font-family="Arial"
                    font-size="10"
                    fill="#ffffff"
                  >
                    10%
                  </text>
                </g>

                {/* Banker (Red) - 52% - Right Slice */}
                <g>
                  <path
                    d="M185.71012715650903,117.20446744915895L185.71012715650903,132.60446744915896A77,61.6,0,0,1,56,87.70000000000002L56,72.3A77,61.6,0,0,0,185.71012715650903,117.20446744915895"
                    stroke="#831924"
                    strokeWidth="1"
                    fill="#831924"
                    className="transition-all duration-200 hover:fill-red-700"
                  ></path>
                  <path
                    d="M133,72.3L185.71012715650903,117.20446744915895A77,61.6,0,1,1,87.74053557347956,22.464553146503242L133,72.3A0,0,0,1,0,133,72.3"
                    stroke="#ae2130"
                    strokeWidth="1"
                    fill="#ae2130"
                    className="transition-all duration-200 hover:fill-red-500"
                  ></path>
                  <text
                    text-anchor="start"
                    x="80.51196864150816"
                    y="102.87009655725257"
                    font-family="Arial"
                    font-size="10"
                    fill="#ffffff"
                  >
                    52%
                  </text>
                </g>
              </g>
            </svg>
          </div>
        </div>
        <div className="flex flex-col gap-6 lg:w-8/12 w-full">
          <div className="flex w-full ms-auto gap-2 items-center justify-center">
            {[
              "Score 1-4",
              "Score 5-6",
              "Score 7",
              "Score 8",
              "Score 9",
            ].map((item, index) => {
              const data = getByNat(item);
              const locked = isLocked(item);
              return (
                <div key={index} className="flex flex-col items-center">
                  <div
                    className="flex flex-col md:w-16 w-full items-center justify-center text-white px-2 bg-[var(--bg-secondary)] relative"
                  >
                    <h2 className="md:text-sm text-[10px] font-semibold text-nowrap">
                      {item}
                    </h2>
                    <h2 className="text-sm font-semibold">{data?.b ?? 0}</h2>
                    {locked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
                        <RiLockFill className="text-white text-lg" />
                      </div>
                    )}
                  </div>
                  {/* <h2
                      className={`text-xs font-semibold mt-1 ${
                        profitLoss > 0
                          ? "text-green-600"
                          : profitLoss < 0
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {profitLoss > 0 ? "+" : ""}
                      {profitLoss.toFixed(0)}
                    </h2> */}
                </div>
              );
            })}
          </div>
          <div className="flex my-4 items-center justify-center">
            {/* Player Pair */}
            <div className="flex flex-col items-center">
              <div
                className="w-24 flex px-2 py-1 rounded-s-4xl flex-col items-center justify-center bg-[var(--bg-primary)] relative h-20"
              >
                <h2 className="text-white text-sm text-nowrap font-semibold">
                  Player Pair
                </h2>
                <h2 className="text-sm text-white font-semibold">
                  {getByNat("Player Pair")?.b ?? 0}
                </h2>
                {isLocked("Player Pair") && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-s-4xl z-10">
                    <RiLockFill className="text-white text-lg" />
                  </div>
                )}
              </div>
            </div>

            <div className="w-full flex justify-center items-start">
              {/* Player */}
              <div className="flex flex-col items-center flex-1">
                <div
                  className="bg-[var(--bg-primary)] flex flex-col items-center justify-center w-full h-20 p-1.5 px-2 relative"
                >
                  <h2 className="text-sm font-semibold text-nowrap text-white">
                    Player {playerRate}:1
                  </h2>
                  <div className="flex gap-4 relative z-20">
                    {currentCards.C5 && currentCards.C5 !== "1" && (
                      <img
                        src={getCardImage(currentCards.C5)}
                        className="w-4 rotate-270"
                        alt=""
                      />
                    )}
                    <img
                      src={getCardImage(currentCards.C3)}
                      className="w-4"
                      alt=""
                    />
                    <img
                      src={getCardImage(currentCards.C1)}
                      className="w-4"
                      alt=""
                    />
                  </div>
                  <h2 className="text-sm font-semibold text-white">
                    {getByNat("Player")?.b ?? 0}
                  </h2>
                  {isLocked("Player") && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
                      <RiLockFill className="text-white text-lg" />
                    </div>
                  )}
                </div>
              </div>

              {/* Tie */}
              <div className="flex flex-col items-center flex-1">
                <div
                  className="bg-[#279532] flex flex-col items-center justify-center w-full h-20 py-1.5 relative"
                >
                  <h2 className="text-sm font-semibold leading-5.5 text-white">
                    Tie
                  </h2>
                  <h2 className="text-sm font-semibold text-white">
                    {getByNat("Tie")?.b ?? 0}
                  </h2>
                  {isLocked("Tie") && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
                      <RiLockFill className="text-white text-lg" />
                    </div>
                  )}
                </div>
              </div>

              {/* Banker */}
              <div className="flex flex-col items-center flex-1">
                <div
                  className="bg-[#ae2130] flex flex-col items-center justify-center w-full h-20 p-1 relative"
                >
                  <h2 className="text-sm font-semibold text-nowrap text-white">
                    Banker {bankerRate}:1
                  </h2>
                  <div className="flex gap-4 relative z-20">
                    <img
                      src={getCardImage(currentCards.C2)}
                      className="w-4"
                      alt=""
                    />
                    <img
                      src={getCardImage(currentCards.C4)}
                      className="w-4"
                      alt=""
                    />
                  </div>
                  <h2 className="text-sm font-semibold text-white">
                    {getByNat("Banker")?.b ?? 0}
                  </h2>
                  {isLocked("Banker") && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
                      <RiLockFill className="text-white text-lg" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Banker Pair */}
            <div className="flex flex-col items-center">
              <div
                className="w-24 flex px-4 py-1 rounded-e-4xl flex-col items-center justify-center bg-[#ae2130] relative h-20"
              >
                <h2 className="text-white text-nowrap text-sm font-semibold">
                  Banker Pair
                </h2>
                <h2 className="text-sm text-white font-semibold">
                  {getByNat("Banker Pair")?.b ?? 0}
                </h2>
                {isLocked("Banker Pair") && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-e-4xl z-10">
                    <RiLockFill className="text-white text-lg" />
                  </div>
                )}
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
            onClick={() => navigate(`/casino-result?game=${gameSlug || gameCode || "baccarat2"}`)}
            className="text-sm font-normal leading-8 text-white"
          >
            View All
          </h2>
        </div>
        <div className="flex justify-end items-center mb-2 gap-1 mx-2">
          {Array.isArray(results) && results.length > 0
            ? results.slice(0, 10).map((item: any, index: number) => {
                const resultType = item.win;
                let textColor = "text-gray-400";
                let resultText = "?";

                if (resultType === "1") {
                  textColor = "text-white bg-[var(--bg-primary)]"; // Player
                  resultText = "P";
                } else if (resultType === "2") {
                  textColor = "text-white bg-red-800"; // Banker
                  resultText = "B";
                } else if (resultType === "3") {
                  textColor = "text-white bg-green-800"; // Tie
                  resultText = "T";
                }

                return (
                  <h2
                    key={index}
                    className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-sm font-semibold ${textColor}`}
                  >
                    {resultText}
                  </h2>
                );
              })
            : // Fallback to old data structure if results prop is not available
              (casinoData as any)?.data?.data?.result
                ?.slice(0, 10)
                .map((item: any, index: number) => {
                  const resultType = item.win || item.result;
                  let textColor = "text-gray-400";
                  let resultText = "?";

                  if (resultType === "1") {
                    textColor = "text-blue-500"; // Player
                    resultText = "P";
                  } else if (resultType === "2") {
                    textColor = "text-red-500"; // Banker
                    resultText = "B";
                  } else if (resultType === "3") {
                    textColor = "text-green-500"; // Tie
                    resultText = "T";
                  }

                  return (
                    <h2
                      key={index}
                      className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-sm font-semibold ${textColor}`}
                    >
                      {resultText}
                    </h2>
                  );
                })}
        </div>
      </div>

      {/* Individual Result Details Modal */}
      {/* <IndividualResultModal
        isOpen={isModalOpen}
        onClose={closeModal}
        resultId={selectedResult?.mid}
        gameType={normalizedGameType}
        title={`${gameName || "Baccarat 2"} Result Details`}
      /> */}
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const Baccarat2 = memoizeCasinoComponent(Baccarat2Component);
Baccarat2.displayName = "Baccarat2";

export default Baccarat2;
