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
} from "@/helper/auth";
import { authenticate } from "@/helper/auth";
import { useGlobalData } from "@/App";
import toast from "react-hot-toast";

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
  ]);
  const token = cookies[baseUrl.includes("techadmin") ? "TechAdmin" : "Admin"];
  const [showPassword, setShowPassword] = useState(false);

  // Get global data from context (may be undefined on public routes)
  const globalData = useGlobalData();
  const IpAddressData = globalData?.IpAddressData;

  // console.log(token, "cookies");

  const { mutate: login, isPending } = useLoginMutation({
    onSuccess: (responseData) => {
      if (responseData?.success && responseData?.token) {
        // Decode using fresh token
        const cookieKey = baseUrl.includes("techadmin") ? "TechAdmin" : "Admin";
        const { PersonalDetails }: any =
          getDecodedTokenData({ [cookieKey]: responseData.token } as any) || {};

        // If id is not active, DO NOT set Admin/TechAdmin cookie; store temporary token and redirect
        if (PersonalDetails?.idIsActive === false) {
          toast.success("Please change your password", { removeDelay: 2000 });
          setCookie("token" as any, responseData.token, { path: "/" });
          navigate("/auth/change-password", { replace: true });
          return;
        }

        // Otherwise, fully authenticate (sets Admin/TechAdmin cookie)
        authenticate(
          responseData,
          () => {
            toast.success("Login successful!", { duration: 500 });
          },
          (name: string, value: any, options?: any) =>
            setCookie(name as "Admin" | "TechAdmin", value, options)
        );
        navigate("/clients", { replace: true });
      } else {
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

  // // Check if already authenticated
  useEffect(() => {
    const authCookies: AuthCookies = {
      Admin: cookies.Admin,
      TechAdmin: cookies.TechAdmin,
      hasPopupBeenShown: cookies.hasPopupBeenShown,
    };

    if (isAuthenticated(authCookies)) {
      navigate("/clients", { replace: true });
    }
  }, [cookies.Admin, cookies.TechAdmin, cookies.hasPopupBeenShown, navigate]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const onSubmit = (data: SignInFormInputs) => {
    // Validate required data
    if (!IpAddressData?.IpAddress) {
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
      IpAddress: IpAddressData.IpAddress,
      hostUrl: baseUrl,
    };

    console.log("🔑 Attempting login with data:", {
      ...loginData,
      password: "***hidden***", // Don't log actual password
    });

    login(loginData);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-b from-[var(--bg-primary)] to-[var(--bg-secondary)] w-screen">
      {/* login box */}
      <div className="text-center w-[400px] max-w-[90%] flex flex-col items-center justify-center gap-5 my-16">
        {/* logo */}
        <div className="">
          <img
            src="https://allpanealexch.com/assets/hosts/allpanealexch.com/logo.png?v=1.4"
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
  );
};

export default SignIn;
