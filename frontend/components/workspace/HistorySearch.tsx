"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/apiClient";
import { authErrorMessage } from "@/lib/auth";
import { modeLabel } from "@/lib/modes";
import { Spinner } from "@/components/ui/primitives";

type SearchResult = {
  message_id: string;
  conversation_id: string;
  conversation_title: string | null;
  role: string;
  content: string;
  mode_used: string;
  created_at: string;
  rank: number;
};

/** The small mark on every result, saying this came out of a chat. */
function ChatMark() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-4 shrink-0"
    >
      <path d="M2 3.2h12v8H8.8L5.6 13.6V11.2H2z" />
      <path d="M4.6 6.1h6.8M4.6 8.3h4.4" />
    </svg>
  );
}

export function HistorySearch({ workspaceId }: { workspaceId: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<SearchResult[]>(
        `/history/search?workspace_id=${workspaceId}&q=${encodeURIComponent(q)}`,
      );
      setResults(data);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    // 930px, centred: the design's column for this page, which is the search
    // box and whatever it finds and nothing else - no title above it, because
    // the breadcrumb has already said where you are.
    <div className="mx-auto w-full max-w-[930px]">
      {/* The box carries its own submit, as drawn: a 32px burgundy disc at
          the right end of a 54px card. */}
      <form
        onSubmit={handleSearch}
        className="flex h-[54px] items-center rounded-[12px] border border-hairline bg-surface-raised pl-[27px] pr-[22px] shadow-[0px_28px_61px_0px_rgba(0,0,0,0.04)] focus-within:border-brand-border"
      >
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search…"
          aria-label="Search chat history"
          data-field="bare"
          className="min-w-0 flex-1 bg-transparent text-xl leading-[normal] text-ink placeholder:text-ink-muted focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          aria-label="Search"
          className="ml-2 flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:hover:bg-brand"
        >
          {loading ? (
            <Spinner className="text-white" />
          ) : (
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              aria-hidden="true"
              className="block size-5"
            >
              {/* A waveform, as the design draws it: everything said, to
                  search through. */}
              <path d="M4 8.5v3M7 5.5v9M10 3.5v13M13 6.5v7M16 8.5v3" />
            </svg>
          )}
        </button>
      </form>

      {error && (
        <p className="mt-6 rounded-lg border border-band-low-border bg-band-low-bg px-3 py-2 text-sm text-band-low">
          {error}
        </p>
      )}

      {results !== null &&
        (results.length === 0 ? (
          <p className="mt-8 px-[17px] text-sm leading-[normal] text-ink-secondary">
            Nothing said in this workspace matches that.
          </p>
        ) : (
          <ul className="mt-3">
            {results.map((r) => (
              <li key={r.message_id}>
                <Link
                  href={`/chat/${r.conversation_id}`}
                  className="block border-b border-hairline px-[17px] py-[14px] transition-colors hover:bg-surface-hover"
                >
                  <span className="flex items-center gap-2 text-xs leading-[normal] text-ink-secondary">
                    <ChatMark />
                    <span className="min-w-0 truncate">
                      {r.conversation_title || "Untitled chat"}
                    </span>
                    {/* Who said it, and in which mode - the right end of the
                        row in the design. */}
                    <span className="ml-auto flex shrink-0 items-center">
                      <span className="font-medium text-ink">
                        {r.role === "user" ? "You" : "Companion"}
                      </span>
                      <span aria-hidden="true" className="flex size-3 items-center justify-center">
                        <span className="size-1 rounded-full bg-ink-muted" />
                      </span>
                      <span>{modeLabel(r.mode_used)}</span>
                    </span>
                  </span>
                  <p className="mt-2 line-clamp-2 text-sm leading-[normal] text-ink-secondary">
                    {r.content}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}
