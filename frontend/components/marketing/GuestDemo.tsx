"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { askGuest, guestSessionId, type GuestTurn } from "@/lib/guestDemo";
import { stashGuestTranscript } from "@/lib/guestHandoff";
import { track } from "@/lib/analytics";
import { cx } from "@/components/ui/primitives";
import { MessageInput } from "@/components/chat/MessageInput";
import { MessageList, type StreamingMessage } from "@/components/chat/MessageList";
import { ModeSelector, type CognitiveMode } from "@/components/chat/ModeSelector";
import type { ChatMessage } from "@/lib/sse";

/* Try it here, without signing up.
 *
 * The stage on the landing page is a picture of the product until you click
 * it, at which point it becomes the product. It grows out of the box that
 * was clicked rather than appearing over it - the curtain is the same
 * curtain, in the same place, and only the frame around it changes - because
 * the thing being demonstrated is that the box you were watching is real.
 *
 * Which is why this now renders the app's own components rather than a
 * sketch of them. It used to be a textarea and two paragraph styles that
 * resembled the product; the first thing anyone asked for was the actual
 * interface - "all input options like call, mic and text icons, new chat" -
 * and the honest way to show those is to mount the real composer and the
 * real message list. They are prop-driven, so this costs almost nothing and
 * cannot drift: a change to the composer lands here the same day it lands in
 * the app, because it is the same file.
 *
 * The theme is how the curtain survives that. `data-theme="dark"` is stamped
 * on this panel rather than on :root, so the app's dark tokens apply to
 * everything inside it and nothing outside it - the page behind stays light,
 * and the chat surfaces sit on the photograph the way the design intends.
 *
 * Then the lights go down. While it is still an invitation the curtain is
 * lit, as on the page; once a question has been asked it is a conversation,
 * and a bright photograph behind a paragraph of text is a photograph you are
 * reading through. The fade is the moment the demo stops advertising and
 * starts working.
 *
 * It ends at 5,000 tokens with the way in, which the server decides - the
 * client shows the wall on the server's number rather than counting for
 * itself, because the only count that is true is the one that was charged.
 */

const DARK = "#1a0710"; // the house burgundy, with the lights down

type Phase = "inviting" | "talking" | "spent";

/** What a guest pressed that needs an account. The copy is per-control
 *  because "sign up to continue" under a microphone tells someone nothing
 *  about what they would get. */
const GATE_COPY: Record<string, { title: string; body: string }> = {
  call: {
    title: "Live calls need an account",
    body: "Talk to any companion out loud, interrupt it mid-sentence, and keep the transcript in the conversation afterwards.",
  },
  voice: {
    title: "Dictation needs an account",
    body: "Speak a question instead of typing it. It lands in the box as text, so you can read it back before you ask.",
  },
  attach: {
    title: "Attachments need an account",
    body: "Put a PDF, spreadsheet, slide deck or image in front of a companion, and ask about it for as long as the workspace lives.",
  },
  model: {
    title: "Choosing a model needs an account",
    body: "Pick the model by name in Learning and Co-Creative, or let Clardentity route each question to whichever tier suits it.",
  },
};

/** A companion's display name, for the switch banner. */
function labelOf(
  modes: readonly { name: string; value: string }[],
  value: string,
): string {
  return modes.find((m) => m.value === value)?.name ?? value;
}

/** One guest turn, shaped as the message the real list renders.
 *
 *  Everything the app knows and the demo does not is null, which the list
 *  already handles - those fields are null on plenty of real messages too
 *  (anything generated before a given feature shipped), so this is an
 *  ordinary message rather than a special case the list has to learn. */
function asMessage(turn: GuestTurn, index: number, mode: string): ChatMessage {
  return {
    id: `guest-${index}`,
    role: turn.role,
    content: turn.content,
    mode_used: mode,
    reasoning_lens: null,
    confidence_score: null,
    confidence_band: null,
    avatar_expression: null,
    avatar_gesture: null,
    created_at: new Date().toISOString(),
    counterfactual_content: null,
    crux_text: null,
    clarifier: null,
    guidance: null,
    decision_review: null,
    thinking_review: null,
    generated_image: null,
    feedback: null,
    parent_id: null,
    sibling_index: 0,
    sibling_count: 1,
    sibling_ids: [`guest-${index}`],
    claims: [],
  };
}

