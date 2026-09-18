// node --test src/lib/contrast.test.ts
// Design-token contrast, computed from the OKLCH values in global.css.
// Browser-side harnesses could not read oklch() reliably, and the palette is
// authored here anyway — so this is the source of truth.
import { strict as assert } from 'node:assert'
import { test } from 'node:test'

type RGB = [number, number, number]

/** OKLCH → linear sRGB → gamma sRGB (0-255). */
function oklch(L: number, C: number, hDeg: number): RGB {
  const h = (hDeg * Math.PI) / 180
  const a = C * Math.cos(h)
  const b = C * Math.sin(h)

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b
  const [l, m, s] = [l_ ** 3, m_ ** 3, s_ ** 3]

  const lin = [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
  return lin.map((v) => {
    const g = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055
    return Math.max(0, Math.min(255, Math.round(g * 255)))
  }) as RGB
}

const relLum = ([r, g, b]: RGB) => {
  const f = (c: number) => {
    const x = c / 255
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

export const contrast = (a: RGB, b: RGB) => {
  const [hi, lo] = [relLum(a), relLum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

// the palette, verbatim from global.css
const T = {
  ink: oklch(0.145, 0.008, 62),
  paper: oklch(0.968, 0.006, 84),
  fg: oklch(0.972, 0.004, 84),
  fgMuted: oklch(0.688, 0.008, 70),
  fgFaint: oklch(0.452, 0.008, 70),
  signal: oklch(0.858, 0.184, 106),
}

test('the OKLCH conversion is correct at known anchors', () => {
  assert.deepEqual(oklch(1, 0, 0), [255, 255, 255])
  assert.deepEqual(oklch(0, 0, 0), [0, 0, 0])
})

test('body and label text on ink passes AA (4.5:1)', () => {
  assert.ok(contrast(T.fg, T.ink) >= 4.5, `fg/ink = ${contrast(T.fg, T.ink).toFixed(2)}`)
  assert.ok(contrast(T.fgMuted, T.ink) >= 4.5, `fg-muted/ink = ${contrast(T.fgMuted, T.ink).toFixed(2)}`)
})

test('signal is legible on ink', () => {
  assert.ok(contrast(T.signal, T.ink) >= 4.5, `signal/ink = ${contrast(T.signal, T.ink).toFixed(2)}`)
})

test('ink text on paper passes AA', () => {
  assert.ok(contrast(T.ink, T.paper) >= 4.5, `ink/paper = ${contrast(T.ink, T.paper).toFixed(2)}`)
})

test('signal on paper is NOT used as text — it fails, by design', () => {
  // documents the constraint rather than asserting a pass: on inverted
  // sections signal may only sit behind ink, never carry text
  assert.ok(contrast(T.signal, T.paper) < 3, `signal/paper = ${contrast(T.signal, T.paper).toFixed(2)}`)
})

test('fg-faint is decorative only — too low for 11px text on ink', () => {
  assert.ok(contrast(T.fgFaint, T.ink) < 4.5)
})

test('report', () => {
  const pairs: [string, RGB, RGB][] = [
    ['fg / ink', T.fg, T.ink],
    ['fg-muted / ink', T.fgMuted, T.ink],
    ['fg-faint / ink', T.fgFaint, T.ink],
    ['signal / ink', T.signal, T.ink],
    ['ink / paper', T.ink, T.paper],
    ['signal / paper', T.signal, T.paper],
  ]
  for (const [name, a, b] of pairs) {
    console.log(`   ${name.padEnd(16)} ${contrast(a, b).toFixed(2)}:1`)
  }
})
