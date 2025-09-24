import { SERVER_URL, baseUrl } from "./auth";
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
    MiniAdmin: `${SERVER_URL}/api/v1/users/mini-admins/new-account`,
    SuperMaster: `${SERVER_URL}/api/v1/users/super-masters/new-account`,
    Master: `${SERVER_URL}/api/v1/users/masters/new-account`,
    SuperAgent: `${SERVER_URL}/api/v1/users/super-agents/new-account`,
    Agent: `${SERVER_URL}/api/v1/users/agents/new-account`,
    Client: `${SERVER_URL}/api/v1/users/clients/new-account`,
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
  userId,
  amount,
  remark,
  transactionPassword,
  userType,
}: {
  token: string;
  userId: string;
  amount: number;
  remark: string;
  transactionPassword: string;
  userType: string;
}) => {
  try {
    const response = await fetch(`${SERVER_URL}/api/v1/users/deposit`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        userId,
        transactionPassword,
        remark,
        userType,
      }),
    });
    return response.json();
  } catch (error) {
    console.error("Error depositing balance:", error);
    throw error;
  }
};

///api/v1/users/admins/own-balance
export const getOwnBalance = async ({
  token,
  userId,
  cookies,
}: {
  token: string;
  userId: string;
  cookies: any;
}) => {
  return apiRequest(`/api/v1/users/own-balance`, cookies, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

//change own password
export const changeOwnPassword = async (
  currentPassword: string,
  newPassword: string,
  cookies: any
): Promise<ChangePasswordResponse> => {
  try {
    const hostname = new URL(baseUrl).hostname; // e.g. "admin.bluebet9.com"
    const subdomain = hostname.split(".")[0]; // "admin" or "techadmin"

    let rolePath = "";
    if (subdomain.toLowerCase() === "admin") {
      rolePath = "admins";
    } else if (subdomain.toLowerCase() === "techadmin") {
      rolePath = "tech-admins";
    } else {
      throw new Error("Unknown role: cannot determine endpoint");
    }

    const endpoint = `/api/v1/users/${rolePath}/change-own-password`;

    return apiRequest(endpoint, cookies, {
      method: "PATCH",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  } catch (error) {
    console.error("Error in changeOwnPassword:", error);
    throw error;
  }
};

//downline pwd change
export const changeDownlinePassword = async (
  downlineUserId: string,
  newPassword: string,
  transactionPassword: string,
  cookies: any,
  userType: string
): Promise<ChangePasswordResponse> => {
  return apiRequest(`/api/v1/users/change-password-downline`, cookies, {
    method: "PATCH",
    body: JSON.stringify({
      userId: downlineUserId,
      newPassword,
      transactionPassword,
      userType,
    }),
  });
};

//withdraw chips
export const withdrawChips = async ({
  cookies,
  userId,
  amount,
  transactionPassword,
  userType,
}: {
  cookies: any;
  userId: string;
  amount: number;
  transactionPassword: string;
  userType: string;
}) => {
  return apiRequest("/api/v1/users/withdraw", cookies, {
    method: "POST",
    body: JSON.stringify({
      amount,
      userId,
      transactionPassword,
      userType,
    }),
  });
};

//exposure limit change
export const exposureLimitChange = async ({
  cookies,
  userId,
  newLimit,
  transactionPassword,
  userType,
}: {
  cookies: any;
  userId: string;
  newLimit: number;
  transactionPassword: string;
  userType: string;
}) => {
  return apiRequest("/api/v1/users/set-exposure-limit", cookies, {
    method: "PATCH",
    body: JSON.stringify({
      userId,
      newLimit,
      transactionPassword,
      userType,
    }),
  });
};

// change credit reference
export const changeCreditReference = async ({
  cookies,
  userId,
  creditReference,
  transactionPassword,
  userType,
}: {
  cookies: any;
  userId: string;
  creditReference: number;
  transactionPassword: string;
  userType: string;
}) => {
  return apiRequest("/api/v1/users/set-credit-ref", cookies, {
    method: "PATCH",
    body: JSON.stringify({
      userId,
      newCreditRef: creditReference,
      transactionPassword,
      userType,
    }),
  });
};

// change user/bet status
export const changeUserStatus = async ({
  cookies,
  userId,
  lockBet,
  lockUser,
  transactionPassword,
  userType,
}: {
  cookies: any;
  userId: string;
  lockBet: boolean;
  lockUser: boolean;
  transactionPassword: string;
  userType: string;
}) => {
  return apiRequest(`/api/v1/users/lock`, cookies, {
    method: "PATCH",
    body: JSON.stringify({
      userId,
      betLockValue: lockBet,
      userLockValue: lockUser,
      transactionPassword,
      userType,
    }),
  });
};

export const getUserCurrentBet = async ({ cookies }: { cookies: any }) => {
  return apiRequest("/api/v1/sports/bets/downline", cookies, {
    method: "GET",
  });
};

// account summary
export const getAccountSummary = async ({ cookies, userId ,userType}: { cookies: any, userId: string, userType: string }) => {
  return apiRequest(`/api/v1/balance/dashboard/${userId}/${userType}`, cookies, {
    method: "GET",
  });
};

// payment gateway
export const getPaymentGateways = async ({ cookies }: { cookies: any }): Promise<{
  success: boolean;
  data: Array<{
    id: string;
    gatewayMethod: string;
    gatewayImage: string;
    qrImage: string;
    gatewayDetails: string;
    isActive: boolean;
    createdBy: string;
    createdByType: string;
    groupId: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
}> => {
  return apiRequest("/api/v1/payment/paymentgateway/created/getall", cookies, {
    method: "GET",
  });
};

// payment request history
export const getPaymentRequests = async ({ cookies }: { cookies: any }): Promise<{
  success: boolean;
  data: Array<{
    id: string;
    transactionNo: string;
    paymentProof: string;
    amount: string;
    balance: string;
    ipAddress: string;
    status: string;
    reason: string | null;
    uplineId: string;
    uplineType: string;
    clientId: string;
    clientType: string;
    gatewayId: string;
    gatewayMethod: {
      gatewayMethod: string;
      gatewayDetails: string;
    };
    groupId: string | null;
    loginId: string;
    processedBy: string | null;
    processedByType: string | null;
    processedAt: string | null;
    createdAt: string;
    updatedAt: string;
    gateway: {
      id: string;
      gatewayMethod: string;
      gatewayImage: string;
      qrImage: string;
      gatewayDetails: string;
      isActive: boolean;
      createdBy: string;
      createdByType: string;
      groupId: string | null;
      createdAt: string;
      updatedAt: string;
    };
  }>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}> => {
  return apiRequest("/api/v1/payment/recievingDepositRequest", cookies, {
    method: "GET",
  });
};

// payment gateway permissions
export const getPaymentGatewayPermissions = async ({ cookies }: { cookies: any }): Promise<{
  success: boolean;
  data: {
    userId: string;
    userType: string;
    userName: string;
    groupId: string | null;
    hasDepositWithdrawAccess: boolean;
    permissions: {
      canCreateGateway: boolean;
      canManageGateway: boolean;
      canAssignGateway: boolean;
      canProcessRequests: boolean;
    };
    stats: {
      assignedGatewaysCount: number;
      createdGatewaysCount: number;
      hasActiveAssignments: boolean;
      hasCreatedGateways: boolean;
    };
    assignments: any[];
  };
}> => {
  return apiRequest("/api/v1/payment-permissions/my-gateway-permissions", cookies, {
    method: "GET",
  });
};

// update deposit request status
export const updateDepositRequest = async ({
  requestId,
  transactionPassword,
  status,
  reason,
  cookies,
}: {
  requestId: string;
  transactionPassword: string;
  status: "Approved" | "Rejected";
  reason: string;
  cookies: any;
}): Promise<{
  success: boolean;
  message: string;
}> => {
  return apiRequest(`/api/v1/payment/updateDepositRequest/${requestId}`, cookies, {
    method: "PUT",
    body: JSON.stringify({
      transactionPassword,
      status,
      reason,
    }),
  });
};
