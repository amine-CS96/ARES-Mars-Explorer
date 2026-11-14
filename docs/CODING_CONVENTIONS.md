# CODING_CONVENTIONS

Enforced by review + ESLint/Prettier. See also AGENTS.md §5 for the shortlist.

## TypeScript

- Strict mode; no `any` (use `unknown` + narrowing); no non-null assertions on boundaries.
- `type`-only imports with `import type { … }` (`verbatimModuleSyntax` is on).
- Components: named function exports; props via explicit `interface XProps`.
- One concept per file; co-locate tests as `*.test.ts(x)`.

## React

- Function components + hooks; no classes (except `ErrorBoundary`).
- Effects only for synchronization with the outside world (no derived-state effects).
- Memoize only with evidence of cost (measure first).
- Lazy-load any module importing Three.js / heavy visuals (`React.lazy` + `Suspense`).
- Keys stable and meaningful; no array-index keys on dynamic lists.

## Styling

- Tailwind classes in JSX; tokens from `@theme` (`bg-space`, `text-ink-dim`, `font-mono`…).
- Repeated patterns ≥ 3 uses → promote to a component or a `.panel`-style class in globals.
- Never `style={{ color: '#E56B3F' }}` — use tokens.
- Prettier owns formatting; do not hand-align.

## Data files (`src/data/`)

- Every record: id (kebab-case), sources array (label + URL), accuracy/kind fields.
- Zod schemas in `src/types/` are the single source of validation; data files call `.parse`.
- Comments cite the origin of a value when the URL alone doesn't (e.g. conversion 226.2°E →
  −133.8°).

## Naming

- Components `PascalCase.tsx`; hooks `useX.ts`; utils camelCase; zod schemas `xSchema`.
- Booleans read as predicates (`isLoading`, `hasData`).
- Domain terms consistent: POI, dataset, layer, route, mission config, verdict.

## Git

- Conventional-ish messages: `feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`.
- Small, logical commits; never commit `dist/`, `node_modules/`, `public/data/` artifacts.
- Commit after each verified milestone (DoD: typecheck+lint+test+build green).

## Comments & docs

- Comments explain *why*, not *what*; scientific comments cite the doc section
  (e.g. `// Pandolf adaptation — see docs/SCIENTIFIC_MODELS.md §4`).
- Update `PROJECT_STATUS.md`/`CHANGELOG.md` in the same session as the change.
