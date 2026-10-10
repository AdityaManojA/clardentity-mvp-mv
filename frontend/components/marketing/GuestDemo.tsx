"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { guestSessionId, streamGuestMessage, type GuestTurn } from "@/lib/guestDemo";
import { stashGuestTranscript, type StashedTurn } from "@/lib/guestHandoff";
import { track } from "@/lib/analytics";
import { cx } from "@/components/ui/primitives";
import { MessageInput } from "@/components/chat/MessageInput";
import { MessageList, type StreamingMessage } from "@/components/chat/MessageList";
import { ModeSelector, type CognitiveMode } from "@/components/chat/ModeSelector";
import { ContextQuestionCard } from "@/components/chat/ContextQuestionCard";
import { RefinedQuestionCard } from "@/components/chat/RefinedQuestionCard";
import { ClarifyingOptionsCard } from "@/components/chat/ClarifyingOptionsCard";
import { ModeSwitchToast } from "@/components/chat/ModeSwitchToast";
import { MODE_BY_VALUE, type PickableMode } from "@/lib/modes";
import type {
  ChatMessage,
  ClarifyingOptionsSuggestion,
  DecisionReviewData,
  GeneratedImage,
  RefinedQuestionSuggestion,
  ThinkingReviewData,
} from "@/lib/sse";

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
 * And the answers are the product's answers. The list and the composer were
 * the app's from the start, but the stream behind them was a small separate
 * thing - plain prose, no gist card, no verdict box, no claims - so the
 * frame was the product and the contents were not: Decision-making arrived
 * without its structure and Finder without a single fact checked. Now the
 * server runs a demo turn through the app's own pipeline and this component
 * drives it the way ChatView does - the same events, the same handlers, the
 * same pre-answer questions, the same switch toast, the same Quick answer -
 * so a visitor sees every part of an answer a signed-in user would.
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
    body: "Pick the model by name in Co-Creative, or leave it on Auto and let Clardentity choose for each question.",
  },
};

/** A companion's display name, for the switch toast and banner - the app's
 *  own label ("Thought coach"), not the landing page's title-cased one, so
 *  the two say the same thing. */
function labelOf(
  modes: readonly { name: string; value: string }[],
  value: string,
): string {
  return MODE_BY_VALUE[value as PickableMode]?.label ?? modes.find((m) => m.value === value)?.name ?? value;
}

/** Same as the app: a stream with nothing to show after this long gets the
 *  Quick answer button. */
const SLOW_AFTER_MS = 7000;

let localIds = 0;

/** The visitor's question, shown the moment it is sent - the same
 *  optimistic message the app puts up before the server has answered. */
function questionMessage(content: string, mode: string): ChatMessage {
  localIds += 1;
  const id = `guest-local-${localIds}`;
  return {
    id,
    role: "user",
    content,
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
    sibling_ids: [id],
    claims: [],
  };
}

/** What the server is sent as history: the words of each turn, as the app's
 *  own history carries them (the answer's body, not its gist). */
function historyOf(messages: ChatMessage[]): GuestTurn[] {
  return messages
    .filter((m) => (m.role === "user" || m.role === "assistant") && (m.content ?? "").trim())
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content ?? "" }));
}

/** What is kept for the account, if the visitor signs up: each turn with
 *  what its answer looked like. A picture-only answer has no prose, and the
 *  import needs some text, so it carries the picture's prompt. */
function stashOf(messages: ChatMessage[]): StashedTurn[] {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: (m.content ?? "").trim() || m.generated_image?.prompt || "Image",
      mode: m.mode_used,
      crux_text: m.crux_text,
      decision_review: m.decision_review,
      thinking_review: m.thinking_review,
      generated_image: m.generated_image,
    }));
}

