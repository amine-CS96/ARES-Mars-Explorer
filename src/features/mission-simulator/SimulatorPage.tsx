import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Clock,
  Droplets,
  Gauge,
  Info,
  MapPin,
  Navigation,
  Radiation,
  RotateCcw,
  Route,
  Sun,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  defaultMissionConfig,
  routeSummarySchema,
  SIMULATOR_ROUTE_KEY,
  type MissionConfig,
} from '@/engines/simulation/missionConfig'
import { formatHours, marsTime, solarElevation } from '@/engines/simulation/marsTime'
import { estimateOxygen, pointOfNoReturn } from '@/engines/simulation/oxygenModel'
import { missionVerdict } from '@/engines/simulation/verdict'
import { estimateRadiation } from '@/engines/simulation/radiation'
import { KJ_PER_LITER_O2, O2_GAS_DENSITY_KG_PER_L } from '@/engines/simulation/oxygenModel'

/**
 * Module G — Marswalk mission simulator.
 *
 * Users configure an EVA (distance, elevation, suit, load, O₂, reserve) and ARES computes an
 * oxygen budget, a Mars24 local solar clock, a READY/CAUTION/NO-GO verdict, a point-of-no-return
 * estimate and a radiation context dose. Every constant is editable and every output is labeled
 * as a planning estimate, never a certified life-support verdict.
 */

const JEZERO_LAT = 18.4446
const JEZERO_LON_EAST = 77.4509
const JEZERO_LON_WEST = -JEZERO_LON_EAST

function initialConfig(): MissionConfig {
  try {
    const raw = localStorage.getItem(SIMULATOR_ROUTE_KEY)
    if (!raw) return defaultMissionConfig()
    const parsed = JSON.parse(raw) as unknown
    const route = routeSummarySchema.parse(parsed)
    localStorage.removeItem(SIMULATOR_ROUTE_KEY)
    return {
      ...defaultMissionConfig(),
      routeDistanceMeters: Math.round(route.distanceMeters),
      elevationGainMeters: Math.round(route.elevationGainMeters),
      elevationLossMeters: Math.round(route.elevationLossMeters),
      maxSlopeDegrees: Math.round(route.maxSlopeDegrees * 10) / 10,
      averageSlopeDegrees: Math.round(route.averageSlopeDegrees * 10) / 10,
      plannerTotalEnergyKJ:
        route.totalEnergyKJ != null && Number.isFinite(route.totalEnergyKJ)
          ? Math.round(route.totalEnergyKJ * 10) / 10
          : undefined,
    }
  } catch {
    return defaultMissionConfig()
  }
}

