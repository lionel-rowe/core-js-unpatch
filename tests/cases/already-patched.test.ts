import { assertEquals, assertNotEquals } from '@std/assert'
import { CORE_JS_SHARED, global } from '../../src/types.ts'
import { assertDescriptor, stubConsole } from '../test-utils.ts'

Deno.test(import.meta.url.split('/').pop()!.split('.').shift()!, async () => {
	using c = stubConsole()
	const originalDescriptor = Object.getOwnPropertyDescriptor(Function.prototype, 'toString')!

	await import('npm:core-js@3.32.0/modules/esnext.array.from-async.js')
	const patchedDescriptor = Object.getOwnPropertyDescriptor(Function.prototype, 'toString')!
	assertNotEquals(patchedDescriptor, originalDescriptor)

	await import('../../src/unpatch.js')
	assertEquals(c.outputs.warn, [['Already patched; re-patching with `inspectSource`']])

	const repatchedDescriptor = Object.getOwnPropertyDescriptor(Function.prototype, 'toString')!
	assertNotEquals(repatchedDescriptor, originalDescriptor)
	assertNotEquals(repatchedDescriptor, patchedDescriptor)

	const assertReptched = assertDescriptor()

	await import('npm:core-js@3.46.0/modules/esnext.array.from-async.js')
	assertReptched()
	await import('npm:core-js-pure@3.46.0/modules/es.object.group-by.js')
	assertReptched()
	await import('npm:core-js-pure@3.46.0/full/string/dedent.js')
	assertReptched()
	await import('npm:core-js@3.32.0/full/string/dedent.js')
	assertReptched()

	assertEquals(
		global[CORE_JS_SHARED]?.versions?.constructor.name,
		'TrappedArray',
	)

	assertEquals(
		Array.from(global[CORE_JS_SHARED]?.versions ?? [], (v) => v.mode),
		['global', 'global', 'pure'],
	)

	assertEquals(
		Array.from(global[CORE_JS_SHARED]?.versions ?? [], (v) => v.version),
		['3.32.0', '3.46.0', '3.46.0'],
	)
})
