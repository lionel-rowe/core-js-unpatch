// @ts-check
// deno-lint-ignore-file no-var no-this-alias
/* @ts-self-types="./unpatch.d.ts" */
'use strict'

/** @typedef {import('./types.ts').Shared} Shared */
/** @typedef {import('./types.ts').Version} Version */

void (function () {
	var CORE_JS_SHARED = /** @type {const} */ ('__core-js_shared__')
	/** @type {typeof globalThis & { [CORE_JS_SHARED]?: Shared }} */
	var global = globalThis
	var MIN_SUPPORTED_VERSION = '3.22.4'

	var descriptor = /** @type {PropertyDescriptor} */ (Object.getOwnPropertyDescriptor(Function.prototype, 'toString'))

	function TrappedArray() {}

	/** @override */
	TrappedArray.prototype.push = function push() {
		/** @type {Version[]} */
		var items = Array.prototype.slice.call(arguments)
		var self = this

		if (items[0] == null) return Array.prototype.push.apply(self, items)

		var version = items[0].version
		var mode = items[0].mode

		if (mode === 'global') {
			if (semverCompare(version, MIN_SUPPORTED_VERSION) < 0) {
				// deno-lint-ignore no-console
				console.warn(
					'Cannot prevent monkey patching of Function.prototype.toString for core-js version ' + version +
						' (minimum supported version is ' + MIN_SUPPORTED_VERSION + ')',
				)
				return Array.prototype.push.apply(self, items)
			}

			restoreOrSetupTrap()
		}

		return Array.prototype.push.apply(self, items)
	}

	Object.setPrototypeOf(TrappedArray.prototype, Array.prototype)
	Object.setPrototypeOf(TrappedArray, Array)

	var shared = global[CORE_JS_SHARED]
	/** @type {((x: unknown) => string)} */
	var inspectSource
	if (shared != null && Array.isArray(shared.versions) && typeof shared.inspectSource === 'function') {
		// deno-lint-ignore no-console
		console.warn('Already patched; re-patching with `inspectSource`')
		inspectSource = shared.inspectSource
		descriptor = merge(
			descriptor,
			{
				value: function toString() {
					return inspectSource(this)
				},
			},
		)

		restoreDescriptor()
		Object.setPrototypeOf(shared.versions, TrappedArray.prototype)
	} else {
		trapAccessorsOnce(global, CORE_JS_SHARED, /** @type {Shared} */ ({ versions: new TrappedArray() }))
	}

	/**
	 * @param {unknown} obj
	 * @param {string} key
	 * @param {unknown} value
	 * @param {() => void} [cb]
	 */
	function trapAccessorsOnce(obj, key, value, cb) {
		var descriptor = Object.getOwnPropertyDescriptor(obj, key)

		Object.defineProperty(obj, key, {
			get: function () {
				Object.defineProperty(obj, key, merge(descriptor, { value: value }))
				if (cb != null) cb()
				return value
			},
			set: function (newValue) {
				if (cb != null) cb()
				Object.defineProperty(obj, key, merge(descriptor, { value: value || newValue }))
			},
			configurable: true,
		})
	}

	function restoreOrSetupTrap() {
		if (isCurrentlyPatched()) restoreDescriptor()
		else setupTrap()
	}

	function setupTrap() {
		Object.defineProperty(Function.prototype, 'toString', {
			get: function () {
				return descriptor.value
			},
			set: function () {
				restoreDescriptor()
			},
			configurable: true,
		})
	}

	function restoreDescriptor() {
		Object.defineProperty(Function.prototype, 'toString', descriptor)
	}

	function isCurrentlyPatched() {
		return Function.prototype.toString !== descriptor.value
	}

	/**
	 * @param {string} a
	 * @param {string} b
	 */
	function semverCompare(a, b) {
		var pa = a.split('.').map(Number)
		var pb = b.split('.').map(Number)
		var i, diff
		for (i = 0; i < 3; i++) {
			diff = (pa[i] || 0) - (pb[i] || 0)
			if (diff) return diff > 0 ? 1 : -1
		}
		return 0
	}

	function merge() {
		/** @type {Record<string, unknown>} */
		var out = {}
		var obj, i, keys, j
		for (i = 0; i < arguments.length; i++) {
			if (arguments[i] == null) continue
			obj = arguments[i]
			keys = Object.keys(obj)
			for (j = 0; j < keys.length; j++) {
				out[keys[j]] = obj[keys[j]]
			}
		}
		return out
	}
})()
