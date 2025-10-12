# core-js unpatch

Prevents monkey patching of `Function.prototype.toString` by core-js.

Recommended usage is to import _before_ all `core-js` imports:

```ts
import '@li/core-js-unpatch'
import 'core-js/actual/array/from-async.js'
import 'core-js/full/string/dedent.js'
```

Importing _after_ `core-js` imports will still revert the patched behavior, but the restored value of `Function.prototype.toString` will no longer be the actual native version.

Supports all `core-js` versions since 3.22.4. Versions 3.22.3 and below are not currently supported (will not prevent monkey patching).
