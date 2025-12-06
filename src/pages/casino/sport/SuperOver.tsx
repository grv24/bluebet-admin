import React, { useMemo, useEffect, useRef, useState, useContext } from "react";
// import { PlaceBetUseContext } from '@/context/placebet';
import { useNavigate } from "react-router-dom";
// import IndividualResultModal from '@/components/casino/IndividualResultModal';
// import { useIndividualResultModal } from '@/hooks/useIndividualResultModal';
import { memoizeCasinoComponent } from '../../../utils/casinoMemo';

interface SuperOverProps {
  casinoData: any;
  remainingTime: number;
  results?: any[];
  gameCode?: string;
  gameName?: string;
}

/**
 * Status values that indicate a betting market is locked/closed
 */
const LOCKED_STATUSES = {
  BOOKMAKER: [
    "CLOSED",
    "SUSPENDED",
    "Starting Soon.",
    "Ball Running",
    "LOSER",
    "WINNER",
    "THE DRAW",
    "INACTIVE",
    "DISABLED",
  ],
  FANCY: ["CLOSED", "SUSPENDED", "Starting Soon.", "Ball Running", "INACTIVE"],
};

/**
 * Check if a status is locked for bookmaker odds
 */
const isStatusLocked = (
  status: string,
  marketType: "BOOKMAKER" | "FANCY"
): boolean => {
  return LOCKED_STATUSES[marketType].includes(status);
};

/**
 * Custom hook to track value changes and trigger blink effect
 */
const useBlinkOnChange = (value: any, vol: any) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const prevValueRef = useRef<any>(null);
  const prevVolRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const valueChanged =
      prevValueRef.current !== null && prevValueRef.current !== value;
    const volChanged =
      prevVolRef.current !== null && prevVolRef.current !== vol;

    if (valueChanged || volChanged) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      setIsBlinking(true);
      timerRef.current = setTimeout(() => {
        setIsBlinking(false);
        timerRef.current = null;
      }, 800);
    }

    prevValueRef.current = value;
    prevVolRef.current = vol;
  }, [value, vol]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return isBlinking;
};

/**
 * Component for odds display with blink effect (Bookmaker - 1 back, 1 lay)
 */
const BlinkingOddsCell = ({
  value,
  vol,
  type,
  isLocked,
  onClick,
}: {
  value: any;
  vol: any;
  type: "back" | "lay";
  isLocked?: boolean;
  onClick?: () => void;
}) => {
  const isBlinking = useBlinkOnChange(value, vol);

  const backgroundClass = useMemo(() => {
    const baseClass =
      "text-center w-1/2 border-r border-[var(--border)] min-h-[40px] flex flex-col justify-center";

    if (isBlinking) {
      return `${baseClass} bg-yellow-300 shadow-lg transform scale-105 animate-pulse`;
    }

    return type === "back"
      ? `${baseClass} bg-[var(--bg-back)] hover:bg-[var(--bg-back)]/90 transition-colors duration-200`
      : `${baseClass} bg-[var(--bg-lay)] hover:bg-[var(--bg-lay)]/90 transition-colors duration-200`;
  }, [isBlinking, type]);

  return (
    <div className={backgroundClass} onClick={onClick}>
      <span
        className={`font-semibold text-xs leading-tight ${isBlinking ? "text-gray-900" : ""}`}
      >
        {value && value !== "0.0" && value !== 0 && value !== "0" ? value : "-"}
      </span>
      <span
        className={`text-[10px] text-gray-600 leading-tight hidden lg:block ${isBlinking ? "text-gray-700" : ""}`}
      >
        {vol && vol !== "0.0" && vol !== 0 && vol !== "0" ? vol : "-"}
      </span>
      <span
        className={`text-[10px] text-gray-600 block lg:hidden ${isBlinking ? "text-gray-700" : ""}`}
      >
        {vol && vol !== "0.0" && vol !== 0 && vol !== "0"
          ? Number(vol).toFixed(0)
          : "-"}
      </span>
    </div>
  );
};

BlinkingOddsCell.displayName = "BlinkingOddsCell";

/**
 * Component for odds display with blink effect (Fancy - 1 back, 1 lay)
 */
