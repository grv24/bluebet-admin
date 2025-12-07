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
  date: string;
  credit: number | null;
  debit: number | null;
  closing: number;
  description: string;
  fromTo: string | null;
  betId: string | null;
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
  casinoList?: string;
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
  
  // Transform account type display names to API values
  const transformAccountType = (type: string): string => {
    switch (type) {
      case "Deposit/Withdraw Report":
        return "deposit-withdraw";
      case "Sports Report":
        return "sports";
      case "Casino Report":
        return "casino";
      case "Third Party Casino Report":
        return "third-party-casino";
      default:
        return type.toLowerCase();
    }
  };
  
  // Build query string (token NOT included in query params)
  const queryParams = new URLSearchParams();
  
  // If accountType is "All", only pass page and limit
  if (params.accountType !== "All") {
    const transformedAccountType = transformAccountType(params.accountType);
    queryParams.append("accountType", transformedAccountType);
    if (params.sportType) queryParams.append("sportType", params.sportType.toLowerCase());
    if (params.gameName) queryParams.append("gameName", params.gameName.toLowerCase());
    if (params.casinoList && params.casinoList !== "All") {
      queryParams.append("casinoList", params.casinoList.toLowerCase());
    }
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
