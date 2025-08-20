import React, { useEffect } from "react";
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";
import { isAuthenticated, AuthCookies, baseUrl } from "@/helper/auth";

const withAuth = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
  return (props: P) => {
    const [cookies] = useCookies(["Admin", "TechAdmin", "hasPopupBeenShown"]);
    const navigate = useNavigate();

    useEffect(() => {
      const authCookies: AuthCookies = {
        Admin: cookies.Admin,
        TechAdmin: cookies.TechAdmin,
        hasPopupBeenShown: cookies.hasPopupBeenShown,
      };

      if (!isAuthenticated(authCookies)) {
        navigate("/sign-in", { replace: true });
      }
    }, [cookies.Admin, cookies.TechAdmin, cookies.hasPopupBeenShown, navigate]);

    const authCookies: AuthCookies = {
      Admin: cookies.Admin,
      TechAdmin: cookies.TechAdmin,
      hasPopupBeenShown: cookies.hasPopupBeenShown,
    };

    if (!isAuthenticated(authCookies)) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
};

export default withAuth;
