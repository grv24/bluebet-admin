import React, { useMemo, useState, useCallback } from "react";
import { FaFilePdf, FaFileExcel, FaArrowLeft } from "react-icons/fa6";
import { useNavigate, useParams } from "react-router-dom";
import { useCookies } from "react-cookie";
import { baseUrl } from "@/helper/auth";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const pageSizeOptions = [25, 50, 100];

interface ClientRow {
  userName: string;
  fullName: string;
  creditRef: string;
  balance: number;
  clientPL?: string;
  exposure: number;
  availableBalance: number;
  ust: boolean;
  bst: boolean;
  exposureLimit: number;
  defaultPercent: number;
  accountType: string;
  _id?: string;
  __type: string;
}

interface APIUser {
  userId: string;
  PersonalDetails: {
    loginId: string;
    userName: string;
    user_password: string;
    countryCode: string | null;
    mobile: string | null;
    idIsActive: boolean;
    isAutoRegisteredUser: boolean;
  };
  AccountDetails: {
    liability: number;
    Balance: number | string;
    profitLoss: number;
    freeChips: number;
    totalSettledAmount: number;
    Exposure: number;
    ExposureLimit: number;
    creditRef: number;
  };
  userLocked: boolean;
  bettingLocked: boolean;
  fancyLocked: boolean;
  __type: string;
  allowedNoOfUsers: number;
  createdUsersCount: number;
  remarks: string;
  createdAt: string;
  updatedAt: string;
  downlineBalances?: any;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface DownlineListResponse {
  success: boolean;
  data: {
    pagination: PaginationData;
    users: APIUser[];
    summary?: any;
  };
}

const formatNumber = (num: number): string => num.toLocaleString("en-IN");

const exportToPDF = (data: ClientRow[], totals: any, userName: string) => {
  try {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`Downline List - ${userName}`, 14, 20);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Total Records: ${data.length}`, 14, 35);
    
    const tableData = data.map((row, index) => [
      index + 1,
      row.userName,
      row.creditRef,
      row.balance.toLocaleString(),
      row.clientPL || '-',
      row.exposure.toLocaleString(),
      row.availableBalance.toLocaleString(),
      row.ust ? 'Active' : 'Inactive',
      row.bst ? 'Active' : 'Inactive',
      row.exposureLimit.toLocaleString(),
      row.defaultPercent.toString(),
      row.accountType
    ]);
    
    tableData.push([
      'TOTAL',
      '',
      formatNumber(totals.balance),
      formatNumber(totals.clientPL),
      '-',
      '-',
      formatNumber(totals.availableBalance),
      '',
      '',
      '-',
      '-',
      ''
    ]);
    
    const headers = [
      'S.No',
      'User Name',
      'Credit Ref',
      'Balance',
      'Client(P/L)',
      'Exposure',
      'Available Balance',
      'U Status',
      'B Status',
      'Exposure Limit',
      'Default (%)',
      'Account Type'
    ];
    
    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 45,
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
        0: { halign: 'center', cellWidth: 15 },
        1: { halign: 'left', cellWidth: 25 },
        2: { halign: 'right', cellWidth: 20 },
        3: { halign: 'right', cellWidth: 20 },
        4: { halign: 'right', cellWidth: 20 },
        5: { halign: 'right', cellWidth: 20 },
        6: { halign: 'right', cellWidth: 25 },
        7: { halign: 'center', cellWidth: 15 },
        8: { halign: 'center', cellWidth: 15 },
        9: { halign: 'right', cellWidth: 20 },
        10: { halign: 'center', cellWidth: 15 },
        11: { halign: 'center', cellWidth: 20 }
      }
    });
    
    const fileName = `Downline_List_${userName}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    toast.success('PDF exported successfully!');
  } catch (error: any) {
    console.error('PDF export error:', error);
    toast.error(`Failed to export PDF: ${error?.message || 'Unknown error'}`);
  }
};

