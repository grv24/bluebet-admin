import React, { useMemo, useEffect, useRef, useState, useContext } from "react";
// import { PlaceBetUseContext } from "@/context/placebet";
import { useNavigate } from "react-router-dom";

interface MiniSuperOverProps {
  casinoData: any;
  remainingTime: number;
  onBetClick?: (sid: string, type: "back" | "lay") => void;
  results?: any[];
  gameCode?: string;
  gameName?: string;
  currentBet?: any;
}

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

const isStatusLocked = (status: string, marketType: "BOOKMAKER" | "FANCY"): boolean => {
  return LOCKED_STATUSES[marketType].includes(status);
};

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
      "text-center w-1/2 cursor-pointer border-r border-[var(--border)] min-h-[40px] flex flex-col justify-center";

    if (isBlinking) {
      return `${baseClass} bg-yellow-300 shadow-lg transform scale-105 animate-pulse`;
    }

    return type === "back"
      ? `${baseClass} bg-[var(--bg-back)] hover:bg-[var(--bg-back)]/90 transition-colors duration-200`
      : `${baseClass} bg-[var(--bg-lay)] hover:bg-[var(--bg-lay)]/90 transition-colors duration-200`;
  }, [isBlinking, type]);

  return (
    <div className={backgroundClass} onClick={onClick}>
      <span className={`font-semibold text-xs leading-tight ${isBlinking ? "text-gray-900" : ""}`}>
        {value && value !== "0.0" && value !== 0 && value !== "0" ? value : "-"}
      </span>
      <span className={`text-[10px] text-gray-600 hidden lg:block ${isBlinking ? "text-gray-700" : ""}`}>
        {vol && vol !== "0.0" && vol !== 0 && vol !== "0" ? vol : "-"}
      </span>
      <span className={`text-[10px] text-gray-600 block lg:hidden ${isBlinking ? "text-gray-700" : ""}`}>
        {vol && vol !== "0.0" && vol !== 0 && vol !== "0" ? Number(vol).toFixed(0) : "-"}
      </span>
    </div>
  );
};

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
      "text-center w-full cursor-pointer border-r border-[var(--border)] min-h-[40px] flex flex-col justify-center";

    if (isBlinking) {
      return `${baseClass} bg-yellow-300 shadow-lg transform scale-105 animate-pulse`;
    }

    return type === "back"
      ? `${baseClass} bg-[var(--bg-back)]`
      : `${baseClass} bg-[var(--bg-lay)]`;
  }, [isBlinking, type]);

  return (
    <div className={backgroundClass} onClick={onClick}>
      <span className={`font-semibold text-xs leading-tight`}>
        {value && value !== "0.0" && value !== 0 && value !== "0" ? value : "-"}
      </span>
      <span className="text-[10px] text-gray-600 hidden lg:block">
        {vol && vol !== "0.0" && vol !== 0 && vol !== "0" ? vol : "-"}
      </span>
    </div>
  );
};

const renderLockedOverlay = (status: string) => (
  <div className="absolute uppercase inset-0 bg-gray-700 text-[#ff0000] font-bold text-center opacity-95 flex items-center justify-center z-10 h-full text-sm">
    {status}
  </div>
);

const getOddsFromSection = (section: any, oname: string) => {
  if (!section?.odds || !Array.isArray(section.odds)) return null;
  return section.odds.find((odd: any) => odd.oname === oname) || null;
};

