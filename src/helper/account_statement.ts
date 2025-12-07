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

export interface AccountStatementParams {
  accountType: string;
  sportType?: string;
  gameName?: string;
  startdate?: string;
  enddate?: string;
  page: number;
  limit: number;
}

export const getAccountStatementWithFilters = async (
  cookies: any,
  params: AccountStatementParams
) => {
  const token = isAuthenticated(cookies);
  
  // Build query string
  const queryParams = new URLSearchParams();
  queryParams.append("accountType", params.accountType);
  if (params.sportType) queryParams.append("sportType", params.sportType);
  if (params.gameName) queryParams.append("gameName", params.gameName);
  if (params.startdate) queryParams.append("startdate", params.startdate);
  if (params.enddate) queryParams.append("enddate", params.enddate);
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
