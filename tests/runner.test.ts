import { assert } from '@std/assert'
import { TextLineStream } from '@std/streams'

Deno.test('unpatch', async (t) => {
	for await (const f of Deno.readDir(new URL(import.meta.resolve('./cases')))) {
		await t.step(f.name, async () => {
			const process = new Deno.Command(Deno.execPath(), {
				args: ['test', new URL(`./cases/${f.name}`, import.meta.url).pathname],
				stdout: 'piped',
				stderr: 'piped',
			}).spawn()

			const finishedWriting = Promise.all((['stdout', 'stderr'] as const).map((k) =>
				process[k]
					.pipeThrough(new TextDecoderStream())
					.pipeThrough(new TextLineStream())
					.pipeThrough(
						new TransformStream({
							transform(line, controller) {
								controller.enqueue(`... ${line}\n`)
							},
						}),
					)
					.pipeThrough(new TextEncoderStream())
					.pipeTo(Deno[k].writable, { preventClose: true })
			))

			const [result] = await Promise.all([process.status, finishedWriting])
			assert(result.success, `case ${f.name} failed with code ${result.code}`)
		})
	}
})
