import { SERVER_URL } from "@/helper/auth";

// Helper function to get token from cookies
export const getTokenFromCookies = (cookies: any): string | null => {
  const token = cookies?.Admin || cookies?.TechAdmin || cookies?.token;
  if (!token || token === "undefined") {
    return null;
  }
  return token as string;
};

// Helper function to create authenticated request
export const createAuthenticatedRequest = async (
  endpoint: string,
  cookies: any,
  options: RequestInit = {}
): Promise<any> => {
  const token = getTokenFromCookies(cookies);

  if (!token) {
    throw new Error("Authentication token not found");
  }

  const response = await fetch(`${SERVER_URL}${endpoint}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Generic API request wrapper with error handling

export const apiRequest = async <T>(
  endpoint: string,
  cookies: any,
  options: RequestInit = {}
): Promise<T> => {
  try {
    return await createAuthenticatedRequest(endpoint, cookies, options);
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
};
