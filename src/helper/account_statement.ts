import { SERVER_URL, isAuthenticated } from "./auth";

export const getAccountStatement = async (cookies: any) => {
  const token = isAuthenticated(cookies);
  try {
    const response = await fetch(
      `${SERVER_URL}/api/v1/admin/account/statement/deposit/withdraw`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) {
      throw new Error("Failed to fetch account statement");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching account statement:", error);
    throw error;
  }
};

export interface Transaction {
  id: string;
  srNo: number;
  date: string;
  time: string;
  type: string;
  amount: number;
  balanceBefore: string;
  balanceAfter: string;
  exposureBefore: string;
  exposureAfter: string;
  remarks: string;
  userId: string;
  userName: string;
  loginId: string;
  userType: string;
  isOwnTransaction: boolean;
  fromTo: string | null;
  userDetails: any;
  sportType: string | null;
  casinoType: string | null;
  gameName: string | null;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Summary {
  totalTransactions: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalBets: number;
  totalSettlements: number;
}

export interface Filters {
  accountType: string;
  sportType: string;
  casinoType: string;
  gameName: string;
  startDate: string | null;
  endDate: string | null;
  targetUserIds: number;
}

export interface AccountStatementResponse {
  success: boolean;
  message: string;
  data: {
    transactions: Transaction[];
    pagination: Pagination;
    summary: Summary;
    filters: Filters;
  };
}

export interface AccountStatementParams {
  accountType: string;
  sportType?: string;
  gameName?: string;
  startdate?: string;
  enddate?: string;
  page: number;
  limit: number;
  token?: string;
}

export const getAccountStatementWithFilters = async (
  cookies: any,
  params: AccountStatementParams
) => {
  const token = params.token || isAuthenticated(cookies);
  
  // Build query string (token NOT included in query params)
  const queryParams = new URLSearchParams();
  
  // If accountType is "All", only pass page and limit
  if (params.accountType !== "All") {
    queryParams.append("accountType", params.accountType);
    if (params.sportType) queryParams.append("sportType", params.sportType);
    if (params.gameName) queryParams.append("gameName", params.gameName);
    if (params.startdate) queryParams.append("startdate", params.startdate);
    if (params.enddate) queryParams.append("enddate", params.enddate);
  }
  
  // Always include page and limit
  queryParams.append("page", params.page.toString());
  queryParams.append("limit", params.limit.toString());
  
  try {
    const response = await fetch(
      `${SERVER_URL}/api/v1/admin/account-statement?${queryParams.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    
    if (!response.ok) {
      throw new Error("Failed to fetch account statement");
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching account statement:", error);
    throw error;
  }
};
