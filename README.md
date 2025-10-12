# core-js unpatch [![JSR](https://jsr.io/badges/@li/core-js-unpatch)](https://jsr.io/@li/core-js-unpatch)

[`core-js`](https://github.com/zloirock/core-js/) monkey patches `Function.prototype.toString` to make its polyfills appear to be native. This library reverts this behavior for improved debugging and introspection.

Recommended usage is to import _before_ all `core-js` imports:

```js
import '@li/core-js-unpatch'
import 'core-js/actual/array/from.js'
import 'core-js/full/string/code-points.js'

// `Array.from` already available as built-in, so native version is used:
// Logs "function from() { [native code] }"
console.log(Array.from.toString())

// `String.prototype.codePoints` not yet available as built-in, so polyfill is used:
// Logs actual source code of polyfill
console.log(String.prototype.codePoints.toString())
```

Importing _after_ `core-js` imports will still revert the patched behavior, but the restored value of `Function.prototype.toString` will no longer be the actual native version.

Supports all `core-js` versions since 3.22.4. Versions 3.22.3 and below are not currently supported (will not prevent monkey patching).
