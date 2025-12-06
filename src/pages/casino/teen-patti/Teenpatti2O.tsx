/** --------------- FULLY FIXED TEEN 2O WITH WORKING SUITS ---------------- */
const PlayerPanel = ({
  title,
  sid,
  market,
  under,
  over,
  onBetClick,
  isRowLocked,
  fmt,
}: any) => {
  return (
    <div className="flex flex-col gap-1.5">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border w-[59%] border-gray-300 px-2 py-1 text-left text-xs bg-gray-100">
              {title}
            </th>
            <th className="border border-gray-300 px-2 py-1 text-center text-sm bg-[var(--bg-back)]">
              BACK
            </th>
            <th className="border border-gray-300 px-2 py-1 text-center text-sm bg-[var(--bg-lay)]">
              LAY
            </th>
          </tr>
        </thead>

        <tbody>
          <tr className="hover:bg-gray-50">
            <td className="border px-2 py-2 border-gray-300 text-sm font-semibold">
              Main
            </td>

            {/* BACK */}
            <td
              className="border px-2 py-2 border-gray-300 text-center cursor-pointer bg-[var(--bg-back)] relative"
              onClick={() =>
                !isRowLocked(market) && onBetClick(String(sid), "back")
              }
            >
              {isRowLocked(market) && <LockOverlay />}
              <span>{fmt(market?.b)}</span>
            </td>

            {/* LAY */}
            <td
              className="border px-2 py-2 border-gray-300 text-center cursor-pointer bg-[var(--bg-lay)] relative"
              onClick={() =>
                !isRowLocked(market) && onBetClick(String(sid), "lay")
              }
            >
              {isRowLocked(market) && <LockOverlay />}
              <span>{fmt(market?.l)}</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* UNDER / OVER */}
      <div className="grid grid-cols-2 gap-1.5">
        {/* Under */}
        <table className="w-full border-collapse">
          <tbody>
            <tr className="hover:bg-gray-50">
              <td className="border px-2 py-2 border-gray-300 text-sm font-semibold">
                Under
              </td>
              <td
                className="border px-2 py-2 border-gray-300 text-center cursor-pointer bg-[var(--bg-back)] relative"
                onClick={() =>
                  !isRowLocked(under) &&
                  onBetClick(String(Number(sid) + 8), "back")
                }
              >
                {isRowLocked(under) && <LockOverlay />}
                <span>{fmt(under?.b)}</span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Over */}
        <table className="w-full border-collapse">
          <tbody>
            <tr className="hover:bg-gray-50">
              <td className="border px-2 py-2 border-gray-300 text-sm font-semibold">
                Over
              </td>

              <td
                className="border px-2 py-2 border-gray-300 text-center cursor-pointer bg-[var(--bg-back)] relative"
                onClick={() =>
                  !isRowLocked(over) &&
                  onBetClick(String(Number(sid) + 9), "back")
                }
              >
                {isRowLocked(over) && <LockOverlay />}
                <span>{fmt(over?.b)}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SuitBox = ({
  label,
  img,
  nestedOdd,
  parentSid,
  parentNat,
  disabled,
  fmt,
  onBetClick,
}: any) => {
  return (
    <div
      className="flex justify-between w-full p-2 bg-[var(--bg-back)] items-center cursor-pointer relative"
      onClick={() => {
        if (!disabled && nestedOdd) {
          onBetClick(String(parentSid), "back", {
            outcome: label,
            displayName: `${parentNat} ${label}`,
            rate: nestedOdd.b,
            parentNat: parentNat,
            cardNat: label, // Use the suit label (e.g., "Spade", "Heart") instead of nestedOdd.nat
            nestedSid: nestedOdd.sid,
            nat: nestedOdd.nat,
          });
        }
      }}
    >
      {disabled && <LockOverlay />}
      <img src={img} className="w-4" alt={label} />
      <span className="text-sm font-semibold">{fmt(nestedOdd?.b)}</span>
    </div>
  );
};

const OddEvenBox = ({
  label,
  nestedOdd,
  parentSid,
  parentNat,
  disabled,
  fmt,
  onBetClick,
}: any) => {
  return (
    <div
      className="flex justify-between w-full p-2 bg-[var(--bg-back)] items-center cursor-pointer relative"
      onClick={() => {
        if (!disabled && nestedOdd) {
          onBetClick(String(parentSid), "back", {
            outcome: label,
            displayName: `${parentNat} ${label}`,
            rate: nestedOdd.b,
            parentNat: parentNat,
            cardNat: nestedOdd.nat, // Use the specific odd/even nat (e.g., "Odd", "Even")
            nestedSid: nestedOdd.sid,
            nat: nestedOdd.nat,
          });
        }
      }}
    >
      {disabled && <LockOverlay />}
      <span className="text-sm font-semibold">{label}</span>
      <span className="text-sm font-semibold">{fmt(nestedOdd?.b)}</span>
    </div>
  );
};

