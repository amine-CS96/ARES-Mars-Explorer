import type { DataKind, DatasetStatus } from '@/types/dataset'
import type { CoordinateAccuracy } from '@/types/geo'
import type { PhaseStatus } from '@/data/program'
import type { PoICategory } from '@/types/poi'
import { Badge } from '@/components/ui/badge'

/**
 * The transparency vocabulary (docs/DESIGN_SYSTEM.md §5). These badges are how ARES keeps real
 * vs. derived vs. simulated vs. fiction unmistakable everywhere in the UI.
 */

const KIND_META: Record<DataKind, { label: string; variant: 'cyan' | 'outline' | 'default' | 'warning' }> = {
  live: { label: 'Live', variant: 'cyan' },
  static: { label: 'Static', variant: 'outline' },
  snapshot: { label: 'Snapshot', variant: 'outline' },
  derived: { label: 'Derived', variant: 'default' },
  simulated: { label: 'Simulated', variant: 'warning' },
  portal: { label: 'Portal', variant: 'outline' },
}

export function DataKindBadge({ kind }: { kind: DataKind }) {
  const meta = KIND_META[kind]
  return <Badge variant={meta.variant}>{meta.label}</Badge>
}

const ACCURACY_META: Record<
  CoordinateAccuracy,
  { label: string; variant: 'success' | 'warning' | 'neutral' }
> = {
  verified: { label: 'Verified', variant: 'success' },
  approximate: { label: 'Approximate', variant: 'warning' },
  illustrative: { label: 'Illustrative', variant: 'neutral' },
}

export function AccuracyBadge({ accuracy }: { accuracy: CoordinateAccuracy }) {
  const meta = ACCURACY_META[accuracy]
  return <Badge variant={meta.variant}>{meta.label}</Badge>
}

const STATUS_META: Record<
  DatasetStatus,
  { label: string; variant: 'success' | 'warning' | 'outline' }
> = {
  available: { label: 'Available', variant: 'success' },
  'pending-verification': { label: 'Pending check', variant: 'warning' },
  planned: { label: 'Planned', variant: 'outline' },
}

export function DatasetStatusBadge({ status }: { status: DatasetStatus }) {
  const meta = STATUS_META[status]
  return <Badge variant={meta.variant}>{meta.label}</Badge>
}

const PHASE_META: Record<PhaseStatus, { label: string; variant: 'success' | 'default' | 'outline' }> = {
  done: { label: 'Done', variant: 'success' },
  active: { label: 'Active', variant: 'default' },
  planned: { label: 'Planned', variant: 'outline' },
}

export function PhaseBadge({ status }: { status: PhaseStatus }) {
  const meta = PHASE_META[status]
  return <Badge variant={meta.variant}>{meta.label}</Badge>
}

const CATEGORY_LABELS: Record<PoICategory, string> = {
  'landing-site': 'Landing site',
  mission: 'Mission site',
  geology: 'Geology',
  region: 'Region',
  fiction: 'Fiction',
}

export function CategoryBadge({ category }: { category: PoICategory }) {
  return <Badge variant="neutral">{CATEGORY_LABELS[category]}</Badge>
}

export function FictionBadge() {
  return <Badge variant="outline" className="border-dashed">Fiction</Badge>
}
