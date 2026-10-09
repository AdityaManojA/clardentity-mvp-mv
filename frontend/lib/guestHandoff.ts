"use client";

import { apiFetch } from "@/lib/apiClient";
import { getAccessToken } from "@/lib/auth";
import type { GuestTurn } from "@/lib/guestDemo";

/* Carrying the demo conversation into a new account.
 *
 * The demo stores nothing on the server - that is the deal, and it is in
 * the guest API's docstring. So when the visitor runs out of allowance and
 * is offered an account to keep what they wrote, the transcript has to
 * travel with them, through the one place it exists: this browser.
 *
 * It waits in localStorage across the trip to /register and the welcome
 * questions, and is posted to /guest/import the first time the app loads
 * signed in. Then it is deleted, whether or not the import worked, with one
 * exception - a request that failed for a reason that might pass on a retry
 * keeps it for the next page load, because the alternative is losing the
 * thing we promised to keep.
 */

const KEY = "clardentity.guestTranscript";

/** Long enough to survive signing up, reading the terms, checking email and
 *  coming back tomorrow. Not so long that a transcript someone abandoned
 *  last month turns up in an account they made for something else. */
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export type StashedTranscript = {
  mode: string;
  turns: GuestTurn[];
  /** Epoch ms. */
  savedAt: number;
};

export type ImportedConversation = {
  conversation_id: string;
  workspace_id: string;
  message_count: number;
};

/** Hold on to this conversation for whoever this visitor turns out to be. */
export function stashGuestTranscript(mode: string, turns: GuestTurn[]): void {
  if (turns.length === 0) return;
  try {
    const payload: StashedTranscript = { mode, turns, savedAt: Date.now() };
    window.localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    // Private window, or storage full. The offer to save silently becomes an
    // offer to sign up, which is still true and still worth making.
  }
}

export function readStashedTranscript(): StashedTranscript | null {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<StashedTranscript>;
    const turns = Array.isArray(parsed.turns) ? parsed.turns : [];
    const fresh = typeof parsed.savedAt === "number" && Date.now() - parsed.savedAt < MAX_AGE_MS;
    if (!parsed.mode || turns.length === 0 || !fresh) {
      clearStashedTranscript();
      return null;
    }
    return { mode: parsed.mode, turns: turns as GuestTurn[], savedAt: parsed.savedAt as number };
  } catch {
    // Anything unreadable is not worth a second attempt.
    clearStashedTranscript();
    return null;
  }
}

export function clearStashedTranscript(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Nothing to do, and nothing depends on it having worked: a stash that
    // cannot be removed is re-read, found to be stale within a day, and
    // dropped then.
  }
}

/* One import per page load, however many times it is asked for.
 *
 * The stash can only be cleared once the server has accepted it, so between
 * the request going out and the response coming back the stash is still
 * sitting there - and the caller is an effect, which React re-runs whenever
 * the user object changes identity and twice over in development. Four
 * copies of the same conversation appeared in the sidebar the first time
 * this was tested, which is a worse outcome than not importing at all.
 *
 * Sharing the in-flight promise collapses every concurrent caller onto one
 * request; `completed` stops a later remount starting a second one.
 */
let inFlight: Promise<ImportedConversation | null> | null = null;
let completed = false;

/* What was imported, held until somebody has actually told the user.
 *
 * The import finishes during the hop from /welcome to the first chat, so
 * the component that started it is unmounted before the promise resolves
 * and its replacement asks a module that has already marked itself done.
 * On the first production run that meant the conversation was imported
 * perfectly and nobody was told - the one outcome worse than a visible
 * failure, because the user has no reason to go looking.
 *
 * So the result outlives the component, and is handed to whichever mount
 * asks next. `announced` stops it being handed out twice.
 */
let lastResult: ImportedConversation | null = null;
let announced = false;

/** Called by whoever puts the result on screen, so the next mount does not
 *  show it again. */
export function markImportAnnounced(): void {
  announced = true;
  lastResult = null;
}

/** Write the waiting transcript into the signed-in account.
 *
 *  Returns what was created, or null when there was nothing to do. Never
 *  throws: this runs on a page the user asked for something else from, and
 *  a failed import must not be the reason their app does not load.
 */
export function importStashedTranscript(): Promise<ImportedConversation | null> {
  // Already done, but possibly not yet seen - see `lastResult`.
  if (completed) return Promise.resolve(announced ? null : lastResult);
  if (inFlight) return inFlight;
  inFlight = runImport().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function runImport(): Promise<ImportedConversation | null> {
  if (!getAccessToken()) return null;
  const stashed = readStashedTranscript();
  if (!stashed) return null;

  try {
    const result = await apiFetch<ImportedConversation>("/guest/import", {
      method: "POST",
      body: { mode: stashed.mode, turns: stashed.turns },
    });
    completed = true;
    lastResult = result;
    clearStashedTranscript();
    return result;
  } catch (error) {
    // A transcript the server will never accept - the wrong mode, too long,
    // malformed - would otherwise be retried on every page load forever.
    // Anything else (offline, a 500, a token mid-refresh) is worth another
    // go on the next load, which is why only the 4xx range clears it.
    if (isPermanentRefusal(error)) clearStashedTranscript();
    return null;
  }
}

function isPermanentRefusal(error: unknown): boolean {
  const status = (error as { status?: number } | null)?.status;
  // 401 is excluded on purpose: it means the token was not ready, not that
  // the transcript is bad, and the next load will have one.
  return typeof status === "number" && status >= 400 && status < 500 && status !== 401;
}
