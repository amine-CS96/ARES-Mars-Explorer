import { z } from 'zod'
import type { CoordinateAccuracy } from '@/types/geo'

/** Point-of-interest categories used for filtering and labeling. */
export const POI_CATEGORIES = ['landing-site', 'mission', 'geology', 'region', 'fiction'] as const
export type PoICategory = (typeof POI_CATEGORIES)[number]

/** An explicit, verifiable source reference. URLs must be http(s). */
export const sourceRefSchema = z.object({
  label: z.string().min(3),
  url: z
    .string()
    .refine((v) => /^https?:\/\/\S+$/.test(v), { message: 'Must be an http(s) URL' })
    .optional(),
})
export type SourceRef = z.infer<typeof sourceRefSchema>

/**
 * Curated point of interest. Every entry must cite at least one source; coordinates carry an
 * accuracy label. See docs/SCIENTIFIC_MODELS.md §8 (honesty rules).
 */
export const poiSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/, { message: 'Kebab-case id required' }),
  name: z.string().min(2),
  category: z.enum(POI_CATEGORIES),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
  }),
  accuracy: z.enum(['verified', 'approximate', 'illustrative']) satisfies z.ZodType<CoordinateAccuracy>,
  /** e.g. "226.2°E in the 0–360°E convention". */
  coordinateNote: z.string().optional(),
  /** Meters relative to the Mars datum (MOLA), when reliably published. */
  elevationM: z.number().optional(),
  elevationNote: z.string().optional(),
  summary: z.string().min(20),
  geology: z.string().optional(),
  missions: z.array(z.string()).default([]),
  hazards: z.array(z.string()).default([]),
  /** 'global' for planet-wide entries, otherwise a region id like 'jezero-crater'. */
  region: z.string(),
  sources: z.array(sourceRefSchema).min(1, { message: 'Every POI needs a source' }),
  featured: z.boolean().default(false),
})
export type PointOfInterest = z.infer<typeof poiSchema>
