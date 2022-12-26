import { fireEvent, render, screen } from '@testing-library/react';
import React, { useState } from 'react';
import { useMCP } from './index';

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

const sleepAsync = (msec: number) => {
  return new Promise((resolve) => setTimeout(resolve, msec));
};

test('useMCP is called only once after 100 multiple clicks.', () => {
  let count = 0;

  const Test: React.FC = () => {
    const handleClick = useMCP(async (sleepTimeMsec: number) => {
      count++;
      await sleepAsync(sleepTimeMsec);
    });

    return (
      <div>
        <button data-testid="target" onClick={() => handleClick(1000)} />
      </div>
    );
  };

  render(<Test />);

  [...Array(100)].map(async () => {
    fireEvent.click(screen.getByTestId('target'));
  });
  expect(count).toEqual(1);
});
