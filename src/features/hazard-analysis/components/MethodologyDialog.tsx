import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { MOBILITY_PROFILES } from '@/engines/hazards/riskModel'

interface MethodologyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan/90">{title}</h3>
      <div className="space-y-1.5 text-[12px] leading-relaxed text-ink-dim">{children}</div>
    </section>
  )
}

/**
 * Methodology & data-provenance dialog. All statements describe the actual implemented pipeline
 * (see docs/DATA_SOURCES.md, docs/SCIENTIFIC_MODELS.md, docs/DECISIONS.md D-015).
 */
export function MethodologyDialog({ open, onOpenChange }: MethodologyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] w-[min(94vw,44rem)] space-y-5">
        <DialogTitle className="font-display text-lg font-bold tracking-wide text-ink">
          Analysis methodology &amp; data provenance
        </DialogTitle>

        <Section title="Elevation data">
          <p>
            <span className="font-mono text-ink">USGS Mars 2020 TRN CTX DTM Mosaic</span> —
            20 m/px, 1596 × 1512 px, equirectangular, vertical datum MOLA areoid. bbox
            77.1605°E–77.699°E, 18.211°N–18.7212°N.
          </p>
          <p>
            Fergason et al. (2020), USGS Astrogeology Science Center. DOI{' '}
            <a
              className="text-cyan underline-offset-2 hover:underline"
              href="https://doi.org/10.5066/P906QQT8"
              target="_blank"
              rel="noreferrer"
            >
              10.5066/P906QQT8
            </a>
            . Imagery: NASA Mars Trek WMTS (HiRISE/CTX orthomosaics, MOLA hillshade).
          </p>
        </Section>

        <Section title="Derived terrain layers">
          <ul className="list-disc space-y-1 pl-4">
            <li>
              <span className="text-ink">Slope</span> — Horn 3×3 finite differences on elevation,
              reported in degrees.
            </li>
            <li>
              <span className="text-ink">TRI</span> — RMS of elevation differences to window
              neighbors; <span className="text-ink">roughness</span> — local standard deviation;
              <span className="text-ink"> relief</span> — max − min, all over a 5×5 (~100 m) window.
            </li>
            <li>
              <span className="text-ink">Aspect</span> — direction of steepest descent, clockwise
              from north; −1 marks flat cells.
            </li>
            <li>
              Raster-boundary and nodata cells are excluded from derivatives and reported as
              <span className="text-ink"> unknown — never treated as safe</span>.
            </li>
          </ul>
        </Section>

        <Section title="Hazard detection">
          <ul className="list-disc space-y-1 pl-4">
            <li>
              Every cell is scored against the active mobility profile: a weighted ramp of slope,
              roughness, and relief above the profile thresholds.
            </li>
            <li>
              Severity bands (score 0–1): low &lt; 0.25 ≤ moderate &lt; 0.5 ≤ high &lt; 0.75 ≤
              critical.
            </li>
            <li>
              Cells at moderate-or-higher risk are grouped by 8-connected component analysis;
              fragments smaller than 50,000 m² (~125 cells) are discarded as DEM-resolution noise
              (decision D-015).
            </li>
          </ul>
        </Section>

        <Section title="Mobility profiles">
          <div className="space-y-2">
            {MOBILITY_PROFILES.map((p) => (
              <div key={p.id} className="rounded-lg border border-line bg-white/[0.02] p-2.5">
                <p className="text-xs font-medium text-ink">{p.name}</p>
                <p className="mt-0.5 font-mono text-[10px] text-ink-faint">
                  slope mod/steep/critical {p.slopeModerateDeg}/{p.slopeSteepDeg}/
                  {p.slopeCriticalDeg}° · roughness {p.roughnessThresholdM} m · relief{' '}
                  {p.reliefThresholdM} m · weights {p.weights.slope}/{p.weights.roughness}/
                  {p.weights.relief}
                </p>
              </div>
            ))}
            <p className="text-[11px] text-ink-faint">
              Profiles are educational planning assumptions, not official rover or NASA
              specifications. Terrain measurements (slope, roughness, relief) do not change when
              the profile changes — only the classification and weighting do.
            </p>
          </div>
        </Section>

        <Section title="Limitations">
          <ul className="list-disc space-y-1 pl-4">
            <li>
              20 m DEM resolution: individual boulders and sub-20 m obstacles are{' '}
              <span className="text-amber">not resolved</span>. Roughness is a terrain-derived
              metric, not rock detection.
            </li>
            <li>
              Outputs are planning estimates from a single CTX DTM — not certified traversability
              or flight-safety products.
            </li>
            <li>
              Cluster bounding boxes are geographic envelopes of member cells; irregular shapes are
              approximated by their extents.
            </li>
          </ul>
        </Section>

        <p className="border-t border-line pt-3 font-mono text-[10px] text-ink-faint">
          Data: NASA/JPL-Caltech/USGS/ESA/DLR/ASU/MSSS/University of Arizona
        </p>
      </DialogContent>
    </Dialog>
  )
}