const FancyOddsCell = ({
  value,
  vol,
  type,
  isLocked,
  onClick,
}: {
  value: any;
  vol: any;
  type: "back" | "lay";
  isLocked?: boolean;
  onClick?: () => void;
}) => {
  const isBlinking = useBlinkOnChange(value, vol);

  const backgroundClass = useMemo(() => {
    const baseClass =
      "text-center w-full border-r border-[var(--border)] min-h-[40px] flex flex-col justify-center";

    if (isBlinking) {
      return `${baseClass} bg-yellow-300 shadow-lg transform scale-105 animate-pulse`;
    }

    return type === "back"
      ? `${baseClass} bg-[var(--bg-back)] hover:bg-[var(--bg-back)]/90 transition-colors duration-200`
      : `${baseClass} bg-[var(--bg-lay)] hover:bg-[var(--bg-lay)]/90 transition-colors duration-200`;
  }, [isBlinking, type]);

  return (
    <div className={backgroundClass} onClick={onClick}>
      <span
        className={`font-semibold text-xs leading-tight ${isBlinking ? "text-gray-900" : ""}`}
      >
        {value && value !== "0.0" && value !== 0 && value !== "0" ? value : "-"}
      </span>
      <span
        className={`text-[10px] text-gray-600 leading-tight hidden lg:block ${isBlinking ? "text-gray-700" : ""}`}
      >
        {vol && vol !== "0.0" && vol !== 0 && vol !== "0" ? vol : "-"}
      </span>
      <span
        className={`text-[10px] text-gray-600 block lg:hidden ${isBlinking ? "text-gray-700" : ""}`}
      >
        {vol && vol !== "0.0" && vol !== 0 && vol !== "0"
          ? Number(vol).toFixed(0)
          : "-"}
      </span>
    </div>
  );
};

FancyOddsCell.displayName = "FancyOddsCell";

/**
 * Render locked status overlay component
 */
const renderLockedOverlay = (status: string) => (
  <div className="absolute uppercase inset-0 bg-gray-700 text-[#ff0000] font-bold text-center opacity-95 flex items-center justify-center z-10 h-full text-sm">
    {status}
  </div>
);

// Extract odds from section odds array
const getOddsFromSection = (section: any, oname: string) => {
  if (!section?.odds || !Array.isArray(section.odds)) return null;
  return section.odds.find((odd: any) => odd.oname === oname) || null;
};

