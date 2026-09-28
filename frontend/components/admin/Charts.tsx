"use client";

/* Charts drawn as SVG by hand.
 *
 * A charting library is 50-100KB for three shapes on one page that only the
 * administrator opens. These are a pie, a bar row and a sparkline; they take
 * numbers and CSS variables and nothing else, so they theme with the rest of
 * the app and ship no dependency.
 */

const PALETTE = [
  "var(--brand)",
  "#34c759",
  "#ff9f0a",
  "#af52de",
  "#5ac8fa",
  "#ff375f",
  "#ffd60a",
  "#64d2ff",
];

export function paletteColor(i: number): string {
  return PALETTE[i % PALETTE.length];
}

export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export type Slice = { label: string; value: number };

/** A donut rather than a pie: the hole carries the total, which is the number
 *  someone actually came to read. */
export function DonutChart({ slices, total }: { slices: Slice[]; total: number }) {
  const sum = slices.reduce((acc, s) => acc + s.value, 0);
  if (sum <= 0) {
    return (
      <div className="flex h-44 items-center justify-center text-xs text-ink-muted">
        Nothing recorded yet
      </div>
    );
  }
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  // Offsets computed up front rather than accumulated while rendering: a
  // variable mutated inside JSX is a render with a memory, which React's
  // rules (rightly) refuse.
  const arcs: { slice: Slice; dash: number; offset: number }[] = [];
  slices.reduce((running, slice) => {
    const dash = (slice.value / sum) * circumference;
    arcs.push({ slice, dash, offset: running });
    return running + dash;
  }, 0);

  return (
    <div className="flex flex-wrap items-center gap-5">
      <svg viewBox="0 0 180 180" className="h-44 w-44 shrink-0 -rotate-90">
        {arcs.map(({ slice, dash, offset }, i) => (
          <circle
            key={slice.label}
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke={paletteColor(i)}
            strokeWidth="26"
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={-offset}
          >
            <title>
              {`${slice.label}: ${formatTokens(slice.value)} (${Math.round((slice.value / sum) * 100)}%)`}
            </title>
          </circle>
        ))}
      </svg>
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="text-xs uppercase tracking-wide text-ink-muted">Total</p>
        <p className="text-2xl font-semibold text-ink">{formatTokens(total)}</p>
        <ul className="space-y-1 pt-1">
          {slices.map((s, i) => (
            <li key={s.label} className="flex items-center gap-2 text-xs">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ background: paletteColor(i) }}
              />
              <span className="min-w-0 flex-1 truncate text-ink-secondary">{s.label}</span>
              <span className="shrink-0 tabular-nums text-ink">{formatTokens(s.value)}</span>
              <span className="w-10 shrink-0 text-right tabular-nums text-ink-muted">
                {Math.round((s.value / sum) * 100)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function BarChart({ slices }: { slices: Slice[] }) {
  const max = Math.max(1, ...slices.map((s) => s.value));
  if (slices.length === 0) {
    return <p className="py-6 text-center text-xs text-ink-muted">Nothing to show</p>;
  }
  return (
    <ul className="space-y-2">
      {slices.map((s, i) => (
        <li key={s.label} className="space-y-1">
          <div className="flex items-baseline justify-between gap-3 text-xs">
            <span className="min-w-0 truncate text-ink-secondary">{s.label}</span>
            <span className="shrink-0 tabular-nums text-ink">{formatTokens(s.value)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full"
              style={{ width: `${(s.value / max) * 100}%`, background: paletteColor(i) }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function LineChart({ points }: { points: Slice[] }) {
  if (points.length < 2) {
    return <p className="py-6 text-center text-xs text-ink-muted">Not enough days yet</p>;
  }
  const max = Math.max(1, ...points.map((p) => p.value));
  const step = 100 / (points.length - 1);
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${i * step} ${30 - (p.value / max) * 28}`)
    .join(" ");
  return (
    <div className="space-y-1.5">
      <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-20 w-full">
        <path d={path} fill="none" stroke="var(--brand)" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="flex justify-between text-[10px] text-ink-muted">
        <span>{points[0].label}</span>
        <span>{formatTokens(max)} peak</span>
        <span>{points[points.length - 1].label}</span>
      </div>
    </div>
  );
}
