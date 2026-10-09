/* The chat's question cards on mobile (M24-M27): the four gates the server
 * can raise instead of answering - refined question, clarifying options,
 * context question, mode suggestion (TECHNICAL_GUIDE §5).
 *
 * Each test scripts the stream: the first send gets a gate, the resend gets
 * an answer, and every request body is captured. Two kinds of check:
 *   hard  - the behaviour: the card appears, nothing is written, and the
 *           resend carries the right content and "already answered" flag
 *           (drop the flag and the user is asked the same thing forever)
 *   soft  - phone layout: fits 375px, not under the composer, 44px tap areas.
 *           Soft so one run reports every layout problem at once; they still
 *           fail the test. */
import type { Page } from "@playwright/test";
import { test, expect, sel, signIn, press, thread, sseBody, horizontalOverflow, expectTappable } from "./fixtures";

test.describe.configure({ timeout: 60_000 });

type Body = { content: string; mode: string; mode_confirmed?: boolean; context_acknowledged?: boolean; context_rounds?: number; refined_confirmed?: boolean; clarifying_confirmed?: boolean };
type Step = [event: string, data: unknown] | null; // null = let the mock answer normally

/** Opens the chat with a scripted stream: send #n gets steps[n] (a gate), and
 *  anything past the script is answered by the default mock. */
async function chatWithGates(page: Page, steps: Step[]) {
  const bodies: Body[] = [];
  await signIn(page, {
    messages: thread(1),
    handlers: {
      "POST /chat/c1/messages": (req) => {
        bodies.push(req.postDataJSON() as Body);
        const step = steps[bodies.length - 1];
        return step ? { sse: sseBody([step]) } : undefined;
      },
    },
  });
  await page.goto("/chat/c1");
  await expect(page.locator(sel.composer)).toBeEditable({ timeout: 30_000 });
  return bodies;
}

async function ask(page: Page, text: string) {
  await page.locator(sel.composer).fill(text);
  await press(page, sel.send);
}

/** The phone-layout checks every card gets. */
async function cardFits(page: Page, card: ReturnType<Page["locator"]>, what: string) {
  await expect(card).toBeVisible();
  expect.soft(await horizontalOverflow(page), `${what}: page scrolls sideways`).toBeLessThanOrEqual(0);
  const c = (await card.boundingBox())!;
  expect.soft(c.x + c.width, `${what}: wider than the screen`).toBeLessThanOrEqual(376);
  const composer = (await page.locator(sel.composer).boundingBox())!;
  expect.soft(c.y + c.height, `${what}: sits under the composer`).toBeLessThanOrEqual(composer.y);
}

const assistantCount = (page: Page) => page.locator(`${sel.message}[data-role="assistant"]`).count();
const userCount = (page: Page) => page.locator(`${sel.message}[data-role="user"]`).count();

test.describe("refined question", () => {
  const gate: Step = ["refined_question", { refined_question: "What's the best coffee for a stovetop espresso maker?", refinement_reason: "Best depends on how you brew it." }];

  test("M24 Ask it this way: card, nothing written, resend reworded + confirmed @M24", async ({ page }) => {
    const bodies = await chatWithGates(page, [gate]);
    // history first: WebKit makes the composer editable a beat before the
    // thread renders, and counting then read 0
    await expect(page.locator(`${sel.message}[data-role="user"]`).first()).toBeVisible();
    const users = await userCount(page);
    await ask(page, "best cofee?");
    const card = page.locator("div", { hasText: /^Did you mean:/ }).filter({ has: page.getByRole("button", { name: "Ask it this way" }) }).last();
    await cardFits(page, card, "refined card");
    expect(await userCount(page), "the gated question isn't left in the thread").toBe(users);
    await expectTappable(page.getByRole("button", { name: "Ask it this way" }), "Ask it this way");
    await expectTappable(page.getByRole("button", { name: "Keep my wording" }), "Keep my wording");

    await page.getByRole("button", { name: "Ask it this way" }).tap();
    await expect.poll(() => bodies.length).toBe(2);
    expect(bodies[1].refined_confirmed).toBe(true);
    expect(bodies[1].content).toContain('(Clardentity asked: "Did you mean:');
    expect(bodies[1].content).toContain("stovetop espresso");
    await expect(page.getByRole("button", { name: "Ask it this way" })).toHaveCount(0);
    await expect(page.locator(`${sel.message}[data-role="assistant"]`).last()).toContainText("stovetop espresso");
  });

  test("M24b Keep my wording resends the original, confirmed; long suggestion still fits @M24", async ({ page }) => {
    const long: Step = ["refined_question", { refined_question: "Considering budget, brewing method, roast level, origin and how you take it - " + "which beans would suit you best? ".repeat(6), refinement_reason: "A long reason ".repeat(10) }];
    const bodies = await chatWithGates(page, [long]);
    await ask(page, "best cofee?");
    const keep = page.getByRole("button", { name: "Keep my wording" });
    await expect(keep).toBeVisible();
    const card = page.locator("div", { has: keep }).filter({ hasText: /^Did you mean:/ }).last();
    await cardFits(page, card, "long refined card");
    await keep.scrollIntoViewIfNeeded();
    await expect(keep).toBeInViewport();
    await keep.tap();
    await expect.poll(() => bodies.length).toBe(2);
    expect(bodies[1]).toMatchObject({ content: "best cofee?", refined_confirmed: true });
  });
});

