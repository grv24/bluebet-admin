import { SERVER_URL } from "./auth";
import { apiRequest } from "@/utils/api";

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message?: string;
  error?: string;
}

interface UserData {
  userName: string;
  loginId: string;
  user_password: string;
  fancyLocked: boolean;
  bettingLocked: boolean;
  userLocked: boolean;
  isPanelCommission: boolean;
}

export const createNewUser = async ({
  userType,
  token,
  userData,
}: {
  userType: string;
  token: string;
  userData: UserData;
}) => {
  const apiEndpoint = {
    Admin: `${SERVER_URL}/api/v1/users/admins/new-account`,
    MiniAdmin: `${SERVER_URL}/api/v1/createminiadmin`,
    SuperMaster: `${SERVER_URL}/api/v1/createsupermaster`,
    Master: `${SERVER_URL}/api/v1/createmaster`,
    SuperAgent: `${SERVER_URL}/api/v1/createsuperagent`,
    Agent: `${SERVER_URL}/api/v1/createagent`,
    Client: `${SERVER_URL}/api/v1/createclient`,
  }[userType];

  if (!apiEndpoint) {
    throw new Error(`Invalid user type: ${userType}`);
  }

  try {
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });
    return response.json();
  } catch (error) {
    console.error("Error creating new user:", error);
    throw error;
  }
};

export const getCurrentSportsSettings = async ({
  token,
  userId,
}: {
  token: string;
  userId: string;
}) => {
  try {
    const response = await fetch(
      `${SERVER_URL}/api/v1/users/sports-casino-setting`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.json();
  } catch (error) {
    console.error("Error getting current sports settings:", error);
    throw error;
  }
};

export const getDownlineList = async ({
  token,
  userId,
  page = 1,
  limit = 10,
}: {
  token: string;
  userId: string;
  page?: number;
  limit?: number;
}) => {
  try {
    const response = await fetch(
      `${SERVER_URL}/api/v1/users/my-downline-users?page=${page}&limit=${limit}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.json();
  } catch (error) {
    console.error("Error getting downline list:", error);
    throw error;
  }
};

// /api/v1/depositchips

export const depositBalance = async ({
  token,
  downlineUserId,
  uplineUserId,
  amount,
  remark,
  transactionPassword,
}: {
  token: string;
  downlineUserId: string;
  uplineUserId: string;
  amount: number;
  remark: string;
  transactionPassword: string;
}) => {
  try {
    const response = await fetch(`${SERVER_URL}/api/v1/depositchips`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        downlineUserId,
        transactionPassword,
        uplineUserId,
        remark,
      }),
    });
    return response.json();
  } catch (error) {
    console.error("Error depositing balance:", error);
    throw error;
  }
};

//change own password
export const changeOwnPassword = async (
  currentPassword: string,
  newPassword: string,
  cookies: any
): Promise<ChangePasswordResponse> => {
  return apiRequest("/api/v1/changeOwnPassword", cookies, {
    method: "PATCH",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
};

//downline pwd change
export const changeDownlinePassword = async (
  downlineUserId: string,
  newPassword: string,
  transactionPassword: string,
  cookies: any
): Promise<ChangePasswordResponse> => {
  return apiRequest(
    `/api/v1/changeDownlinePassword/${downlineUserId}`,
    cookies,
    {
      method: "PATCH",
      body: JSON.stringify({
        downlineUserId,
        newPassword,
        transactionPassword,
      }),
    }
  );
};

//withdraw chips
export const withdrawChips = async ({
  cookies,
  downlineUserId,
  amount,
  uplineUserId,
  transactionPassword,
}: {
  cookies: any;
  downlineUserId: string;
  amount: number;
  uplineUserId: string;
  transactionPassword: string;
}) => {
  return apiRequest("/api/v1/withdrawchips", cookies, {
    method: "POST",
    body: JSON.stringify({
      amount,
      downlineUserId,
      uplineUserId,
      transactionPassword,
    }),
  });
};

//exposure limit change
export const exposureLimitChange = async ({
  cookies,
  downlineUserId,
  exposureLimit,
  transactionPassword,
}: {
  cookies: any;
  downlineUserId: string;
  exposureLimit: number;
  transactionPassword: string;
}) => {
  return apiRequest("/api/v1/exposurelimit", cookies, {
    method: "PATCH",
    body: JSON.stringify({
      downlineUserId,
      exposureLimit,
      transactionPassword,
    }),
  });
};

// change credit reference
export const changeCreditReference = async ({
  cookies,
  downlineUserId,
  creditReference,
  transactionPassword,
}: {
  cookies: any;
  downlineUserId: string;
  creditReference: number;
  transactionPassword: string;
}) => {
  return apiRequest("/api/v1/change-creditReference", cookies, {
    method: "PATCH",
    body: JSON.stringify({
      downlineUserId,
      creditReference,
      transactionPassword,
    }),
  });
};

// change user/bet status
export const changeUserStatus = async ({
  cookies,
  downlineUserId,
  lockBet,
  lockUser,
  transactionPassword,
}: {
  cookies: any;
  downlineUserId: string;
  lockBet: boolean;
  lockUser: boolean;
  transactionPassword: string;
}) => {
  return apiRequest(
    `/api/v1/changeUserLockAndBetLock/${downlineUserId}`,
    cookies,
    {
      method: "PATCH",
      body: JSON.stringify({
        downlineUserId,
        lockBet,
        lockUser,
        transactionPassword,
      }),
    }
  );
};
