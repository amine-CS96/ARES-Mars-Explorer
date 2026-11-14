import { datasets } from '@/data/datasets'
import type { DataKind, DatasetDescriptor, DatasetStatus } from '@/types/dataset'

/**
 * Typed access to the curated dataset registry (Module H). The registry itself is static and
 * zod-validated; this module exposes filtered views and the standard attribution line.
 */

export const ATTRIBUTION_LINE =
  'Imagery and elevation: NASA/JPL-Caltech, NASA/USGS Astrogeology, NASA/GSFC (MOLA), ' +
  'NASA/JPL/ASU (THEMIS), NASA/JPL/MSSS (CTX), NASA/JPL/University of Arizona (HiRISE), ' +
  'ESA/DLR/FU Berlin (Mars Express HRSC). Waypoints: NASA/JPL MMGIS.'

export const DISCLAIMER_LINE =
  'ARES is an independent educational project for NASA Space Apps 2026. It is not affiliated ' +
  'with or endorsed by NASA, and it is not an operational astronaut-safety system.'

export function allDatasets(): DatasetDescriptor[] {
  return datasets
}

export function datasetsByStatus(status: DatasetStatus): DatasetDescriptor[] {
  return datasets.filter((d) => d.status === status)
}

export function datasetsByKind(kind: DataKind): DatasetDescriptor[] {
  return datasets.filter((d) => d.kind === kind)
}

export function getDataset(id: string): DatasetDescriptor | undefined {
  return datasets.find((d) => d.id === id)
}

export function datasetCounts(): Record<DatasetStatus, number> {
  const counts: Record<DatasetStatus, number> = {
    available: 0,
    'pending-verification': 0,
    planned: 0,
  }
  for (const d of datasets) counts[d.status] += 1
  return counts
}
