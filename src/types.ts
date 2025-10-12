export const CORE_JS_SHARED = '__core-js_shared__'
export type Version = { version: string; mode: 'global' | 'pure' }
export type Shared = { versions?: Version[]; inspectSource?: (str: unknown) => string }
export const global = globalThis as { [CORE_JS_SHARED]?: Shared }