/** Mounted only while it is open: the parent renders it conditionally, so
 *  every piece of state here - the conversation, the growth, the lights -
 *  starts fresh and nothing has to be reset on the way out. */
export function GuestDemo({
  origin,
  modes,
  initialMode,
  onClose,
}: {
  /** Where the stage was on screen when it was clicked, so the panel can
   *  grow out of it. Null means "no idea" - then it just fades in. */
  origin: DOMRect | null;
  modes: readonly { name: string; value: string; heroIcon: string }[];
  /** Whichever companion was lit when the box was clicked. */
  initialMode: string;
  onClose: () => void;
}) {
  /* Switchable, and it has to be. The mode arrives from whatever the stage
     happened to be cycling through, so a visitor who clicks during Reflect &
     Relieve and asks a factual question gets a polite refusal - correct
     behaviour for that companion, and a terrible first impression of the
     product. Carrying the lit mode across is the nice touch; being able to
     change it is what makes the touch safe. */
  const [mode, setMode] = useState(initialMode);
  const modeLabel = modes.find((m) => m.value === mode)?.name ?? "Finder";
  const [turns, setTurns] = useState<GuestTurn[]>([]);
  const [draft, setDraft] = useState("");
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("inviting");
  const [grown, setGrown] = useState(false);
  const [gate, setGate] = useState<string | null>(null);
  /* Smart switching, as in the app and on by default. The demo used to have
     neither the control nor anything behind it: a visitor who asked Finder
     something that belonged in Reflect & Relieve got it answered in Finder,
     where a signed-in user would have been moved. */
  const [smartSwitching, setSmartSwitching] = useState(true);
  const [switchedFrom, setSwitchedFrom] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /* The growth. The panel is positioned at the stage's own rectangle for one
     frame and then released to fill the screen, which is the whole of the
     "zoom" - no measuring of the destination, because the destination is the
     viewport.

     The division by `zoom` is not optional. This page is drawn at 85% via a
     `zoom` on the root element, so getBoundingClientRect answers in screen
     pixels while `position: fixed` offsets are read as layout pixels. Using
     the rect unconverted puts the panel 15% off, in both axes, every time. */
  useEffect(() => {
    // One frame at the stage's rectangle, then released to fill the screen.
    const frame = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, streamingText]);

  useEffect(() => {
    // After the growth, not during it - focusing mid-transition scrolls the
    // panel to the caret and fights the animation.
    const t = setTimeout(() => inputRef.current?.focus(), 420);
    return () => clearTimeout(t);
  }, []);

  const send = useCallback(
    async (content: string) => {
      const message = content.trim();
      if (!message || streamingText !== null) return;

      setDraft("");
      setError(null);
      setPhase((p) => (p === "inviting" ? "talking" : p));
      const history = turns;
      setTurns([...history, { role: "user", content: message }]);
      setStreamingText("");
      setSwitchedFrom(null);
      track("guest_demo_asked", { mode });

      const controller = new AbortController();
      abortRef.current = controller;
      let text = "";

      await askGuest(
        { sessionId: guestSessionId(), mode, message, history, smartSwitching },
        {
          onDelta: (chunk) => {
            text += chunk;
            setStreamingText(text);
          },
          onSwitched: (from, to) => {
            // Before any text, so the banner is up while the answer is
            // being written rather than appearing under a finished one.
            setSwitchedFrom(from);
            setMode(to);
            track("guest_demo_mode_switched", { from, to });
          },
          onDone: (done) => {
            setStreamingText(null);
            if (done.text) setTurns((prev) => [...prev, { role: "assistant", content: done.text }]);
            if (done.limit_reached) {
              setPhase("spent");
              track("guest_demo_limit");
              // Stashed at the wall, not at the click on "create an
              // account": by then this component is unmounting and the
              // transcript it holds is the only copy there has ever been.
              setTurns((prev) => {
                stashGuestTranscript(mode, prev);
                return prev;
              });
            }
          },
          onError: (detail) => {
            setStreamingText(null);
            setError(detail);
          },
        },
        controller.signal,
      );
    },
    [streamingText, turns, mode, smartSwitching],
  );

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  /* Start again. The budget is the server's and survives this, which is the
     point of showing it: a new chat is free, the allowance is not, and
     finding that out here is better than finding it out after signing up. */
  const newChat = useCallback(() => {
    abortRef.current?.abort();
    setTurns([]);
    setStreamingText(null);
    setDraft("");
    setError(null);
    setGate(null);
    setPhase((p) => (p === "spent" ? p : "inviting"));
    track("guest_demo_new_chat");
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const messages = useMemo(
    () => turns.map((turn, i) => asMessage(turn, i, mode)),
    [turns, mode],
  );
  const streaming: StreamingMessage | null =
    streamingText === null ? null : { mode_used: mode, content: streamingText };

  const zoom = typeof window === "undefined" ? 1 : Number(getComputedStyle(document.documentElement).zoom) || 1;
  const start: React.CSSProperties =
    origin && !grown
      ? {
          top: origin.top / zoom,
          left: origin.left / zoom,
          width: origin.width / zoom,
          height: origin.height / zoom,
          borderRadius: 14.44,
        }
      : { top: 0, left: 0, width: "100%", height: "100%", borderRadius: 0 };

  const lightsDown = phase !== "inviting";
  const gateCopy = gate ? GATE_COPY[gate] : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Try Clardentity in ${modeLabel} mode`}
      /* The app's dark tokens, scoped to this panel. Everything below is the
         product's own component in the product's own theme; the page behind
         this one stays light. */
      data-theme="dark"
      className="fixed z-50 overflow-hidden transition-all duration-[460ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{ ...start, background: DARK }}
    >
      {/* The same photograph, in the same crop - it is the point of growing
          out of the stage rather than opening over it. */}
      <Image
        src="/landing/curtain-stage.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className={cx(
          "object-cover transition-opacity duration-700",
          lightsDown ? "opacity-[0.18]" : "opacity-100",
        )}
      />
      {/* The lights going down: one veil, deepening, rather than swapping
          one background for another. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          background: `linear-gradient(to bottom, rgba(26,7,16,0.55), ${DARK})`,
          opacity: lightsDown ? 1 : 0.35,
        }}
      />

      {/* The chrome the app puts at the top of a thread, in the order it puts
          it: start again on the left, close on the right. */}
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        <button
          type="button"
          onClick={newChat}
          disabled={streamingText !== null || turns.length === 0}
          aria-label="New chat"
          title="New chat"
          className="flex h-9 items-center gap-1.5 rounded-full bg-white/10 px-3 text-sm text-white/80 transition-colors hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" aria-hidden="true" className="size-4">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New chat
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close the demo"
          className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" aria-hidden="true" className="size-5">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="relative flex h-full w-full flex-col items-center px-4 pb-6 pt-16 sm:px-8">
        <div className="flex w-full max-w-[760px] flex-1 flex-col overflow-hidden">
          {phase === "inviting" && turns.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <p className="text-2xl font-medium text-white sm:text-3xl">
                Hi, Welcome to Clardentity.
              </p>
              {/* Which companion is listening, and nothing about not having
                  an account - the way in is already on the screen, and
                  leading with what the visitor lacks is a strange way to
                  open. */}
              <p className="mt-2 text-sm text-white/70">You&apos;re in {modeLabel}.</p>
            </div>
          ) : (
            <div ref={scrollRef} className="flex-1 overflow-y-auto pr-1">
              {/* The app's own list. Every callback it takes is optional and
                  none are passed: regenerating, branching, editing and
                  deleting all write to a conversation that does not exist
                  for a guest, so those controls are simply absent rather
                  than present and broken.

                  The empty conversation id is the same statement, and the
                  list already reads it that way - it is what the rating
                  widget, the export menu and the Devil's Draft fetch are
                  each guarded on. A guest has no conversation to rate a
                  message in, and "guest-demo" put all three on screen
                  pointed at a row that does not exist. */}
              <MessageList
                conversationId=""
                messages={messages}
                streaming={streaming}
              />
              {error && <p className="mt-4 text-sm text-[#ff9db4]">{error}</p>}
            </div>
          )}

          {phase === "spent" ? (
            <div className="mt-6 rounded-2xl border border-white/15 bg-white/[0.07] p-5 text-center">
              <p className="text-lg font-medium text-white">
                That&apos;s the preview. Don&apos;t lose it.
              </p>
              <p className="mx-auto mt-1 max-w-[48ch] text-sm leading-relaxed text-white/70">
                Create a free account and this conversation comes with you - every
                message, in your own workspace. Then keep going in any of the eight
                companions, with each claim checked against its source.
              </p>
              <Link
                href="/register"
                onClick={() => track("guest_demo_signup_clicked", { from: "limit" })}
                className="mt-4 inline-flex h-11 items-center rounded-full bg-white px-6 text-sm font-medium text-[#1a0710] transition-opacity hover:opacity-90"
              >
                Save it to a free account
              </Link>
              {/* Said plainly, because the promise above is about their
                  words and the honest version of it has a condition. */}
              <p className="mt-2 text-xs text-white/50">
                Saved when you sign up on this browser.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {/* What a guest pressed, and what it would have done. Above the
                  composer rather than over it, so the control they reached
                  for is still visible under their own hand. */}
              {gateCopy && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-white/15 bg-white/[0.07] px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white">{gateCopy.title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-white/70">{gateCopy.body}</p>
                  </div>
                  <Link
                    href="/register"
                    onClick={() => track("guest_demo_signup_clicked", { from: gate })}
                    className="inline-flex h-9 shrink-0 items-center rounded-full bg-white px-4 text-sm font-medium text-[#1a0710] transition-opacity hover:opacity-90"
                  >
                    Create a free account
                  </Link>
                  <button
                    type="button"
                    onClick={() => setGate(null)}
                    aria-label="Dismiss"
                    className="flex size-7 shrink-0 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                      strokeLinecap="round" aria-hidden="true" className="size-4">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {/* What just happened, and the way back. The app says this
                  too: a switch the user cannot see or undo is the product
                  deciding something on their behalf and not mentioning it. */}
              {switchedFrom && (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-white/15 bg-white/[0.07] px-3 py-2 text-sm text-white/80">
                  <span>
                    Switched to {labelOf(modes, mode)} - it suits this question better.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const back = switchedFrom;
                      setSwitchedFrom(null);
                      setMode(back);
                      setSmartSwitching(false);
                    }}
                    className="font-medium text-white underline-offset-4 hover:underline"
                  >
                    Stay in {labelOf(modes, switchedFrom)}
                  </button>
                </div>
              )}

              {/* The app's mode picker, not a row of pills that looks like
                  it. Nothing is locked here: the demo's whole argument is
                  that all eight are a question away. */}
              <ModeSelector
                value={mode as CognitiveMode}
                onChange={(next) => {
                  track("guest_demo_mode_picked", { mode: next });
                  setMode(next);
                }}
                disabled={streamingText !== null}
                lockedModes={[]}
              />

              {/* The product's composer, whole. */}
              <MessageInput
                disabled={false}
                value={draft}
                onChange={setDraft}
                onSend={(content) => void send(content)}
                textareaRef={inputRef}
                mode={mode}
                isGenerating={streamingText !== null}
                onStop={() => {
                  abortRef.current?.abort();
                  setStreamingText(null);
                }}
                onStartCall={() => {
                  track("guest_demo_gated", { feature: "call" });
                  setGate("call");
                }}
                gated={(feature) => {
                  track("guest_demo_gated", { feature });
                  setGate(feature);
                }}
                trailing={
                  // Same control, same place as the app: beside the model
                  // chip, with the other thing that describes how an answer
                  // gets made.
                  <button
                    type="button"
                    onClick={() => setSmartSwitching((on) => !on)}
                    disabled={streamingText !== null}
                    title={
                      smartSwitching
                        ? "A question that suits another companion is answered there, with a way back"
                        : "Questions stay in the companion you picked"
                    }
                    className="flex h-8 shrink-0 items-center rounded-lg px-1.5 text-sm leading-[normal] text-ink-secondary transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="hidden sm:inline">Switching:&nbsp;</span>
                    <span className="text-ink">{smartSwitching ? "Smart" : "Off"}</span>
                  </button>
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
