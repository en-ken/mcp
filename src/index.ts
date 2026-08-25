import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Sentinel returned when a call is prevented.
 * Exists so callers can tell it apart from an `undefined` the handler itself returned.
 */
export const PREVENTED = Symbol('mcp.prevented');

export type Prevented = typeof PREVENTED;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useMCP = <F extends (...args: any[]) => Promise<any>>(f: F) => {
  // Keep the returned function stable across renders while still calling the
  // latest `f` (the "latest ref" pattern). Without this, `React.memo` and
  // dependency arrays on the caller side break on every render.
  const fRef = useRef(f);
  fRef.current = f;

  // The guard must be decided synchronously within the same click, hence a ref.
  // `isProcessing` is a separate state whose only job is to drive the UI.
  const inFlight = useRef(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Updating state after unmount warns on React 17 and earlier.
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const multipleClickPreventer = useCallback(
    async (
      ...args: Parameters<F>
    ): Promise<Awaited<ReturnType<F>> | Prevented> => {
      if (inFlight.current) {
        return PREVENTED;
      }
      try {
        inFlight.current = true;
        setIsProcessing(true);
        return await fRef.current(...args);
      } finally {
        inFlight.current = false;
        if (isMounted.current) {
          setIsProcessing(false);
        }
      }
    },
    []
  );

  return [multipleClickPreventer, isProcessing] as const;
};