const ResultSection = ({ results, onClick, navigate }: any) => {
  const shown = Array.isArray(results) ? results.slice(0, 10) : [];

  return (
    <div className="mt-1 flex flex-col gap-1">
      <div className="bg-[var(--bg-secondary85)] border border-gray-300 flex justify-between px-2 py-.5 items-center">
        <h2 className="text-sm font-normal leading-8 text-white">
          Last Result
        </h2>
        <h2
          onClick={() => navigate(`/casino-result?game=TEEN_6`)}
          className="text-sm font-normal leading-8 text-white cursor-pointer hover:underline"
        >
          View All
        </h2>
      </div>

      <div className="flex justify-end items-center mb-2 gap-2 mx-2">
        {shown.length > 0 ? (
          shown.map((item: any, idx: number) => {
            const isA = item.win === "1" || item.win === "A";
            return (
              <div
                key={item.mid ?? idx}
                className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-sm font-semibold ${
                  isA ? "text-red-500" : "text-yellow-500"
                } cursor-pointer hover:scale-110 transition-transform`}
                onClick={() => onClick(item)}
              >
                {isA ? "A" : "B"}
              </div>
            );
          })
        ) : (
          <div className="text-gray-400 text-sm py-2">No results available</div>
        )}
      </div>
    </div>
  );
};

const LockOverlay = () => (
  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
    <RiLockFill className="text-white text-xl" />
  </div>
);

import React, { useMemo, useState } from "react";
import { RiLockFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
// import IndividualResultModal from "@/components/casino/IndividualResultModal";

import CCImage from "../../../assets/card/shapes/CC.webp";
import SSImage from "../../../assets/card/shapes/SS.webp";
import HHImage from "../../../assets/card/shapes/HH.webp";
import DDImage from "../../../assets/card/shapes/DD.webp";

import { getNumberCard } from "../../../utils/card";
import { memoizeCasinoComponent } from "../../../utils/casinoMemo";

interface Teenpatti2OProps {
  casinoData: any;
  remainingTime: number;
  onBetClick: (sid: string, type: "back" | "lay", options?: any) => void;
  results?: any[];
  gameCode?: string;
  gameName?: string;
  currentBet?: any;
}

const Teenpatti2OComponent: React.FC<Teenpatti2OProps> = ({
  casinoData,
  remainingTime = 0,
  onBetClick,
  results = [],
  gameCode,
  gameName,
  currentBet,
}) => {
  const navigate = useNavigate();
  const [modalData, setModalData] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  /* ------------------- NORMALIZE GAME TYPE ------------------- */
  // Normalize gameCode to lowercase format (e.g., "TEEN_6" -> "teen6")
  const normalizedGameType = useMemo(() => {
    if (!gameCode) return undefined;
    return gameCode.toLowerCase().replace(/_/g, "");
  }, [gameCode]);

  /* ------------------- SAFE SUB ARRAY ACCESS ------------------- */
  const subArray = useMemo(() => {
    return (
      casinoData?.data?.sub ||
      casinoData?.data?.current?.sub ||
      casinoData?.data?.data?.data?.sub ||
      []
    );
  }, [casinoData]);

  /* ------------------- Get rows by SID ------------------- */
  const getRowsBySid = (sid: number) =>
    subArray.filter((x: any) => Number(x.sid) === Number(sid));

  const getOddsData = (sid: number) =>
    subArray.find((x: any) => Number(x.sid) === Number(sid)) || null;

  /* ------------------- Locking logic ------------------- */
  const isRowLocked = (row: any) => {
    if (!row) return true;
    if (remainingTime <= 3) return true;
    const s = String(row.gstatus).toUpperCase();
    return s === "SUSPENDED" || s === "CLOSED" || s === "0";
  };

  /* ------------------- FORMATTING ------------------- */
  const fmt = (v: any) => {
    if (v === null || v === undefined) return "-";
    const n = Number(v);
    if (isNaN(n)) return "-";
    return Number.isInteger(n) ? n : n.toFixed(2);
  };

  /* ------------------- PLAYER MARKETS ------------------- */
  const playerA = getOddsData(1);
  const playerB = getOddsData(2);

  const playerAUnder = getOddsData(9);
  const playerAOver = getOddsData(10);
  const playerBUnder = getOddsData(11);
  const playerBOver = getOddsData(12);

  /* ------------------- SUIT MARKET (Dynamic - finds by subtype and OPEN status) ------------------- */
  // Find the suit odds item with subtype === "suit" AND gstatus === "OPEN" (could be Card 1-6, sid 3-8)
  const suitOddsItem = useMemo(() => {
    return (
      subArray.find(
        (item: any) =>
          item.subtype === "suit" &&
          item.gstatus === "OPEN" &&
          (item.visible === 1 || item.visible === undefined) // visible: 1 indicates it's the active card
      ) || null
    );
  }, [subArray]);

  // Get nested odds from the suit odds item
  const getSuitNestedOdd = (nat: string) => {
    if (!suitOddsItem?.odds || !Array.isArray(suitOddsItem.odds)) return null;
    return (
      suitOddsItem.odds.find(
        (odd: any) => odd.nat?.toLowerCase() === nat.toLowerCase()
      ) || null
    );
  };

  // Check if suit market is locked (based on parent item status)
  const isSuitMarketLocked = () => {
    if (!suitOddsItem) return true;
    return isRowLocked(suitOddsItem);
  };

  /* ------------------- ODD/EVEN (Dynamic - finds by subtype and OPEN status) ------------------- */
  // Find the odd/even odds item with subtype === "oddeven" AND gstatus === "OPEN" (could be Card 1-6, sid 13-18)
  const oddEvenOddsItem = useMemo(() => {
    return (
      subArray.find(
        (item: any) =>
          item.subtype === "oddeven" &&
          item.gstatus === "OPEN" &&
          (item.visible === 1 || item.visible === undefined) // visible: 1 indicates it's the active card
      ) || null
    );
  }, [subArray]);

  // Get nested odds from the odd/even odds item
  const getOddEvenNestedOdd = (nat: string) => {
    if (!oddEvenOddsItem?.odds || !Array.isArray(oddEvenOddsItem.odds))
      return null;
    return (
      oddEvenOddsItem.odds.find(
        (odd: any) => odd.nat?.toLowerCase() === nat.toLowerCase()
      ) || null
    );
  };

  // Check if odd/even market is locked (based on parent item status)
  const isOddEvenMarketLocked = () => {
    if (!oddEvenOddsItem) return true;
    return isRowLocked(oddEvenOddsItem);
  };

  /* ------------------- CARD NUMBER MARKET (Dynamic - finds by subtype and OPEN status) ------------------- */
  // Find the card odds item with subtype === "cards" AND gstatus === "OPEN" (could be Card 1-6, sid 19-24)
  const cardOddsItem = useMemo(() => {
    return (
      subArray.find(
        (item: any) =>
          item.subtype === "cards" &&
          item.gstatus === "OPEN" &&
          (item.visible === 1 || item.visible === undefined) // visible: 1 indicates it's the active card
      ) || null
    );
  }, [subArray]);

  // Get nested odds from the card odds item
  const getCardNestedOdd = (nat: string) => {
    if (!cardOddsItem?.odds || !Array.isArray(cardOddsItem.odds)) return null;
    return (
      cardOddsItem.odds.find(
        (odd: any) => odd.nat?.toLowerCase() === nat.toLowerCase()
      ) || null
    );
  };

  // Check if card market is locked (based on parent item status)
  const isCardMarketLocked = () => {
    if (!cardOddsItem) return true;
    return isRowLocked(cardOddsItem);
  };

  /* ------------------- OPEN MODAL ------------------- */
  const openModal = (data: any) => {
    setModalData(data);
    setShowModal(true);
  };

  /* ===========================================================
     =======================    UI    ===========================
     =========================================================== */

  return (
    <div className="flex flex-col gap-2">
      {/* ================= PLAYER A ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <PlayerPanel
          title="Player A"
          sid="1"
          market={playerA}
          under={playerAUnder}
          over={playerAOver}
          onBetClick={onBetClick}
          isRowLocked={isRowLocked}
          fmt={fmt}
        />

        {/* ================= PLAYER B ================= */}
        <PlayerPanel
          title="Player B"
          sid="2"
          market={playerB}
          under={playerBUnder}
          over={playerBOver}
          onBetClick={onBetClick}
          isRowLocked={isRowLocked}
          fmt={fmt}
        />
      </div>

      {/* ================= SUIT MARKET ================= */}
      {suitOddsItem && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          <SuitBox
            label="Spade"
            img={HHImage}
            nestedOdd={getSuitNestedOdd("Spade")}
            parentSid={suitOddsItem.sid}
            parentNat={suitOddsItem.nat}
            disabled={
              isSuitMarketLocked() ||
              !getSuitNestedOdd("Spade") ||
              !getSuitNestedOdd("Spade")?.b
            }
            fmt={fmt}
            onBetClick={onBetClick}
          />

          <SuitBox
            label="Diamond"
            img={DDImage}
            nestedOdd={getSuitNestedOdd("Diamond")}
            parentSid={suitOddsItem.sid}
            parentNat={suitOddsItem.nat}
            disabled={
              isSuitMarketLocked() ||
              !getSuitNestedOdd("Diamond") ||
              !getSuitNestedOdd("Diamond")?.b
            }
            fmt={fmt}
            onBetClick={onBetClick}
          />

          <SuitBox
            label="Club"
            img={CCImage}
            nestedOdd={getSuitNestedOdd("Club")}
            parentSid={suitOddsItem.sid}
            parentNat={suitOddsItem.nat}
            disabled={
              isSuitMarketLocked() ||
              !getSuitNestedOdd("Club") ||
              !getSuitNestedOdd("Club")?.b
            }
            fmt={fmt}
            onBetClick={onBetClick}
          />

          <SuitBox
            label="Heart"
            img={SSImage}
            nestedOdd={getSuitNestedOdd("Heart")}
            parentSid={suitOddsItem.sid}
            parentNat={suitOddsItem.nat}
            disabled={
              isSuitMarketLocked() ||
              !getSuitNestedOdd("Heart") ||
              !getSuitNestedOdd("Heart")?.b
            }
            fmt={fmt}
            onBetClick={onBetClick}
          />

        {/* Odd */}
          {/* {oddEvenOddsItem && ( */}
          <OddEvenBox
            label="Odd"
            nestedOdd={getOddEvenNestedOdd("Odd")}
            parentSid={oddEvenOddsItem.sid}
            parentNat={oddEvenOddsItem.nat}
            disabled={
              isOddEvenMarketLocked() ||
              !getOddEvenNestedOdd("Odd") ||
              !getOddEvenNestedOdd("Odd")?.b
            }
            fmt={fmt}
            onBetClick={onBetClick}
          />
          {/* // )} */}

        {/* Even */}
          {/* {oddEvenOddsItem && ( */}
          <OddEvenBox
            label="Even"
            nestedOdd={getOddEvenNestedOdd("Even")}
            parentSid={oddEvenOddsItem.sid}
            parentNat={oddEvenOddsItem.nat}
            disabled={
              isOddEvenMarketLocked() ||
              !getOddEvenNestedOdd("Even") ||
              !getOddEvenNestedOdd("Even")?.b
            }
            fmt={fmt}
            onBetClick={onBetClick}
          />
          {/* )} */}
        </div>
      )}

      {/* ================= CARD VALUE MARKET ================= */}
      {/* {cardOddsItem && ( */}
      <div className="flex flex-wrap justify-center gap-3 py-4 bg-[var(--bg-table-row)]">
        {["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"].map(
          (rank) => {
            const nat = `Card ${rank}`;
            const nestedOdd = getCardNestedOdd(nat);
            const marketLocked = isCardMarketLocked();
            const cardLocked = marketLocked || !nestedOdd || !nestedOdd.b;
            const oddsValue = nestedOdd?.b || 0;

              return (
              <div key={rank} className="flex flex-col items-center">
                <span className="text-xs font-semibold">{fmt(oddsValue)}</span>

                  <button
                  disabled={cardLocked}
                    className="relative"
                    onClick={() =>
                    !cardLocked &&
                    nestedOdd &&
                    onBetClick(String(cardOddsItem.sid), "back", {
                      outcome: rank,
                      displayName: `${cardOddsItem.nat} ${rank}`,
                        rate: oddsValue,
                      parentNat: cardOddsItem.nat,
                      cardNat: nestedOdd.nat, // Use the specific card's nat (e.g., "Card J")
                      nestedSid: nestedOdd.sid,
                      nat: nestedOdd.nat,
                    })
                  }
                >
                  {cardLocked && (
                    <span className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <RiLockFill className="text-white text-sm" />
                      </span>
                    )}
                  <img src={getNumberCard(rank)} className="w-8" />
                  </button>
                </div>
              );
          }
        )}
      </div>
      {/* )} */}

      {/* ================= RESULTS ================= */}
      <ResultSection
        results={results}
        onClick={(r: any) => openModal(r)}
        navigate={navigate}
      />

      {/* ================= MODAL ================= */}
      {/* <IndividualResultModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        resultId={modalData?.mid}
        gameType={normalizedGameType}
      /> */}
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const Teenpatti2O = memoizeCasinoComponent(Teenpatti2OComponent);
Teenpatti2O.displayName = "Teenpatti2O";

export default Teenpatti2O;
