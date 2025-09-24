import React, { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCookies } from "react-cookie";
import { getUserCurrentBet } from "@/helper/user";
import { getDecodedTokenData, getUserType } from "@/helper/auth";
import toast from "react-hot-toast";

const pageSizeOptions = [25, 50, 100];

const sportsColumns = [
  "Event Type",
  "Event Name",
  "User Name",
  "M Name",
  "Nation",
  "Series Name",
  "Odd Type",
  "User Rate",
  "Amount",
  "Place Date",
  "Result",
  "Profit/Loss",
  "Action",
];

const casinoColumns = [
  "Event Name",
  "User Name",
  "Nation",
  "User Rate",
  "Amount",
  "Place Date",
  "Result",
  "Profit/Loss",
];

interface BetData {
  id: string;
  userId: string;
  userType: string;
  eventId: string;
  sId: string;
  status: string;
  betData: {
    sid: number;
    loss: number;
    name: string;
    stake: number;
    profit: number;
    betName: string;
    betRate: number;
    eventId: string;
    oddType: string;
    boxColor: string;
    gameDate: string;
    matchOdd: number;
    placedAt: string;
    eventName: string;
    otherInfo: {
      newExposure: number;
      [key: string]: any;
    };
    sportType: string;
    oddSubType?: string;
    seriesName: string;
    oddCategory: string;
    matchOddVariant: string;
    marketType?: string;
    marketVariant?: string;
    result?: {
      stake: number;
      status: string;
      betRate: number;
      settled: boolean;
      isWinner: boolean;
      marketId: string;
      settledAt: string;
      marketName: string;
      marketType: string;
      profitLoss: number;
      finalResult: any;
      originalStake: number;
      calculatedLoss: number;
      calculatedProfit: number;
    };
  };
  createdAt: string;
  updatedAt: string;
  userDetails?: {
    id: string;
    userName: string;
    loginId: string;
    mobile: string | null;
    balance: number;
    exposure: number;
    isActive: boolean;
    createdAt: string;
  };
}

interface CurrentBetResponse {
  success: boolean;
  message: string;
  bets: BetData[];
}

interface SettlementModalState {
  isOpen: boolean;
  bet: BetData | null;
  result: "won" | "lost" | "";
  resultValue: string;
}

