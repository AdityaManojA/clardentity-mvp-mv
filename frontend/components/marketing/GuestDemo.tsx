"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { askGuest, guestSessionId, type GuestTurn } from "@/lib/guestDemo";
import { track } from "@/lib/analytics";
import { cx } from "@/components/ui/primitives";

/* Try it here, without signing up.
 *
 * The stage on the landing page is a picture of the product until you click
 * it, at which point it becomes the product. It grows out of the box that
 * was clicked rather than appearing over it - the curtain is the same
 * curtain, in the same place, and only the frame around it changes - because
 * the thing being demonstrated is that the box you were watching is real.
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
  const [streaming, setStreaming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("inviting");
  const [grown, setGrown] = useState(false);
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
  }, [turns, streaming]);

  useEffect(() => {
    // After the growth, not during it - focusing mid-transition scrolls the
    // panel to the caret and fights the animation.
    const t = setTimeout(() => inputRef.current?.focus(), 420);
    return () => clearTimeout(t);
  }, []);

  const send = useCallback(async () => {
    const message = draft.trim();
    if (!message || streaming !== null) return;

    setDraft("");
    setError(null);
    setPhase((p) => (p === "inviting" ? "talking" : p));
    const history = turns;
    setTurns([...history, { role: "user", content: message }]);
    setStreaming("");
    track("guest_demo_asked", { mode });

    const controller = new AbortController();
    abortRef.current = controller;
    let text = "";

    await askGuest(
      { sessionId: guestSessionId(), mode, message, history },
      {
        onDelta: (chunk) => {
          text += chunk;
          setStreaming(text);
        },
        onDone: (done) => {
          setStreaming(null);
          if (done.text) setTurns((prev) => [...prev, { role: "assistant", content: done.text }]);
          if (done.limit_reached) {
            setPhase("spent");
            track("guest_demo_limit");
          }
        },
        onError: (detail) => {
          setStreaming(null);
          setError(detail);
        },
      },
      controller.signal,
    );
  }, [draft, streaming, turns, mode]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Try Clardentity in ${modeLabel} mode`}
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

      <button
        type="button"
        onClick={onClose}
        aria-label="Close the demo"
        className="absolute right-4 top-4 z-10 flex size-9 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
          strokeLinecap="round" aria-hidden="true" className="size-5">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>

      <div className="relative flex h-full w-full flex-col items-center px-4 pb-6 pt-16 sm:px-8">
        <div className="flex w-full max-w-[760px] flex-1 flex-col overflow-hidden">
          {phase === "inviting" ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <p className="text-2xl font-medium text-white sm:text-3xl">Ask me something.</p>
              <p className="mt-2 text-sm text-white/70">
                No account. You&apos;re in {modeLabel}.
              </p>
            </div>
          ) : (
            <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto pr-1">
              {turns.map((turn, i) =>
                turn.role === "user" ? (
                  <p
                    key={i}
                    className="ml-auto w-fit max-w-[80%] rounded-2xl bg-white/15 px-4 py-2.5 text-left text-base text-white"
                  >
                    {turn.content}
                  </p>
                ) : (
                  <p
                    key={i}
                    className="whitespace-pre-wrap text-base leading-relaxed text-white/90"
                  >
                    {turn.content}
                  </p>
                ),
              )}
              {streaming !== null && (
                <p className="whitespace-pre-wrap text-base leading-relaxed text-white/90">
                  {streaming}
                  <span className="landing-caret" data-blinking="true" />
                </p>
              )}
              {error && <p className="text-sm text-[#ff9db4]">{error}</p>}
            </div>
          )}

          {phase !== "spent" && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
              {modes.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMode(m.value)}
                  disabled={streaming !== null}
                  className={cx(
                    "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors disabled:cursor-not-allowed",
                    m.value === mode
                      ? "border-white/60 bg-white/20 text-white"
                      : "border-white/15 bg-white/[0.06] text-white/55 hover:bg-white/10 hover:text-white/80",
                  )}
                >
                  <Image src={m.heroIcon} alt="" width={14} height={14} className="block size-3.5" />
                  {m.name}
                </button>
              ))}
            </div>
          )}

          {phase === "spent" ? (
            <div className="mt-6 rounded-2xl border border-white/15 bg-white/[0.07] p-5 text-center">
              <p className="text-lg font-medium text-white">That&apos;s the preview.</p>
              <p className="mx-auto mt-1 max-w-[46ch] text-sm leading-relaxed text-white/70">
                Keep this conversation going, in any of the eight companions, with every
                claim checked against its source.
              </p>
              <Link
                href="/register"
                onClick={() => track("guest_demo_signup_clicked")}
                className="mt-4 inline-flex h-11 items-center rounded-full bg-white px-6 text-sm font-medium text-[#1a0710] transition-opacity hover:opacity-90"
              >
                Create a free account
              </Link>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-white/20 bg-white/10 p-2.5 backdrop-blur-sm">
              <textarea
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                rows={2}
                maxLength={2000}
                disabled={streaming !== null}
                placeholder="Ask anything…"
                className="w-full resize-none bg-transparent px-3 py-2 text-base text-white placeholder:text-white/45 focus:outline-none disabled:opacity-60"
              />
              <div className="flex items-center justify-between px-2 pb-1">
                <span className="text-xs text-white/45">
                  Enter to ask &middot; {modeLabel}
                </span>
                <button
                  type="button"
                  onClick={() => void send()}
                  disabled={!draft.trim() || streaming !== null}
                  aria-label="Ask"
                  className="flex size-8 items-center justify-center rounded-full bg-brand text-white transition-colors hover:bg-brand-dark disabled:bg-white/15 disabled:text-white/40"
                >
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"
                    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-5">
                    <path d="M10 16V4.5M4.6 9.9 10 4.5l5.4 5.4" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
