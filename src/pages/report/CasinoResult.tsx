import React, { useState } from "react";

const casinoOptions = ["Select Casino", "Casino 1", "Casino 2"];
const pageSizeOptions = [25, 50, 100];

const CasinoResult = () => {
  const [date, setDate] = useState("");
  const [casino, setCasino] = useState(casinoOptions[0]);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const totalPages = 1;

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
          onChange={e => setCasino(e.target.value)}
        >
          {casinoOptions.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button className="px-6 leading-9 w-full md:w-auto cursor-pointer rounded font-medium text-white text-sm bg-[var(--bg-primary)] hover:opacity-90 transition mt-2 md:mt-0">
          Submit
        </button>
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
            <tr>
              <td colSpan={2} className="text-center py-6 text-gray-500 border border-[#e0e0e0] bg-[#f0f4f8]">
                No data available in table
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="flex flex-wrap justify-end items-center gap-2 w-full">
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
  );
};

export default CasinoResult;