const CurrentBet = () => {
  const [cookies] = useCookies(["Admin", "TechAdmin", "token"]);
  const [tab, setTab] = useState<"sports" | "casino">("sports");
  const [sportsStatus, setSportsStatus] = useState<"Matched" | "Deleted" | "Settled">("Matched");
  const [betType, setBetType] = useState<"All" | "Back" | "Lay">("All");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const [settlementModal, setSettlementModal] = useState<SettlementModalState>({
    isOpen: false,
    bet: null,
    result: "",
    resultValue: ""
  });

  // Get decoded token data
  const decodedData = getDecodedTokenData(cookies);
  const userId = decodedData?.user?.userId;
  const userType = getUserType();

  // Fetch current bet data using React Query
  const {
    data: betData,
    isLoading,
    error,
    refetch,
  } = useQuery<CurrentBetResponse>({
    queryKey: ["currentBet", userId, tab, sportsStatus, betType, page, pageSize],
    queryFn: async (): Promise<CurrentBetResponse> => {
      console.log("🔍 [DEBUG] Fetching current bet data...");
      const response = await getUserCurrentBet({
        cookies,
      });
      console.log("🔍 [DEBUG] API Response:", response);
      return response as CurrentBetResponse;
    },
    enabled: !!userId,
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  console.log("🔍 [DEBUG] React Query state:", { isLoading, error, betData, userId });

  // Filter and transform data
  const filteredData = useMemo((): BetData[] => {
    if (!betData?.bets || !Array.isArray(betData.bets)) {
      console.log("🔍 [DEBUG] No bets data available:", betData);
      return [];
    }

    console.log("🔍 [DEBUG] Raw bets data:", betData.bets);
    let filtered = betData.bets;

    // Filter by tab (sports/casino)
    if (tab === "sports") {
      filtered = filtered.filter((bet: BetData) => 
        bet.betData.oddType === "match_odds" || 
        bet.betData.oddType === "first_innings" ||
        bet.betData.oddType === "fancy"
      );
      console.log("🔍 [DEBUG] Sports bets after oddType filter:", filtered);
    } else {
      // Casino bets would be different oddType values
      filtered = filtered.filter((bet: BetData) => 
        bet.betData.oddType !== "match_odds" && 
        bet.betData.oddType !== "first_innings" &&
        bet.betData.oddType !== "fancy"
      );
      console.log("🔍 [DEBUG] Casino bets after oddType filter:", filtered);
    }

    // Filter by sports status (only for sports tab)
    if (tab === "sports" && sportsStatus) {
      if (sportsStatus === "Matched") {
        // Show only pending bets for "Matched" section
        filtered = filtered.filter((bet: BetData) => bet.status === "pending");
        console.log("🔍 [DEBUG] After Matched filter (pending only):", filtered);
      } else if (sportsStatus === "Deleted") {
        // Show only cancelled/deleted bets for "Deleted" section
        filtered = filtered.filter((bet: BetData) => bet.status === "cancelled" || bet.status === "deleted");
        console.log("🔍 [DEBUG] After Deleted filter (cancelled/deleted only):", filtered);
      } else if (sportsStatus === "Settled") {
        // Show only settled bets for "Settled" section
        filtered = filtered.filter((bet: BetData) => bet.status === "settled" || bet.status === "won" || bet.status === "lost");
        console.log("🔍 [DEBUG] After Settled filter (settled/won/lost only):", filtered);
      }
    }

    // Filter by bet type
    if (betType !== "All") {
      if (betType === "Back") {
        // Show only Back bets
        filtered = filtered.filter((bet: BetData) => bet.betData.oddCategory === "Back");
        console.log("🔍 [DEBUG] After Back filter:", filtered);
      } else if (betType === "Lay") {
        // Show only Lay bets
        filtered = filtered.filter((bet: BetData) => bet.betData.oddCategory === "Lay");
        console.log("🔍 [DEBUG] After Lay filter:", filtered);
      }
    }

    // Filter by search term
    if (search.trim()) {
      const searchTerm = search.toLowerCase();
      filtered = filtered.filter(
        (bet: BetData) =>
          bet.betData.betName.toLowerCase().includes(searchTerm) ||
          bet.betData.name.toLowerCase().includes(searchTerm) ||
          bet.betData.eventName.toLowerCase().includes(searchTerm)
      );
      console.log("🔍 [DEBUG] After search filter:", filtered);
    }

    console.log("🔍 [DEBUG] Final filtered data:", filtered);
    return filtered;
  }, [betData?.bets, tab, sportsStatus, betType, search]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // Calculate totals
  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc: { totalAmount: number; totalBets: number }, bet: BetData) => {
        acc.totalAmount += bet.betData.stake;
        acc.totalBets += 1;
        return acc;
      },
      { totalAmount: 0, totalBets: 0 }
    );
  }, [filteredData]);

  // Action handlers
  const handleSettleBet = useCallback((bet: BetData) => {
    console.log("🔍 [DEBUG] Settle bet clicked:", bet);
    setSettlementModal({
      isOpen: true,
      bet: bet,
      result: "",
      resultValue: ""
    });
  }, []);

  const handleCloseSettlementModal = useCallback(() => {
    setSettlementModal({
      isOpen: false,
      bet: null,
      result: "",
      resultValue: ""
    });
  }, []);

  const handleSettlementResult = useCallback((result: "won" | "lost") => {
    setSettlementModal(prev => ({
      ...prev,
      result: result
    }));
  }, []);

  const handleResultValueChange = useCallback((value: string) => {
    setSettlementModal(prev => ({
      ...prev,
      resultValue: value
    }));
  }, []);

  const handleProceedSettlement = useCallback(async () => {
    if (!settlementModal.bet || !settlementModal.result) {
      toast.error("Please select a result (Won/Lost)");
      return;
    }

    if (!settlementModal.resultValue.trim()) {
      toast.error("Please enter a result value");
      return;
    }

    try {
      console.log("🔍 [DEBUG] Proceeding settlement:", {
        betId: settlementModal.bet.id,
        result: settlementModal.result,
        resultValue: settlementModal.resultValue
      });
      
      // TODO: Implement settlement API call
      // const response = await settleBet({
      //   betId: settlementModal.bet.id,
      //   result: settlementModal.result,
      //   resultValue: settlementModal.resultValue
      // });

      toast.success(`Bet settled as ${settlementModal.result} with result: ${settlementModal.resultValue}!`);
      handleCloseSettlementModal();
      refetch();
    } catch (error) {
      console.error("Settlement error:", error);
      toast.error("Failed to settle bet. Please try again.");
    }
  }, [settlementModal, refetch, handleCloseSettlementModal]);

  const handleDeleteBet = useCallback(async () => {
    if (!settlementModal.bet) return;

    try {
      console.log("🔍 [DEBUG] Deleting bet:", settlementModal.bet.id);
      
      // TODO: Implement delete bet API call
      // const response = await deleteBet(settlementModal.bet.id);

      toast.success("Bet deleted successfully!");
      handleCloseSettlementModal();
      refetch();
    } catch (error) {
      console.error("Delete bet error:", error);
      toast.error("Failed to delete bet. Please try again.");
    }
  }, [settlementModal.bet, refetch, handleCloseSettlementModal]);


  return (
    <div className="p-2 sm:p-4 bg-[#fafafa] min-h-screen">
      <h2 className="m-0 text-lg font-normal mb-2">Current Bets</h2>
      
     
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-2 border-b border-gray-200">
        <button
          className={`px-4 sm:px-6 py-2 text-sm font-medium border-b-2 transition-all ${tab === "sports" ? "border-[var(--bg-primary)] text-[var(--bg-primary)] bg-white" : "border-transparent text-gray-500 bg-transparent"}`}
          onClick={() => setTab("sports")}
        >
          Sports
        </button>
        <button
          className={`px-4 sm:px-6 py-2 text-sm font-medium border-b-2 transition-all ${tab === "casino" ? "border-[var(--bg-primary)] text-[var(--bg-primary)] bg-white" : "border-transparent text-gray-500 bg-transparent"}`}
          onClick={() => setTab("casino")}
        >
          Casino
        </button>
      </div>
      <div className="bg-white rounded-lg shadow p-2 sm:p-4">
        {/* Filters */}
        <div className="flex flex-col lg:flex-row flex-wrap gap-2 sm:gap-4 mb-2 w-full">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full lg:w-auto">
            {tab === "sports" && (
              <div className="flex flex-row gap-2 items-center">
                <label className="flex items-center gap-1 text-sm font-medium">
                  <input
                    type="radio"
                    checked={sportsStatus === "Matched"}
                    onChange={() => setSportsStatus("Matched")}
                  />
                  Matched
                </label>
                <label className="flex items-center gap-1 text-sm font-medium">
                  <input
                    type="radio"
                    checked={sportsStatus === "Deleted"}
                    onChange={() => setSportsStatus("Deleted")}
                  />
                  Deleted
                </label>
                <label className="flex items-center gap-1 text-sm font-medium">
                  <input
                    type="radio"
                    checked={sportsStatus === "Settled"}
                    onChange={() => setSportsStatus("Settled")}
                  />
                  Settled
                </label>
              </div>
            )}
            <div className="flex flex-row gap-2 items-center">
              <label className="flex items-center gap-1 text-sm font-medium">
                <input
                  type="radio"
                  checked={betType === "All"}
                  onChange={() => setBetType("All")}
                />
                All
              </label>
              <label className="flex items-center gap-1 text-sm font-medium">
                <input
                  type="radio"
                  checked={betType === "Back"}
                  onChange={() => setBetType("Back")}
                />
                Back
              </label>
              <label className="flex items-center gap-1 text-sm font-medium">
                <input
                  type="radio"
                  checked={betType === "Lay"}
                  onChange={() => setBetType("Lay")}
                />
                Lay
              </label>
            </div>
          </div>
          <div className="flex flex-row gap-2 items-center w-full sm:w-auto">
            <button className="px-4 sm:px-6 leading-9 w-full sm:w-auto cursor-pointer rounded font-medium text-white text-sm bg-[var(--bg-primary)] hover:opacity-90 transition">
              Load
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 items-end sm:items-center w-full lg:ml-auto lg:w-auto">
            <div className="text-sm font-medium text-right w-full sm:w-auto">
              Total Bets: {totals.totalBets} &nbsp; Total Amount: {totals.totalAmount.toLocaleString()}
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm">Search:</span>
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-2 py-1 rounded border border-gray-300 min-w-[100px] sm:min-w-[120px] text-sm leading-6 w-full sm:w-auto"
              />
            </div>
          </div>
        </div>
        {/* Show entries */}
        <div className="flex flex-wrap items-center gap-2 mb-3 w-full">
          <span className="text-xs">Show</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="px-2 py-1 rounded border border-gray-300 text-xs"
          >
            {pageSizeOptions.map((opt) => (
              <option className="text-xs text-gray-500" key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <span className="text-xs">entries</span>
        </div>
        {/* Table */}
        <div className="overflow-x-auto rounded-lg w-full">
          <table className="w-full min-w-[700px] sm:min-w-[900px] border-separate border-spacing-0 text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#f5f5f5] text-left">
                {(tab === "sports" ? sportsColumns : casinoColumns).map((col) => (
                  <th
                    key={col}
                    className="py-2 px-2 font-semibold border border-[#e0e0e0] whitespace-nowrap min-w-[100px]"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={tab === "sports" ? sportsColumns.length : casinoColumns.length}
                    className="text-center py-6 text-gray-500 border border-[#e0e0e0]"
                  >
                    Loading...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={tab === "sports" ? sportsColumns.length : casinoColumns.length}
                    className="text-center py-6 text-red-500 border border-[#e0e0e0]"
                  >
                    Error loading data. <button onClick={() => refetch()} className="text-blue-500 underline">Try again</button>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={tab === "sports" ? sportsColumns.length : casinoColumns.length}
                  className="text-center py-6 text-gray-500 border border-[#e0e0e0]"
                >
                  No data available in table
                </td>
              </tr>
              ) : (
                paginatedData.map((bet: BetData, index: number) => (
                  <tr key={`${bet.id}-${index}`} className={`text-xs ${index % 2 === 0 ? "bg-white" : "bg-[#f9f9f9]"}`}>
                    {tab === "sports" ? (
                      <>
                        <td className="py-2 px-2 border border-[#e0e0e0]">{bet.betData.sportType || "-"}</td>
                        <td className="py-2 px-2 border border-[#e0e0e0]">{bet.betData.eventName || bet.betData.name}</td>
                        <td className="py-2 px-2 border border-[#e0e0e0]">{bet.userDetails?.userName || bet.userDetails?.loginId || "-"}</td>
                        <td className="py-2 px-2 border border-[#e0e0e0]">{bet.betData.marketVariant || "-"}</td>
                        <td className="py-2 px-2 border border-[#e0e0e0]">{bet.betData.betName}</td>
                        <td className="py-2 px-2 border border-[#e0e0e0]">{bet.betData.seriesName || "-"}</td>
                        <td className="py-2 px-2 border border-[#e0e0e0]">{bet.betData.oddType || "-"}</td>
                        <td className="py-2 px-2 border border-[#e0e0e0]">{bet.betData.betRate}</td>
                        <td className="py-2 px-2 border border-[#e0e0e0]">{bet.betData.stake.toLocaleString()}</td>
                        <td className="py-2 px-2 border border-[#e0e0e0]">{new Date(bet.betData.placedAt).toLocaleString()}</td>
                        <td className="py-2 px-2 border border-[#e0e0e0]">
                          {bet.betData.result ? (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              bet.betData.result.status === 'won' 
                                ? 'bg-green-100 text-green-800' 
                                : bet.betData.result.status === 'lost'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {bet.betData.result.status.toUpperCase()}
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="py-2 px-2 border border-[#e0e0e0]">
                          {bet.betData.result ? (
                            <span className={`font-medium ${
                              bet.betData.result.profitLoss >= 0 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {bet.betData.result.profitLoss >= 0 ? '+' : ''}{bet.betData.result.profitLoss.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="py-2 px-2 border border-[#e0e0e0]">
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleSettleBet(bet)}
                              className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                              title="Settle Bet"
                            >
                              Settle
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-2 px-2 border border-[#e0e0e0]">{bet.betData.eventName || bet.betData.name}</td>
                        <td className="py-2 px-2 border border-[#e0e0e0]">{bet.userDetails?.userName || bet.userDetails?.loginId || "-"}</td>
                        <td className="py-2 px-2 border border-[#e0e0e0]">{bet.betData.seriesName || "-"}</td>
                        <td className="py-2 px-2 border border-[#e0e0e0]">{bet.betData.betRate}</td>
                        <td className="py-2 px-2 border border-[#e0e0e0]">{bet.betData.stake.toLocaleString()}</td>
                        <td className="py-2 px-2 border border-[#e0e0e0]">{new Date(bet.betData.placedAt).toLocaleString()}</td>
                        <td className="py-2 px-2 border border-[#e0e0e0]">
                          {bet.betData.result ? (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              bet.betData.result.status === 'won' 
                                ? 'bg-green-100 text-green-800' 
                                : bet.betData.result.status === 'lost'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {bet.betData.result.status.toUpperCase()}
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="py-2 px-2 border border-[#e0e0e0]">
                          {bet.betData.result ? (
                            <span className={`font-medium ${
                              bet.betData.result.profitLoss >= 0 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {bet.betData.result.profitLoss >= 0 ? '+' : ''}{bet.betData.result.profitLoss.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex flex-wrap justify-between items-center gap-2 w-full mt-2">
          <div className="text-sm text-gray-600">
            Showing {paginatedData.length} of {filteredData.length} entries
          </div>
          <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
              className="bg-gray-200 rounded px-3 py-1 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
          >
              Previous
          </button>
            <span className="min-w-[80px] text-center font-medium text-base">
              Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
              className="bg-gray-200 rounded px-3 py-1 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
          >
              Next
          </button>
          </div>
        </div>
      </div>

      {/* Settlement Modal */}
      {settlementModal.isOpen && settlementModal.bet && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Settle Bet</h3>
              <button
                onClick={handleCloseSettlementModal}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>

            {/* Bet Details */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-3">Bet Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Event Type:</span>
                  <span className="font-medium">{settlementModal.bet.betData.sportType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Event Name:</span>
                  <span className="font-medium">{settlementModal.bet.betData.eventName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bet Name:</span>
                  <span className="font-medium">{settlementModal.bet.betData.betName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Series Name:</span>
                  <span className="font-medium">{settlementModal.bet.betData.seriesName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Odd Type:</span>
                  <span className="font-medium">{settlementModal.bet.betData.oddType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium capitalize">{settlementModal.bet.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bet Type:</span>
                  <span className="font-medium">{settlementModal.bet.betData.oddCategory}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Stake:</span>
                  <span className="font-medium">{settlementModal.bet.betData.stake.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rate:</span>
                  <span className="font-medium">{settlementModal.bet.betData.betRate}</span>
                </div>
              </div>
            </div>

            {/* Result Selection */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Select Result</h4>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="result"
                    value="won"
                    checked={settlementModal.result === "won"}
                    onChange={() => handleSettlementResult("won")}
                    className="text-green-500"
                  />
                  <span className="text-green-600 font-medium">Won</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="result"
                    value="lost"
                    checked={settlementModal.result === "lost"}
                    onChange={() => handleSettlementResult("lost")}
                    className="text-red-500"
                  />
                  <span className="text-red-600 font-medium">Lost</span>
                </label>
              </div>
              
              {/* Result Value Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Result Value
                </label>
                <input
                  type="text"
                  value={settlementModal.resultValue}
                  onChange={(e) => handleResultValueChange(e.target.value)}
                  placeholder="Enter result value (e.g., score, winner name, etc.)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleProceedSettlement}
                disabled={!settlementModal.result || !settlementModal.resultValue.trim()}
                className="flex-1 bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Proceed Settlement
              </button>
              <button
                onClick={handleDeleteBet}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Delete Bet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrentBet;