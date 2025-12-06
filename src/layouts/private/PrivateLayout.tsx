import React, { useMemo } from "react";
import { useCookies } from "react-cookie";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import Header from "./Header";
import Drawer from "@/components/Drawer";
import { DrawerMetricsProvider } from "@/components/context/DrawerMetricsContext";
import { SocketProvider } from "@/context/SocketContext";
import { getDecodedTokenData, getUserType, logout, AuthCookies } from "@/helper/auth";

const PrivateLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [cookies, , removeCookie] = useCookies(["Admin", "TechAdmin", "token", "hasPopupBeenShown"]);
  const isTransactionPassword = location.pathname === "/transaction-password" || location.pathname === "/transaction-password/";
  const isClient = location.pathname === "/clients";

  // Extract user ID and type from cookies for SocketProvider
  const decodedToken = useMemo(() => {
    const authCookies: AuthCookies = {
      Admin: cookies.Admin,
      TechAdmin: cookies.TechAdmin,
      hasPopupBeenShown: cookies.hasPopupBeenShown,
    };
    return getDecodedTokenData(authCookies);
  }, [cookies.Admin, cookies.TechAdmin, cookies.hasPopupBeenShown]);

  const userId = useMemo(() => {
    const id = decodedToken?.user?.PersonalDetails?.loginId || 
               decodedToken?.user?.userId || 
               decodedToken?.user?.loginId ||
               "";
    console.log("🔌 PrivateLayout - User ID extraction:", {
      hasDecodedToken: !!decodedToken,
      personalDetailsLoginId: decodedToken?.user?.PersonalDetails?.loginId,
      userId: decodedToken?.user?.userId,
      loginId: decodedToken?.user?.loginId,
      extractedUserId: id,
    });
    return id;
  }, [decodedToken]);

  const userType = useMemo(() => {
    return getUserType();
  }, []);

  // Only render SocketProvider if we have a valid userId
  if (!userId) {
    console.warn("🔌 PrivateLayout - No userId available, rendering without SocketProvider");
    return (
      <React.Fragment>
        {!isTransactionPassword && <Header />}
        <main>
          {isClient ? (
            <DrawerMetricsProvider>
              <Drawer />
              {children}
            </DrawerMetricsProvider>
          ) : (
            children
          )}
        </main>
      </React.Fragment>
    );
  }

  // Handle force logout callback
  const handleLeaveOldSignIn = useMemo(() => {
    return () => {
      console.log("🚨 Force logout triggered in PrivateLayout");
      logout(removeCookie as any, () => {
        navigate("/sign-in");
      });
    };
  }, [removeCookie, navigate]);

  // Handle balance update callback
  const handleBalanceUpdate = useMemo(() => {
    return (balance: number) => {
      // Balance updates are handled by Header component
      // This is just a placeholder callback
    };
  }, []);

  // Handle exposure update callback
  const handleExposureUpdate = useMemo(() => {
    return (exposure: number) => {
      // Exposure updates are handled by Header component
      // This is just a placeholder callback
    };
  }, []);

  return (
    <SocketProvider
      userId={userId}
      userType={userType}
      onLeaveOldSignIn={handleLeaveOldSignIn}
      onBalanceUpdate={handleBalanceUpdate}
      onExposureUpdate={handleExposureUpdate}
    >
      <React.Fragment>
        {!isTransactionPassword && <Header />}
        {/* <main className="md:flex md:gap-0.5"> */}
        <main>
          {isClient ? (
            <DrawerMetricsProvider>
              <Drawer />
              {children}
            </DrawerMetricsProvider>
          ) : (
            children
          )}
          {/* <div className="hidden md:block"><Aside /></div> */}
        </main>
        {/* <Footer /> */}
      </React.Fragment>
    </SocketProvider>
  );
};

export default PrivateLayout;
