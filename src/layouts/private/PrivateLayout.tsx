import React from "react";
import Header from "./Header";
import Drawer from "@/components/Drawer";
import { DrawerMetricsProvider } from "@/components/context/DrawerMetricsContext";
import { useLocation } from "react-router-dom";

const PrivateLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isTransactionPassword = location.pathname === "/transaction-password" || location.pathname === "/transaction-password/";

  return (
    <React.Fragment>
      {!isTransactionPassword && <Header />}
      {/* <main className="md:flex md:gap-0.5"> */}
      <main>
        {!isTransactionPassword ? (
          <DrawerMetricsProvider>
            {/* <Drawer /> */}
            {children}
          </DrawerMetricsProvider>
        ) : (
          children
        )}
        {/* <div className="hidden md:block"><Aside /></div> */}
      </main>
      {/* <Footer /> */}
    </React.Fragment>
  );
};

export default PrivateLayout;
