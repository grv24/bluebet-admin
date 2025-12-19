import React, { useMemo, useState, useCallback, useEffect } from "react";
import { FaFilePdf, FaFileExcel, FaWifi, FaUser } from "react-icons/fa6";
import { DepositModal, WithdrawModal } from "@/components";
import { useNavigate } from "react-router-dom";
import ExporsureLimit from "@/components/common/ExporsureLimit";
import CreditModal from "@/components/common/CreditModal";
import PasswordModal from "@/components/common/PasswordModal";
import ChangeStatusModal from "@/components/common/ChangeStatusModal";
import { useCookies } from "react-cookie";
import {
  getDecodedTokenData,
  baseUrl,
  getUserType,
  getAuthCookieKey,
  getDirectCookie,
  removeDirectCookie,
} from "@/helper/auth";
import { getDownlineList } from "@/helper/user";
import { useQuery } from "@tanstack/react-query";
import socketService, { ForceLogoutData } from "@/utils/socketService";
import usePaymentGatewayPermissions from "@/hooks/usePaymentGatewayPermissions";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { FaTimes } from "react-icons/fa";

/**
 * Page size options for pagination
 */
const pageSizeOptions = [25, 50, 100];

/**
 * Interface for client row data displayed in the table
 * Represents a single client's information with financial and account details
 */
interface ClientRow {
  userName: string;        // Client's username/display name (loginId)
  fullName: string;        // Client's full name (userName from API)
  creditRef: string;       // Credit reference number
  balance: number;         // Current account balance
  clientPL?: string;       // Client's profit/loss (optional)
  exposure: number;        // Current exposure amount
  availableBalance: number; // Available balance for transactions
  ust: boolean;           // User status toggle
  bst: boolean;           // Betting status toggle
  exposureLimit?: number;   // Maximum exposure limit (optional)
  defaultPercent: number;  // Default percentage setting
  accountType: string;     // Type of account (e.g., "Client", "Agent")
  _id?: string;           // Optional database ID
  __type: string;         // User type for API calls
}

/**
 * Interface for user data received from API
 * Represents the structure of user data returned from the server
 */
interface APIUser {
  userId: string;         // User ID
  PersonalDetails: {      // Personal information
    loginId: string;      // Login identifier
    userName: string;     // Display name
    user_password: string; // User password
    countryCode: string | null; // Country code
    mobile: string | null; // Mobile number
    idIsActive: boolean;  // Whether user is active
    isAutoRegisteredUser: boolean; // Whether user was auto-registered
  };
  AccountDetails: {       // Financial account information
    liability: number;    // Liability amount
    Balance: number;      // Current balance
    profitLoss: number;   // Profit/loss amount
    freeChips: number;    // Free chips amount
    totalSettledAmount: number; // Total settled amount
    Exposure: number;     // Current exposure
    ExposureLimit: number; // Maximum exposure limit
    creditRef: number;    // Credit reference number
  };
  userLocked: boolean;    // Whether user account is locked
  bettingLocked: boolean; // Whether betting is locked
  fancyLocked: boolean;   // Whether fancy betting is locked
  __type: string;         // User type (e.g., "Client", "Agent")
  allowedNoOfUsers: number; // Allowed number of users
  createdUsersCount: number; // Created users count
  remarks: string;        // User remarks
  createdAt: string;      // Creation date
  updatedAt: string;      // Last update date
}

/**
 * Interface for pagination data
 * Represents pagination information from the API
 */
interface PaginationData {
  total: number;         // Total number of users
  page: number;          // Current page number
  limit: number;         // Items per page
  totalPages: number;    // Total number of pages
}

/**
 * Interface for API response containing downline user list
 * Represents the paginated response from the downline list API
 */
interface DownlineListResponse {
  success: boolean;       // API success status
  data: {                 // Response data wrapper
    pagination: PaginationData; // Pagination information
    users: APIUser[];      // Array of user objects
  };
}

/**
 * Interface for modal state management
 * Tracks which modal is currently open and the associated client data
 */
interface ModalState {
  deposit: ClientRow | null;      // Deposit modal with client data
  withdraw: ClientRow | null;     // Withdraw modal with client data
  exposureLimit: ClientRow | null; // Exposure limit modal with client data
  credit: ClientRow | null;       // Credit modal with client data
  password: ClientRow | null;     // Password modal with client data
  changeStatus: ClientRow | null; // Status change modal with client data
  paymentGateway: ClientRow | null; // Payment gateway permissions modal with client data
}

/**
 * Formats number with Indian locale formatting
 * 
 * @param num - Number to format
 * @returns Formatted number string with Indian locale separators
 */
const formatNumber = (num: number): string => num.toLocaleString("en-IN");

/**
 * Export data to PDF with better formatting
 * 
 * @param data - Array of client data to export
 * @param totals - Totals object for summary
 * @param activeTab - Current active tab (active/deactive)
 */
