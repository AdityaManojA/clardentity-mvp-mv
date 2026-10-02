"use client";

import { useRef, useState } from "react";
import { API_BASE_URL } from "@/lib/apiClient";
import { authErrorMessage, getAccessToken, refreshAccessToken } from "@/lib/auth";
import { Spinner } from "@/components/ui/primitives";
import { OutlineButton } from "@/components/profile/ProfileSection";

/* Seeding the profile from another assistant's export.
 *
 * There is no API for this - none of the three providers let a third party
 * read a user's chat history, and there is no sign that will change. What
 * they all do offer is a free data export the user requests themselves, which
 * is a better arrangement anyway: no credentials, no scraping, and the user
 * can see exactly what they are handing over before they hand it over.
 *
 * Uploaded with fetch rather than apiFetch because this is multipart, and
 * apiFetch sets a JSON content type.
 */

const WHERE_TO_GET_IT = [
  { name: "ChatGPT", path: "Settings → Data controls → Export data", file: "conversations.json" },
  { name: "Claude", path: "Settings → Privacy → Export data", file: "conversations.json" },
  { name: "Gemini", path: "takeout.google.com → My Activity", file: "MyActivity.json" },
];

type Result = { source: string; messages: number; conversations: number };

export function ImportHistory({ onImported }: { onImported?: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    setResult(null);

    const body = new FormData();
    body.append("file", file);

    async function send(token: string | null) {
      return fetch(`${API_BASE_URL}/profile/import`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body,
      });
    }

    try {
      let res = await send(getAccessToken());
      if (res.status === 401) res = await send(await refreshAccessToken());

      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(payload?.detail ?? "That file couldn't be read.");
      }
      setResult(payload as Result);
      onImported?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : authErrorMessage(err));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    // No card: on this page the section's own rule is the frame, and the
    // heading above it already says what this is for.
    <div>
      <dl className="space-y-1">
        {WHERE_TO_GET_IT.map((source) => (
          <div key={source.name} className="flex flex-wrap items-baseline gap-x-2 text-sm leading-[normal]">
            <dt className="font-medium text-ink">{source.name}</dt>
            <dd className="text-ink-secondary">
              {source.path} <span className="opacity-70">({source.file})</span>
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
          }}
        />
        <OutlineButton onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? "Reading…" : "Choose export file"}
        </OutlineButton>
        {busy && <Spinner className="h-3.5 w-3.5 text-ink-muted" />}
      </div>

      {result && (
        <p className="mt-3 text-sm leading-[normal] text-band-high">
          Imported {result.messages} of your messages from {result.source}
          {result.conversations > 0 && ` across ${result.conversations} conversations`}. Your
          profile is rebuilding now - refresh in a moment to see it.
        </p>
      )}
      {error && <p className="mt-3 text-sm leading-[normal] text-band-low">{error}</p>}
    </div>
  );
}