test.describe("clarifying options", () => {
  const three: Step = ["clarifying_options", { question: "Which kind of budget do you mean?", options: ["Personal monthly budget", "A project budget", "Company annual budget"] }];

  test("M25 tap an option: resend with the answer, confirmed @M25", async ({ page }) => {
    const bodies = await chatWithGates(page, [three]);
    await ask(page, "help with my budget");
    const option = page.getByRole("button", { name: /A project budget/ });
    await expect(option).toBeVisible();
    const card = page.locator("div", { has: option }).filter({ hasText: "Which kind of budget" }).last();
    await cardFits(page, card, "options card");
    for (const o of ["Personal monthly budget", "A project budget", "Company annual budget"])
      await expectTappable(page.getByRole("button", { name: new RegExp(o) }), `option "${o}"`, 36); // stacked rows: 36px
    await expectTappable(page.getByRole("button", { name: "Something else" }), "Something else");
    await expectTappable(page.getByRole("button", { name: "Answer without this" }), "Answer without this");

    await option.tap();
    await expect.poll(() => bodies.length).toBe(2);
    expect(bodies[1].clarifying_confirmed).toBe(true);
    expect(bodies[1].content).toContain('(Clardentity asked: "Which kind of budget do you mean?")\nA project budget');
  });

  test("M25b many long options all reachable; typed answer with the keyboard up @M25", async ({ page }) => {
    const options = Array.from({ length: 7 }, (_, i) => `Option ${i + 1}: a deliberately long choice that has to wrap across the narrow phone screen`);
    const bodies = await chatWithGates(page, [["clarifying_options", { question: "Which of these fits best?", options }]]);
    await ask(page, "help me choose");
    await expect(page.getByRole("button", { name: /Option 1:/ })).toBeVisible();
    expect.soft(await horizontalOverflow(page), "7 long options: page scrolls sideways").toBeLessThanOrEqual(0);
    for (let i = 1; i <= 7; i++) {
      const b = page.getByRole("button", { name: new RegExp(`Option ${i}:`) });
      await b.scrollIntoViewIfNeeded();
      await expect(b, `option ${i} reachable`).toBeInViewport();
    }

    await page.getByRole("button", { name: "Something else" }).tap();
    const own = page.getByRole("textbox", { name: "Answer in your own words" });
    await own.tap();
    await page.setViewportSize({ width: 375, height: 480 }); // keyboard up (emulated)
    await page.waitForTimeout(300);
    // A real phone scrolls the focused field into view as the keyboard opens;
    // emulation doesn't, so do what the browser would and check it's reachable
    // (whether it lands in view by itself is a real-device check - Mv.md §9).
    if (!(await own.evaluate((el) => { const r = el.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; })))
      test.info().annotations.push({ type: "real-device check", description: "custom-answer box below the fold with the keyboard up until scrolled" });
    await own.scrollIntoViewIfNeeded();
    await expect(own).toBeInViewport();
    const send = page.locator("form").filter({ has: own }).getByRole("button", { name: "Send" });
    await expect(send).toBeDisabled(); // empty answer blocked
    await own.fill("None of them - a mix of 2 and 5");
    await expect(send).toBeInViewport();
    await expectTappable(send, "custom answer Send");
    await send.tap();
    await expect.poll(() => bodies.length).toBe(2);
    expect(bodies[1]).toMatchObject({ clarifying_confirmed: true });
    expect(bodies[1].content).toContain("None of them - a mix of 2 and 5");
    await page.setViewportSize({ width: 375, height: 812 });
  });

  test("M25c Answer without this: original wording, confirmed @M25", async ({ page }) => {
    const bodies = await chatWithGates(page, [three]);
    await ask(page, "help with my budget");
    await page.getByRole("button", { name: "Answer without this" }).tap();
    await expect.poll(() => bodies.length).toBe(2);
    expect(bodies[1]).toMatchObject({ content: "help with my budget", clarifying_confirmed: true });
  });
});

