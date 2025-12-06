import React, { useMemo } from "react";
import { RiLockFill } from "react-icons/ri";
// import IndividualResultModal from "@/components/casino/IndividualResultModal";
// import { useIndividualResultModal } from "@/hooks/useIndividualResultModal";
import { getCardByCode } from "../../../utils/card";
import KSS from "../../../assets/card/other/KSS.webp";
import KHH from "../../../assets/card/other/KHH.webp";
import KDD from "../../../assets/card/other/KDD.webp";
import KCC from "../../../assets/card/other/KCC.webp";

import SS from '../../../assets/card/shapes/SS.webp'
import HH from '../../../assets/card/shapes/HH.webp'
import DD from '../../../assets/card/shapes/DD.webp'
import CC from '../../../assets/card/shapes/CC.webp'

import { useNavigate } from "react-router-dom";
import { memoizeCasinoComponent } from "../../../utils/casinoMemo";

interface Race20Props {
  casinoData: any;
  remainingTime: number;
  results?: any[];
  gameCode?: string;
  gameName?: string;
}

const Race20Component: React.FC<Race20Props> = ({
  casinoData,
  remainingTime,
  results = [],
  gameCode,
}) => {
  const navigate = useNavigate();
  // const resultModal = useIndividualResultModal();
  
  // Get game slug from gameCode for navigation
  const gameSlug = gameCode || "";
  
  // Normalize game slug for IndividualResultModal
  const normalizedGameSlug = useMemo(() => {
    if (gameCode) {
      const lowerCaseCode = gameCode.toLowerCase();
      if (lowerCaseCode === "race_20" || lowerCaseCode === "race20") {
        return "race20";
      }
      return lowerCaseCode.replace(/[^a-z0-9]/g, "");
    }
    return "race20"; // Default fallback
  }, [gameCode]);

  // Get odds data from sub array
  // Handle both API format (data.sub) and socket format (data.current.sub)
  const getOddsData = () => {
    const subArray =
      casinoData?.data?.sub ||
      casinoData?.data?.current?.sub ||
      casinoData?.data?.data?.data?.sub ||
      casinoData?.data?.current?.data?.sub ||
      [];
    return subArray;
  };

  // Check if betting is suspended
  const isLocked = (row: any): boolean => {
    if (!row) return true;

    const status = row.gstatus;
    const gval = row.gval;

    // Check gstatus - if status is explicitly "OPEN", it should be unlocked (unless gval overrides)
    const isStatusOpen = status === "OPEN" || status === "open";
    
    // Check gstatus - if status is suspended/closed
    const isStatusSuspended =
      status === "SUSPENDED" ||
      status === "CLOSED" ||
      Number(status) === 0 ||
      status === "0" ||
      String(status) === "0";

    // Check gval - if gval === 1, betting is suspended (only if gval is explicitly set)
    // gval can override OPEN status, but if gval is undefined/missing, trust gstatus
    const isGvalSuspended = gval !== undefined && gval !== null && (gval === 1 || gval === "1");

    const isTimeSuspended = remainingTime <= 3;

    // Check if both odds are 0 (no betting available)
    const hasNoBackOdds = !row.b || Number(row.b) === 0;
    const hasNoLayOdds = !row.l || Number(row.l) === 0;
    const hasNoOdds = hasNoBackOdds && hasNoLayOdds;

    // If status is explicitly OPEN and gval is not 1 (or undefined), it should be unlocked
    // unless time is low or both odds are 0
    if (isStatusOpen && !isGvalSuspended) {
      return isTimeSuspended || hasNoOdds;
    }

    // Lock if:
    // 1. Status is suspended/closed
    // 2. gval is 1 (suspended) - this can override OPEN status
    // 3. Time is low (<= 3 seconds)
    // 4. Both odds are 0 (no betting available)
    return (
      isStatusSuspended ||
      isGvalSuspended ||
      isTimeSuspended ||
      hasNoOdds
    );
  };

  // Format odds display
  const formatOdds = (value: number | string | undefined): string => {
    if (value === undefined || value === null) return "0";
    const num = Number(value);
    if (isNaN(num) || num === 0) return "0";
    // Format to 2 decimal places, then remove trailing zeros
    const formatted = num.toFixed(2);
    // Remove trailing zeros and decimal point if not needed
    return parseFloat(formatted).toString();
  };

  // Get all odds data
  const oddsData = getOddsData();

  // Get odds by sid
  const getOddsBySid = (sid: number) => {
    return (
      oddsData.find((item: any) => String(item.sid) === String(sid)) || null
    );
  };

  // Get odds for each betting option
  // K of spade - sid: 1
  const kSpade = getOddsBySid(1);
  // K of heart - sid: 2
  const kHeart = getOddsBySid(2);
  // K of club - sid: 3
  const kClub = getOddsBySid(3);
  // K of diamond - sid: 4
  const kDiamond = getOddsBySid(4);
  // Total Point - sid: 5
  const totalPoint = getOddsBySid(5);
  // Total Card - sid: 6
  const totalCard = getOddsBySid(6);
  // Win with 5 - sid: 7
  const winWith5 = getOddsBySid(7);
  // Win with 6 - sid: 8
  const winWith6 = getOddsBySid(8);
  // Win with 7 - sid: 9
  const winWith7 = getOddsBySid(9);
  // Win with 15 - sid: 10
  const winWith15 = getOddsBySid(10);
  // Win with 16 - sid: 11
  const winWith16 = getOddsBySid(11);
  // Win with 17 - sid: 12
  const winWith17 = getOddsBySid(12);

  // Handle clicking on individual result to show details


  // Function to filter user bets based on selected filter


  // Map win value to display info
  // win "1" = K of spade, "2" = K of heart, "3" = K of club, "4" = K of diamond
  const getResultDisplay = (win: string) => {
    // Find the odds data for this win value (win is the sid)
    const odd = oddsData.find((item: any) => String(item.sid) === String(win));

    if (odd) {
      // Use the nat field from odds data
      const nat = odd.nat || "";
      // Extract suit letter (S, H, C, D)
      let suitLetter = "";
      if (nat.includes("spade")) suitLetter = HH;
      else if (nat.includes("heart")) suitLetter = DD; //heart
      else if (nat.includes("club")) suitLetter = CC;
      else if (nat.includes("diamond")) suitLetter = SS;
      else suitLetter = KSS;

      return {
        label: suitLetter,
        color: "text-yellow-500",
        title: nat,
      };
    }

    // Fallback mapping
    const winMap: {
      [key: string]: { label: string; color: string; title: string };
    } = {
      "1": { label: HH, color: "text-white", title: "K of spade" },
      "2": { label: DD, color: "text-white", title: "K of heart" },
      "3": { label: CC, color: "text-white", title: "K of club" },
      "4": { label: SS, color: "text-white", title: "K of diamond" },
    };

    return (
      winMap[win] || { label: win, color: "text-gray-400", title: "Unknown" }
    );
  };

  // Render K card betting section
  const renderKCardSection = (
    imageSrc: any,
    oddsItem: any,
    sid: number
  ) => {
    const locked = isLocked(oddsItem);
    const backOdds = formatOdds(oddsItem?.b);
    const layOdds = formatOdds(oddsItem?.l);

  return (
        <div className="flex items-center justify-center flex-col w-full gap-1">
          <h1 className="text-sm font-semibold text-black text-center">
          <img src={imageSrc} className="w-8" alt="" />
          </h1>
          <div className="flex w-full gap-1 relative">
            {/* Back Odds */}
            <h2
              className={`text-sm w-full font-semibold text-black text-center leading-10 bg-[var(--bg-back)] relative ${
              ""
            }`}
            
          >
            {locked && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
          <RiLockFill className="text-white text-lg" />
        </div>
            )}
            {backOdds}
            </h2>
            {/* Lay Odds */}
            <h2
              className={`text-sm w-full font-semibold text-black text-center leading-10 bg-[var(--bg-lay)] relative ${
              ""
            }`}
            
          >
            {locked && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
          <RiLockFill className="text-white text-lg" />
        </div>
            )}
            {layOdds}
            </h2>
          </div>
        </div>
    );
  };

  // Render Yes/No betting section (for Total Point and Total Card)
  const renderYesNoSection = (
    label: string,
    oddsItem: any,
    sid: number
  ) => {
    const locked = isLocked(oddsItem);
    const backOdds = formatOdds(oddsItem?.b);

    const layOdds = formatOdds(oddsItem?.l);

    return (
      <tr>
        <td className="w-1/3 min-w-24">
          <h2 className="text-sm font-semibold leading-6 text-center">
            {label}
          </h2>
        </td>
        <td
          className={`w-1/3 min-w-14 bg-[var(--bg-back)] relative ${
            ""
          }`}
          
        >
          {locked && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
              <RiLockFill className="text-white text-sm" />
        </div>
          )}
          <h2 className="text-sm font-semibold leading-6 text-center">
            {backOdds}
            </h2>
          <h2 className="text-xs font-normal leading-4 text-center">
            {oddsItem?.bs || 0}
            </h2>
        </td>
        <td
          className={`w-1/3 min-w-14 bg-[var(--bg-lay)] relative ${
            ""
          }`}
          
        >
          {locked && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
              <RiLockFill className="text-white text-sm" />
        </div>
          )}
          <h2 className="text-sm font-semibold leading-6 text-center">
            {layOdds}
            </h2>
          <h2 className="text-xs font-normal leading-4 text-center">
            {oddsItem?.ls || 0}
            </h2>
        </td>
      </tr>
    );
  };

  // Render Win with X section
  const renderWinWithSection = (
    label: string,
    oddsItem: any,
    sid: number
  ) => {
    const locked = isLocked(oddsItem);
    const backOdds = formatOdds(oddsItem?.b);

    return (
      <div className="col-span-1">
        <h2 className="text-sm font-semibold leading-6 text-center">
          {label}
            </h2>
        <h2
          className={`w-full bg-[var(--bg-back)] flex justify-center items-center leading-8 relative ${
            ""
          }`}
          
        >
          {locked && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
              <RiLockFill className="text-white text-sm" />
        </div>
          )}
          {backOdds}
            </h2>
          </div>
    );
  };

  return (
    <div className="flex flex-col gap-1.5">
      {/* First row - K cards */}
      <div className="grid md:grid-cols-4 grid-cols-2 gap-1">
        {renderKCardSection(KHH, kHeart, 2)}
        {renderKCardSection(KDD, kDiamond, 4)}
        {renderKCardSection(KCC, kClub, 3)}
        {renderKCardSection(KSS, kSpade, 1)}
      </div>

      {/* Second row */}
      <div className="grid md:grid-cols-5 grid-cols-1 md:gap-1 gap-0.5">
        <div className="col-span-2 py-2 bg-gray-50 border-gray-200 border">
          <table className="border-separate border-spacing-y-1 w-full">
            <thead>
              <tr>
                <th className="w-1/3 min-w-26 border-gray-300"></th>
                <th className="w-1/3 border-gray-300">
                  <h2 className="w-full min-w-14">Yes</h2>
                </th>
                <th className="w-1/3 border-gray-300">
                  <h2 className="w-full min-w-14">No</h2>
                </th>
              </tr>
            </thead>
            <tbody className="">
              {renderYesNoSection("Total Point", totalPoint, 5)}
              {renderYesNoSection("Total Card", totalCard, 6)}
            </tbody>
          </table>
        </div>
        <div className="col-span-3 py-2 bg-gray-50 border-gray-200 border">
          <div className="grid grid-cols-3 gap-1 px-1">
            {renderWinWithSection("Win with 5", winWith5, 7)}
            {renderWinWithSection("Win with 6", winWith6, 8)}
            {renderWinWithSection("Win with 7", winWith7, 9)}
            {renderWinWithSection("Win with 15", winWith15, 10)}
            {renderWinWithSection("Win with 16", winWith16, 11)}
            {renderWinWithSection("Win with 17", winWith17, 12)}
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="mt-1 flex flex-col gap-1">
        <div className="bg-[var(--bg-secondary85)] border border-gray-300 flex justify-between px-2 py-0.5 items-center">
          <h2 className="text-sm font-normal leading-8 text-white">
            Last Result
          </h2>
        
          <h2 onClick={() => navigate(`/casino-result?game=${gameSlug}`)} className="text-sm font-normal leading-8 text-white hover:text-gray-200">
            View All
          </h2>
        </div>
        <div className="flex justify-end items-center mb-2 gap-2 mx-2 flex-wrap">
          {Array.isArray(results) && results.length > 0 ? (
            results.slice(0, 10).map((item: any, index: number) => {
              const resultDisplay = getResultDisplay(item.win || "");
              return (
                <div
                  key={item.mid || `result-${item.win}-${index}`}
                  className={`h-7 w-7 bg-gray-50 inner-shadow rounded-full border border-gray-300 flex justify-center items-center text-xs font-semibold ${resultDisplay.color} hover:scale-110 transition-transform`}
                  
                >
                 <img src={resultDisplay.label} className="w-4" alt="" />
                </div>
              );
            })
          ) : (
            <div className="text-gray-400 text-sm py-2">
              No results available
            </div>
          )}
        </div>
      </div>

      {/* Individual Result Details Modal */}
      {/* <IndividualResultModal
        isOpen={resultModal.isOpen}
        onClose={resultModal.closeModal}
        resultId={resultModal.selectedResultId || undefined}
        gameType={normalizedGameSlug}
        title="Race 20 Result Details"
        enableBetFiltering={true}
        customGetFilteredBets={getFilteredBets}
      /> */}
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const Race20 = memoizeCasinoComponent(Race20Component);
Race20.displayName = "Race20";

export default Race20;
