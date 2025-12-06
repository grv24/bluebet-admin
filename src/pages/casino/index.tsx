import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import Bet from "./Bet";
import Rules from "./Rules";
import Timer from "./Timer";
import { useLocation } from "react-router-dom";
import {
  CasinoGame,
  getCasinoGameOdds,
  getCasinoTopTenResult,
} from "@/helper/casino";
import { useSocketContext } from "@/context/SocketContext";
import { useCookies } from "react-cookie";

import {
  Teen20,
  Teen20b,
  TeenPattiOneDay,
  Teenpatti8,
  Teenpatti9,
  TeenMuf,
  // Teenpatti2card,
  Teenpatti2O,
  QueenTop,
  JackTop,
  Instant,
  // Instant2O,
  // Instant3O,
} from "./teen-patti";
import {
  DrgonTiger20,
  OneDayDragonTiger,
  DragonTiger202,
  DragonTigerLion20,
} from "./dragon-tiger";
import {
  Onecard2020,
  Onecard1day,
  Duskadum,
  // KBC,
  Trio,
  Notenumber,
} from "./other";
// import RulesComponent from "../casino/Rules";
import { Poker6Player, Poker20, PokerOneDay } from "./poker";
import { Lucky7, Lucky715, Lucky7b, Lucky7c } from "./lucky7";

import {
  AndarBahar,
  AndarBahar2,
  AndarBahar50,
  AndarBahar150,
} from "./andar-bahar";
import { ThirtyTwoCardA, ThirtyTwoCardB } from "./32card";
import { Baccarat2, Baccarat, Baccarat29 } from "./baccarat";
import {
  Bollywoodtable,
  Amarakbaranthony,
  Amarakbaranthony2O,
} from "./bollywood";

import {
  Goal,
  FivefiveCricket,
  SuperOver,
  MiniSuperOver,
  // CasinoMeter1,
} from "./sport";

import {  CasinoWar } from "./casino";

import { Race17, Race20, Race2 } from "./race";

// import { UniqueRoulette } from "./roulette";
// import { Lottery } from "./lottery";

import { InstantWorli } from "./worli";

type GameCode =
  //teen patti variants
  | "TEEN"
  | "TEEN_20"
  | "TEEN_9"
  | "TEEN_20_B"
  | "TEEN_MUF"
  | "TEEN_8"
  | "PATTI_2"
  | "TEEN_6"
  | "TEEN_41"
  | "TEEN_42"
  | "TEEN_33"
  | "TEEN_32"
  | "TEEN_3"

  //Dragon Tiger variants
  | "DRAGON_TIGER_20"
  | "DRAGON_TIGER_LION_20"
  | "DRAGON_TIGER_20_2"
  | "DRAGON_TIGER_6"

  //Poker variants
  | "POKER_9"
  | "POKER_20"
  | "POKER_1_DAY"
  | "POKER_6"

  //lucky7 variants
  | "LUCKY7EU_2"
  | "LUCKY7EU"
  | "LUCKY7"
  | "LUCKY15"
  | "LUCKY5"
  | "LUCKY6"

  //andar bahar variants
  | "ABJ"
  | "AB_20"
  | "AB_3"
  | "AB_4"

  //card32 variants
  | "CARD32EU"
  | "CARD_32"

  //baccarat variants
  | "BACCARAT"
  | "BACCARAT2"
  | "TEENS_IN"

  //bollywood variants
  | "BOLLYWOOD_TABLE"
  | "AAA"
  | "AAA_2"

  //casino variants
  | "CASINO_QUEEN"
  | "CASINO_WAR"

  //other games
  | "B_TABLE_2"
  | "LOTTCARD"
  | "POISON20"
  | "JOKER20"
  | "JOKER1"
  | "GOAL"
  | "DUM_10"
  | "KBC"
  | "TRIO"
  | "NOTE_NUM"

  //roulette variants
  | "OUR_ROULETTE"

  //lottery variants
  | "LOT_CARD"

  //sport variants
  | "CRICKET_V3"
  | "SUPEROVER"
  | "SUPEROVER_3"
  | "CASINO_METER_1"
  // Race
  | "RACE_17"
  | "RACE20"
  | "RACE_2"
  //worli variants
  | "WORLI2"
  //other games
  | "TEEN_120"
  | "TEEN_1";

