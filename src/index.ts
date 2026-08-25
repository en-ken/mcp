import { useCallback, useRef } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useMCP = <F extends (...args: any[]) => Promise<any>>(f: F) => {
  // 返す関数の参照をレンダ間で固定しつつ、実行時には常に最新の f を呼びたいので
  // f 自体は ref 経由で参照する（いわゆる latest ref パターン）。
  // これをしないと呼び出し側で React.memo や useEffect の依存配列が毎レンダ壊れる。
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
