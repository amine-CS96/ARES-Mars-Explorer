/**
 * Public entry point for the points-of-interest module. Cross-feature imports (e.g. the globe
 * reusing the detail dialog) must come through this barrel — not from feature internals
 * (docs/ARCHITECTURE.md §1, layering rules).
 */
export { PoiDetailDialog } from './PoiDetailDialog'