export function SimulatorPage() {
  const [config, setConfig] = useState<MissionConfig>(initialConfig)
  const [now, setNow] = useState<Date>(new Date())
  const [loadedFromRoute, setLoadedFromRoute] = useState(
    () => config.routeDistanceMeters !== defaultMissionConfig().routeDistanceMeters,
  )

  // Tick the Mars clock every second.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // Manual fallback: import a route summary if the user returns without consuming it.
  const loadRouteSummary = () => {
    try {
      const raw = localStorage.getItem(SIMULATOR_ROUTE_KEY)
      if (!raw) return false
      const route = routeSummarySchema.parse(JSON.parse(raw) as unknown)
      setConfig((prev) => ({
        ...prev,
        routeDistanceMeters: Math.round(route.distanceMeters),
        elevationGainMeters: Math.round(route.elevationGainMeters),
        elevationLossMeters: Math.round(route.elevationLossMeters),
        maxSlopeDegrees: Math.round(route.maxSlopeDegrees * 10) / 10,
        averageSlopeDegrees: Math.round(route.averageSlopeDegrees * 10) / 10,
        plannerTotalEnergyKJ:
          route.totalEnergyKJ != null && Number.isFinite(route.totalEnergyKJ)
            ? Math.round(route.totalEnergyKJ * 10) / 10
            : undefined,
      }))
      setLoadedFromRoute(true)
      localStorage.removeItem(SIMULATOR_ROUTE_KEY)
      return true
    } catch {
      return false
    }
  }

  const mars = useMemo(() => marsTime(now, JEZERO_LON_WEST, JEZERO_LAT), [now])
  const solarElev = useMemo(() => solarElevation(mars, JEZERO_LON_WEST, JEZERO_LAT), [mars])

  const oxygen = useMemo(() => estimateOxygen(config), [config])
  const verdict = useMemo(
    () => missionVerdict(oxygen, config.reserveFraction),
    [oxygen, config.reserveFraction],
  )
  const pnr = useMemo(() => pointOfNoReturn(config, oxygen), [config, oxygen])
  const radiation = useMemo(
    () => estimateRadiation(oxygen.totalDurationHours),
    [oxygen.totalDurationHours],
  )

  const updateConfig = <K extends keyof MissionConfig>(key: K, value: MissionConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="animate-fade-up">
        <p className="eyebrow mb-2">Marswalk simulator</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-bold tracking-wide text-ink sm:text-4xl">
            Marswalk Simulator
          </h1>
          <Badge variant="success">O₂ budget model</Badge>
          <Badge variant="cyan">Mars24 clock</Badge>
          <Badge variant="warning">Planning estimate</Badge>
        </div>
        <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-ink-dim">
          Configure an EVA and ARES estimates oxygen consumption, local solar time at Jezero, return
          feasibility and a READY/CAUTION/NO-GO verdict. Every number is editable and every output
          is a planning estimate — not a certified life-support decision.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-[380px_1fr]">
        {/* Left column: config */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Route className="size-4 text-cyan" aria-hidden="true" />
                  Mission config
                </CardTitle>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={loadRouteSummary}
                    className="h-7 gap-1 border-line bg-space/50 px-2 text-[10px] text-cyan hover:text-cyan"
                  >
                    Load route
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setConfig(defaultMissionConfig())
                      setLoadedFromRoute(false)
                      localStorage.removeItem(SIMULATOR_ROUTE_KEY)
                    }}
                    className="h-7 gap-1 border-line bg-space/50 px-2 text-[10px] text-ink-dim hover:text-ink"
                  >
                    <RotateCcw className="size-3" aria-hidden="true" />
                    Reset
                  </Button>
                </div>
              </div>
              {loadedFromRoute ? (
                <p className="text-[11px] text-success">
                  Imported from Route Planner. Review and adjust before simulating.
                </p>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-4">
              <ConfigGroup title="Route">
                <NumberInput
                  label="Distance"
                  value={config.routeDistanceMeters}
                  onChange={(v) => updateConfig('routeDistanceMeters', v)}
                  suffix="m"
                  min={1}
                  max={100_000}
                  step={10}
                />
                <div className="grid grid-cols-2 gap-3">
                  <NumberInput
                    label="Gain"
                    value={config.elevationGainMeters}
                    onChange={(v) => updateConfig('elevationGainMeters', v)}
                    suffix="m"
                    min={0}
                    max={20_000}
                    step={1}
                  />
                  <NumberInput
                    label="Loss"
                    value={config.elevationLossMeters}
                    onChange={(v) => updateConfig('elevationLossMeters', v)}
                    suffix="m"
                    min={0}
                    max={20_000}
                    step={1}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <NumberInput
                    label="Max slope"
                    value={config.maxSlopeDegrees}
                    onChange={(v) => updateConfig('maxSlopeDegrees', v)}
                    suffix="°"
                    min={0}
                    max={90}
                    step={1}
                  />
                  <NumberInput
                    label="Avg slope"
                    value={config.averageSlopeDegrees}
                    onChange={(v) => updateConfig('averageSlopeDegrees', v)}
                    suffix="°"
                    min={0}
                    max={90}
                    step={0.1}
                  />
                </div>
                {config.plannerTotalEnergyKJ !== undefined ? (
                  <p className="text-[11px] leading-relaxed text-ink-faint">
                    Planner energy estimate:{' '}
                    <span className="font-mono text-cyan/90">
                      {Math.round(config.plannerTotalEnergyKJ).toLocaleString('en-US')} kJ
                    </span>
                    . The simulator recomputes energy from the simplified route profile below.
                  </p>
                ) : null}
              </ConfigGroup>

              <ConfigGroup title="Astronaut & equipment">
                <NumberInput
                  label="Body + suit mass"
                  value={config.bodyMassKg}
                  onChange={(v) => updateConfig('bodyMassKg', v)}
                  suffix="kg"
                  min={30}
                  max={200}
                  step={1}
                />
                <NumberInput
                  label="Load mass"
                  value={config.loadMassKg}
                  onChange={(v) => updateConfig('loadMassKg', v)}
                  suffix="kg"
                  min={0}
                  max={200}
                  step={1}
                />
                <NumberInput
                  label="Walking speed"
                  value={config.speedMps}
                  onChange={(v) => updateConfig('speedMps', v)}
                  suffix="m/s"
                  min={0.1}
                  max={3}
                  step={0.1}
                />
              </ConfigGroup>

              <ConfigGroup title="Cost-model assumptions">
                <NumberInput
                  label="Suit penalty"
                  value={config.suitPenalty}
                  onChange={(v) => updateConfig('suitPenalty', v)}
                  suffix="×"
                  min={1}
                  max={5}
                  step={0.1}
                />
                <NumberInput
                  label="Terrain factor"
                  value={config.terrainFactor}
                  onChange={(v) => updateConfig('terrainFactor', v)}
                  suffix="×"
                  min={1}
                  max={5}
                  step={0.1}
                />
              </ConfigGroup>

              <ConfigGroup title="O₂ supply">
                <NumberInput
                  label="Tank mass"
                  value={config.oxygenTankMassKg}
                  onChange={(v) => updateConfig('oxygenTankMassKg', v)}
                  suffix="kg"
                  min={0.1}
                  max={50}
                  step={0.1}
                />
                <NumberInput
                  label="Reserve fraction"
                  value={config.reserveFraction}
                  onChange={(v) => updateConfig('reserveFraction', v)}
                  suffix="%"
                  min={0}
                  max={0.95}
                  step={0.05}
                  displayMultiplier={100}
                />
              </ConfigGroup>

              <ConfigGroup title="Stops">
                <NumberInput
                  label="Science / rest stops"
                  value={config.stopDurationMinutes}
                  onChange={(v) => updateConfig('stopDurationMinutes', v)}
                  suffix="min"
                  min={0}
                  max={600}
                  step={5}
                />
              </ConfigGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="size-4 text-cyan" aria-hidden="true" />
                Assumptions & sources
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-[11px] leading-relaxed text-ink-dim">
              <Assumption
                label="Metabolism"
                text={`Pandolf load-carriage equation adapted to Mars gravity (${(3.71 / 9.81).toFixed(3)}× Earth). Suit penalty is an engineering assumption.`}
              />
              <Assumption
                label="O₂ conversion"
                text={`${KJ_PER_LITER_O2} kJ per litre O₂ (Pandolf); gas density ${(O2_GAS_DENSITY_KG_PER_L * 1000).toFixed(3)} g/L at STP. Planning approximation.`}
              />
              <Assumption
                label="Mars time"
                text="NASA GISS Mars24 algorithm (Allison & McEwen 2000) for Jezero Crater."
              />
              <Assumption
                label="Radiation"
                text={`MSL RAD surface dose rate ${estimateRadiation(24.6229).doseMsv.toFixed(2)} mSv/sol (Hassler et al. 2014). Context only.`}
              />
              <p className="border-t border-line pt-2 text-ink-faint">
                All outputs are planning estimates. They do not certify that an EVA is safe.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right column: results */}
        <div className="space-y-4">
          {/* Verdict banner */}
          <div
            className={`panel flex items-start gap-4 border-l-4 p-5 ${
              verdict.verdict === 'ready'
                ? 'border-l-success bg-success/5'
                : verdict.verdict === 'caution'
                  ? 'border-l-amber bg-amber/5'
                  : 'border-l-danger bg-danger/5'
            }`}
          >
            <div
              className={`flex size-12 shrink-0 items-center justify-center rounded-full ${
                verdict.verdict === 'ready'
                  ? 'bg-success/15 text-success'
                  : verdict.verdict === 'caution'
                    ? 'bg-amber/15 text-amber'
                    : 'bg-danger/15 text-danger'
              }`}
            >
              {verdict.verdict === 'ready' ? (
                <Navigation className="size-6" aria-hidden="true" />
              ) : verdict.verdict === 'caution' ? (
                <AlertTriangle className="size-6" aria-hidden="true" />
              ) : (
                <Zap className="size-6" aria-hidden="true" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`font-display text-2xl font-bold tracking-wide ${
                    verdict.verdict === 'ready'
                      ? 'text-success'
                      : verdict.verdict === 'caution'
                        ? 'text-amber'
                        : 'text-danger'
                  }`}
                >
                  {verdict.label}
                </span>
                <Badge
                  variant={
                    verdict.verdict === 'ready'
                      ? 'success'
                      : verdict.verdict === 'caution'
                        ? 'warning'
                        : 'danger'
                  }
                >
                  {verdict.verdict}
                </Badge>
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-dim">{verdict.explanation}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Mars clock */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="size-4 text-cyan" aria-hidden="true" />
                  Jezero local time
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
                    True solar
                  </span>
                  <span className="font-mono text-2xl text-ink">{formatHours(mars.ltstHours)}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
                    Mean solar
                  </span>
                  <span className="font-mono text-sm text-ink-dim">
                    {formatHours(mars.lmstHours)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 border-t border-line pt-3">
                  <ClockField label="MSD" value={mars.msd.toFixed(5)} />
                  <ClockField label="Lₛ" value={`${mars.lsDegrees.toFixed(2)}°`} />
                  <ClockField label="Season" value={mars.season} />
                  <ClockField
                    label="Sun elevation"
                    value={`${solarElev.toFixed(1)}°`}
                    icon={<Sun className="size-3 text-amber" aria-hidden="true" />}
                  />
                </div>
                <p className="font-mono text-[9px] leading-relaxed text-ink-faint">
                  Site: {JEZERO_LAT.toFixed(4)}°N, {JEZERO_LON_EAST.toFixed(4)}°E (Jezero Crater).
                </p>
              </CardContent>
            </Card>

            {/* Oxygen budget */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplets className="size-4 text-cyan" aria-hidden="true" />
                  Oxygen budget
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
                    Required
                  </span>
                  <span className="font-mono text-2xl text-ink">
                    {oxygen.oxygenMassKg.toFixed(2)}
                  </span>
                  <span className="font-mono text-[10px] text-ink-faint">kg</span>
                </div>
                <div className="space-y-2 border-t border-line pt-3">
                  <BudgetRow label="Tank" value={`${oxygen.tankMassKg.toFixed(2)} kg`} />
                  <BudgetRow label="Reserve" value={`${oxygen.reserveMassKg.toFixed(2)} kg`} />
                  <BudgetRow label="Available" value={`${oxygen.availableMassKg.toFixed(2)} kg`} />
                  <BudgetRow
                    label="Remaining"
                    value={`${oxygen.remainingMassKg.toFixed(2)} kg`}
                    highlight={oxygen.remainingMassKg < 0}
                  />
                  <BudgetRow
                    label="Margin"
                    value={`${(oxygen.marginFraction * 100).toFixed(0)}%`}
                    highlight={oxygen.marginFraction < 0.1 && oxygen.marginFraction >= 0}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Duration & energy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="size-4 text-cyan" aria-hidden="true" />
                  Duration & energy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <ResultRow label="Locomotion" value={`${oxygen.locomotionHours.toFixed(2)} h`} />
                <ResultRow label="Total EVA" value={`${oxygen.totalDurationHours.toFixed(2)} h`} />
                <ResultRow label="Energy" value={`${(oxygen.totalEnergyJ / 1000).toFixed(1)} kJ`} />
                <ResultRow label="O₂ volume" value={`${oxygen.oxygenLiters.toFixed(1)} L`} />
              </CardContent>
            </Card>

            {/* Point of no return */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="size-4 text-cyan" aria-hidden="true" />
                  Point of no return
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
                    Outbound limit
                  </span>
                  <span className="font-mono text-2xl text-ink">
                    {(pnr.fraction * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="font-mono text-sm text-ink-dim">
                  {pnr.distanceMeters.toFixed(0)} m from start
                </p>
                <p className="text-[11px] leading-relaxed text-ink-faint">{pnr.reason}</p>
                <p className="border-t border-line pt-2 font-mono text-[9px] text-ink-faint">
                  Assumes the return path costs 1.2× the outbound path.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Radiation context */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radiation className="size-4 text-cyan" aria-hidden="true" />
                Radiation context
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <ResultRow
                label="EVA duration"
                value={`${radiation.evaDurationSol.toFixed(3)} sol`}
              />
              <ResultRow label="Estimated dose" value={`${radiation.doseMsv.toFixed(3)} mSv`} />
              <ResultRow
                label="Career limit"
                value={`${radiation.percentOfCareerLimit.toFixed(2)}%`}
              />
              <p className="text-[11px] leading-relaxed text-ink-faint">
                Based on MSL RAD surface measurements. ARES does not model shielding, solar-particle
                events or individual risk. Shown for context only.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <footer className="mt-8 space-y-1.5 rounded-xl border border-line bg-surface/50 p-4 text-[11px] leading-relaxed text-ink-faint">
        <p>
          <span className="font-mono uppercase tracking-wider text-cyan/90">Disclaimer</span> — This
          simulator is an educational planning aid. It is not an operational astronaut-safety system
          and must not be used for real mission go/no-go decisions.
        </p>
      </footer>
    </div>
  )
}

function ConfigGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="font-mono text-[10px] uppercase tracking-wider text-cyan/90">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function NumberInput({
  label,
  value,
  onChange,
  suffix,
  min,
  max,
  step,
  displayMultiplier = 1,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  suffix: string
  min: number
  max: number
  step: number
  displayMultiplier?: number
}) {
  const displayValue = value * displayMultiplier
  return (
    <div className="flex items-center justify-between gap-3">
      <label className="font-mono text-[10px] text-ink-dim">{label}</label>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min={min * displayMultiplier}
          max={max * displayMultiplier}
          step={step * displayMultiplier}
          value={displayValue}
          onChange={(e) => {
            const raw = Number.parseFloat(e.target.value)
            const next = Number.isNaN(raw) ? min : raw / displayMultiplier
            onChange(Math.max(min, Math.min(max, next)))
          }}
          className="w-20 rounded border border-line bg-space px-2 py-1 text-right font-mono text-xs text-ink focus:border-cyan focus:outline-none"
        />
        <span className="w-8 font-mono text-[10px] text-ink-faint">{suffix}</span>
      </div>
    </div>
  )
}

function Assumption({ label, text }: { label: string; text: string }) {
  return (
    <p>
      <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">{label}</span>{' '}
      {text}
    </p>
  )
}

function ClockField({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon?: React.ReactNode
}) {
  return (
    <div className="space-y-0.5">
      <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-ink-faint">
        {icon}
        {label}
      </span>
      <span className="block font-mono text-[11px] text-ink">{value}</span>
    </div>
  )
}

function BudgetRow({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-mono text-[10px] text-ink-dim">{label}</span>
      <span className={`font-mono text-[10px] ${highlight ? 'text-danger' : 'text-ink'}`}>
        {value}
      </span>
    </div>
  )
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-line/50 pb-1 last:border-0">
      <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">{label}</span>
      <span className="font-mono text-sm text-ink">{value}</span>
    </div>
  )
}
