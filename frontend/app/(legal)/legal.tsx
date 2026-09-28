import type { ReactNode } from "react";

/** Shared typography for the two legal documents, so they read as one pair
 *  rather than two pages that happen to be near each other. */
export function LegalPage({
  title,
  updated,
  version,
  intro,
  children,
}: {
  title: string;
  updated: string;
  version: string;
  intro: ReactNode;
  children: ReactNode;
}) {
  return (
    <article className="space-y-6">
      <header className="space-y-2 border-b border-hairline pb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h1>
        <p className="text-xs text-ink-muted">
          Version {version} · Last updated {updated}
        </p>
        <div className="pt-2 text-sm leading-relaxed text-ink-secondary">{intro}</div>
      </header>
      <div className="space-y-6">{children}</div>
    </article>
  );
}

export function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="space-y-2.5">
      <h2 className="text-base font-semibold text-ink">
        {n}. {title}
      </h2>
      <div className="space-y-2.5 text-sm leading-relaxed text-ink-secondary">{children}</div>
    </section>
  );
}

export function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-[13px]">
        <thead>
          <tr>
            {head.map((h) => (
              <th
                key={h}
                className="border-b border-hairline-strong pb-2 pr-4 font-medium text-ink"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="align-top">
              {row.map((cell, j) => (
                <td key={j} className="border-b border-hairline py-2 pr-4 text-ink-secondary">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
