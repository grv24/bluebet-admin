import React, { useState } from "react";
import { RiLockFill } from "react-icons/ri";
import { cardType } from "../../../utils/card";
import { useNavigate } from "react-router-dom";
import { getCardByCode } from "../../../utils/card";
import IndividualResultModal from "@/components/modals/IndividualResultModal";
import { memoizeCasinoComponent } from "../../../utils/casinoMemo";

interface DT6Props {
  casinoData: any;
  remainingTime: number;
  results?: any[];
  gameSlug?: string;
  gameCode?: string;
  gameName?: string;
}

// helpers
const getOddsData = (casinoData: any, sid: string) => {
  // Handle both new API format (casinoData?.data?.sub) and legacy format (casinoData?.data?.data?.data?.t2)
  const dataSource = casinoData?.data?.sub || casinoData?.data?.data?.data?.t2;
  if (!dataSource) return null;
  return dataSource.find((item: any) => String(item.sid) === String(sid));
};

const isSuspended = (casinoData: any, sid: string, remainingTime: number) => {
  const oddsData = getOddsData(casinoData, sid) as any;
  if (!oddsData) return true;

  const toNumber = (value: unknown) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return 0;
      const parsed = Number(trimmed);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const rawStatus = oddsData?.gstatus as unknown as string | number | undefined;
  const statusStr =
    typeof rawStatus === "string"
      ? rawStatus.trim().toUpperCase()
      : rawStatus !== undefined && rawStatus !== null
        ? String(rawStatus).trim().toUpperCase()
        : "";

  const numericStatus =
    typeof rawStatus === "number"
      ? rawStatus
      : typeof rawStatus === "string" && rawStatus.trim() !== ""
        ? Number(rawStatus.trim())
        : null;

  const isStatusSuspended =
    statusStr === "SUSPENDED" ||
    statusStr === "CLOSED" ||
    (numericStatus !== null && !Number.isNaN(numericStatus) && numericStatus === 0);

  const backStakeLimit = toNumber(oddsData?.bs ?? oddsData?.bs1);
  const layStakeLimit = toNumber(oddsData?.ls ?? oddsData?.ls1);

  const shouldLockForZeroStakeLimits =
    backStakeLimit <= 0 && layStakeLimit <= 0;

  const isTimeSuspended = remainingTime <= 3;

  return (
    isStatusSuspended ||
    isTimeSuspended ||
    shouldLockForZeroStakeLimits
  );
};


