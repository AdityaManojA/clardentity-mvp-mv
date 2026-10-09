/* Chat screen on mobile (M12-M15, M10b). Mocked backend: the chat stream is
 * served as one CRLF-framed SSE body (fixtures.sseBody), so the client's real
 * parser runs, but the frames arrive together - token-by-token pacing is not
 * observable here (see Mv.md, limits). Real-backend variants are in live.spec.ts. */
import type { Page } from "@playwright/test";
import { test, expect, sel, signIn, press, thread, msg, horizontalOverflow, swipeCarousel, type Msg, type MockOpts } from "./fixtures";

const W = 375;

async function openChat(page: Page, messages: Msg[], handlers: MockOpts["handlers"] = {}) {
  await signIn(page, { messages, handlers });
  await page.goto("/chat/c1");
  // generous: the first visit compiles the chat route in dev
  await expect(page.locator(sel.composer)).toBeEditable({ timeout: 30_000 });
}

const distanceFromBottom = (page: Page) =>
  page.locator(sel.messageList).first().evaluate((el) => el.scrollHeight - el.scrollTop - el.clientHeight);

test.describe.configure({ timeout: 60_000 }); // chat route compile + streamed turns in dev

test.describe("chat composer", () => {
  test("M12 typing: tap focus, multi-line grows, send stays clear, empty blocked @M12", async ({ page }) => {
    await openChat(page, thread(2));
    const box = page.locator(sel.composer);
    const send = page.locator(sel.send);

    await box.tap();
    await expect(box).toBeFocused();
    await expect(send).toBeDisabled(); // empty: nothing to send
    await box.fill("   ");
    await expect(send).toBeDisabled(); // whitespace only

    const h0 = (await box.boundingBox())!.height;
    await box.fill("");
    await page.keyboard.insertText("first line");
    // touch keyboard: Enter is a new line, not send (lib/useTouchKeyboard.ts)
    await page.keyboard.press("Enter");
    await page.keyboard.insertText("second line");
    await page.keyboard.press("Enter");
    await page.keyboard.insertText("third line");
    await expect(box).toHaveValue("first line\nsecond line\nthird line");
    await expect(page.locator(`${sel.message}[data-role="user"]`)).toHaveCount(2); // nothing sent
    await page.keyboard.press("Enter");
    // insertText, not type(): per-key typing runs the dev build's spell-check
    // and a re-render on every character, which put this test at ~28s of 30
    await page.keyboard.insertText("fourth line, and a long one that wraps across the narrow phone width");
    expect((await box.boundingBox())!.height).toBeGreaterThan(h0);

    // the grown textarea never sits on top of the send button
    const t = (await box.boundingBox())!;
    const s = (await send.boundingBox())!;
    const overlap = !(s.x >= t.x + t.width || s.x + s.width <= t.x || s.y >= t.y + t.height || s.y + s.height <= t.y);
    expect(overlap).toBe(false);
    await expect(send).toBeInViewport();
    await expect(send).toBeEnabled();
  });

  test("M13 send by tap, list follows, scrolled-up reader isn't yanked @M13 @critical", async ({ page }) => {
    await openChat(page, thread(6));
    await expect.poll(() => distanceFromBottom(page)).toBeLessThan(80); // opens at the newest message

    await page.locator(sel.composer).tap();
    await page.locator(sel.composer).fill("Hello from a phone");
    await press(page, sel.send);
    await expect(page.locator(`${sel.message}[data-role="user"]`).last()).toContainText("Hello from a phone");
    await expect(page.locator(`${sel.message}[data-role="assistant"]`).last()).toContainText("Mock answer to: Hello from a phone");
    await expect(page.locator(sel.composer)).toBeEditable(); // usable again after `answer`
    await expect(page.locator(sel.composer)).toHaveValue("");
    await expect.poll(() => distanceFromBottom(page)).toBeLessThan(80);

    // reading history: scroll up, then a new turn arrives. Wait for the app's
    // own smooth scroll to finish first - WebKit doesn't cancel an in-flight
    // smooth scroll for a programmatic jump (a real finger does), so jumping
    // mid-animation lands back at the bottom. That raced once under load.
    const list = page.locator(sel.messageList).first();
    let last = -1;
    await expect.poll(async () => {
      const now = await list.evaluate((el) => el.scrollTop);
      const settled = now === last;
      last = now;
      return settled;
    }, { intervals: [250] }).toBe(true);
    await list.evaluate((el) => el.scrollTo({ top: 0, behavior: "instant" }));
    await list.dispatchEvent("scroll");
    await expect.poll(() => list.evaluate((el) => el.scrollTop)).toBeLessThan(80);
    await page.locator(sel.composer).fill("Second question");
    await press(page, sel.send);
    await expect(page.locator(`${sel.message}[data-role="assistant"]`).last()).toContainText("Second question");
    expect(await page.locator(sel.messageList).first().evaluate((el) => el.scrollTop)).toBeLessThan(80);
  });

  test("M14 long words, code and tables stay inside the bubble @M14", async ({ page }) => {
    const long = [
      msg("q1", "user", "Show me something wide"),
      msg("a1", "assistant",
        "Supercalifragilisticexpialidocious".repeat(4) + "\n\n" +
        "```\nconst aVeryLongVariableName = someFunctionCall(argumentNumberOne, argumentNumberTwo, argumentNumberThree);\n```\n\n" +
        "| Column A | Column B | Column C | Column D | Column E |\n|---|---|---|---|---|\n| value one | value two | value three | value four | value five |",
        "knowing", "q1"),
    ];
    await openChat(page, long);
    await expect(page.locator(sel.message).last()).toBeVisible();
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    const list = page.locator(sel.messageList).first();
    expect(await list.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(0);
    const b = (await page.locator(sel.message).last().boundingBox())!;
    expect(b.x + b.width).toBeLessThanOrEqual(W + 1);
  });
});

test.describe("modes", () => {
  test("M15 mode rail: every mode reachable, selection is semantic, persists after send @M15", async ({ page }) => {
    let sentMode = "";
    await openChat(page, thread(1), {
      "POST /chat/c1/messages": (req) => {
        sentMode = (req.postDataJSON() as { mode: string }).mode;
        return undefined; // fall through to the default stream
      },
    });
    const rail = page.locator(sel.modeRail);
    const radios = rail.getByRole("radio");
    await expect(radios).toHaveCount(8);
    await expect(rail.getByRole("radio", { checked: true })).toHaveCount(1);

    for (const label of ["Decision-making", "Thought coach", "Learning", "Finder"]) {
      const r = rail.getByRole("radio", { name: label });
      await r.scrollIntoViewIfNeeded();
      await r.tap();
      await expect(r).toHaveAttribute("aria-checked", "true");
      await expect(rail.getByRole("radio", { checked: true })).toHaveCount(1);
    }
    // preview companions are reachable but marked, and open the upgrade prompt
    for (const label of ["Co-Creative", "Mentoring", "Reflect & Relieve", "Legal"]) {
      const r = rail.getByRole("radio", { name: label });
      await r.scrollIntoViewIfNeeded();
      await expect(r).toBeInViewport();
      await expect(r).toHaveAttribute("aria-disabled", "true");
    }
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0); // the rail scrolls itself, not the page

    const thinking = rail.getByRole("radio", { name: "Thought coach" });
    await thinking.scrollIntoViewIfNeeded();
    await thinking.tap();
    await page.locator(sel.composer).fill("Help me think this through");
    await press(page, sel.send);
    await expect(page.locator(`${sel.message}[data-role="assistant"]`).last()).toContainText("think this through");
    expect(sentMode).toBe("thinking");
    await expect(thinking).toHaveAttribute("aria-checked", "true");
  });

  test("M10b carousel: swipe and arrows change mode, stop at the edges, vertical scroll free @M10", async ({ page, browserName }) => {
    const k = thread(4, "knowing", "k");
    const t = thread(4, "thinking", "t");
    t[0].parent_id = k.at(-1)!.id;
    await openChat(page, [...k, ...t]);

    // multi-mode thread: pill row, then enter the carousel on the Finder track
    await page.getByRole("button", { name: "Finder", pressed: false }).tap();
    const nav = page.locator(sel.carouselNav);
    await expect(nav).toContainText("1/2");
    await expect(nav.getByRole("button", { name: "Previous mode" })).toBeDisabled();

    await swipeCarousel(page, -160); // finger right-to-left: next track
    await expect(nav).toContainText("2/2");
    await expect(page.locator(sel.modeRail).getByRole("radio", { name: "Thought coach" })).toHaveAttribute("aria-checked", "true");
    await swipeCarousel(page, -160); // already last: stays
    await expect(nav).toContainText("2/2");
    await swipeCarousel(page, 30); // under the 70px commit threshold: no change
    await expect(nav).toContainText("2/2");
    await swipeCarousel(page, 160); // back
    await expect(nav).toContainText("1/2");

    await nav.getByRole("button", { name: "Next mode" }).tap();
    await expect(nav).toContainText("2/2");
    await expect(nav.getByRole("button", { name: "Next mode" })).toBeDisabled();

    // a vertical drag over the carousel scrolls the message list (Chromium:
    // real touch input via CDP; WebKit has no equivalent - real-device check)
    if (browserName === "chromium") {
      const list = page.locator('section[aria-hidden="false"] [data-testid="message-list"]');
      await list.evaluate((el) => el.scrollTo({ top: el.scrollHeight }));
      const before = await list.evaluate((el) => el.scrollTop);
      const r = (await page.locator(".carousel-viewport").boundingBox())!;
      const cdp = await page.context().newCDPSession(page);
      const at = (y: number) => [{ x: r.x + r.width / 2, y, id: 1 }];
      await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: at(r.y + 150) });
      for (let i = 1; i <= 10; i++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: at(r.y + 150 + i * 30) });
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await page.waitForTimeout(300);
      expect(await list.evaluate((el) => el.scrollTop)).toBeLessThan(before);
      await expect(nav).toContainText("2/2"); // a vertical drag doesn't switch tracks
    } else {
      test.info().annotations.push({ type: "limitation", description: "WebKit: vertical touch-scroll over the carousel not simulated" });
    }
  });
});

test("M14b answer card: the unchecked side stays hidden until flipped, in every engine @M14", async ({ page }) => {
  const t = thread(1);
  t[1].counterfactual_content = "The case against, with the caveats taken out.";
  await signIn(page, {
    messages: t,
    handlers: { "POST /chat/c1/messages/ta0/devils-advocate": () => ({ body: { counterfactual_content: t[1].counterfactual_content } }) },
  });
  await page.goto("/chat/c1");
  await expect(page.locator(sel.composer)).toBeEditable({ timeout: 30_000 });
  const label = page.getByText("Unchecked - caveats removed");
  const front = page.locator(`${sel.message}[data-role="assistant"]`).getByText("Answer 1.");
  // was painted, mirrored, through the front of every answer in WebKit
  await expect(label).toBeHidden();
  await expect(front).toBeVisible();

  await page.getByRole("button", { name: "Flip to the unchecked version" }).tap();
  await expect(label).toBeVisible();
  await expect(front).toBeHidden();
  await page.getByRole("button", { name: "Show the checked answer" }).tap();
  await expect(label).toBeHidden();
  await expect(front).toBeVisible();
});