// ===== GAME COMPONENT MAPPING =====

/**
 * Game Component Registry
 * Maps game codes to their corresponding React components
 * Each component receives casino data, timing info, bet handlers, and results
 */
const GAME_COMPONENTS: Partial<Record<GameCode, React.ComponentType<any>>> = {
  //teen patti variants
  TEEN: TeenPattiOneDay,
  TEEN_8: Teenpatti8,
  TEEN_9: Teenpatti9,
  TEEN_20: Teen20,
  TEEN_20_B: Teen20b,
  TEEN_MUF: TeenMuf,
  // PATTI_2: Teenpatti2card,
  TEEN_6: Teenpatti2O,
  TEEN_41: QueenTop,
  TEEN_42: JackTop,
  TEEN_3: Instant,
  // TEEN_32: Instant2O,
  // TEEN_33: Instant3O,
  //dragon tiger variants
  DRAGON_TIGER_20: DrgonTiger20,
  DRAGON_TIGER_6: OneDayDragonTiger,
  DRAGON_TIGER_20_2: DragonTiger202,
  DRAGON_TIGER_LION_20: DragonTigerLion20,
  //poker variants
  POKER_9: Poker6Player,
  POKER_20: Poker20,
  POKER_1_DAY: PokerOneDay,
  //lucky7 variants
  LUCKY7: Lucky7,
  LUCKY7EU: Lucky7b,
  LUCKY7EU_2: Lucky7c,
  LUCKY15: Lucky715,
  //andar bahar variants
  ABJ: AndarBahar2,
  AB_20: AndarBahar,
  AB_3: AndarBahar50,
  AB_4: AndarBahar150,
  //32 card variants
  CARD_32: ThirtyTwoCardA,
  CARD32EU: ThirtyTwoCardB,
  //baccarat variants
  BACCARAT2: Baccarat2,
  BACCARAT: Baccarat,
  TEENS_IN: Baccarat29,
  //bollywood variants
  BOLLYWOOD_TABLE: Bollywoodtable,
  AAA: Amarakbaranthony,
  AAA_2: Amarakbaranthony2O,
  //sport variants
  GOAL: Goal,
  CRICKET_V3: FivefiveCricket,
  SUPEROVER: SuperOver,
  SUPEROVER_3: MiniSuperOver,
  // CASINO_METER_1: CasinoMeter1,
  // casino variants
  // CASINO_QUEEN: CasinoQueen,
  CASINO_WAR: CasinoWar,
  // race variants
  RACE_17: Race17,
  RACE20: Race20,
  RACE_2: Race2,
  //roulette variants
  // OUR_ROULETTE: UniqueRoulette,
  //lottery variants
  // LOT_CARD: Lottery,
  //worli variants
  WORLI2: InstantWorli,
  //other games
  TEEN_120: Onecard2020,
  TEEN_1: Onecard1day,
  DUM_10: Duskadum,
  // KBC: KBC,
  TRIO: Trio,
  NOTE_NUM: Notenumber,
};

