import { API_BASE_URL } from "@/lib/apiClient";

/* The landing page's try-it-here conversation.
 *
 * Its own small client rather than the app's: there is no token to attach,
 * no conversation id to address, and nothing to persist. The history lives
 * in the component and is posted back each turn, which is also why signing
 * up does not inherit it - there is nothing on the server to inherit.
 */

export type GuestTurn = { role: "user" | "assistant"; content: string };

export type GuestDone = {
  text: string;
  used: number;
  budget: number;
  limit_reached: boolean;
};

const SESSION_KEY = "clardentity.guest.session";

/** The id this visitor's allowance is counted against.
 *
 *  Kept in localStorage so a reload continues the same allowance rather than
 *  granting a fresh one. Clearing storage does grant a fresh one, which is
 *  accepted: this is a demo, and the cost ceiling that actually matters is
 *  the server's.
 *
 *  Never called during render - `crypto.randomUUID()` would differ between
 *  the server and the client and take hydration with it.
 */
export function guestSessionId(): string {
  try {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const fresh = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, fresh);
    return fresh;
  } catch {
    // Private window, blocked storage: a per-tab id still works for one
    // conversation, it just will not survive a reload.
    return crypto.randomUUID();
  }
}

export type GuestHandlers = {
  onDelta: (text: string) => void;
  onDone: (done: GuestDone) => void;
  onError: (message: string) => void;
  /** The question was answered in a better-suited companion than the one
   *  selected. Fires before any text, so the banner is up while the answer
   *  is still being written rather than appearing under a finished one. */
  onSwitched?: (from: string, to: string) => void;
};

/** Ask one question. Resolves when the stream is finished. */
export async function askGuest(
  body: {
    sessionId: string;
    mode: string;
    message: string;
    history: GuestTurn[];
    smartSwitching?: boolean;
  },
  handlers: GuestHandlers,
  signal?: AbortSignal,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/guest/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: body.sessionId,
        mode: body.mode,
        message: body.message,
        history: body.history,
        smart_switching: body.smartSwitching ?? true,
      }),
      signal,
    });
  } catch {
    handlers.onError("Couldn't reach Clardentity. Check your connection and try again.");
    return;
  }

  if (!response.ok || !response.body) {
    // 503 is the demo's own daily ceiling, and is not a sign-up prompt: the
    // visitor has done nothing wrong and signing up would not help them in
    // the next minute.
    handlers.onError(
      response.status === 503
        ? "The demo is resting for today. Signing up gets you the full thing."
        : response.status === 429
          ? "That's a lot of questions at once - give it a moment."
          : "That didn't come through. Try again?",
    );
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  /* One SSE frame: lines until a blank line, with the event name and its
     data on separate lines. Parsed here rather than with EventSource because
     this is a POST and EventSource only does GET. */
  const handleFrame = (frame: string) => {
    let event = "message";
    const data: string[] = [];
    for (const line of frame.split("\n")) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) data.push(line.slice(5).trim());
    }
    if (!data.length) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(data.join("\n"));
    } catch {
      return;
    }
    if (event === "delta") handlers.onDelta((parsed as { text: string }).text);
    else if (event === "done") handlers.onDone(parsed as GuestDone);
    else if (event === "switched") {
      const { from, to } = parsed as { from: string; to: string };
      handlers.onSwitched?.(from, to);
    } else if (event === "error") handlers.onError((parsed as { detail: string }).detail);
  };

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      // Normalised first: sse-starlette ends every frame with CRLF CRLF, so
      // splitting on a bare blank line finds nothing and the whole stream
      // arrives as one frame that is never parsed.
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
      let split = buffer.indexOf("\n\n");
      while (split !== -1) {
        handleFrame(buffer.slice(0, split));
        buffer = buffer.slice(split + 2);
        split = buffer.indexOf("\n\n");
      }
    }
  } catch {
    // An aborted read is the user closing the demo, not a failure.
    if (!signal?.aborted) handlers.onError("The answer stopped partway. Try again?");
  }
}
