import React from "react";

const Bet = () => {
  return (
    <div className="flex flex-col">
      <div className="bg-[var(--bg-secondary70)] py-1 px-3 flex items-center rounded-t justify-between">
        <h2 className="text-xs tracking-tighter leading-6 uppercase text-white">
          My Bets
        </h2>
        <button className="bg-[var(--bg-secondary)] text-white px-2 py-1 text-xs">
          View More
        </button>
      </div>
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-xs tracking-tight leading-6 font-normal">
              UserName{" "}
            </th>
            <th className="text-xs tracking-tight leading-6 font-normal">
              Nation
            </th>
            <th className="text-xs tracking-tight leading-6 font-normal">
              Rate
            </th>
            <th className="text-xs tracking-tight leading-6 font-normal">
              Amount
            </th>

            <th className="text-xs tracking-tight leading-6 font-normal">
              PlaceDate
            </th>
            <th className="text-xs tracking-tight leading-6 font-normal">
              Gametype
            </th>
          </tr>
        </thead>
        <tbody></tbody>
        <tr>
          <td colSpan={6} className="text-center text-xs leading-6 bg-gray-200">
            No records found
          </td>
        </tr>
      </table>
    </div>
  );
};

export default Bet;
