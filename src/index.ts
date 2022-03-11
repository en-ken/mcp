import { useRef } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useMCP = <F extends (...args: any[]) => Promise<any>>(f: F) => {
  const isProcessing = useRef(false);

  const multipleClickPreventer = async (
    ...args: Parameters<F>
  ): Promise<ReturnType<F> | void> => {
    if (isProcessing.current) {
      return;
    }
    try {
      isProcessing.current = true;
      await f(...args);
    } finally {
      isProcessing.current = false;
    }
  };
  return multipleClickPreventer;
};
