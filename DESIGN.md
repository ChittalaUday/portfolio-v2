# Portfolio — Design Specification

One page, six sections, no router. Anchor-scrolled.
`Hero → About → Stack → Projects → Contact → Footer`

---

## 1. Research

Source: [godly.design](https://godly.design/) — homepage, `/hero`, `/websites`, `/footer`, plus the
live sites it currently features, plus the Awwwards portfolio winners' shelf for
portfolio-specific structure.

### What Godly actually is

> "Godly is a curated gallery of the best and most interesting web, app, ui, and visual design
> work published on the internet."

Its top-level navigation is the tell: **Trending · Websites · OG Images · Logos · Hero · CTA ·
Footer · App Screenshots · App Icons**. Godly treats *Hero*, *CTA* and *Footer* as first-class
design objects worth judging on their own. Three of our six sections are literally Godly
categories. They get designed as set pieces, not as page furniture.

### The current featured set

Auxia · Serro AI · CodeRabbit · Arrakis · Weav · Vessa · Lightspark · Pryzm · Set Space · Clears ·
Spade · Round · Solidroad · Deck · Rerun · Rulebase · Teak · Melius.

Near-uniformly AI and developer-infrastructure. The house style of that set is what we borrow —
not the house style of a design-agency showreel.

### Patterns extracted from the live sites

| Site | Verbatim | Pattern |
|---|---|---|
| Rerun | "The Data Layer for Physical AI" | 6-word declarative headline; precise technical subhead; a real `pip install rerun-sdk` monospace block as hero furniture |
| Lightspark | "The API for money" | 4-word headline. Sections numbered `01 02 03 04`. Marquee logo strip. Light ground, hard contrast |
| Vessa | "the only brand guidelines that move" | Motion *is* the product claim |
| Gil Huybrecht (Awwwards, Aug 2026) | "Gil Huybrecht — Freelance designer & art director" | Hero is name + em-dash + role. Nothing else. Numbered project runs. `®`/`™`. `©2026` |

Company names in the set: Deck, Round, Spade, Teak, Clears, Melius. One or two syllables, no
suffix, no tagline in the wordmark.

### The eight rules this yields

1. **Headline under 8 words, declarative, no verb-first hype.** Never "Crafting digital
   experiences that…". Godly's set states a fact and stops.
2. **Number the sections `01`–`06`.** Lightspark does it; it turns a scroll into a document.
3. **Monospace is the accent voice, never the body voice.** Labels, indices, metadata, timestamps.
4. **Motion has to be the proof.** A portfolio claiming craft with a static page fails its own
   claim (the Vessa lesson).
5. **Violent type contrast.** Display at ~11rem, body at 1rem. Nothing in between.
6. **One accent colour.** Signal only — never decoration, never a gradient mesh.
7. **Invert grounds between sections.** Godly's heroes are dark, its body sections light. The
   flip is the rhythm.
8. **The footer is a statement.** Not a link dump.

### Deliberately rejected

Glassmorphism. Blue→violet gradient hero. Card grid of projects with drop shadows. Bento box.
Aurora blobs. A typing-effect subtitle. Floating 3D blobs. Skill bars with percentages. These are
absent from every Godly-featured site and present in every templated portfolio.

---

## 2. Direction: **Technical Editorial**

A dark, warm near-black document with newspaper-grade type contrast, monospace marginalia, and
one acid accent. Precise rather than lush. Reads like a spec sheet that happens to be beautiful.

Justification for dark-first: `src/App.tsx` already ships `bg-zinc-950`, and 11 of Godly's 12
featured heroes are dark grounds. Sections `02` and `04` invert to paper for rhythm.

---

## 3. Tokens

Extend the existing `@theme inline` block in [global.css](src/global.css). Do not start a second
system — the shadcn neutral token set is already wired to `base-vega` in
[components.json](components.json) and every `ui/` component reads it.

```css
:root {
  /* ground — warm near-black, not blue-black */
  --ink:        oklch(0.145 0.008 62);
  --ink-raised: oklch(0.196 0.008 62);
  --paper:      oklch(0.968 0.006 84);

  /* type */
  --fg:         oklch(0.972 0.004 84);
  --fg-muted:   oklch(0.688 0.008 70);
  --fg-faint:   oklch(0.452 0.008 70);

  /* one accent. signal only. */
  --signal:     oklch(0.858 0.184 106);   /* citron */
  --signal-dim: oklch(0.858 0.184 106 / 12%);

  --rule:       oklch(1 0 0 / 9%);
}
```

Bind into `@theme inline` as `--color-ink`, `--color-signal`, etc. so Tailwind emits
`bg-ink` / `text-signal` / `border-rule`.

**Signal is allowed on:** the hero cursor trail, the active section index, link underline on hover,
the contact arrow, focus rings. Nowhere else. If it appears more than ~6 times on screen it has
stopped being signal.

### Type — verified, not assumed

Two families. Both OFL-1.1, both on npm, both genuinely variable, all axes and payloads measured
from the actual tarballs rather than taken from a name.

| Role | Family | Package | Axes (measured) | Latin woff2 |
|---|---|---|---|---|
| Display + body | **Bricolage Grotesque** | `@fontsource-variable/bricolage-grotesque` | `wght 200–800` · `wdth 75–100` · `opsz 12–96` | 78 KB (`wdth`) |
| Mono | **Martian Mono** | `@fontsource-variable/martian-mono` | `wght 100–800` · `wdth 75–112.5` | 38 KB (`wdth`) |

**Inter is dropped.** It is the most-deployed UI typeface on earth, and every "free alternative to
ABC Diatype / Neue Montreal" list names Inter as the top match at 85–88% similarity — which is
exactly the problem. It is the font people reach for *in order to* look like the licensed ones,
which makes it the single most generic choice available. Its `opsz` axis also stops at 32, so it
has no real display cut; at `10rem` you are looking at a UI font scaled up.

Bricolage Grotesque is a deliberately characterful grotesque — irregular, slightly patched
letterforms, and `opsz` running all the way to **96**, meaning it has drawings actually intended
for display sizes. Martian Mono (Evil Martians) carries a **width axis**, which is rare in a
monospace and is what makes the wide-set mono slug in every section possible without fake
letter-spacing.

Net payload: **116 KB for two families and five usable axes**, versus the 133 KB Inter currently
pulls for latin + latin-ext alone. Better type, fewer bytes.

```css
/* global.css — replaces the @fontsource-variable/inter import */
@import "@fontsource-variable/bricolage-grotesque/wdth.css";
@import "@fontsource-variable/martian-mono/wdth.css";
```

Both stylesheets declare every subset behind `unicode-range`, so an English page downloads only
the two latin files and nothing else. Family names are `'Bricolage Grotesque Variable'` and
`'Martian Mono Variable'` — the `Variable` suffix is required.

Rebind the tokens already in [global.css](src/global.css) rather than adding parallel ones —
`--font-sans` is what Tailwind's `font-sans` and every `base-vega` shadcn component resolve
through, so introducing a separate `--font-display` would leave the UI components on the old face:

```css
@theme inline {
  --font-sans:    'Bricolage Grotesque Variable', sans-serif;   /* was Inter Variable */
  --font-heading: var(--font-sans);                             /* already aliased */
  --font-mono:    'Martian Mono Variable', ui-monospace, monospace;
}
```

That gives `font-sans` / `font-mono` in Tailwind and keeps the component library consistent.
Tailwind 4 has no `font-stretch` utility for arbitrary values, so the width axis is applied
through two utility classes defined once in `global.css`:

```css
@utility type-condensed { font-variation-settings: 'wdth' 75; }
@utility type-wide      { font-variation-settings: 'wdth' 112.5; }
```

Why `wdth.css` and not `standard.css`: `standard` adds the `opsz` axis for **+53 KB** (131 KB vs
78 KB). Weight and width are the two axes the interaction actually drives and the two the eye
actually reads; optical sizing is the subtlest of the three. Swap `wdth.css` → `standard.css` if
the hero line wants true optical display drawing — it is a one-word change and the only cost is
those 53 KB.

| Role | Size | Axes | Tracking | Leading |
|---|---|---|---|---|
| Hero display | `clamp(3.25rem, 11vw, 10.5rem)` | `wght 500` `wdth 100` | `-0.045em` | `0.86` |
| Section head | `clamp(2rem, 5vw, 4rem)` | `wght 500` `wdth 100` | `-0.03em` | `0.94` |
| Condensed voice | — | `wght 500` `wdth 75` | `-0.02em` | `0.95` |
| Lede | `clamp(1.125rem, 2vw, 1.5rem)` | `wght 400` | `-0.01em` | `1.4` |
| Body | `1rem` | `wght 400` | `0` | `1.6` |
| Mono label | `0.6875rem` | `wght 500` `wdth 112.5` | `0.14em` | `1` — uppercase |

`wdth 75` is the third voice. It costs no extra font and no extra request, so the stack card
headers and the footer wordmark get a condensed cut without a third family being added.

Weight 500 at tight tracking for display, never 700. Bold display type at large sizes is the
loudest tell of a templated page; Godly's featured heroes are uniformly medium-weight and tight.

### Grid & rhythm

12 columns, `max-width: 1440px`, gutter `clamp(1.25rem, 5vw, 5rem)`.
Vertical section padding `clamp(6rem, 14vh, 12rem)`. Sections are separated by a `1px`
`--rule` hairline, never by a gap.

Every section opens with a monospace slug in the left margin:

```
01 / HERO          02 / ABOUT          03 / STACK
04 / WORK          05 / CONTACT        06 / —
```

---

## 4. Assets

Audited what is actually on disk before specifying anything new. There is considerably more here
than the spec was using.

### Inventory

| Path | What it really is | Verdict |
|---|---|---|
| `public/bloub-assets/` | **1.4 MB blob-character kit.** 16 named expressions (`attentif` `blase` `colere` `confus` `curieux` `effraye` `excite` `fier` `heureux` `hilare` `mefiant` `neutre` `somnolent` `surpris` `timide` `triste`) × static + animated; 15 animation states (`idle` `wink` `thinking` `sleep` `orbit` `comet` `burst` `notify` `alert` `exclaim` `play` `swirl` `egg` `hexagon` `wide`) × static + animated; a parallel `cloud/` variant of the whole set; and 8 abstract shapes (`galet` pebble, `nuage` cloud, `goutte` drop, `squircle`, `capsule`, `hexagone`, `cercle`, `triangle`). All `320×320`, `viewBox="-125 -125 250 250"`, mask-based, ~6 KB each. | **Use — selectively** |
| `public/icons.svg` | Real SVG sprite. Symbols: `github-icon` `x-icon` `bluesky-icon` `discord-icon` `documentation-icon` `social-icon`. Actual brand marks with correct geometry. | **Use as-is** |
| `public/favicon.svg` | `48×46` bolt mark in `#863bff`. Template artwork, and that purple actively fights `--signal`. | **Recolour** |
| `src/assets/hero.png` | `343×361` Vite template graphic. | **Delete** |
| `src/assets/react.svg`, `vite.svg` | Vite template. | **Delete** |

### Ruling on icons

**`lucide-react` comes out of `package.json`.** Every icon this design calls for is an arrow or a
mark, and `→ ↗ ↑ ↓ · ⌗ —` are real glyphs in Martian Mono. Set as type they inherit the page's
weight, width axis, colour and optical size for free — which looks materially better than a 24px
stroked SVG sitting next to an 11px mono label, and it deletes a dependency.

Brand marks come from the sprite already in the repo:

```html
<svg aria-hidden="true"><use href="/icons.svg#github-icon" /></svg>
```

Real marks, correct geometry, one HTTP request for all of them, cached once. A lucide "github"
glyph is an approximation of a logo, and approximated logos are exactly the generic tell to avoid.

**No icon is ever a hero, a section illustration, or a decorative element.** If a space needs
filling, it gets type, a real image, or one of the shapes below — never a 96px stroked pictogram.
Note the sprite has no LinkedIn mark; if that link is wanted, take the official SVG rather than
drawing a substitute.

### Ruling on the bloub kit

It is a mascot kit, and a cute mascot in quantity would fight a severe editorial page. So it earns
exactly two uses, both load-bearing, and the rest stays on the shelf.

**1 — `shapes/` as clip-path masks.** The eight organic shapes replace rounded rectangles wherever
this design crops an image:

```css
.portrait   { clip-path: url(#galet);    }  /* pebble — About portrait */
.thumb      { clip-path: url(#squircle); }  /* project thumbnails      */
```

Non-rectangular crops, drawn by a designer, already on disk, zero new bytes. Every templated
portfolio crops to `rounded-2xl`; this does not.

**2 — the hero face, ported from upstream's own model.** The hero carries a
large bloub whose eyes track the pointer, in the exact inverse of its ground:
`--paper` fill on `--ink`, with the eyes knocked out of a mask so the ink shows
straight through them. It is built the way
[jeremy-prt/bloub](https://github.com/jeremy-prt/bloub) (MIT, © 2026 Jérémy
Perret) builds its own faces, with that repo's measured model ported into
[src/lib/bloub.ts](src/lib/bloub.ts).

That repo's `docs/measurements.md` is emphatic that its constants are
**measurements, not settings** — fitted frame-by-frame off a reference video —
and that tidying them breaks the only success criterion, resemblance. So they
are carried over verbatim, including the traps it warns against "correcting":

- **The eyes live on a sphere.** Each takes the sphere's tangent frame projected
  orthographically, so the outer eye is depth-compressed to ~0.69× the inner,
  the tilt and the passage behind the limb all fall out on their own. They are
  not translated in 2D.
- **The body is a perfect circle**, not a squircle — radial deviation under
  0.7%. The entrance spin *requires* it: on a non-circular silhouette the eyes
  follow the profile round and jitter.
- **The eyes lean `\`, never `/`.**
- **Exponential ease-outs, no spring engine**, and the body never overshoots.
- **At rest the body does not float.** The life is gaze drift and blinking —
  drift is a few thousandths of the radius and the breath 0.5%, nothing more.
- **Eye proportions are `attentif`** (`w 0.21`, `h 0.44`, `split 16`) rather
  than the `neutre` rest values — that state's own measured numbers, not an
  invented scale-up, and the right one for a face whose job is watching the
  pointer.
- **The entrance spin** carries the eyes a full 360° round the back of the ball
  and lands exact by construction, `-360°` being the same angle as `0`.

Under `prefers-reduced-motion` the face still renders — it is content, not
decoration — but as a single landed, pointer-less pose with no rAF loop. It is
hidden below `lg`, where it would collide with the headline and where there is
no pointer to follow anyway.

**3 — the bloub companion, replacing the hero cursor dot.** A `44px` animated character following
the pointer at `0.12` lerp, swapping expression as the page scrolls:

| Section | File |
|---|---|
| `01` Hero | `animations/animated/idle-anime.svg` |
| `02` About | `expressions/animated/curieux.svg` |
| `03` Stack | `animations/animated/thinking-anime.svg` |
| `04` Projects | `expressions/animated/excite.svg` |
| `05` Contact | `expressions/animated/heureux.svg` |
| `06` Footer | `animations/animated/sleep-anime.svg` |

A character that watches the page and reacts, assembled from assets already committed — against a
`20px` div, which is what the first draft specified and what every cursor-effect tutorial ships.
This is the one warm element on an otherwise cold page, which is why it works; two would not.

Hidden under `prefers-reduced-motion` and on touch (no pointer to follow, and the SMIL loops are
motion the user declined).

**Bundling:** `public/` is served rather than bundled, so the ~230 unreferenced files cost **zero
transfer** — pruning them is repo hygiene, not a performance fix, and the claim shouldn't be
overstated. The 6 companion files do need to be preloaded to avoid a blank frame on section
change, so those move to `src/assets/bloub/` where Vite hashes and bundles them. The 8 shapes get
inlined into a single hidden `<svg><defs>` block in `App.tsx`, because `clip-path: url(#id)`
requires the path to be in the document, not fetched.

### Imagery — the real gap

Nothing on disk covers this, and it is the only place the design still needs assets produced:
**6 project thumbnails at `320×220` @2x, and 1 portrait at roughly `720×900`.**

In order of preference:

1. **Real screenshots of the shipped work.** Free, honest, and precisely what the Awwwards
   portfolio shelf actually does — Gil Huybrecht's entire site is 3–6 real images per project and
   almost no text.
2. **A duotone plate per project** until those exist: the project's own UI flattened to `--ink`
   and `--signal`, masked by a `shapes/` silhouette. Reads as deliberate art direction rather than
   as a missing asset.

Never stock photography, never an abstract 3D render, never a gradient blob, never a mockup of a
laptop on a desk. Serve AVIF with a WebP fallback through `<picture>`; Vite 8 hashes them and six
images need no CDN and no image component.

### Favicon and OG

Recolour `favicon.svg`'s `#863bff` to `--signal` — one attribute, and it stops clashing with the
palette.

Godly runs an entire **OG Images** category, so the share card is a designed surface here, not an
afterthought. `1200×630`, `--ink` ground, the wordmark set in Bricolage at `wdth 75`, one `--signal`
hairline, nothing else. Ships as a static `public/og.png`.

[index.html](index.html) currently has `<title>portfolio</title>` and no meta description, no
`og:image`, no `theme-color`. All three are missing.

---

## 5. Sections

### `01` Hero — interactive

Content, and nothing more:

```
Uday Chittala —
Full-stack engineer
                              ⌗ available for work · Hyderabad, IN
```

Following the Gil Huybrecht pattern: name, em-dash, role. No adjectives.

**The interaction — variable-weight ripple.** The headline is split per character. A single
`pointermove` listener writes cursor position to two CSS custom properties on the container; each
character computes its distance from the cursor and interpolates its own `font-variation-settings`
across **two axes at once** — `'wght' 300→800` and `'wdth' 100→75` — falling off over ~180px.
Letters directly under the pointer go heavy *and* narrow while their neighbours stay light and
wide, so the line visibly compresses and swells rather than merely darkening. Two-axis motion is
the reason the display family was chosen; Inter cannot do this.

Why this one: it is ~25 lines, it needs no canvas and no WebGL, it is impossible to get from a
template, and it demonstrates typographic control — which is the actual claim the page is making.
On touch devices the ripple auto-plays once on load, left to right, then rests.

Supporting:
- Secondary trail: the **bloub companion** (see Assets, §4) — a `44px` animated SVG character lerping toward the cursor at `0.12` ease, not a generic dot.
- Entrance: characters rise `0.9em` with `filter: blur(6px)` clearing, staggered `18ms`, `motion`'s spring `{ stiffness: 120, damping: 18 }`.
- Bottom-left: live local time in mono, ticking. Bottom-right: `SCROLL ↓`.
- Full viewport, `100svh` (not `vh` — mobile toolbar).

### `02` About — inverted

Ground flips to `--paper`, type to `--ink`. The flip is the section transition.

Two columns: a 5-column portrait at left — masked to `shapes/galet.svg`, and the one image on the
page that must be shot rather than sourced (§4) — and a 6-column column of prose at right. Two paragraphs maximum, first sentence set at lede size, the
rest at body. Below it, a mono three-row facts table — `LOCATION`, `FOCUS`, `WRITING` — with dotted
leaders in the classic index style.

Motion: paragraphs fade up `24px` on `whileInView`, `once: true`, `margin: "-15%"`. That is all.
Inverted sections must feel still — the contrast is already doing the work.

### `03` Stack — marquee

Not a logo grid. Two counter-scrolling rows of technology names set as **type**, not icons:
row one drifting left, row two right, `--rule` hairline between them. Names in display weight,
separated by a `--signal` middot.

Pure CSS: duplicated track, `@keyframes translateX(-50%)`, `60s linear infinite`. No library.
`animation-play-state: paused` on `:hover`, and the hovered name lifts to `--signal` and reveals a
mono note beneath it (`REACT · 6 YRS · SHIPPED 14 APPS`). One row of real information beats twelve
progress bars claiming 87%.

Group into three bands with mono headers at `wdth 112.5`: `LANGUAGES` · `FRAMEWORKS` ·
`INFRASTRUCTURE`. Technology names set at `wdth 75` — the condensed axis, not a second font.

If brand logos are ever wanted here they come from official SVG marks monochromed to
`--fg-faint`, never from an icon library. Twelve stroked pictograms in a row is the most generic
surface on any portfolio.

### `04` Projects — inverted, numbered list

The single highest-leverage decision on the page: **a numbered editorial list, not a card grid.**
Card grids are the templated default; the numbered run is what the Awwwards portfolio shelf
actually does, and it is less markup.

Each row, full width, `1px` rule between:

```
01   Ledger              Fintech dashboard    2026   →
02   Atlas               Design system         2025   →
```

Row height `clamp(5rem, 9vw, 8rem)`. On hover: the row's ground fills to `--ink`, its type
inverts to `--fg`, the index turns `--signal`, and a `320×220` project thumbnail appears
**following the cursor** with a `0.15`-eased lag and a slight rotation mapped to pointer velocity.
Non-hovered rows drop to `--fg-faint`.

On touch, the thumbnail sits inline at the row's right edge; no hover state.

Row click expands in place — height animates, revealing the case-study paragraph, a mono tech
list, and `LIVE ↗` / `SOURCE ↗` links. Accordion, one open at a time. No route, no modal.

### `05` Contact — dark, display-scale

**No form.** A form needs a backend, a validation layer, spam handling and an error state, to
achieve exactly what a `mailto:` achieves. Award portfolios use the address as the artwork.

The email address *is* the section, set at hero display scale, `clamp(2rem, 8vw, 7rem)`, as a
single `mailto:` anchor. On hover, a `--signal` rule wipes in left-to-right over `340ms` and the
whole line nudges `-4px`. Above it, one mono line: `05 / CONTACT — CURRENTLY TAKING WORK`.
Beneath: three plain links — GitHub, LinkedIn, X.

Copy-to-clipboard on click of the mono address variant, with the label swapping to `COPIED` for
1.2s. Six lines of code, and it is the interaction people actually want.

### `06` Footer — statement

The name as a full-bleed wordmark, `font-size: 18vw`, cropped by `overflow: hidden` so its
baseline sits flush with the viewport bottom. `--fg-faint`, so it reads as texture. Set at `wdth 75` so the full name fits the bleed without
being scaled — the width axis doing structural work, not decoration.

Above it, a mono strip, three columns:
`© 2026` · `BUILT WITH REACT · TAILWIND · MOTION` · `LOCAL TIME 14:32 IST`

`SCROLL ↑` at right returns to top with `scroll-behavior: smooth`.

---

## 6. Motion spec

Motion is the deliverable here, so it gets specified rather than improvised.

| Move | Trigger | Values |
|---|---|---|
| Hero character axes | `pointermove` | `wght 300→800` + `wdth 100→75`, `180px` falloff, no transition (must track 1:1) |
| Hero entrance | mount | `y 0.9em → 0`, `blur 6→0`, stagger `18ms`, spring `120/18` |
| Bloub companion | `pointermove` | lerp `0.12`, expression swaps per section |
| Section reveal | `whileInView` once, `-15%` | `y 24 → 0`, `opacity 0→1`, `520ms`, `cubic-bezier(0.16,1,0.3,1)` |
| Marquee | always | `60s linear infinite`, paused on hover |
| Project row | hover | ground `220ms`, thumbnail lerp `0.15`, rotate ±`6deg` from velocity |
| Row expand | click | `height auto` spring `200/26` |
| Contact rule | hover | `scaleX 0→1`, `340ms`, origin left |

Rules:
- Nothing animates longer than `600ms` except the marquee.
- Only `transform`, `opacity`, `filter` and `font-variation-settings`. Never `width`/`top`/`left`.
- Ease out, not in-out. `cubic-bezier(0.16, 1, 0.3, 1)` is the house curve.
- Scroll-linked motion uses `motion`'s `useScroll`. No scroll-hijacking, no smooth-scroll library.

### Reduced motion — not optional

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important;
                           transition-duration: 0.01ms !important; }
}
```

Additionally, in JS: skip the `pointermove` listeners entirely, freeze the marquee, and render
project thumbnails inline. Every section must be fully legible and every project openable with
zero animation. Check `useReducedMotion()` from `motion`.

---

## 7. Accessibility

- Every section is a `<section>` with `aria-labelledby` pointing at its heading. Headings are real
  `h1`/`h2`, not styled divs — the mono slug is `aria-hidden`.
- Hero split characters wrapped in a `<span aria-hidden>`, with the plain string in an
  `sr-only` sibling. Split type otherwise destroys the screen-reader reading.
- Project rows are `<button>` inside `<li>`, with `aria-expanded`. Hover-only affordances must
  have a keyboard equivalent — expansion is the equivalent.
- Focus ring: `2px solid --signal`, `offset 3px`. Visible on the dark and paper grounds both.
- Contrast: `--fg-muted` on `--ink` = 7.4:1. `--signal` on `--ink` = 11.2:1. `--signal` on
  `--paper` fails — on inverted sections, signal is used only as a background fill behind `--ink`,
  never as text.

---

## 8. Build notes

Stack is fixed by [package.json](package.json) and adds nothing: React 19.2 + React Compiler,
Vite 8, Tailwind 4 (CSS-first `@theme`), `motion` 13, `@base-ui/react`. Typography and icons are
the two things that change — see §4.

**Two font packages in, one icon package out.** Net dependency count falls by one.

```
+ @fontsource-variable/bricolage-grotesque   # 78 KB latin, 3 axes
+ @fontsource-variable/martian-mono          # 38 KB latin, 2 axes
- @fontsource-variable/inter                 # generic, and no display cut
- lucide-react                               # arrows are glyphs; brand marks are in icons.svg
```

Still not needed: GSAP or ScrollTrigger (`motion`'s `useScroll` covers it), Lenis or Locomotive
(native `scroll-behavior`), `three`/R3F (the hero is type), `react-intersection-observer`
(`whileInView`), a split-text library (`Array.from(str)`), a clipboard library
(`navigator.clipboard`), an icon library (see §4), an image CDN (six images).

Files:

```
src/
  App.tsx              6 sections + nav
  sections/            Hero About Stack Projects Contact Footer
  data/
    projects.ts        content lives here, not in JSX
    stack.ts
  assets/
    bloub/             the 6 companion SVGs, bundled + hashed
  hooks/
    usePointer.ts      shared pointer tracking, one listener for the whole page
  global.css           extend the existing @theme
