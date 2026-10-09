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
  now: Date = new Date(),
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
  return { text: "Welcome back, night owl", band: "night" };
}

/** "Welcome back, Joe" - no clock, for the notice shown when the app opens. */
export function welcomeBackFor(displayName: string | null | undefined): string {
  const name = firstNameOf(displayName);
  return name ? `Welcome back, ${name}` : "Welcome back";
}
