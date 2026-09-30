"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

/* The landing page, built from the Figma design (file mTefBk432edigQvPwag6mK,
 * node 69:7). Every measurement, colour and asset here came from the design
 * over the Figma connector rather than from a screenshot, so the layout is
 * the design's own numbers.
 *
 * Two things about how it is built:
 *
 * The design is a fixed 1728px canvas. Rather than reproduce that with
 * absolute positioning - which would be pixel-perfect at exactly one width
 * and broken at every other - each section keeps the design's intrinsic
 * sizes and centres them in flow. At 1728px the result matches the frame;
 * below it, the content scales down through `clamp` on the display type and
 * the grids reflow. Nothing about the design is lost, and it survives a
 * phone.
 *
 * The palette is the design's, not the app's: a warm off-white canvas with
 * plum accents, which is a different identity from the product's near-black
 * interior. It is deliberately scoped to this file (and its own token block
 * below) so it cannot leak into the app's theme.
 */

const INK = "#3d2a2f"; // headings
const INK_BODY = "#6b5c60"; // body copy under a heading
const MUTED = "#9e8e93"; // captions, eyebrow text, footer wordmark
const PLUM = "#6b2d5c"; // accent: send button, "Ask./Check./See.", emphasis
const CANVAS = "#faf8f9";
const HAIRLINE = "#e8e3e7"; // card borders
const OUTLINE = "#5f5551"; // the Login pill

type Mode = {
  name: string;
  blurb: string;
  icon: string;
  /** The white-on-dark variant used inside the hero composer. */
  heroIcon: string;
  /** The design gives every blurb its own text box rather than a shared
   *  column, and the wrapping is part of the look - "Facts, sources," breaks
   *  before "fast." because its box is 90px wide, not 252px. Carried here so
   *  the cards read exactly as drawn. */
  blurbWidth: number;
  /** Where that box starts. Two-line blurbs sit lower than three-line ones so
   *  that every card's text ends on the same baseline. */
  blurbTop: number;
};

/* Names and one-liners are the design's. "Reflect & Relieve" uses the
 * ampersand in both places - the hero pill in Figma still reads "Reflect and
 * Relieve", and the client asked for the ampersand, which is also what the
 * product itself calls the mode. */
const MODES: Mode[] = [
  {
    name: "Finder",
    blurb: "Facts, sources, fast.",
    icon: "/landing/icon-card-finder.svg",
    heroIcon: "/landing/icon-hero-finder.svg",
     blurbWidth: 89.947,
    blurbTop: 286.41,
  },
  {
    name: "Decision-making",
    blurb: "Weigh options against what matters to you.",
    icon: "/landing/icon-card-decision.svg",
    heroIcon: "/landing/icon-hero-decision.svg",
     blurbWidth: 231.416,
    blurbTop: 286.41,
  },
  {
    name: "Thought Coach",
    blurb: "Sort out a half-formed idea.",
    icon: "/landing/icon-card-thought.svg",
    heroIcon: "/landing/icon-hero-thought.svg",
     blurbWidth: 245.239,
    blurbTop: 316.41,
  },
  {
    name: "Learning",
    blurb: "Learn it from the ground up.",
    icon: "/landing/icon-card-learning.svg",
    heroIcon: "/landing/icon-hero-learning.svg",
     blurbWidth: 245.239,
    blurbTop: 316.41,
  },
  {
    name: "Co-Creative",
    blurb: "Make something together, draft by draft.",
    icon: "/landing/icon-card-cocreative.svg",
    heroIcon: "/landing/icon-hero-cocreative.svg",
     blurbWidth: 245.239,
    blurbTop: 286.41,
  },
  {
    name: "Mentoring",
    blurb: "Guidance on a skill or a career.",
    icon: "/landing/icon-card-mentoring.svg",
    heroIcon: "/landing/icon-hero-mentoring.svg",
     blurbWidth: 158.947,
    blurbTop: 286.41,
  },
  {
    name: "Reflect & Relieve",
    blurb: "A calm place to think through how you feel.",
    icon: "/landing/icon-card-reflect.svg",
    heroIcon: "/landing/icon-hero-reflect.svg",
     blurbWidth: 181.826,
    blurbTop: 286.41,
  },
  {
    name: "Legal",
    blurb: "Plain-language help with legal questions.",
    icon: "/landing/icon-card-legal.svg",
    heroIcon: "/landing/icon-hero-legal.svg",
     blurbWidth: 179.244,
    blurbTop: 286.41,
  },
];

const STEPS = [
  {
    word: "Ask.",
    blurb: "Your question goes to the models best suited for it.",
    blurbWidth: 306.808,
  },
  {
    word: "Check.",
    blurb: "The answer is split into claims & checked against sources.",
    blurbWidth: 306.808,
  },
  // Narrower in the design, which is what breaks it after "audit,".
  { word: "See.", blurb: "You get the answer and the audit, side by side.", blurbWidth: 266.631 },
];

