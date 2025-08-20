import { jwtDecode } from "jwt-decode";

/* server url */
export const SERVER_URL = import.meta.env.VITE_SERVER_URL;

/* client url */
export const baseUrl = window.location.origin.includes("localhost")
  ? import.meta.env.VITE_LOCAL_CLIENT_URL
  : window.location.origin;

/* Types */
export interface LoginRequest {
  loginId: string;
  password: string;
  IpAddress: string;
  hostUrl: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  message?: string;
}

export interface DecodedToken {
  AccountDetails: {
    Balance: number;
    Exposure: number;
    ExposureLimit: number;
    freeChips: number;
    liability: number;
    profitLoss: number;
    totalSettledAmount: number;
  };
  IpAddress: string;
  PersonalDetails: {
    countryCode: string | null;
    encry_password: string;
    idIsActive: boolean;
    isAutoRegisteredUser: boolean;
    loginId: string;
    mobile: string | null;
    salt: string;
    userName: string;
    user_password: string;
  };
  allowedNoOfUsers: number;
  bettingLocked: boolean;
  closedAccounts: boolean;
  commissionLenaYaDena: {
    commissionLena: boolean;
    commissionDena: boolean;
  };
  commissionSettings: {
    partnerShipWise: boolean;
    percentageWise: boolean;
  };
  createdAt: string; // ISO date string
  createdUsersCount: number;
  exp: number; // Unix timestamp
  fancyLocked: boolean;
  groupID: string;
  iat: number; // Unix timestamp
  remarks: string;
  updatedAt: string; // ISO date string
  upline: string;
  userId: string;
  userLocked: boolean;
  __type: string;
  __v: number;
}

export interface AuthCookies {
  Admin?: string;
  TechAdmin?: string;
  hasPopupBeenShown?: boolean;
}
  
export interface WhiteListData {
  success: boolean;
  whiteListData?: any;
  message?: string;
}

export interface IpAddressData {
  success: boolean;
  IpAddress: string;
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
    // console.log(baseUrl.includes("techadmin"))
    const response = await fetch(
      `${SERVER_URL}/api/v1/getWhiteListData?${baseUrl.includes("techadmin") ? "TechAdminUrl" : "AdminUrl"}=${baseUrl}`
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
    const response = await fetch(`${SERVER_URL}/api/v1/fetchIpAddress`);
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

    const response = await fetch(
      `${SERVER_URL}/api/v1/${baseUrl.includes("techadmin") ? "techadmin" : "admin"}/signin`,
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

export const authenticate = async (
  data: LoginResponse,
  next: () => void,
  setCookie: (name: string, value: any, options?: any) => void
): Promise<void> => {
  if (typeof window !== "undefined") {
    const rawExpireTime = import.meta.env.VITE_COOKIE_EXPIRE_TIME || "1h";
    const maxAgeInSeconds = parseTime(rawExpireTime);

    setCookie(
      baseUrl.includes("techadmin") ? "TechAdmin" : "Admin",
      data.token,
      {
        maxAge: maxAgeInSeconds,
        path: "/",
        secure: window.location.protocol === "https:",
        sameSite: "strict",
      }
    );
    setCookie("hasPopupBeenShown", false, {
      maxAge: maxAgeInSeconds,
      path: "/",
    });

    next();
  }
};

/* Logout function */
export const logout = (
  removeCookie: (name: string, options?: any) => void,
  navigate: (path: string, options?: any) => void
): void => {
  try {
    removeCookie(baseUrl.includes("techadmin") ? "TechAdmin" : "Admin", {
      path: "/",
    });
    removeCookie("hasPopupBeenShown", { path: "/" });
    removeCookie("token", { path: "/" });
    navigate("/sign-in", { replace: true });
  } catch (error) {
    console.error("Logout error:", error);
    // Force navigation even if cookie removal fails
    navigate("/sign-in", { replace: true });
  }
};

/* Check if user is authenticated */
export const isAuthenticated = (cookies: AuthCookies): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  const token = cookies[baseUrl.includes("techadmin") ? "TechAdmin" : "Admin"];
  if (!token || token === "undefined") {
    return false;
  }

  try {
    const decoded = jwtDecode<DecodedToken>(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
  } catch (error) {
    console.error("Token validation error:", error);
    return false;
  }
};

/* Get decoded token data */
export const getDecodedTokenData = (
  cookies: AuthCookies
): DecodedToken | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const token = cookies[
    baseUrl.includes("techadmin") ? "TechAdmin" : "Admin"
  ] as string;

  if (!token || token === "undefined") {
    return null;
  }

  try {
    return jwtDecode<DecodedToken>(token);
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
