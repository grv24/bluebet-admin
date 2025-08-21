import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useCookies } from "react-cookie";
import {
  isAuthenticated,
  getDecodedTokenData,
  getUserType,
  AuthCookies,
} from "@/helper/auth";
import socketService, { ForceLogoutData } from "@/utils/socketService";
import { Loader } from "@/components";
import toast from "react-hot-toast";

/**
 * Props interface for ProtectedRoute component
 * Defines the properties required for route protection
 */
interface ProtectedRouteProps {
  children: React.ReactNode; // Child components to render if authenticated
}

/**
 * ProtectedRoute Component
 * 
 * Higher-Order Component (HOC) that protects routes requiring authentication.
 * Features include:
 * - Authentication verification using JWT tokens
 * - Automatic socket connection for authenticated users
 * - Force logout handling for security
 * - Loading state management
 * - Redirect to login for unauthenticated users
 * 
 * @param children - Child components to render if authenticated
 * @returns JSX element with authentication protection
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const [cookies] = useCookies(["Admin", "TechAdmin", "hasPopupBeenShown"]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticatedState, setIsAuthenticatedState] = useState(false);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const authCookies: AuthCookies = {
          Admin: cookies.Admin,
          TechAdmin: cookies.TechAdmin,
          hasPopupBeenShown: cookies.hasPopupBeenShown,
        };

        const authenticated = isAuthenticated(authCookies);
        setIsAuthenticatedState(authenticated);

        if (authenticated) {
          // Get user details for socket connection
          const decodedToken = getDecodedTokenData(authCookies);
          const userType = getUserType();

          if (decodedToken?.user?.PersonalDetails?.loginId) {
            const status = socketService.getConnectionStatus();
            if (!status.isConnected && !status.isConnecting) {
              try {
                await socketService.connect(decodedToken.user.PersonalDetails.loginId, userType);
                // console.log("🔌 Socket connected in ProtectedRoute");
              } catch (socketError) {
                // console.error("🔌 Socket connection failed in ProtectedRoute:", socketError);
                // Continue without socket connection
              }
            }
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error("❌ Authentication check failed:", error);
        setIsAuthenticatedState(false);
        setIsLoading(false);
      }
    };

    checkAuthentication();
  }, [cookies.Admin, cookies.TechAdmin, cookies.hasPopupBeenShown]);

  // Setup force logout handler
  useEffect(() => {
    const handleForceLogout = (data: ForceLogoutData) => {
      console.log("🚨 Force logout in ProtectedRoute:", data);
      toast.error(`Session terminated: ${data.reason}`, { duration: 5000 });
      setIsAuthenticatedState(false);
    };

    socketService.onForceLogout(handleForceLogout);

    return () => {
      socketService.onForceLogout(() => {});
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[var(--bg-primary)] to-[var(--bg-secondary)]">
        <Loader />
      </div>
    );
  }

  if (!isAuthenticatedState) {
    // Redirect to login with return URL
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