const SuperOverComponent: React.FC<SuperOverProps> = ({
  casinoData,
  remainingTime,
  results = [],
  gameCode,
}) => {
  const navigate = useNavigate();
  // const placeBetContext = useContext(PlaceBetUseContext);
  // const { setPlaceBet, setBetData, setLatestBetData } = placeBetContext || {};
  // const resultModal = useIndividualResultModal();

  // Get data from t1 and t2 structure
  const gameInfo = useMemo(() => {
    return casinoData?.data?.t1 || casinoData?.data?.current?.t1 || {};
  }, [casinoData]);
  
  const markets = useMemo(() => {
    return casinoData?.data?.t2 || casinoData?.data?.current?.t2 || [];
  }, [casinoData]);

  // Get match ID from gameInfo (gmid) - this is the actual match ID
  const matchId = useMemo(() => {
    return (
      gameInfo?.gmid ||
      casinoData?.data?.current?.mid ||
      casinoData?.data?.mid ||
      gameInfo?.mid ||
      null
    );
  }, [casinoData, gameInfo]);

  // 🚀 PERFORMANCE: Memoize market finding operations
  // Get Bookmaker market
  const bookmakerMarket = useMemo(() => {
    return markets.find((market: any) => market.mname === "Bookmaker");
  }, [markets]);

  // Get Fancy markets (Fancy1, etc.)
  const fancyMarkets = useMemo(() => {
    return markets.filter((market: any) => market.mname?.includes("Fancy"));
  }, [markets]);

  // Profit/Loss calculation function


  // Format max value (convert to "L" notation if >= 100000)
  const formatMax = (max: number | string | undefined): string => {
    if (!max) return "";
    const num = Number(max);
    if (isNaN(num)) return "";
    if (num >= 100000) {
      const lakhs = num / 100000;
      return `${lakhs}L`;
    }
    return num.toString();
  };

  // Handle bet click for Bookmaker
  const handleBookmakerBetClick = (
    section: any,
    betType: "back" | "lay",
    oddsValue: string | number
  ) => {
    // if (!setPlaceBet || !setBetData || !setLatestBetData) {
    //   }
    //   return;
    // }

    const oddsNum = parseFloat(String(oddsValue));
    const betData = {
      sid: section.sid,
      rname: section.nat,
      mid: matchId || bookmakerMarket?.mid,
      market: bookmakerMarket?.mname,
      mname: bookmakerMarket?.mname,
      mstatus: bookmakerMarket?.status,
      status: section.gstatus,
      gtype: bookmakerMarket?.gtype,
      isPlay: gameInfo?.iplay,
      odd: oddsNum,
      stake: 0,
      profit: 0,
      loss: 0,
      oddType: "bookmaker",
      marketType: "bookMakerOdds",
      betType: betType,
      betName: section.nat,
      boxColor: betType === "back" ? "bg-[#B2D6F0]" : "bg-[#FAA9BA]",
      matchOddVariant: betType === "back" ? "b1" : "l1",
      matchOdd: oddsNum,
      betRate: oddsNum,
      oddCategory: betType === "back" ? "Back" : "Lay",
      oddSubType: "normal",
      otherInfo: {},
      name: section.nat,
      sportType: "cricket",
      stakeLimit: section.max || bookmakerMarket?.max || 10000,
      minStake: section.min || bookmakerMarket?.min || 10,
      maxStake: section.max || bookmakerMarket?.max || 10000,
      gameSlug: gameCode,
      gameName: gameCode,
    };

    // setBetData(betData);
    // setLatestBetData(betData);
    // setPlaceBet(true);
  };

  // Handle bet click for Fancy
  const handleFancyBetClick = (
    section: any,
    market: any,
    betType: "back" | "lay",
    oddsValue: string | number
  ) => {
    // if (!setPlaceBet || !setBetData || !setLatestBetData) {
    //   }
    //   return;
    // }

    const oddsNum = parseFloat(String(oddsValue));
    const betData = {
      sid: section.sid,
      rname: section.nat,
      mid: matchId || market?.mid,
      market: market?.mname,
      mname: market?.mname,
      mstatus: market?.status,
      status: section.gstatus,
      gtype: market?.gtype,
      isPlay: gameInfo?.iplay,
      odd: oddsNum,
      stake: 0,
      profit: 0,
      loss: 0,
      oddType: "fancy",
      marketType: "fancyOdds",
      betType: betType,
      betName: section.nat,
      boxColor: betType === "back" ? "bg-[#B2D6F0]" : "bg-[#FAA9BA]",
      matchOddVariant: betType === "back" ? "b1" : "l1",
      matchOdd: oddsNum,
      betRate: oddsNum,
      oddCategory: betType === "back" ? "Yes" : "No",
      oddSubType: "fancy1",
      otherInfo: {},
      name: section.nat,
      sportType: "cricket",
      stakeLimit: section.max || market?.max || 10000,
      minStake: section.min || market?.min || 10,
      maxStake: section.max || market?.max || 10000,
      gameSlug: gameCode,
      gameName: gameCode,
    };

    // setBetData(betData);
    // setLatestBetData(betData);
    // setPlaceBet(true);
  };

  // Map win value to display info
  // win "1" = Team 1 (ENG), "2" = Team 2 (RSA)
  const getResultDisplay = (win: string) => {
    const winMap: {
      [key: string]: { label: string; color: string; title: string };
    } = {
      "1": { label: "E", color: "text-red-500", title: "Team 1" },
      "2": { label: "R", color: "text-yellow-500", title: "Team 2" },
      "0": { label: "T", color: "text-white", title: "Draw" },
    };

    return (
      winMap[win] || { label: win, color: "text-gray-400", title: "Unknown" }
    );
  };

  // Get game slug
  const gameSlug = gameCode?.toLowerCase() || "superover";

  // Normalize game slug for IndividualResultModal
  const normalizedGameSlug = useMemo(() => {
    if (gameCode) {
      const lowerCaseSlug = gameCode.toLowerCase();
      if (lowerCaseSlug === "superover" || lowerCaseSlug === "superover_3") {
        return "superover";
      }
      return lowerCaseSlug.replace(/[^a-z0-9]/g, "");
    }
    return "superover"; // Default fallback
  }, [gameCode]);

  return (
    <div className="flex flex-col gap-1">
      {/* Bookmaker Section */}
      {bookmakerMarket && (
        <div className="bg-[var(--border)]/20 w-full">
          <div className="bg-[var(--bg-secondary85)] flex items-center justify-between px-2">
            <h1 className="text-white text-sm px-1 font-normal leading-7">
              {bookmakerMarket.mname}
            </h1>
          </div>

          <table className="w-full">
            <thead>
              <tr>
                <td className="text-xs font-bold text-[var(--bg-primary90)] pl-2 w-1/2"></td>
                <td className="flex justify-end">
                  <div className="text-center text-sm md:text-base py-1 bg-[var(--bg-back)] font-semibold w-11 md:w-16">
                    Back
                  </div>
                </td>
                <td>
                  <div className="text-center text-sm md:text-base py-1 bg-[var(--bg-lay)] font-semibold w-11 md:w-16">
                    Lay
                  </div>
                </td>
              </tr>
            </thead>
            <tbody>
              {bookmakerMarket.section?.map((section: any, idx: number) => {
                const teamName = section.nat || `Team ${idx + 1}`;
                const isLocked = isStatusLocked(
                  section?.gstatus || bookmakerMarket?.status || "",
                  "BOOKMAKER"
                );

                // Extract odds - only back1 and lay1 for Bookmaker
                const back1 = getOddsFromSection(section, "back1");
                const lay1 = getOddsFromSection(section, "lay1");
                
                // Calculate profit/loss

                return (
                  <tr
                    key={`bookmaker-${idx}-${section.sid || idx}`}
                    className="border-b border-t border-[var(--border)] relative"
                  >
                    <td className="md:pl-2 pl-0 max-w-[80px] md:max-w-full align-top">
                      <div className="flex flex-col justify-start pt-1">
                        <div className="flex items-center gap-1">
                          <span className="truncate md:text-[12px] text-xs md:font-semibold font-normal px-2 text-wrap">
                            {teamName}
                          </span>
                          </div>
                        </div>
                    </td>
                    <td colSpan={2} className="relative p-0">
                      <div className="relative">
                        {isLocked &&
                          renderLockedOverlay(
                            section?.gstatus ||
                              bookmakerMarket?.status ||
                              "LOCKED"
                          )}
                        <div className="flex">
                          <BlinkingOddsCell
                            value={back1?.odds}
                            vol={back1?.size}
                            type="back"
                            isLocked={isLocked}
                            onClick={() =>
                              !isLocked &&
                              back1?.odds &&
                              back1.odds !== "0.0" &&
                              handleBookmakerBetClick(
                                section,
                                "back",
                                back1.odds
                              )
                            }
                          />
                          <BlinkingOddsCell
                            value={lay1?.odds}
                            vol={lay1?.size}
                            type="lay"
                            isLocked={isLocked}
                            onClick={() =>
                              !isLocked &&
                              lay1?.odds &&
                              lay1.odds !== "0.0" &&
                              handleBookmakerBetClick(section, "lay", lay1.odds)
                            }
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {/* <div className="grid md:grid-cols-2 grid-cols-1 gap-1"> */}
      {/* Fancy Section */}
      <div className="flex flex-col gap-0">
        {fancyMarkets.map((market: any, marketIdx: number) => {
          const isDesktop =
            typeof window !== "undefined" && window.innerWidth >= 768;
          const showHeader = marketIdx === 0 || (marketIdx === 1 && isDesktop);

          return (
            <div key={`fancy-market-${market.mid || marketIdx}`}>
              <div className="bg-[var(--bg-secondary85)] flex items-center justify-between px-2">
                <h1 className="text-white text-sm px-1 font-normal leading-7">
                  {market.mname}
                </h1>
              </div>
              {/* Min/Max Display */}
              {/* {(market.min || market.max) && (
        <div className="text-xs font-bold text-[var(--bg-primary90)] pl-2 py-1">
                    Min: {market.min || 100} Max: {formatMax(market.max || 10000)}
        </div>
                )} */}
              <table key={`fancy-col-${market.mid}`} className="w-full">
                {showHeader && (
                  <thead>
                    <tr className="border-[var(--border)] border-b">
                      <td className="text-xs font-bold text-[var(--bg-primary90)] pl-2 w-1/2"></td>
                      <td className="p-0 border-[var(--border)] w-full">
                        <div className="flex justify-end">
                          <div className="text-center text-sm md:text-base py-1 bg-[var(--bg-back)] font-semibold w-full">
                            Back
                          </div>
                          <div className="text-center text-sm md:text-base py-1 bg-[var(--bg-lay)] font-semibold w-full">
                            Lay
                          </div>
                        </div>
                      </td>
                    </tr>
                  </thead>
                )}

                <tbody className="border-[var(--border)]">
                  {market.section?.map((section: any, idx: number) => {
                    const isLocked = isStatusLocked(
                      section?.gstatus || market?.status || "",
                      "FANCY"
                    );

                    const back1 = getOddsFromSection(section, "back1");
                    const lay1 = getOddsFromSection(section, "lay1");
                    
                    // Calculate profit/loss

                    return (
                      <tr
                        key={`fancy-${idx}-${section.sid || idx}`}
                        className="border-[var(--border)]"
                      >
                        <td className="border-[var(--border)] border-b md:w-72 w-50 align-top">
                          <div className="flex flex-col justify-start pt-1">
                            <div className="flex items-center gap-1">
                              <span className="truncate md:w-72 w-50 md:text-[12px] md:font-semibold text-xs font-normal px-2 text-wrap">
                                {section.nat}
                              </span>
                          </div>
                        </div>
                        </td>
                        <td className="border-[var(--border)] w-full">
                          <div className="relative">
                            {isLocked &&
                              renderLockedOverlay(
                                section?.gstatus || market?.status || "LOCKED"
                              )}
                            <div className="flex justify-end">
                              <FancyOddsCell
                                value={back1?.odds}
                                vol={back1?.size}
                                type="back"
                                isLocked={isLocked}
                                onClick={() =>
                                  !isLocked &&
                                  back1?.odds &&
                                  back1.odds !== "0.0" &&
                                  handleFancyBetClick(
                                    section,
                                    market,
                                    "back",
                                    back1.odds
                                  )
                                }
                              />
                              <FancyOddsCell
                                value={lay1?.odds}
                                vol={lay1?.size}
                                type="lay"
                                isLocked={isLocked}
                                onClick={() =>
                                  !isLocked &&
                                  lay1?.odds &&
                                  lay1.odds !== "0.0" &&
                                  handleFancyBetClick(
                                    section,
                                    market,
                                    "lay",
                                    lay1.odds
                                  )
                                }
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
      {/* </div> */}

      {/* Results Section */}
      {results && results.length > 0 && (
        <div className="mt-1 flex flex-col gap-1">
          <div className="bg-[var(--bg-secondary85)] border border-gray-300 flex justify-between px-2 py-0.5 items-center">
            <h2 className="text-sm font-normal leading-8 text-white">
              Last Result
            </h2>
            <button
              onClick={() => navigate(`/casino-result?game=SUPEROVER`)}
              className="text-xs text-white hover:underline"
            >
              View All
            </button>
          </div>
          <div className="flex justify-end items-center mb-2 gap-2 mx-2 flex-wrap">
            {results.slice(0, 10).map((item: any, index: number) => {
              const resultDisplay = getResultDisplay(item.win || "");
              return (
                <div
                  key={item.mid || `result-${item.win}-${index}`}
                  className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-xs font-semibold ${resultDisplay.color} `}
                  title={`Round ID: ${item.mid || "N/A"} - ${resultDisplay.title}`}
                >
                  {resultDisplay.label}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Individual Result Details Modal */}
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const SuperOver = memoizeCasinoComponent(SuperOverComponent);
SuperOver.displayName = "SuperOver";

export default SuperOver;
