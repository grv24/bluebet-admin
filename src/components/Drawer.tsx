import React, { useMemo, useState } from "react";
import { useDrawerMetrics } from "@/components/context/DrawerMetricsContext";

interface DrawerItem {
  label: string;
  value: string | number;
}

interface TopDrawerProps {
  items?: DrawerItem[]; // flat list (will be auto-grouped)
  groups?: DrawerItem[][]; // explicit 3-column grouping
  defaultOpen?: boolean;
}

const Drawer: React.FC<TopDrawerProps> = ({ items, groups, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen);
  const ctx = useDrawerMetrics();

  // Default 3-column groups to match the screenshot layout
  const defaultGroups: DrawerItem[][] = useMemo(
    () => [
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
    ],
    []
  );

  // Normalize into 3 groups: prefer explicit groups, else auto-group items, else defaults
  const groupedMetrics: DrawerItem[][] = useMemo(() => {
    if (groups && groups.length > 0) return groups;
    if (ctx?.groups) return ctx.groups;
    if (items && items.length > 0) {
      const cols: DrawerItem[][] = [[], [], []];
      items.forEach((it, idx) => {
        cols[idx % 3].push(it);
      });
      return cols;
    }
    return defaultGroups;
  }, [groups, items, defaultGroups, ctx?.groups]);

  return (
    <section className="relative z-10 select-none">
      {/* Collapsible container */}
      <div
        className={`overflow-hidden transition-[max-height] duration-500 ease-in-out bg-[var(--bg-secondary)] text-[var(--text-secondary)] ${
          isOpen ? "max-h-[250px]" : "max-h-[40px]"
        }`}
      >
        {/* Control bar with centered toggle */}
        <div className="h-[40px] flex items-center justify-center">
          <button
            type="button"
            aria-label={isOpen ? "Collapse summary" : "Expand summary"}
            aria-expanded={isOpen}
            onClick={() => setIsOpen((s) => !s)}
            className="h-6 w-6 rounded-full flex justify-center items-center border-2 font-semibold border-white/70 text-white shadow cursor-pointer"
          >
            <i className={`fa-solid ${isOpen ? "fa-angle-up" : "fa-angle-down"} text-xs`}></i>
          </button>
        </div>
        <div className={`px-3 ${isOpen ? "py-2" : "py-0"}`}>
          <div
            className={`grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-3 transition-opacity duration-200 ${
              isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            {groupedMetrics.map((col, colIdx) => (
              <div key={`col-${colIdx}`} className="space-y-2">
                {col.map((m) => (
                  <div key={m.label} className="text-xs flex items-center justify-between">
                    <span className="opacity-90 whitespace-nowrap mr-2">{m.label}:</span>
                    <span className={`font-medium ${typeof m.value === "number" && m.value < 0 ? "text-red-300" : "text-white"}`}>
                      {typeof m.value === "number" ? m.value.toLocaleString("en-IN") : m.value}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Drawer;