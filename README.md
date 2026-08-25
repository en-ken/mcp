# mcp-hook

React hook to prevent multiple clicks. This is effective when calling non-idempotent APIs.

> **Note**
> `MCP` here stands for **M**ultiple **C**lick **P**revention. This package has nothing to do with the Model Context Protocol used by LLM tooling.

## Installation

```sh
npm install mcp-hook
```

## Usage

Wrap an async handler with `useMCP`. While the wrapped handler is still running, further calls are ignored and resolve to `undefined` immediately.

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
      <button onClick={() => handleClick()} />
    </div>
  );
};
```

## Usage notes

### Errors are not swallowed

`useMCP` re-throws whatever the wrapped handler throws, so the returned promise rejects. Passing the wrapped handler straight to `onClick` discards that promise, which turns a rejection into an unhandled promise rejection. Either catch inside the handler (as in the example above) or catch at the call site:

```typescript
<button onClick={() => handleClick().catch(handleError)} />
```

### `undefined` is ambiguous

A prevented call resolves to `undefined`. If your handler can also return `undefined` — or any falsy value — the call site cannot tell the two cases apart. Return a value that is never falsy, or track the state yourself.

### Synthetic events on React 16

The wrapped handler is `async`, so React may have already recycled the synthetic event by the time an `await` resolves. On React 16, call `event.persist()` before the first `await` if you need the event afterwards. React 17 removed event pooling, so this does not apply from 17 onwards.

### ES module only

This package ships only the ES module; it will not work in IE11 or other legacy browsers. If you need a transpiled build, copy `src/index.ts` from the [repository](https://github.com/en-ken/mcp) and transpile it yourself. Note that `src/` is not part of the published npm package.