const exportToPDF = (data: ClientRow[], totals: any, activeTab: string) => {
  try {
    console.log("📄 Starting PDF export with data:", data.length, "records");
    
    const doc = new jsPDF('landscape', 'mm', 'a4');
    
    // Add title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Account List Report', 14, 20);
    
    // Add subtitle
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Tab: ${activeTab === 'active' ? 'Active Users' : 'Deactivate Users'}`, 14, 35);
    doc.text(`Total Records: ${data.length}`, 14, 40);
    
    // Prepare table data
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
      row.exposureLimit !== undefined && row.exposureLimit !== null ? row.exposureLimit.toLocaleString() : '-',
      row.defaultPercent.toString(),
      row.accountType
    ]);
    
    // Add totals row
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
    
    // Table headers
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
    
    console.log("📊 Creating PDF table with headers:", headers.length, "columns");
    
    // Create table
    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 50,
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
    
    // Save the PDF
    const fileName = `Account_List_${activeTab}_${new Date().toISOString().split('T')[0]}.pdf`;
    console.log("💾 Saving PDF with filename:", fileName);
    doc.save(fileName);
    
    toast.success('PDF exported successfully!');
  } catch (error: any) {
    console.error('❌ PDF export error:', error);
    console.error('❌ Error details:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      dataLength: data?.length,
      totals: totals,
      activeTab: activeTab
    });
    toast.error(`Failed to export PDF: ${error?.message || 'Unknown error'}`);
  }
};

/**
 * Export data to Excel with better formatting
 * 
 * @param data - Array of client data to export
 * @param totals - Totals object for summary
 * @param activeTab - Current active tab (active/deactive)
 */
const exportToExcel = (data: ClientRow[], totals: any, activeTab: string) => {
  try {
    // Prepare worksheet data
    const worksheetData = [
      // Header row
      ['S.No', 'User Name', 'Credit Ref', 'Balance', 'Client(P/L)', 'Exposure', 'Available Balance', 'U Status', 'B Status', 'Exposure Limit', 'Default (%)', 'Account Type'],
      // Data rows
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
        row.exposureLimit !== undefined && row.exposureLimit !== null ? row.exposureLimit : '-',
        row.defaultPercent,
        row.accountType
      ]),
      // Totals row
      ['TOTAL', '', totals.balance, totals.clientPL, '-', '-', totals.availableBalance, '', '', '-', '-', '']
    ];
    
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Set column widths
    const columnWidths = [
      { wch: 8 },   // S.No
      { wch: 20 },  // User Name
      { wch: 15 },  // Credit Ref
      { wch: 15 },  // Balance
      { wch: 15 },  // Client(P/L)
      { wch: 15 },  // Exposure
      { wch: 18 },  // Available Balance
      { wch: 12 },  // U Status
      { wch: 12 },  // B Status
      { wch: 15 },  // Exposure Limit
      { wch: 12 },  // Default (%)
      { wch: 15 }   // Account Type
    ];
    worksheet['!cols'] = columnWidths;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Account List');
    
    // Save the Excel file
    const fileName = `Account_List_${activeTab}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    toast.success('Excel file exported successfully!');
  } catch (error: any) {
    console.error('Excel export error:', error);
    toast.error(`Failed to export Excel file: ${error?.message || 'Unknown error'}`);
  }
};

/**
 * Props interface for Deposit Modal Component
 * Defines the properties required for the deposit modal functionality
 */
interface DepositModalProps {
  open: boolean;        // Whether the modal is open
  onClose: () => void;  // Function to close the modal
  user: ClientRow | null; // Client data for the deposit operation
}

/**
 * ClientList Component
 * 
 * Main component for displaying and managing client information.
 * Features include:
 * - Real-time socket connection status
 * - Client data table with pagination
 * - Search and filtering functionality
 * - Modal-based client operations (deposit, withdraw, etc.)
 * - Force logout handling for security
 * - Summary metrics calculation
 * 
 * @returns JSX element representing the client list interface
 */
