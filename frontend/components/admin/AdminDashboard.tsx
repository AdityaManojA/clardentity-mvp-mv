"use client";

import { useCallback, useEffect, useState } from "react";
import { ErrorBoundary } from "@/components/system/ErrorBoundaries";
import { apiFetch } from "@/lib/apiClient";
import { authErrorMessage, useAuth } from "@/lib/auth";
import { BarChart, DonutChart, LineChart, formatTokens, type Slice } from "@/components/admin/Charts";
import { cx } from "@/components/ui/primitives";

type UserRow = {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  last_active_at: string | null;
  location: string | null;
  accepted_terms: boolean;
  onboarded: boolean;
  preview_unlocked: boolean;
  questions_asked: number;
  answers: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
};

type Bucket = { label: string; tokens: number };

type Overview = {
  generated_at: string;
  window_days: number;
  user_count: number;
  active_user_count: number;
  conversation_count: number;
  answer_count: number;
  turns_without_usage: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  users: UserRow[];
  by_day: Bucket[];
  by_mode: Bucket[];
  by_model: Bucket[];
};

type Source = "database" | "analytics";

type QueryResult = {
  question: string;
  sql: string;
  explanation: string;
  chart: "table" | "bar" | "pie" | "line";
  label_column: string | null;
  value_column: string | null;
  columns: string[];
  rows: (string | number | boolean | null)[][];
  source?: Source;
};

type PinnedView = {
  id: string;
  title: string;
  source: Source;
  query: string;
  chart: QueryResult["chart"];
  label_column: string | null;
  value_column: string | null;
  explanation: string | null;
};

type AnalyticsSlice = { label: string; value: number };

type Analytics = {
  configured: boolean;
  error: string | null;
  window_days: number;
  visitors: number;
  signed_in_visitors: number;
  events: number;
  by_day: { label: string; visitors: number; questions: number; demo_questions: number }[];
  demo_funnel: AnalyticsSlice[];
  demo_gated: AnalyticsSlice[];
  modes_picked: AnalyticsSlice[];
  questions_by_mode: AnalyticsSlice[];
  gates: AnalyticsSlice[];
  locked_modes: AnalyticsSlice[];
  upgrade_interest: AnalyticsSlice[];
  feedback: AnalyticsSlice[];
  devices: AnalyticsSlice[];
  problems: AnalyticsSlice[];
};

const SOURCE_LABEL: Record<Source, string> = {
  database: "from our database · everyone",
  analytics: "from PostHog · visitors who allowed analytics",
};

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-hairline bg-surface p-4 sm:p-5">
      <header className="mb-3">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-hairline bg-surface px-4 py-3">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-ink">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}

const shortDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "–";

/** The rows a chart draws, from the columns the query named. */
function chartRowsOf(result: QueryResult): Slice[] {
  if (result.rows.length === 0) return [];
  const labelIdx = Math.max(0, result.columns.indexOf(result.label_column ?? result.columns[0]));
  const valueIdx = Math.max(
    0,
    result.columns.indexOf(result.value_column ?? result.columns[result.columns.length - 1]),
  );
  return result.rows
    .map((r) => ({ label: String(r[labelIdx] ?? "–"), value: Number(r[valueIdx] ?? 0) }))
    .filter((s) => Number.isFinite(s.value));
}

/** One answered view - chart, table and the query behind it. Shared by the
 *  "ask" box and every pinned tile, so a pinned view looks like its answer. */
