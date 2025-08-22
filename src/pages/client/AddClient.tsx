import { getDecodedTokenData, baseUrl } from "@/helper/auth";
import { createNewUser, getCurrentSportsSettings } from "@/helper/user";
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
  minBet: number;
  maxBet: number;
  delay: number;
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
      minBet: 0,
      maxBet: 0,
      delay: CONSTANTS.DEFAULT_DELAY,
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
  } = watchedValues;

  // Use custom hook for login ID checking
  const whiteListId = whitelistData?.whiteListData?._id || "";
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

  // Get panel data from sports settings with error handling
  const panelData = useMemo(() => {
    try {
      // Extract commission and partnership values from the new sports settings structure
      const sportsSettings = currentSportsData?.data || {};
      const commissionValues = Object.values(sportsSettings)
        ?.filter(
          (setting: any) =>
            setting &&
            typeof setting === "object" &&
            setting.matchCommission !== undefined
        )
        ?.map((setting: any) => setting.matchCommission);

      const partnershipValues = Object.values(sportsSettings)
        .filter(
          (setting: any) =>
            setting &&
            typeof setting === "object" &&
            setting.partnership !== undefined
        )
        ?.map((setting: any) => setting.partnership);

      // Calculate averages for panel data
      const avgCommission =
        commissionValues.length > 0
          ? commissionValues.reduce(
              (sum: number, val: number) => sum + val,
              0
            ) / commissionValues.length
          : 0;

      const avgPartnership =
        partnershipValues.length > 0
          ? partnershipValues.reduce(
              (sum: number, val: number) => sum + val,
              0
            ) / partnershipValues.length
          : 0;

      return {
        panelCommission: {
          own: avgCommission,
          total: avgCommission,
        },
        panelPartnership: {
          own: avgPartnership,
          total: avgPartnership,
        },
      };
    } catch (error) {
      console.warn("Panel validation error:", error);
      return { panelCommission: null, panelPartnership: null };
    }
  }, [currentSportsData?.data]);

  // Debug: Log sports data when it changes
  console.log("Sports Settings Loaded:", {
    hasData: !!currentSportsData?.data,
    sportsCount: currentSportsData?.data
      ? Object.keys(currentSportsData.data).length
      : 0,
    validationResult: panelData,
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
      // Initialize ourCommission field with panel's own value
      setValue("ourCommission", panelData.panelCommission.own || 0);
    }
    if (panelData?.panelPartnership) {
      setPanelPartnership(panelData.panelPartnership);
      // Initialize ourPartnership field with 0 (user will set their desired value)
      setValue("ourPartnership", 0);
    }
  }, [panelData, setValue]);

  // Calculate commission values - only "our" is user input, "downline" is fixed, "total" is calculated
  const commissionCalculations = useMemo((): CommissionCalculations => {
    const panelTotal = panelData?.panelCommission?.total || 0; // Original panel total (for reference)
    const parentOwn = panelData?.panelCommission?.own || 0; // What parent currently has
    const upline = panelTotal - parentOwn; // Commission passed to parent user (fixed)
    const downline = 0; // Commission passed to child user (fixed at 0)
    const our = ourCommission || 0; // What current user keeps (user input - editable)
    const total = upline + downline + our; // Total adjusts based on our input only
    const own = our; // Own is same as our

    // Validation: basic checks
    const isValidAllocation = our >= 0; // Our should be non-negative
    const maxOurAllowed = CONSTANTS.MAX_COMMISSION; // Set a reasonable maximum for our

    console.log("Commission Calc Debug:", {
      panelTotal,
      parentOwn,
      upline,
      downline,
      our,
      total,
      own,
      formula: `total = ${upline} + ${downline} + ${our} = ${total}`,
      constraints: `our ≥ 0`,
      isValidAllocation,
      maxOurAllowed,
    });

    return {
      upline: upline, // Commission passed to parent user (fixed)
      downline: downline, // Commission passed to child user (fixed)
      our: our, // What current user keeps (user input - editable)
      own: own, // Same as our
      total: total, // Calculated total (upline + downline + our)
      panelTotal: panelTotal, // Original panel total
      parentOwn: parentOwn, // What parent currently has
      isValidAllocation: isValidAllocation, // Validation flag
      maxOurAllowed: maxOurAllowed, // Maximum "our" allowed
    };
  }, [panelData?.panelCommission, ourCommission]);

  // Calculate partnership values using the correct formula: upline + our + downline = total
  const partnershipCalculations = useMemo((): PartnershipCalculations => {
    // Base values from panel
    const previousDownline = panelData?.panelPartnership?.own || 0; // treat this bucket as 100% available
    const total = panelData?.panelPartnership?.total || 0;
    const ourPercent = Math.max(0, ourPartnership || 0); // input as percentage of previousDownline
    const upline = total - previousDownline; // fixed part that goes to upline

    // Convert percent to absolute share from the previousDownline bucket
    const ourAbsolute = (previousDownline * ourPercent) / 100;
    const newDownline = Math.max(0, previousDownline - ourAbsolute);
    const downlineChange = newDownline - previousDownline; // negative means reduced

    return {
      upline,
      downline: newDownline,
      our: ourAbsolute, // absolute share taken by current user from the bucket
      total,
      own: previousDownline,
      maxOurAllowed: 100, // percent of the bucket
      isValidAllocation:
        ourPercent >= 0 && ourPercent <= 100 && newDownline >= 0,
      calculatedSum: upline + ourAbsolute + newDownline,
      // @ts-expect-error expose delta for UI note
      downlineChange,
    };
  }, [panelData?.panelPartnership, ourPartnership]);

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

  // Memoized user ID for tech admin
  const techAdminUserId = useMemo(() => userId || "", [userId]);

  // Development logging - can be removed in production
  if (process.env.NODE_ENV === "development") {
    console.log("Current Sports Data:", currentSportsData);
    console.log("User Type:", userType);
    console.log("Allowed Account Types:", currentUserAllowedTypes);
  }

  // Function to convert modified panel values back to original sports settings format
  const convertToOriginalSportsSettings = useCallback(
    (
      originalSportsSettings: any,
      newCommissionOwn: number,
      newCommissionTotal: number,
      newPartnershipOwn: number,
      newPartnershipTotal: number,
      newPartnershipDownline: number
    ) => {
      if (
        !originalSportsSettings ||
        Object.keys(originalSportsSettings).length === 0
      ) {
        return {};
      }

      const updatedSportsSettings = JSON.parse(
        JSON.stringify(originalSportsSettings)
      ); // Deep copy

      // Get current user key from mapping
      const currentUserKey =
        USER_TYPE_MAP[userType || ""] || userType?.toLowerCase();

      // Update each sport setting with new commission and partnership values
      Object.keys(updatedSportsSettings).forEach((sportKey) => {
        if (sportKey === "success" || sportKey === "status") return;

        const setting = updatedSportsSettings[sportKey];

        // Update match commission
        if (setting.matchCommission !== undefined) {
          setting.matchCommission = newCommissionOwn;
        }

        // Update partnership
        if (setting.partnership !== undefined) {
          setting.partnership = newPartnershipOwn;
        }
      });

      // Log the exact structure being created for verification
      console.log("🏈 Sports Settings Conversion Complete:", {
        userType,
        currentUserKey,
        userId,
        inputValues: {
          newCommissionOwn,
          newCommissionTotal,
          newPartnershipOwn,
          newPartnershipTotal,
          newPartnershipDownline,
        },
      });

      // Log each sport's structure to verify format
      Object.keys(updatedSportsSettings).forEach((sportKey) => {
        if (sportKey === "success" || sportKey === "status") return;

        const sport = updatedSportsSettings[sportKey];
        console.log(`📊 ${sportKey} Structure:`, {
          matchCommission: sport.matchCommission,
          partnership: sport.partnership,
        });
      });

      return updatedSportsSettings;
    },
    [userType, userId]
  );

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
        // Calculate updated commission and partnership values based on form inputs
        const updatedCommissionOwn = data.ourCommission || 0;
        const updatedCommissionTotal = commissionCalculations.total;
        const updatedPartnershipOwn = data.ourPartnership || 0;
        const updatedPartnershipTotal = partnershipCalculations.total;
        const updatedPartnershipDownline = partnershipCalculations.downline;

        // Convert modified values back to original sports settings format
        const updatedSportsSettings = convertToOriginalSportsSettings(
          currentSportsData?.data,
          updatedCommissionOwn,
          updatedCommissionTotal,
          updatedPartnershipOwn,
          updatedPartnershipTotal,
          updatedPartnershipDownline
        );

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
          // Send updated sports settings with modified commission/partnership values
          ...(data.accountType !== "Client" && {
            // sportsSettings: updatedSportsSettings,
            casinoSettings: updatedSportsSettings?.casinoSettings,
            cricketSettings: updatedSportsSettings?.cricketSettings,
            tennisSettings: updatedSportsSettings?.tennisSettings,
            soccerSettings: updatedSportsSettings?.soccerSettings,
            internationalCasinoSettings:
              updatedSportsSettings?.internationalCasinoSettings,
          }),
          remarks: `creating account for ${data.clientName}`,

          // ...(data.accountType !== "Client" && {
          //   // AccountDetails: {
          //   creditRef: data.creditReference,
          //   // },
          // }),
          // Include exposureLimit for Client accounts
          ...(data.accountType === "Client" && {
            // AccountDetails: {
            exposureLimit: data.exposureLimit,
            // },
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
      convertToOriginalSportsSettings,
      userType,
      userId,
    ]
  );

  return (
    <div className="p-2 sm:p-4 bg-[#fafafa] min-h-screen min-w-fit">
      <h2 className="text-lg font-normal mb-2">Add Account</h2>
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
                    Downline
                  </h2>
                  <input
                    type="text"
                    value={commissionCalculations.downline.toFixed(2)}
                    disabled
                    className="w-full border-gray-300 px-4 text-xs leading-8 border-l"
                  />
                </div>
                <div className=" bg-[#0000000d] flex justify-between items-center border-white font-normal text-xs">
                  <h2 className="text-xs font-normal w-1/2 px-4 leading-8">
                    Our
                  </h2>
                  <input
                    type="number"
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
                <div className=" bg-white flex justify-between items-center border-white font-normal text-xs">
                  <h2 className="text-xs font-normal w-1/2 px-4 leading-8">
                    Total
                  </h2>
                  <input
                    type="text"
                    value={commissionCalculations.total.toFixed(2)}
                    disabled
                    className="w-full border-gray-300 px-4 text-xs leading-8 border-l"
                  />
                </div>
                {!commissionCalculations.isValidAllocation && (
                  <div className="bg-red-50 border border-red-200 rounded px-3 py-2 mt-2">
                    <p className="text-red-600 text-xs">
                      ⚠️ Invalid input! Our value must be non-negative.
                    </p>
                    <p className="text-red-500 text-xs mt-1">
                      Maximum "Our" allowed:{" "}
                      {commissionCalculations.maxOurAllowed}%
                    </p>
                  </div>
                )}
              </div>
            </div>
            {/* Partnership */}
            <div className="mb-4">
              <div className="bg-[#2d3e50] text-white px-2 leading-8 font-normal text-md mb-2">
                Partnership
              </div>

              <div className="flex flex-col">
                <div className=" bg-[#0000000d] flex justify-between items-center border-white font-normal text-xs">
                  <h2 className="text-xs font-normal w-1/2 px-4 leading-8">
                    Upline
                  </h2>
                  <input
                    type="text"
                    value={partnershipCalculations.upline.toFixed(2)}
                    disabled
                    className="w-full border-gray-300 px-4 text-xs leading-8 border-l"
                  />
                </div>
                <div className=" bg-white flex justify-between items-center border-white font-normal text-xs">
                  <h2 className="text-xs font-normal w-1/2 px-4 leading-8">
                    Our
                  </h2>
                  <div className="w-full flex items-center">
                    <input
                      type="number"
                      {...register("ourPartnership", {
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
                          setValue("ourPartnership", value);
                        },
                      })}
                      min="0"
                      max={partnershipCalculations.maxOurAllowed}
                      className={`w-full focus:outline-none px-4 text-xs leading-8 border-l ${
                        partnershipCalculations.isValidAllocation
                          ? "border-gray-300"
                          : "border-red-300 bg-red-50"
                      }`}
                    />
                    <span className="ml-2 text-xs text-gray-500">%</span>
                  </div>
                </div>
                <div className=" bg-[#0000000d] flex justify-between items-center border-white font-normal text-xs">
                  <h2 className="text-xs font-normal w-1/2 px-4 leading-8">
                    Downline
                  </h2>
                  <input
                    type="text"
                    value={partnershipCalculations.downline.toFixed(2)}
                    disabled
                    className="w-full focus:outline-none border-gray-300 px-4 text-xs leading-8 border-l"
                  />
                </div>
                <div className=" bg-white flex justify-between items-center border-white font-normal text-xs">
                  <h2 className="text-xs font-normal w-1/2 px-4 leading-8">
                    Total
                  </h2>
                  <input
                    type="text"
                    value={partnershipCalculations.total.toFixed(2)}
                    disabled
                    className="w-full border-gray-300 px-4 text-xs leading-8 border-l"
                  />
                </div>
                {/* UX note about how values change */}
                <div className="mt-2 mx-3 p-2 bg-gray-50 border border-gray-200 rounded text-[11px] text-gray-700">
                  <div>
                    <span className="font-medium">How it works</span>: "Our" is
                    taken as a % of the downline pool.
                  </div>
                  <div className="mt-1">
                    <span className="font-medium">Pool</span>:{" "}
                    {partnershipCalculations.own}%
                  </div>
                  <div>
                    <span className="font-medium">Our</span>:{" "}
                    {ourPartnership || 0}% of pool
                  </div>
                  <div>
                    <span className="font-medium">New downline</span>:{" "}
                    {partnershipCalculations.own} − (
                    {partnershipCalculations.own} × {ourPartnership || 0}% ÷
                    100) = {partnershipCalculations.downline.toFixed(2)}%
                  </div>
                  <div className="mt-1">
                    <span className="font-medium">Change</span>:
                    <span
                      className={`ml-1 ${
                        partnershipCalculations.downline -
                          partnershipCalculations.own <
                        0
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {partnershipCalculations.downline -
                        partnershipCalculations.own >=
                      0
                        ? "+"
                        : ""}
                      {(
                        partnershipCalculations.downline -
                        partnershipCalculations.own
                      ).toFixed(2)}
                      %
                    </span>
                  </div>
                </div>
                {!partnershipCalculations.isValidAllocation && (
                  <div className="bg-red-50 border border-red-200 rounded px-3 py-2 mt-2">
                    <p className="text-red-600 text-xs">
                      ⚠️ Invalid input! Our value must be between 0 and{" "}
                      {partnershipCalculations.maxOurAllowed}.
                    </p>
                    <p className="text-red-500 text-xs mt-1">
                      Formula: Upline ({partnershipCalculations.upline}) + Our (
                      {partnershipCalculations.our}) + Downline (
                      {partnershipCalculations.downline}) ={" "}
                      {partnershipCalculations.calculatedSum} (should equal{" "}
                      {partnershipCalculations.total})
                    </p>
                  </div>
                )}
              </div>
            </div>
          </React.Fragment>
        )}
        {/* Min Max Bet */}
        {/* {watchedValues.accountType === "Client" && (
          <div className="mb-4">
            <div className="bg-[#2d3e50] text-white px-2 leading-8 font-normal text-md mb-2">
              Min Max Bet
            </div>
            <div className="flex flex-col">
              <div className=" bg-[#0000000d] flex justify-between items-center border-white font-normal text-xs">
                <h2 className="text-xs font-normal w-1/2 px-4 leading-8">
                  {" "}
                  Min Bet
                </h2>
                <div className="w-full">
                  <input
                    type="text"
                    value={CONSTANTS.MIN_BET_LIMIT}
                    disabled
                    className="w-full border-gray-300 px-4 text-xs leading-8 border-l"
                  />
                  <input
                    type="number"
                    {...register("minBet", {
                      valueAsNumber: true,
                      min: { value: 0, message: "Must be at least 0" },
                      max: { value: 100, message: "Must be at most 100" },
                      onChange: (e) => {
                        const value = clampValue(
                          Number(e.target.value),
                          0,
                          100
                        );
                        setValue("minBet", value);
                      },
                    })}
                    min="0"
                    max="100"
                    className="w-full focus:outline-none text-gray-400 border-gray-300 px-4 text-xs leading-8 border-l"
                  />
                </div>
              </div>
              <div className=" bg-white flex justify-between items-center border-white font-normal text-xs">
                <h2 className="text-xs font-normal w-1/2 px-4 leading-8">
                  {" "}
                  Max Bet
                </h2>
                <div className="w-full">
                  <input
                    type="text"
                    value={CONSTANTS.MAX_BET_LIMIT}
                    disabled
                    className="w-full border-gray-300 px-4 text-xs leading-8 border-l"
                  />
                  <input
                    type="number"
                    {...register("maxBet", {
                      valueAsNumber: true,
                      min: { value: 0, message: "Must be at least 0" },
                      max: { value: 100, message: "Must be at most 100" },
                      onChange: (e) => {
                        const value = clampValue(
                          Number(e.target.value),
                          0,
                          100
                        );
                        setValue("maxBet", value);
                      },
                    })}
                    min="0"
                    max="100"
                    className="w-full focus:outline-none text-gray-400 border-gray-300 px-4 text-xs leading-8 border-l"
                  />
                </div>
              </div>
              <div className=" bg-[#0000000d] flex justify-between items-center border-white font-normal text-xs">
                <h2 className="text-xs font-normal w-1/2 px-4 leading-8">
                  {" "}
                  Delay
                </h2>
                <div className="w-full">
                  <input
                    type="text"
                    value={CONSTANTS.DEFAULT_DELAY}
                    disabled
                    className="w-full border-gray-300 px-4 text-xs leading-8 border-l"
                  />
                  <input
                    type="number"
                    {...register("delay", {
                      valueAsNumber: true,
                      min: { value: 0, message: "Must be at least 0" },
                      max: { value: 100, message: "Must be at most 100" },
                      onChange: (e) => {
                        const value = clampValue(
                          Number(e.target.value),
                          0,
                          100
                        );
                        setValue("delay", value);
                      },
                    })}
                    min="0"
                    max="100"
                    placeholder={CONSTANTS.DEFAULT_DELAY.toString()}
                    className="w-full focus:outline-none text-gray-400 border-gray-300 px-4 text-xs leading-8 border-l"
                  />
                </div>
              </div>
            </div>
          </div>
        )} */}
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
        {watchedValues.accountType !== "Client" && (
          <React.Fragment>
            {(panelCommission || panelPartnership) && (
              <div className="my-4">
                <div className="bg-[#2d3e50] text-white px-2 leading-8 font-normal text-md mb-2">
                  Panel Settings Summary
                </div>
                <div className="bg-gray-50 p-3 rounded border text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    {panelCommission && (
                      <div>
                        <span className="font-medium text-gray-700">
                          Commission Distribution:
                        </span>
                        <div className="mt-1 space-y-1">
                          <div>Upline: {commissionCalculations.upline}%</div>
                          <div>
                            Downline: {commissionCalculations.downline}%
                          </div>
                          <div>Our: {commissionCalculations.our}%</div>
                          <div className="border-t pt-1 px-2 py-1">
                            Total : {commissionCalculations.total}%
                          </div>
                        </div>
                      </div>
                    )}
                    {panelPartnership && (
                      <div>
                        <span className="font-medium text-gray-700">
                          Partnership Distribution:
                        </span>
                        <div className="mt-1 space-y-1">
                          <div>
                            Upline: {partnershipCalculations.upline.toFixed(2)}%
                          </div>
                          <div>
                            Your Share: {partnershipCalculations.our.toFixed(2)}
                            %
                          </div>
                          <div>
                            To Downline:{" "}
                            {partnershipCalculations.downline.toFixed(2)}%
                          </div>
                          <div className="border-t pt-1">
                            Total: {partnershipCalculations.total}%
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </React.Fragment>
        )}
      </div>
    </div>
  );
};

export default AddClient;