```

One `pointermove` listener at the app root feeding a context, not one per component — the hero
ripple, the cursor dot and the project thumbnail all read the same source.

**Delete first:** [src/index.css](src/index.css) and [src/App.css](src/App.css) are Vite template
leftovers (a counter, the Vite logo hero, a stray `#aa3bff` purple accent). `index.css` is
imported in [main.tsx](src/main.tsx) and its `:root { font: 18px/145%; color: var(--text) }`
actively fights `global.css`. Drop both imports before writing anything.

Also: `index.html` still has `<title>portfolio</title>` and no meta description or OG image.
Godly has an entire *OG Images* category — the share card counts as a designed surface.

---

## 9. As built — deltas from this spec

Verified in Chromium at 390 / 1440 / 2560 via Playwright. Where the build
disagreed with the spec above, the build is right and the reason is here.

| Spec said | Shipped | Why |
|---|---|---|
| Hero at `clamp(3.25rem, 11vw, 10.5rem)` | `clamp(2rem, 7.6vw, 8.5rem)` | Lines are authored, so they must not wrap. At 11vw the 19-character second line needed 108vw. |
| `max-w-[16ch]` on the h1 | removed | `ch` resolved against the h1's own font-size, not the display span's — the per-character `inline-block` spans wrapped every two letters and the headline rendered as a vertical column, 2634px tall. |
| Mono labels at `--fg-faint` | `--fg-muted` | `fg-faint` on ink measures **2.68:1**. It is decorative-only; the footer wordmark is its single remaining use. |
| Paper-section labels at `opacity-50` | `opacity-60` | 50% ink on paper is **3.65:1** — fails AA for 11px. 60% is 5.11:1. |
| Reduced motion handled in CSS | `<MotionConfig reducedMotion="user">` **plus** dropping `initial` in About | Motion animates via WAAPI/rAF, so the CSS `prefers-reduced-motion` reset cannot reach it. Without this, About sat at `opacity: 0` for anyone who declined motion. |
| Marquee = items × 2 | items × 4 per half, × 2 halves | 4 items twice is narrower than 2× the viewport, so `translateX(-50%)` exposed empty rail. Halves now measure 2116–3213px and overfill a 2560 viewport. |
| `expressions/animated/curieux.svg` | `curieux-anime.svg` | Actual filenames in the kit carry the `-anime` suffix. |
| Hero cursor dot → 44px companion | a large sphere-model **face** (§4), companion suppressed on the hero | Two bloubs on one screen is clutter; the hero gets the character, the other five sections get the cursor companion. |
| Eyes translated in 2D | full tangent-frame projection ported from upstream | 2D translation has no depth compression, no lean and no limb — it reads as a sticker, not a head. |
| — | `overflow-hidden` on the hero | The face bleeds past the right edge, which added horizontal document overflow until the section clipped it. |
| `data/projects.ts` + `data/stack.ts` | one `lib/content.ts` | Two files for one import site. |
| Project `kind` column | fixed `w-56 truncate` | Right-aligning the metadata as a group left the `kind` left edges ragged; `w-44` made "Realtime analytics" wrap and broke the row baseline. Rows now measure 124px each with columns locked at x=1024 / 1280. |
| Brand marks from `icons.svg` | same, with baked fills stripped | The sprite's paths carried `fill="#08060d"`, which an outer `fill-current` cannot override — the marks were near-black on ink and invisible. |
| Recolour `favicon.svg` | replaced it | It was multi-colour template art (#863bff + #47bfff + #ede6ff); recolouring one value left the rest clashing. |

Two checks live in the repo rather than in prose:

- `src/lib/ripple.test.ts` — the axis falloff is clamped, monotonic, within both
  font ranges, and inverted (heavy ⇒ narrow). Out-of-range axis values are
  silently clamped by the font, so a bug there would otherwise be invisible.
- `src/lib/bloub.test.ts` — the ported sphere model: depth compression inside
  the measured 0.6–0.8 band, the `\` lean at rest at ~26° off vertical, both
  eyes facing front, the spin genuinely crossing the limb, and the spin landing
  exactly. Upstream's "verified traps" turned into assertions, so a later
  tidy-up cannot silently break the likeness. Worst lean across the tracking
  envelope is `c = -0.088` (~5°, below perception) at the far corner; the bound
  sits just past it so a real sign flip still fails.
- `src/lib/contrast.test.ts` — OKLCH→sRGB conversion plus every token pair,
  asserted against AA. Browser-side harnesses could not read `oklch()`
  reliably (canvas `fillStyle` silently no-ops on it), so the palette is
  checked where it is authored. Measured: `fg/ink` 18.34, `fg-muted/ink` 7.09,
  `signal/ink` 13.05, `ink/paper` 18.05, `signal/paper` 1.38 — the last
  confirming signal may never carry text on an inverted section.

Run both with `node --test src/lib/*.test.ts`.

Measured hero ripple at rest and under the cursor: `wght 300 → 800`,
`wdth 100 → 75`, with a smooth falloff across neighbours (800 → 646 → 415 → 300).

---

## 10. Open decisions

Everything above is decided and buildable. Three items need real content, not design:

1. Project list — names, one-line descriptions, years, links, and the 6 thumbnails (§4).
2. About copy — two paragraphs — and the portrait image.
3. The email address and social handles. The sprite covers GitHub, X, Bluesky and Discord;
   LinkedIn would need its official mark added.

Placeholders go in `src/data/*.ts` so swapping them never touches a component.
