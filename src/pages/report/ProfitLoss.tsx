import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCookies } from "react-cookie";
import toast from "react-hot-toast";
import { SERVER_URL } from "@/helper/auth";

const filterOptions = ["All", "User"];
const pageSizeOptions = [25, 50, 100];

interface ProfitLossItem {
  no: number;
  userName: string;
  level: string;
  casinoPts: string;
  sportPts: string;
  thirdPartyPts: string;
  profitLoss: string;
}

interface ProfitLossResponse {
  success: boolean;
  data: ProfitLossItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

const fetchProfitLoss = async (
  page: number,
  limit: number,
  token: string
): Promise<ProfitLossResponse> => {
  const url = `${SERVER_URL}/api/v1/admin/profit-loss?page=${page}&limit=${limit}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch profit loss data");
  }

  return response.json();
};

const ProfitLoss = () => {
  const [cookies] = useCookies(["Admin", "TechAdmin", "token"]);
  const [filter, setFilter] = useState(filterOptions[0]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [shouldFetch, setShouldFetch] = useState(false);

  // Get token from cookies
  const token = cookies.Admin || cookies.TechAdmin || cookies.token;

  // Fetch profit loss data
  const { data: profitLossResponse, isLoading, error, refetch } = useQuery({
    queryKey: ["profitLoss", page, pageSize],
    queryFn: () => fetchProfitLoss(page, pageSize, token),
    enabled: shouldFetch && !!token,
    staleTime: 0,
  });

  // Extract data from response
  const profitLossData = profitLossResponse?.data || [];
  const totalPages = profitLossResponse?.pagination?.totalPages || 1;
  const totalRecords = profitLossResponse?.pagination?.totalItems || 0;

  // Filter data based on search
  const filteredData = profitLossData.filter((item) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      item.userName?.toLowerCase().includes(searchLower) ||
      item.level?.toString().includes(searchLower)
    );
  });

  // Handle Load button click
  const handleLoad = () => {
    setPage(1); // Reset to first page
    setShouldFetch(true);
    setTimeout(() => refetch(), 0);
  };

  // Handle error display
  React.useEffect(() => {
    if (error) {
      toast.error("Failed to load profit loss data");
    }
  }, [error]);

  return (
    <div className="p-2 sm:p-4 bg-[#fafafa] min-h-screen">
      <h2 className="m-0 text-lg font-normal mb-2">Profit Loss</h2>
      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4 w-full items-end">
        <select
          className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-500 focus:border-gray-300 focus:ring-0 outline-none transition w-full sm:w-[220px]"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        >
          {filterOptions.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button 
          onClick={handleLoad}
          disabled={isLoading}
          className={`px-6 leading-9 w-full sm:w-auto cursor-pointer rounded font-medium text-white text-sm transition ${
            isLoading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-[var(--bg-primary)] hover:opacity-90'
          }`}
        >
          {isLoading ? 'Loading...' : 'Load'}
        </button>
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
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow mb-4">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="bg-[#f5f5f5]">
              <th className="py-2 px-2 font-semibold border border-[#e0e0e0] text-left">No</th>
              <th className="py-2 px-2 font-semibold border border-[#e0e0e0] text-left">User Name</th>
              <th className="py-2 px-2 font-semibold border border-[#e0e0e0] text-left">Level</th>
              <th className="py-2 px-2 font-semibold border border-[#e0e0e0] text-right">Casino Pts</th>
              <th className="py-2 px-2 font-semibold border border-[#e0e0e0] text-right">Sport Pts</th>
              <th className="py-2 px-2 font-semibold border border-[#e0e0e0] text-right">Third Party Pts</th>
              <th className="py-2 px-2 font-semibold border border-[#e0e0e0] text-right">Profit/Loss</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-6 text-gray-500 border border-[#e0e0e0]">
                  Loading data...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} className="text-center py-6 text-red-500 border border-[#e0e0e0]">
                  Error loading data
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-6 text-gray-500 border border-[#e0e0e0] bg-[#f0f4f8]">
                  No data available in table
                </td>
              </tr>
            ) : (
              filteredData.map((item, index) => (
                <tr 
                  key={index}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="py-2 px-2 text-sm border border-[#e0e0e0]">
                    {item.no}
                  </td>
                  <td className="py-2 px-2 text-sm border border-[#e0e0e0]">
                    {item.userName}
                  </td>
                  <td className="py-2 px-2 text-sm border border-[#e0e0e0]">
                    {item.level}
                  </td>
                  <td className="py-2 px-2 text-sm text-right border border-[#e0e0e0]">
                    {item.casinoPts}
                  </td>
                  <td className="py-2 px-2 text-sm text-right border border-[#e0e0e0]">
                    {item.sportPts}
                  </td>
                  <td className="py-2 px-2 text-sm text-right border border-[#e0e0e0]">
                    {item.thirdPartyPts}
                  </td>
                  <td className={`py-2 px-2 text-sm text-right border border-[#e0e0e0] font-medium`}>
                    {item.profitLoss}
                  </td>
                </tr>
              ))
            )}
            {/* Blank summary row */}
            {filteredData.length > 0 && (
              <tr>
                <td className="border border-[#e0e0e0] h-10 bg-white"></td>
                <td className="border border-[#e0e0e0] bg-white"></td>
                <td className="border border-[#e0e0e0] bg-white"></td>
                <td className="border border-[#e0e0e0] bg-white"></td>
                <td className="border border-[#e0e0e0] bg-white"></td>
                <td className="border border-[#e0e0e0] bg-white"></td>
                <td className="border border-[#e0e0e0] bg-white"></td>
              </tr>
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
    </div>
  );
};

export default ProfitLoss;