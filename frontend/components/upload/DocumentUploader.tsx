"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE_URL, apiFetch } from "@/lib/apiClient";
import { authErrorMessage, getAccessToken } from "@/lib/auth";
import { Badge, Spinner } from "@/components/ui/primitives";
import { DOCUMENT_ACCEPT } from "@/components/chat/MessageInput";
import { track } from "@/lib/analytics";

type DocumentItem = {
  id: string;
  filename: string;
  file_type: string | null;
  status: "uploading" | "processing" | "processed" | "failed";
  created_at: string;
};

const POLL_INTERVAL_MS = 2000;

/** The attachments page's body: the title row with its Upload button, and
 *  the grid of what is in the workspace.
 *
 *  The header lives here rather than in the page above because the button in
 *  it is this component's file input - the upload state (the spinner, the
 *  error) belongs to the same place as the control that starts it. */
export function DocumentUploader({
  workspaceId,
  description,
}: {
  workspaceId: string;
  description: string;
}) {
  const [documents, setDocuments] = useState<DocumentItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = useCallback((): Promise<DocumentItem[]> => {
    // Polled while anything is still processing, so never from the cache.
    return apiFetch<DocumentItem[]>(`/documents?workspace_id=${workspaceId}`, { fresh: true });
  }, [workspaceId]);

  useEffect(() => {
    let cancelled = false;
    fetchDocuments()
      .then((data) => {
        if (!cancelled) setDocuments(data);
      })
      .catch((err) => {
        if (!cancelled) setError(authErrorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [fetchDocuments]);

  // Poll while any document is still processing so status updates without a manual refresh.
  useEffect(() => {
    if (!documents || !documents.some((d) => d.status === "processing" || d.status === "uploading")) {
      return;
    }
    const interval = setInterval(() => {
      fetchDocuments()
        .then(setDocuments)
        .catch(() => {
          // transient poll failure - try again next tick
        });
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [documents, fetchDocuments]);

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);

    try {
      const form = new FormData();
      form.append("workspace_id", workspaceId);
      form.append("file", file);

      const accessToken = getAccessToken();
      track("document_uploaded", {
        extension: file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() : undefined,
        size_kb: Math.round(file.size / 1024),
      });
      const res = await fetch(`${API_BASE_URL}/documents/upload`, {
        method: "POST",
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
        body: form,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail ?? `Upload failed with status ${res.status}`);
      }

      const data = await fetchDocuments();
      setDocuments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(documentId: string) {
    try {
      await apiFetch(`/documents/${documentId}`, { method: "DELETE" });
      const data = await fetchDocuments();
      setDocuments(data);
    } catch (err) {
      setError(authErrorMessage(err));
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-medium leading-[normal] text-ink">Attachments</h1>
          <p className="text-xl leading-[normal] text-ink-secondary">{description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {uploading && <Spinner className="text-ink-muted" />}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="tap-area flex h-[42px] items-center gap-1 rounded-[34px] bg-brand px-3 py-2 text-xl leading-[normal] text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
          >
            {uploading ? "Uploading…" : "Upload"}
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="block size-5"
            >
              <path d="M10 12.5V3.6M6.6 7 10 3.6 13.4 7" />
              <path d="M3.5 12.2v2.6a1.6 1.6 0 0 0 1.6 1.6h9.8a1.6 1.6 0 0 0 1.6-1.6v-2.6" />
            </svg>
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={DOCUMENT_ACCEPT}
        onChange={handleFileSelected}
        disabled={uploading}
        aria-label="Upload a document"
        className="hidden"
      />

      {error && <p className="mt-4 text-sm text-band-low">{error}</p>}

      {documents === null ? (
        <div className="flex justify-center py-16">
          <Spinner className="text-ink-muted" />
        </div>
      ) : documents.length === 0 ? (
        <p className="mt-10 text-xl leading-[normal] text-ink-secondary">
          Nothing attached yet. What you upload here is read once and then
          available to every chat in this workspace.
        </p>
      ) : (
        // The design draws this as a wall of tiles. Ours carry what a tile
        // of a document can actually say: what kind of file it is, what it
        // is called, and whether it has been read yet.
        <ul className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {documents.map((doc) => (
            <li
              key={doc.id}
              // The design's tiles are a shade off the canvas with no border.
              // surface-sunken is the canvas itself in this palette, so they
              // were invisible; the hover wash is the one fill in the system
              // that is a step away from the background in both themes.
              className="group/tile relative flex h-[145px] flex-col justify-between rounded-[12px] bg-surface-hover p-4 transition-shadow hover:ring-1 hover:ring-hairline-strong"
            >
              <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                {extensionOf(doc.filename) || doc.file_type || "file"}
              </span>
              <span className="min-w-0">
                <span className="line-clamp-2 break-words text-sm leading-[normal] text-ink">
                  {doc.filename}
                </span>
                <span className="mt-2 block">
                  <StatusBadge status={doc.status} />
                </span>
              </span>
              {/* Hover-revealed for a mouse; always shown on a touch screen,
                  which has no hover - there it was invisible, and a phone
                  had no way to know a file could be removed. */}
              <button
                type="button"
                onClick={() => handleDelete(doc.id)}
                className="tap-target absolute right-2 top-2 inline-flex items-center justify-center rounded p-1 text-ink-muted opacity-0 transition-opacity hover:text-band-low focus-visible:opacity-100 group-hover/tile:opacity-100 pointer-coarse:opacity-100"
                aria-label={`Delete ${doc.filename}`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                  className="h-3.5 w-3.5"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/** "PDF", "DOCX" - what the tile leads with. */
function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot + 1).toUpperCase();
}

function StatusBadge({ status }: { status: DocumentItem["status"] }) {
  const tones: Record<DocumentItem["status"], "neutral" | "mid" | "high" | "low"> = {
    uploading: "neutral",
    processing: "mid",
    processed: "high",
    failed: "low",
  };
  return <Badge tone={tones[status]}>{status}</Badge>;
}
