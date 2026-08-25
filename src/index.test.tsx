import { act, fireEvent, render, screen } from '@testing-library/react';
import React, { useState } from 'react';
import { useMCP } from './index';

// Creates a promise whose settlement is driven by the test.
// Relying on setTimeout would leave a pending timer after the test ends.
const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe('useMCP passes the event', () => {
  test('with NO arguments', () => {
    let actual = '';

    const Test: React.FC = () => {
      const handleClick = useMCP(async () => {
        actual = 'foo';
      });

      return (
        <div>
          <button data-testid="target" onClick={() => handleClick()} />
        </div>
      );
    };

    render(<Test />);
    fireEvent.click(screen.getByTestId('target'));
    expect(actual).toEqual('foo');
  });

  test('with 1 argument', () => {
    let actual = '';

    const Test: React.FC = () => {
      const handleClick = useMCP(async (value: string) => {
        actual = value;
      });

      return (
        <div>
          <button data-testid="target" onClick={() => handleClick('foo')} />
        </div>
      );
    };

    render(<Test />);
    fireEvent.click(screen.getByTestId('target'));
    expect(actual).toEqual('foo');
  });

  test('with 2 arguments', () => {
    let actual = ['', {}];

    const Test: React.FC = () => {
      const handleClick = useMCP(
        async (value1: string, value2: Record<string, boolean>) => {
          actual = [value1, value2];
        }
      );

      return (
        <div>
          <button
            data-testid="target"
            onClick={() => handleClick('foo', { bar: true })}
          />
        </div>
      );
    };

    render(<Test />);
    fireEvent.click(screen.getByTestId('target'));
    expect(actual).toEqual(['foo', { bar: true }]);
  });

  test('with a return value', async () => {
    const Test: React.FC = () => {
      const [target, setTarget] = useState('');

      const handleClick = useMCP(async () => {
        return 'foo';
      });

      return (
        <div>
          <button
            data-testid="target"
            onClick={async () => {
              const ret = await handleClick();
              ret && setTarget(ret);
            }}
          />
          <div id="target">{target}</div>
        </div>
      );
    };

    render(<Test />);
    fireEvent.click(screen.getByTestId('target'));
    await screen.findByText('foo');
  });
});

describe('useMCP prevents duplicated execution', () => {
  test('runs the handler only once for 100 consecutive clicks', async () => {
    let count = 0;
    const deferred = createDeferred<void>();

    const Test: React.FC = () => {
      const handleClick = useMCP(async () => {
        count++;
        await deferred.promise;
      });

      return (
        <div>
          <button data-testid="target" onClick={() => handleClick()} />
        </div>
      );
    };

    render(<Test />);
    const target = screen.getByTestId('target');
    for (let i = 0; i < 100; i++) {
      fireEvent.click(target);
    }

    expect(count).toEqual(1);

    // Settle the pending promise so the test does not leave one behind
    await act(async () => {
      deferred.resolve();
    });
  });

  test('releases the guard after the handler resolves', async () => {
    let count = 0;
    let deferred = createDeferred<void>();

    const Test: React.FC = () => {
      const handleClick = useMCP(async () => {
        count++;
        await deferred.promise;
      });

      return (
        <div>
          <button data-testid="target" onClick={() => handleClick()} />
        </div>
      );
    };

    render(<Test />);
    const target = screen.getByTestId('target');

    fireEvent.click(target);
    fireEvent.click(target);
    expect(count).toEqual(1);

    await act(async () => {
      deferred.resolve();
    });

    deferred = createDeferred<void>();
    fireEvent.click(target);
    expect(count).toEqual(2);

    await act(async () => {
      deferred.resolve();
    });
  });

  test('releases the guard even when the handler rejects', async () => {
    let count = 0;
    let deferred = createDeferred<void>();

    const Test: React.FC = () => {
      const handleClick = useMCP(async () => {
        count++;
        await deferred.promise;
      });

      return (
        <div>
          <button
            data-testid="target"
            // Note: without catching here this becomes an unhandled rejection
            onClick={() => handleClick().catch(() => undefined)}
          />
        </div>
      );
    };

    render(<Test />);
    const target = screen.getByTestId('target');

    fireEvent.click(target);
    await act(async () => {
      deferred.reject(new Error('failed'));
    });

    deferred = createDeferred<void>();
    fireEvent.click(target);
    expect(count).toEqual(2);

    await act(async () => {
      deferred.resolve();
    });
  });

  test('resolves with undefined when the call is prevented', async () => {
    const returned: Record<number, unknown> = {};
    let clicks = 0;
    const deferred = createDeferred<void>();

    const Test: React.FC = () => {
      const handleClick = useMCP(async () => {
        await deferred.promise;
        return 'foo';
      });

      return (
        <div>
          <button
            data-testid="target"
            onClick={async () => {
              const nth = ++clicks;
              returned[nth] = await handleClick();
            }}
          />
        </div>
      );
    };

    render(<Test />);
    const target = screen.getByTestId('target');
    fireEvent.click(target);
    fireEvent.click(target);

    await act(async () => {
      deferred.resolve();
    });

    expect(returned).toEqual({ 1: 'foo', 2: undefined });
  });
});

describe('useMCP returns a stable callback', () => {
  test('keeps the same reference across re-renders', () => {
    const handlers: unknown[] = [];

    const Test: React.FC<{ value: number }> = ({ value }) => {
      // Pass a fresh function literal on every render, as real usage does
      const handleClick = useMCP(async () => value);
      handlers.push(handleClick);
      return null;
    };

    const { rerender } = render(<Test value={1} />);
    rerender(<Test value={2} />);

    expect(handlers).toHaveLength(2);
    expect(handlers[0]).toBe(handlers[1]);
  });

  test('calls the latest handler after a re-render', async () => {
    const called: number[] = [];

    const Test: React.FC<{ value: number }> = ({ value }) => {
      const handleClick = useMCP(async () => {
        called.push(value);
      });

      return (
        <div>
          <button data-testid="target" onClick={() => handleClick()} />
        </div>
      );
    };

    const { rerender } = render(<Test value={1} />);
    rerender(<Test value={2} />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('target'));
    });

    expect(called).toEqual([2]);
  });
});
