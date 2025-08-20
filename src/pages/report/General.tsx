import React, { useState } from "react";

const reportTypes = ["General Report"];

const General = () => {
  const [type, setType] = useState(reportTypes[0]);

  return (
    <div className="p-2 sm:p-4 bg-[#fafafa] min-h-screen">
      <h2 className="m-0 text-lg font-normal mb-2">General Report</h2>
      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-2 mb-4 w-full max-w-xl">
        <div className="flex flex-col w-full sm:w-auto">
          <label className="text-sm font-medium mb-1">Select Type</label>
          <select
            className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-500 focus:border-gray-300 focus:ring-0 outline-none transition w-full min-w-[180px]"
            value={type}
            onChange={e => setType(e.target.value)}
          >
            {reportTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <button className="px-6 leading-9 w-full sm:w-auto cursor-pointer rounded font-medium text-white text-sm bg-[var(--bg-primary)] hover:opacity-90 transition">
          Load
        </button>
      </div>
      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full min-w-[600px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="bg-[#f5f5f5] text-left">
              <th className="py-2 px-2 font-semibold border border-[#e0e0e0]">Sr.No</th>
              <th className="py-2 px-2 font-semibold border border-[#e0e0e0]">Name</th>
              <th className="py-2 px-2 font-semibold border border-[#e0e0e0]">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={3} className="text-center py-6 text-gray-500 border border-[#e0e0e0] bg-[#f0f4f8]">
                No data available in table
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default General;