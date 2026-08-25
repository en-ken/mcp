# mcp-hook

React hook to prevent multiple clicks. This is effective when calling non-idempotent APIs.

> **Note**
> `MCP` here stands for **M**ultiple **C**lick **P**revention. This package has nothing to do with the Model Context Protocol used by LLM tooling.

## Installation

```sh
npm install mcp-hook
```

## Usage

Wrap an async handler with `useMCP`. It returns a tuple of the wrapped handler and a flag telling whether that handler is currently running. While it is running, further calls are ignored and resolve to `PREVENTED` immediately.

```typescript
import React from 'react';
import { useMCP } from 'mcp-hook';

export const Foo: React.FC = () => {
  // just wrap the async handler.
  const [handleClick, isProcessing] = useMCP(async () => {
    try {
      await doSomethingAsync();
    } catch (e) {
      // Error handling
    }
  });

  return (
    <div>
      <button disabled={isProcessing} onClick={() => handleClick()} />
    </div>
  );
};
```

## Detecting a prevented call

While the wrapped handler is running, further calls are ignored and resolve to the exported `PREVENTED` symbol. Comparing against it is the only reliable way to tell a prevented call from a handler that legitimately returned `undefined`, `0`, or `''`.

```typescript
import { PREVENTED, useMCP } from 'mcp-hook';

const [submit] = useMCP(async () => await postOrder());

const onClick = async () => {
  const result = await submit();
  if (result === PREVENTED) {
    return;
  }
  // `result` is narrowed to the handler's return type here.
  console.log(result);
};
```

## Migrating from 0.1.x

- `useMCP` now returns `[handler, isProcessing]` instead of the handler alone.
- A prevented call resolves to `PREVENTED` instead of `undefined`.

```diff
- const handleClick = useMCP(async () => { ... });
+ const [handleClick] = useMCP(async () => { ... });

- if (result) { ... }
+ if (result !== PREVENTED) { ... }
```

## Usage notes

### Errors are not swallowed

`useMCP` re-throws whatever the wrapped handler throws, so the returned promise rejects. Passing the wrapped handler straight to `onClick` discards that promise, which turns a rejection into an unhandled promise rejection. Either catch inside the handler (as in the example above) or catch at the call site:

```typescript
<button onClick={() => handleClick().catch(handleError)} />
```

### Synthetic events on React 16

The wrapped handler is `async`, so React may have already recycled the synthetic event by the time an `await` resolves. On React 16, call `event.persist()` before the first `await` if you need the event afterwards. React 17 removed event pooling, so this does not apply from 17 onwards.

### ES module only

This package ships only the ES module; it will not work in IE11 or other legacy browsers. If you need a transpiled build, copy `src/index.ts` from the [repository](https://github.com/en-ken/mcp) and transpile it yourself. Note that `src/` is not part of the published npm package.
