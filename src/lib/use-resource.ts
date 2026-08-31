"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiError } from "@/lib/api";

type State<T> = {
  data: T | null;
  error: ApiError | Error | null;
  /** No data yet. The screen has nothing to show and a skeleton is right. */
  loading: boolean;
  /** A fetch is in flight over data already on screen. Do not tear it down. */
  refreshing: boolean;
  /** Refetch, keeping what is on screen until the answer arrives. */
  reload: () => void;
  /** Change what is on screen now, without waiting for the server. */
  mutate: (update: (current: T) => T) => void;
};

/**
 * Load something from the API, with the states every screen needs.
 *
 * Deliberately small. A data fetching library would be a dependency earning
 * its place only if the console needed caching across routes, and it does not:
 * every screen wants the current truth when it opens.
 *
 * The distinction between `loading` and `refreshing` is the whole point of
 * this file. Treating every refetch as loading meant one click on one row
 * replaced the entire screen with a skeleton and rebuilt it, which reads as a
 * page reload and loses scroll position, focus, and any sense that the click
 * did something specific. A refetch over data already on screen leaves that
 * data where it is until there is something better to put there.
 */
export function useResource<T>(load: () => Promise<T>, deps: unknown[]): State<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nonce, setNonce] = useState(0);

  // Read inside the effect to decide which of the two states this fetch is,
  // without making the effect depend on the data it is about to replace.
  const settled = useRef(false);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  const mutate = useCallback((update: (current: T) => T) => {
    setData((current) => (current === null ? current : update(current)));
  }, []);

  // The loader closes over the caller's dependencies, which is what the rule
  // cannot see through.
  // biome-ignore lint/correctness/useExhaustiveDependencies: deps are supplied by the caller
  const run = useCallback(load, deps);

  // `nonce` is the reload trigger. It is never read in the body, which is
  // exactly why it has to stay in the dependency list.
  // biome-ignore lint/correctness/useExhaustiveDependencies: nonce exists to retrigger
  useEffect(() => {
    let cancelled = false;

    if (settled.current) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    run()
      .then((value) => {
        if (cancelled) return;
        settled.current = true;
        setData(value);
        setError(null);
      })
      .catch((caught) => {
        if (cancelled) return;
        setError(caught instanceof Error ? caught : new Error(String(caught)));
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
        setRefreshing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [run, nonce]);

  return { data, error, loading, refreshing, reload, mutate };
}
