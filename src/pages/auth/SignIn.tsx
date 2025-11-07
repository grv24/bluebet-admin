import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import { FaUser, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { useForm } from "react-hook-form";
import { useLoginMutation } from "@/hooks/useLoginMutation";
import {
  AuthCookies,
  baseUrl,
  getDecodedTokenData,
  isAuthenticated,
  LoginRequest,
  getAuthCookieKey,
  debugCookies,
  getUserType,
  removeDirectCookie,
  getDirectCookie,
} from "@/helper/auth";
import { authenticate } from "@/helper/auth";
import { useGlobalData } from "@/App";
import toast from "react-hot-toast";
import socketService, { ForceLogoutData } from "@/utils/socketService";
import ForceLogoutModal from "@/components/common/ForceLogoutModal";

interface SignInFormInputs {
  userId: string;
  password: string;
  hostUrl: string;
  IpAddress: string;
}

const SignIn = () => {
  const navigate = useNavigate();
  const [cookies, setCookie] = useCookies([
    "Admin",
    "TechAdmin",
    "hasPopupBeenShown",
    "token",
  ]);
  const token = cookies[getAuthCookieKey()];
  const [showPassword, setShowPassword] = useState(false);
  const [forceLogoutData, setForceLogoutData] = useState<ForceLogoutData | null>(null);
  const [showForceLogoutModal, setShowForceLogoutModal] = useState(false);

  // Get global data from context (may be undefined on public routes)
  const globalData = useGlobalData();
  const IpAddressData = globalData?.IpAddressData;

  // console.log(token, "cookies");

  const { mutate: login, isPending } = useLoginMutation({
    onSuccess: (responseData) => {
      if (responseData?.status && responseData?.data?.token) {
        // Decode using fresh token
        const cookieKey = getAuthCookieKey();
        const decodedData: any =
          getDecodedTokenData({ [cookieKey]: responseData.data.token } as any) || {};

        // If id is not active, DO NOT set Admin/TechAdmin cookie; store temporary token and redirect
        if (responseData?.data?.isActive === false) {
          toast.success("Please change your password", { removeDelay: 2000 });
          setCookie("token" as any, responseData.data.token, { path: "/" });
          navigate("/auth/change-password", { replace: true });
          return;
        }

        // Authenticate using direct cookie setting
        authenticate(
          responseData,
          async () => {
            try {
              // Get user details from token for socket connection
              const decodedToken = getDecodedTokenData({ [cookieKey]: responseData.data.token } as any);
              const userType = getUserType();
              
              console.log("🔍 [DEBUG] Login success - attempting socket connection:", {
                decodedToken: decodedToken?.user,
                userType,
                loginId: decodedToken?.user?.PersonalDetails?.loginId,
                token: responseData.data.token ? 'present' : 'missing',
                cookieKey
              });
              
              // Connect to Socket.IO
              if (decodedToken?.user?.PersonalDetails?.loginId) {
                console.log("🔌 [DEBUG] Starting socket connection...");
                const status = socketService.getConnectionStatus();
                console.log("🔌 [DEBUG] Current socket status:", status);
                
                if (!status.isConnected && !status.isConnecting) {
                  console.log("🔌 [DEBUG] Attempting to connect socket with:", {
                    loginId: decodedToken.user.PersonalDetails.loginId,
                    userType
                  });
                  
                  try {
                    await socketService.connect(decodedToken.user.PersonalDetails.loginId, userType);
                    console.log("🔌 [DEBUG] Socket connected successfully");
                    console.log("🔌 [DEBUG] Socket status after connection:", socketService.isSocketConnected());
                    console.log("🔌 [DEBUG] Final connection status:", socketService.getConnectionStatus());
                  } catch (socketError) {
                    console.error("🔌 [DEBUG] Socket connection failed:", socketError);
                    console.error("🔌 [DEBUG] Socket error details:", {
                      message: (socketError as any)?.message,
                      stack: (socketError as any)?.stack,
                      loginId: decodedToken.user.PersonalDetails.loginId,
                      userType
                    });
                  }
                } else {
                  console.log("🔌 [DEBUG] Socket already connected or connecting, skipping connection attempt");
                }
              } else {
                console.error("🔌 [DEBUG] No loginId found in token, cannot connect socket", {
                  decodedToken: decodedToken?.user,
                  personalDetails: decodedToken?.user?.PersonalDetails
                });
              }
              
              toast.success("Login successful!", { duration: 500 });
              // Navigate to clients page without page refresh
              setTimeout(() => {
                navigate("/clients");
              }, 100);
            } catch (socketError) {
              console.error("🔌 [DEBUG] Socket connection failed in outer catch:", socketError);
              console.error("🔌 [DEBUG] Socket error details:", {
                message: (socketError as any)?.message,
                stack: (socketError as any)?.stack
              });
              // Continue with login even if socket fails
              toast.success("Login successful!", { duration: 500 });
              setTimeout(() => {
                navigate("/clients");
              }, 100);
            }
          },
          setCookie as any
        );
      } else {
        console.log(responseData, "responseData");
        const errorMessage =
          responseData?.message || "Login failed. Please try again.";
        toast.error(errorMessage);
      }
    },
    onError: (error) => {
      console.error("🚨 Login Error:", error);

      const status = error?.response?.status;
      const serverMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message;

      // Handle different types of errors with server messages
      if (status === 400) {
        toast.error(
          serverMessage || "Invalid request. Please check your input."
        );
        setError("userId", { message: "Please verify your credentials" });
      } else if (status === 401) {
        toast.error(serverMessage || "Invalid username or password");
        setError("userId", { message: "Authentication failed" });
      } else if (status === 403) {
        toast.error(serverMessage || "Account is temporarily locked");
      } else if (status === 429) {
        toast.error(
          serverMessage || "Too many attempts. Please try again later."
        );
      } else if (status && status >= 500) {
        toast.error(serverMessage || "Server error. Please try again later.");
      } else if (status === 0) {
        toast.error("Network error. Please check your connection.");
      } else {
        toast.error(serverMessage || "Login failed. Please try again.");
      }
    },
  });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignInFormInputs>();

  // Setup Socket.IO force logout handler
  useEffect(() => {
    console.log("🔌 [DEBUG] Setting up force logout handler");
    socketService.onForceLogout((data: ForceLogoutData) => {
      console.log("🚨 [DEBUG] Force logout triggered:", data);
      
      // Show force logout modal
      setForceLogoutData(data);
      setShowForceLogoutModal(true);
      
      // Clear all cookies using both react-cookie and direct methods
      const authCookieKey = getAuthCookieKey();
      
      // React-cookie removal
      setCookie("Admin", "", { path: "/", maxAge: 0 });
      setCookie("TechAdmin", "", { path: "/", maxAge: 0 });
      setCookie("hasPopupBeenShown", "", { path: "/", maxAge: 0 });
      setCookie("token", "", { path: "/", maxAge: 0 });
      
      // Direct cookie removal (including chunked tokens)
      removeDirectCookie(authCookieKey);  
      removeDirectCookie(`${authCookieKey}_encoded`);
      removeDirectCookie("hasPopupBeenShown");
      removeDirectCookie("token");
      
      // Clean up chunked cookies
      const chunksCount = getDirectCookie(`${authCookieKey}_chunks`);
      if (chunksCount) {
        const numChunks = parseInt(chunksCount);
        for (let i = 0; i < numChunks; i++) {
          removeDirectCookie(`${authCookieKey}_chunk_${i}`);
        }
        removeDirectCookie(`${authCookieKey}_chunks`);
      }
      
      console.log("🧹 [DEBUG] All cookies cleared after force logout");
      
      // Disconnect socket
      console.log("🔌 [DEBUG] Disconnecting socket due to force logout");
      socketService.disconnect();
      
      // Force reload to clear all state
      setTimeout(() => {
        console.log("🔄 [DEBUG] Force reloading page after force logout");
        window.location.href = "/sign-in";
      }, 1000);
    });

    // Cleanup on unmount
    return () => {
      console.log("🔌 [DEBUG] Cleaning up force logout handler on unmount");
      socketService.onForceLogout(() => {});
    };
  }, [setCookie]);

  // Check if already authenticated
  useEffect(() => {
    const authCookies: AuthCookies = {
      Admin: cookies.Admin,
      TechAdmin: cookies.TechAdmin,
      hasPopupBeenShown: cookies.hasPopupBeenShown,
    };

    debugCookies(authCookies);

    if (isAuthenticated(authCookies)) {
      console.log("✅ [DEBUG] User already authenticated, redirecting to clients");
      // navigate("/clients", { replace: true });
    } else {
      console.log("❌ [DEBUG] User not authenticated, staying on sign-in page");
    }
  }, [cookies.Admin, cookies.TechAdmin, cookies.hasPopupBeenShown, navigate]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleForceLogoutModalClose = () => {
    setShowForceLogoutModal(false);
    setForceLogoutData(null);
    // Force reload to login page to clear all state
    window.location.href = "/sign-in";
  };

  const onSubmit = (data: SignInFormInputs) => {
    // Validate required data
    if (!IpAddressData?.ip) {
      toast.error("Unable to get IP address. Please try again.");
      return;
    }

    if (!data.userId?.trim() || !data.password?.trim()) {
      toast.error("Please enter both username and password.");
      return;
    }

    const loginData: LoginRequest = {
      loginId: data.userId.trim(),
      password: data.password.trim(),
      IpAddress: IpAddressData.ip,
      hostUrl: baseUrl,
    };

    console.log("🔑 [DEBUG] Attempting login with data:", {
      ...loginData,
      password: "***hidden***", // Don't log actual password
    });

    login(loginData);
  };

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-b from-[var(--bg-primary)] to-[var(--bg-secondary)] w-screen">
      {/* login box */}
      <div className="text-center w-[400px] max-w-[90%] flex flex-col items-center justify-center gap-5 my-16">
        {/* logo */}
        <div className="">
          <img
            src="	https://sitethemedata.com/sitethemes/allpanelexch.com/front/logo.png"
            className="h-20 w-full"
            alt=""
            loading="lazy"
          />
        </div>
        {/* login form  */}
        <div className="rounded py-6 px-2 bg-white shadow-[0_0_5px_#fff] w-full">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex items-center justify-center w-full gap-2 my-2">
              <div className="flex-1 border-t border-gray-300"></div>
              <h4 className="text-black text-2xl font-normal px-4">Sign In</h4>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            <div className="mb-4 px-4">
              <div className="w-full border border-gray-300 rounded-md flex justify-between">
                <input
                  {...register("userId", {
                    required: "*Required",
                  })}
                  type="text"
                  className="py-2 px-4 outline-none w-full text-gray-500"
                  placeholder="Username"
                />
                <div className="bg-gray-300 text-right py-3 px-3 w-10 border-l border-gray-300 flex items-center justify-center">
                  <FaUser className="w-4 h-4 text-gray-600" />
                </div>
              </div>
              {errors.userId && (
                <p className="error text-red-500">{errors.userId.message}</p>
              )}
            </div>

            <div className="mb-4 px-4">
              <div className="border border-gray-300 rounded-md flex justify-between w-full relative">
                <input
                  {...register("password", {
                    required: "*Required",
                  })}
                  type={showPassword ? "text" : "password"}
                  className="py-2  px-4 outline-none w-full pr-12 text-gray-500"
                  placeholder="password"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-12 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <FaEyeSlash className="w-4 h-4" />
                  ) : (
                    <FaEye className="w-4 h-4" />
                  )}
                </button>
                <div className="bg-gray-300 text-right py-3 px-3 border-l border-gray-300">
                  <FaLock className="w-4 h-4 text-gray-600" />
                </div>
              </div>
              {errors.password && (
                <p className="error text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div className="mb-4 px-4">
              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-[var(--bg-primary)] cursor-pointer text-white py-2 px-4 rounded-md hover:bg-[var(--bg-primary90)] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
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
                    Signing in...
                  </>
                ) : (
                  <>
                    Login
                    <span>
                      <i className="fa-solid fa-right-to-bracket text-sm"></i>
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      </div>

      {/* Force Logout Modal */}
      <ForceLogoutModal
        isOpen={showForceLogoutModal}
        data={forceLogoutData}
        onClose={handleForceLogoutModalClose}
      />
    </>
  );
};

export default SignIn;
