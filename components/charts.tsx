"use client";

import { useEffect, useRef, useState } from "react";
import { BarChart3, Table2 } from "lucide-react";

export type AuthRow = { domain: string; dr: number | null; ur: number | null; status: "ok" | "pending" };

const INK = "var(--foreground)";
const MUTED = "var(--muted)";
const GRID = "var(--border)";

/** Measures the container so SVG charts draw at real pixel size (text stays readable on phones). */
function useWidth(): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [w, setW] = useState(760);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(240, Math.round(e.contentRect.width))));
    ro.observe(el);
    setW(Math.max(240, Math.round(el.getBoundingClientRect().width) || 760));
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

export function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted" aria-label="Legend">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-[3px]" style={{ background: i.color }} />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

/** Chart / table switch so every chart also has an accessible table view. */
export function ChartCard({
  title,
  subtitle,
  legend,
  chart,
  table,
}: {
  title: string;
  subtitle?: string;
  legend?: React.ReactNode;
  chart: React.ReactNode;
  table: React.ReactNode;
}) {
  const [view, setView] = useState<"chart" | "table">("chart");
  return (
    <div className="card">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
        </div>
        <div role="group" aria-label="View" className="inline-flex shrink-0 rounded-lg border border-border p-0.5">
          {(
            [
              ["chart", BarChart3, "Chart"],
              ["table", Table2, "Table"],
            ] as const
          ).map(([v, Icon, label]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-xs text-muted transition-colors hover:text-foreground aria-pressed:bg-surface-2 aria-pressed:text-foreground sm:h-7 sm:px-2.5"
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </div>
      {legend && <div className="mb-3">{legend}</div>}
      {view === "chart" ? chart : table}
    </div>
  );
}

/** Grouped horizontal bars: DR and UR per domain on ONE shared axis. Narrow screens put the domain above its bars. */
export function DrUrBars({ rows }: { rows: AuthRow[] }) {
  const [ref, W] = useWidth();
  const narrow = W < 520;
  const left = narrow ? 4 : 156;
  const right = narrow ? 52 : 64;
  const top = 10;
  const barH = narrow ? 12 : 10;
  const rowH = narrow ? 68 : 46;
  const H = top + rows.length * rowH + 30;
  const maxVal = Math.max(10, ...rows.flatMap((r) => [r.dr ?? 0, r.ur ?? 0]));
  const axisMax = Math.ceil(maxVal / 5) * 5;
  const x = (v: number) => left + (v / axisMax) * (W - left - right);
  const ticks = [0, axisMax / 2, axisMax];
  const fs = narrow ? 12 : 11;

  return (
    <div ref={ref} className="w-full">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block" role="img" aria-label="DR and UR per domain, bar chart">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={top} y2={H - 24} stroke={GRID} strokeWidth={1} />
            <text x={x(t)} y={H - 8} textAnchor={t === 0 ? "start" : t === axisMax ? "end" : "middle"} fontSize={11} fill={MUTED}>
              {t}
            </text>
          </g>
        ))}
        {rows.map((r, i) => {
          const y0 = top + i * rowH;
          const y = narrow ? y0 + 24 : y0 + 8;
          const pending = r.status === "pending";
          const bars = [
            { key: "DR", v: r.dr, color: "var(--series-1)", y },
            { key: "UR", v: r.ur, color: "var(--series-2)", y: y + barH + 4 },
          ];
          return (
            <g key={r.domain}>
              {narrow ? (
                <text x={left} y={y0 + 16} fontSize={13} fill={INK} fontFamily="var(--font-mono)">
                  {r.domain}
                </text>
              ) : (
                <text x={left - 12} y={y + barH + 3} textAnchor="end" fontSize={13} fill={INK} fontFamily="var(--font-mono)">
                  {r.domain}
                </text>
              )}
              {bars.map((b) => {
                // "pending" is shown once per row (on the DR line), not twice.
                const label = pending ? (b.key === "DR" ? "pending" : "") : b.v == null ? "N/A" : String(b.v);
                const w = b.v != null && !pending ? Math.max(4, x(b.v) - x(0)) : 0;
                return (
                  <g key={b.key}>
                    <title>{`${r.domain} — ${b.key}: ${label}`}</title>
                    {w > 0 && (
                      // 4px rounded data end, flat at the baseline
                      <path
                        d={`M${x(0)},${b.y} h${Math.max(0, w - 4)} a4,4 0 0 1 4,4 v${barH - 8} a4,4 0 0 1 -4,4 h-${Math.max(0, w - 4)} z`}
                        fill={b.color}
                      />
                    )}
                    <text x={x(b.v ?? 0) + (w > 0 ? 8 : 6)} y={b.y + barH - 1} fontSize={fs} fill={w > 0 ? INK : MUTED}>
                      {label}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function DrUrTable({ rows }: { rows: AuthRow[] }) {
  const f = (v: number | null, p: boolean) => (p ? "pending" : v == null ? "N/A" : v);
  return (
    <div className="overflow-x-auto">
      <table className="tbl">
        <thead>
          <tr><th>Domain</th><th className="num">DR</th><th className="num">UR</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.domain}>
              <td className="font-[family-name:var(--font-mono)] text-[13px]">{r.domain}</td>
              <td className="num">{f(r.dr, r.status === "pending")}</td>
              <td className="num">{f(r.ur, r.status === "pending")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Dot strip on the full 0–100 DR scale, with quality bands. Narrow screens put the domain above its strip. */
export function DrScale({ rows }: { rows: AuthRow[] }) {
  const [ref, W] = useWidth();
  const narrow = W < 520;
  const left = narrow ? 8 : 156;
  const right = narrow ? 14 : 24;
  const top = 12;
  const rowH = narrow ? 44 : 28;
  const bandsH = rows.length * rowH;
  const H = top + bandsH + 44;
  const x = (v: number) => left + (v / 100) * (W - left - right);
  const bands = [
    { from: 0, to: 10, label: "New", tint: "rgba(255,92,122,0.10)" },
    { from: 10, to: 30, label: "Growing", tint: "rgba(255,184,76,0.09)" },
    { from: 30, to: 50, label: "Solid", tint: "rgba(110,168,255,0.09)" },
    { from: 50, to: 100, label: narrow ? "Strong" : "Strong (50+)", tint: "rgba(74,222,128,0.09)" },
  ];
  return (
    <div ref={ref} className="w-full">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block" role="img" aria-label="Where each domain sits on the 0 to 100 DR scale">
        {bands.map((b) => (
          <g key={b.label}>
            <rect x={x(b.from)} y={top} width={x(b.to) - x(b.from)} height={bandsH} fill={b.tint} />
            <text x={(x(b.from) + x(b.to)) / 2} y={top + bandsH + 18} textAnchor="middle" fontSize={11} fill={MUTED}>
              {b.label}
            </text>
            <text x={x(b.from)} y={top + bandsH + 34} textAnchor={b.from === 0 ? "start" : "middle"} fontSize={10} fill={MUTED}>
              {b.from}
            </text>
          </g>
        ))}
        <text x={x(100)} y={top + bandsH + 34} textAnchor="end" fontSize={10} fill={MUTED}>100</text>
        {rows.map((r, i) => {
          const y0 = top + i * rowH;
          const cy = narrow ? y0 + 30 : y0 + rowH / 2;
          const known = r.status === "ok" && r.dr != null;
          const flip = known && r.dr! > 80; // keep the value label inside the chart near the right edge
          return (
            <g key={r.domain}>
              <title>{`${r.domain} — DR ${known ? r.dr : r.status === "pending" ? "pending" : "N/A"}`}</title>
              {narrow ? (
                <text x={left} y={y0 + 14} fontSize={12.5} fill={INK} fontFamily="var(--font-mono)">
                  {r.domain}
                </text>
              ) : (
                <text x={left - 12} y={cy + 4} textAnchor="end" fontSize={13} fill={INK} fontFamily="var(--font-mono)">
                  {r.domain}
                </text>
              )}
              <line x1={x(0)} x2={x(100)} y1={cy} y2={cy} stroke={GRID} strokeWidth={1} />
              {known ? (
                <>
                  {/* 2px surface ring keeps overlapping dots readable */}
                  <circle cx={x(r.dr!)} cy={cy} r={narrow ? 7 : 6} fill="var(--series-1)" stroke="var(--surface)" strokeWidth={2} />
                  <text x={x(r.dr!) + (flip ? -12 : 12)} y={cy + 4} textAnchor={flip ? "end" : "start"} fontSize={11} fill={INK}>{r.dr}</text>
                </>
              ) : (
                <text x={x(0) + 8} y={cy + 4} fontSize={11} fill={MUTED}>{r.status === "pending" ? "pending" : narrow ? "N/A" : "N/A (no measurable DR)"}</text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
