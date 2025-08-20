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
