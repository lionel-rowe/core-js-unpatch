import { stub } from '@std/testing/mock'
import { assertEquals } from '@std/assert'

export function stubConsole() {
	const stack = new DisposableStack()
	const keys = ['log', 'debug', 'info', 'warn', 'error'] as const satisfies (keyof typeof console)[]
	const outputs = Object.fromEntries(
		keys.map((k) => [k, [] as unknown[][]] as const),
	) as Record<typeof keys[number], unknown[][]>

	for (const k of Object.keys(outputs) as (keyof typeof outputs)[]) {
		stack.use(stub(console, k, (...args) => outputs[k]!.push(args)))
	}

	return Object.assign(stack, { outputs })
}

export function assertDescriptor() {
	const originalDescriptor = Object.getOwnPropertyDescriptor(Function.prototype, 'toString')!
	return () =>
		assertEquals(
			Object.getOwnPropertyDescriptor(Function.prototype, 'toString'),
			originalDescriptor,
		)
}