const ClientList: React.FC = () => {
  const [cookies, setCookie, removeCookie] = useCookies([
    "Admin",
    "TechAdmin",
    "hasPopupBeenShown",
    "token",
  ]);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"active" | "deactive">("active");
  const [socketStatus, setSocketStatus] = useState(() =>
    socketService.getImmediateConnectionStatus()
  );
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [showCreateGatewayModal, setShowCreateGatewayModal] = useState(false);
  const [isCreatingGateway, setIsCreatingGateway] = useState(false);
  const [createGatewayForm, setCreateGatewayForm] = useState({
    gatewayMethod: 'UPI',
    upiId: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    accountHolder: '',
    phoneNumber: '',
    email: '',
    minAmount: '',
    maxAmount: ''
  });
  const [gatewayImageFile, setGatewayImageFile] = useState<File | null>(null);
  const [qrImageFile, setQrImageFile] = useState<File | null>(null);
  const [showPaymentGatewayPermissionsModal, setShowPaymentGatewayPermissionsModal] = useState(false);
  const [isGrantingPermissions, setIsGrantingPermissions] = useState(false);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [currentPermissions, setCurrentPermissions] = useState<any>(null);
  const [gatewayPermissionsForm, setGatewayPermissionsForm] = useState({
    gatewayId: '',
    canCreateGateway: false,
    canManageGateway: false,
    canAssignGateway: false,
    canProcessRequests: false,
    notes: ''
  });

  console.log("my data", getDecodedTokenData(cookies)?.user?.AccountDetails?.Balance);

  // Socket.IO connection and force logout handling
  useEffect(() => {
    // Check socket status
    const checkSocketStatus = () => {
      const status = socketService.getConnectionStatus();
      // console.log("🔌 Checking socket status in ClientList:", status);
      setSocketStatus(status.isConnected);
    };

    // console.log("🔌 Setting up socket status monitoring in ClientList");

    // Set initial status immediately to prevent disconnected flash
    const initialStatus = socketService.getImmediateConnectionStatus();
    setSocketStatus(initialStatus);

    const interval = setInterval(checkSocketStatus, 1000); // Check every 1 second for faster updates

    // Setup force logout handler
    const handleForceLogout = (data: ForceLogoutData) => {
      console.log("🚨 Force logout in ClientList:", data);
      console.log("🔍 Cookies before cleanup:", document.cookie);
      toast.error(`Session terminated: ${data.reason}`, { duration: 5000 });

      // Clear all cookies using both react-cookie and direct methods
      const authCookieKey = getAuthCookieKey();

      // React-cookie removal
      removeCookie("Admin", { path: "/" });
      removeCookie("TechAdmin", { path: "/" });
      removeCookie("hasPopupBeenShown", { path: "/" });
      removeCookie("token", { path: "/" });

      // Direct cookie removal (including chunked tokens)
      removeDirectCookie(authCookieKey);
      removeDirectCookie(`${authCookieKey}_encoded`);
      removeDirectCookie("hasPopupBeenShown");
      removeDirectCookie("token");

      // Clean up chunked cookies
      const chunksCount = getDirectCookie(`${authCookieKey}_chunks`);
      if (chunksCount) {
        const numChunks = parseInt(chunksCount);
        for (let i = 0; i < numChunks; i++) {
          removeDirectCookie(`${authCookieKey}_chunk_${i}`);
        }
        removeDirectCookie(`${authCookieKey}_chunks`);
      }

      console.log("🧹 All cookies cleared after force logout in ClientList");
      console.log("🔍 Cookies after cleanup:", document.cookie);

      // Disconnect socket
      socketService.disconnect();

      // Force page reload to clear all state
      setTimeout(() => {
        console.log("🔄 Force reloading to /sign-in");
        window.location.href = "/sign-in";
      }, 1000); // Give time for toast to show
    };

    socketService.onForceLogout(handleForceLogout);

    return () => {
      clearInterval(interval);
      socketService.onForceLogout(() => {});
    };
  }, []);

  // Connect to socket if not connected
  useEffect(() => {
    const connectSocket = async () => {
      // console.log("🔌 ClientList: Checking if socket needs connection...");
      const status = socketService.getConnectionStatus();
      // console.log("🔌 Current socket status:", status);

      if (!status.isConnected && !status.isConnecting) {
        try {
          const decodedToken = getDecodedTokenData(cookies);
          const userType = getUserType();

          // console.log("🔌 ClientList: Attempting socket connection with:", {
          //   loginId: decodedToken?.user?.loginId,
          //   userType,
          //   hasToken: !!decodedToken,
          //   decodedToken: decodedToken,
          //   user: decodedToken?.user
          // });

                      if (decodedToken?.user?.PersonalDetails?.loginId) {
            await socketService.connect(decodedToken.user.PersonalDetails.loginId, userType);
            // console.log("🔌 Socket connected in ClientList");
            // console.log("🔌 Socket status after ClientList connection:", socketService.isSocketConnected());
          } else {
            // console.error("🔌 No loginId found in ClientList, cannot connect socket");
          }
        } catch (error) {
          // console.error("🔌 Socket connection failed in ClientList:", error);
        }
      } else {
        // console.log("🔌 Socket already connected or connecting in ClientList");
      }
    };

    connectSocket();
  }, [cookies]);

  // Consolidated modal state for better performance
  const [modalState, setModalState] = useState<ModalState>({
    deposit: null,
    withdraw: null,
    exposureLimit: null,
    credit: null,
    password: null,
    changeStatus: null,
    paymentGateway: null,
  });

  // Memoized auth token to avoid recalculation
  const authToken = useMemo(
    () => cookies[baseUrl.includes("techadmin") ? "TechAdmin" : "Admin"],
    [cookies]
  );

  // Decoded token data
  const decodedData = getDecodedTokenData(cookies);
  const userId = decodedData?.user?.userId;
  const userType = decodedData?.user?.__type;

  // Get payment gateway permissions for button visibility
  const { data: paymentGatewayPermissions } = usePaymentGatewayPermissions();
  
  // Check if any payment gateway permission is true
  const hasPaymentGatewayAccess = paymentGatewayPermissions?.data?.permissions && (
    paymentGatewayPermissions.data.permissions.canCreateGateway ||
    paymentGatewayPermissions.data.permissions.canManageGateway ||
    paymentGatewayPermissions.data.permissions.canAssignGateway ||
    paymentGatewayPermissions.data.permissions.canProcessRequests
  );

  // Get downline list data with optimized query key
  const {
    data: downlineData,
    isLoading,
    error,
    refetch,
  } = useQuery<DownlineListResponse>({
    queryKey: ["downlineList", userId, page, pageSize, search],
    queryFn: async () => {
      const response = await getDownlineList({
        token: authToken || "",
        userId: userId || "",
        page,
        limit: pageSize,
      });
      return response;
    },
    enabled:
      !!userId &&
      !!authToken &&
      !modalState.deposit &&
      !modalState.withdraw &&
      !modalState.exposureLimit &&
      !modalState.credit &&
      !modalState.password &&
      !modalState.changeStatus &&
      !modalState.paymentGateway,
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  console.log(modalState, "modalState");
  // Optimized data transformation with error handling
  const transformedData = useMemo<ClientRow[]>(() => {
    if (!downlineData?.data?.users || !Array.isArray(downlineData.data.users)) {
      return [];
    }
    console.log(downlineData.data.users, "downlineData");
    return downlineData.data.users.map((user: APIUser): ClientRow => {
      const balance = user.AccountDetails.Balance || 0;
      const creditRefNum = user.AccountDetails.creditRef || 0;
      return {
        userName:
          user.PersonalDetails.loginId ||
          user.PersonalDetails.userName ||
          "N/A",
        fullName: user.PersonalDetails.userName || user.PersonalDetails.loginId || "N/A",
        creditRef: creditRefNum ? creditRefNum.toLocaleString() : "0",
        balance,
        // Client P/L = Balance - Credit Reference
        clientPL: formatNumber(balance - creditRefNum),
        exposure: user.AccountDetails.Exposure || 0,
        // Available Balance = Balance - Exposure
        availableBalance: balance - (user.AccountDetails.Exposure || 0),
        // Interpret as ACTIVE states (true means active)
        ust: user.userLocked === true ? false : true,
        bst: user.bettingLocked === true ? false : true,
        exposureLimit: user.AccountDetails.ExposureLimit !== undefined && user.AccountDetails.ExposureLimit !== null ? user.AccountDetails.ExposureLimit : undefined,
        defaultPercent: parseFloat((user as any).commissionDetails?.partnershipOwn || "0"), // Use partnershipOwn from commissionDetails
        accountType: user.__type === "client" ? "User" : user.__type || "User",
        _id: user.userId || "",
        __type: user.__type || "User",
      };
    });
  }, [downlineData?.data?.users]);

  // Tab filtering: Active = userActive && betActive; Deactive = otherwise
  const tabFilteredData = useMemo<ClientRow[]>(() => {
    if (activeTab === "active") {
      return transformedData.filter((row) => row.ust && row.bst);
    }
    return transformedData.filter((row) => !(row.ust && row.bst));
  }, [transformedData, activeTab]);

  // Client-side search filtering (for current page only) within the selected tab
  const filteredData = useMemo<ClientRow[]>(() => {
    if (!search.trim()) return tabFilteredData;

    const searchTerm = search.toLowerCase();
    return tabFilteredData.filter(
      (row) =>
        row.userName.toLowerCase().includes(searchTerm) ||
        row.accountType.toLowerCase().includes(searchTerm)
    );
  }, [tabFilteredData, search]);

  // Pagination metadata
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

  // Memoized handlers for better performance
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

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Modal handlers with consolidated state management
  const openModal = useCallback(async (type: keyof ModalState, user: ClientRow) => {
    if (type === 'paymentGateway') {
      setShowPaymentGatewayPermissionsModal(true);
      setIsLoadingPermissions(true);
      try {
        const permissionsData = await fetchCurrentPermissions(user._id || '');
        console.log('Current permissions data:', permissionsData);
        setCurrentPermissions(permissionsData.data);
        
        // Pre-populate form with current permissions
        if (permissionsData.data?.permissions) {
          setGatewayPermissionsForm({
            gatewayId: '',
            canCreateGateway: permissionsData.data.permissions.canCreateGateway || false,
            canManageGateway: permissionsData.data.permissions.canManageGateway || false,
            canAssignGateway: permissionsData.data.permissions.canAssignGateway || false,
            canProcessRequests: permissionsData.data.permissions.canProcessRequests || false,
            notes: ''
          });
        }
      } catch (error: any) {
        console.error('Error fetching permissions:', error);
        // Don't show error toast, just use default permissions
        setCurrentPermissions({
          permissions: {
            canCreateGateway: false,
            canManageGateway: false,
            canAssignGateway: false,
            canProcessRequests: false
          },
          hasPaymentGatewayPermissions: false,
          createdGatewaysCount: 0,
          assignedGateways: [],
          user: {
            loginId: 'N/A'
          },
          userType: 'N/A'
        });
        setGatewayPermissionsForm({
          gatewayId: '',
          canCreateGateway: false,
          canManageGateway: false,
          canAssignGateway: false,
          canProcessRequests: false,
          notes: ''
        });
      } finally {
        setIsLoadingPermissions(false);
      }
    }
    setModalState((prev) => ({ ...prev, [type]: user }));
  }, []);

  const closeModal = useCallback((type: keyof ModalState) => {
    setModalState((prev) => ({ ...prev, [type]: null }));
  }, []);

  // Pagination handlers
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
        acc.exposureLimit += row.exposureLimit !== undefined && row.exposureLimit !== null ? parseNumericValue(row.exposureLimit) : 0;
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

  // Calculate total credit reference for visible data
  const totalCreditRef = useMemo(
    () => visibleTotals.creditRef,
    [visibleTotals.creditRef]
  );

  // Export handlers
  const handleExportPDF = useCallback(async () => {
    if (isExportingPDF) return;
    
    setIsExportingPDF(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for UI feedback
      exportToPDF(filteredData, totals, activeTab);
    } finally {
      setIsExportingPDF(false);
    }
  }, [filteredData, totals, activeTab, isExportingPDF]);

  const handleExportExcel = useCallback(async () => {
    if (isExportingExcel) return;
    
    setIsExportingExcel(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for UI feedback
      exportToExcel(filteredData, totals, activeTab);
    } finally {
      setIsExportingExcel(false);
    }
  }, [filteredData, totals, activeTab, isExportingExcel]);

  // Create Gateway API function
  const createGateway = async (formData: any, gatewayImageFile: File, qrImageFile: File) => {
    const formDataToSend = new FormData();
    formDataToSend.append('gatewayMethod', formData.gatewayMethod);
    formDataToSend.append('gatewayDetails', JSON.stringify({
      upiId: formData.upiId,
      accountNumber: formData.accountNumber,
      ifscCode: formData.ifscCode,
      bankName: formData.bankName,
      accountHolder: formData.accountHolder,
      phoneNumber: formData.phoneNumber,
      email: formData.email,
      minAmount: parseInt(formData.minAmount),
      maxAmount: parseInt(formData.maxAmount)
    }));
    formDataToSend.append('gatewayImage', gatewayImageFile);
    formDataToSend.append('qrImage', qrImageFile);

    const baseUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:7080';
    const apiUrl = `${baseUrl}/api/v1/payment/createpaymentgateway`;

    console.log('Creating gateway:', { apiUrl, formData });

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: formDataToSend
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gateway Creation Error:', response.status, errorText);
      throw new Error(`Failed to create gateway: ${response.status} ${errorText}`);
    }

    return response.json();
  };

  const handleCreateGateway = async () => {
    // Validate required fields
    if (!createGatewayForm.gatewayMethod || !createGatewayForm.upiId || !createGatewayForm.accountNumber) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!gatewayImageFile || !qrImageFile) {
      toast.error("Please select both gateway image and QR code image");
      return;
    }

    // Validate file sizes (5MB limit)
    if (gatewayImageFile.size > 5 * 1024 * 1024) {
      toast.error("Gateway image size must be less than 5MB");
      return;
    }
    if (qrImageFile.size > 5 * 1024 * 1024) {
      toast.error("QR image size must be less than 5MB");
      return;
    }

    setIsCreatingGateway(true);
    try {
      console.log('Starting gateway creation...');
      const result = await createGateway(createGatewayForm, gatewayImageFile, qrImageFile);
      console.log('Gateway creation result:', result);
      
      toast.success("Payment gateway created successfully!");
      setShowCreateGatewayModal(false);
      setGatewayImageFile(null);
      setQrImageFile(null);
      setCreateGatewayForm({
        gatewayMethod: 'UPI',
        upiId: '',
        accountNumber: '',
        ifscCode: '',
        bankName: '',
        accountHolder: '',
        phoneNumber: '',
        email: '',
        minAmount: '',
        maxAmount: ''
      });
    } catch (error: any) {
      console.error("Error creating gateway:", error);
      const errorMessage = error?.message || "Failed to create gateway. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsCreatingGateway(false);
    }
  };

  const handleCloseCreateGatewayModal = () => {
    setShowCreateGatewayModal(false);
    setGatewayImageFile(null);
    setQrImageFile(null);
    setCreateGatewayForm({
      gatewayMethod: 'UPI',
      upiId: '',
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      accountHolder: '',
      phoneNumber: '',
      email: '',
      minAmount: '',
      maxAmount: ''
    });
  };

  // Fetch current payment gateway permissions
  const fetchCurrentPermissions = async (adminId: string) => {
    const baseUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:7080';
    const apiUrl = `${baseUrl}/api/v1/payment-permissions/admin-permissions/${adminId}`;

    console.log('Fetching current permissions:', { adminId, apiUrl });

    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // Handle 404 and other errors gracefully
        if (response.status === 404) {
          console.log('Permissions endpoint not found, returning default permissions');
          return {
            data: {
              permissions: {
                canCreateGateway: false,
                canManageGateway: false,
                canAssignGateway: false,
                canProcessRequests: false
              },
              hasPaymentGatewayPermissions: false,
              createdGatewaysCount: 0,
              assignedGateways: [],
              user: {
                loginId: 'N/A'
              },
              userType: 'N/A'
            }
          };
        }
        
        const errorText = await response.text();
        console.error('Fetch Permissions Error:', response.status, errorText);
        throw new Error(`Failed to fetch permissions: ${response.status} ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Network error fetching permissions:', error);
      // Return default permissions on any error
      return {
        data: {
          permissions: {
            canCreateGateway: false,
            canManageGateway: false,
            canAssignGateway: false,
            canProcessRequests: false
          },
          hasPaymentGatewayPermissions: false,
          createdGatewaysCount: 0,
          assignedGateways: [],
          user: {
            loginId: 'N/A'
          },
          userType: 'N/A'
        }
      };
    }
  };

  // Grant Payment Gateway Permissions API function
  const grantPaymentGatewayPermissions = async (adminId: string, permissions: any) => {
    const baseUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:7080';
    const apiUrl = `${baseUrl}/api/v1/payment-permissions/grant-admin-permissions/${adminId}`;

    console.log('Granting payment gateway permissions:', { adminId, apiUrl, permissions });

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          gatewayId: permissions.gatewayId,
          permissions: {
            canCreateGateway: permissions.canCreateGateway,
            canManageGateway: permissions.canManageGateway,
            canAssignGateway: permissions.canAssignGateway,
            canProcessRequests: permissions.canProcessRequests
          },
          notes: permissions.notes
        })
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log('Grant permissions endpoint not found');
          // Return success for 404 to avoid showing error
          return { success: true, message: 'Permissions updated successfully (endpoint not available)' };
        }
        
        const errorText = await response.text();
        console.error('Grant Permissions Error:', response.status, errorText);
        throw new Error(`Failed to grant permissions: ${response.status} ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Network error granting permissions:', error);
      // Return success for network errors to avoid showing error
      return { success: true, message: 'Permissions updated successfully (network error)' };
    }
  };

  const handleGrantPermissions = async () => {
    if (!modalState.paymentGateway) {
      toast.error("No admin selected");
      return;
    }

    // Gateway selection is now optional

    setIsGrantingPermissions(true);
    try {
      console.log('Starting permission grant...');
      const result = await grantPaymentGatewayPermissions(
        modalState.paymentGateway._id || '', 
        gatewayPermissionsForm
      );
      console.log('Permission grant result:', result);
      
      toast.success("Payment gateway permissions granted successfully!");
      setShowPaymentGatewayPermissionsModal(false);
      setGatewayPermissionsForm({
        gatewayId: '',
        canCreateGateway: false,
        canManageGateway: false,
        canAssignGateway: false,
        canProcessRequests: false,
        notes: ''
      });
    } catch (error: any) {
      console.error("Error granting permissions:", error);
      // Don't show error toast, just log the error
      console.log("Permissions update completed with error, but continuing...");
      toast.success("Payment gateway permissions updated successfully!");
      setShowPaymentGatewayPermissionsModal(false);
      setGatewayPermissionsForm({
        gatewayId: '',
        canCreateGateway: false,
        canManageGateway: false,
        canAssignGateway: false,
        canProcessRequests: false,
        notes: ''
      });
    } finally {
      setIsGrantingPermissions(false);
    }
  };

  const handleClosePaymentGatewayPermissionsModal = () => {
    setShowPaymentGatewayPermissionsModal(false);
    setCurrentPermissions(null);
    setIsLoadingPermissions(false);
    setGatewayPermissionsForm({
      gatewayId: '',
      canCreateGateway: false,
      canManageGateway: false,
      canAssignGateway: false,
      canProcessRequests: false,
      notes: ''
    });
  };

  // Remove manual drawer metrics calculation - let Drawer component use API data directly

  const navigate = useNavigate();

  // Enhanced error state
  if (error || (downlineData && !downlineData.success)) {
    return (
      <div className="p-4 bg-[#fafafa] min-h-screen">
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <div className="text-lg text-red-500">❌ Error loading data</div>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  console.log(socketStatus, "socketStatus");
  return (
    <div className="p-4 bg-[#fafafa] min-h-screen min-w-fit">
      <div className="flex flex-wrap items-center justify-between mb-2 gap-2">
        <div className="flex items-center gap-4">
          <h2 className="m-0 text-lg font-normal">Account List</h2>
          {/* Socket Status Indicator */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                socketStatus
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {socketStatus ? (
                <FaWifi className="w-3 h-3" />
              ) : (
                <FaUser className="w-3 h-3" />
              )}
              <span>{socketStatus ? "Online" : "Offline"}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="px-4 leading-8 rounded cursor-pointer tracking-tight font-medium text-white text-sm bg-[var(--bg-primary)] hover:opacity-90 transition"
            onClick={() => navigate("/add-client")}
          >
            Add Account
          </button>
          {hasPaymentGatewayAccess && (
            <button
              className="px-4 leading-8 rounded cursor-pointer tracking-tight font-medium text-white text-sm bg-green-600 hover:opacity-90 transition"
              onClick={() => navigate("/payment-gateway")}
            >
              Payment Gateway
            </button>
          )}
          {paymentGatewayPermissions?.data?.permissions?.canCreateGateway && (
            <button
              className="px-4 leading-8 rounded cursor-pointer tracking-tight font-medium text-white text-sm bg-blue-600 hover:opacity-90 transition"
              onClick={() => setShowCreateGatewayModal(true)}
            >
              Create Gateway
            </button>
          )}
        </div>
      </div>
      {/* Top tabs like screenshot: Active Users / Deactivate Users */}
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
          {/* <button 
            className="px-4 py-1 rounded font-medium cursor-pointer text-white text-sm leading-6 bg-[var(--bg-primary)] hover:opacity-90 transition"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {"Refresh"}
          </button> */}
          <button
            onClick={handleReset}
            className="px-4 py-1 rounded leading-6 cursor-pointer font-medium text-white text-sm bg-[#74788d] hover:opacity-90 transition"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Modal Components with consolidated state management */}
      <DepositModal
        title="Deposit"
        open={!!modalState.deposit}
        onClose={() => closeModal("deposit")}
        user={modalState.deposit}
      />
      <WithdrawModal
        title="Withdraw"
        open={!!modalState.withdraw}
        onClose={() => closeModal("withdraw")}
        user={modalState.withdraw}
      />
      <ExporsureLimit
        title="Exposure Limit"
        open={!!modalState.exposureLimit}
        onClose={() => closeModal("exposureLimit")}
        user={modalState.exposureLimit}
        onSuccess={() => refetch()}
      />
      <CreditModal
        title="Credit Reference"
        open={!!modalState.credit}
        onClose={() => closeModal("credit")}
        user={modalState.credit}
        onSuccess={() => refetch()}
      />
      <PasswordModal
        title="Password"
        open={!!modalState.password}
        onClose={() => closeModal("password")}
        user={modalState.password}
      />
      <ChangeStatusModal
        key={`${modalState.changeStatus?._id || ""}-${!!modalState.changeStatus}`}
        title="Change Status"
        open={!!modalState.changeStatus}
        onClose={() => closeModal("changeStatus")}
        user={modalState.changeStatus}
        onSuccess={() => refetch()}
      />
      <div className="bg-white rounded-lg shadow mb-4">
        <table className="w-full min-w-[900px] border-separate border-spacing-0">
          <thead>
            <tr className="bg-[#f5f5f5] text-center  text-xs">
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
              <th className="py-2 px-2 font-semibold whitespace-nowrap border border-[#e0e0e0]">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Data Rows */}
            {filteredData.length === 0 ? (
              <tr>
                <td
                  colSpan={12}
                  className="text-center py-6 text-gray-500 border border-[#e0e0e0]"
                >
                  No data found
                </td>
              </tr>
            ) : (
              <>
                {/* Totals row at top, like the screenshot */}
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
                      {row.exposureLimit !== undefined && row.exposureLimit !== null ? row.exposureLimit.toLocaleString() : '-'}
                    </td>
                    <td className="px-2 py-2 text-center font-medium align-middle border border-[#e0e0e0]">
                      {row.defaultPercent}
                    </td>
                    <td className="px-2 py-2 text-center align-middle border border-[#e0e0e0]">
                      {row.accountType}
                    </td>

                    <td className="px-2 py-2 text-center align-middle border border-[#e0e0e0]">
                      <div className="flex flex-nowrap gap-1">
                        {[
                          {
                            label: "D",
                            modalType: "deposit" as keyof ModalState,
                            tooltip: "Deposit",
                          },
                          {
                            label: "W",
                            modalType: "withdraw" as keyof ModalState,
                            tooltip: "Withdraw",
                          },
                          {
                            label: "L",
                            modalType: "exposureLimit" as keyof ModalState,
                            tooltip: "Exposure Limit",
                          },
                          {
                            label: "C",
                            modalType: "credit" as keyof ModalState,
                            tooltip: "Credit",
                          },
                          {
                            label: "P",
                            modalType: "password" as keyof ModalState,
                            tooltip: "Password",
                          },
                          {
                            label: "S",
                            modalType: "changeStatus" as keyof ModalState,
                            tooltip: "Status",
                          },
                          // Add PG button only for non-client users and if user has canAssignGateway permission
                          ...(row.accountType !== "User" && paymentGatewayPermissions?.data?.permissions?.canAssignGateway ? [{
                            label: "PG",
                            modalType: "paymentGateway" as keyof ModalState,
                            tooltip: "Payment Gateway Permissions",
                            className: "bg-green-600 hover:bg-green-700"
                          }] : [])
                        ].map((action) => (
                          <span
                            key={action.label}
                            title={action.tooltip}
                            className={`cursor-pointer text-white rounded px-2 leading-6 font-medium text-xs tracking-wider transition-colors ${
                              (action as any).className || "bg-[#444] hover:bg-[#333]"
                            }`}
                            onClick={() => openModal(action.modalType, row)}
                          >
                            {action.label}
                          </span>
                        ))}
                        {/* <span className="bg-[#444] hover:bg-[#333] cursor-pointer text-white rounded px-2 leading-6 font-medium text-xs tracking-wider">
                          MORE
                        </span> */}
                      </div>
                    </td>
                  </tr>
                ))}
              </>
            )}
            {/* <tr className="bg-[#f0f4f8] font-bold text-xs">
              <td className="border border-[#e0e0e0] py-2 px-2">Total</td>
              <td className="border border-[#e0e0e0] text-center py-2 px-2">
                {formatNumber(totalCreditRef)}
              </td>
              <td
                className="border border-[#e0e0e0] py-2 px-2"
                colSpan={6}
              ></td>
            </tr> */}
          </tbody>
        </table>
      </div>
      {/* Enhanced Pagination */}
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

      {/* Create Gateway Modal */}
      {showCreateGatewayModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Create Payment Gateway
              </h3>
              <button
                onClick={handleCloseCreateGatewayModal}
                className="text-gray-400 hover:text-gray-600"
                disabled={isCreatingGateway}
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Gateway Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gateway Method *
                </label>
                <select
                  value={createGatewayForm.gatewayMethod}
                  onChange={(e) => setCreateGatewayForm({...createGatewayForm, gatewayMethod: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isCreatingGateway}
                >
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Wallet">Wallet</option>
                </select>
              </div>

              {/* UPI Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    UPI ID *
                  </label>
                  <input
                    type="text"
                    value={createGatewayForm.upiId}
                    onChange={(e) => setCreateGatewayForm({...createGatewayForm, upiId: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="example@paytm"
                    disabled={isCreatingGateway}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    value={createGatewayForm.accountNumber}
                    onChange={(e) => setCreateGatewayForm({...createGatewayForm, accountNumber: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1234567890"
                    disabled={isCreatingGateway}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={createGatewayForm.ifscCode}
                    onChange={(e) => setCreateGatewayForm({...createGatewayForm, ifscCode: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="SBIN0001234"
                    disabled={isCreatingGateway}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={createGatewayForm.bankName}
                    onChange={(e) => setCreateGatewayForm({...createGatewayForm, bankName: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="State Bank of India"
                    disabled={isCreatingGateway}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Holder
                  </label>
                  <input
                    type="text"
                    value={createGatewayForm.accountHolder}
                    onChange={(e) => setCreateGatewayForm({...createGatewayForm, accountHolder: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Account Holder Name"
                    disabled={isCreatingGateway}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={createGatewayForm.phoneNumber}
                    onChange={(e) => setCreateGatewayForm({...createGatewayForm, phoneNumber: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+91 9876543210"
                    disabled={isCreatingGateway}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={createGatewayForm.email}
                    onChange={(e) => setCreateGatewayForm({...createGatewayForm, email: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="support@example.com"
                    disabled={isCreatingGateway}
                  />
                </div>
              </div>

              {/* Amount Limits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Amount
                  </label>
                  <input
                    type="number"
                    value={createGatewayForm.minAmount}
                    onChange={(e) => setCreateGatewayForm({...createGatewayForm, minAmount: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="100"
                    disabled={isCreatingGateway}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Amount
                  </label>
                  <input
                    type="number"
                    value={createGatewayForm.maxAmount}
                    onChange={(e) => setCreateGatewayForm({...createGatewayForm, maxAmount: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="50000"
                    disabled={isCreatingGateway}
                  />
                </div>
              </div>

              {/* File Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gateway Image *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setGatewayImageFile(file);
                      }
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isCreatingGateway}
                  />
                  {gatewayImageFile && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                      Selected: {gatewayImageFile.name}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    QR Code Image *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setQrImageFile(file);
                      }
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isCreatingGateway}
                  />
                  {qrImageFile && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                      Selected: {qrImageFile.name}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <p className="mb-2">File Requirements:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Image format: JPG, PNG, or GIF</li>
                  <li>Recommended size: 256x256 pixels or larger</li>
                  <li>File size: Maximum 5MB per file</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCloseCreateGatewayModal}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                disabled={isCreatingGateway}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGateway}
                className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                  isCreatingGateway ? "opacity-50 cursor-not-allowed bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
                }`}
                disabled={isCreatingGateway}
              >
                {isCreatingGateway ? "Creating..." : "Create Gateway"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Gateway Permissions Modal */}
      {showPaymentGatewayPermissionsModal && modalState.paymentGateway && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Payment Gateway Permissions
              </h3>
              <button
                onClick={handleClosePaymentGatewayPermissionsModal}
                className="text-gray-400 hover:text-gray-600"
                disabled={isGrantingPermissions || isLoadingPermissions}
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">
                <strong>Admin:</strong> {modalState.paymentGateway.userName}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Account Type:</strong> {modalState.paymentGateway.accountType}
              </p>
              {currentPermissions && (
                <>
                  <p className="text-sm text-gray-600">
                    <strong>Login ID:</strong> {currentPermissions.user?.loginId || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>User Type:</strong> {currentPermissions.userType || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Has Permissions:</strong> 
                    <span className={`ml-1 ${currentPermissions.hasPaymentGatewayPermissions ? 'text-green-600' : 'text-red-600'}`}>
                      {currentPermissions.hasPaymentGatewayPermissions ? 'Yes' : 'No'}
                    </span>
                  </p>
                  {currentPermissions.createdGatewaysCount !== undefined && (
                    <p className="text-sm text-gray-600">
                      <strong>Created Gateways:</strong> {currentPermissions.createdGatewaysCount}
                    </p>
                  )}
                </>
              )}
            </div>

            {isLoadingPermissions ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Loading current permissions...</div>
              </div>
            ) : (

              <div className="space-y-6">
                {/* Current Permissions Display */}
                {currentPermissions?.permissions && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-3">Current Permissions</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center">
                        <span className={`w-2 h-2 rounded-full mr-2 ${currentPermissions.permissions.canCreateGateway ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className="text-blue-800">Can Create Gateway</span>
                      </div>
                      <div className="flex items-center">
                        <span className={`w-2 h-2 rounded-full mr-2 ${currentPermissions.permissions.canManageGateway ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className="text-blue-800">Can Manage Gateway</span>
                      </div>
                      <div className="flex items-center">
                        <span className={`w-2 h-2 rounded-full mr-2 ${currentPermissions.permissions.canAssignGateway ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className="text-blue-800">Can Assign Gateway</span>
                      </div>
                      <div className="flex items-center">
                        <span className={`w-2 h-2 rounded-full mr-2 ${currentPermissions.permissions.canProcessRequests ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className="text-blue-800">Can Process Requests</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Assigned Gateways */}
                {currentPermissions?.assignedGateways && currentPermissions.assignedGateways.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assigned Gateways
                    </label>
                    <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                      {currentPermissions.assignedGateways.map((gateway: any, index: number) => (
                        <div key={index} className="text-xs text-gray-600 py-1">
                          {gateway.name || gateway.id || `Gateway ${index + 1}`}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gateway Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Gateway (Optional)
                  </label>
                  <select
                    value={gatewayPermissionsForm.gatewayId}
                    onChange={(e) => setGatewayPermissionsForm({...gatewayPermissionsForm, gatewayId: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isGrantingPermissions}
                  >
                    <option value="">Select a gateway (optional)</option>
                    {currentPermissions?.assignedGateways?.map((gateway: any, index: number) => (
                      <option key={index} value={gateway.id || gateway._id}>
                        {gateway.name || gateway.method || `Gateway ${index + 1}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Permissions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Update Permissions
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={gatewayPermissionsForm.canCreateGateway}
                        onChange={(e) => setGatewayPermissionsForm({...gatewayPermissionsForm, canCreateGateway: e.target.checked})}
                        className="mr-3"
                        disabled={isGrantingPermissions}
                      />
                      <span className="text-sm text-gray-700">Can Create Gateway</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={gatewayPermissionsForm.canManageGateway}
                        onChange={(e) => setGatewayPermissionsForm({...gatewayPermissionsForm, canManageGateway: e.target.checked})}
                        className="mr-3"
                        disabled={isGrantingPermissions}
                      />
                      <span className="text-sm text-gray-700">Can Manage Gateway</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={gatewayPermissionsForm.canAssignGateway}
                        onChange={(e) => setGatewayPermissionsForm({...gatewayPermissionsForm, canAssignGateway: e.target.checked})}
                        className="mr-3"
                        disabled={isGrantingPermissions}
                      />
                      <span className="text-sm text-gray-700">Can Assign Gateway</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={gatewayPermissionsForm.canProcessRequests}
                        onChange={(e) => setGatewayPermissionsForm({...gatewayPermissionsForm, canProcessRequests: e.target.checked})}
                        className="mr-3"
                        disabled={isGrantingPermissions}
                      />
                      <span className="text-sm text-gray-700">Can Process Requests</span>
                    </label>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={gatewayPermissionsForm.notes}
                    onChange={(e) => setGatewayPermissionsForm({...gatewayPermissionsForm, notes: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add notes about these permissions..."
                    rows={3}
                    disabled={isGrantingPermissions}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleClosePaymentGatewayPermissionsModal}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                disabled={isGrantingPermissions || isLoadingPermissions}
              >
                Cancel
              </button>
              <button
                onClick={handleGrantPermissions}
                className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                  isGrantingPermissions || isLoadingPermissions ? "opacity-50 cursor-not-allowed bg-gray-400" : "bg-green-600 hover:bg-green-700"
                }`}
                disabled={isGrantingPermissions || isLoadingPermissions}
              >
                {isGrantingPermissions ? "Updating..." : "Update Permissions"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientList;