const OneDayDragonTigerComponent: React.FC<DT6Props> = ({
  casinoData,
  remainingTime,
  results = [],
  gameSlug,
  gameCode,
  gameName,
}) => {
  const navigate = useNavigate();

  // Modal state for individual result details
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);

  // Keep original gameCode/gameSlug for API calls (e.g., "DRAGON_TIGER_6")
  const apiGameType = React.useMemo(() => {
    return gameCode || gameSlug || "DRAGON_TIGER_6";
  }, [gameCode, gameSlug]);

  // Handle result click to open modal
  const handleResultClick = (item: any) => {
    // Extract matchId from result item
    const matchId = item?.mid || item?.result?.mid || item?.roundId || item?.id || item?.matchId;
    
    if (matchId && apiGameType) {
      setSelectedResultId(String(matchId));
      setIsResultModalOpen(true);
    }
  };

  // Debug: Log data
  // console.log("🎰 DT6 component debug:", {
  //   casinoData,
  //   remainingTime,
  //   hasSub: !!(casinoData as any)?.data?.sub,
  //   hasLegacyT2: !!(casinoData as any)?.data?.data?.data?.t2,
  //   subLength: (casinoData as any)?.data?.sub?.length,
  //   sampleSubItem: (casinoData as any)?.data?.sub?.[0],
  //   lt: (casinoData as any)?.data?.lt,
  //   ft: (casinoData as any)?.data?.ft,
  // });


  return (
    <div className="w-full flex flex-col gap-1.5">
      <div className="md:p-0 p-1">
        {/* Dragon Tiger Odds */}
        <div className="w-full flex md:flex-row flex-col gap-1.5">
          {/* left side */}
          <div className="md:w-1/2 bg-[var(--bg-table)] border border-gray-100">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border border-gray-300 px-1 py-1 text-left text-xs">
                    {/* Min: {getOddsData(casinoData, "1")?.min || "100"} Max:{" "}
                  {getOddsData(casinoData, "1")?.max || "150000"} */}
                  </th>
                  <th className="border border-gray-300 px-1 py-1 text-center text-sm bg-[var(--bg-back)]">
                    BACK
                  </th>
                  <th className="border border-gray-300 px-1 py-1 text-center text-sm bg-[var(--bg-lay)]">
                    LAY
                  </th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  return (
                    <>
                      {/* Dragon Row */}
                      <tr className="hover:bg-gray-100">
                        <td className="border border-gray-300 px-1 py-1.5 text-sm font-semibold">
                          Dragon
                        </td>

                        {/* Back Button */}
                        <td className="border border-gray-300 px-1 py-1.5 text-center text-sm bg-[var(--bg-back)] relative">
                          {isSuspended(casinoData, "1", remainingTime) && (
                            <div className="absolute inset-0 bg-black/60 flex w-full h-full justify-center items-center font-bold uppercase z-20">
                              <span className="text-white">
                                <RiLockFill className="text-xl" />
                              </span>
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold">
                              {(getOddsData(casinoData, "1")?.b ||
                                getOddsData(casinoData, "1")?.b1) ??
                                "0"}
                            </span>
                          </div>
                        </td>

                        {/* Lay Button */}
                        <td className="border border-gray-300 px-1 py-1.5 text-center text-sm bg-[var(--bg-lay)] relative">
                          {isSuspended(casinoData, "1", remainingTime) && (
                            <div className="absolute inset-0 bg-black/60 flex w-full h-full justify-center items-center font-bold uppercase z-20">
                              <span className="text-white">
                                <RiLockFill className="text-xl" />
                              </span>
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold">
                              {(getOddsData(casinoData, "1")?.l ||
                                getOddsData(casinoData, "1")?.l1) ??
                                "0"}
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Tiger Row */}
                      <tr className="hover:bg-gray-100">
                        <td className="border border-gray-300 px-1 py-1.5 text-sm font-semibold">
                          Tiger
                        </td>

                        {/* Back Button */}
                        <td className="border border-gray-300 px-1 py-1.5 text-center text-sm bg-[var(--bg-back)] relative">
                          {isSuspended(casinoData, "2", remainingTime) && (
                            <div className="absolute inset-0 bg-black/60 flex w-full h-full justify-center items-center font-bold uppercase z-20">
                              <span className="text-white">
                                <RiLockFill className="text-xl" />
                              </span>
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold">
                              {(getOddsData(casinoData, "2")?.b ||
                                getOddsData(casinoData, "2")?.b1) ??
                                "0"}
                            </span>
                          </div>
                        </td>

                        {/* Lay Button */}
                        <td className="border border-gray-300 px-1 py-1.5 text-center text-sm bg-[var(--bg-lay)] relative">
                          {isSuspended(casinoData, "2", remainingTime) && (
                            <div className="absolute inset-0 bg-black/60 flex w-full h-full justify-center items-center font-bold uppercase z-20">
                              <span className="text-white">
                                <RiLockFill className="text-xl" />
                              </span>
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold">
                              {(getOddsData(casinoData, "2")?.l ||
                                getOddsData(casinoData, "2")?.l1) ??
                                "0"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    </>
                  );
                })()}
              </tbody>
            </table>
          </div>
          {/* right side - PAIR */}
          <div className="md:w-1/2 bg-[var(--bg-table)] border border-gray-300 my-2 relative">
            <div className="flex flex-col justify-between items-center h-full px-4 py-2 ">
              <h2 className="text-base font-bold leading-5">
                {(getOddsData(casinoData, "3")?.b ||
                  getOddsData(casinoData, "3")?.b1) ??
                  "0"}
              </h2>
              <div className="relative w-full">
                <button className={`bg-gradient-to-r from-[var(--bg-primary)] to-[var(--bg-secondary)] relative leading-5 py-1 w-full text-white text-sm font-semibold ${isSuspended(casinoData, "3", remainingTime) ? "pointer-events-none" : ""}`}>
                  {isSuspended(casinoData, "3", remainingTime) && (
                    <div className="absolute inset-0 bg-black/60 flex w-full h-full justify-center items-center font-bold uppercase z-20">
                      <span className="text-white">
                        <RiLockFill className="text-xl" />
                      </span>
                    </div>
                  )}
                  PAIR
                </button>
              </div>
            </div>
            <div className="absolute bottom-1 right-2">
              <h2 className="text-xs font-normal leading-4">
                {/* Min: {getOddsData(casinoData, "3")?.min || "100"} Max:{" "}
              {getOddsData(casinoData, "3")?.max || "50000"} */}
              </h2>
            </div>
          </div>
        </div>
        <div className="w-full flex md:flex-row flex-col gap-1.5">
          {/* Even/Odd Odds */}
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-300 px-1 py-1 text-left text-xs w-4/12">
                </th>
                <th className="border border-gray-300 px-1 py-1 text-center text-sm bg-[var(--bg-back)]">
                  Even
                </th>
                <th className="border border-gray-300 px-1 py-1 text-center text-sm bg-[var(--bg-back)]">
                  Odd
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-gray-100">
                <td className="border border-gray-300 px-1 py-1.5 text-sm font-semibold">
                  Dragon
                </td>
                <td
                  className="border border-gray-300 px-1 py-1.5 text-center text-sm bg-[var(--bg-back)] relative"
                >
                  {isSuspended(casinoData, "4", remainingTime) && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                      <h2 className="text-white">
                        <RiLockFill className="text-xl" />
                      </h2>
                      
                    </div>
                  )}
                  {(getOddsData(casinoData, "4")?.b ||
                    getOddsData(casinoData, "4")?.b1) ??
                    "0"}
                    
                </td>
                <td
                  className="border border-gray-300 px-1 py-1.5 text-center text-sm bg-[var(--bg-back)] relative"
                >
                  {isSuspended(casinoData, "5", remainingTime) && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                      <h2 className="text-white">
                        <RiLockFill className="text-xl" />
                      </h2>
                      
                    </div>
                  )}
                  {(getOddsData(casinoData, "5")?.b ||
                    getOddsData(casinoData, "5")?.b1) ??
                    "0"}
                    
                </td>
              </tr>
              <tr className="hover:bg-gray-100">
                <td className="border border-gray-300 px-1 py-1.5 text-sm font-semibold">
                  Tiger
                </td>
                <td
                  className="border border-gray-300 px-1 py-1.5 text-center text-sm bg-[var(--bg-back)] relative"
                >
                  {isSuspended(casinoData, "12", remainingTime) && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                      <h2 className="text-white">
                        <RiLockFill className="text-xl" />
                      </h2>
                      
                    </div>
                  )}
                  {(getOddsData(casinoData, "12")?.b ||
                    getOddsData(casinoData, "12")?.b1) ??
                    "0"}
                    
                </td>
                <td
                  className="border border-gray-300 px-1 py-1.5 text-center text-sm bg-[var(--bg-back)] relative"
                >
                  {isSuspended(casinoData, "13", remainingTime) && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                      <h2 className="text-white">
                        <RiLockFill className="text-xl" />
                      </h2>
                      
                    </div>
                  )}
                  {(getOddsData(casinoData, "13")?.b ||
                    getOddsData(casinoData, "13")?.b1) ??
                    "0"}
                    
                </td>
              </tr>
            </tbody>
          </table>
          {/* Red/Black Odds */}
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-300 px-1 py-1 text-left text-xs w-4/12">
                  {/* Min: {getOddsData(casinoData, "6")?.min || "100"} Max:{" "}
                {getOddsData(casinoData, "6")?.max || "150000"} */}
                </th>
                <th className="border border-gray-300 px-1 py-1 text-center text-sm bg-[var(--bg-back)]">
                  <div className="flex justify-center items-center gap-1">
                    <h2 className="text-xs"> Red</h2>
                    <img
                      src={cardType.Diamond}
                      alt="diamond"
                      className="w-3 h-3"
                    />
                    <img src={cardType.Spade} alt="Spade" className="w-3 h-3" />
                  </div>
                </th>
                <th className="border border-gray-300 px-1 py-1 text-center text-sm bg-[var(--bg-back)]">
                  <div className="flex justify-center items-center gap-1">
                    <h2 className="text-xs"> Black</h2>
                    <img src={cardType.Heart} alt="heart" className="w-3 h-3" />
                    <img src={cardType.Club} alt="club" className="w-3 h-3" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-gray-100">
                <td className="border border-gray-300 px-1 py-1.5 text-sm font-semibold">
                  Dragon
                </td>
                <td
                  className="border border-gray-300 px-1 py-1.5 text-center text-sm bg-[var(--bg-back)] relative"
                >
                  {isSuspended(casinoData, "6", remainingTime) && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                      <h2 className="text-white">
                        <RiLockFill className="text-xl" />
                      </h2>
                      
                    </div>
                  )}
                  {(getOddsData(casinoData, "6")?.b ||
                    getOddsData(casinoData, "6")?.b1) ??
                    "0"}
                    
                </td>
                <td
                  className="border border-gray-300 px-1 py-1.5 text-center text-sm bg-[var(--bg-back)] relative"
                >
                  {isSuspended(casinoData, "7", remainingTime) && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                      <h2 className="text-white">
                        <RiLockFill className="text-xl" />
                      </h2>
                      
                    </div>
                  )}
                  {(getOddsData(casinoData, "7")?.b ||
                    getOddsData(casinoData, "7")?.b1) ??
                    "0"}
                    
                </td>
              </tr>
              <tr className="hover:bg-gray-100">
                <td className="border border-gray-300 px-1 py-1.5 text-sm font-semibold">
                  Tiger
                </td>
                <td
                  className="border border-gray-300 px-1 py-1.5 text-center text-sm bg-[var(--bg-back)] relative"
                >
                  {isSuspended(casinoData, "14", remainingTime) && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                      <h2 className="text-white">
                        <RiLockFill className="text-xl" />
                      </h2>
                      
                    </div>
                  )}
                  {(getOddsData(casinoData, "14")?.b ||
                    getOddsData(casinoData, "14")?.b1) ??
                    "0"}
                    
                </td>
                <td
                  className="border border-gray-300 px-1 py-1.5 text-center text-sm bg-[var(--bg-back)] relative"
                >
                  {isSuspended(casinoData, "15", remainingTime) && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                      <h2 className="text-white">
                        <RiLockFill className="text-xl" />
                      </h2>
                      
                    </div>
                  )}
                  {(getOddsData(casinoData, "15")?.b ||
                    getOddsData(casinoData, "15")?.b1) ??
                    "0"}
                    
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* Suits Odds */}
        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr>
              <th className="border border-gray-300 px-1 py-1 text-left text-xs w-1/5">
                <i className="fa-solid fa-info-circle text-[var(--bg-primary)]"></i>
              </th>
              <th className="border border-gray-300 px-1 py-1 text-center text-sm  w-1/5">
                <div className="flex justify-center items-center">
                  <img src={cardType.Heart} alt="heart" className="w-3 h-3" />
                </div>
              </th>
              <th className="border border-gray-300 px-1 py-1 text-center text-sm  w-1/5">
                <div className="flex justify-center items-center">
                  <img
                    src={cardType.Diamond}
                    alt="diamond"
                    className="w-3 h-3"
                  />
                </div>
              </th>
              <th className="border border-gray-300 px-1 py-1 text-center text-sm  w-1/5">
                <div className="flex justify-center items-center">
                  <img src={cardType.Club} alt="club" className="w-3 h-3" /> 
                </div>
              </th>
              <th className="border border-gray-300 px-1 py-1 text-center text-sm  w-1/5">
                <div className="flex justify-center items-center">
                  <img src={cardType.Spade} alt="spade" className="w-3 h-3" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="hover:bg-gray-100">
              <td className="border border-gray-300 px-1 py-1.5 text-sm font-semibold">
                Dragon
              </td>
              <td
                className="border border-gray-300 px-1 py-1.5 text-center text-sm bg-[var(--bg-back)] relative"
              >
                {isSuspended(casinoData, "9", remainingTime) && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                    <h2 className="text-white">
                      <RiLockFill className="text-xl" />
                    </h2>
                    
                  </div>
                )}
                <span className="block w-full text-center">
                  {(getOddsData(casinoData, "9")?.b ||
                    getOddsData(casinoData, "9")?.b1) ??
                    "0"}
                </span>
                
              </td>
              <td
                className="border border-gray-300 px-1 py-1.5 text-center text-sm bg-[var(--bg-back)] relative"
              >
                {isSuspended(casinoData, "10", remainingTime) && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                    <h2 className="text-white">
                      <RiLockFill className="text-xl" />
                    </h2>
                    
                  </div>
                )}
                <span className="block w-full text-center">
                  {(getOddsData(casinoData, "10")?.b ||
                    getOddsData(casinoData, "10")?.b1) ??
                    "0"}
                </span>
                
              </td>
              <td
                className="border border-gray-300 px-1 py-1.5 text-center text-sm bg-[var(--bg-back)] relative"
              >
                {isSuspended(casinoData, "11", remainingTime) && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                    <h2 className="text-white">
                      <RiLockFill className="text-xl" />
                    </h2>
                    
                  </div>
                )}
                <span className="block w-full text-center">
                  {(getOddsData(casinoData, "11")?.b ||
                    getOddsData(casinoData, "11")?.b1) ??
                    "0"}
                </span>
                
              </td>
              <td
                className="border border-gray-300 px-1 py-1.5 text-center text-sm bg-[var(--bg-back)] relative"
              >
                {isSuspended(casinoData, "8", remainingTime) && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                    <h2 className="text-white">
                      <RiLockFill className="text-xl" />
                    </h2>
                    
                  </div>
                )}
                <span className="block w-full text-center">
                  {(getOddsData(casinoData, "8")?.b ||
                    getOddsData(casinoData, "8")?.b1) ??
                    "0"}
                </span>
                
              </td>
            </tr>
            <tr className="hover:bg-gray-100">
              <td className="border border-gray-300 px-1 py-1.5 text-sm font-semibold">
                Tiger
              </td>
              <td
                className="border border-gray-300 px-1 py-1.5 text-center text-sm bg-[var(--bg-back)] relative"
              >
                {isSuspended(casinoData, "17", remainingTime) && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                    <h2 className="text-white">
                      <RiLockFill className="text-xl" />
                    </h2>
                    
                  </div>
                )}
                <span className="block w-full text-center">
                  {(getOddsData(casinoData, "17")?.b ||
                    getOddsData(casinoData, "17")?.b1) ??
                    "0"}
                </span>
                
              </td>
              <td
                className="border border-gray-300 px-1 py-1.5 text-center text-sm bg-[var(--bg-back)] relative"
              >
                {isSuspended(casinoData, "18", remainingTime) && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                    <h2 className="text-white">
                      <RiLockFill className="text-xl" />
                    </h2>
                    
                  </div>
                )}
                <span className="block w-full text-center">
                  {(getOddsData(casinoData, "18")?.b ||
                    getOddsData(casinoData, "18")?.b1) ??
                    "0"}
                </span>
                
              </td>
              <td
                className="border border-gray-300 px-1 py-1.5 text-center text-sm bg-[var(--bg-back)] relative"
              >
                {isSuspended(casinoData, "19", remainingTime) && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                    <h2 className="text-white">
                      <RiLockFill className="text-xl" />
                    </h2>
                    
                  </div>
                )}
                <span className="block w-full text-center">
                  {(getOddsData(casinoData, "19")?.b ||
                    getOddsData(casinoData, "19")?.b1) ??
                    "0"}
                </span>
                
              </td>
              <td
                className="border border-gray-300 px-1 py-1.5 text-center text-sm bg-[var(--bg-back)] relative"
              >
                {isSuspended(casinoData, "16", remainingTime) && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                    <h2 className="text-white">
                      <RiLockFill className="text-xl" />
                    </h2>
                    
                  </div>
                )}
                <span className="block w-full text-center">
                  {(getOddsData(casinoData, "16")?.b ||
                    getOddsData(casinoData, "16")?.b1) ??
                    "0"}
                </span>
                
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Results */}
      <div className="mt-1 flex flex-col gap-1">
        <div className="bg-[var(--bg-secondary85)] border border-gray-300 flex justify-between px-2 py-.5 items-center">
          <h2 className="text-sm font-normal leading-8 text-white">
            Last Result
          </h2>
          <h2
            onClick={() => navigate(`/reports/casino-result-report?game=${gameCode || gameSlug || "DRAGON_TIGER_6"}`)}
            className="text-sm font-normal leading-8 text-white hover:text-gray-200"
          >
            View All
          </h2>
        </div>
        <div className="flex justify-end items-center mb-2 gap-1 mx-2">
          {Array.isArray(results) && results.length > 0
            ? results.slice(0, 10).map((item: any, index: number) => {
                const matchId = item?.mid || item?.result?.mid || item?.roundId || item?.id || item?.matchId;
                return (
                  <div
                    key={item?.mid || item?.roundId || index}
                    className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-sm font-semibold ${item.win === "1" ? "text-red-500" : "text-yellow-400"} ${
                      matchId ? "cursor-pointer hover:scale-110 transition-transform select-none" : ""
                    }`}
                    title={`${item.win === "1" ? "D" : "T"}${matchId ? " - Click to view details" : ""}`}
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
                    {item.win === "1" ? "D" : "T"}
                  </div>
                );
              })
            : // Fallback to old data structure if results prop is not available
              (casinoData as any)?.data?.data?.result
                ?.slice(0, 10)
                .map((item: any, index: number) => {
                  const matchId = item?.mid || item?.result?.mid || item?.roundId || item?.id || item?.matchId;
                  return (
                    <div
                      key={item?.mid || item?.roundId || index}
                      className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-sm font-semibold ${item.result === "1" ? "text-red-500" : "text-yellow-400"} ${
                        matchId ? "cursor-pointer hover:scale-110 transition-transform select-none" : ""
                      }`}
                      title={`${item.win === "1" ? "D" : "T"}${matchId ? " - Click to view details" : ""}`}
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
                      {item.win === "1" ? "D" : "T"}
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
        title={`${gameName || "One Day Dragon Tiger"} Result Details`}
        enableBetFiltering={true}
      />
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const OneDayDragonTiger = memoizeCasinoComponent(OneDayDragonTigerComponent);
OneDayDragonTiger.displayName = "OneDayDragonTiger";

export default OneDayDragonTiger;
