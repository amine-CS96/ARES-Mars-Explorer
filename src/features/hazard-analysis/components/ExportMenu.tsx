import { useState } from 'react'
import { Check, Download, FileJson, FileSpreadsheet } from 'lucide-react'
import { cn } from '@/utils/cn'
import {
  buildAnalysisCsv,
  buildAnalysisJson,
  downloadTextFile,
  timestampSlug,
  type AnalysisExportInput,
} from '../exportAnalysis'

interface ExportMenuProps {
  input: AnalysisExportInput | null
}

type ExportFormat = 'json' | 'csv'

/**
 * Export actions for the live analysis state. Downloads are generated from the actual computed
 * detection/profile/route data — never placeholder content.
 */
export function ExportMenu({ input }: ExportMenuProps) {
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState<ExportFormat | null>(null)

  const runExport = (format: ExportFormat) => {
    if (!input) return
    const slug = timestampSlug(input.meta.generatedAtISO)
    if (format === 'json') {
      const json = JSON.stringify(buildAnalysisJson(input), null, 2)
      downloadTextFile(`ares-hazard-analysis-${slug}.json`, json, 'application/json')
    } else {
      downloadTextFile(
        `ares-hazard-clusters-${slug}.csv`,
        buildAnalysisCsv(input.detection),
        'text/csv',
      )
    }
    setDone(format)
    setOpen(false)
    window.setTimeout(() => setDone(null), 2000)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={!input}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Export analysis"
        className={cn(
          'flex items-center gap-1.5 rounded-lg border border-line bg-white/[0.03] px-2.5 py-1.5 text-xs text-ink-dim transition-colors hover:bg-white/[0.06] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70',
          !input && 'cursor-not-allowed opacity-50',
        )}
      >
        <Download className="size-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">Export</span>
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-1 w-52 rounded-lg border border-line bg-surface p-1 shadow-panel"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => runExport('json')}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs text-ink transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70"
            >
              <FileJson className="size-3.5 text-cyan" aria-hidden="true" />
              <span className="flex-1">
                Analysis JSON
                <span className="block font-mono text-[9px] text-ink-faint">
                  provenance, thresholds, clusters
                </span>
              </span>
              {done === 'json' ? <Check className="size-3.5 text-success" aria-hidden="true" /> : null}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => runExport('csv')}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs text-ink transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70"
            >
              <FileSpreadsheet className="size-3.5 text-cyan" aria-hidden="true" />
              <span className="flex-1">
                Cluster CSV
                <span className="block font-mono text-[9px] text-ink-faint">
                  one row per detected cluster
                </span>
              </span>
              {done === 'csv' ? <Check className="size-3.5 text-success" aria-hidden="true" /> : null}
            </button>
          </div>
        </>
      ) : null}
    </div>
  )
}