test.describe("context question", () => {
  const why = (q: string): Step => ["context_question", { question: q }];

  test("M26 answer with the keyboard up, then skip the second round @M26", async ({ page }) => {
    const bodies = await chatWithGates(page, [why("What's the decision this is for?"), why("Is there a deadline?")]);
    await ask(page, "should I move cities?");
    const box = page.getByPlaceholder("However much you want to say.");
    await expect(box).toBeFocused(); // autoFocus: ready to type
    const card = page.locator("div", { has: box }).filter({ hasText: "What's the decision" }).last();
    await cardFits(page, card, "context card");
    const send = page.getByRole("button", { name: "Send", exact: true });
    await expect(send).toBeDisabled();

    await page.setViewportSize({ width: 375, height: 480 }); // keyboard up (emulated)
    await page.waitForTimeout(300);
    await box.fill("A job offer in Berlin.");
    await expect(box).toBeInViewport();
    await expect(send).toBeInViewport();
    await expectTappable(send, "context Send");
    await expectTappable(page.getByRole("button", { name: "Answer without this" }), "context Answer without this");
    await send.tap();
    await expect.poll(() => bodies.length).toBe(2);
    expect(bodies[1]).toMatchObject({ context_rounds: 1, context_acknowledged: false });
    expect(bodies[1].content).toContain('(Clardentity asked: "What\'s the decision this is for?")\nA job offer in Berlin.');

    // round two: a fresh, empty box, and skipping is a hard stop
    await expect(page.getByText("Is there a deadline?")).toBeVisible();
    await expect(page.getByPlaceholder("However much you want to say.")).toHaveValue("");
    await page.getByRole("button", { name: "Answer without this" }).tap();
    await expect.poll(() => bodies.length).toBe(3);
    expect(bodies[2]).toMatchObject({ context_acknowledged: true, context_rounds: 1 });
    await page.setViewportSize({ width: 375, height: 812 });
    await expect(page.locator(`${sel.message}[data-role="assistant"]`).last()).toContainText("Mock answer");
  });
});

test.describe("mode suggestion", () => {
  test("M27 switches, says so, and Stay in Finder answers in the original mode @M27", async ({ page }) => {
    const bodies = await chatWithGates(page, [["mode_suggestion", { suggested_mode: "thinking", mode_reason: "This is a reflective question." }]]);
    const before = await assistantCount(page);
    await ask(page, "why do I keep procrastinating?");

    // automatic: resent in the suggested mode, marked settled
    await expect.poll(() => bodies.length).toBe(2);
    expect(bodies[1]).toMatchObject({ mode: "thinking", mode_confirmed: true });
    const toast = page.getByRole("status").filter({ hasText: "Switched to Thought coach" });
    await expect(toast).toBeVisible();
    const t = (await toast.boundingBox())!;
    expect.soft(t.x + t.width, "toast wider than the screen").toBeLessThanOrEqual(376);
    await expect(page.locator(sel.modeRail).getByRole("radio", { name: "Thought coach" })).toHaveAttribute("aria-checked", "true");

    const stay = page.getByRole("button", { name: "Stay in Finder" });
    await expectTappable(stay, "Stay in Finder");
    await stay.tap();
    await expect.poll(() => bodies.length).toBe(3);
    expect(bodies[2]).toMatchObject({ mode: "knowing", mode_confirmed: true, content: "why do I keep procrastinating?" });
    await expect(page.locator(sel.modeRail).getByRole("radio", { name: "Finder" })).toHaveAttribute("aria-checked", "true");
    await expect.poll(() => assistantCount(page)).toBeGreaterThan(before);
  });

  test("M27b the toast leaves on its own after ~4s; the switched answer stays @M27", async ({ page }) => {
    const bodies = await chatWithGates(page, [["mode_suggestion", { suggested_mode: "decision", mode_reason: null }]]);
    await ask(page, "rent or buy?");
    const toast = page.getByRole("status").filter({ hasText: "Switched to Decision-making" });
    await expect(toast).toBeVisible();
    await expect(toast).toHaveCount(0, { timeout: 7_000 });
    expect(bodies).toHaveLength(2);
    expect(bodies[1]).toMatchObject({ mode: "decision", mode_confirmed: true });
  });

  test("M27c suggesting a paid companion opens the upgrade dialog and answers in the chosen mode @M27", async ({ page }) => {
    const bodies = await chatWithGates(page, [["mode_suggestion", { suggested_mode: "creative", mode_reason: "Sounds like a design task." }]]);
    await ask(page, "design me a logo");
    const dialog = page.getByRole("dialog", { name: "Upgrade to Clardentity Pro" });
    await expect(dialog).toBeVisible();
    await expect.poll(() => bodies.length).toBe(2);
    expect(bodies[1]).toMatchObject({ mode: "knowing", mode_confirmed: true });
    const d = (await dialog.boundingBox())!;
    expect.soft(d.x >= 0 && d.x + d.width <= 376, "upgrade dialog fits the screen").toBe(true);
    // the X, not the backdrop (also labelled "Close")
    const close = dialog.getByRole("button", { name: "Close" }).last();
    await expectTappable(close, "upgrade dialog Close");
    await close.tap();
    await expect(dialog).toHaveCount(0);
    await expect(page.locator(sel.modeRail).getByRole("radio", { name: "Finder" })).toHaveAttribute("aria-checked", "true");
  });
});
