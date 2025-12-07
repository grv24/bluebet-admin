import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCookies } from "react-cookie";
import toast from "react-hot-toast";
import useCasinoGames from "@/hooks/useCasinoGames";
import { SERVER_URL } from "@/helper/auth";
import CasinoMatchDetailsModal from "@/components/modals/CasinoMatchDetailsModal";

const pageSizeOptions = [25, 50, 100];

interface CasinoHistoryItem {
  roundId: string;
  winner: string;
  result: {
    mid: number;
    win: string;
  };
  dateAndTime: string;
  myBetDetails: any;
}

interface CasinoHistoryResponse {
  status: string;
  message: string;
  pagination: {
    page: number;
    limit: number;
    count: number;
    totalCount: number;
    totalPages: number;
  };
  results: CasinoHistoryItem[];
}

const fetchCasinoHistory = async (
  slug: string,
  page: number,
  limit: number,
  token: string,
  date?: string
): Promise<CasinoHistoryResponse> => {
  let url = `${SERVER_URL}/api/v1/casinos/history?slug=${slug}&page=${page}&limit=${limit}`;
  
  if (date) {
    url += `&date=${date}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch casino history");
  }

  return response.json();
};

const CasinoResult = () => {
  const [cookies] = useCookies(["Admin", "TechAdmin", "token"]);
  const { data: casinoGamesData } = useCasinoGames();
  const [date, setDate] = useState("");
  const [casino, setCasino] = useState("All");
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [shouldFetch, setShouldFetch] = useState(false);

  // Modal states
  const [isCasinoModalOpen, setIsCasinoModalOpen] = useState(false);
  const [casinoMatchData, setCasinoMatchData] = useState<any>(null);
  const [selectedCasinoType, setSelectedCasinoType] = useState<string>("");

  // Get token from cookies
  const token = cookies.Admin || cookies.TechAdmin || cookies.token;

  // Fetch casino history data
  const { data: historyResponse, isLoading, error, refetch } = useQuery({
    queryKey: ["casinoHistory", casino, page, pageSize, date],
    queryFn: () => fetchCasinoHistory(casino, page, pageSize, token, date),
    enabled: shouldFetch && casino !== "All" && !!token,
    staleTime: 0,
  });

  // Extract data from response
  const historyData = historyResponse?.results || [];
  const totalPages = historyResponse?.pagination?.totalPages || 1;
  const totalRecords = historyResponse?.pagination?.totalCount || 0;

  // Filter data based on search
  const filteredData = historyData.filter((item) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      item.roundId?.toLowerCase().includes(searchLower) ||
      item.winner?.toLowerCase().includes(searchLower)
    );
  });

  // Handle casino selection change
  const handleCasinoChange = (value: string) => {
    setCasino(value);
    setPage(1); // Reset to first page on new casino selection
    if (value !== "All") {
      setShouldFetch(true);
    } else {
      setShouldFetch(false);
    }
  };

  // Handle row click to show casino match details
  const handleRowClick = async (item: CasinoHistoryItem) => {
    try {
      const matchId = item.result.mid;
      const casinoType = casino; // Use the currently selected casino

      const response = await fetch(
        `${SERVER_URL}/api/v1/casinos/match-details?matchId=${matchId}&casinoType=${casinoType}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch match details');
      }

      const data = await response.json();
      console.log('Casino Match Details:', data);
      
      // Open casino modal
      setCasinoMatchData(data);
      setSelectedCasinoType(casinoType);
      setIsCasinoModalOpen(true);
      toast.success('Casino match details loaded');
      
    } catch (error) {
      console.error('Error fetching match details:', error);
      toast.error('Failed to load match details');
    }
  };

  // Handle error display
  React.useEffect(() => {
    if (error) {
      toast.error("Failed to load casino history");
    }
  }, [error]);

  return (
    <div className="p-2 sm:p-4 bg-[#fafafa] min-h-screen">
      <h2 className="m-0 text-lg font-normal mb-2">Casino Result Report</h2>
      {/* Filter Row */}
      <div className="flex flex-col md:flex-row flex-wrap gap-2 md:gap-4 mb-4 w-full items-end">
        <input
          type="date"
          className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-500 focus:border-gray-300 focus:ring-0 outline-none transition w-full md:w-[220px]"
          value={date}
          onChange={e => setDate(e.target.value)}
        />
        <select
          className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-500 focus:border-gray-300 focus:ring-0 outline-none transition w-full md:w-[220px]"
          value={casino}
          onChange={e => handleCasinoChange(e.target.value)}
        >
          <option value="All">All</option>
          {casinoGamesData?.data
            ?.filter((casinoGame: any) => casinoGame.isActive === true)
            .map((casinoGame: any) => (
              <option key={casinoGame.casinoGameCode} value={casinoGame.casinoGameCode}>
                {casinoGame.casinoGameName}
              </option>
          ))}
        </select>
      </div>
      {/* Show entries and search */}
      <div className="flex flex-wrap items-center gap-2 mb-3 w-full">
        <span className="text-xs">Show</span>
        <select
          value={pageSize}
          onChange={e => setPageSize(Number(e.target.value))}
          className="px-2 py-1 rounded border border-gray-300 text-xs"
        >
          {pageSizeOptions.map((opt) => (
            <option className="text-xs text-gray-500" key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <span className="text-xs">entries</span>
        <div className="ml-auto flex gap-2 items-center w-full sm:w-auto">
          <span className="text-sm">Search:</span>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-2 py-1 rounded border border-gray-300 min-w-[120px] text-sm leading-6 w-full sm:w-auto"
          />
        </div>
      </div>
      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow mb-4">
        <table className="w-full min-w-[600px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="bg-[#f5f5f5] text-left">
              <th className="py-2 px-2 font-semibold border border-[#e0e0e0]">Market Id</th>
              <th className="py-2 px-2 font-semibold border border-[#e0e0e0]">Winner</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={2} className="text-center py-6 text-gray-500 border border-[#e0e0e0]">
                  Loading data...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={2} className="text-center py-6 text-red-500 border border-[#e0e0e0]">
                  Error loading data
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
            <tr>
              <td colSpan={2} className="text-center py-6 text-gray-500 border border-[#e0e0e0] bg-[#f0f4f8]">
                No data available in table
              </td>
            </tr>
            ) : (
              filteredData.map((item, index) => (
                <tr 
                  key={item.roundId || index}
                  className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} cursor-pointer hover:bg-blue-50`}
                  onClick={() => handleRowClick(item)}
                >
                  <td className="py-1 px-2 text-sm border border-[#e0e0e0]">
                    {item.roundId}
                  </td>
                  <td className="py-1 px-2 text-sm border border-[#e0e0e0]">
                    {item.winner}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="flex flex-wrap justify-between items-center gap-2 w-full">
        <div className="text-sm text-gray-600">
          {filteredData.length > 0 && (
            <>Showing {filteredData.length} of {totalRecords} entries</>
          )}
        </div>
        <div className="flex items-center gap-2">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
            className="bg-gray-200 rounded px-3 py-1 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-gray-300 transition"
        >
            Previous
        </button>
          <span className="min-w-[80px] text-center font-medium text-base">
            Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || isLoading}
            className="bg-gray-200 rounded px-3 py-1 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-gray-300 transition"
        >
            Next
        </button>
        </div>
      </div>

      {/* Casino Match Details Modal */}
      <CasinoMatchDetailsModal
        isOpen={isCasinoModalOpen}
        onClose={() => {
          setIsCasinoModalOpen(false);
          setCasinoMatchData(null);
          setSelectedCasinoType("");
        }}
        matchData={casinoMatchData}
        casinoType={selectedCasinoType}
      />
    </div>
  );
};

export default CasinoResult;