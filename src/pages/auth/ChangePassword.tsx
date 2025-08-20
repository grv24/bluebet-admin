import React, { useState } from "react";
import { FaUser, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useCookies } from "react-cookie";
import { Navigate, useNavigate } from "react-router-dom";
import useChangePasswordMutation from "../../hooks/useChangePasswordMutation";

interface ChangePasswordFormInputs {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ChangePassword = () => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [cookies] = useCookies(["token"]);
  const navigate = useNavigate();

  const { mutate: changePassword, isPending } = useChangePasswordMutation();

  if (!cookies.token) {
    return <Navigate to="/sign-in" />;
  }

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ChangePasswordFormInputs>();

  const newPassword = watch("newPassword");

  const toggleCurrentPasswordVisibility = () => {
    setShowCurrentPassword(!showCurrentPassword);
  };

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const onSubmit = async (data: ChangePasswordFormInputs) => {
    if (
      !data.currentPassword?.trim() ||
      !data.newPassword?.trim() ||
      !data.confirmPassword?.trim()
    ) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (data.newPassword !== data.confirmPassword) {
      toast.error("New password and confirm password do not match.");
      return;
    }

    if (data.currentPassword === data.newPassword) {
      toast.error("New password must be different from current password.");
      return;
    }

    changePassword(
      {
        currentPassword: data.currentPassword.trim(),
        newPassword: data.newPassword.trim(),
        cookies,
      },
      {
        onSuccess: (responseData: any) => {
          if (responseData?.success) {
            toast.success("Password changed successfully!");
            navigate("/transaction-password", {
              state: { transactionPassword: responseData?.transactionPassword },
            });
          } else {
            const errorMessage =
              responseData?.error ||
              responseData?.message ||
              "Password change failed. Please try again.";
            toast.error(errorMessage);
          }
        },
        onError: (error: any) => {
          console.error("🚨 Password Change Error:", error);
          toast.error("Password change failed. Please try again.");
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-b from-[var(--bg-primary)] to-[var(--bg-secondary)] w-full">
      {/* login box */}
      <div className="text-center w-[350px] max-w-[90%] flex flex-col items-center justify-center gap-5 my-8">
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
        <div className=" rounded bg-white shadow-[0_0_5px_#fff] w-full">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="text-[var(--bg-primary)] text-2xl w-full flex items-center text-center justify-center gap-2 my-4">
              <h4 className="">Change Password</h4>
              <i className="fa-solid fa-key"></i>
            </div>

            {/* Current Password */}
            <div className="mb-4 px-4">
              <div className="border border-gray-300 rounded-md flex justify-between w-full relative">
                <input
                  {...register("currentPassword", {
                    required: "*Required",
                  })}
                  type={showCurrentPassword ? "text" : "password"}
                  className="px-4 text-sm font-normal leading-8 text-gray-500 outline-none w-full pr-12"
                  placeholder="Current Password"
                />
                <button
                  type="button"
                  onClick={toggleCurrentPasswordVisibility}
                  className="absolute right-12 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded"
                  aria-label={
                    showCurrentPassword ? "Hide password" : "Show password"
                  }
                >
                  {showCurrentPassword ? (
                    <FaEyeSlash className="w-4 h-4" />
                  ) : (
                    <FaEye className="w-4 h-4" />
                  )}
                </button>
                <div className="bg-gray-300 text-right py-3 px-3 border-l border-gray-300">
                  <FaLock className="w-4 h-4 text-gray-600" />
                </div>
              </div>
              {errors.currentPassword && (
                <p className="error text-sm text-red-500">
                  {errors.currentPassword.message}
                </p>
              )}
            </div>

            {/* New Password */}
            <div className="mb-4 px-4">
              <div className="border border-gray-300 rounded-md flex justify-between w-full relative">
                <input
                  {...register("newPassword", {
                    required: "*Required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                  type={showNewPassword ? "text" : "password"}
                  className="px-4 text-sm font-normal leading-8 text-gray-500 outline-none w-full pr-12"
                  placeholder="New Password"
                />
                <button
                  type="button"
                  onClick={toggleNewPasswordVisibility}
                  className="absolute right-12 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded"
                  aria-label={
                    showNewPassword ? "Hide password" : "Show password"
                  }
                >
                  {showNewPassword ? (
                    <FaEyeSlash className="w-4 h-4" />
                  ) : (
                    <FaEye className="w-4 h-4" />
                  )}
                </button>
                <div className="bg-gray-300 text-right py-3 px-3 border-l border-gray-300">
                  <FaLock className="w-4 h-4 text-gray-600" />
                </div>
              </div>
              {errors.newPassword && (
                <p className="error text-sm text-red-500">
                  {errors.newPassword.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="mb-4 px-4">
              <div className="border border-gray-300 rounded-md flex justify-between w-full relative">
                <input
                  {...register("confirmPassword", {
                    required: "*Required",
                    validate: (value) =>
                      value === newPassword || "Passwords do not match",
                  })}
                  type={showConfirmPassword ? "text" : "password"}
                  className="px-4 text-sm font-normal leading-8 text-gray-500 outline-none w-full pr-12"
                  placeholder="Confirm New Password"
                />
                <button
                  type="button"
                  onClick={toggleConfirmPasswordVisibility}
                  className="absolute right-12 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <FaEyeSlash className="w-4 h-4" />
                  ) : (
                    <FaEye className="w-4 h-4" />
                  )}
                </button>
                <div className="bg-gray-300 text-right py-3 px-3 border-l border-gray-300">
                  <FaLock className="w-4 h-4 text-gray-600" />
                </div>
              </div>
              {errors.confirmPassword && (
                <p className="error text-sm text-red-500">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="mb-4 px-4">
              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-[var(--bg-primary)] cursor-pointer text-white py-2 px-4 rounded-md hover:bg-[var(--bg-primary90)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <span className="float-start">Changing Password...</span>
                    <span className="float-end">
                      <i className="fa-solid fa-spinner fa-spin"></i>
                    </span>
                  </>
                ) : (
                  <>
                    <span className="float-start">Change Password</span>
                    <span className="float-end">
                      <i className="fa-solid fa-key animate-slide-in"></i>
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* bottom of login box */}
            <div className="text-xs mb-4 text-center px-4">
              This site is protected by reCAPTCHA and the Google{" "}
              <span className="text-[var(--bg-primary)] cursor-pointer">
                Privacy Policy{" "}
              </span>
              and{" "}
              <span className="text-[var(--bg-primary)] cursor-pointer">
                Terms of Service
              </span>{" "}
              apply.
            </div>
          </form>
        </div>
        {/* bottom of login box */}
        <div className="fixed bottom-0 w-full  text-white text-md  bg-[var(--bg-primary)] px-4 py-2 flex flex-col md:flex-row items-center justify-between">
          <div className="flex w-full justify-between items-center">
            {/* footer links */}
            <div className="flex w-full flex-wrap text-lg font-bold items-center justify-center gap-4">
              <h3 className="text-nowrap"> Terms and Conditions</h3>
              <h3 className="text-nowrap"> Responsible Gaming</h3>
            </div>
            {/* support detail */}
            <div className="flex w-full flex-wrap text-2xl leading-12 font-extrabold items-center justify-center gap-4">
              <h3 className="text-nowrap">24X7 Support</h3>
            </div>
            {/* social icon */}
            <div className="flex w-full flex-wrap text-md font-bold items-center justify-center gap-4">
              {/* <h3 className="text-nowrap">24X7 Support</h3> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
