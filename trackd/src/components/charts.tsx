import { useId, useState } from 'react'

/**
 * Chart palette — the reference dark-mode categorical slots, validated against
 * this app's panel surface (#151a26) for lightness band, chroma, CVD separation
 * and contrast. Do not substitute hues without re-running the validator: the
 * app's older blue/violet pairing was indistinguishable under deuteranopia.
 */
export const SERIES = {
  blue: '#3987e5',
  aqua: '#199e70',
  yellow: '#c98500',
  red: '#e66767',
  orange: '#d95926',
} as const

export const STATUS_COLORS: Record<string, string> = {
  watching: SERIES.blue,
  completed: SERIES.aqua,
  planned: SERIES.yellow,
  dropped: SERIES.red,
}

export const TYPE_COLORS: Record<string, string> = {
  movie: SERIES.blue,
  series: SERIES.orange,
  anime: SERIES.aqua,
}

const INK_MUTED = '#898781'
const GRID = '#2c2c2a'

export interface Datum { label: string; value: number; color?: string }

function useTooltip() {
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null)
  const show = (e: React.MouseEvent, text: string) => {
    const box = (e.currentTarget as SVGElement).ownerSVGElement!.getBoundingClientRect()
    setTip({ x: e.clientX - box.left, y: e.clientY - box.top, text })
  }
  const hide = () => setTip(null)
  return { tip, show, hide }
}

function Tip({ tip }: { tip: { x: number; y: number; text: string } | null }) {
  if (!tip) return null
  return (
    <div className="chart-tip" style={{ left: tip.x, top: tip.y }}>{tip.text}</div>
  )
}

/** Vertical columns for an ordered scale (rating 1–10, months). Single series. */
export function Columns({
  data, height = 150, format = (n: number) => String(n), emptyNote = 'No data yet',
}: { data: Datum[]; height?: number; format?: (n: number) => string; emptyNote?: string }) {
  const { tip, show, hide } = useTooltip()
  const max = Math.max(1, ...data.map(d => d.value))
  const total = data.reduce((a, d) => a + d.value, 0)
  if (total === 0) return <p className="chart-empty">{emptyNote}</p>

  const W = 100 / data.length
  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="chart-svg" style={{ height }}>
        <line x1="0" y1={height - 18} x2="100" y2={height - 18} stroke={GRID} strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
        {data.map((d, i) => {
          const h = (d.value / max) * (height - 30)
          const x = i * W
          return (
            <g key={d.label}>
              <rect
                x={x} y={0} width={W} height={height - 18} fill="transparent"
                onMouseMove={e => show(e, `${d.label}: ${format(d.value)}`)}
                onMouseLeave={hide}
              />
              <rect
                x={x + W * 0.18} y={height - 18 - h} width={W * 0.64} height={Math.max(h, d.value > 0 ? 1.5 : 0)}
                rx="1.2" fill={d.color ?? SERIES.blue} pointerEvents="none"
              />
            </g>
          )
        })}
      </svg>
      <div className="chart-xaxis" style={{ gridTemplateColumns: `repeat(${data.length}, 1fr)` }}>
        {data.map(d => <span key={d.label}>{d.label}</span>)}
      </div>
      <Tip tip={tip} />
    </div>
  )
}

/** Horizontal bars with direct value labels — best for ranked categories. */
export function BarsH({ data, max: maxOverride, emptyNote = 'No data yet' }:
{ data: Datum[]; max?: number; emptyNote?: string }) {
  const max = maxOverride ?? Math.max(1, ...data.map(d => d.value))
  if (!data.length || data.every(d => d.value === 0)) return <p className="chart-empty">{emptyNote}</p>
  return (
    <div className="barsh">
      {data.map(d => (
        <div key={d.label} className="barsh-row">
          <span className="barsh-label">{d.label}</span>
          <div className="barsh-track">
            <div
              className="barsh-fill"
              style={{ width: `${Math.max(2, (d.value / max) * 100)}%`, background: d.color ?? SERIES.blue }}
            />
          </div>
          <span className="barsh-value">{d.value}</span>
        </div>
      ))}
    </div>
  )
}

