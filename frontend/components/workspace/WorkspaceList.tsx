"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/apiClient";
import { authErrorMessage } from "@/lib/auth";
import { MaskIcon } from "@/components/ui/MaskIcon";
import { Spinner } from "@/components/ui/primitives";

type Workspace = {
  id: string;
  name: string;
  role: string;
  created_at: string;
};

/** "02 Oct 2026" - the design's own form, and the one that can't be read as
 *  the wrong date in either hemisphere. */
function created(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** The folder tile the design puts at the head of every row. */
function FolderTile() {
  return (
    <span className="flex size-14 shrink-0 items-center justify-center rounded-[4px] bg-[color:var(--text-muted)]">
      <MaskIcon src="/ui/nav-folder.svg" size={40} className="text-white" />
    </span>
  );
}

export function WorkspaceList() {
  const router = useRouter();
  // Set only by the sign-in and registration redirects. Arriving here from
  // anywhere else - the sidebar, a breadcrumb - means the list was asked for
  // deliberately, and skipping past it would make a second workspace
  // impossible to create once you have one.
  const autoEnter = useSearchParams().get("enter") === "1";

  const [workspaces, setWorkspaces] = useState<Workspace[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  // The design has a Create button and no form. The form it opens is a card
  // in the grid, in the place the new workspace will take - rather than a
  // dialog over the top of a list it is about to join.
  const [composing, setComposing] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  function fetchWorkspaces(): Promise<Workspace[]> {
    return apiFetch<Workspace[]>("/workspaces");
  }

  useEffect(() => {
    let cancelled = false;
    fetchWorkspaces()
      .then((data) => {
        if (cancelled) return;
        // Signing in should land you where you can ask something, not on a
        // list with one item on it. `replace` so Back returns to the page you
        // signed in from rather than bouncing through here again.
        if (autoEnter && data.length === 1) {
          router.replace(`/workspace/${data[0].id}`);
          return;
        }
        setWorkspaces(data);
      })
      .catch((err) => {
        if (!cancelled) setError(authErrorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [autoEnter, router]);

  useEffect(() => {
    if (composing) nameRef.current?.focus();
  }, [composing]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await apiFetch<Workspace>("/workspaces", {
        method: "POST",
        body: { name: name.trim() },
      });
      setName("");
      setComposing(false);
      setWorkspaces(await fetchWorkspaces());
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  return (
    // The design's gutters: 140px each side of a 1441px content frame, which
    // is what the page gets at the size it was drawn at and a proportionate
    // margin on anything narrower.
    <div className="mx-auto w-full max-w-[1441px] px-5 pb-16 pt-[69px] sm:px-10 xl:px-[140px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-medium leading-[normal] text-ink">Workspaces</h1>
          <p className="text-xl leading-[normal] text-ink-secondary">
            Keep everything for each workspace in one place.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setComposing(true)}
          className="flex h-[42px] shrink-0 items-center gap-1 rounded-[34px] bg-brand px-3 py-2 text-xl leading-[normal] text-white transition-colors hover:bg-brand-dark"
        >
          Create
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            aria-hidden="true"
            className="block size-5"
          >
            <path d="M10 4.2v11.6M4.2 10h11.6" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-band-low-border bg-band-low-bg px-3 py-2 text-sm text-band-low">
          {error}
        </div>
      )}

      {workspaces === null ? (
        <div className="flex justify-center py-16">
          <Spinner className="text-ink-muted" />
        </div>
      ) : (
        <ul className="mt-12 grid gap-4 lg:grid-cols-2">
          {composing && (
            <li>
              <form
                onSubmit={handleCreate}
                className="flex h-[113px] items-start gap-6 rounded-[12px] border border-hairline-strong p-[9px] focus-within:border-brand-border"
              >
                <FolderTile />
                <div className="min-w-0 flex-1 pt-0.5">
                  <input
                    ref={nameRef}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setName("");
                        setComposing(false);
                      }
                    }}
                    placeholder="Name this workspace"
                    aria-label="New workspace name"
                    data-field="bare"
                    className="w-full bg-transparent text-2xl leading-[normal] text-ink placeholder:text-ink-muted focus:outline-none"
                  />
                  <div className="mt-2 flex items-center gap-3 text-xs leading-[normal]">
                    <button
                      type="submit"
                      disabled={creating || !name.trim()}
                      className="rounded-full bg-brand px-3 py-1 text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {creating ? "Creating…" : "Create"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setName("");
                        setComposing(false);
                      }}
                      className="text-ink-secondary transition-colors hover:text-ink"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </li>
          )}

          {workspaces.length === 0 && !composing && (
            <li className="lg:col-span-2">
              <p className="text-xl leading-[normal] text-ink-secondary">
                No workspaces yet. Create one and everything you attach and ask
                collects inside it.
              </p>
            </li>
          )}

          {workspaces.map((ws) => (
            <li key={ws.id}>
              <Link
                href={`/workspace/${ws.id}`}
                className="flex h-[113px] items-start gap-6 rounded-[12px] border border-hairline-strong p-[9px] transition-colors hover:border-brand-border hover:bg-surface-hover"
              >
                <FolderTile />
                <span className="min-w-0 pt-0.5">
                  <span className="block truncate text-2xl leading-[normal] text-ink">
                    {ws.name}
                  </span>
                  <span className="mt-0.5 block text-xs leading-[normal] text-ink-secondary">
                    Created {created(ws.created_at)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
