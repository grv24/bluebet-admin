import React, { createContext, useContext, useMemo, useState, ReactNode } from "react";

export interface DrawerItem {
  label: string;
  value: string | number;
}

interface DrawerMetricsContextType {
  groups: DrawerItem[][];
  setGroups: (groups: DrawerItem[][]) => void;
}

const DrawerMetricsContext = createContext<DrawerMetricsContextType | undefined>(undefined);

export const useDrawerMetrics = (): DrawerMetricsContextType => {
  const ctx = useContext(DrawerMetricsContext);
  if (!ctx) {
    throw new Error("useDrawerMetrics must be used within a DrawerMetricsProvider");
  }
  return ctx;
};

export const DrawerMetricsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [groups, setGroups] = useState<DrawerItem[][]>([]);

  const value = useMemo(() => ({ groups, setGroups }), [groups]);

  return (
    <DrawerMetricsContext.Provider value={value}>{children}</DrawerMetricsContext.Provider>
  );
};


