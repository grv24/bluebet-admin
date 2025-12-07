import React, { useState, useRef } from "react";
import { FaFilePdf, FaFileExcel } from "react-icons/fa6";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { useQuery } from "@tanstack/react-query";
import { useCookies } from "react-cookie";
import { getAccountStatementWithFilters } from "@/helper/account_statement";
import { SERVER_URL } from "@/helper/auth";

const accountTypes = [
  "All",
  "Deposit/Withdraw Report",
  "Sports Report",
  "Casino Report",
  "Third Party Casino Report",
];
const sportListOptions = ["All", "Football", "Tennis", "Cricket"];
const casinoListOptions = ["All", "Casino 1", "Casino 2", "Casino 3"]; // Will be replaced with actual casino names
const pageSizeOptions = [25, 50, 100];

// Function to get game names based on account type
const getGameNamesByAccountType = (accountType: string): string[] => {
  switch (accountType) {
    case "Deposit/Withdraw Report":
      return ["All", "Upper", "Lower"];
    case "Sports Report":
      return [
        "All",
        "Match",
        "Match1",
        "Fancy",
        "Fancy1",
        "Meter",
        "Khado",
        "Diam11",
        "oddeven",
        "Player Battel",
        "cricket casino",
      ];
    case "All":
      return ["All"];
    default:
      return ["All", "Game 1", "Game 2"];
  }
};

const Statement = () => {
  const [cookies] = useCookies(["Admin", "TechAdmin", "token"]);
  const [accountType, setAccountType] = useState("All");
  const [gameName, setGameName] = useState("All");
  const [sportList, setSportList] = useState("All");
  const [casinoList, setCasinoList] = useState("All");
  const [clientName, setClientName] = useState("");
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [shouldFetch, setShouldFetch] = useState(false);
  const clientInputRef = useRef<HTMLInputElement>(null);
  
  // Sport modal states
  const [isSportModalOpen, setIsSportModalOpen] = useState(false);
  const [sportMatchData, setSportMatchData] = useState<any>(null);
  const [betFilter, setBetFilter] = useState("all");

  // Get dynamic game names based on account type
  const gameNames = getGameNamesByAccountType(accountType);

  // Get token from cookies
  const token = cookies.Admin || cookies.TechAdmin || cookies.token;

  // Helper function to filter bets
  const getFilteredBets = (bets: any[], filter: string) => {
    if (filter === "all") return bets;
    if (filter === "deleted") return bets.filter((bet) => bet.isDeleted);
    return bets.filter((bet) => {
      const betType = bet.betData?.betType?.toLowerCase() || bet.betData?.oddCategory?.toLowerCase() || "";
      return betType === filter;
    });
  };

  // Helper function to determine transaction type
  const getTransactionType = (description: string, betId: string | null) => {
    if (!betId) return null;

    // Sport transactions (CRICKET, FOOTBALL, TENNIS, etc.)
    const sportTypes = ['CRICKET', 'FOOTBALL', 'TENNIS'];
    for (const sport of sportTypes) {
      if (description.toUpperCase().startsWith(sport)) {
        return { type: 'sport', betId };
      }
    }

    // Casino transactions (has R.NO pattern)
    const matchIdMatch = description.match(/R\.NO\s*:\s*(\d+)/i);
    if (matchIdMatch) {
      const matchId = matchIdMatch[1];
      
      // Extract casino type (before " / R.NO")
      const casinoTypeMatch = description.match(/^([A-Z_0-9]+)\s*\//);
      if (casinoTypeMatch) {
        let casinoType = casinoTypeMatch[1].toLowerCase();
        // Remove trailing numbers (e.g., TEEN_3 -> teen, RACE20 -> race)
        casinoType = casinoType.replace(/_?\d+$/, '');
        return { type: 'casino', matchId, casinoType };
      }
    }

    return null;
  };

  // Handle row click for casino and sport transactions
  const handleRowClick = async (row: any) => {
    const transactionDetails = getTransactionType(row.description, row.betId);
    
    if (!transactionDetails) {
      console.log('Not a casino or sport transaction');
      return;
    }

    try {
      let response;
      
      if (transactionDetails.type === 'casino') {
        // Casino API call
        const { matchId, casinoType } = transactionDetails;
        response = await fetch(
          `${SERVER_URL}/api/v1/casinos/match-details?matchId=${matchId}&casinoType=${casinoType}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
      } else if (transactionDetails.type === 'sport') {
        // Sport API call
        const { betId } = transactionDetails;
        response = await fetch(
          `${SERVER_URL}/api/v1/sports/match-details/${betId}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      if (!response || !response.ok) {
        throw new Error('Failed to fetch match details');
      }

      const data = await response.json();
      console.log(`${transactionDetails.type.toUpperCase()} Match Details:`, data);
      
      if (transactionDetails.type === 'sport') {
        // Open modal for sport transactions
        setSportMatchData(data);
        setIsSportModalOpen(true);
        toast.success('Sport match details loaded');
      } else {
        toast.success('Casino match details loaded - check console');
        // TODO: Show casino match details in modal
      }
      
    } catch (error) {
      console.error('Error fetching match details:', error);
      toast.error('Failed to load match details');
    }
  };

  // Fetch account statement data
  const { data: statementResponse, isLoading, error, refetch } = useQuery({
    queryKey: ["accountStatement", accountType, sportList, casinoList, gameName, fromDate, toDate, page, pageSize],
    queryFn: () => getAccountStatementWithFilters(cookies, {
      accountType,
      sportType: accountType === "Sports Report" ? sportList : undefined,
      gameName: accountType === "Casino Report" ? casinoList : gameName,
      startdate: fromDate,
      enddate: toDate,
      page,
      limit: pageSize,
      token,
    }),
    enabled: shouldFetch && !!token,
    staleTime: 0,
  });

  // Extract data from response
  const statementData = statementResponse?.data?.transactions || [];
  const totalPages = statementResponse?.data?.pagination?.totalPages || 1;
  const totalRecords = statementResponse?.data?.pagination?.total || 0;
  const summary = statementResponse?.data?.summary;

  // Table columns
  const columns = [
    "Date",
    "Credit",
    "Debit",
    "Closing",
    "Description",
    "Fromto",
  ];

  // No client options for now
  const clientOptions: string[] = [];

  // Handle Load button click
  const handleLoad = () => {
    setShouldFetch(true);
    setTimeout(() => refetch(), 0);
  };

  /**
   * Export statement data to PDF
   */
  const exportToPDF = (data: any[]) => {
    try {
      console.log("📄 Starting PDF export with data:", data.length, "records");
      
      const doc = new jsPDF('landscape', 'mm', 'a4');
      
      // Add title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Account Statement Report', 14, 20);
      
      // Add subtitle
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 14, 30);
      doc.text(`Account Type: ${accountType}`, 14, 35);
      doc.text(`Game Name: ${gameName}`, 14, 40);
      if (fromDate && toDate) {
        doc.text(`Period: ${fromDate} to ${toDate}`, 14, 45);
      }
      doc.text(`Total Records: ${data.length}`, 14, 50);
      
      // Prepare table data
      const tableData = data.map((row) => {
        return [
          row.date,
          row.credit ? Number(row.credit).toFixed(2) : '',
          row.debit ? Number(row.debit).toFixed(2) : '',
          Number(row.closing).toFixed(2),
          row.description,
          row.fromTo || '',
        ];
      });
      
      // Table headers
      const headers = ['Date', 'Credit', 'Debit', 'Closing', 'Description', 'From/To'];
      
      console.log("📊 Creating PDF table with headers:", headers.length, "columns");
      
      // Create table
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: 60,
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: 'linebreak',
          halign: 'center'
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        columnStyles: {
          0: { halign: 'left', cellWidth: 40 },   // Date
          1: { halign: 'right', cellWidth: 30 },  // Credit
          2: { halign: 'right', cellWidth: 30 },  // Debit
          3: { halign: 'right', cellWidth: 30 },  // Closing
          4: { halign: 'left', cellWidth: 60 },   // Description
          5: { halign: 'left', cellWidth: 40 },   // From/To
        }
      });
      
      // Save the PDF
      const fileName = `Account_Statement_${new Date().toISOString().split('T')[0]}.pdf`;
      console.log("💾 Saving PDF with filename:", fileName);
      doc.save(fileName);
      
      toast.success('PDF exported successfully!');
    } catch (error: any) {
      console.error('❌ PDF export error:', error);
      toast.error(`Failed to export PDF: ${error?.message || 'Unknown error'}`);
    }
  };

  /**
   * Export statement data to Excel
   */
  const exportToExcel = (data: any[]) => {
    try {
      // Prepare worksheet data
      const worksheetData = [
        // Header row
        ['Date', 'Credit', 'Debit', 'Closing', 'Description', 'From/To'],
        // Data rows
        ...data.map((row) => {
          return [
            row.date,
            row.credit ? Number(row.credit).toFixed(2) : '',
            row.debit ? Number(row.debit).toFixed(2) : '',
            Number(row.closing).toFixed(2),
            row.description,
            row.fromTo || '',
          ];
        }),
      ];
      
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // Set column widths
      const columnWidths = [
        { wch: 20 },  // Date
        { wch: 15 },  // Credit
        { wch: 15 },  // Debit
        { wch: 15 },  // Closing
        { wch: 40 },  // Description
        { wch: 20 },  // From/To
      ];
      worksheet['!cols'] = columnWidths;
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Account Statement');
      
      // Save the Excel file
      const fileName = `Account_Statement_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      toast.success('Excel file exported successfully!');
    } catch (error: any) {
      console.error('Excel export error:', error);
      toast.error(`Failed to export Excel file: ${error?.message || 'Unknown error'}`);
    }
  };

  // Export handlers
  const handleExportPDF = async () => {
    if (isExportingPDF) return;
    
    setIsExportingPDF(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for UI feedback
      exportToPDF(statementData);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportExcel = async () => {
    if (isExportingExcel) return;
    
    setIsExportingExcel(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for UI feedback
      exportToExcel(statementData);
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Reset Game Name to "All" when Account Type changes
  React.useEffect(() => {
    setGameName("All");
  }, [accountType]);

  // Handle click outside for dropdown
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        clientInputRef.current &&
        !clientInputRef.current.contains(e.target as Node)
      ) {
        setClientDropdownOpen(false);
      }
    }
    if (clientDropdownOpen) {
      document.addEventListener("mousedown", handleClick);
    } else {
      document.removeEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [clientDropdownOpen]);

  return (
    <div className="p-2 sm:p-4 bg-[#fafafa] min-h-screen">
      <h2 className="m-0 text-lg font-normal mb-2">Account Statement</h2>
      {/* Filters */}
      <div className="flex flex-wrap md:grid md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4 mb-2 w-full">
        <div className="flex flex-col min-w-[140px] w-full">
          <label className="text-sm font-medium mb-1">Account Type</label>
          <select
            className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-500 focus:border-gray-300 focus:ring-0 outline-none transition w-full"
            value={accountType}
            onChange={(e) => setAccountType(e.target.value)}
          >
            {accountTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        {/* Sport List - Only show for Sports Report */}
        {accountType === "Sports Report" && (
          <div className="flex flex-col min-w-[140px] w-full">
            <label className="text-sm font-medium mb-1">Sport List</label>
            <select
              className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-500 focus:border-gray-300 focus:ring-0 outline-none transition w-full"
              value={sportList}
              onChange={(e) => setSportList(e.target.value)}
            >
              {sportListOptions.map((sport) => (
                <option key={sport} value={sport}>
                  {sport}
                </option>
              ))}
            </select>
          </div>
        )}
        {/* Casino List - Only show for Casino Report */}
        {accountType === "Casino Report" && (
          <div className="flex flex-col min-w-[140px] w-full">
            <label className="text-sm font-medium mb-1">Casino List</label>
            <select
              className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-500 focus:border-gray-300 focus:ring-0 outline-none transition w-full"
              value={casinoList}
              onChange={(e) => setCasinoList(e.target.value)}
            >
              {casinoListOptions.map((casino) => (
                <option key={casino} value={casino}>
                  {casino}
                </option>
              ))}
            </select>
          </div>
        )}
        {/* Game Name - Hide for Casino Report */}
        {accountType !== "Casino Report" && (
        <div className="flex flex-col min-w-[140px] w-full">
          <label className="text-sm font-medium mb-1">Game Name</label>
          <select
              className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-500 focus:border-gray-300 focus:ring-0 outline-none transition w-full disabled:bg-gray-100 disabled:cursor-not-allowed"
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
              disabled={accountType === "All"}
          >
            {gameNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        )}
        {/* Improved Search By Client Name */}
        <div className="flex flex-col min-w-[160px] w-full relative">
          <label className="text-sm font-medium mb-1">Search By Client Name</label>
          <div className="relative">
            <input
              ref={clientInputRef}
              className={`border border-gray-300 rounded px-3 py-2 text-sm text-gray-500 w-full focus:border-gray-300 focus:ring-0 outline-none transition placeholder:text-[#42526e]`}
              placeholder="Select option"
              value={clientName}
              onFocus={() => setClientDropdownOpen(true)}
              onChange={(e) => setClientName(e.target.value)}
              autoComplete="off"
            />
            {clientDropdownOpen && (
              <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded-b shadow z-10 text-sm">
                {clientOptions.length === 0 ? (
                  <div className="px-4 py-2 text-[#42526e] font-medium">
                    List is empty.
                  </div>
                ) : (
                  clientOptions.map((option) => (
                    <div
                      key={option}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setClientName(option);
                        setClientDropdownOpen(false);
                      }}
                    >
                      {option}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col min-w-[120px] w-full">
          <label className="text-sm font-medium mb-1">From</label>
          <input
            type="date"
            className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-500 focus:border-gray-300 focus:ring-0 outline-none transition w-full"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col min-w-[120px] w-full">
          <label className="text-sm font-medium mb-1">To</label>
          <input
            type="date"
            className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-500 focus:border-gray-300 focus:ring-0 outline-none transition w-full"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
      </div>

      {/* Load Button */}
      <div className="flex mb-2">
        <button 
          onClick={handleLoad}
          disabled={isLoading}
          className={`px-6 leading-9 cursor-pointer rounded font-medium text-white text-sm transition ${
            isLoading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-[var(--bg-primary)] hover:opacity-90'
          }`}
        >
          {isLoading ? 'Loading...' : 'Load'}
          </button>
        </div>

      {/* Export Buttons */}
      <div className="flex flex-wrap gap-1 mb-2">
        <button 
          className={`flex cursor-pointer items-center gap-2 px-3 leading-8 rounded font-medium text-white text-xs transition ${
            isExportingPDF 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-[#cb0606] hover:opacity-90'
          }`}
          onClick={handleExportPDF}
          disabled={isExportingPDF || statementData.length === 0}
        >
          <FaFilePdf className="w-3 h-3" /> 
          {isExportingPDF ? 'Exporting...' : 'PDF'}
        </button>
        <button 
          className={`flex cursor-pointer items-center gap-2 px-3 leading-8 rounded font-medium text-white text-xs transition ${
            isExportingExcel 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-[#217346] hover:opacity-90'
          }`}
          onClick={handleExportExcel}
          disabled={isExportingExcel || statementData.length === 0}
        >
          <FaFileExcel className="w-3 h-3" /> 
          {isExportingExcel ? 'Exporting...' : 'Excel'}
        </button>
      </div>

      {/* Show entries and search */}
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
        <div className="ml-auto flex gap-2 items-center w-full sm:w-auto">
          <span className="text-sm">Search:</span>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-2 py-1 rounded border border-gray-300 min-w-[120px] text-sm leading-6 w-full sm:w-auto"
          />
        </div>
      </div>
      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow mb-4">
        <table className="w-full min-w-[700px] sm:min-w-[900px] border-separate border-spacing-0 text-xs sm:text-sm">
          <thead>
            <tr className="bg-[#f5f5f5] text-left">
              {columns.map((col, idx) => (
                <th
                  key={col}
                  className="py-2 px-2 font-semibold border border-[#e0e0e0]"
                >
                  {col}
                  {col === "Closing" && (
                    <span className="ml-1 align-middle">▲</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center py-6 text-gray-500 border border-[#e0e0e0]"
                >
                  Loading data...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center py-6 text-red-500 border border-[#e0e0e0]"
                >
                  Error loading data
                </td>
              </tr>
            ) : statementData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="text-center py-6 text-gray-500 border border-[#e0e0e0]"
              >
                No data available in table
              </td>
            </tr>
            ) : (
              statementData.map((row: any, index: number) => {
                const isClickable = getTransactionType(row.description, row.betId) !== null;
                return (
                  <tr 
                    key={row.id || index} 
                    className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} ${
                      isClickable ? "cursor-pointer hover:bg-blue-50" : ""
                    }`}
                    onClick={() => isClickable && handleRowClick(row)}
                  >
                    <td className="py-2 px-2 text-xs border border-[#e0e0e0]">
                      {row.date}
                    </td>
                    <td className="py-2 px-2 text-xs text-right border border-[#e0e0e0] text-green-600 font-medium">
                      {row.credit ? Number(row.credit).toFixed(2) : ''}
                    </td>
                    <td className="py-2 px-2 text-xs text-right border border-[#e0e0e0] text-red-600 font-medium">
                      {row.debit ? Number(row.debit).toFixed(2) : ''}
                    </td>
                    <td className={`py-2 px-2 text-xs text-right border border-[#e0e0e0] font-medium ${
                      Number(row.closing) > 0 ? 'text-green-600' : ''
                    }`}>
                      {Number(row.closing) === 0 ? '-' : Number(row.closing).toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-xs border border-[#e0e0e0]">
                      <span className="inline-block bg-[#4a4a4a] text-white px-2 py-1 rounded text-xs">
                        {row.description}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-xs border border-[#e0e0e0]">
                      {row.fromTo || ''}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="flex flex-wrap justify-between items-center gap-2 w-full">
        <div className="text-sm text-gray-600">
          {statementData.length > 0 && (
            <>Showing {statementData.length} of {totalRecords} entries</>
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

      {/* Sport Match Details Modal */}
      {isSportModalOpen && sportMatchData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Sport Match Details</h2>
              <button
                onClick={() => {
                  setIsSportModalOpen(false);
                  setSportMatchData(null);
                  setBetFilter("all");
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <SportMatchDetailsDisplay
                responseData={sportMatchData}
                betFilter={betFilter}
                setBetFilter={setBetFilter}
                getFilteredBets={getFilteredBets}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Sport Match Details Display Component
interface SportMatchDetailsDisplayProps {
  responseData: any;
  betFilter: string;
  setBetFilter: (filter: string) => void;
  getFilteredBets: (bets: any[], filter: string) => any[];
}

const SportMatchDetailsDisplay: React.FC<SportMatchDetailsDisplayProps> = ({
  responseData,
  betFilter,
  setBetFilter,
  getFilteredBets,
}) => {
  const bet = responseData?.bet || {};
  const match = responseData?.match || {};
  const matchedMarket = responseData?.matchedMarket || {};
  
  const userBets = bet?.id ? [bet] : [];

  const renderUserBetsTable = () => {
    if (!userBets || userBets.length === 0) return null;

    const filteredBets = getFilteredBets(userBets, betFilter);
    const totalAmount = filteredBets.reduce((sum: number, bet: any) => {
      const result = bet.betData?.result;
      if (!result || !result.settled) return sum;
      let profitLoss = 0;
      if (result.status === "won" || result.status === "profit") {
        profitLoss = Number(result.profitLoss) || 0;
      } else if (result.status === "lost") {
        profitLoss = Number(result.profitLoss) || 0;
      }
      return sum + profitLoss;
    }, 0);

    return (
      <div className="max-w-6xl mx-auto w-full mb-4">
        <div className="bg-white px-4 py-2 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {["all", "back", "lay", "deleted"].map((filter) => (
                <label key={filter} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="betFilter"
                    value={filter}
                    checked={betFilter === filter}
                    onChange={(e) => setBetFilter(e.target.value)}
                    className="text-blue-600"
                  />
                  <span className="text-sm capitalize">{filter}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Total Bets: {filteredBets.length}</span>
              <span className="text-sm font-medium">
                Total Amount:{" "}
                <span className={totalAmount >= 0 ? "text-green-600" : "text-red-600"}>
                  {totalAmount.toLocaleString("en-IN", {
                    maximumFractionDigits: 2,
                  })}
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="border border-gray-300 px-3 py-2 text-left font-medium">Nation</th>
                <th className="border border-gray-300 px-3 py-2 text-left font-medium">Rate</th>
                <th className="border border-gray-300 px-3 py-2 text-left font-medium">Bhav</th>
                <th className="border border-gray-300 px-3 py-2 text-left font-medium">Amount</th>
                <th className="border border-gray-300 px-3 py-2 text-left font-medium">Win</th>
                <th className="border border-gray-300 px-3 py-2 text-left font-medium">Date</th>
                <th className="border border-gray-300 px-3 py-2 text-left font-medium text-nowrap">IP Address</th>
                <th className="border border-gray-300 px-3 py-2 text-left font-medium text-nowrap">Browser Details</th>
                <th className="border border-gray-300 px-3 py-2 text-center font-medium">
                  <input type="checkbox" className="text-blue-600" />
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBets.map((bet: any, index: number) => {
                const winAmount = bet.betData?.result?.profitLoss || 0;
                const isWin = bet.betData?.result?.status === "won" || bet.status === "won" || bet.betData?.result?.status === "profit";
                const betType = bet.betData?.betType?.toLowerCase() || bet.betData?.oddCategory?.toLowerCase() || "";
                
                return (
                  <tr
                    key={bet.id || index}
                    className={` ${
                      betType === "back" || betType === "yes"
                        ? "bg-[var(--bg-back)]"
                        : betType === "lay" || betType === "no"
                          ? "bg-[var(--bg-lay)]"
                          : "bg-white"
                    }`}
                  >
                    <td className="border text-nowrap border-gray-300 px-3 py-2">
                      {bet.betData?.name || bet.betData?.betName || bet.betData?.rname || "N/A"}
                    </td>
                    <td className="border text-nowrap border-gray-300 px-3 py-2">
                    {bet.betData?.run || bet.betData?.bhav || bet.betData?.bhavValue || "N/A"}
                    </td>
                    <td className="border text-nowrap border-gray-300 px-3 py-2">
                    {bet.betData?.matchOdd || bet.betData?.odd || bet.betData?.betRate || bet.betData?.rate || "N/A"}
                    
                    </td>
                    <td className="border text-nowrap border-gray-300 px-3 py-2">
                      {bet.betData?.stake || bet.betData?.amount || "N/A"}
                    </td>
                    <td
                      className={`border text-nowrap border-gray-300 px-3 py-2 ${
                        isWin ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {isWin && winAmount > 0 ? "+" : ""}
                      {winAmount.toLocaleString("en-IN", {
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="border text-nowrap border-gray-300 px-3 py-2">
                      {bet.createdAt ? new Date(bet.createdAt).toLocaleString() : bet.betData?.placedAt ? new Date(bet.betData.placedAt).toLocaleString() : "N/A"}
                    </td>
                    <td className="border text-nowrap border-gray-300 px-3 py-2 text-xs">
                      {bet.ipAddress || "N/A"}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <button className="text-blue-600 hover:text-blue-800 text-sm">
                        Detail
                      </button>
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      <input type="checkbox" className="text-blue-600" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const buildMatchPath = () => {
    const sport = bet?.betData?.sportType || match?.sportType || "Sport";
    const tournament = bet?.betData?.seriesName || "";
    const teams = bet?.betData?.eventName || match?.eventName || "";
    const market = matchedMarket?.marketName || bet?.betData?.market || bet?.betData?.gtype || "";
    
    const pathParts = [sport];
    if (tournament) pathParts.push(tournament);
    if (teams) pathParts.push(teams);
    if (market) pathParts.push(market);
    
    return pathParts.join(" -> ");
  };

  const getWinner = () => {
    return bet?.betData?.result?.result || "N/A";
  };

  const getGameTime = () => {
    if (bet?.betData?.gameDate) {
      return bet.betData.gameDate;
    }
    if (bet?.settledAt) {
      return new Date(bet.settledAt).toLocaleString();
    }
    if (bet?.betData?.placedAt) {
      return new Date(bet.betData.placedAt).toLocaleString();
    }
    if (bet?.createdAt) {
      return new Date(bet.createdAt).toLocaleString();
    }
    return "N/A";
  };

  return (
    <div className="flex flex-col px-2">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-black">
          Match Path: <span className="text-black font-normal pl-1">{buildMatchPath()}</span>
        </h2>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-semibold text-black">
          Winner: <span className="text-black font-normal pl-1">{getWinner()}</span>
        </h2>
        <h2 className="text-sm font-semibold text-black capitalize">
          Game Time:{" "}
          <span className="text-black font-normal pl-1">
            {getGameTime()}
          </span>
        </h2>
      </div>

      {renderUserBetsTable()}
    </div>
  );
};

export default Statement;
