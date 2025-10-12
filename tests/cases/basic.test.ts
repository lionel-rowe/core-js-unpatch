import { assertEquals } from '@std/assert'
import { CORE_JS_SHARED, global } from '../../src/types.ts'
import { assertDescriptor, stubConsole } from '../test-utils.ts'

Deno.test(import.meta.url.split('/').pop()!.split('.').shift()!, async () => {
	using c = stubConsole()
	const assertUnpatched = assertDescriptor()

	await import('../../src/unpatch.js')
	assertUnpatched()

	await import('npm:core-js@3.32.0/modules/esnext.array.from-async.js')
	assertUnpatched()
	await import('npm:core-js@3.46.0/modules/esnext.array.from-async.js')
	assertUnpatched()
	await import('npm:core-js-pure@3.46.0/modules/es.object.group-by.js')
	assertUnpatched()
	await import('npm:core-js-pure@3.46.0/full/string/dedent.js')
	assertUnpatched()
	await import('npm:core-js@3.32.0/full/string/dedent.js')
	assertUnpatched()

	// minimum version with current method
	await import('npm:core-js@3.22.4')
	assertUnpatched()

	assertEquals(c.outputs.warn, [])

	// maximum version with old method
	await import('npm:core-js@3.22.3')
	await import('npm:core-js@3.0.0')

	assertEquals(
		c.outputs.warn,
		[
			'3.22.3',
			'3.0.0',
		].map((v) => [
			`Cannot prevent monkey patching of Function.prototype.toString for core-js version ${v} (minimum supported version is 3.22.4)`,
		]),
	)

	assertEquals(
		global[CORE_JS_SHARED]?.versions?.constructor.name,
		'TrappedArray',
	)

	assertEquals(
		Array.from(global[CORE_JS_SHARED]?.versions ?? [], (v) => v.mode),
		['global', 'global', 'pure', 'global', 'global', 'global'],
	)

	assertEquals(
		Array.from(global[CORE_JS_SHARED]?.versions ?? [], (v) => v.version),
		['3.32.0', '3.46.0', '3.46.0', '3.22.4', '3.22.3', '3.0.0'],
	)
})
