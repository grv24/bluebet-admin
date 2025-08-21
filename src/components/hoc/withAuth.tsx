import React, { useEffect } from "react";
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";
import { isAuthenticated, AuthCookies, debugCookies } from "@/helper/auth";

const withAuth = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
  return (props: P) => {
    const [cookies] = useCookies(["Admin", "TechAdmin", "hasPopupBeenShown", "token"]);
    const navigate = useNavigate();

    useEffect(() => {
      const authCookies: AuthCookies = {
        Admin: cookies.Admin,
        TechAdmin: cookies.TechAdmin,
        hasPopupBeenShown: cookies.hasPopupBeenShown,
      };

      debugCookies(authCookies);

      if (!isAuthenticated(authCookies)) {
        console.log("🚫 User not authenticated, redirecting to sign-in");
        navigate("/sign-in", { replace: true });
      } else {
        console.log("✅ User authenticated, allowing access");
      }
    }, [cookies.Admin, cookies.TechAdmin, cookies.hasPopupBeenShown, navigate]);

    const authCookies: AuthCookies = {
      Admin: cookies.Admin,
      TechAdmin: cookies.TechAdmin,
      hasPopupBeenShown: cookies.hasPopupBeenShown,
    };

    if (!isAuthenticated(authCookies)) {
      console.log("🚫 Rendering null due to authentication failure");
      return null;
    }

    return <WrappedComponent {...props} />;
  };
};

export default withAuth;
