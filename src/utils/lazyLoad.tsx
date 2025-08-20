import React, { lazy } from "react";

/**
 * Wraps React.lazy with error handling.
 * You can extend this to include custom Error Boundaries.
 */
export function lazyWithErrorHandling<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return lazy(importFunc);
}
