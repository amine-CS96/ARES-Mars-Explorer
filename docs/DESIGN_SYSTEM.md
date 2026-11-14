# DESIGN_SYSTEM

The ARES visual language: mission-control precision with restrained futurism. Tokens live in
`src/styles/globals.css` (`@theme`); components must consume tokens, never raw hex.

## 1. Color tokens

| Token | Value | Use |
| --- | --- | --- |
| `--color-space` | `#080B12` | app background (deep space black) |
| `--color-surface` | `#111722` | panels / secondary background |
| `--color-surface-2` | `#161E2D` | elevated surface (hover, cards) |
| `--color-line` | `#232C3F` | hairline borders |
| `--color-line-strong` | `#33405C` | emphasized borders/dividers |
| `--color-accent` | `#E56B3F` | Martian orange — primary actions, brand |
| `--color-accent-strong` | `#F28256` | hover state of accent |
| `--color-cyan` | `#53D6E8` | secondary accent — data, links, telemetry |
| `--color-amber` | `#FBBF24` | warning |
| `--color-danger` | `#F87171` | danger / NO-GO |
| `--color-success` | `#34D399` | success / READY |
| `--color-ink` | `#F5F7FA` | primary text |
| `--color-ink-dim` | `#9AA7BD` | secondary text |
| `--color-ink-faint` | `#6B7A94` | tertiary/meta text |

Semantic mapping: `READY → success`, `CAUTION → amber`, `NO-GO → danger`, coordinates and
telemetry values → `font-mono` + `cyan` accents, science labels → `ink-dim`.

## 2. Typography

| Font | Use | Notes |
| --- | --- | --- |
| **Orbitron** | display: page titles, module names, verdicts | `font-display`, weight 600–800 |
| **Inter** | all body/UI text | `font-sans`, weight 400–700 |
| **JetBrains Mono** | coordinates, telemetry, numbers, data badges | `font-mono`, tabular |

Rules: display text ≤ 2 sizes per screen; body 14–16px; all numeric readouts mono with
`tabular-nums`; sentence case for UI, ALL CAPS reserved for small labels/eyebrows.

## 3. Surfaces & effects

- **Panel** (`.panel`): `bg-white/[0.02–0.04]` + `border border-line` + soft shadow, radius
  `rounded-xl`; optional `backdrop-blur` for overlays (glassmorphism, subtle only).
- **Glow**: reserved for accent moments (active marker, verdict ring, hero orbital ring) —
  `shadow-[0_0_24px_rgba(229,107,63,0.25)]`-style; never on body text.
- **Grid overlay** (`.bg-grid`): faint lat/lon grid texture for hero/empty-space backgrounds.
- **Elevation**: max two levels; avoid stacking shadows on nested panels.
- **Motion**: 150–250ms ease-out; fade+translate on section mount (`animate-fade-up`); slow
  planet spin (`animate-spin-slow`) only where decorative. Honor `prefers-reduced-motion`.

## 4. Components (shadcn-style, hand-written in `components/ui/`)

| Component | Variants | Notes |
| --- | --- | --- |
| Button | default(accent) / secondary / outline / ghost / destructive; sm/md/lg/icon; `asChild` | focus-visible ring always |
| Badge | default / outline / success / warning / danger / cyan | small caps, mono option |
| Card | Card, Header, Title, Description, Content, Footer | consistent padding scale |
| Dialog | Radix wrapper, dark overlay, ESC/backdrop close | mobile-safe sheet sizing |
| Tooltip | Radix wrapper, dark glass | short helper text only |
| Separator | horizontal/vertical | `bg-line` |
| Skeleton | shimmer block | for all async regions |
| StatusBadges | DataKindBadge, AccuracyBadge, PhaseBadge, VerdictBadge | the transparency vocabulary (see below) |

## 5. Transparency vocabulary (badges shown to users everywhere)

- **Data kind**: `LIVE` (cyan) · `STATIC` (neutral) · `DERIVED` (violet/ink-dim) · `SIMULATED`
  (amber) · `PORTAL` (outline) · `FICTION` (outline, dashed border).
- **Coordinate accuracy**: `VERIFIED` (success) · `APPROXIMATE` (amber) · `ILLUSTRATIVE`
  (neutral/outline).
- **Phase**: `P1 ✓` … `P6` — done phases success, current accent, future outline.
- **Verdict**: `READY` (success) · `CAUTION` (amber) · `NO-GO` (danger).

## 6. Layout

- Max content width `max-w-7xl`, side padding 16–24px; sticky top nav (64px, glass).
- Dashboard grid: 12-col desktop → stacked mobile; section rhythm `py-12–16`.
- Panels never touch screen edges on mobile (16px gutters); nav drawer full-height right sheet.
- Footer carries attribution + disclaimer on every page.

## 7. Loading / empty / error states

- Every async region: Skeleton → content, or explicit empty state with one action.
- Errors: concise human message + technical detail in a details disclosure + retry button.
- No spinners longer than ~800ms visible: switch to skeleton after initial delay.

## 8. Do / Don't

- DO use the mandated palette; keep contrast AA on dark (ink on space = 15:1).
- DO show source/resolution/accuracy for any data surface.
- DON'T use more than one accent glow per view, decorative gradients behind text, or generic
  dashboard cards without content purpose.
- DON'T hardcode colors/fonts in components — tokens only.
