import { z } from 'zod'

/**
 * How a dataset is consumed. This is the transparency vocabulary surfaced to users via
 * DataKindBadge (see docs/DESIGN_SYSTEM.md §5):
 *  - live: fetched at runtime, may change (none yet — e.g. DONKI later)
 *  - static: immutable published product (WMTS tiles)
 *  - snapshot: fetched once and stored locally, dated (MMGIS waypoints)
 *  - derived: computed locally from real data (slope grids, later phases)
 *  - simulated: synthetic, only for demos, always labeled
 *  - portal: we link out to it, no direct integration
 */
export const DATA_KINDS = ['live', 'static', 'snapshot', 'derived', 'simulated', 'portal'] as const
export type DataKind = (typeof DATA_KINDS)[number]

export const DATASET_STATUSES = ['available', 'pending-verification', 'planned'] as const
export type DatasetStatus = (typeof DATASET_STATUSES)[number]

/**
 * A scientific dataset descriptor. Nothing here is invented — see docs/DATA_SOURCES.md for the
 * verification log. `status` distinguishes verified/available from pending/planned entries.
 */
export const datasetSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  name: z.string().min(2),
  provider: z.string().min(2),
  /** Spacecraft mission, or '—' for general services. */
  mission: z.string(),
  instrument: z.string().optional(),
  kind: z.enum(DATA_KINDS),
  /** Human-readable resolution, e.g. "463 m/px". */
  resolution: z.string().optional(),
  coverage: z.string().optional(),
  /** Provider documentation or the dataset landing page. */
  url: z
    .string()
    .refine((v) => /^https?:\/\/\S+$/.test(v), { message: 'Must be an http(s) URL' })
    .optional(),
  status: z.enum(DATASET_STATUSES),
  /** Roadmap phase where this dataset is used (docs/DEVELOPMENT_ROADMAP.md). */
  phase: z.number().int().min(1).max(6),
  credit: z.string(),
  notes: z.string().optional(),
})
export type DatasetDescriptor = z.infer<typeof datasetSchema>
