// frontend/src/hooks/useLocalStorageJson.ts
import * as React from "react";

/**
 * Minimal localStorage-backed state.
 * - Safe JSON parse
 * - Writes on every state change
 *
 * Intentionally tiny: Axis Inbox v1 should not pull in extra deps.
 */
export function useLocalStorageJson<T>(key: string, initialValue: T) {
  const [value, setValue] = React.useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return initialValue;
      return JSON.parse(raw) as T;
    } catch {
      return initialValue;
    }
  });

  React.useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore quota / serialization errors. Inbox is a convenience, not critical storage.
    }
  }, [key, value]);

  return [value, setValue] as const;
}
