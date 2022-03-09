import { useRef } from 'react';

export const useMCP = <F extends (...args: any[]) => Promise<any>>(f: F) => {
  const isProcessing = useRef(false);

  const multipleClickPreventer = async (
    ...args: Parameters<F>
  ): Promise<ReturnType<F> | undefined> => {
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
