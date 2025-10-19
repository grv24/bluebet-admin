import { getDecodedTokenData, baseUrl } from "@/helper/auth";
import { createNewUser, getCurrentSportsSettings, getAccounts } from "@/helper/user";
import { AdminList } from "@/utils/Admin";
import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { useCookies } from "react-cookie";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { io, Socket } from "socket.io-client";
import { useGlobalData } from "@/App";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import validatePanelSettings from "@/utils/validate_panel_setting";
import { useNavigate } from "react-router-dom";

interface FormData {
  loginId: string;
  clientName: string;
  password: string;
  retypePassword: string;
  allowedUsers: number;
  accountType: string;
  creditReference: string;
  exposureLimit: number;
  transactionPassword: string;
  ourCommission: number;
  ourPartnership: number;
  downlineCommission: number;
  downlinePartnership: number;
  minBet: number;
  maxBet: number;
  delay: number;
  // Commission settings
  commissionLena: boolean;
  commissionDena: boolean;
  percentageWiseCommission: boolean;
  partnerShipWiseCommission: boolean;
}

// Constants for better maintainability
const CONSTANTS = {
  MAX_COMMISSION: 100,
  MAX_PARTNERSHIP: 100,
  DEFAULT_DELAY: 5.5,
  DEFAULT_USERS: 99999,
  MIN_BET_LIMIT: 100,
  MAX_BET_LIMIT: 50000,
  CHECK_DEBOUNCE_MS: 300,
} as const;

// User type mapping for sports settings
const USER_TYPE_MAP: Record<string, string> = {
  TechAdmin: "techAdmin",
  Admin: "admin",
  MiniAdmin: "miniAdmin",
  SuperMaster: "superMaster",
  Master: "master",
  SuperAgent: "superAgent",
  Agent: "agent",
} as const;

// Display label mapper for account types
const getAccountTypeLabel = (type: string): string =>
  type === "Client" ? "User" : type;

// Default commission rates by user type (from guide)
const getDefaultCommissionRates = (userType: string) => {
  const defaultRates: { [key: string]: { panel: number; match: number; session: number } } = {
    techAdmin: { panel: 1.5, match: 1.0, session: 0.8 },
    admin: { panel: 1.0, match: 0.8, session: 0.6 },
    miniAdmin: { panel: 0.5, match: 0.5, session: 0.4 },
    superMaster: { panel: 0.5, match: 0.5, session: 0.4 },
    master: { panel: 1.0, match: 0.8, session: 0.6 },
    superAgent: { panel: 1.0, match: 0.8, session: 0.6 },
    agent: { panel: 2.0, match: 1.5, session: 1.2 },
    client: { panel: 0, match: 0, session: 0 }
  };
  return defaultRates[userType] || defaultRates.client;
};

// Types for better type safety
interface CommissionCalculations {
  upline: number;
  downline: number;
  our: number;
  own: number;
  total: number;
  panelTotal: number;
  parentOwn: number;
  isValidAllocation: boolean;
  maxOurAllowed: number;
}

interface PartnershipCalculations {
  upline: number;
  downline: number;
  our: number;
  total: number;
  own: number;
  maxOurAllowed: number;
  isValidAllocation: boolean;
  calculatedSum: number;
  downlineAbsolute: number;
}

// Helper functions for validation
const validateFormInputs = (
  data: FormData,
  userExists: boolean | null,
  allowedTypes: string[]
): string | null => {
  if (userExists !== null && userExists) {
    return "Login ID already exists. Please choose a different one.";
  }
  if (data.password !== data.retypePassword) {
    return "Passwords do not match";
  }
  if (data.accountType && !allowedTypes.includes(data.accountType)) {
    return "Selected account type is not allowed for your user level.";
  }
  return null;
};

const clampValue = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

