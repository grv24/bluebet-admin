import React, { useState } from "react";

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

const CurrentBet = () => {
  const [tab, setTab] = useState<"sports" | "casino">("sports");
  const [sportsStatus, setSportsStatus] = useState<"Matched" | "Deleted">("Matched");
  const [betType, setBetType] = useState<"All" | "Back" | "Lay">("All");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);

  // Pagination (empty for now)
  const totalPages = 1;

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
              Total Soda: 0 &nbsp; Total Amount: 0.00
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
              <tr>
                <td
                  colSpan={tab === "sports" ? sportsColumns.length : casinoColumns.length}
                  className="text-center py-6 text-gray-500 border border-[#e0e0e0]"
                >
                  No data available in table
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex flex-wrap justify-end items-center gap-2 w-full mt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="bg-gray-200 rounded px-3 py-1 disabled:opacity-60"
          >
            &lt;
          </button>
          <span className="min-w-[32px] text-center font-medium text-base">
            {page}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="bg-gray-200 rounded px-3 py-1 disabled:opacity-60"
          >
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
};

export default CurrentBet;