# mcp-hook

React hook to prevent multiple clicks.

## Installation

```sh
npm install mcp-hook
```

## Usage

```typescript
import React from 'react';
import { useMCP } from 'mcp-hook';

export const Foo: React.FC = () => {
  // just wrap the async handler.
  const handleClick = useMCP(async () => {
    try {
      // Start display loader, etc...
      await doSomethingAsync();
    } catch (e) {
      // Error handling
    } finally {
      // Stop display loader, etc...
    }
  });

  return (
    <div>
      <button onClick={handleClick} />
    </div>
  );
};
```

## Usage notes

This package provides only the ES module; it will not work in IE11 or other browsers. Copy and transpile `src/index.ts` yourself if necessary.
