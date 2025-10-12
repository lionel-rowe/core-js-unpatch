// @ts-check
/* @ts-self-types="./unpatch.d.ts" */
'use strict'

/** @typedef {import('./types.ts').Shared} Shared */
/** @typedef {import('./types.ts').Version} Version */

const CORE_JS_SHARED = '__core-js_shared__'
/** @type {typeof globalThis & { [CORE_JS_SHARED]?: Shared }} */
const global = globalThis
const MIN_SUPPORTED_VERSION = '3.22.4'

let descriptor = /** @type {PropertyDescriptor} */ (Object.getOwnPropertyDescriptor(Function.prototype, 'toString'))

class TrappedArray extends Array {
	/**
	 * @override
	 * @param {Version[]} items
	 * @returns {number}
	 */
	push(...items) {
		if (items[0] == null) return super.push(...items)

		const { version, mode } = items[0]

		if (mode === 'global') {
			if (semverCompare(version, MIN_SUPPORTED_VERSION) < 0) {
				// deno-lint-ignore no-console
				console.warn(
					`Cannot prevent monkey patching of Function.prototype.toString for core-js version ${version} (minimum supported version is ${MIN_SUPPORTED_VERSION})`,
				)
				return super.push(...items)
			}

			restoreOrSetupTrap()
		}

		return super.push(...items)
	}
}

if (Array.isArray(global[CORE_JS_SHARED]?.versions) && typeof global[CORE_JS_SHARED]?.inspectSource === 'function') {
	// deno-lint-ignore no-console
	console.warn('Already patched; re-patching with `inspectSource`')
	const { inspectSource } = global[CORE_JS_SHARED]
	descriptor = {
		...descriptor,
		value: function toString() {
			return inspectSource(this)
		},
	}

	restoreDescriptor()
	Object.setPrototypeOf(global[CORE_JS_SHARED].versions, TrappedArray.prototype)
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
	const descriptor = Object.getOwnPropertyDescriptor(obj, key)

	Object.defineProperty(obj, key, {
		get() {
			Object.defineProperty(obj, key, { ...descriptor, value })
			cb?.()
			return value
		},
		set(newValue) {
			cb?.()
			Object.defineProperty(obj, key, { ...descriptor, value: value ?? newValue })
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
		get() {
			return descriptor.value
		},
		set() {
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
	const pa = a.split('.').map(Number)
	const pb = b.split('.').map(Number)
	for (let i = 0; i < 3; i++) {
		const diff = (pa[i] ?? 0) - (pb[i] ?? 0)
		if (diff) return diff
	}
	return 0
}
