import { jwtDecode } from "jwt-decode";

/* server url */
export const SERVER_URL = import.meta.env.VITE_SERVER_URL;

/* client url */
export const baseUrl = window.location.origin.includes("localhost")
  ? import.meta.env.VITE_LOCAL_CLIENT_URL
  : window.location.origin;

/* Helper functions for authentication */
export const isTechAdminUrl = (): boolean => {
  return baseUrl.includes("techadmin");
};

export const getAuthCookieKey = (): "Admin" | "TechAdmin" => {
  return isTechAdminUrl() ? "TechAdmin" : "Admin";
};

export const getUserType = (): "admin" | "techadmin" => {
  return isTechAdminUrl() ? "techadmin" : "admin";
};

export const getUserTypeFromToken = (cookies: AuthCookies): "admin" | "techadmin" | null => {
  const decodedToken = getDecodedTokenData(cookies);
  if (!decodedToken) return null;
  
  console.log("🔍 getUserTypeFromToken - decoded token:", decodedToken);
  console.log("🔍 getUserTypeFromToken - __type:", decodedToken.user?.__type);
  
  // Check if __type exists and handle different possible values
  if (decodedToken.user?.__type === "techAdmin" || decodedToken.user?.__type === "techadmin") {
    return "techadmin";
  } else if (decodedToken.user?.__type === "admin" || decodedToken.user?.__type === "Admin") {
    return "admin";
  }
  
  // Fallback: check the URL to determine user type
  console.log("🔍 Falling back to URL-based user type detection");
  return isTechAdminUrl() ? "techadmin" : "admin";
};

// Debug function to check all cookies
export const debugCookies = (cookies: AuthCookies): void => {
  console.log("🍪 Cookie Debug Info:", {
    allCookies: cookies,
    adminCookie: cookies?.Admin ? `${cookies?.Admin?.substring(0, 20)}...` : "null",
    techAdminCookie: cookies?.TechAdmin ? `${cookies?.TechAdmin?.substring(0, 20)}...` : "null",
    hasPopupBeenShown: cookies?.hasPopupBeenShown,
    currentUrl: window.location.href,
    hostname: window.location.hostname,
    protocol: window.location.protocol,
  });

  // Decode and log token structure for debugging
  const authCookieKey = getAuthCookieKey();
  const token = cookies[authCookieKey];
  if (token) {
    try {
      const decoded = jwtDecode(token);
      console.log("🔍 Full Token Structure:", decoded);
    } catch (error) {
      console.error("❌ Error decoding token for debug:", error);
    }
  }
};

/* Types */
export interface LoginRequest {
  loginId: string;
  password: string;
  IpAddress: string;
  hostUrl: string;
}

export interface LoginResponse {
  isActive: boolean;
  user: any;
  status: boolean;
  message: string;
  data: {
    isActive: boolean;
    token: string;
  };
}

