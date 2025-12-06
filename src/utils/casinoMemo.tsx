import React from "react";

/**
 * 🚀 PERFORMANCE: Reusable memoization helper for casino game components
 * 
 * Provides deep comparison for casinoData and other complex props
 * to prevent unnecessary re-renders when only references change
 */

interface CasinoComponentProps {
  casinoData?: any;
  remainingTime?: number;
  onBetClick?: (sid: string, type: "back" | "lay") => void;
  results?: any;
  gameCode?: string;
  gameSlug?: string;
  gameName?: string;
  currentBet?: any;
  [key: string]: any; // Allow additional props
}

/**
 * Deep comparison function for casino game components
 * Compares primitive props shallowly and complex props (casinoData, results, currentBet) deeply
 */
export const casinoComponentComparator = (
  prevProps: CasinoComponentProps,
  nextProps: CasinoComponentProps
): boolean => {
  // Shallow compare primitive props
  if (
    prevProps.remainingTime !== nextProps.remainingTime ||
    prevProps.gameCode !== nextProps.gameCode ||
    prevProps.gameSlug !== nextProps.gameSlug ||
    prevProps.gameName !== nextProps.gameName ||
    prevProps.onBetClick !== nextProps.onBetClick
  ) {
    return false; // Props changed, should re-render
  }

  // Deep compare casinoData (main prop that changes frequently)
  if (prevProps.casinoData !== nextProps.casinoData) {
    try {
      const prevData = JSON.stringify(prevProps.casinoData);
      const nextData = JSON.stringify(nextProps.casinoData);
      if (prevData !== nextData) {
        return false; // Data changed, should re-render
      }
    } catch (error) {
      // If JSON.stringify fails (circular refs), fall back to reference comparison
      return false;
    }
  }

  // Deep compare results array
  if (prevProps.results !== nextProps.results) {
    try {
      const prevResults = JSON.stringify(prevProps.results);
      const nextResults = JSON.stringify(nextProps.results);
      if (prevResults !== nextResults) {
        return false; // Results changed, should re-render
      }
    } catch (error) {
      return false;
    }
  }

  // Deep compare currentBet
  if (prevProps.currentBet !== nextProps.currentBet) {
    try {
      const prevBet = JSON.stringify(prevProps.currentBet);
      const nextBet = JSON.stringify(nextProps.currentBet);
      if (prevBet !== nextBet) {
        return false; // Current bet changed, should re-render
      }
    } catch (error) {
      return false;
    }
  }

  // All props are equal, skip re-render
  return true;
};

/**
 * Memoize a casino game component with deep comparison
 * 
 * @param Component - The component to memoize
 * @param customComparator - Optional custom comparison function (defaults to casinoComponentComparator)
 * @returns Memoized component
 */
export const memoizeCasinoComponent = <P extends CasinoComponentProps>(
  Component: React.ComponentType<P>,
  customComparator?: (prevProps: P, nextProps: P) => boolean
) => {
  return React.memo(Component, customComparator || casinoComponentComparator);
};