/**
 * Donut for part-to-whole across a few categories. Always ships a labelled
 * legend, so identity never rests on colour alone.
 */
export function Donut({ data, size = 132, centerLabel, emptyNote = 'No data yet' }:
{ data: Datum[]; size?: number; centerLabel?: string; emptyNote?: string }) {
  const { tip, show, hide } = useTooltip()
  const gid = useId()
  const total = data.reduce((a, d) => a + d.value, 0)
  if (total === 0) return <p className="chart-empty">{emptyNote}</p>

  const R = 46, STROKE = 13, C = 2 * Math.PI * R
  let offset = 0

  return (
    <div className="donut-wrap">
      <div className="chart-wrap donut-svg-wrap">
        <svg viewBox="0 0 110 110" style={{ width: size, height: size }} className="chart-svg">
          <g transform="translate(55,55) rotate(-90)">
            {data.filter(d => d.value > 0).map(d => {
              const frac = d.value / total
              // 2px surface gap between adjacent segments
              const len = Math.max(frac * C - 2, 0.5)
              const seg = (
                <circle
                  key={d.label + gid} r={R} fill="none"
                  stroke={d.color ?? SERIES.blue} strokeWidth={STROKE}
                  strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset}
                  strokeLinecap="butt"
                  onMouseMove={e => show(e, `${d.label}: ${d.value} (${Math.round(frac * 100)}%)`)}
                  onMouseLeave={hide}
                />
              )
              offset += frac * C
              return seg
            })}
          </g>
          {centerLabel && (
            <text x="55" y="59" textAnchor="middle" className="donut-center">{centerLabel}</text>
          )}
        </svg>
        <Tip tip={tip} />
      </div>
      <ul className="legend">
        {data.map(d => (
          <li key={d.label}>
            <span className="legend-swatch" style={{ background: d.color ?? SERIES.blue }} />
            <span className="legend-label">{d.label}</span>
            <span className="legend-value">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Area+line for a value over time. Single series, so no legend. */
export function TrendLine({ data, height = 130, emptyNote = 'No data yet' }:
{ data: Datum[]; height?: number; emptyNote?: string }) {
  const { tip, show, hide } = useTooltip()
  const gid = useId().replace(/:/g, '')
  const total = data.reduce((a, d) => a + d.value, 0)
  if (data.length < 2 || total === 0) return <p className="chart-empty">{emptyNote}</p>

  const max = Math.max(1, ...data.map(d => d.value))
  const W = 300, H = height - 22, PAD = 4
  const x = (i: number) => PAD + (i / (data.length - 1)) * (W - PAD * 2)
  const y = (v: number) => H - (v / max) * (H - 8)

  const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(' ')
  const area = `${line} L${x(data.length - 1).toFixed(1)},${H} L${x(0).toFixed(1)},${H} Z`

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${height}`} className="chart-svg" style={{ height }}>
        <defs>
          <linearGradient id={`g${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SERIES.blue} stopOpacity="0.35" />
            <stop offset="100%" stopColor={SERIES.blue} stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="0" y1={H} x2={W} y2={H} stroke={GRID} strokeWidth="1" />
        <path d={area} fill={`url(#g${gid})`} />
        <path d={line} fill="none" stroke={SERIES.blue} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d, i) => (
          <g key={d.label}>
            <circle cx={x(i)} cy={y(d.value)} r="3.5" fill={SERIES.blue} stroke="#151a26" strokeWidth="2" />
            <rect
              x={x(i) - (W / data.length) / 2} y={0} width={W / data.length} height={H} fill="transparent"
              onMouseMove={e => show(e, `${d.label}: ${d.value}`)} onMouseLeave={hide}
            />
          </g>
        ))}
        {data.map((d, i) => (
          i % Math.ceil(data.length / 6) === 0
            ? <text key={`t${d.label}`} x={x(i)} y={height - 6} textAnchor="middle" fill={INK_MUTED} fontSize="10">{d.label}</text>
            : null
        ))}
      </svg>
      <Tip tip={tip} />
    </div>
  )
}