// Custom hook for socket functionality - 100% useEffect-free approach
const useLoginIdCheck = (whiteListId: string) => {
  const [userExists, setUserExists] = useState<boolean | null>(null);
  const [isCheckingUserId, setIsCheckingUserId] = useState(false);
  const userIdCheckTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Lazy socket initialization - creates socket only when needed
  const createSocketConnection = useCallback(() => {
    const socketUrl = import.meta.env.VITE_SERVER_URL;
    console.log("🔌 Creating socket connection to:", socketUrl);

    const socket = io(socketUrl);

    // Setup connection event handlers
    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
    });

    // Setup one-time event listener for this check
    const handleLoginIdCheck = (exists: boolean) => {
      console.log("📨 Received loginIdCheck response:", exists);
      setUserExists(exists);
      setIsCheckingUserId(false);
      // Auto-cleanup after receiving response
      socket.off("loginIdCheck", handleLoginIdCheck);
      socket.close();
    };

    socket.on("loginIdCheck", handleLoginIdCheck);
    return socket;
  }, []);

  // Cleanup function that can be called manually
  const cleanup = useCallback(() => {
    if (userIdCheckTimerRef.current) {
      clearTimeout(userIdCheckTimerRef.current);
      userIdCheckTimerRef.current = null;
    }
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
  }, []);

  // Debounced check function with per-request socket approach
  const checkLoginId = useCallback(
    (loginId: string) => {
      // Reset userExists when user starts typing
      if (userExists !== null) {
        setUserExists(null);
      }

      // Reset checking state when clearing input
      if (!loginId.trim()) {
        setIsCheckingUserId(false);
        cleanup();
        return;
      }

      // Clear existing timer and cleanup
      cleanup();

      // Set new timer for debounced request
      userIdCheckTimerRef.current = setTimeout(() => {
        setIsCheckingUserId(true);

        // Create new socket connection for this specific request
        const socket = createSocketConnection();

        // Store cleanup function for this socket
        cleanupRef.current = () => {
          socket.close();
        };

        // Emit the check request
        socket.emit("checkLoginId", { loginId: loginId.trim(), whiteListId });
      }, CONSTANTS.CHECK_DEBOUNCE_MS);
    },
    [userExists, whiteListId, createSocketConnection, cleanup]
  );

  // Manual cleanup trigger (can be called from component if needed)
  const resetState = useCallback(() => {
    setUserExists(null);
    setIsCheckingUserId(false);
    cleanup();
  }, [cleanup]);

  return { userExists, isCheckingUserId, checkLoginId, resetState };
};

