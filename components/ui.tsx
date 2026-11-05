import { AlertOctagon, AlertTriangle, CheckCircle2, Info } from "lucide-react";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-6 sm:gap-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl leading-8 font-semibold sm:text-[28px] sm:leading-[34px]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Page({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto w-full max-w-[1280px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">{children}</main>;
}

export function StatCard({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="card">
      <div className="label">{label}</div>
      <div className="mt-2 font-[family-name:var(--font-display)] text-[28px] leading-9 font-semibold tabular-nums sm:text-[32px]">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  );
}

export function ScoreRing({ score, size = 160, stroke = 10, label }: { score: number; size?: number; stroke?: number; label?: string }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const color = score >= 90 ? "var(--accent)" : score >= 70 ? "var(--warn)" : "var(--danger)";
  const small = size < 80;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }} role="img" aria-label={`${label ?? "Score"} ${score} of 100`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle
          className="ring-arc"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - score / 100)}
          style={{ ["--ring-circ" as string]: circ }}
        />
      </svg>
      <div className="absolute text-center">
        <div className={`font-[family-name:var(--font-display)] font-semibold tabular-nums ${small ? "text-sm" : "text-5xl leading-none"}`}>{score}</div>
        {!small && <div className="mt-1 text-xs text-muted">/100</div>}
      </div>
    </div>
  );
}

const SEV = {
  error: { cls: "border-danger/30 bg-danger/15 text-danger", Icon: AlertOctagon, label: "Critical" },
  warning: { cls: "border-warn/30 bg-warn/15 text-warn", Icon: AlertTriangle, label: "Warning" },
  notice: { cls: "border-info/30 bg-info/15 text-info", Icon: Info, label: "Notice" },
  pass: { cls: "border-success/30 bg-success/15 text-success", Icon: CheckCircle2, label: "Passed" },
} as const;

export function SeverityBadge({ severity }: { severity: keyof typeof SEV }) {
  const { cls, Icon, label } = SEV[severity];
  return (
    <span className={`badge border ${cls}`}>
      <Icon size={12} /> {label}
    </span>
  );
}

export function EmptyState({ icon, title, text, action }: { icon?: React.ReactNode; title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-border-strong px-6 py-12 text-center">
      {icon && <div className="mb-3 text-muted">{icon}</div>}
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-1 max-w-md text-sm text-muted">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ title, detail, onRetry }: { title: string; detail?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="card !border-danger/40">
      <div className="font-medium text-danger">{title}</div>
      {detail && <pre className="mt-2 overflow-x-auto font-[family-name:var(--font-mono)] text-xs text-muted">{detail}</pre>}
      {onRetry && (
        <button onClick={onRetry} className="btn-ghost mt-3">
          Retry
        </button>
      )}
    </div>
  );
}

export function SiteSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="input !w-full sm:!w-auto sm:min-w-52" aria-label="Site">
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