type SendOptions = {
  modeConfirmed?: boolean;
  contextAcknowledged?: boolean;
  contextRounds?: number;
  refinedConfirmed?: boolean;
  clarifyingConfirmed?: boolean;
  /** Re-answer the last question rather than ask a new one. */
  regenerate?: boolean;
};

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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState<StreamingMessage | null>(null);
  const [sending, setSending] = useState(false);
  // Answer shown, claims still being checked - the app's "validating" state.
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [slowHint, setSlowHint] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("inviting");
  const [grown, setGrown] = useState(false);
  const [gate, setGate] = useState<string | null>(null);
  /* Smart switching, as in the app and on by default. */
  const [smartSwitching, setSmartSwitching] = useState(true);
  /* The pre-answer questions, held exactly as ChatView holds them: the
     accumulated send so far, so an answer is appended rather than replacing
     what was asked. */
  const [pendingContext, setPendingContext] = useState<{
    question: string;
    content: string;
    mode: string;
    rounds: number;
  } | null>(null);
  const [pendingRefined, setPendingRefined] = useState<{
    suggestion: RefinedQuestionSuggestion;
    content: string;
    mode: string;
  } | null>(null);
  const [pendingClarifying, setPendingClarifying] = useState<{
    suggestion: ClarifyingOptionsSuggestion;
    content: string;
    mode: string;
  } | null>(null);
  /* A question moved to a better companion: the toast while it is being
     answered, then the banner with the way back. */
  const [switchedFrom, setSwitchedFrom] = useState<{
    from: string;
    to: string;
    content: string;
    flags: SendOptions;
  } | null>(null);
  const [switchToast, setSwitchToast] = useState(false);
  const dismissSwitchToast = useCallback(() => setSwitchToast(false), []);

  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  // The verdict box and the picture can land before the "answer" event's
  // message exists; kept aside so swapping the streaming bubble for that
  // message does not make them vanish for the length of the checking.
  const earlyReviewRef = useRef<{
    decision_review?: DecisionReviewData | null;
    thinking_review?: ThinkingReviewData | null;
  } | null>(null);
  const earlyImageRef = useRef<GeneratedImage | null>(null);
  const hasAnsweredRef = useRef(false);
  const pendingQuestionIdRef = useRef<string | null>(null);
  const lastSendRef = useRef<{ content: string; mode: string } | null>(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  /* The growth. The panel is positioned at the stage's own rectangle for one
     frame and then released to fill the screen, which is the whole of the
     "zoom" - no measuring of the destination, because the destination is the
     viewport.

     The division by `zoom` is not optional. This page is drawn at 85% via a
     `zoom` on the root element, so getBoundingClientRect answers in screen
     pixels while `position: fixed` offsets are read as layout pixels. Using
     the rect unconverted puts the panel 15% off, in both axes, every time. */
  useEffect(() => {
    const frame = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    // After the growth, not during it - focusing mid-transition scrolls the
    // panel to the caret and fights the animation.
    const t = setTimeout(() => inputRef.current?.focus(), 420);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  // The fallback timer behind the Quick answer button, as in the app.
  useEffect(() => {
    if (!sending || hasAnsweredRef.current) return;
    if (lastSendRef.current?.mode === "rapid") return;
    const timer = setTimeout(() => setSlowHint(true), SLOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, [sending]);

  /** Cut the answer off. Before the answer event nothing exists, so the
   *  question comes back off the screen too - the app's rule. */
  const stop = useCallback(() => {
    abortRef.current?.abort();
    if (!hasAnsweredRef.current && pendingQuestionIdRef.current) {
      const id = pendingQuestionIdRef.current;
      setMessages((prev) => prev.filter((m) => m.id !== id));
    }
    pendingQuestionIdRef.current = null;
    setStreaming(null);
    setSending(false);
    setSlowHint(false);
    setValidatingId(null);
  }, []);

  const send = useCallback(
    async (content: string, sendMode: string, options: SendOptions = {}) => {
      const message = content.trim();
      if (!message) return;

      setDraft("");
      setError(null);
      setGate(null);
      setPendingContext(null);
      setPendingRefined(null);
      setPendingClarifying(null);
      setPhase((p) => (p === "inviting" ? "talking" : p));

      // On a regenerate the question is already on screen and its old
      // answer has been taken off; everything before the question is the
      // history, exactly as the app sends it.
      const before = messagesRef.current;
      const history = historyOf(
        options.regenerate && before.at(-1)?.role === "user" ? before.slice(0, -1) : before,
      );
      const question = options.regenerate ? null : questionMessage(message, sendMode);
      if (question) setMessages((prev) => [...prev, question]);
      pendingQuestionIdRef.current = question?.id ?? null;
      hasAnsweredRef.current = false;
      earlyReviewRef.current = null;
      earlyImageRef.current = null;
      lastSendRef.current = { content: message, mode: sendMode };
      setStreaming({ mode_used: sendMode, content: "" });
      setSending(true);
      setSlowHint(false);
      track("guest_demo_asked", { mode: sendMode });

      const controller = new AbortController();
      abortRef.current = controller;
      let answerMode = sendMode;

      const rollBack = () => {
        if (question) setMessages((prev) => prev.filter((m) => m.id !== question.id));
        setStreaming(null);
        setSending(false);
        setSlowHint(false);
      };

      await streamGuestMessage(
        {
          sessionId: guestSessionId(),
          mode: sendMode,
          message,
          history,
          smartSwitching,
          modeConfirmed: options.modeConfirmed,
          contextAcknowledged: options.contextAcknowledged,
          contextRounds: options.contextRounds,
          refinedConfirmed: options.refinedConfirmed,
          clarifyingConfirmed: options.clarifyingConfirmed,
          regenerate: options.regenerate,
          // What "make it darker" refers to: the last picture drawn here.
          lastImageId:
            [...before].reverse().find((m) => m.role === "assistant" && m.generated_image)
              ?.generated_image?.id ?? null,
        },
        {
          onSwitched: (from, to) => {
            // Before any text, so the toast is up while the answer is being
            // written rather than appearing under a finished one.
            answerMode = to;
            setMode(to);
            setStreaming((prev) => (prev ? { ...prev, mode_used: to } : prev));
            setSwitchedFrom({ from, to, content: message, flags: options });
            setSwitchToast(true);
            track("guest_demo_mode_switched", { from, to });
          },
          onStatus: (status) => {
            if (status.phase === "slow" && sendMode !== "rapid") setSlowHint(true);
            if (status.phase === "image") {
              setStreaming((prev) => (prev ? { ...prev, makingImage: true } : prev));
            }
          },
          onReview: (review) => {
            earlyReviewRef.current = review;
            setStreaming((prev) =>
              prev
                ? {
                    ...prev,
                    decisionReview: review.decision_review ?? prev.decisionReview ?? null,
                    thinkingReview: review.thinking_review ?? prev.thinkingReview ?? null,
                  }
                : prev,
            );
          },
          onImage: (image) => {
            earlyImageRef.current = image;
            setStreaming((prev) => (prev ? { ...prev, generatedImage: image } : prev));
            setMessages((prev) => {
              for (let i = prev.length - 1; i >= 0; i--) {
                if (prev[i].role === "assistant") {
                  if (prev[i].generated_image) return prev;
                  const next = [...prev];
                  next[i] = { ...next[i], generated_image: image };
                  return next;
                }
              }
              return prev;
            });
          },
          onCrux: (text) => {
            setSlowHint(false);
            setStreaming((prev) => (prev ? { ...prev, crux: text } : prev));
          },
          onDelta: (text) => {
            setStreaming((prev) => (prev ? { ...prev, content: prev.content + text } : prev));
          },
          onAnswer: (answer) => {
            // The text is written; only the checking is outstanding, and the
            // composer comes back now rather than after it - the app's rule.
            hasAnsweredRef.current = true;
            pendingQuestionIdRef.current = null;
            setSlowHint(false);
            const early = earlyReviewRef.current;
            const earlyImage = earlyImageRef.current;
            const carried = {
              ...answer,
              mode_used: answerMode,
              decision_review: answer.decision_review ?? early?.decision_review ?? null,
              thinking_review: answer.thinking_review ?? early?.thinking_review ?? null,
              generated_image: answer.generated_image ?? earlyImage ?? null,
            };
            setMessages((prev) => [...prev, carried]);
            setStreaming(null);
            setSending(false);
            setValidatingId(answer.id);
          },
          onFinal: (final) => {
            setMessages((prev) => {
              const index = prev.findIndex((m) => m.id === final.message.id);
              if (index === -1) return [...prev, final.message];
              const next = [...prev];
              next[index] = final.message;
              return next;
            });
            setValidatingId(null);
            setStreaming(null);
            setSending(false);
          },
          onContextQuestion: (asked) => {
            rollBack();
            setPendingContext({
              question: asked.question,
              content: message,
              mode: sendMode,
              rounds: options.contextRounds ?? 0,
            });
          },
          onRefinedQuestion: (suggestion) => {
            rollBack();
            setPendingRefined({ suggestion, content: message, mode: sendMode });
          },
          onClarifyingOptions: (suggestion) => {
            rollBack();
            setPendingClarifying({ suggestion, content: message, mode: sendMode });
          },
          onBudget: (budget) => {
            if (!budget.limit_reached) return;
            // The wall can also be the whole reply - an allowance already
            // spent - in which case nothing is being written.
            setStreaming(null);
            setSending(false);
            setValidatingId(null);
            setPhase("spent");
            track("guest_demo_limit");
            // Stashed at the wall, not at the click on "create an account":
            // by then this component is unmounting and the conversation it
            // holds is the only copy there has ever been. After the final
            // event's update, which this updater runs behind.
            setMessages((prev) => {
              stashGuestTranscript(answerMode, stashOf(prev));
              return prev;
            });
          },
          onError: (detail) => {
            setError(detail);
            setStreaming(null);
            setSending(false);
            setSlowHint(false);
            setValidatingId(null);
          },
          onDropped: () => {
            // The demo has no saved answer to go back and read, so a lost
            // connection is said plainly rather than recovered from.
            if (controller.signal.aborted) return;
            if (!hasAnsweredRef.current && question) {
              setMessages((prev) => prev.filter((m) => m.id !== question.id));
            }
            setError("The answer stopped partway. Try again?");
            setStreaming(null);
            setSending(false);
            setSlowHint(false);
            setValidatingId(null);
          },
        },
        controller.signal,
      );
    },
    [smartSwitching],
  );

  useEffect(() => {
    // Escape stops an answer that is being written, as in the app; with
    // nothing running it closes the demo.
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (sending) {
        event.preventDefault();
        stop();
      } else {
        onClose();
      }
    }
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose, sending, stop]);

  /* Start again. The budget is the server's and survives this, which is the
     point of showing it: a new chat is free, the allowance is not, and
     finding that out here is better than finding it out after signing up. */
  const newChat = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setStreaming(null);
    setSending(false);
    setValidatingId(null);
    setDraft("");
    setError(null);
    setGate(null);
    setPendingContext(null);
    setPendingRefined(null);
    setPendingClarifying(null);
    setSwitchedFrom(null);
    setPhase((p) => (p === "spent" ? p : "inviting"));
    track("guest_demo_new_chat");
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  /* The thread's own controls, as far as a conversation that lives in this
     component can have them. The app keeps every version as a branch; the
     demo keeps the latest, which is the version that is read. */
  const regenerate = useCallback(
    (messageId: string) => {
      const list = messagesRef.current;
      const index = list.findIndex((m) => m.id === messageId);
      const question = index > 0 ? list[index - 1] : null;
      if (!question || question.role !== "user") return;
      track("answer_regenerated", { mode: list[index].mode_used });
      setMessages(list.slice(0, index));
      messagesRef.current = list.slice(0, index);
      void send(question.content ?? "", list[index].mode_used, { regenerate: true });
    },
    [send],
  );

  const editQuestion = useCallback(
    (messageId: string, content: string) => {
      const list = messagesRef.current;
      const index = list.findIndex((m) => m.id === messageId);
      if (index === -1) return;
      setMessages(list.slice(0, index));
      messagesRef.current = list.slice(0, index);
      void send(content, mode);
    },
    [send, mode],
  );

  const deleteFrom = useCallback((messageId: string) => {
    setMessages((prev) => {
      const index = prev.findIndex((m) => m.id === messageId);
      return index === -1 ? prev : prev.slice(0, index);
    });
  }, []);

  const quickAnswer = useCallback(() => {
    const last = lastSendRef.current;
    if (!last) return;
    track("quick_answer_tapped", { mode: last.mode });
    stop();
    void send(last.content, "rapid", { modeConfirmed: true });
  }, [send, stop]);

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
  const empty = phase === "inviting" && messages.length === 0 && !sending;

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
          disabled={sending || messages.length === 0}
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
        <div className="flex min-h-0 w-full max-w-[760px] flex-1 flex-col">
          {empty ? (
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
            <div className="flex min-h-0 flex-1 flex-col">
              {/* The app's own list, with the app's own callbacks where a
                  conversation held in this component can honour them:
                  another answer, an edited question, deleting from a point.
                  Rating and exporting write to a conversation that does not
                  exist for a guest; the empty conversation id is what keeps
                  those off the screen rather than present and broken. */}
              <MessageList
                conversationId=""
                messages={messages}
                streaming={streaming}
                busy={sending}
                validatingId={validatingId}
                onRegenerate={regenerate}
                onSubmitEdit={editQuestion}
                onDeleteMessage={deleteFrom}
                onClarifierAnswer={(answer) => void send(answer, mode)}
                onUseMode={(next) => setMode(next)}
                onAskRefined={(q) => void send(q, mode)}
              />
            </div>
          )}

          {/* The pre-answer questions, between the thread and the composer,
              exactly where the app puts them and with the app's cards. */}
          <div className="scroll-slim max-h-[calc(var(--app-vh)*45)] shrink-0 overflow-y-auto">
            {pendingContext && (
              <ContextQuestionCard
                key={pendingContext.rounds}
                question={pendingContext.question}
                busy={sending}
                onAnswer={(context) =>
                  void send(
                    `${pendingContext.content}\n\n(Clardentity asked: "${pendingContext.question}")\n${context}`,
                    pendingContext.mode,
                    { contextRounds: pendingContext.rounds + 1 },
                  )
                }
                onSkip={() =>
                  void send(pendingContext.content, pendingContext.mode, {
                    contextAcknowledged: true,
                    contextRounds: pendingContext.rounds,
                  })
                }
              />
            )}
            {pendingRefined && (
              <RefinedQuestionCard
                refinedQuestion={pendingRefined.suggestion.refined_question}
                reason={pendingRefined.suggestion.refinement_reason}
                busy={sending}
                onAskRefined={() =>
                  void send(
                    `${pendingRefined.content}\n\n(Clardentity asked: "Did you mean: ${pendingRefined.suggestion.refined_question}")\n${pendingRefined.suggestion.refined_question}`,
                    pendingRefined.mode,
                    { refinedConfirmed: true },
                  )
                }
                onKeepOriginal={() =>
                  void send(pendingRefined.content, pendingRefined.mode, { refinedConfirmed: true })
                }
              />
            )}
            {pendingClarifying && (
              <ClarifyingOptionsCard
                question={pendingClarifying.suggestion.question}
                options={pendingClarifying.suggestion.options}
                busy={sending}
                onAnswer={(answer) =>
                  void send(
                    `${pendingClarifying.content}\n\n(Clardentity asked: "${pendingClarifying.suggestion.question}")\n${answer}`,
                    pendingClarifying.mode,
                    { clarifyingConfirmed: true },
                  )
                }
                onSkip={() =>
                  void send(pendingClarifying.content, pendingClarifying.mode, {
                    clarifyingConfirmed: true,
                  })
                }
              />
            )}
          </div>

          {error && <p className="mt-3 shrink-0 text-sm text-[#ff9db4]">{error}</p>}

          {phase === "spent" ? (
            <div className="mt-6 shrink-0 rounded-2xl border border-white/15 bg-white/[0.07] p-5 text-center">
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
            <div className="mt-3 shrink-0 space-y-2">
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

              {/* The app's switch toast: what just happened, a four-second
                  ring, and one button to have it answered where it was
                  asked instead. */}
              {switchToast && switchedFrom && (
                <ModeSwitchToast
                  from={labelOf(modes, switchedFrom.from)}
                  to={labelOf(modes, switchedFrom.to)}
                  onDismiss={dismissSwitchToast}
                  onRevert={() => {
                    stop();
                    const { from, content, flags } = switchedFrom;
                    track("mode_switch_reverted", { to: from, via: "countdown" });
                    setSwitchToast(false);
                    setSwitchedFrom(null);
                    setMode(from);
                    void send(content, from, { ...flags, modeConfirmed: true });
                  }}
                />
              )}

              {sending && slowHint && !streaming?.crux && (
                // The app's Quick answer: an instant, unchecked answer
                // instead of the long one.
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={quickAnswer}
                    title="Stop this answer and get an instant, unchecked one instead"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-sm font-medium text-ink-inverse shadow-lg transition-colors hover:opacity-90 animate-[fade-in_0.3s_ease]"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-3.5 w-3.5">
                      <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
                    </svg>
                    Quick answer
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
                  setSwitchedFrom(null);
                  setMode(next);
                }}
                disabled={sending}
                lockedModes={[]}
              />

              {/* The banner the app leaves once the toast has gone: the way
                  back, for as long as the moved question is the last one. */}
              {switchedFrom && !switchToast && mode === switchedFrom.to && (
                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-brand-border bg-brand-soft px-3 py-1.5 text-xs text-ink-secondary">
                  <span>
                    Switched to {labelOf(modes, switchedFrom.to)} - it suits this question better.
                  </span>
                  {sending ? (
                    <button
                      type="button"
                      onClick={() => {
                        stop();
                        const { from, content, flags } = switchedFrom;
                        track("mode_switch_reverted", { to: from, via: "banner" });
                        setSwitchedFrom(null);
                        setMode(from);
                        void send(content, from, { ...flags, modeConfirmed: true });
                      }}
                      className="font-medium text-brand hover:underline"
                    >
                      Answer in {labelOf(modes, switchedFrom.from)} instead
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setMode(switchedFrom.from);
                        setSwitchedFrom(null);
                      }}
                      className="font-medium text-brand hover:underline"
                    >
                      Back to {labelOf(modes, switchedFrom.from)}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSwitchedFrom(null)}
                    aria-label="Dismiss"
                    className="ml-auto rounded px-1 text-ink-muted hover:text-ink"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* The product's composer, whole. */}
              <MessageInput
                disabled={sending}
                disabledReason={sending ? "Writing the answer…" : undefined}
                value={draft}
                onChange={setDraft}
                onSend={(content) => void send(content, mode)}
                textareaRef={inputRef}
                mode={mode}
                isGenerating={sending}
                onStop={stop}
                onStartCall={() => {
                  track("guest_demo_gated", { feature: "call" });
                  setGate("call");
                }}
                gated={(feature) => {
                  track("guest_demo_gated", { feature });
                  setGate(feature);
                }}
                trailing={
                  // Same control, same place, same words as the app.
                  <button
                    type="button"
                    onClick={() => setSmartSwitching((on) => !on)}
                    disabled={sending}
                    title={
                      smartSwitching
                        ? "Smart: a question that fits another mode better is answered there automatically, with a way back. Click for manual."
                        : "Manual: the mode is whatever you pick; it never switches. Click for smart."
                    }
                    className="shrink-0 rounded-md px-2 py-1 text-sm text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="hidden sm:inline">Switching: </span>
                    {smartSwitching ? "Smart" : "Manual"}
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