const MiniSuperOverComponent: React.FC<MiniSuperOverProps> = ({
  casinoData,
  remainingTime,
  onBetClick,
  results = [],
  gameCode,
  currentBet,
}) => {
  const navigate = useNavigate();
  // const placeBetContext = useContext(PlaceBetUseContext);
  // const { setPlaceBet, setBetData, setLatestBetData } = placeBetContext || {};

  const gameInfo = useMemo(() => {
    return casinoData?.data?.t1 || casinoData?.data?.current?.t1 || {};
  }, [casinoData]);

  const markets = useMemo(() => {
    return casinoData?.data?.t2 || casinoData?.data?.current?.t2 || [];
  }, [casinoData]);

  const matchId = useMemo(() => {
    return (
      gameInfo?.gmid ||
      (casinoData?.data as any)?.current?.mid ||
      (casinoData?.data as any)?.mid ||
      gameInfo?.mid ||
      null
    );
  }, [casinoData, gameInfo]);

  const bookmakerMarket = useMemo(() => {
    return markets.find((market: any) => market.mname === "Bookmaker");
  }, [markets]);

  const fancyMarket = useMemo(() => {
    return markets.find((market: any) => market.mname === "Fancy");
  }, [markets]);

  const fancy1Market = useMemo(() => {
    return markets.find((market: any) => market.mname === "Fancy1");
  }, [markets]);

  const getBetProfitLoss = React.useCallback((sectionSid: string | number, sectionName: string, marketName: string): number => {
    if (!currentBet?.data || !matchId) return 0;

    let totalProfitLoss = 0;

    const bets = currentBet.data.filter(
      (bet: any) => String(bet.matchId) === String(matchId)
    );

    bets.forEach((bet: any) => {
      const { sid, betName: currentBetName, name, nation: betNation, oddCategory, stake, betRate, market: betMarket, mname: betMname } = bet.betData;
      const result = bet.betData?.result;

      const actualBetName = currentBetName || name || betNation;
      const betSid = sid ? String(sid) : null;
      const requestedSid = sectionSid ? String(sectionSid) : null;

      const betMarketName = betMarket || betMname || "";
      const isSameMarket = betMarketName === marketName;

      if (!isSameMarket) return;

      let isMatch = false;

      if (requestedSid && betSid && requestedSid === betSid) {
        isMatch = true;
      } else if (actualBetName && typeof actualBetName === "string") {
        const actualBetNameLower = actualBetName.toLowerCase().trim();
        const requestedNameLower = sectionName.toLowerCase().trim();

        if (actualBetNameLower === requestedNameLower) {
          isMatch = true;
        } else if (
          actualBetNameLower.includes(requestedNameLower) ||
          requestedNameLower.includes(actualBetNameLower)
        ) {
          isMatch = true;
        }
      }

      if (isMatch) {
        if (result && result.settled) {
          let profitLoss = 0;

          if (result.status === "won" || result.status === "profit") {
            profitLoss = Number(result.profitLoss) || 0;
          } else if (result.status === "lost") {
            profitLoss = Number(result.profitLoss) || 0;
          }
          totalProfitLoss += profitLoss;
        } else {
          const stakeAmount = Number(stake) || 0;
          const rate = Number(betRate) || 0;

          if (oddCategory?.toLowerCase() === "back" || oddCategory?.toLowerCase() === "yes") {
            let profit = 0;
            if (rate > 0) {
              if (rate < 1) profit = stakeAmount * rate;
              else profit = stakeAmount * (rate - 1);
            }
            totalProfitLoss += profit;
          } else if (oddCategory?.toLowerCase() === "lay" || oddCategory?.toLowerCase() === "no") {
            totalProfitLoss += stakeAmount;
          }
        }
      } else {
        if (result && result.settled && result.status === "lost") {
          totalProfitLoss += Number(result.profitLoss) || 0;
        } else {
          totalProfitLoss -= Number(stake) || 0;
        }
      }
    });

    return totalProfitLoss;
  }, [currentBet, matchId]);

  const formatMax = (max: number | string | undefined): string => {
    if (!max) return "";
    const num = Number(max);
    if (isNaN(num)) return "";
    if (num >= 100000) return `${num / 100000}L`;
    if (num >= 1000) return `${num / 1000}K`;
    return num.toString();
  };



 

  const getResultDisplay = (win: string) => {
    const winMap: any = {
      "1": { label: "I", color: "text-red-500", title: "Team 1" },
      "2": { label: "A", color: "text-yellow-500", title: "Team 2" },
    };
    return winMap[win] || { label: win, color: "text-gray-400", title: "Unknown" };
  };

  return (
    <div className="flex flex-col gap-1">

      {/* ------------------ BOOKMAKER ------------------ */}
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
                <td className="text-xs font-bold pl-2 md:w-72"></td>
                <td className="flex justify-end">
                  <div className="text-center text-sm py-1 bg-[var(--bg-back)] font-semibold w-11 md:w-16">
                    Back
                  </div>
                </td>
                <td>
                  <div className="text-center text-sm py-1 bg-[var(--bg-lay)] font-semibold w-11 md:w-16">
                    Lay
                  </div>
                </td>
              </tr>
            </thead>

            <tbody>
              {bookmakerMarket.section?.map((section: any, idx: number) => {
                const isLocked = isStatusLocked(
                  section?.gstatus || bookmakerMarket?.status || "",
                  "BOOKMAKER"
                );

                const back1 = getOddsFromSection(section, "back1");
                const lay1 = getOddsFromSection(section, "lay1");

                const profitLoss =
                  currentBet?.data &&
                  getBetProfitLoss(section.sid, section.nat, bookmakerMarket.mname);

                return (
                  <tr key={`book-${idx}`} className="border-b border-t border-[var(--border)]">
                    <td className="md:pl-2 pl-1 max-w-[80px] md:max-w-full align-top">
                      <div className="flex flex-col pt-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate md:text-[12px] text-xs px-2">
                            {section.nat}
                          </span>

                          {profitLoss !== 0 && (
                            <span
                              className={`text-[10px] font-semibold ${
                                profitLoss > 0 ? "text-green-500" : "text-red-500"
                              }`}
                            >
                              {profitLoss > 0 ? "+" : ""}
                              {profitLoss.toFixed(0)}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td colSpan={2} className="relative p-0">
                      {isLocked && renderLockedOverlay(section?.gstatus || "LOCKED")}

                      <div className="flex">
                        <BlinkingOddsCell
                          value={back1?.odds}
                          vol={back1?.size}
                          type="back"
                          onClick={() =>
                            !isLocked &&
                            back1?.odds &&
                            // handleBookmakerBetClick(section, "back", back1.odds)
                            (()=>null)
                          }
                        />

                        <BlinkingOddsCell
                          value={lay1?.odds}
                          vol={lay1?.size}
                          type="lay"
                          onClick={() =>
                            !isLocked &&
                            lay1?.odds &&
                            // handleBookmakerBetClick(section, "lay", lay1.odds)
                          (()=>null)
                          }
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ------------------ FANCY + FANCY1 + TIE ------------------ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1">

        {/* -------- Fancy1 (Except Tie) -------- */}
        {fancy1Market && (
          <div>
            <div className="bg-[var(--bg-secondary85)] px-2">
              <h1 className="text-white text-sm px-1 leading-7">Fancy1</h1>
            </div>

            <table className="w-full">
              <thead>
                <tr className="border-[var(--border)] border-b">
                  <td className="text-xs font-bold pl-2 md:w-72 w-50"></td>
                  <td className="p-0 border-[var(--border)] w-full">
                    <div className="flex justify-end">
                      <div className="text-center text-sm py-1 bg-[var(--bg-back)] font-semibold w-full">
                        Back
                      </div>
                      <div className="text-center text-sm py-1 bg-[var(--bg-lay)] font-semibold w-full">
                        Lay
                      </div>
                    </div>
                  </td>
                </tr>
              </thead>

              <tbody>
                {fancy1Market.section
                  ?.filter((s: any) => s.nat !== "Tie")
                  .map((section: any, idx: number) => {
                    const isLocked = isStatusLocked(
                      section?.gstatus || fancy1Market?.status || "",
                      "FANCY"
                    );

                    const back1 = getOddsFromSection(section, "back1");
                    const lay1 = getOddsFromSection(section, "lay1");

                    const profitLoss =
                      currentBet?.data &&
                      getBetProfitLoss(section.sid, section.nat, fancy1Market.mname);

                    return (
                      <tr key={`f1-${idx}`} className="border-b border-[var(--border)]">
                        <td className="pl-2 align-top">
                          <div className="flex flex-col pt-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-xs md:text-[12px] px-2">
                                {section.nat}
                              </span>

                              {profitLoss !== 0 && (
                                <span
                                  className={`text-[10px] font-semibold ${
                                    profitLoss > 0 ? "text-green-500" : "text-red-500"
                                  }`}
                                >
                                  {profitLoss > 0 ? "+" : ""}
                                  {profitLoss.toFixed(0)}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="relative p-0">
                          {isLocked && renderLockedOverlay(section?.gstatus || "LOCKED")}

                          <div className="flex justify-end">
                            <FancyOddsCell
                              value={back1?.odds}
                              vol={back1?.size}
                              type="back"
                              onClick={() =>
                                !isLocked &&
                                back1?.odds &&
                                // handleFancyBetClick(section, fancy1Market, "back", back1.odds)
                                (()=>null)
                              }
                            />

                            <FancyOddsCell
                              value={lay1?.odds}
                              vol={lay1?.size}
                              type="lay"
                              onClick={() =>
                                !isLocked &&
                                lay1?.odds &&
                                // handleFancyBetClick(section, fancy1Market, "lay", lay1.odds)
                                (()=>null)
                              }
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}

        {/* -------- Fancy -------- */}
        {fancyMarket && (
          <div>
            <div className="bg-[var(--bg-secondary85)] px-2">
              <h1 className="text-white text-sm px-1 leading-7">{fancyMarket.mname}</h1>
            </div>

            <table className="w-full">
              <thead>
                <tr className="border-[var(--border)] border-b">
                  <td className="text-xs font-bold pl-2 w-50"></td>

                  <td className="p-0 border-[var(--border)] w-full">
                    <div className="flex justify-end">
                      <div className="text-center text-sm py-1 bg-[var(--bg-lay)] w-full font-semibold">
                        No
                      </div>
                      <div className="text-center text-sm py-1 bg-[var(--bg-back)] w-full font-semibold">
                        Yes
                      </div>
                    </div>
                  </td>
                </tr>
              </thead>

              <tbody>
                {fancyMarket.section?.map((section: any, idx: number) => {
                  const isLocked = isStatusLocked(
                    section?.gstatus || fancyMarket?.status || "",
                    "FANCY"
                  );

                  const back1 = getOddsFromSection(section, "back1");
                  const lay1 = getOddsFromSection(section, "lay1");

                  const profitLoss =
                    currentBet?.data &&
                    getBetProfitLoss(section.sid, section.nat, fancyMarket.mname);

                  return (
                    <tr key={`fm-${idx}`} className="border-b border-[var(--border)]">
                      <td className="pl-2 align-top">
                        <div className="flex flex-col pt-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-xs md:text-[12px] px-2">
                              {section.nat}
                            </span>

                            {profitLoss !== 0 && (
                              <span
                                className={`text-[10px] font-semibold ${
                                  profitLoss > 0 ? "text-green-500" : "text-red-500"
                                }`}
                              >
                                {profitLoss > 0 ? "+" : ""}
                                {profitLoss.toFixed(0)}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="relative p-0">
                        {isLocked && renderLockedOverlay(section?.gstatus || "LOCKED")}

                        <div className="flex justify-end">
                          <FancyOddsCell
                            value={lay1?.odds}
                            vol={lay1?.size}
                            type="lay"
                            onClick={() =>
                              !isLocked &&
                              lay1?.odds &&
                              // handleFancyBetClick(section, fancyMarket, "lay", lay1.odds)
                              (()=>null)
                            }
                          />

                          <FancyOddsCell
                            value={back1?.odds}
                            vol={back1?.size}
                            type="back"
                            onClick={() =>
                              !isLocked &&
                              back1?.odds &&
                              // handleFancyBetClick(section, fancyMarket, "back", back1.odds)
                              (()=>null)
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* -------- Tie (Fancy1 Only) -------- */}
        {fancy1Market && (
          <div>
            <div className="bg-[var(--bg-secondary85)] px-2">
              <h1 className="text-white text-sm px-1 leading-7">Tie</h1>
            </div>

            <table className="w-full">
              <thead>
                <tr className="border-[var(--border)] border-b">
                  <td className="text-xs font-bold pl-2 w-50"></td>

                  <td className="p-0 border-[var(--border)] w-full">
                    <div className="flex justify-end">
                      <div className="text-center text-sm py-1 bg-[var(--bg-back)] w-full font-semibold">
                        Back
                      </div>
                      <div className="text-center text-sm py-1 bg-[var(--bg-lay)] w-full font-semibold">
                        Lay
                      </div>
                    </div>
                  </td>
                </tr>
              </thead>

              <tbody>
                {fancy1Market.section
                  ?.filter((s: any) => s.nat === "Tie")
                  .map((section: any, idx: number) => {
                    const isLocked = isStatusLocked(
                      section?.gstatus || fancy1Market?.status || "",
                      "FANCY"
                    );

                    const back1 = getOddsFromSection(section, "back1");
                    const lay1 = getOddsFromSection(section, "lay1");

                    const profitLoss =
                      currentBet?.data &&
                      getBetProfitLoss(section.sid, section.nat, fancy1Market.mname);

                    return (
                      <tr key={`tie-${idx}`} className="border-b border-[var(--border)]">
                        <td className="pl-2 align-top">
                          <div className="flex flex-col pt-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-xs md:text-[12px] px-2">
                                {section.nat}
                              </span>

                              {profitLoss !== 0 && (
                                <span
                                  className={`text-[10px] font-semibold ${
                                    profitLoss > 0 ? "text-green-500" : "text-red-500"
                                  }`}
                                >
                                  {profitLoss > 0 ? "+" : ""}
                                  {profitLoss.toFixed(0)}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="relative p-0">
                          {isLocked && renderLockedOverlay(section?.gstatus || "LOCKED")}

                          <div className="flex justify-end">
                            <FancyOddsCell
                              value={back1?.odds}
                              vol={back1?.size}
                              type="back"
                              onClick={() =>
                                !isLocked &&
                                back1?.odds &&
                                // handleFancyBetClick(section, fancy1Market, "back", back1.odds)
                                (()=>null)
                              }
                            />

                            <FancyOddsCell
                              value={lay1?.odds}
                              vol={lay1?.size}
                              type="lay"
                              onClick={() =>
                                !isLocked &&
                                lay1?.odds &&
                                // handleFancyBetClick(section, fancy1Market, "lay", lay1.odds)
                                (()=>null)
                              }
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ------------------ LAST 10 RESULTS (NO MODAL) ------------------ */}
      {results && results.length > 0 && (
        <div className="mt-1 flex flex-col gap-1">
          <div className="bg-[var(--bg-secondary85)] border border-gray-300 flex justify-between px-2 py-1 items-center">
            <h2 className="text-sm font-normal text-white">Last Result</h2>

            <button
              onClick={() => navigate(`/casino-result?game=SUPEROVER_3`)}
              className="text-xs text-white hover:underline"
            >
              View All
            </button>
          </div>

          <div className="flex justify-end items-center mb-2 gap-2 mx-2 flex-wrap">
            {results.slice(0, 10).map((item: any, index: number) => {
              const data = getResultDisplay(item.win);
              return (
                <div
                  key={index}
                  className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-xs font-semibold ${data.color}`}
                  title={`Round: ${item.mid ?? "N/A"}`}
                >
                  {data.label}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ⛔ REMOVED — IndividualResultModal */}
    </div>
  );
};

const MiniSuperOver = React.memo(
  MiniSuperOverComponent,
  (prevProps, nextProps) => {
    if (
      prevProps.remainingTime !== nextProps.remainingTime ||
      prevProps.gameCode !== nextProps.gameCode ||
      prevProps.gameName !== nextProps.gameName ||
      prevProps.onBetClick !== nextProps.onBetClick
    ) {
      return false;
    }

    if (prevProps.casinoData !== nextProps.casinoData) {
      const prevData = JSON.stringify(prevProps.casinoData);
      const nextData = JSON.stringify(nextProps.casinoData);
      if (prevData !== nextData) return false;
    }

    if (prevProps.results !== nextProps.results) {
      const prevResults = JSON.stringify(prevProps.results);
      const nextResults = JSON.stringify(nextProps.results);
      if (prevResults !== nextResults) return false;
    }

    if (prevProps.currentBet !== nextProps.currentBet) {
      const prevBet = JSON.stringify(prevProps.currentBet);
      const nextBet = JSON.stringify(nextProps.currentBet);
      if (prevBet !== nextBet) return false;
    }

    return true;
  }
);

MiniSuperOver.displayName = "MiniSuperOver";
export default MiniSuperOver;
