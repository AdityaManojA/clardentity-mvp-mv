/* What the app says when it sees you.
 *
 * Three places use this: the empty chat, the "welcome back" notice when the
 * app is opened, and the first-run welcome. They share one function so the
 * product does not greet you two different ways in the same minute.
 *
 * The clock is the browser's, not the server's. A greeting is about where
 * the person is sitting, and the one thing worse than no greeting is being
 * told good morning at nine in the evening.
 */

/** First name only, and only if it looks like one.
 *
 *  display_name is free text - people put their full name, their company,
 *  an email address or nothing at all. "Good morning, jo@example.com" is
 *  worse than "Good morning", so anything that doesn't read as a name is
 *  dropped rather than pasted in.
 */
export function firstNameOf(displayName: string | null | undefined): string | null {
  const first = (displayName ?? "").trim().split(/\s+/)[0] ?? "";
  if (first.length < 2 || first.length > 24) return null;
  if (first.includes("@")) return null;
  // Letters, and the punctuation that appears inside real names.
  if (!/^[\p{L}][\p{L}'’-]*$/u.test(first)) return null;
  return first;
}

export type GreetingOptions = {
  /** The clock to read. Injectable so the bands can be tested. */
  now?: Date;
  /** True when this is the account's very first visit - see isFirstRun. */
  firstRun?: boolean;
};

export type Greeting = {
  /** "Good morning, Joe" - the whole line, ready to render. */
  text: string;
  /** Which band of the day it fell in, for anything that wants to vary. */
  band: "morning" | "afternoon" | "evening" | "night";
};

/** The time-of-day greeting.
 *
 *  Bands are the ordinary English ones, except that the small hours get
 *  their own. "Good morning" at 3am is technically right and reads as a
 *  machine that has never been awake at 3am.
 */
export function greetingFor(
  displayName: string | null | undefined,
  { now = new Date(), firstRun = false }: GreetingOptions = {},
): Greeting {
  const name = firstNameOf(displayName);
  const hour = now.getHours();

  if (hour >= 5 && hour < 12) {
    return { text: name ? `Good morning, ${name}` : "Good morning", band: "morning" };
  }
  if (hour >= 12 && hour < 17) {
    return { text: name ? `Good afternoon, ${name}` : "Good afternoon", band: "afternoon" };
  }
  if (hour >= 17 && hour < 22) {
    return { text: name ? `Good evening, ${name}` : "Good evening", band: "evening" };
  }
  // 22:00-04:59. The name gives way to the epithet here rather than joining
  // it - "night owl Joe" is not a thing anybody says - and this is the one
  // hour of the day when a greeting can be a small kindness rather than
  // furniture.
  //
  // "Welcome back" only to someone who has been here before. This is the
  // single band whose wording makes a claim about the past, so it is the
  // single band that has to know whether the claim is true.
  return {
    text: firstRun ? "Hello, night owl" : "Welcome back, night owl",
    band: "night",
  };
}

/** "Welcome back, Joe" - no clock, for the notice shown when the app opens. */
export function welcomeBackFor(displayName: string | null | undefined): string {
  const name = firstNameOf(displayName);
  return name ? `Welcome back, ${name}` : "Welcome back";
}

/** How long after finishing the first-run welcome an account still counts
 *  as new. Long enough to cover reading the welcome screen and walking the
 *  coachmark tour, short enough that it has lapsed by the next visit.
 */
const FIRST_RUN_MINUTES = 20;

/** Whether this account has only just arrived.
 *
 *  Nothing reads as assembled-from-parts quite like being told "welcome
 *  back" fifteen seconds after signing up, which is exactly what a sign-up
 *  after ten at night used to get - twice, once in the notice and once in
 *  the empty chat.
 *
 *  The onboarding timestamp is the only thing already on the client that
 *  dates an account: null means the welcome questions have not been
 *  answered yet, and a timestamp from a minute ago means they were answered
 *  a minute ago. No new field, no extra request.
 */
export function isFirstRun(
  onboardingCompletedAt: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!onboardingCompletedAt) return true;
  const finished = Date.parse(onboardingCompletedAt);
  // An unreadable timestamp is not evidence of newness. Fall back to
  // treating the account as established, which is the wrong guess that
  // nobody notices.
  if (Number.isNaN(finished)) return false;
  return now.getTime() - finished < FIRST_RUN_MINUTES * 60_000;
}
