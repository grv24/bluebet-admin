import React, { useState, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";

/**
 * TooltipPortal
 * - Renders content to document.body so it won't be clipped by overflow.
 * - Positions itself above the target element.
 *
 * Usage: <TooltipPortal targetRef={btnRef} open={open}>tooltip content</TooltipPortal>
 */
export default function TooltipPortal({
  targetRef,
  open,
  children,
  offset = 8,
}: {
  targetRef: React.RefObject<HTMLElement | null> | React.RefObject<HTMLButtonElement | null>;
  open: boolean;
  children: React.ReactNode;
  offset?: number;
}) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const [, setTick] = useState(0);

  // Create an element on first render and append to body
  useLayoutEffect(() => {
    const el = document.createElement("div");
    el.style.position = "absolute";
    el.style.top = "0";
    el.style.left = "0";
    el.style.pointerEvents = "none";
    document.body.appendChild(el);
    elRef.current = el;
    setTick((t) => t + 1);
    return () => {
      if (elRef.current) document.body.removeChild(elRef.current);
    };
  }, []);

  // Position tooltip on layout (sync)
  useLayoutEffect(() => {
    const el = elRef.current;
    const target = targetRef?.current;
    if (!el || !target || !open) return;

    const rect = target.getBoundingClientRect();

    // compute center aligned above button
    const tooltip = el.querySelector("[data-tooltip]");
    if (!tooltip) return;

    const tooltipRect = tooltip.getBoundingClientRect();

    // prefer above, fallback below
    let top = rect.top - tooltipRect.height - offset;
    let left = rect.left + rect.width / 2 - tooltipRect.width / 2;

    // keep within viewport horizontally
    left = Math.max(8, Math.min(left, window.innerWidth - tooltipRect.width - 8));

    // if not enough space above, place below
    if (top < 8) top = rect.bottom + offset;

    el.style.top = `${top + window.scrollY}px`;
    el.style.left = `${left + window.scrollX}px`;
    el.style.zIndex = "99999";

    // allow pointer events if you want clickable tooltips: pointerEvents = 'auto'
    el.style.pointerEvents = "none";
  }, [targetRef, open, offset]);

  if (!elRef.current) return null;

  return createPortal(
    open ? (
      <div data-tooltip className="inline-block pointer-events-none">
        <div
          className="px-3 py-2 bg-gray-900 text-white text-xs rounded-lg max-w-xs break-words"
          style={{ boxShadow: "0 6px 20px rgba(0,0,0,0.15)" }}
        >
          {children}
        </div>
      </div>
    ) : null,
    elRef.current
  );
}