const exportToExcel = (data: ClientRow[], totals: any, userName: string) => {
  try {
    const worksheetData = [
      ['S.No', 'User Name', 'Credit Ref', 'Balance', 'Client(P/L)', 'Exposure', 'Available Balance', 'U Status', 'B Status', 'Exposure Limit', 'Default (%)', 'Account Type'],
      ...data.map((row, index) => [
        index + 1,
        row.userName,
        row.creditRef,
        row.balance,
        row.clientPL || '-',
        row.exposure,
        row.availableBalance,
        row.ust ? 'Active' : 'Inactive',
        row.bst ? 'Active' : 'Inactive',
        row.exposureLimit,
        row.defaultPercent,
        row.accountType
      ]),
      ['TOTAL', '', totals.balance, totals.clientPL, '-', '-', totals.availableBalance, '', '', '-', '-', '']
    ];
    
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    const columnWidths = [
      { wch: 8 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 18 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
      { wch: 12 },
      { wch: 15 }
    ];
    worksheet['!cols'] = columnWidths;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Downline List');
    
    const fileName = `Downline_List_${userName}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    toast.success('Excel file exported successfully!');
  } catch (error: any) {
    console.error('Excel export error:', error);
    toast.error(`Failed to export Excel file: ${error?.message || 'Unknown error'}`);
  }
};

const ChildAdmin: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [cookies] = useCookies(["Admin", "TechAdmin"]);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"active" | "deactive">("active");
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const navigate = useNavigate();

  const authToken = useMemo(
    () => cookies[baseUrl.includes("techadmin") ? "TechAdmin" : "Admin"],
    [cookies]
  );

  const {
    data: downlineData,
    isLoading,
    error,
    refetch,
  } = useQuery<DownlineListResponse>({
    queryKey: ["childDownlineList", userId, page, pageSize],
    queryFn: async () => {
      const baseApiUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:7080';
      const apiUrl = `${baseApiUrl}/api/v1/users/my-downline-users?page=${page}&limit=${pageSize}&child=${userId}`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch downline users: ${response.status}`);
      }

      return response.json();
    },
    enabled: !!userId && !!authToken,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });

  const transformedData = useMemo<ClientRow[]>(() => {
    if (!downlineData?.data?.users || !Array.isArray(downlineData.data.users)) {
      return [];
    }
    return downlineData.data.users.map((user: APIUser): ClientRow => {
      const balance = typeof user.AccountDetails.Balance === 'string' 
        ? parseFloat(user.AccountDetails.Balance) 
        : user.AccountDetails.Balance || 0;
      const creditRefNum = user.AccountDetails.creditRef || 0;
      return {
        userName: user.PersonalDetails.loginId || user.PersonalDetails.userName || "N/A",
        fullName: user.PersonalDetails.userName || user.PersonalDetails.loginId || "N/A",
        creditRef: creditRefNum ? creditRefNum.toLocaleString() : "0",
        balance,
        clientPL: formatNumber(balance - creditRefNum),
        exposure: user.AccountDetails.Exposure || 0,
        availableBalance: balance - (user.AccountDetails.Exposure || 0),
        ust: user.userLocked === true ? false : true,
        bst: user.bettingLocked === true ? false : true,
        exposureLimit: user.AccountDetails.ExposureLimit || 0,
        defaultPercent: parseFloat((user as any).commissionDetails?.partnershipOwn || "0"),
        accountType: user.__type === "client" ? "User" : user.__type || "User",
        _id: user.userId || "",
        __type: user.__type || "User",
      };
    });
  }, [downlineData?.data?.users]);

  const tabFilteredData = useMemo<ClientRow[]>(() => {
    if (activeTab === "active") {
      return transformedData.filter((row) => row.ust && row.bst);
    }
    return transformedData.filter((row) => !(row.ust && row.bst));
  }, [transformedData, activeTab]);

  const filteredData = useMemo<ClientRow[]>(() => {
    if (!search.trim()) return tabFilteredData;

    const searchTerm = search.toLowerCase();
    return tabFilteredData.filter(
      (row) =>
        row.userName.toLowerCase().includes(searchTerm) ||
        row.accountType.toLowerCase().includes(searchTerm)
    );
  }, [tabFilteredData, search]);

  const paginationInfo = useMemo(
    () => ({
      totalPages: downlineData?.data?.pagination?.totalPages || 0,
      totalUsers: downlineData?.data?.pagination?.total || 0,
      currentPage: page,
      hasNextPage: page < (downlineData?.data?.pagination?.totalPages || 0),
      hasPrevPage: page > 1,
    }),
    [downlineData?.data?.pagination, page]
  );

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setSearch(e.target.value);
    setPage(1);
  }, []);

  const handlePageSizeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      e.preventDefault();
      setPageSize(Number(e.target.value));
      setPage(1);
    },
    []
  );

  const handleReset = useCallback(() => {
    setSearch("");
    setPage(1);
  }, []);

  const handlePrevPage = useCallback(() => {
    setPage((prev) => Math.max(1, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setPage((prev) => Math.min(paginationInfo.totalPages, prev + 1));
  }, [paginationInfo.totalPages]);

  const parseNumericValue = useCallback((value: string | number | undefined): number => {
    if (typeof value === "number") return value || 0;
    if (!value) return 0;
    const num = Number(value.toString().replace(/,/g, ""));
    return Number.isFinite(num) ? num : 0;
  }, []);

  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, row) => {
        acc.balance += parseNumericValue(row.balance);
        acc.clientPL += parseNumericValue(row.clientPL);
        acc.exposure += parseNumericValue(row.exposure);
        acc.availableBalance += parseNumericValue(row.availableBalance);
        acc.exposureLimit += parseNumericValue(row.exposureLimit);
        acc.defaultPercent += parseNumericValue(row.defaultPercent);
        return acc;
      },
      {
        balance: 0,
        clientPL: 0,
        exposure: 0,
        availableBalance: 0,
        exposureLimit: 0,
        defaultPercent: 0,
      }
    );
  }, [filteredData, parseNumericValue]);

  const visibleTotals = useMemo(
    () =>
      filteredData.reduce(
        (acc, row) => {
          acc.creditRef += parseNumericValue(row.creditRef);
          acc.balance += parseNumericValue(row.balance);
          acc.clientPL += parseNumericValue(row.clientPL);
          acc.availableBalance += parseNumericValue(row.balance);
          return acc;
        },
        {
          creditRef: 0,
          balance: 0,
          clientPL: 0,
          availableBalance: 0,
        }
      ),
    [filteredData, parseNumericValue]
  );

  const handleExportPDF = useCallback(async () => {
    if (isExportingPDF) return;
    
    setIsExportingPDF(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const userName = transformedData[0]?.userName || 'downline';
      exportToPDF(filteredData, totals, userName);
    } finally {
      setIsExportingPDF(false);
    }
  }, [filteredData, totals, transformedData, isExportingPDF]);

  const handleExportExcel = useCallback(async () => {
    if (isExportingExcel) return;
    
    setIsExportingExcel(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const userName = transformedData[0]?.userName || 'downline';
      exportToExcel(filteredData, totals, userName);
    } finally {
      setIsExportingExcel(false);
    }
  }, [filteredData, totals, transformedData, isExportingExcel]);

  if (error || (downlineData && !downlineData.success)) {
    return (
      <div className="p-4 bg-[#fafafa] min-h-screen">
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <div className="text-lg text-red-500">❌ Error loading data</div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-[#fafafa] min-h-screen min-w-fit">
      <div className="flex flex-wrap items-center justify-between mb-2 gap-2">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <FaArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h2 className="m-0 text-lg font-normal">Downline Account List</h2>
        </div>
      </div>

      <div className="flex items-center gap-6 mb-3 border-b border-gray-200">
        <button
          className={`-mb-px pb-2 text-sm font-medium ${
            activeTab === "active"
              ? "text-[var(--bg-primary)] border-b-2 border-[var(--bg-primary)]"
              : "text-gray-600 hover:text-gray-800"
          }`}
          onClick={() => {
            setActiveTab("active");
            setPage(1);
          }}
        >
          Active Users
        </button>
        <button
          className={`-mb-px pb-2 text-sm font-medium ${
            activeTab === "deactive"
              ? "text-[var(--bg-primary)] border-b-2 border-[var(--bg-primary)]"
              : "text-gray-600 hover:text-gray-800"
          }`}
          onClick={() => {
            setActiveTab("deactive");
            setPage(1);
          }}
        >
          Deactivate Users
        </button>
      </div>

      <div className="flex flex-wrap gap-1 mb-2">
        <button 
          className={`flex cursor-pointer items-center gap-2 px-3 leading-8 rounded font-medium text-white text-xs transition ${
            isExportingPDF 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-[#cb0606] hover:opacity-90'
          }`}
          onClick={handleExportPDF}
          disabled={isExportingPDF || filteredData.length === 0}
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
          disabled={isExportingExcel || filteredData.length === 0}
        >
          <FaFileExcel className="w-3 h-3" /> 
          {isExportingExcel ? 'Exporting...' : 'Excel'}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-xs">Show</span>
        <select
          value={pageSize}
          onChange={handlePageSizeChange}
          className="px-2 py-1 rounded border border-gray-300 text-xs"
        >
          {pageSizeOptions.map((opt) => (
            <option className="text-xs text-gray-500" key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <span className="text-xs">entries</span>
        <div className="ml-auto flex gap-2 items-center">
          <span className="text-xs">Search:</span>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={handleSearch}
            className="px-2 py-1 rounded border border-gray-300 min-w-[120px] text-xs leading-6"
          />
          <button
            onClick={handleReset}
            className="px-4 py-1 rounded leading-6 cursor-pointer font-medium text-white text-sm bg-[#74788d] hover:opacity-90 transition"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow mb-4">
        <table className="w-full min-w-[900px] border-separate border-spacing-0">
          <thead>
            <tr className="bg-[#f5f5f5] text-center text-xs">
              <th className="py-2 px-2 font-semibold whitespace-nowrap border border-[#e0e0e0]">
                User Name
              </th>
              <th className="py-2 px-2 font-semibold whitespace-nowrap border border-[#e0e0e0]">
                Credit Ref
              </th>
              <th className="py-2 px-2 font-semibold whitespace-nowrap border border-[#e0e0e0]">
                Balance
              </th>
              <th className="py-2 px-2 font-semibold whitespace-nowrap border border-[#e0e0e0]">
                Client(P/L)
              </th>
              <th className="py-2 px-2 font-semibold whitespace-nowrap border border-[#e0e0e0]">
                Exposure
              </th>
              <th className="py-2 px-2 font-semibold whitespace-nowrap border border-[#e0e0e0]">
                Available Balance
              </th>
              <th className="py-2 px-2 font-semibold whitespace-nowrap border border-[#e0e0e0]">
                U st
              </th>
              <th className="py-2 px-2 font-semibold whitespace-nowrap border border-[#e0e0e0]">
                B st
              </th>
              <th className="py-2 px-2 font-semibold whitespace-nowrap border border-[#e0e0e0]">
                Exposure Limit
              </th>
              <th className="py-2 px-2 font-semibold whitespace-nowrap border border-[#e0e0e0]">
                Default (%)
              </th>
              <th className="py-2 px-2 font-semibold whitespace-nowrap border border-[#e0e0e0]">
                Account Type
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td
                  colSpan={11}
                  className="text-center py-6 text-gray-500 border border-[#e0e0e0]"
                >
                  {isLoading ? "Loading..." : "No data found"}
                </td>
              </tr>
            ) : (
              <>
                <tr className="bg-[#f0f4f8] font-bold text-xs">
                  <td className="border border-[#e0e0e0] py-2 px-2 text-center">Total</td>
                  <td className="border border-[#e0e0e0] text-center py-2 px-2">
                    {formatNumber(visibleTotals.creditRef)}
                  </td>
                  <td className="border border-[#e0e0e0] text-center py-2 px-2">
                    {formatNumber(visibleTotals.balance)}
                  </td>
                  <td className="border border-[#e0e0e0] text-center py-2 px-2">
                    {formatNumber(visibleTotals.clientPL)}
                  </td>
                  <td className="border border-[#e0e0e0] text-center py-2 px-2">
                    -
                  </td>
                  <td className="border border-[#e0e0e0] text-center py-2 px-2">
                    {formatNumber(visibleTotals.availableBalance)}
                  </td>
                  <td className="border border-[#e0e0e0] text-center py-2 px-2"></td>
                  <td className="border border-[#e0e0e0] text-center py-2 px-2"></td>
                  <td className="border border-[#e0e0e0] text-center py-2 px-2">
                    -
                  </td>
                  <td className="border border-[#e0e0e0] text-center py-2 px-2">
                    -
                  </td>
                  <td className="border border-[#e0e0e0] py-2 px-2"></td>
                </tr>
                {filteredData.map((row: ClientRow, idx: number) => (
                  <tr
                    key={row.userName + idx}
                    className={`text-xs h-12 ${idx % 2 === 0 ? "bg-white" : "bg-[#0000000d]"}`}
                  >
                    <td className="pl-2 pr-2 py-2 align-middle border border-[#e0e0e0]">
                      <span 
                        className={`bg-[#444] text-white rounded leading-6 px-2 font-medium text-sm tracking-wider inline-block ${
                          row.accountType !== "User" 
                            ? "cursor-pointer hover:bg-[#333] transition-colors" 
                            : ""
                        }`}
                        onClick={() => {
                          if (row.accountType !== "User") {
                            navigate(`/clients/admin-child/${row._id}`);
                          }
                        }}
                        title={row.fullName}
                      >
                        {row.userName}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-center font-medium align-middle border border-[#e0e0e0]">
                      {row.creditRef}
                    </td>
                    <td className="px-2 py-2 text-center font-medium align-middle border border-[#e0e0e0]">
                      {row.balance.toLocaleString()}
                    </td>
                    <td className="px-2 py-2 text-center font-medium align-middle border border-[#e0e0e0]">
                      {row.clientPL || '-'}
                    </td>
                    <td className="px-2 py-2 text-center font-medium align-middle border border-[#e0e0e0]">
                      {row.exposure.toLocaleString()}
                    </td>
                    <td className="px-2 py-2 text-center font-medium align-middle border border-[#e0e0e0]">
                      {row.availableBalance.toLocaleString()}
                    </td>
                    <td className="px-2 py-2 text-center align-middle border border-[#e0e0e0]">
                      <input
                        type="checkbox"
                        checked={row.ust}
                        readOnly
                        className="w-5 h-5 accent-black rounded-none border border-black bg-black"
                        style={{ accentColor: "#000" }}
                      />
                    </td>
                    <td className="px-2 py-2 text-center align-middle border border-[#e0e0e0]">
                      <input
                        type="checkbox"
                        checked={row.bst}
                        readOnly
                        className="w-5 h-5 accent-black rounded-none border border-black bg-black"
                        style={{ accentColor: "#000" }}
                      />
                    </td>
                    <td className="px-2 py-2 text-center font-medium align-middle border border-[#e0e0e0]">
                      {row.exposureLimit.toLocaleString()}
                    </td>
                    <td className="px-2 py-2 text-center font-medium align-middle border border-[#e0e0e0]">
                      {row.defaultPercent}
                    </td>
                    <td className="px-2 py-2 text-center align-middle border border-[#e0e0e0]">
                      {row.accountType}
                    </td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center gap-2 flex-wrap mt-4">
        <div className="text-sm text-gray-600">
          Showing {filteredData.length} of {paginationInfo.totalUsers} entries
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevPage}
            disabled={!paginationInfo.hasPrevPage}
            className="bg-gray-200 hover:bg-gray-300 rounded px-3 py-1 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="min-w-[80px] text-center font-medium text-base">
            Page {paginationInfo.currentPage} of {paginationInfo.totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={!paginationInfo.hasNextPage}
            className="bg-gray-200 hover:bg-gray-300 rounded px-3 py-1 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChildAdmin;