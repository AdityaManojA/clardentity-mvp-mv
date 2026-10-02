"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import { ChatRowMenu } from "@/components/chat/ChatRowMenu";
import { authErrorMessage } from "@/lib/auth";
import { modeLabel, type CognitiveMode } from "@/lib/modes";
import { Button, Spinner } from "@/components/ui/primitives";

type Workspace = {
  id: string;
  name: string;
  role: string;
  created_at: string;
  last_activity_at?: string | null;
};

/** "02 Oct" - the design's form, and all a row needs: it sits beside the
 *  mode at 12px, where a full timestamp was ~150px of a row that also has to
 *  carry a title. The exact value stays in the tooltip. */
function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

type Conversation = {
  id: string;
  title: string | null;
  default_mode: string | null;
  created_at: string;
  last_activity_at?: string | null;
  pinned?: boolean;
};

export function WorkspaceDetail({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  // Every workspace the user belongs to - the destinations a chat can be
  // moved to. Fetched with the rest; an empty list just hides the control.
  const [allWorkspaces, setAllWorkspaces] = useState<Workspace[]>([]);
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  // Bumped after a rename, pin or move so the list is re-read: a pin changes
  // the order, a move takes the row out of this workspace entirely.
  const [reloadKey, setReloadKey] = useState(0);
  const [confirmingWorkspace, setConfirmingWorkspace] = useState(false);
  const [deletingWorkspace, setDeletingWorkspace] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Which mode is being started, so only the card you clicked shows a
  // pending label. `"any"` covers the plain "New chat" button.
  const [creating, setCreating] = useState<CognitiveMode | "any" | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      apiFetch<Workspace>(`/workspaces/${workspaceId}`),
      apiFetch<Conversation[]>(`/chat/conversations?workspace_id=${workspaceId}`),
      apiFetch<Workspace[]>("/workspaces").catch(() => [] as Workspace[]),
    ])
      .then(([ws, convs, all]) => {
        if (cancelled) return;
        setWorkspace(ws);
        setConversations(convs);
        setAllWorkspaces(all);
      })
      .catch((err) => {
        if (!cancelled) setError(authErrorMessage(err));
      });

    return () => {
      cancelled = true;
    };
  }, [workspaceId, reloadKey]);

  async function handleNewConversation(mode?: CognitiveMode) {
    if (creating) return;
    setCreating(mode ?? "any");
    setError(null);
    try {
      const conv = await apiFetch<Conversation>("/chat/conversations", {
        method: "POST",
        body: { workspace_id: workspaceId, default_mode: mode ?? null },
      });
      router.push(`/chat/${conv.id}`);
    } catch (err) {
      setError(authErrorMessage(err));
      setCreating(null);
    }
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <div className="rounded-lg border border-band-low-border bg-band-low-bg px-3 py-2 text-sm text-band-low">
          {error}
        </div>
      </div>
    );
  }

  /** The row menu has already deleted it; drop it from the list. */
  function forgetConversation(id: string) {
    setConversations((prev) => (prev ?? []).filter((c) => c.id !== id));
  }

  async function handleDeleteWorkspace() {
    setDeletingWorkspace(true);
    setError(null);
    try {
      await apiFetch(`/workspaces/${workspaceId}`, { method: "DELETE" });
      // The list page re-provisions a workspace on sign-in if this was the
      // last one, so there is always somewhere to land.
      router.replace("/workspace");
    } catch (err) {
      setError(authErrorMessage(err));
      setDeletingWorkspace(false);
      setConfirmingWorkspace(false);
    }
  }

  if (!workspace || conversations === null) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Spinner className="text-ink-muted" />
      </div>
    );
  }

  return (
    // The same frame as the workspace list: a 1441px page with 140px gutters
    // at the size the design was drawn at.
    <div className="mx-auto w-full max-w-[1441px] px-5 pb-16 pt-[69px] sm:px-10 xl:px-[140px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-4xl font-medium leading-[normal] text-ink">
            {workspace.name}
          </h1>
          <p className="text-xl leading-[normal] text-ink-secondary">
            Attachments added here ground every answer in this workspace.
          </p>
        </div>
        {/* "Create" on this page means a chat in this workspace - the one
            thing you came here to do. */}
        <button
          type="button"
          data-tour="new-chat"
          onClick={() => handleNewConversation()}
          disabled={creating !== null}
          className="flex h-[42px] shrink-0 items-center gap-1 rounded-[34px] bg-brand px-3 py-2 text-xl leading-[normal] text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
        >
          {creating === "any" ? "Creating…" : "Create"}
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

      {/* The mode cards used to open this page - six tiles asking you to pick
          a cognitive stance before you had a question. The mode belongs to the
          message, not to the workspace, and is chosen in the composer where you
          can see what you're asking; attachments and search moved to the
          sidebar, where navigation lives. What's left is the one thing you came
          here to do and the list of what you did before. */}
      {conversations.length === 0 ? (
        <p className="mt-10 text-xl leading-[normal] text-ink-secondary">
          No chats in this workspace yet. Create one and it collects here.
        </p>
      ) : (
        <ul className="mt-8 space-y-3" data-tour="chat-list">
          {conversations.map((conv) => (
            // The row is a link and the menu is a button, so they can't nest -
            // a <button> inside an <a> is invalid and swallows the click on
            // whichever browser feels like it.
            <li
              key={conv.id}
              className="flex h-12 items-center rounded-[8px] border border-hairline pr-2 transition-colors hover:border-brand-border hover:bg-surface-hover"
            >
              <Link
                href={`/chat/${conv.id}`}
                className="flex h-full min-w-0 flex-1 items-center gap-2 px-5"
              >
                {conv.pinned && (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-label="Pinned"
                    className="h-3.5 w-3.5 shrink-0 text-brand"
                  >
                    <path d="M9 4h6l-1 5 3 3v2H7v-2l3-3-1-5Z" />
                    <path d="M12 14v6" />
                  </svg>
                )}
                <span className="truncate text-xl leading-[normal] text-ink-secondary">
                  {conv.title || "Untitled chat"}
                </span>
                {/* Pushed to the right end of the row: when it was last
                    touched, and which companion answered in it. */}
                <span className="ml-auto flex shrink-0 items-center text-xs leading-[normal]">
                  <span
                    className="text-ink-secondary"
                    title={new Date(conv.last_activity_at ?? conv.created_at).toLocaleString()}
                  >
                    {shortDate(conv.last_activity_at ?? conv.created_at)}
                  </span>
                  {conv.default_mode && (
                    <>
                      <span aria-hidden="true" className="flex size-3 items-center justify-center">
                        <span className="size-1 rounded-full bg-ink-muted" />
                      </span>
                      <span className="max-w-[9rem] truncate text-ink">
                        {modeLabel(conv.default_mode)}
                      </span>
                    </>
                  )}
                </span>
              </Link>
              <ChatRowMenu
                conversationId={conv.id}
                title={conv.title}
                pinned={Boolean(conv.pinned)}
                workspaceId={workspaceId}
                workspaces={allWorkspaces}
                onChanged={() => setReloadKey((n) => n + 1)}
                onDeleted={() => forgetConversation(conv.id)}
              />
            </li>
          ))}
        </ul>
      )}

      {workspace.role === "owner" && (
        // Owners only - a member leaving isn't the same operation and isn't
        // offered here. Everything in the workspace goes with it: chats,
        // attachments, memory. Same two-click confirm as every other delete.
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-hairline px-5 py-3">
          <div>
            <p className="text-sm font-medium text-ink">Delete this workspace</p>
            <p className="text-xs text-ink-muted">
              Removes every chat and attachment in it. This can&apos;t be undone.
            </p>
          </div>
          {confirmingWorkspace ? (
            <Button
              variant="danger"
              autoFocus
              onBlur={() => !deletingWorkspace && setConfirmingWorkspace(false)}
              onClick={handleDeleteWorkspace}
              disabled={deletingWorkspace}
            >
              {deletingWorkspace ? "Deleting…" : "Sure? Delete workspace"}
            </Button>
          ) : (
            <Button variant="danger" onClick={() => setConfirmingWorkspace(true)}>
              Delete workspace
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
