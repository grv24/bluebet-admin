import React, { createContext, useContext, useMemo, useState, ReactNode } from "react";

export interface DrawerItem {
  label: string;
  value: string | number;
}

interface DrawerMetricsContextType {
  groups: DrawerItem[][];
  setGroups: (groups: DrawerItem[][]) => void;
}

const defaultGroups: DrawerItem[][] = [
  [
    { label: "Upper Level Credit Referance", value: 0 },
    { label: "Total Master Balance", value: 0 },
    { label: "Available Balance", value: 0 },
  ],
  [
    { label: "Down level Occupy Balance", value: 0 },
    { label: "Upper Level", value: 0 },
    { label: "Available Balance With Profit/Loss", value: 0 },
  ],
  [
    { label: "Down Level Credit Referance", value: 0 },
    { label: "Down Level Profit/Loss", value: 0 },
    { label: "My Profit/Loss", value: 0 },
  ],
];

const DrawerMetricsContext = createContext<DrawerMetricsContextType | undefined>(undefined);

export const useDrawerMetrics = (): DrawerMetricsContextType => {
  const ctx = useContext(DrawerMetricsContext);
  if (!ctx) {
    throw new Error("useDrawerMetrics must be used within a DrawerMetricsProvider");
  }
  return ctx;
};

export const DrawerMetricsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [groups, setGroups] = useState<DrawerItem[][]>(defaultGroups);

  const value = useMemo(() => ({ groups, setGroups }), [groups]);

  return (
    <DrawerMetricsContext.Provider value={value}>{children}</DrawerMetricsContext.Provider>
  );
};


