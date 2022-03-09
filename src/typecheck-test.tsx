// File for typecheck.
import React from 'react';
import { useMCP } from './index';

type Unit = 'msec' | 'sec' | 'min';

const callApiMock = async (time = 3000, unit: Unit = 'msec') => {
  let sleepTime = time;
  switch (unit) {
    case 'msec':
      break;
    case 'sec':
      sleepTime *= 1000;
      break;
    case 'min':
      sleepTime *= 1000 * 60;
      break;
  }
  await new Promise((resolve) => setTimeout(resolve, sleepTime));
};

export const TestComponent: React.FC = () => {
  const handleClick0 = useMCP(async () => {
    await callApiMock();
  });
  const handleClick1 = useMCP(async (timeSec: number) => {
    await callApiMock(timeSec);
  });
  const handleClick2 = useMCP(async (time: number, unit: Unit) => {
    await callApiMock(time, unit);
  });

  return (
    <>
      <button
        onClick={() => {
          handleClick0();
        }}
      />
      <button
        onClick={() => {
          handleClick1(2000);
        }}
      />
      <button
        onClick={() => {
          handleClick2(10, 'sec');
        }}
      />
    </>
  );
};
