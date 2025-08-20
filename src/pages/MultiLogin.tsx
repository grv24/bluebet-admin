import React, { useState } from "react";

const privilegeList = [
  "All",
  "Current Bets",
  "Withdraw",
  "active user",
  "DashBoard",
  "Casino Result",
  "Deposit",
  "Agent Assign",
  "Market Analysis",
  "Live Casino Result",
  "Credit Reference",
  "User List",
  "Our Casino",
  "User Info",
  "Insert User",
  "Events",
  "User Password Change",
  "Account Statement",
  "Market Search Analysis",
  "User Lock",
  "Party Win Loss",
  "Login User creation",
  "Bet Lock",
];

const tableColumns = [
  "Action",
  "Username",
  "Full Name",
  "DashBoard",
  "Market Analysis",
  "User List",
  "Insert User",
  "Account Statement",
  "Party Win Loss",
  "Current Bets",
  "Casino Result",
  "Live Casino Result",
  "Our Casino",
  // Add more as needed for scrolling
];

const MultiLogin: React.FC = () => {
  const [privileges, setPrivileges] = useState<string[]>([]);

  return (
    <div className="p-2 sm:p-4 bg-[#fafafa] min-h-screen">
      <h2 className="m-0 text-lg font-normal mb-2">Multi Login Account</h2>
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        {/* Personal Info */}
        <div className="mb-4">
          <div className="text-base font-medium mb-1">Personal Information</div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Client ID</label>
              <input className="border border-gray-300 rounded px-3 py-2 text-sm focus:border-gray-300 focus:ring-0 outline-none transition" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Full Name</label>
              <input className="border border-gray-300 rounded px-3 py-2 text-sm focus:border-gray-300 focus:ring-0 outline-none transition" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Password</label>
              <input type="password" className="border border-gray-300 rounded px-3 py-2 text-sm focus:border-gray-300 focus:ring-0 outline-none transition" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Confirm Password</label>
              <input type="password" className="border border-gray-300 rounded px-3 py-2 text-sm focus:border-gray-300 focus:ring-0 outline-none transition" />
            </div>
          </div>
        </div>
        {/* Privileges */}
        <div className="mb-4">
          <div className="text-base font-medium mb-1">Privileges</div>
          <div className="bg-[#f5f5f5] rounded p-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-2">
              {privilegeList.map((priv) => (
                <label key={priv} className="flex items-center gap-2 text-sm font-medium cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={privileges.includes(priv)}
                    onChange={() => {
                      setPrivileges((prev) =>
                        prev.includes(priv)
                          ? prev.filter((p) => p !== priv)
                          : [...prev, priv]
                      );
                    }}
                    className="sr-only"
                  />
                  <span
                    tabIndex={0}
                    role="checkbox"
                    aria-checked={privileges.includes(priv)}
                    onKeyDown={e => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        setPrivileges((prev) =>
                          prev.includes(priv)
                            ? prev.filter((p) => p !== priv)
                            : [...prev, priv]
                        );
                        e.preventDefault();
                      }
                    }}
                    onClick={() => {
                      setPrivileges((prev) =>
                        prev.includes(priv)
                          ? prev.filter((p) => p !== priv)
                          : [...prev, priv]
                      );
                    }}
                    className={`w-5 h-5 flex items-center justify-center bg-black rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-400`}
                  >
                    {privileges.includes(priv) && (
                      <svg width="16" height="16" viewBox="0 0 16 16" className="pointer-events-none" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 8.5L7 11.5L12 5.5" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span>{priv}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        {/* Transaction Code and Buttons */}
        <div className="flex flex-col sm:flex-row justify-end items-center gap-2 mt-4">
          <input
            type="text"
            placeholder="Transaction Code"
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:border-gray-300 focus:ring-0 outline-none transition w-full sm:w-auto"
          />
          <button className="px-6 leading-9 w-full sm:w-auto cursor-pointer rounded font-medium text-white text-sm bg-[#2ecc71] hover:opacity-90 transition">
            Submit
          </button>
          <button className="px-6 leading-9 w-full sm:w-auto cursor-pointer rounded font-medium text-white text-sm bg-[#74788d] hover:opacity-90 transition">
            Reset
          </button>
        </div>
      </div>
      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full min-w-[1200px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="bg-[#f5f5f5] text-left">
              {tableColumns.map((col) => (
                <th key={col} className="py-2 px-2 font-semibold border border-[#e0e0e0] whitespace-nowrap">{col}</th>
              ))}
            </tr>
          </thead>
        </table>
      </div>
    </div>
  );
};

export default MultiLogin;