const AddClient: React.FC = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      loginId: "",
      clientName: "",
      password: "",
      retypePassword: "",
      allowedUsers: CONSTANTS.DEFAULT_USERS,
      accountType: "",
      creditReference: "",
      exposureLimit: 0,
      transactionPassword: "",
      ourCommission: 0,
      ourPartnership: 0,
      downlineCommission: 0,
      downlinePartnership: 0,
      minBet: 0,
      maxBet: 0,
      delay: CONSTANTS.DEFAULT_DELAY,
      // Commission settings defaults
      commissionLena: true,
      commissionDena: false,
      percentageWiseCommission: true,
      partnerShipWiseCommission: false,
    },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showRetypePassword, setShowRetypePassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cookies] = useCookies(["Admin", "TechAdmin"]);
  const globalData = useGlobalData();
  const whitelistData = globalData?.whitelistData;

  // Password policy (same as PasswordModal)
  const passwordRule =
    "Password must be 6-32 characters, start with a capital letter, include at least one letter, one number, one special character (e.g., @), and contain no spaces.";
  const isStrongPassword = (value: string): boolean => {
    if (!value) return false;
    const hasMinLen = value.length >= 6 && value.length <= 32;
    const hasLetter = /[A-Za-z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasNoSpaces = !/\s/.test(value);
    const startsWithCapital = /^[A-Z]/.test(value);
    const hasSpecial = /[^A-Za-z0-9\s]/.test(value);
    return (
      hasMinLen &&
      hasLetter &&
      hasNumber &&
      hasSpecial &&
      hasNoSpaces &&
      startsWithCapital
    );
  };

  // Memoized auth token to avoid recalculation
  const authToken = useMemo(
    () => cookies[baseUrl.includes("techadmin") ? "TechAdmin" : "Admin"],
    [cookies]
  );

  //decoded token data
  const decodedData = getDecodedTokenData(cookies);
  console.log("decodedData", decodedData);
  const userId = decodedData?.user?.userId;
  const userType = decodedData?.user?.__type;
  const commissionSettings = {
    percentageWise:
      decodedData?.user?.commissionLenaYaDena?.commissionLena || false,
    partnerShipWise:
      decodedData?.user?.commissionLenaYaDena?.commissionDena || false,
  };
  const commissionLenaYaDena = {
    commissionLena:
      decodedData?.user?.commissionLenaYaDena?.commissionLena || false,
    commissionDena:
      decodedData?.user?.commissionLenaYaDena?.commissionDena || false,
  };

  // Get current sport settings
  const { data: currentSportsData } = useQuery({
    queryKey: ["currentSportsSettings", { cookies, userId }],
    queryFn: () =>
      getCurrentSportsSettings({
        token: authToken || "",
        userId: userId || "",
      }),
    enabled: !!userId && !!authToken, // Ensure query runs only if userId and token are available
  });

  // Get accounts data
  const { data: accountsData, isLoading: isLoadingAccounts, error: accountsError } = useQuery({
    queryKey: ["getAccounts", { cookies, userId }],
    queryFn: () =>
      getAccounts({
        token: authToken || "",
        userId: userId || "",
      }),
    enabled: !!userId && !!authToken, // Ensure query runs only if userId and token are available
  });

  // Watch form values for reactive updates
  const watchedValues = watch();
  const {
    loginId,
    clientName,
    password,
    retypePassword,
    accountType,
    ourCommission,
    ourPartnership,
    downlineCommission,
    downlinePartnership,
  } = watchedValues;

  // Use custom hook for login ID checking
  const whiteListId = whitelistData?.data?.id || "";

 
  const { userExists, isCheckingUserId, checkLoginId, resetState } =
    useLoginIdCheck(whiteListId);

  // Get allowed user types for current user using Admin.ts helper
  const currentUserAllowedTypes = useMemo(() => {
    const userType = decodedData?.user?.__type;
    if (!userType) return [];

    const adminConfig = AdminList.find(
      (admin) => admin.name.toLowerCase() === userType.toLowerCase()
    );

    return adminConfig?.allowedTypes || [];
  }, [decodedData?.user?.__type]);

  // Get panel data from accounts API response
  const panelData = useMemo(() => {
    try {
      // Extract commission and partnership values from the accounts API response
      const accountsResponse = accountsData?.data;
      
      if (!accountsResponse?.commissionSettings) {
        console.warn("No commission settings found in accounts data");
        return { panelCommission: null, panelPartnership: null };
      }

      const commissionSettings = accountsResponse.commissionSettings;
      
      // Get commission values from commissionSettings
      const commissionOwn = parseFloat(commissionSettings.commissionOwn || "0");
      const commissionUpline = parseFloat(commissionSettings.commissionUpline || "0");
      
      // Get partnership values from commissionSettings
      const partnershipOwn = parseFloat(commissionSettings.partnershipOwn || "0");
      const partnershipUpline = parseFloat(commissionSettings.partnershipUpline || "0");

      console.log("Panel Data Debug (from accounts API):", {
        commissionSettings,
        commissionOwn,
        commissionUpline,
        partnershipOwn,
        partnershipUpline,
        formula: {
          commission: `Upline: ${commissionUpline}% + Own: ${commissionOwn}% = ${commissionUpline + commissionOwn}%`,
          partnership: `Upline: ${partnershipUpline}% + Own: ${partnershipOwn}% = ${partnershipUpline + partnershipOwn}%`
        }
      });

      return {
        panelCommission: {
          own: commissionOwn,
          upline: commissionUpline,
          total: commissionOwn + commissionUpline,
        },
        panelPartnership: {
          own: partnershipOwn,
          upline: partnershipUpline,
          total: partnershipOwn + partnershipUpline,
        },
      };
    } catch (error) {
      console.warn("Panel validation error:", error);
      return { panelCommission: null, panelPartnership: null };
    }
  }, [accountsData]);

  // Debug: Log sports data when it changes
  console.log("Sports Settings Loaded:", {
    hasData: !!currentSportsData?.data,
    sportsCount: currentSportsData?.data
      ? Object.keys(currentSportsData.data).length
      : 0,
    validationResult: panelData,
  });

  // Debug: Log accounts data when it changes
  console.log("Accounts Data Loaded:", {
    hasData: !!accountsData,
    isLoading: isLoadingAccounts,
    error: accountsError,
    accountsData: accountsData,
  });

  // Panel state management
  const [panelCommission, setPanelCommission] = useState<{
    own: number;
    total: number;
  } | null>(null);
  const [panelPartnership, setPanelPartnership] = useState<{
    own: number;
    total: number;
  } | null>(null);

  // Sync panel state when panelData changes
  useEffect(() => {
    if (panelData?.panelCommission) {
      setPanelCommission(panelData.panelCommission);
      // Initialize ourCommission field with panel's own value (commissionOwn from accounts API)
      setValue("ourCommission", panelData.panelCommission.own || 0);
      // Initialize downlineCommission field with 0 (user will set their desired value)
      setValue("downlineCommission", 0);
    }
    if (panelData?.panelPartnership) {
      setPanelPartnership(panelData.panelPartnership);
      // Initialize ourPartnership field with panel's own value (partnershipOwn from accounts API)
      setValue("ourPartnership", panelData.panelPartnership.own || 0);
      // Initialize downlinePartnership field with 0 (user will set their desired value)
      setValue("downlinePartnership", 0);
    }
  }, [panelData, setValue]);

  // Calculate commission values - Using accounts API data with downline constraint
  const commissionCalculations = useMemo((): CommissionCalculations => {
    const parentOwn = panelData?.panelCommission?.own || 0; // What current user keeps (commissionOwn from accounts API)
    const parentUpline = panelData?.panelCommission?.upline || 0; // What goes to upline (commissionUpline from accounts API)
    const our = ourCommission || 0; // What current user wants to keep (user input - editable)
    const downline = downlineCommission || 0; // What goes to downline (user input - editable)
    
    // Commission calculation: Upline (fixed) + Our (editable) + Downline (editable)
    const upline = parentUpline; // Upline commission from accounts API (fixed)
    const total = upline + our + downline; // Total = Upline + Our + Downline
    const own = our; // Own is same as our

    // Validation: our and downline should be non-negative, and downline should not exceed our
    const isValidDownline = downline <= our;
    const isValidAllocation = our >= 0 && downline >= 0 && isValidDownline;
    const maxOurAllowed = 100; // No specific limit for commission

    console.log("Commission Calc Debug (with downline constraint):", {
      parentOwn: `From accounts API: ${parentOwn}`,
      parentUpline: `From accounts API: ${parentUpline}`,
      upline: `Fixed: ${upline}`,
      our: `User Input: ${our}`,
      downline: `User Input: ${downline}`,
      total,
      own,
      isValidDownline,
      constraint: `downline (${downline}) <= our (${our})`,
      formula: `upline (${upline}) + our (${our}) + downline (${downline}) = ${total}`,
      constraints: `our ≥ 0, downline ≥ 0, downline ≤ our`,
      isValidAllocation,
      maxOurAllowed,
      note: "Using commissionOwn, commissionUpline from accounts API + downline constraint"
    });

    return {
      upline: upline, // Commission passed to parent user (from accounts API)
      downline: downline, // Commission passed to downline (user input - editable)
      our: our, // What current user keeps (user input - editable)
      own: own, // Same as our
      total: total, // Total = Upline + Our + Downline
      panelTotal: upline + our + downline, // Dynamic total
      parentOwn: parentOwn, // What current user currently has
      isValidAllocation: isValidAllocation, // Validation flag
      maxOurAllowed: maxOurAllowed, // No specific limit
    };
  }, [panelData?.panelCommission, ourCommission, downlineCommission]);

  // Calculate partnership values using accounts API data with downline constraint
  const partnershipCalculations = useMemo((): PartnershipCalculations => {
    // Base values from accounts API
    const previousDownline = panelData?.panelPartnership?.own || 100; // What current user has (partnershipOwn from accounts API)
    const parentUpline = panelData?.panelPartnership?.upline || 0; // What goes to upline (partnershipUpline from accounts API)
    const total = panelData?.panelPartnership?.total || 100; // Total partnership pool
    const downlinePercent = Math.max(0, downlinePartnership || 0); // input as percentage of previousDownline
    const upline = parentUpline; // Fixed upline partnership from accounts API

    // Calculate our as partnershipOwn - downlinePartnership
    const downlineAbsolute = (previousDownline * downlinePercent) / 100;
    const ourAbsolute = Math.max(0, previousDownline - downlineAbsolute);
    const ourPercent = previousDownline > 0 ? (ourAbsolute / previousDownline) * 100 : 0;
    
    // Constraint: downline should not exceed the total available
    const isValidDownline = downlinePercent <= 100 && downlineAbsolute <= previousDownline;
    const newDownline = 0; // No remaining downline since we're using the full pool
    const downlineChange = newDownline - previousDownline; // negative means reduced

    console.log("Partnership Calc Debug (our = partnershipOwn - downline):", {
      previousDownline: `From accounts API: ${previousDownline}`,
      parentUpline: `From accounts API: ${parentUpline}`,
      total,
      downlinePercent,
      upline: `Fixed: ${upline}`,
      ourAbsolute: `Calculated: ${ourAbsolute} (${previousDownline} - ${downlineAbsolute})`,
      downlineAbsolute,
      newDownline,
      downlineChange,
      isValidDownline,
      constraint: `downlinePercent (${downlinePercent}) <= 100% and downlineAbsolute (${downlineAbsolute}) <= previousDownline (${previousDownline})`,
      formula: `upline (${upline}) + our (${ourAbsolute}) + downline (${downlineAbsolute}) = ${upline + ourAbsolute + downlineAbsolute}`,
      note: "Our = partnershipOwn - downlinePartnership"
    });

    return {
      upline,
      downline: newDownline,
      our: ourAbsolute, // calculated as partnershipOwn - downlinePartnership
      total,
      own: previousDownline,
      maxOurAllowed: 100, // percent of the bucket
      isValidAllocation:
        downlinePercent >= 0 && downlinePercent <= 100 && ourAbsolute >= 0 && isValidDownline,
      calculatedSum: upline + ourAbsolute + downlineAbsolute + newDownline,
      downlineAbsolute, // absolute share taken by downline from the bucket
    };
  }, [panelData?.panelPartnership, downlinePartnership]);

  const remarksText = useMemo(
    () => `creating account for ${watchedValues.clientName || ""}`,
    [watchedValues.clientName]
  );

  // Handle login ID change with debouncing - memoized to prevent unnecessary re-renders
  const handleLoginIdChange = useCallback(
    (value: string) => {
      setValue("loginId", value);
      checkLoginId(value);
    },
    [setValue, checkLoginId]
  );

  // Handle account type change
  const handleAccountTypeChange = useCallback(
    (accountType: string) => {
      setValue("accountType", accountType);
      // Don't automatically set commission rates - let user's own commission from API remain
    },
    [setValue]
  );

  // Memoized user ID for tech admin
  const techAdminUserId = useMemo(() => userId || "", [userId]);

  // Development logging - can be removed in production
  if (process.env.NODE_ENV === "development") {
    console.log("Current Sports Data:", currentSportsData);
    console.log("Accounts Data:", accountsData);
    console.log("User Type:", userType);
    console.log("Allowed Account Types:", currentUserAllowedTypes);
  }

  // Handle accounts API error
  useEffect(() => {
    if (accountsError) {
      console.error("Failed to load accounts:", accountsError);
      toast.error("Failed to load accounts data");
    }
  }, [accountsError]);



  // Optimized onSubmit with useCallback
  const onSubmit = useCallback(
    async (data: FormData) => {
      // Validate form inputs
      const validationError = validateFormInputs(
        data,
        userExists,
        currentUserAllowedTypes
      );
      if (validationError) {
        toast.error(validationError);
        return;
      }

      // Toast-based password strength validation
      if (!isStrongPassword(data.password)) {
        toast.error(passwordRule);
        return;
      }

      if (!authToken) {
        toast.error("Authentication token not found");
        return;
      }

      setIsLoading(true);
      try {
        const formData = {
          // personal detail
          userName: data.clientName.trim(),
          loginId: data.loginId.trim(),
          user_password: data.password.trim(),
          fancyLocked: false,
          bettingLocked: false,
          userLocked: false,
          isPanelCommission: true,
          creditRef: data.creditReference,
          // Send original sports settings as they are without modifications
          ...(data.accountType !== "Client" && {
            commissionGiven: data.downlineCommission || 0,    // ✅ Downline commission
            partnershipGiven: partnershipCalculations.downlineAbsolute || 0,  // ✅ Calculated absolute partnership value
            partnershipToUserId: userId || "",
            partnershipToType: userType || "",
            commissionToUserId: userId || "",
            commissionToType: userType || "",
          }),
          remarks: `creating account for ${data.clientName}`,

          // ...(data.accountType !== "Client" && {
          //   // AccountDetails: {
          //   creditRef: data.creditReference,
          //   // },
          // }),
          // Include exposureLimit for Client accounts
          ...(data.accountType === "Client" && {
            exposureLimit: data.exposureLimit,
          }),
          transactionPassword: data.transactionPassword,
        };
        const response = await createNewUser({
          userType: data.accountType,
          token: authToken,
          userData: formData,
        });

        if (response.success === true || response.status === "success") {
          toast.success("Account created successfully!");
          // Reset form using react-hook-form's reset function
          reset();
          navigate(`/clients`);
          // Reset login ID check state manually since we don't use useEffect
          resetState();
        } else {
          toast.error(response.message || "Failed to create account");
        }
      } catch (error) {
        console.error("Error creating account:", error);
        toast.error("Failed to create account. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [
      userExists,
      authToken,
      techAdminUserId,
      reset,
      resetState,
      commissionCalculations,
      partnershipCalculations,
      currentSportsData,
      commissionSettings,
      commissionLenaYaDena,
      userType,
      userId,
      currentUserAllowedTypes,
    ]
  );

  return (
    <div className="p-2 sm:p-4 bg-[#fafafa] min-h-screen min-w-fit">
      <h2 className="text-lg font-normal mb-2">Add Account</h2>
      {isLoadingAccounts && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="text-blue-700 text-sm">Loading accounts data...</span>
          </div>
        </div>
      )}
      <div className="bg-white rounded-lg shadow p-4 w-full">
        {/* Personal & Account Detail */}
        <div className="flex flex-row gap-4 mb-4 w-full">
          {/* Personal Detail */}
          <div className="w-full">
            <div className="bg-[#2d3e50] text-white leading-8 px-2 font-normal text-md mb-2">
              Personal Detail
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-normal mb-1">
                  Login ID:
                </label>
                <input
                  {...register("loginId", {
                    required: "Login ID is required",
                    onChange: (e) => handleLoginIdChange(e.target.value),
                  })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-xs mb-2"
                  placeholder="Login ID"
                />
                {watchedValues.loginId?.trim() && (
                  <p
                    className={`text-xs mt-1 ${
                      isCheckingUserId
                        ? "text-blue-500"
                        : userExists === null
                          ? "text-gray-500"
                          : userExists
                            ? "text-red-500"
                            : "text-green-500"
                    }`}
                  >
                    {isCheckingUserId
                      ? "🔄 Checking availability..."
                      : userExists === null
                        ? ""
                        : userExists
                          ? "❌ User already exists"
                          : "✅ Available"}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-normal mb-1">
                  Client Name:
                </label>
                <input
                  {...register("clientName", {
                    required: "Client Name is required",
                  })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-xs mb-2"
                  placeholder="Client Name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">
                  User Password:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password", {
                      required: "Password is required",
                      validate: (v) => isStrongPassword(v) || passwordRule,
                    })}
                    className="w-full border border-gray-300 rounded px-3 py-2 pr-10 text-xs mb-2"
                    placeholder="User Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
                    style={{ marginTop: "-4px" }}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <FaEyeSlash className="w-4 h-4" />
                    ) : (
                      <FaEye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-normal mb-1">
                  Retype Password:
                </label>
                <div className="relative">
                  <input
                    type={showRetypePassword ? "text" : "password"}
                    {...register("retypePassword", {
                      required: "Please retype password",
                      validate: (v) =>
                        v === password ? true : "Passwords do not match",
                    })}
                    className="w-full border border-gray-300 rounded px-3 py-2 pr-10 text-xs mb-2"
                    placeholder="Retype Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRetypePassword(!showRetypePassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
                    style={{ marginTop: "-4px" }}
                    aria-label={
                      showRetypePassword ? "Hide password" : "Show password"
                    }
                  >
                    {showRetypePassword ? (
                      <FaEyeSlash className="w-4 h-4" />
                    ) : (
                      <FaEye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="md:col-span-2 text-[11px] text-gray-500 -mt-2">
                {passwordRule}
              </div>
            </div>
            {/* Remarks Field */}
            <div className="mt-4">
              <label className="block text-xs font-normal mb-1">Remarks:</label>
              <textarea
                value={remarksText}
                readOnly
                className="w-full border border-gray-300 rounded px-3 py-2 text-xs mb-2 bg-gray-50 resize-none"
                rows={2}
                placeholder="Remarks will appear here based on client name"
              />
            </div>
          </div>
          {/* Account Detail */}
          <div className="w-full">
            <div className="bg-[#2d3e50] text-white px-2 leading-8 font-normal text-md mb-2">
              Account Detail
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-normal mb-1">
                  Account Type:
                </label>
                <select
                  {...register("accountType", {
                    required: "Please select an account type",
                    onChange: (e) => handleAccountTypeChange(e.target.value),
                  })}
                  className="w-full text-gray-500 border border-gray-300 rounded px-3 py-2 text-xs mb-2"
                >
                  <option className="text-xs text-gray-500" value="">
                    Select Account Type
                  </option>
                  {currentUserAllowedTypes.length > 0 ? (
                    currentUserAllowedTypes.map((allowedType: string) => (
                      <option
                        className="text-xs text-gray-500"
                        key={allowedType}
                        value={allowedType}
                      >
                        {getAccountTypeLabel(allowedType)}
                      </option>
                    ))
                  ) : (
                    <option className="text-xs text-gray-500" value="" disabled>
                      No account types available for your user level
                    </option>
                  )}
                </select>
              </div>
              {/* Allowed No of Users is fixed to 99999 and hidden from UI */}
              <div>
                <label className="block text-xs font-normal mb-1">
                  Credit Reference:
                </label>
                <input
                  {...register("creditReference")}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-xs mb-2"
                  placeholder="Credit Reference"
                />
              </div>
              {watchedValues.accountType === "Client" && (
                <div>
                  <label className="block text-xs font-normal mb-1">
                    Exposure Limit:
                  </label>
                  <input
                    type="number"
                    {...register("exposureLimit", {
                      valueAsNumber: true,
                      min: { value: 0, message: "Must be at least 0" },
                    })}
                    min="0"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-xs mb-2"
                    placeholder="Enter exposure limit"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        {watchedValues.accountType !== "Client" && (
          <React.Fragment>
            {/* Commission Settings */}
            <div className="mb-4">
              <div className="bg-[#2d3e50] text-white px-2 leading-8 font-normal text-md mb-2">
                Commission Settings
              </div>
              <div className="flex flex-col">
                <div className=" bg-[#0000000d] flex justify-between items-center border-white font-normal text-xs">
                  <h2 className="text-xs font-normal w-1/2 px-4 leading-8">
                    Upline
                  </h2>
                  <input
                    type="text"
                    value={commissionCalculations.upline.toFixed(2)}
                    disabled
                    className="w-full border-gray-300 px-4 text-xs leading-8 border-l"
                  />
                </div>
                <div className=" bg-white flex justify-between items-center border-white font-normal text-xs">
                  <h2 className="text-xs font-normal w-1/2 px-4 leading-8">
                    Our
                  </h2>
                  <input
                    type="number"
                    disabled
                    {...register("ourCommission", {
                      valueAsNumber: true,
                      min: { value: 0, message: "Must be at least 0" },
                      max: {
                        value: commissionCalculations.maxOurAllowed,
                        message: `Must be at most ${commissionCalculations.maxOurAllowed}%`,
                      },
                    })}
                    min="0"
                    max={commissionCalculations.maxOurAllowed}
                    className={`w-full focus:outline-none px-4 text-xs leading-8 border-l ${
                      commissionCalculations.isValidAllocation
                        ? "border-gray-300"
                        : "border-red-300 bg-red-50"
                    }`}
                  />
                </div>
                <div className=" bg-[#0000000d] flex justify-between items-center border-white font-normal text-xs">
                  <h2 className="text-xs font-normal w-1/2 px-4 leading-8">
                    Downline
                  </h2>
                  <input
                    type="number"
                    {...register("downlineCommission", {
                      valueAsNumber: true,
                      min: { value: 0, message: "Must be at least 0" },
                      max: {
                        value: commissionCalculations.maxOurAllowed,
                        message: `Must be at most ${commissionCalculations.maxOurAllowed}%`,
                      },
                    })}
                    min="0"
                    max={commissionCalculations.maxOurAllowed}
                    className={`w-full focus:outline-none px-4 text-xs leading-8 border-l ${
                      commissionCalculations.isValidAllocation
                        ? "border-gray-300"
                        : "border-red-300 bg-red-50"
                    }`}
                  />
                </div>
                {!commissionCalculations.isValidAllocation && (
                  <div className="bg-red-50 border border-red-200 rounded px-3 py-2 mt-2">
                    
                    <p className="text-gray-500 text-xs mt-1">
                      Note: Downline (editable) should be {watch("ourCommission")}% or less
                    </p>
                  </div>
                )}
              </div>
            </div>
            {/* Partnership */}
            <div className="mb-4">
              <div className="bg-[#2d3e50] text-white px-2 leading-8 font-normal text-md mb-2">
                Partnership Distribution
              </div>

              {/* Partnership Overview */}
             

              <div className="flex flex-col">
                <div className=" bg-[#0000000d] flex justify-between items-center border-white font-normal text-xs">
                  <div className="w-1/2 px-4 leading-8 flex gap-2">
                    <h2 className="text-xs font-normal">Upline Share</h2>
                    <p className="text-xs text-gray-500">(Fixed - cannot be changed)</p>
                  </div>
                  <input
                    type="text"
                    value={partnershipCalculations.upline.toFixed(2)}
                    disabled
                    className="w-full border-gray-300 px-4 text-xs leading-8 border-l bg-gray-100"
                  />
                </div>
                <div className=" bg-white flex justify-between items-center border-white font-normal text-xs">
                  <div className="w-1/2 px-4 leading-8 flex gap-2 items-center">
                    <h2 className="text-xs font-normal">Your Share</h2>
                    <p className="text-xs text-gray-500">(Available for distribution)</p>
                  </div>
                  <div className="w-full flex items-center">
                    <input
                      type="text"
                      value={partnershipCalculations.our.toFixed(2)}
                      disabled
                      className="w-full border-gray-300 px-4 text-xs leading-8 border-l bg-gray-100"
                    />
                    <span className="ml-2 text-xs text-gray-500">%</span>
                  </div>
                </div>
                <div className=" bg-[#0000000d] flex justify-between items-center border-white font-normal text-xs">
                  <div className="w-1/2 px-4 leading-8 flex gap-2 items-center">
                    <h2 className="text-xs font-normal">Give to Downline</h2>
                    <p className="text-xs text-gray-500">(% of your share)</p>
                    <div className="text-xs text-blue-600 font-medium">
                      = {partnershipCalculations.downlineAbsolute.toFixed(2)}% actual share
                    </div>
                  </div>
                  <div className="w-full flex items-center">
                    <input
                      type="number"
                      {...register("downlinePartnership", {
                        valueAsNumber: true,
                        min: { value: 0, message: "Must be at least 0" },
                        max: {
                          value: partnershipCalculations.maxOurAllowed,
                          message: `Must be at most ${partnershipCalculations.maxOurAllowed}`,
                        },
                        onChange: (e) => {
                          const value = clampValue(
                            Number(e.target.value),
                            0,
                            partnershipCalculations.maxOurAllowed
                          );
                          setValue("downlinePartnership", value);
                        },
                      })}
                      min="0"
                      max={partnershipCalculations.maxOurAllowed}
                      className={`w-full focus:outline-none px-4 text-xs leading-8 border-l ${
                        partnershipCalculations.isValidAllocation
                          ? "border-gray-300"
                          : "border-red-300 bg-red-50"
                      }`}
                      placeholder="Enter % to give"
                    />
                    <span className="ml-2 text-xs text-gray-500">%</span>
                  </div>
                </div>
            
              </div>
            </div>
            
           
          </React.Fragment>
        )}
       
        {/* Transaction Password & Button */}
        <div className="flex justify-end">
          <div className="w-1/3">
            <label className="block text-xs font-normal mb-1">
              Transaction Password:
            </label>
            <input
              type="password"
              {...register("transactionPassword", {
                required: "Transaction Password is required",
              })}
              className="w-full border border-gray-300 rounded px-3 leading-8 text-xs mb-2"
              placeholder="Transaction Password"
            />
            <div className="flex justify-end">
              <button
                onClick={handleSubmit(onSubmit)}
                disabled={isLoading || currentUserAllowedTypes.length === 0}
                className="leading-8 px-3 rounded font-normal text-white text-xs bg-[var(--bg-primary,#2196f3)] hover:opacity-90 transition w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-3 w-3 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </div>
          </div>
        </div>
       
      </div>
    </div>
  );
};

export default AddClient;
