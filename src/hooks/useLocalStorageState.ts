"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * SSR-safe React binding over a `lib/storage/storage.ts` read function.
 * Initial render matches the server (defaultValue) to avoid a hydration
 * mismatch; the real stored value is read client-side on mount. Call
 * `refresh()` after any storage.ts setter to sync the component's view.
 */
export function useLocalStorageState<T>(read: () => T, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(() => {
    setValue(read());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Deliberate: this is the standard hydration-safe pattern for reading
    // localStorage after mount (server and first client render both use
    // `defaultValue`, avoiding a hydration mismatch).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { value, refresh, hydrated };
}
