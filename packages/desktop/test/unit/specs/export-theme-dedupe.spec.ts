import { describe, it, expect, vi } from 'vitest'

// A custom export theme in `<userData>/themes/export` whose CSS matches a
// built-in theme (e.g. a hand-installed `lato-print.theme.css` from before the
// theme was built in) is a duplicate: the export dialog hides it and moves a
// saved choice of it to the built-in value. `?inline` CSS is empty under
// vitest, so the built-in theme sources are mocked with known content here.

vi.hoisted(() => {
  const w = globalThis as unknown as {
    window?: { path?: { sep: string, join: (...parts: string[]) => string } }
  }
  w.window ??= {}
  w.window.path ??= { sep: '/', join: (...parts: string[]) => parts.join('/') }
})

vi.mock('@/assets/themes/export/academic.theme.css?inline', () => ({ default: '/** Academic **/\n.markdown-body { font-family: serif; }\n' }))
vi.mock('@/assets/themes/export/lato-print.theme.css?inline', () => ({ default: '/** Lato Print **/\n.markdown-body { font-family: Lato; }\n' }))
vi.mock('@/assets/themes/export/liber.theme.css?inline', () => ({ default: '/** Liber **/\n.markdown-body { font-family: Liber; }\n' }))

describe('findBuiltInThemeByCss', () => {
  it('maps a copy of a built-in theme to its option value', async() => {
    const { findBuiltInThemeByCss } = await import('@/util/pdf')
    expect(findBuiltInThemeByCss('/** Lato Print **/\n.markdown-body { font-family: Lato; }\n')).toBe('lato-print')
    expect(findBuiltInThemeByCss('/** Liber **/\n.markdown-body { font-family: Liber; }\n')).toBe('liber')
  })

  it('ignores line-ending and surrounding whitespace differences', async() => {
    const { findBuiltInThemeByCss } = await import('@/util/pdf')
    expect(findBuiltInThemeByCss('\n/** Lato Print **/\r\n.markdown-body { font-family: Lato; }\r\n\r\n')).toBe('lato-print')
  })

  it('keeps a modified or unrelated custom theme', async() => {
    const { findBuiltInThemeByCss } = await import('@/util/pdf')
    expect(findBuiltInThemeByCss('/** Lato Print **/\n.markdown-body { font-family: Lato; color: red; }\n')).toBeUndefined()
    expect(findBuiltInThemeByCss('/** Mine **/\nbody { margin: 0; }')).toBeUndefined()
  })

  it('never treats an empty file as a built-in theme', async() => {
    const { findBuiltInThemeByCss } = await import('@/util/pdf')
    expect(findBuiltInThemeByCss('')).toBeUndefined()
    expect(findBuiltInThemeByCss('  \n ')).toBeUndefined()
  })
})
