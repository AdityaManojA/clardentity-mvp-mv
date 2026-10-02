"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import { useAuth } from "@/lib/auth";
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
};

type QueryResult = {
  question: string;
  sql: string;
  explanation: string;
  chart: "table" | "bar" | "pie" | "line";
  label_column: string | null;
  value_column: string | null;
  columns: string[];
  rows: (string | number | boolean | null)[][];
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

export function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);

  const load = useCallback(() => {
    apiFetch<Overview>("/admin/overview")
      .then(setData)
      .catch(() => setError("This account cannot open the dashboard."));
  }, []);

  useEffect(load, [load]);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || running) return;
    setRunning(true);
    setQueryError(null);
    try {
      setResult(await apiFetch<QueryResult>("/admin/query", { method: "POST", body: { question } }));
    } catch (err) {
      setResult(null);
      setQueryError(err instanceof Error ? err.message : "That question could not be answered.");
    } finally {
      setRunning(false);
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

  const chartRows = (() => {
    if (!result || result.rows.length === 0) return [];
    const labelIdx = Math.max(0, result.columns.indexOf(result.label_column ?? result.columns[0]));
    const valueIdx = Math.max(
      0,
      result.columns.indexOf(result.value_column ?? result.columns[result.columns.length - 1]),
    );
    return result.rows
      .map((r) => ({ label: String(r[labelIdx] ?? "–"), value: Number(r[valueIdx] ?? 0) }))
      .filter((s) => Number.isFinite(s.value));
  })();

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-8 sm:px-6">
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
          className="rounded-full border border-hairline px-3 py-1.5 text-xs text-ink-secondary transition-colors hover:bg-surface-hover hover:text-ink"
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

      <div className="grid gap-3 lg:grid-cols-2">
        <Card title="Tokens by user" subtitle="Share of everything spent, biggest first">
          <DonutChart slices={pie} total={data.total_tokens} />
        </Card>
        <div className="space-y-3">
          <Card title="Tokens by mode" subtitle="Which companions cost what">
            <BarChart slices={data.by_mode.filter((b) => b.tokens > 0).map((b) => ({ label: b.label, value: b.tokens }))} />
          </Card>
          <Card title={`Daily usage · last ${data.window_days} days`}>
            <LineChart points={data.by_day.map((b) => ({ label: b.label.slice(5), value: b.tokens }))} />
          </Card>
        </div>
      </div>

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

      <Card
        title="Ask for a view"
        subtitle="A question in English becomes one read-only query. It cannot read what anyone wrote, and it cannot change anything."
      >
        <form onSubmit={ask} className="flex flex-wrap gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Which modes get used most? How many signed up each day?"
            maxLength={500}
            className="min-w-0 flex-1 rounded-lg border border-hairline bg-surface-raised px-3 py-2 text-sm text-ink outline-none focus:border-brand-border"
          />
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
            <p className="text-xs text-ink-secondary">{result.explanation}</p>
            {result.chart === "pie" && <DonutChart slices={chartRows} total={chartRows.reduce((a, s) => a + s.value, 0)} />}
            {result.chart === "bar" && <BarChart slices={chartRows} />}
            {result.chart === "line" && <LineChart points={chartRows} />}
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
                  {result.rows.slice(0, 50).map((row, i) => (
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
            {result.rows.length > 50 && (
              <p className="text-xs text-ink-muted">Showing 50 of {result.rows.length} rows.</p>
            )}
            <details className="text-xs text-ink-muted">
              <summary className="cursor-pointer">The query that ran</summary>
              <pre className="mt-1.5 overflow-x-auto rounded-lg bg-surface-muted p-2.5 text-xs text-ink-secondary">
                {result.sql}
              </pre>
            </details>
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