function Wordmark({
  size,
  tone,
  src,
}: {
  size: number;
  tone: string;
  src: string;
}) {
  return (
    <span className="flex shrink-0 items-center gap-[12px]">
      <Image src={src} alt="" width={33} height={32} className="block h-[32px] w-[33.083px]" />
      <span
        className="whitespace-nowrap font-normal leading-none"
        style={{ fontSize: size, color: tone }}
      >
        Clardentity
      </span>
    </span>
  );
}

export function LandingPage({ signedIn }: { signedIn: boolean }) {
  const enter = signedIn ? "/start" : "/register";

  /* The page is light by design, whatever theme the browser is in. The
     element below paints its own canvas, but the document behind it does
     not - so an overscroll bounce, or the browser chrome on a phone, showed
     the app's black behind a cream page. Writing to document.body is a
     side effect on something outside React, which is what an effect is for;
     it is undone on the way out so the app's own theme is untouched. */
  useEffect(() => {
    const previous = document.body.style.backgroundColor;
    document.body.style.backgroundColor = CANVAS;
    return () => {
      document.body.style.backgroundColor = previous;
    };
  }, []);

  return (
    <div
      className="landing min-h-screen w-full font-[family-name:var(--font-outfit)]"
      // line-height: normal, inherited by everything inside. The design sets
      // every text node to CSS `normal` (about 1.2 for Outfit); Tailwind's
      // `leading-normal` is 1.5, which is a different number and re-wraps
      // every fixed-width text box in the design - "Facts, sources, fast."
      // fell onto four lines instead of three.
      style={{ background: CANVAS, color: INK, lineHeight: "normal" }}
    >
      {/* ---------------------------------------------------------------- */}
      {/* Hero (69:8) */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative mx-auto w-full max-w-[1728px] px-4 pb-[40px] pt-[70px] sm:px-8">
        <div className="flex items-center justify-center">
          <Wordmark size={32} tone={INK} src="/landing/logo-dots-plum.svg" />
        </div>

        {/* Absolute at the design's width, in flow below it on narrow screens,
            where a right-pinned button would sit on top of the wordmark. */}
        <div className="mt-6 flex justify-center xl:mt-0 xl:block">
          <Link
            href="/login"
            className="inline-flex items-center rounded-[37px] border px-[12px] py-[4px] text-[24px] transition-colors hover:bg-black/[0.03] xl:absolute xl:right-[160px] xl:top-[79px]"
            style={{ borderColor: OUTLINE, color: OUTLINE }}
          >
            Login
          </Link>
        </div>

        <div className="mx-auto mt-[80px] flex w-full max-w-[1144px] flex-col items-center gap-[16px] sm:mt-[113px]">
          <h1
            className="w-full text-center font-normal"
            style={{ fontSize: "clamp(22px, 2.6vw, 32px)", color: INK }}
          >
            Every answer, checked claim by claim.
          </h1>

          {/* The stage. 1144 x 494 in the design; the ratio is kept so the
              curtain never crops differently from the frame, and the box is a
              container so everything inside can be sized against its width
              rather than the viewport's. */}
          <div className="relative w-full overflow-hidden rounded-[16px]">
            <div
              className="relative aspect-[1144/494] w-full"
              style={{ containerType: "inline-size" }}
            >
              {/* The design does not centre-crop this: it places the image at
                  116.8% x 150.96%, offset left -8.4% and top -50.96%, which
                  shows the lower half of the curtain and puts the bright arch
                  where it sits in the frame. object-cover would have centred
                  it and shown a different part of the picture. */}
              {/* Geometry in a style object, not Tailwind arbitrary values:
                  negative percentage insets and fractional percentage sizes
                  are the class shapes this project has repeatedly found are
                  emitted as class names and then never generated as CSS -
                  the element carries the class and lays out as though it
                  did not. Inline leaves nothing to chance. */}
              <Image
                src="/landing/curtain.png"
                alt=""
                width={4096}
                height={2286}
                priority
                sizes="(max-width: 1200px) 140vw, 1400px"
                className="absolute"
                style={{
                  left: "-8.4%",
                  top: "-50.96%",
                  width: "116.8%",
                  height: "150.96%",
                  // Explicit, for the same reason: the base stylesheet caps
                  // every img at 100% of its container, which would shrink
                  // this back to the frame and undo the crop.
                  maxWidth: "none",
                }}
              />
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "linear-gradient(110.13deg, rgba(0,0,0,0.4) 27.018%, rgba(0,0,0,0) 83.189%)",
                }}
              />

              {/* The composer, sunk into the lower half of the stage exactly
                  as the design places it (centre + 95.5px).

                  Drawn at its true size - 925px wide, the design's number -
                  and then scaled by however much the stage itself has been
                  scaled. Everything inside therefore keeps its exact
                  proportions at any width: at 1144px the scale is 1 and this
                  is the design pixel for pixel; on a phone the whole
                  composer shrinks together rather than the eight mode pills
                  overflowing a box that got narrower while they did not. */}
              <div
                className="absolute left-1/2 top-[calc(50%+8.6%)]"
                style={{
                  width: 925,
                  // Divided by a *length*, so the result is the unitless
                  // ratio scale() needs - dividing by the bare number 1144
                  // yields a length, which scale() rejects silently.
                  transform: "translate(-50%, -50%) scale(calc(100cqi / 1144px))",
                }}
              >
                <div className="flex flex-col gap-[13px]">
                  <div
                    className="relative h-[124px] w-full overflow-hidden rounded-[20px] border"
                    style={{ background: "rgba(255,255,255,0.1)", borderColor: "#f2edf2" }}
                  >
                    <p
                      className="absolute left-[26px] top-[24.74px] whitespace-nowrap font-normal text-white"
                      style={{ fontSize: 20 }}
                    >
                      Are we alone in this universe?
                    </p>
                    <span
                      className="absolute bottom-[15.25px] right-[22px] flex size-[32px] items-center justify-center rounded-[22px]"
                      style={{ background: PLUM }}
                    >
                      <Image
                        src="/landing/arrow-up.svg"
                        alt=""
                        width={20}
                        height={20}
                        className="block size-[20px]"
                      />
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-[4px]">
                    {MODES.map((mode) => (
                      <span
                        key={mode.name}
                        className="flex shrink-0 flex-col items-center justify-center gap-[4px] rounded-[8px] border px-[12px] py-[4px]"
                        style={{ background: "rgba(255,255,255,0.1)", borderColor: "#f2edf2" }}
                      >
                        <Image
                          src={mode.heroIcon}
                          alt=""
                          width={20}
                          height={20}
                          className="block size-[20px]"
                        />
                        <span
                          className="whitespace-nowrap font-normal text-white"
                          style={{ fontSize: 16 }}
                        >
                          {mode.name}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p
            className="mt-[16px] w-full text-center font-semibold uppercase"
            style={{ fontSize: "clamp(14px, 1.2vw, 20px)", color: MUTED }}
          >
            <Link href={enter} className="transition-colors hover:text-[#6b2d5c]">
              Start asking
            </Link>
            {" · "}
            <a href="#how-it-works" className="transition-colors hover:text-[#6b2d5c]">
              See how it works
            </a>
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* The audit (69:66) */}
      {/* ---------------------------------------------------------------- */}
      <section className="mx-auto flex w-full max-w-[1728px] items-center px-4 py-[140px] sm:px-8">
        <div className="mx-auto w-full max-w-[1110px]">
          <div className="flex items-center justify-between">
            <Wordmark size={32} tone={INK} src="/landing/logo-dots-audit.svg" />
            <p
              className="whitespace-nowrap text-center font-semibold uppercase"
              style={{ fontSize: "clamp(14px, 1.2vw, 20px)", color: MUTED }}
            >
              The audit
            </p>
          </div>

          <h2
            className="mt-[4px] text-center font-normal"
            style={{ fontSize: "clamp(40px, 5.6vw, 96px)", color: INK }}
          >
            An answer is many claims.
          </h2>
          <div
            className="mt-[4px] max-w-[852.553px] font-normal"
            style={{ fontSize: "clamp(18px, 1.9vw, 32px)", color: INK_BODY }}
          >
            <p>Clardentity splits every answer into individual claims.</p>
            <p>Each one is checked against sources. You see what holds up and what doesn&apos;t.</p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Modes (69:77) */}
      {/* ---------------------------------------------------------------- */}
      <section className="mx-auto w-full max-w-[1728px] px-4 py-[67px] sm:px-8">
        <div className="mx-auto flex w-full max-w-[1299px] flex-col items-end gap-[16px]">
          <h2
            className="w-full max-w-[366px] text-right font-normal capitalize"
            style={{ fontSize: "clamp(22px, 2.6vw, 32px)", color: INK }}
          >
            <span style={{ color: PLUM }}>Different questions</span> need{" "}
            <span style={{ color: PLUM }}>different thinking.</span>
          </h2>

          {/* Four across at the design's width, reflowing below it. The cards
              keep their 300 x 400 shape, so the wall of them reads the same
              at every breakpoint. */}
          <div className="grid w-full grid-cols-1 justify-items-center gap-[32px] sm:grid-cols-2 lg:grid-cols-4">
            {MODES.map((mode) => (
              <article
                key={mode.name}
                className="relative h-[400px] w-full max-w-[300px] overflow-hidden rounded-[12px] border"
                style={{ borderColor: HAIRLINE }}
              >
                <div className="absolute left-[23px] top-[26px] flex w-[252px] items-center justify-between">
                  <h3
                    className="whitespace-nowrap font-semibold"
                    style={{ fontSize: 20, color: INK }}
                  >
                    {mode.name}
                  </h3>
                  <Image
                    src={mode.icon}
                    alt=""
                    width={32}
                    height={32}
                    className="block size-[32px]"
                  />
                </div>
                <p
                  className="absolute left-[23px] font-normal"
                  style={{
                    top: mode.blurbTop,
                    width: mode.blurbWidth,
                    fontSize: 24,
                    color: MUTED,
                  }}
                >
                  {mode.blurb}
                </p>
              </article>
            ))}
          </div>

          <p
            className="w-full text-right font-semibold uppercase"
            style={{ fontSize: "clamp(14px, 1.2vw, 20px)", color: MUTED }}
          >
            Switch modes yourself, or let Clardentity pick.
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* How it works (69:132) */}
      {/* ---------------------------------------------------------------- */}
      <section
        id="how-it-works"
        className="mx-auto w-full max-w-[1728px] scroll-mt-8 px-4 py-[140px] sm:px-8"
      >
        <div className="mx-auto flex w-full max-w-[1174px] flex-col items-center gap-[29.22px]">
          <h2
            className="text-center font-normal capitalize"
            style={{ fontSize: "clamp(28px, 3.1vw, 38.96px)", color: INK }}
          >
            How it works
          </h2>

          <div className="grid w-full grid-cols-1 justify-items-center gap-[38.96px] md:grid-cols-3">
            {STEPS.map((step) => (
              <article
                key={step.word}
                className="relative h-[486.997px] w-full max-w-[365.248px] overflow-hidden rounded-[14.61px]"
                // Fractional border width inline for the same reason as the
                // hero crop: the arbitrary-value class rounds to 1px because
                // the rule is never generated.
                style={{ border: `1.217px solid ${HAIRLINE}` }}
              >
                <p
                  className="absolute left-[28px] font-normal"
                  style={{ top: 32.26, width: step.blurbWidth, fontSize: 28, color: MUTED }}
                >
                  {step.blurb}
                </p>
                <div className="absolute bottom-[27.39px] left-1/2 flex w-[306.808px] -translate-x-1/2 items-center justify-between">
                  <span
                    className="whitespace-nowrap font-semibold"
                    style={{ fontSize: 40, color: PLUM }}
                  >
                    {step.word}
                  </span>
                  <Image
                    src="/landing/logo-dots-steps.svg"
                    alt=""
                    width={40}
                    height={39}
                    className="block h-[38.96px] w-[40.278px]"
                  />
                </div>
              </article>
            ))}
          </div>

          <p
            className="text-right font-normal uppercase"
            style={{ fontSize: "clamp(16px, 1.4vw, 24px)", color: MUTED }}
          >
            Clardentity uses multiple AI models, not just one.
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Closing call to action (69:153) */}
      {/* ---------------------------------------------------------------- */}
      <section className="mx-auto w-full max-w-[1728px] px-4 pb-[99px] pt-[100px] sm:px-8 xl:px-[160px]">
        <div className="flex flex-col items-start justify-between gap-10 xl:flex-row xl:items-center">
          <div className="flex w-full max-w-[1110px] flex-col gap-[12px]">
            <h2
              className="font-semibold"
              style={{ fontSize: "clamp(40px, 5.6vw, 96px)", color: INK }}
            >
              See what holds up.
            </h2>
            <Link href={enter} className="group flex items-start self-start">
              <span
                className="whitespace-nowrap font-medium uppercase underline decoration-dotted transition-colors group-hover:text-[#6b2d5c]"
                style={{ fontSize: "clamp(20px, 2vw, 32px)", color: MUTED }}
              >
                Start asking
              </span>
              <Image
                src="/landing/arrow-up-right.svg"
                alt=""
                width={40}
                height={40}
                className="block size-[40px]"
              />
            </Link>
          </div>
          <Wordmark size={32} tone={MUTED} src="/landing/logo-dots-footer.svg" />
        </div>
      </section>

      {/* The legal pages are a requirement of the terms people accept at
          sign-up, so they need a route from the public page. Not in the
          design; kept quiet at the very bottom rather than added to it. */}
      <footer className="mx-auto w-full max-w-[1728px] px-4 pb-10 sm:px-8 xl:px-[160px]">
        <p className="text-[13px]" style={{ color: MUTED }}>
          <Link href="/privacy" className="hover:underline">
            Privacy
          </Link>
          {" · "}
          <Link href="/terms" className="hover:underline">
            Terms
          </Link>
        </p>
      </footer>
    </div>
  );
}