function ResultView({ result, compact = false }: { result: QueryResult; compact?: boolean }) {
  const rows = chartRowsOf(result);
  const shown = compact ? 10 : 50;
  return (
    <div className="space-y-3">
      {result.explanation && <p className="text-xs text-ink-secondary">{result.explanation}</p>}
      <ErrorBoundary where="admin-chart" label="This chart couldn't be shown.">
        {result.chart === "pie" && <DonutChart slices={rows} total={rows.reduce((a, s) => a + s.value, 0)} />}
        {result.chart === "bar" && <BarChart slices={rows} />}
        {result.chart === "line" && <LineChart points={rows} />}
      </ErrorBoundary>
      {(result.chart === "table" || !compact) && (
        <div className="scroll-slim overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="text-ink-muted">
                {result.columns.map((c) => (
                  <th key={c} className="border-b border-hairline-strong pb-2 pr-3 font-medium">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.slice(0, shown).map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className="border-b border-hairline py-1.5 pr-3 text-ink-secondary">
                      {cell === null ? "–" : String(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {result.rows.length > shown && (
        <p className="text-xs text-ink-muted">
          Showing {shown} of {result.rows.length} rows.
        </p>
      )}
      <details className="text-xs text-ink-muted">
        <summary className="cursor-pointer">The query that ran</summary>
        <pre className="mt-1.5 overflow-x-auto whitespace-pre-wrap rounded-lg bg-surface-muted p-2.5 text-xs text-ink-secondary">
          {result.sql}
        </pre>
      </details>
    </div>
  );
}

/** A bar chart that says so when there is nothing to draw yet. */
function Bars({ slices }: { slices: AnalyticsSlice[] }) {
  if (slices.length === 0) return <p className="text-xs text-ink-muted">Nothing recorded yet.</p>;
  return (
    <ErrorBoundary where="admin-chart" label="This chart couldn't be shown.">
      <BarChart slices={slices} />
    </ErrorBoundary>
  );
}

/** What visitors did in the browser, from PostHog. Its own fetch, so a
 *  PostHog that is slow or not connected never holds up the database half. */
function AnalyticsSection({ analytics }: { analytics: Analytics | "loading" | "failed" }) {
  if (analytics === "loading") {
    return (
      <Card title="Product analytics" subtitle="From PostHog">
        <p className="text-xs text-ink-muted">Asking PostHog…</p>
      </Card>
    );
  }
  if (analytics === "failed" || !analytics.configured || analytics.error) {
    const message =
      analytics === "failed"
        ? "The analytics could not be loaded."
        : !analytics.configured
          ? "Not connected yet: the backend needs POSTHOG_PROJECT_ID and POSTHOG_QUERY_KEY (a PostHog personal API key with Query: Read on the EU project)."
          : analytics.error;
    return (
      <Card title="Product analytics" subtitle="From PostHog">
        <p className="text-xs text-ink-secondary">{message}</p>
      </Card>
    );
  }
  const a = analytics;
  const signups = a.demo_funnel.find((s) => s.label === "Clicked sign up")?.value ?? 0;
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-ink">Product analytics · last {a.window_days} days</h2>
        {/* Said next to the numbers, not in a footnote: these count only the
            visitors who allowed analytics, so they are a sample, not totals.
            Totals - accounts, questions, tokens - are the database's above. */}
        <p className="mt-0.5 text-xs text-ink-muted">
          From PostHog. Counts only visitors who allowed analytics, so read these as a sample - the
          totals above come from our database.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Visitors" value={String(a.visitors)} hint={`${a.signed_in_visitors} signed in`} />
        <Stat label="Events" value={String(a.events)} />
        <Stat
          label="Demo visitors"
          value={String(a.demo_funnel[0]?.value ?? 0)}
          hint={`${a.demo_funnel[1]?.value ?? 0} asked something`}
        />
        <Stat label="Sign-ups from the demo" value={String(signups)} hint="clicked through to sign up" />
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card title="Visitors per day">
          {a.by_day.length > 0 ? (
            <ErrorBoundary where="admin-chart" label="This chart couldn't be shown.">
              <LineChart points={a.by_day.map((d) => ({ label: d.label.slice(5), value: d.visitors }))} />
            </ErrorBoundary>
          ) : (
            <p className="text-xs text-ink-muted">Nothing recorded yet.</p>
          )}
        </Card>
        <Card title="The visitor demo" subtitle="Visitors who reached each step">
          <Bars slices={a.demo_funnel} />
        </Card>
        <Card title="What demo visitors reached for" subtitle="Account-only controls tapped in the demo">
          <Bars slices={a.demo_gated} />
        </Card>
        <Card title="Companions picked by hand">
          <Bars slices={a.modes_picked} />
        </Card>
        <Card title="Questions about the question" subtitle="Gates shown before answering, by kind">
          <Bars slices={a.gates} />
        </Card>
        <Card title="Interest in paid plans" subtitle="Visitors, not taps">
          <Bars slices={a.upgrade_interest} />
          {a.locked_modes.length > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 text-xs text-ink-muted">Locked companions tapped</p>
              <Bars slices={a.locked_modes} />
            </div>
          )}
        </Card>
        <Card title="Was this helpful?">
          <Bars slices={a.feedback} />
        </Card>
        <Card title="Devices and problems">
          <Bars slices={[...a.devices, ...a.problems]} />
        </Card>
      </div>
    </section>
  );
}

export function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [source, setSource] = useState<"auto" | Source>("auto");
  const [analytics, setAnalytics] = useState<Analytics | "loading" | "failed">("loading");
  const [views, setViews] = useState<PinnedView[]>([]);
  const [viewResults, setViewResults] = useState<Record<string, QueryResult | string>>({});
  const [pinning, setPinning] = useState(false);

  const runView = useCallback((view: PinnedView) => {
    apiFetch<QueryResult>(`/admin/views/${view.id}/result`)
      .then((r) => setViewResults((prev) => ({ ...prev, [view.id]: r })))
      .catch((err) =>
        setViewResults((prev) => ({
          ...prev,
          [view.id]: authErrorMessage(err),
        })),
      );
  }, []);

  const load = useCallback(() => {
    apiFetch<Overview>("/admin/overview")
      .then(setData)
      .catch(() => setError("This account cannot open the dashboard."));
    // No reset to "loading" on Refresh: the last answer stays up until the
    // new one lands, and the effect that first calls this must not set state.
    apiFetch<Analytics>("/admin/analytics")
      .then(setAnalytics)
      .catch(() => setAnalytics("failed"));
    apiFetch<PinnedView[]>("/admin/views")
      .then((list) => {
        setViews(list);
        list.forEach(runView);
      })
      .catch(() => setViews([]));
  }, [runView]);

  useEffect(load, [load]);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || running) return;
    setRunning(true);
    setQueryError(null);
    try {
      setResult(await apiFetch<QueryResult>("/admin/query", { method: "POST", body: { question, source } }));
    } catch (err) {
      setResult(null);
      // The server's reason ("Only SELECT queries are allowed", "PostHog's
      // allowance is used up"), not the status code it came with.
      setQueryError(authErrorMessage(err));
    } finally {
      setRunning(false);
    }
  }

  /** Keep this answer on the dashboard: its query is stored and re-run each
   *  time the page opens, so the tile stays live. */
  async function pin() {
    if (!result || pinning) return;
    setPinning(true);
    try {
      const view = await apiFetch<PinnedView>("/admin/views", {
        method: "POST",
        body: {
          title: result.question,
          source: result.source ?? "database",
          query: result.sql,
          chart: result.chart,
          label_column: result.label_column,
          value_column: result.value_column,
          explanation: result.explanation || null,
        },
      });
      setViews((prev) => [...prev, view]);
      setViewResults((prev) => ({ ...prev, [view.id]: result }));
    } catch (err) {
      setQueryError(authErrorMessage(err));
    } finally {
      setPinning(false);
    }
  }

  async function unpin(view: PinnedView) {
    try {
      await apiFetch(`/admin/views/${view.id}`, { method: "DELETE" });
      setViews((prev) => prev.filter((v) => v.id !== view.id));
    } catch {
      // Left on screen; the next refresh shows the truth.
    }
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-sm text-band-low">{error}</p>
        <p className="mt-2 text-xs text-ink-muted">Signed in as {user?.email}</p>
      </div>
    );
  }
  if (!data) {
    return <p className="px-4 py-16 text-center text-sm text-ink-muted">Reading the numbers…</p>;
  }

  // The pie the client asked for: tokens by user, biggest first, with the
  // long tail gathered rather than drawn as forty invisible slivers.
  const spenders = data.users.filter((u) => u.total_tokens > 0).sort((a, b) => b.total_tokens - a.total_tokens);
  const top = spenders.slice(0, 7);
  const rest = spenders.slice(7).reduce((acc, u) => acc + u.total_tokens, 0);
  const pie: Slice[] = [
    ...top.map((u) => ({ label: u.display_name || u.email, value: u.total_tokens })),
    ...(rest > 0 ? [{ label: `${spenders.length - 7} others`, value: rest }] : []),
  ];

  return (
    // w-full min-w-0 (phone layout): this is a flex item of the shell's <main>, and without it
    // the users table's 640px minimum set the page's width - a phone scrolled
    // the whole dashboard sideways instead of just the table.
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-8 max-lg:w-full max-lg:min-w-0 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">Admin</h1>
          <p className="text-xs text-ink-muted">
            Generated {new Date(data.generated_at).toLocaleString()} · signed in as {user?.email}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="tap-area rounded-full border border-hairline px-3 py-1.5 text-xs text-ink-secondary transition-colors hover:bg-surface-hover hover:text-ink"
        >
          Refresh
        </button>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Registered" value={String(data.user_count)} hint={`${data.active_user_count} have asked something`} />
        <Stat label="Conversations" value={String(data.conversation_count)} />
        <Stat label="Answers" value={String(data.answer_count)} />
        <Stat
          label="Tokens"
          value={formatTokens(data.total_tokens)}
          hint={`${formatTokens(data.input_tokens)} in · ${formatTokens(data.output_tokens)} out`}
        />
      </div>

      {data.turns_without_usage > 0 && (
        // Said out loud rather than smoothed over: the totals above are a
        // floor, and this is exactly how far below the truth they may sit.
        <p className="rounded-lg border border-caution-border bg-caution-bg px-3 py-2 text-xs text-caution">
          {data.turns_without_usage} of {data.answer_count} answers were written before token
          metering existed and count as zero. Totals are a floor until those age out.
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card title="Tokens by user" subtitle="Share of everything spent, biggest first">
          <ErrorBoundary where="admin-chart" label="This chart couldn't be shown.">
            <DonutChart slices={pie} total={data.total_tokens} />
          </ErrorBoundary>
        </Card>
        <div className="space-y-3">
          <Card title="Tokens by mode" subtitle="Which companions cost what">
            <ErrorBoundary where="admin-chart" label="This chart couldn't be shown.">
              <BarChart slices={data.by_mode.filter((b) => b.tokens > 0).map((b) => ({ label: b.label, value: b.tokens }))} />
            </ErrorBoundary>
          </Card>
          {/* The breakdown that maps to money. "By mode" cannot see it: the
              same mode answered on the cheapest and the dearest model is
              the same bar, and the two differ by more than an order of
              magnitude now that the picker offers both. */}
          {data.by_model?.length > 0 && (
            <Card title="Tokens by model" subtitle="Every call, under the model that served it">
              <ErrorBoundary where="admin-chart" label="This chart couldn't be shown.">
                <BarChart slices={data.by_model.filter((b) => b.tokens > 0).map((b) => ({ label: b.label, value: b.tokens }))} />
              </ErrorBoundary>
            </Card>
          )}
          <Card title={`Daily usage · last ${data.window_days} days`}>
            <ErrorBoundary where="admin-chart" label="This chart couldn't be shown.">
              <LineChart points={data.by_day.map((b) => ({ label: b.label.slice(5), value: b.tokens }))} />
            </ErrorBoundary>
          </Card>
        </div>
      </div>

      <AnalyticsSection analytics={analytics} />

      <Card title="Users" subtitle={`${data.user_count} accounts`}>
        <div className="scroll-slim -mx-1 overflow-x-auto px-1">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="text-ink-muted">
                {["Email", "Joined", "Last active", "Asked", "Tokens", "Flags"].map((h) => (
                  <th key={h} className="border-b border-hairline-strong pb-2 pr-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.users.map((u) => (
                <tr key={u.id} className="align-top">
                  <td className="border-b border-hairline py-2 pr-3">
                    <span className="block truncate text-ink">{u.email}</span>
                    {u.display_name && (
                      <span className="block truncate text-xs text-ink-muted">
                        {u.display_name}
                        {u.location ? ` · ${u.location}` : ""}
                      </span>
                    )}
                  </td>
                  <td className="border-b border-hairline py-2 pr-3 text-ink-secondary">{shortDate(u.created_at)}</td>
                  <td className="border-b border-hairline py-2 pr-3 text-ink-secondary">{shortDate(u.last_active_at)}</td>
                  <td className="border-b border-hairline py-2 pr-3 tabular-nums text-ink-secondary">{u.questions_asked}</td>
                  <td className="border-b border-hairline py-2 pr-3 tabular-nums text-ink">{formatTokens(u.total_tokens)}</td>
                  <td className="border-b border-hairline py-2 pr-3">
                    <span className="flex flex-wrap gap-1">
                      {!u.accepted_terms && <Flag tone="warn">no terms</Flag>}
                      {!u.onboarded && <Flag>not onboarded</Flag>}
                      {u.preview_unlocked && <Flag tone="brand">preview</Flag>}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {views.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">Your views</h2>
            <p className="mt-0.5 text-xs text-ink-muted">
              Pinned from the questions below, and re-run every time this page opens.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {views.map((view) => {
              const outcome = viewResults[view.id];
              return (
                <section key={view.id} className="rounded-xl border border-hairline bg-surface p-4 sm:p-5">
                  <header className="mb-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-ink">{view.title}</h3>
                      <p className="mt-0.5 text-xs text-ink-muted">{SOURCE_LABEL[view.source]}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void unpin(view)}
                      className="tap-area shrink-0 rounded-full border border-hairline px-2.5 py-1 text-xs text-ink-secondary transition-colors hover:bg-surface-hover hover:text-ink"
                    >
                      Unpin
                    </button>
                  </header>
                  {outcome === undefined && <p className="text-xs text-ink-muted">Running…</p>}
                  {typeof outcome === "string" && <p className="text-xs text-band-low">{outcome}</p>}
                  {outcome && typeof outcome !== "string" && <ResultView result={outcome} compact />}
                </section>
              );
            })}
          </div>
        </section>
      )}

      <Card
        title="Ask for a view"
        subtitle="A question in English becomes one read-only query - against our database, or against PostHog's analytics. It cannot read what anyone wrote, and it cannot change anything."
      >
        <form onSubmit={ask} className="flex flex-wrap gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Which modes get used most? How many demo visitors reached for attach?"
            maxLength={500}
            className="min-w-0 flex-1 rounded-lg border border-hairline bg-surface-raised px-3 py-2 text-sm text-ink outline-none focus:border-brand-border"
          />
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as "auto" | Source)}
            aria-label="Where to look"
            className="rounded-lg border border-hairline bg-surface-raised px-2.5 py-2 text-sm text-ink outline-none focus:border-brand-border"
          >
            <option value="auto">Wherever fits</option>
            <option value="database">Our database</option>
            <option
              value="analytics"
              disabled={typeof analytics === "object" && !analytics.configured}
            >
              PostHog analytics
            </option>
          </select>
          <button
            type="submit"
            disabled={running || !question.trim()}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
          >
            {running ? "Working…" : "Show me"}
          </button>
        </form>

        {queryError && <p className="mt-3 text-xs text-band-low">{queryError}</p>}

        {result && (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-ink-muted">{SOURCE_LABEL[result.source ?? "database"]}</p>
              <button
                type="button"
                onClick={() => void pin()}
                disabled={pinning}
                className="tap-area rounded-full border border-brand-border bg-brand-soft px-3 py-1 text-xs font-medium text-brand transition-colors hover:bg-brand hover:text-white disabled:opacity-60"
              >
                {pinning ? "Pinning…" : "Pin to dashboard"}
              </button>
            </div>
            <ResultView result={result} />
          </div>
        )}
      </Card>
    </div>
  );
}

function Flag({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "warn" | "brand" }) {
  return (
    <span
      className={cx(
        "rounded border px-1.5 py-0.5 text-xs uppercase tracking-wide",
        tone === "warn" && "border-caution-border bg-caution-bg text-caution",
        tone === "brand" && "border-brand-border bg-brand-soft text-brand",
        tone === "muted" && "border-hairline bg-surface-muted text-ink-muted",
      )}
    >
      {children}
    </span>
  );
}