export interface DecodedToken {
  exp: number; // Unix timestamp
  iat: number; // Unix timestamp
  iss: string;
  permissions: {
    adminPanels: string[];
    canDeleteBets: boolean;
    canDeleteUsers: boolean;
    specialPermissions: boolean;
  };
  sessionData: {
    ip: string;
    userAgent: string;
  };
  user: {
    userId: string;
    PersonalDetails: {
      userName: string;
      loginId: string;
      user_password: string;
      countryCode: string | null;
      mobile: string | null;
      idIsActive: boolean;
      isAutoRegisteredUser: boolean;
    };
    IpAddress: string | null;
    uplineId: string;
    fancyLocked: boolean;
    bettingLocked: boolean;
    userLocked: boolean;
    __type: string;
    remarks: string;
    AccountDetails: {
      liability: number;
      Balance: number;
      profitLoss: number;
      freeChips: number;
      totalSettledAmount: number;
      Exposure: number;
      ExposureLimit: number;
    };
    allowedNoOfUsers: number;
    createdUsersCount: number;
    commissionLenaYaDena: {
      commissionLena: boolean;
      commissionDena: boolean;
    };
    groupID: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

export interface AuthCookies {
  Admin?: string;
  TechAdmin?: string;
  token?: string;
  hasPopupBeenShown?: boolean;
}
  
export interface WhiteListData {
  success: boolean;
  whiteListData?: any;
  message?: string;
}

export interface IpAddressData {
  success: boolean;
  ip: string;
  message?: string;
}

export interface UpdatePasswordResponse {
  transactionPassword: any;
  success: boolean;
  message?: string;
}

/* parse time */
export const parseTime = (timeStr: string): number => {
  const match = timeStr.match(/^(\d+)([smhd])$/);
  if (!match) return 3600; // default to 1 hour in seconds

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "s":
      return value;
    case "m":
      return value * 60;
    case "h":
      return value * 60 * 60;
    case "d":
      return value * 60 * 60 * 24;
    default:
      return 3600;
  }
};
// `${SERVER_URL}/api/v1/getWhiteListData?AdminUrl=${baseUrl}`
// console.log(baseUrl.includes("techadmin"))
/* get white list data */
export const getWhiteListData = async (): Promise<WhiteListData> => {
  try {
    const response = await fetch(
      `${SERVER_URL}/api/v1/whitelists/single?url=${baseUrl}`
    );

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch whitelist data:", error);
    throw error;
  }
};

/* get ip address */
export const getIpAddress = async (): Promise<IpAddressData> => {
  try {
    const response = await fetch(`${SERVER_URL}/api/v1/users/fetch-ip`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch ip address:", error);
    throw error;
  }
};
/* login client */
export const loginClient = async (
  loginData: LoginRequest
): Promise<LoginResponse> => {
  try {
    console.log("🔍 Login request data:", {
      ...loginData,
      password: "***hidden***", // Don't log actual password
    });

    // /api/v1/users/tech-admins/login
    const response = await fetch(
      `${SERVER_URL}/api/v1/${baseUrl.includes("techadmin") ? "users/tech-admins/login" : "users/admins/login"}`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      }
    );

    console.log("📡 Response status:", response.status, response.statusText);

    // Parse the response body first to get detailed error info
    const data = await response.json();
    console.log("📋 Response data:", data);

    if (!response.ok) {
      // Create error object with server message and status
      const serverMessage =
        data?.error ||
        data?.message ||
        `Login failed: ${response.status} ${response.statusText}`;
      const error = new Error(serverMessage);
      (error as any).response = {
        status: response.status,
        data: data,
      };
      throw error;
    }

    return data;
  } catch (error) {
    // If it's a fetch error (network issue), handle differently
    if (error instanceof TypeError) {
      console.error("❌ Network error:", error);
      const networkError = new Error(
        "Network error. Please check your connection."
      );
      (networkError as any).response = { status: 0 };
      throw networkError;
    }

    console.error("❌ Login client error:", error);
    throw error;
  }
};

/*update password */
export const updatePassword = async (
  newPassword: string,
  currentPassword: string,
  token: string
): Promise<UpdatePasswordResponse> => {
  try {
    const response = await fetch(`${SERVER_URL}/api/v1/changeOwnPassword`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ newPassword, currentPassword }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData?.message || `Error ${response.status}: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to update password:", error);
    throw error;
  }
};

// Direct cookie helper functions
export const setDirectCookie = (name: string, value: string, maxAgeInSeconds: number = 3600): void => {
  const cookieString = `${name}=${value}; path=/; max-age=${maxAgeInSeconds}`;
  document.cookie = cookieString;
};

export const getDirectCookie = (name: string): string | null => {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === name) {
      return cookieValue;
    }
  }
  return null;
};

export const removeDirectCookie = (name: string): void => {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  console.log(`🗑️ Direct cookie removed: ${name}`);
};

export const authenticate = async (
  data: LoginResponse,
  next: () => void,
  setCookie: (name: string, value: any, options?: any) => void
): Promise<void> => {
  if (typeof window !== "undefined") {
    const rawExpireTime = import.meta.env.VITE_COOKIE_EXPIRE_TIME || "1h";
    const maxAgeInSeconds = parseTime(rawExpireTime);
    const authCookieKey = getAuthCookieKey();

    // Store only the main token cookie
    setDirectCookie(authCookieKey, data.data.token, maxAgeInSeconds);
    setDirectCookie("hasPopupBeenShown", "false", maxAgeInSeconds);

    next();
  }
};

/* Logout function */
export const logout = (
  removeCookie: (name: string, options?: any) => void,
  navigate: (path: string, options?: any) => void
): void => {
  // Disconnect socket if connected
  try {
    const socketService = require("@/utils/socketService").default;
    socketService.disconnect();
  } catch (error) {
    console.log("Socket service not available during logout");
  }
  try {
    const authCookieKey = getAuthCookieKey();
    
    // Remove main cookies
    removeCookie(authCookieKey, { path: "/" });
    removeCookie("hasPopupBeenShown", { path: "/" });
    removeCookie("token", { path: "/" });
    
    // Also remove directly
    removeDirectCookie(authCookieKey);
    removeDirectCookie("hasPopupBeenShown");
    removeDirectCookie("token");
    
    navigate("/sign-in", { replace: true });
  } catch (error) {
    console.error("Logout error:", error);
    // Force navigation even if cookie removal fails
    navigate("/sign-in", { replace: true });
  }
};

/* Check if user is authenticated */
export const isAuthenticated = (cookies?: AuthCookies): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  const authCookieKey = getAuthCookieKey();
  const token = cookies?.[authCookieKey] || getDirectCookie(authCookieKey);
  
  if (!token || token === "undefined") {
    return false;
  }

  try {
    const decoded = jwtDecode<DecodedToken>(token);
    const currentTime = Date.now() / 1000;
    const isValid = decoded.exp > currentTime;
    return isValid;
  } catch (error) {
    console.error("❌ Token validation error:", error);
    return false;
  }
};

/* Get decoded token data */
export const getDecodedTokenData = (
  cookies?: AuthCookies
): DecodedToken | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const authCookieKey = getAuthCookieKey();
  const token = cookies?.[authCookieKey] || getDirectCookie(authCookieKey);
  
  console.log("🔍 getDecodedTokenData - Token check:", {
    authCookieKey,
    tokenFromCookies: token ? `${token.substring(0, 20)}...` : null,
    allCookies: cookies
  });

  if (!token || token === "undefined") {
    console.log("🍪 No token found in getDecodedTokenData");
    return null;
  }

  console.log("🔍 getDecodedTokenData - About to decode token:", {
    tokenLength: token.length,
    tokenStart: token.substring(0, 50) + "..."
  });

  try {
    const decoded = jwtDecode<DecodedToken>(token);
    console.log("🍪 Token decoded successfully:", {
      decoded,
      user: decoded?.user,
      loginId: decoded?.user?.PersonalDetails?.loginId
    });
    return decoded;
  } catch (error) {
    console.error("Token decode error:", error);
    return null;
  }
};

/* Check if token is about to expire (within 5 minutes) */
export const isTokenExpiringSoon = (cookies: AuthCookies): boolean => {
  const decodedToken = getDecodedTokenData(cookies);
  if (!decodedToken) return true;

  const currentTime = Date.now() / 1000;
  const timeUntilExpiry = decodedToken.exp - currentTime;
  const fiveMinutesInSeconds = 5 * 60;

  return timeUntilExpiry <= fiveMinutesInSeconds;
};
