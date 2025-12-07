import React, { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCookies } from "react-cookie";
import { SERVER_URL } from "@/helper/auth";
import toast from "react-hot-toast";

const pageSizeOptions = [25, 50, 100];

const sportsColumns = [
  "Event Type",
  "Event Name",
  "User Name",
  "M Name",
  "Nation",
  "User Rate",
  "Amount",
  "Place Date",
];

const casinoColumns = [
  "Event Name",
  "User Name",
  "Nation",
  "User Rate",
  "Amount",
  "Place Date",
];

interface BetData {
  eventType: string;
    eventName: string;
    userName: string;
  mName: string;
  nation: string;
  userRate: string;
  amount: string;
  placeDate: string;
}

interface CurrentBetResponse {
  success: boolean;
  message?: string;
  data: BetData[];
  summary: {
    totalSoda: number;
    totalAmount: string;
  };
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}


const fetchCurrentBets = async (
  type: "sport" | "casino",
  page: number,
  limit: number,
  token: string,
  status?: "Matched" | "Deleted",
  betType?: "All" | "Back" | "Lay"
): Promise<CurrentBetResponse> => {
  let url = `${SERVER_URL}/api/v1/admin/current-bets?type=${type}&page=${page}&limit=${limit}`;
  
  if (status) {
    // Map "Matched" to "pending" and "Deleted" to "deleted" or "cancelled"
    const statusParam = status === "Matched" ? "pending" : "deleted";
    url += `&status=${statusParam}`;
  }
  
  if (betType && betType !== "All") {
    url += `&betType=${betType.toLowerCase()}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch current bets");
  }

  return response.json();
};

const CurrentBet = () => {
  const [cookies] = useCookies(["Admin", "TechAdmin", "token"]);
  const [tab, setTab] = useState<"sports" | "casino">("sports");
  const [sportsStatus, setSportsStatus] = useState<"Matched" | "Deleted">("Matched");
  const [betType, setBetType] = useState<"All" | "Back" | "Lay">("All");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const [shouldFetch, setShouldFetch] = useState(false);

  // Get token from cookies
  const token = cookies.Admin || cookies.TechAdmin || cookies.token;

  // Fetch current bet data using React Query
  const {
    data: betData,
    isLoading,
    error,
    refetch,
  } = useQuery<CurrentBetResponse>({
    queryKey: ["currentBet", tab, sportsStatus, betType, page, pageSize],
    queryFn: () => fetchCurrentBets(
      tab === "sports" ? "sport" : "casino",
      page,
      pageSize,
      token,
      sportsStatus,
      betType
    ),
    enabled: shouldFetch && !!token,
    staleTime: 0,
  });

  // Extract data from response
  const betsData = betData?.data || [];
  
  // Filter by search term (client-side)
  const filteredData = useMemo((): BetData[] => {
    if (!betsData || !Array.isArray(betsData)) {
      return [];
    }

    if (!search.trim()) {
      return betsData;
    }

      const searchTerm = search.toLowerCase();
    return betsData.filter(
        (bet: BetData) =>
        bet.eventName?.toLowerCase().includes(searchTerm) ||
        bet.userName?.toLowerCase().includes(searchTerm) ||
        bet.mName?.toLowerCase().includes(searchTerm) ||
        bet.eventType?.toLowerCase().includes(searchTerm)
    );
  }, [betsData, search]);

  // Pagination from API response
  const totalPages = betData?.pagination?.totalPages || 1;
  const totalRecords = betData?.pagination?.totalItems || 0;
  const paginatedData = filteredData;

  // Get totals from API summary
  const totals = {
    totalBets: betData?.summary?.totalSoda || 0,
    totalAmount: betData?.summary?.totalAmount || "0.00"
  };

  // Handle Load button click
  const handleLoad = () => {
    setPage(1); // Reset to first page
    setShouldFetch(true);
    setTimeout(() => refetch(), 0);
  };

  // Handle tab change
  const handleTabChange = (newTab: "sports" | "casino") => {
    setTab(newTab);
    setPage(1); // Reset to first page on tab change
    setShouldFetch(false); // Reset fetch state
  };

  // Handle error display
  React.useEffect(() => {
    if (error) {
      toast.error("Failed to load current bets");
    }
  }, [error]);


  return (
    <div className="p-2 sm:p-4 bg-[#fafafa] min-h-screen">
      <h2 className="m-0 text-lg font-normal mb-2">Current Bets</h2>
      
     
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-2 border-b border-gray-200">
        <button
          className={`px-4 sm:px-6 py-2 text-sm font-medium border-b-2 transition-all ${tab === "sports" ? "border-[var(--bg-primary)] text-[var(--bg-primary)] bg-white" : "border-transparent text-gray-500 bg-transparent"}`}
          onClick={() => handleTabChange("sports")}
        >
          Sports
        </button>
        <button
          className={`px-4 sm:px-6 py-2 text-sm font-medium border-b-2 transition-all ${tab === "casino" ? "border-[var(--bg-primary)] text-[var(--bg-primary)] bg-white" : "border-transparent text-gray-500 bg-transparent"}`}
          onClick={() => handleTabChange("casino")}
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
            <button 
              onClick={handleLoad}
              disabled={isLoading}
              className={`px-4 sm:px-6 leading-9 w-full sm:w-auto cursor-pointer rounded font-medium text-white text-sm transition ${
                isLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-[var(--bg-primary)] hover:opacity-90'
              }`}
            >
              {isLoading ? 'Loading...' : 'Load'}
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 items-end sm:items-center w-full lg:ml-auto lg:w-auto">
            <div className="text-sm font-medium text-right w-full sm:w-auto">
              Total Soda: {totals.totalBets} &nbsp; Total Amount: {totals.totalAmount}
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
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1); // Reset to first page
              if (shouldFetch) setTimeout(() => refetch(), 0);
            }}
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
          <table className="w-full min-w-[700px] sm:min-w-[900px] border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#f5f5f5] text-left">
                {(tab === "sports" ? sportsColumns : casinoColumns).map((col) => (
                  <th
                    key={col}
                    className="py-2 px-2 font-semibold text-xs border border-[#e0e0e0] whitespace-nowrap min-w-[100px]"
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
                  <tr key={`${bet.eventName}-${index}`} className={`text-xs ${index % 2 === 0 ? "bg-white" : "bg-[#f9f9f9]"}`}>
                    {tab === "sports" ? (
                      <>
                        <td className="py-2 px-2 border text-nowrap border-[#e0e0e0]">{bet.eventType || "-"}</td>
                        <td className="py-2 px-2 border text-nowrap border-[#e0e0e0]">{bet.eventName || "-"}</td>
                        <td className="py-2 px-2 border text-nowrap border-[#e0e0e0]">{bet.userName || "-"}</td>
                        <td className="py-2 px-2 border text-nowrap border-[#e0e0e0]">{bet.mName || "-"}</td>
                        <td className="py-2 px-2 border text-nowrap border-[#e0e0e0]">{bet.nation || "-"}</td>
                        <td className="py-2 px-2 border text-nowrap border-[#e0e0e0]">{bet.userRate || "0"}</td>
                        <td className="py-2 px-2 border text-nowrap border-[#e0e0e0]">{bet.amount || "0.00"}</td>
                        <td className="py-2 px-2 border text-nowrap border-[#e0e0e0]">{bet.placeDate || "-"}</td>
                      </>
                    ) : (
                      <>
                        <td className="py-2 px-2 border text-nowrap border-[#e0e0e0]">{bet.eventName || "-"}</td>
                        <td className="py-2 px-2 border text-nowrap border-[#e0e0e0]">{bet.userName || "-"}</td>
                        <td className="py-2 px-2 border text-nowrap border-[#e0e0e0]">{bet.nation || "-"}</td>
                        <td className="py-2 px-2 border text-nowrap border-[#e0e0e0]">{bet.userRate || "0"}</td>
                        <td className="py-2 px-2 border text-nowrap border-[#e0e0e0]">{bet.amount || "0.00"}</td>
                        <td className="py-2 px-2 border text-nowrap border-[#e0e0e0]">{bet.placeDate || "-"}</td>
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
            {filteredData.length > 0 && (
              <>Showing {paginatedData.length} of {totalRecords} entries</>
            )}
          </div>
          <div className="flex items-center gap-2">
          <button
              onClick={() => {
                setPage(1);
                if (shouldFetch) setTimeout(() => refetch(), 0);
              }}
              disabled={page === 1 || isLoading}
              className="bg-gray-200 rounded px-2 py-1 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors text-sm"
            >
              &lt;&lt;
            </button>
            <button
              onClick={() => {
                setPage((p) => Math.max(1, p - 1));
                if (shouldFetch) setTimeout(() => refetch(), 0);
              }}
              disabled={page === 1 || isLoading}
              className="bg-gray-200 rounded px-2 py-1 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors text-sm"
            >
              &lt;
          </button>
            <span className={`min-w-[32px] text-center font-medium text-base px-2 py-1 rounded ${
              page > 0 ? 'bg-[var(--bg-primary)] text-white' : 'bg-gray-200'
            }`}>
              {page}
          </span>
          <button
              onClick={() => {
                setPage((p) => Math.min(totalPages, p + 1));
                if (shouldFetch) setTimeout(() => refetch(), 0);
              }}
              disabled={page === totalPages || isLoading}
              className="bg-gray-200 rounded px-2 py-1 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors text-sm"
            >
              &gt;
            </button>
            <button
              onClick={() => {
                setPage(totalPages);
                if (shouldFetch) setTimeout(() => refetch(), 0);
              }}
              disabled={page === totalPages || isLoading}
              className="bg-gray-200 rounded px-2 py-1 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors text-sm"
            >
              &gt;&gt;
          </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrentBet;