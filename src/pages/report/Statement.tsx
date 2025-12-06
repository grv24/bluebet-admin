import React, { useState, useRef } from "react";
import { FaFilePdf, FaFileExcel } from "react-icons/fa6";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const accountTypes = [
  "All",
  "Deposit/Withdraw Report",
  "Sports Report",
  "Casino Report",
  "Third Party Casino Report",
];
const pageSizeOptions = [25, 50, 100];

// Function to get game names based on account type
const getGameNamesByAccountType = (accountType: string): string[] => {
  switch (accountType) {
    case "Deposit/Withdraw Report":
      return ["All", "Upper", "Lower"];
    case "All":
      return ["All"];
    default:
      return ["All", "Game 1", "Game 2"];
  }
};

const Statement = () => {
  const [accountType, setAccountType] = useState("All");
  const [gameName, setGameName] = useState("All");
  const [clientName, setClientName] = useState("");
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const clientInputRef = useRef<HTMLInputElement>(null);

  // Get dynamic game names based on account type
  const gameNames = getGameNamesByAccountType(accountType);

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

  // Sample data for demonstration (will be replaced with actual API data)
  const statementData: any[] = [];

  // Pagination (empty for now)
  const totalPages = 1;

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
      const tableData = data.map((row, index) => [
        row.date || '-',
        row.credit || '0',
        row.debit || '0',
        row.closing || '0',
        row.description || '-',
        row.fromto || '-',
      ]);
      
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
        ...data.map((row) => [
          row.date || '-',
          row.credit || '0',
          row.debit || '0',
          row.closing || '0',
          row.description || '-',
          row.fromto || '-',
        ]),
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
        <button className="px-6 leading-9 cursor-pointer rounded font-medium text-white text-sm bg-[var(--bg-primary)] hover:opacity-90 transition">
          Load
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
            <tr>
              <td
                colSpan={columns.length}
                className="text-center py-6 text-gray-500 border border-[#e0e0e0]"
              >
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

export default Statement;
