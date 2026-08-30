"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApiError } from "@/lib/api";

type State<T> = {
  data: T | null;
  error: ApiError | Error | null;
  loading: boolean;
  reload: () => void;
};

/**
 * Load something from the API, with the three states every screen needs.
 *
 * Deliberately small. A data fetching library would be a dependency earning
 * its place only if the console needed caching across routes, and it does not:
 * every screen wants the current truth when it opens.
 */
export function useResource<T>(load: () => Promise<T>, deps: unknown[]): State<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  // The loader closes over the caller's dependencies, which is what the rule
  // cannot see through.
  // biome-ignore lint/correctness/useExhaustiveDependencies: deps are supplied by the caller
  const run = useCallback(load, deps);

  // `nonce` is the reload trigger. It is never read in the body, which is
  // exactly why it has to stay in the dependency list.
  // biome-ignore lint/correctness/useExhaustiveDependencies: nonce exists to retrigger
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    run()
      .then((value) => {
        if (!cancelled) {
          setData(value);
          setError(null);
        }
      })
      .catch((caught) => {
        if (!cancelled) setError(caught instanceof Error ? caught : new Error(String(caught)));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [run, nonce]);

  return { data, error, loading, reload };
}
