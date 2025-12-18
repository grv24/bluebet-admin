import React, { useState } from "react";
import { memoizeCasinoComponent } from "../../../utils/casinoMemo";
import {
  getBlackShapes,
  getNumberCard,
  getRedShapes,
} from "../../../utils/card";
import { RiLockFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import IndividualResultModal from "@/components/modals/IndividualResultModal";

const AndarBahar2Component = ({
  casinoData,
  remainingTime,
  results,
  gameSlug,
  gameName,
  gameCode,
}: any) => {
  const navigate = useNavigate();
  
  // Modal state for individual result details
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);

  // Use gameCode or gameSlug for API calls (default to "ABJ")
  const apiGameType = React.useMemo(() => {
    return gameCode || gameSlug || "ABJ";
  }, [gameCode, gameSlug]);

  // Handle both new and legacy data structures for ABJ
  const t2: any[] =
    casinoData?.data?.sub || casinoData?.data?.data?.data?.t2 || [];

  const isLocked = (row: any) => {
    const s = row?.gstatus as string | number | undefined;
    return (
      s === "SUSPENDED" ||
      s === "CLOSED" ||
      s === 0 ||
      s === "0" ||
      (remainingTime ?? 0) <= 3
    );
  };

  // Updated function to find by nation/nat field
  const getByNat = (name: string) => {
    if (!t2 || !Array.isArray(t2)) return null;
    const found = t2.find(
      (x) =>
        String(x?.nat || x?.nation || "").toLowerCase() === name.toLowerCase()
    );
    console.log(`🎰 ABJ getByNat(${name}):`, found);
    return found;
  };

  // Updated function to get nth occurrence by nation/nat field
  const getNthByNat = (name: string, nth: number) => {
    if (!t2 || !Array.isArray(t2)) return null;
    const filtered = t2.filter(
      (x) =>
        String(x?.nat || x?.nation || "").toLowerCase() === name.toLowerCase()
    );
    const found = filtered[nth - 1] || null;
    console.log(
      `🎰 ABJ getNthByNat(${name}, ${nth}):`,
      found,
      `(found ${filtered.length} total)`
    );
    return found;
  };

  // Helper function to get bet by sid
  const getBySid = (sid: string) => {
    if (!t2 || !Array.isArray(t2)) return null;
    const found = t2.find((x) => String(x?.sid) === String(sid));
    console.log(`🎰 ABJ getBySid(${sid}):`, found);
    return found;
  };

  // Handle result click to open modal
  const handleResultClick = (item: any) => {
    // Extract matchId from result item
    const matchId = item?.mid || item?.result?.mid || item?.roundId || null;
    
    if (matchId) {
      setSelectedResultId(String(matchId));
      setIsResultModalOpen(true);
    }
  };


  // Render box - ADMIN VIEW ONLY (no betting functionality)
  const renderBox = (label: string, row: any, extraClasses: string = "") => {
    // Create a default row if none exists
    const defaultRow = {
      sid: null,
      b: 0,
      l: 0,
      gstatus: "OPEN"
    };
    const actualRow = row || defaultRow;
    const locked = isLocked(actualRow);
    const value = actualRow?.b ?? 0;

    return (
      <div
        className={`relative flex flex-col min-w-16 px-2 border-2 border-yellow-400 items-center justify-center ${extraClasses}`}
      >
        {locked && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <RiLockFill className="text-white text-lg" />
          </div>
        )}
        <h2
          className={`text-sm font-semibold leading-6 ${extraClasses.includes("bg-[var(--bg-back)]") ? "text-white" : ""}`}
        >
          {label}
        </h2>
        <p
          className={`text-sm font-normal leading-4 ${extraClasses.includes("bg-[var(--bg-back)]") ? "text-white" : ""}`}
        >
          {value}
        </p>
      </div>
    );
  };

  // Debug: Log the t2 data structure
  console.log("🎰 ABJ t2 data:", t2);
  console.log(
    "🎰 ABJ Available nations:",
    t2 && Array.isArray(t2) ? t2.map((x) => ({
      sid: x.sid,
      nat: x.nat,
      nation: x.nation,
      b: x.b,
      gstatus: x.gstatus,
    })) : []
  );

  // Debug: Test specific sid lookups
  console.log("🎰 ABJ Test lookups:", {
    sid1: getBySid("1"), // SA
    sid2: getBySid("2"), // 1st Bet
    sid3: getBySid("3"), // 2nd Bet A
    sid4: getBySid("4"), // SB
    sid5: getBySid("5"), // 1st Bet B
    sid6: getBySid("6"), // 2nd Bet B
    sid24: getBySid("24"), // Joker Odd
    sid25: getBySid("25"), // Joker Even
    sid7: getBySid("7"), // Joker A
    sid20: getBySid("20"), // Joker Spade
  });

  return (
    <div className="flex flex-col gap-1 mt-1">
      {/* first row */}
      <div className=" bg-[var(--bg-table-row)] border py-4 border-gray-300">
        <div className="grid lg:grid-cols-2 gap-1 grid-cols-1">
          {/* Side A */}
          <div className="col-span-1 flex gap-2 items-center justify-center">
            <h2 className="text-base font-semibold">A</h2>
            {renderBox("SA", getBySid("1"), "bg-white")}
            {renderBox("First Bet", getBySid("2"), "bg-[var(--bg-back)]")}
            {renderBox("Second Bet", getBySid("3"), "bg-[var(--bg-back)]")}
            <h2 className="text-base font-semibold">A</h2>
          </div>
          {/* Side B */}
          <div className="col-span-1 flex gap-2 items-center justify-center">
            <h2 className="text-base font-semibold">B</h2>
            {renderBox("SB", getBySid("4"), "bg-white")}
            {renderBox("First Bet", getBySid("5"), "bg-[var(--bg-back)]")}
            {renderBox("Second Bet", getBySid("6"), "bg-[var(--bg-back)]")}
            <h2 className="text-base font-semibold">B</h2>
          </div>
        </div>
      </div>
      {/* second row */}
      <div className="grid lg:grid-cols-2 grid-cols-1 gap-1 ">
        {/* Odd/Even - ADMIN VIEW (Read-only) */}
        <div className="border py-4 bg-[var(--bg-table-row)] flex gap-2 items-center justify-center p-1 border-gray-300">
          {[
            { name: "Odd", sid: "24" },
            { name: "Even", sid: "25" },
          ].map(({ name, sid }) => {
            const row = getBySid(sid);
            if (!row) return null;
            const locked = isLocked(row);
            return (
              <div key={name} className="flex flex-col gap-2 w-full">
                <h2 className="text-base font-semibold text-center">
                  {name.toUpperCase()}
                </h2>
                <div className="relative border-2 border-[var(--bg-back)] w-full">
                  {locked && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <RiLockFill className="text-white text-lg" />
                    </div>
                  )}
                  <h2 className="text-base font-semibold leading-10 text-center ">
                    {row?.b ?? 0}
                  </h2>
                </div>
                {/* <h2 className="text-xs font-medium text-center text-gray-500">
                  {locked ? "SUSPENDED" : "OPEN"}
                </h2> */}
              </div>
            );
          })}
        </div>
        {/* Suits - ADMIN VIEW (Read-only) */}
        <div className="border py-4 bg-[var(--bg-table-row)] flex gap-2 items-center justify-center p-1 border-gray-300">
          {[
            { label: "Hearts", sid: "22" },
            { label: "Clubs", sid: "21" },
            { label: "Diamonds", sid: "23" },
            { label: "Spades", sid: "20" },
          ].map(({ label, sid }) => {
            const row = getBySid(sid);
            if (!row) return null;
            const locked = isLocked(row);

            let suitImage: string = "";
            switch (label) {
              case "Hearts":
                suitImage = getRedShapes().Heart;
                break;
              case "Diamonds":
                suitImage = getRedShapes().Diamond;
                break;
              case "Spades":
                suitImage = getBlackShapes().Spade;
                break;
              case "Clubs":
                suitImage = getBlackShapes().Club;
                break;
              default:
                suitImage = "";
            }

            return (
              <div key={label} className="flex flex-col gap-2 w-full">
                {suitImage && (
                  <img src={suitImage} className="w-6 h-6 mx-auto" alt={label} />
                )}
                <div className="relative border-2 border-[var(--bg-back)] w-full">
                  {locked && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <RiLockFill className="text-white text-lg" />
                    </div>
                  )}
                  <h2 className="text-base font-semibold leading-10 text-center ">
                    {row?.b ?? 0}
                  </h2>
                </div>
                {/* <h2 className="text-xs font-medium text-center text-gray-500">
                  {locked ? "SUSPENDED" : "OPEN"}
                </h2> */}
              </div>
            );
          })}
        </div>
      </div>
      {/* Joker Cards A-K - ADMIN VIEW (Read-only) */}
      <div className="w-full bg-[var(--bg-table-row)] border border-gray-300 flex flex-col gap-2 py-4">
        <div className="w-8/12 mx-auto hidden lg:grid lg:grid-cols-[repeat(13,minmax(0,1fr))] gap-1 place-items-center place-content-center">
          {[
            { name: "A", sid: "7" },
            { name: "2", sid: "8" },
            { name: "3", sid: "9" },
            { name: "4", sid: "10" },
            { name: "5", sid: "11" },
            { name: "6", sid: "12" },
            { name: "7", sid: "13" },
            { name: "8", sid: "14" },
            { name: "9", sid: "15" },
            { name: "10", sid: "16" },
            { name: "J", sid: "17" },
            { name: "Q", sid: "18" },
            { name: "K", sid: "19" },
          ].map(({ name, sid }) => {
            const row = getBySid(sid);
            if (!row) return null;
            const locked = isLocked(row);
            return (
              <div
                key={sid}
                className="w-full aspect-square text-center flex flex-col items-center justify-center"
              >
                <div className="relative w-full h-fit flex items-center justify-center">
                  {locked && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                      <RiLockFill className="text-white text-lg" />
                    </div>
                  )}
                  <img src={getNumberCard(name)} alt={name} className="w-8" />
                </div>
                <h2 className="text-xs font-medium text-gray-700 mt-1">
                  {row?.b ?? 0}
                </h2>
              </div>
            );
          })}
        </div>
        {/* Mobile View - ADMIN VIEW (Read-only) */}
        <div className="w-11/12 mx-auto grid lg:hidden gap-2">
          <div className="grid grid-cols-10 gap-1 place-items-center">
            {[
              { name: "A", sid: "7" },
              { name: "2", sid: "8" },
              { name: "3", sid: "9" },
              { name: "4", sid: "10" },
              { name: "5", sid: "11" },
              { name: "6", sid: "12" },
              { name: "7", sid: "13" },
              { name: "8", sid: "14" },
              { name: "9", sid: "15" },
              { name: "10", sid: "16" },
            ].map(({ name, sid }) => {
              const row = getBySid(sid);
              if (!row) return null;
              const locked = isLocked(row);
              return (
                <div
                  key={sid}
                  className="w-full aspect-square text-center flex flex-col items-center justify-center"
                >
                  <div className="relative w-full h-full flex items-center justify-center">
                    {locked && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                        <RiLockFill className="text-white text-lg" />
                      </div>
                    )}
                    <img src={getNumberCard(name)} alt={name} className="w-6" />
                  </div>
                  <h2 className="text-xs font-medium text-gray-700">
                    {row?.b ?? 0}
                  </h2>
                </div>
              );
            })}
          </div>
          <div className="w-full mt-4 flex justify-center">
            <div className="grid grid-cols-3 gap-1 place-items-center">
              {[
                { name: "J", sid: "17" },
                { name: "Q", sid: "18" },
                { name: "K", sid: "19" },
              ].map(({ name, sid }) => {
                const row = getBySid(sid);
                if (!row) return null;
                const locked = isLocked(row);
                return (
                  <div
                    key={sid}
                    className="w-full aspect-square text-center flex flex-col items-center justify-center"
                  >
                    <div className="relative w-full h-full flex items-center justify-center">
                      {locked && (
                        <div className="absolute inset-0 bg-black/60 h-7 flex items-center justify-center z-10">
                          <RiLockFill className="text-white text-lg" />
                        </div>
                      )}
                      <img src={getNumberCard(name)} alt={name} className="w-6" />
                    </div>
                    <h2 className="text-xs font-medium text-gray-700 mt-1">
                      {row?.b ?? 0}
                    </h2>
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
            onClick={() => navigate(`/reports/casino-result-report?game=ABJ`)}
            className="text-sm font-normal leading-8 text-white cursor-pointer hover:text-gray-200"
          >
            View All
          </h2>
        </div>
        <div className="flex justify-end items-center mb-2 gap-1 mx-2">
          {Array.isArray(results) && results.length > 0
            ? results.slice(0, 10).map((item: any, index: number) => {
                const matchId = item?.mid || item?.result?.mid || item?.roundId;
                return (
                <h2
                    key={item?.mid || item?.roundId || index}
                    className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-sm font-semibold ${item.win === "2" ? "text-red-500" : "text-yellow-400"} ${
                      matchId ? "cursor-pointer hover:scale-110 transition-transform" : ""
                    }`}
                    title={`${item.win === "1" ? "A" : "B"}${matchId ? " - Click to view details" : ""}`}
                    onClick={() => matchId && handleResultClick(item)}
                >
                  {item.win === "1" ? "A" : "B"}
                </h2>
                );
              })
            : // Fallback to old data structure if results prop is not available
              (casinoData as any)?.data?.data?.result
                ?.slice(0, 10)
                .map((item: any, index: number) => {
                  const matchId = item?.mid || item?.result?.mid || item?.roundId;
                  return (
                  <h2
                      key={item?.mid || item?.roundId || index}
                      className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-sm font-semibold ${item.win === "1" ? "text-red-500" : "text-yellow-400"} ${
                        matchId ? "cursor-pointer hover:scale-110 transition-transform" : ""
                      }`}
                      title={`${item.win === "1" ? "A" : "B"}${matchId ? " - Click to view details" : ""}`}
                      onClick={() => matchId && handleResultClick(item)}
                  >
                    {item.win === "1" ? "A" : "B"}
                  </h2>
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
        title={`${gameName || "Andar Bahar 2"} Result Details`}
        enableBetFiltering={true}
      />
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const AndarBahar2 = memoizeCasinoComponent(AndarBahar2Component);
AndarBahar2.displayName = "AndarBahar2";

export default AndarBahar2;