const Casino: React.FC = () => {
  const location = useLocation();
  const game = (location.state as { game: CasinoGame } | undefined)?.game;
  const [cookies] = useCookies(["Admin", "TechAdmin", "token"]);
  const [odds, setOdds] = useState<any>(null);
  const [topResults, setTopResults] = useState<any>(null);
  const [oddsError, setOddsError] = useState<string | null>(null);
  const [resultsError, setResultsError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [streamError, setStreamError] = useState(false);
  const [streamLoading, setStreamLoading] = useState(true);
  const {
    isConnected,
    joinCasinoRoom,
    leaveCasinoRoom,
    subscribeToCasinoUpdates,
    unsubscribeFromCasinoUpdates,
  } = useSocketContext();

  // Component initialization log (only once)
  useEffect(() => {
    console.log("🎰 Casino component initialized:", {
      hasGame: !!game,
      gameCode: game?.casinoGameCode,
      gameName: game?.casinoGameName,
      isConnected,
      mode: isConnected
        ? "Real-time (Socket)"
        : "API-only (Socket unavailable)",
    });
  }, []); // Only log once on mount

  // Get stream URL from game
  const streamUrl = useMemo(() => {
    return game?.casinoGameTvLink || null;
  }, [game?.casinoGameTvLink]);

  // Fetch odds and top ten results for the current game
  useEffect(() => {
    if (!game?.casinoGameCode) return;

    const fetchData = async () => {
      try {
        const oddsRes = (await getCasinoGameOdds(
          game.casinoGameCode,
          cookies
        )) as any;
        setOdds(oddsRes);
        console.log(
          "🎰 Casino odds (TEEN_3):",
          JSON.stringify(oddsRes, null, 2)
        );
        setOddsError(null);

        // Extract countdown time from odds data
        const countdownTime =
          oddsRes?.data?.lt ||
          oddsRes?.data?.data?.lt ||
          oddsRes?.data?.data?.data?.lt ||
          0;
        if (
          countdownTime &&
          typeof countdownTime === "number" &&
          countdownTime > 0
        ) {
          setCountdown(countdownTime);
          console.log("🎰 Countdown time extracted:", countdownTime, "seconds");
        }
      } catch (error) {
        console.error("Failed to fetch casino odds:", error);
        setOddsError((error as any)?.message || "Failed to fetch odds");
      }

      try {
        const resultsRes = (await getCasinoTopTenResult(
          game.casinoGameCode,
          cookies
        )) as any;
        setTopResults(resultsRes);
        console.log(
          "🏁 Casino top ten results (TEEN_3):",
          JSON.stringify(resultsRes, null, 2)
        );
        setResultsError(null);
      } catch (error) {
        console.error("Failed to fetch casino top ten results:", error);
        setResultsError(
          (error as any)?.message || "Failed to fetch top results"
        );
      }
    };

    fetchData();
  }, [game?.casinoGameCode, cookies]);

  // Socket reconnection handler - ensures subscription when socket connects
  useEffect(() => {
    if (isConnected && game?.casinoGameCode) {
      const gameSlug = game.casinoGameCode.toLowerCase();

      // Join room when socket connects
      if (typeof joinCasinoRoom === "function") {
        joinCasinoRoom(gameSlug);
      }
    }
  }, [isConnected, game?.casinoGameCode, joinCasinoRoom]);

  // Track subscription to prevent duplicate subscriptions
  const subscriptionRef = useRef<{
    gameCode: string | null;
    subscribed: boolean;
  }>({ gameCode: null, subscribed: false });

  // Socket update handler - defined outside useEffect to prevent recreation
  const handleCasinoUpdate = useCallback(
    (socketData: any) => {
      if (!game?.casinoGameCode) {
        console.log("🎰 handleCasinoUpdate: No game code available");
        return;
      }

      const gameSlug = game.casinoGameCode.toLowerCase();
      const currentGameCode = game.casinoGameCode.toUpperCase();
      try {
        console.log(`🎰 Real-time socket data for ${gameSlug}:`, socketData);

        // Extract casino type and data from different possible structures
        let casinoType =
          socketData.casinoType || socketData.type || socketData.gameType;
        const data = socketData.data || socketData;

        // Handle nested casinoType in data
        if (data && data.casinoType && !data.current && !data.t1 && !data.t2) {
          casinoType = data.casinoType;
        }

        // Check if this update is for the current game
        const socketGameType = casinoType?.toUpperCase() || casinoType;

        console.log("🎰 Comparing game types:", {
          currentGameCode,
          socketGameType,
          originalCasinoType: casinoType,
          matches: currentGameCode === socketGameType,
        });

        // Update state only if the data is for the current game
        if (currentGameCode === socketGameType && data) {
          console.log(
            "🎰 Processing casino socket update for:",
            currentGameCode
          );

          // Normalize data structure
          let casinoDataToSet: any;

          if (data.current) {
            // Format: { current: {...}, results: [...] }
            const currentData = data.current.data || data.current;

            casinoDataToSet = {
              status: "success",
              data: {
                mid: currentData.mid,
                lt: currentData.lt,
                ft: currentData.ft,
                card: currentData.card,
                gtype: currentData.gtype,
                grp: currentData.grp,
                remark: currentData.remark,
                sub: currentData.sub,
                ...currentData,
                data: {
                  data: {
                    t1:
                      currentData.t1 ||
                      (currentData.card ? [currentData.card] : undefined),
                    t2: currentData.t2 || currentData.sub || currentData.odds,
                    t3: currentData.t3,
                    sub: currentData.sub,
                    status: currentData.status,
                    lt: currentData.lt,
                    card: currentData.card,
                    mid: currentData.mid,
                    ft: currentData.ft,
                  },
                },
              },
            };
          } else if (data.sub || data.odds || data.t2 || data.t1) {
            // Direct format with sub/odds/t2/t1
            casinoDataToSet = {
              status: "success",
              data: {
                ...data,
                data: {
                  data: {
                    t1: data.t1 || (data.card ? [data.card] : undefined),
                    t2: data.t2 || data.sub || data.odds,
                    t3: data.t3,
                    sub: data.sub,
                    status: data.status,
                    lt: data.lt,
                    card: data.card,
                  },
                },
              },
            };
          } else {
            // Fallback: treat as direct casino data
            casinoDataToSet = {
              status: "success",
              data: data,
            };
          }

          // Update odds from socket (socket data takes priority)
          const hasValidData =
            data.current ||
            (data.current && (data.current.data?.sub || data.current.sub)) ||
            data.sub ||
            data.odds ||
            data.t2 ||
            data.t1;

          if (hasValidData) {
            console.log("🎰 Updating odds from socket");
            setOdds(casinoDataToSet);
            setOddsError(null);

            // Extract and update countdown from socket data
            const socketCountdown =
              data.current?.lt ||
              data.current?.data?.lt ||
              data.lt ||
              casinoDataToSet?.data?.lt ||
              0;

            if (
              socketCountdown &&
              typeof socketCountdown === "number" &&
              socketCountdown > 0
            ) {
              console.log(
                "🎰 Updating countdown from socket:",
                socketCountdown,
                "seconds"
              );
              setCountdown(socketCountdown);
            }
          }

          // Update results from socket if available
          if (
            data.results &&
            Array.isArray(data.results) &&
            data.results.length > 0
          ) {
            console.log(
              "🎰 Updating results from socket:",
              data.results.length,
              "results"
            );
            setTopResults({
              status: "success",
              data: {
                results: data.results,
              },
            });
            setResultsError(null);
          }
        } else {
          console.log("🎰 Socket data mismatch - ignoring update:", {
            currentGameCode,
            socketGameType,
            matches: currentGameCode === socketGameType,
          });
        }
      } catch (error) {
        console.error("🎰 Error processing casino socket update:", error);
      }
    },
    [game?.casinoGameCode]
  );

  // Socket handler for real-time casino updates
  useEffect(() => {
    if (!isConnected || !game?.casinoGameCode) {
      // Silently skip subscription if socket is not connected - component works with API only
      subscriptionRef.current = { gameCode: null, subscribed: false };
      return;
    }

    const gameSlug = game.casinoGameCode.toLowerCase();
    const currentGameCode = game.casinoGameCode.toUpperCase();

    // Check if we need to subscribe (new gameCode or socket just connected)
    const needsSubscription =
      !subscriptionRef.current.subscribed ||
      subscriptionRef.current.gameCode !== currentGameCode;

    if (needsSubscription) {
      // Subscribe to casino updates FIRST (before joining room)
      subscribeToCasinoUpdates(gameSlug, handleCasinoUpdate);
      subscriptionRef.current = { gameCode: currentGameCode, subscribed: true };

      // Join casino room for real-time updates
      if (typeof joinCasinoRoom === "function") {
        joinCasinoRoom(gameSlug);
      }
    }

    return () => {
      subscriptionRef.current = { gameCode: null, subscribed: false };

      if (typeof unsubscribeFromCasinoUpdates === "function") {
        unsubscribeFromCasinoUpdates(gameSlug);
      }

      if (typeof leaveCasinoRoom === "function") {
        leaveCasinoRoom(gameSlug);
      }
    };
  }, [
    isConnected,
    game?.casinoGameCode,
    joinCasinoRoom,
    leaveCasinoRoom,
    subscribeToCasinoUpdates,
    unsubscribeFromCasinoUpdates,
    handleCasinoUpdate,
  ]);

  // Extract round ID from odds data (updates from both API and socket)
  const roundId = useMemo(() => {
    const oddsData = odds as any;
    return (
      oddsData?.data?.mid ||
      oddsData?.data?.roundId ||
      oddsData?.data?.round_id ||
      oddsData?.data?.round?.id ||
      oddsData?.data?.data?.mid ||
      oddsData?.data?.data?.data?.mid ||
      "—"
    );
  }, [odds]);

  // Calculate end time for timer (current time + countdown seconds)
  const endTime = useMemo(() => {
    if (countdown > 0) {
      return Date.now() + countdown * 1000;
    }
    return 0;
  }, [countdown]);

  const oddsItems = useMemo(() => {
    const oddsData = odds as any;
    return Array.isArray(oddsData?.data)
      ? oddsData.data
      : Array.isArray(oddsData?.data?.odds)
        ? oddsData.data.odds
        : Array.isArray(oddsData?.data?.sub)
          ? oddsData.data.sub
          : [];
  }, [odds]);

  const resultsItems = useMemo(() => {
    const resultsData = topResults as any;
    return Array.isArray(resultsData?.data)
      ? resultsData.data
      : Array.isArray(resultsData?.data?.results)
        ? resultsData.data.results
        : Array.isArray(resultsData?.results)
          ? resultsData.results
          : [];
  }, [topResults]);

  // Then check if it's a supported game type
  const GameComponent = GAME_COMPONENTS[game?.casinoGameCode as GameCode];

  return (
    <div className="p-2 bg-[#fafafa] min-h-screen">
      <div className="grid grid-cols-8 gap-3">
        {/* Left Side */}
        <div className="col-span-5 min-h-40">
          {/* top bar */}
          <div className="bg-[var(--bg-secondary)]  py-1 px-3 rounded-t  flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-xs tracking-tighter leading-6 uppercase text-white">
                {game?.casinoGameName}
              </h2>
            </div>
            <h2 className="text-xs tracking-tighter leading-6 text-white">
              Round ID: <span className="text-white">{roundId}</span>
            </h2>
          </div>
          {/* game tv */}
          <div className="min-h-80 lg:h-[36vh] bg-black relative md:h-[20vh] h-[31vh] flex justify-center items-start ">
            <div className=" w-full h-full flex justify-start items-start md:static absolute top-0 left-0 z-50">
              {/* ===========Left Side=========== */}
              <div className="md:w-3/12">
                {/* {gameCode && (
                  <CardDisplay
                    gameCode={gameCode as GameCode}
                    casinoData={casinoData as CasinoDataResponse}
                  />
                )} */}
              </div>

              {/* ===== RIGHT SIDE - LIVE STREAM ===== */}
              <div className="md:w-9/12 w-full h-full  relative">
                <div className="w-full h-full flex items-center justify-center ">
                  {streamUrl && !streamError ? (
                    <iframe
                      src={streamUrl}
                      className="w-full h-full"
                      frameBorder="0"
                      allowFullScreen
                      title="Live Casino Stream"
                      onLoad={() => {
                        console.log(
                          "🎰 Stream loaded successfully:",
                          streamUrl
                        );
                        setStreamLoading(false);
                        setStreamError(false);
                      }}
                      onError={() => {
                        console.error("🎰 Stream failed to load:", streamUrl);
                        setStreamError(true);
                        setStreamLoading(false);
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <svg
                        className="w-16 h-16 mb-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                      </svg>
                      <p className="text-sm text-gray-400">
                        {streamLoading
                          ? "Loading stream..."
                          : "Live stream unavailable"}
                      </p>
                      {!streamUrl && (
                        <p className="text-xs text-gray-500 mt-1">
                          No stream URL configured for this game
                        </p>
                      )}
                      {streamError && streamUrl && (
                        <button
                          onClick={() => {
                            setStreamError(false);
                            setStreamLoading(true);
                          }}
                          className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                        >
                          Retry Connection
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* ===== COUNTDOWN TIMER ===== */}
                {endTime > 0 && (
                  <div className="absolute bottom-4 right-4 z-50">
                    <Timer
                      key={`timer-teen3-${countdown}-${roundId}`}
                      time={endTime}
                      isRunning={true}
                      isComplete={false}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Odds & Results panels */}
          <div className="mt-3 space-y-3">
            {GameComponent && (
              <GameComponent
                casinoData={odds as any}
                remainingTime={countdown}
                results={resultsItems as any}
                gameCode={game?.casinoGameCode}
                gameName={game?.casinoGameName}
                currentBet={[] as any}
              />
            )}
          </div>
        </div>
        {/* Right Side */}
        <div className="col-span-3  min-h-40">
          <div className="flex flex-col gap-2">
            <Bet />
            <Rules />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Casino;
