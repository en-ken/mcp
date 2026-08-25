import { useCallback, useRef } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useMCP = <F extends (...args: any[]) => Promise<any>>(f: F) => {
  // Keep the returned function stable across renders while still calling the
  // latest `f` (the "latest ref" pattern). Without this, `React.memo` and
  // dependency arrays on the caller side break on every render.
  const fRef = useRef(f);
  fRef.current = f;

  const isProcessing = useRef(false);

  const multipleClickPreventer = useCallback(
    async (
      ...args: Parameters<F>
    ): Promise<Awaited<ReturnType<F>> | undefined> => {
      if (isProcessing.current) {
        return;
      }
      try {
        isProcessing.current = true;
        return await fRef.current(...args);
      } finally {
        isProcessing.current = false;
      }
    },
    []
  );

  return multipleClickPreventer;
};
