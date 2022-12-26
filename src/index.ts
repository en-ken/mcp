import { useRef } from 'react';

// extract await response type of Promise
type AwaitType<T extends Promise<any>> = T extends Promise<infer R> ? R : never;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useMCP = <F extends (...args: any[]) => Promise<any>>(f: F) => {
  const isProcessing = useRef(false);

  const multipleClickPreventer = async (
    ...args: Parameters<F>
  ): Promise<AwaitType<ReturnType<F>> | undefined> => {
    if (isProcessing.current) {
      return;
    }
    try {
      isProcessing.current = true;
      return await f(...args);
    } finally {
      isProcessing.current = false;
    }
  };
  return multipleClickPreventer;
};
