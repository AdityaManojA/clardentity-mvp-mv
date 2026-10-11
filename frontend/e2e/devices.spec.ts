/* Every screen on every kind of device (D-nodes).
 *
 * Users arrive on everything from a folded Galaxy to an iPad Pro and a wide
 * monitor, so this walks each screen at a range of real device sizes and
 * checks that every element can actually be seen and used:
 *
 *   - nothing makes the page scroll sideways
 *   - every button, link and field, scrolled into view the way a person
 *     would, sits fully on the screen and is the thing under a tap at its
 *     centre (nothing covering it)
 *   - no text is cut off without an ellipsis
 *   - on a chat, the composer sits fully on screen
 *
 * Runs in both mobile projects (Chromium and WebKit); each device below
 * supplies its own viewport, touch and mobile flags. */
import type { Page } from "@playwright/test";
import { test, expect, sel, mockApi, seedStorage, thread, settleAnimations, type MockOpts } from "./fixtures";

test.describe.configure({ timeout: 90_000 });

type Device = { name: string; width: number; height: number; touch: boolean };

const DEVICES: Device[] = [
  { name: "Galaxy Fold (folded)", width: 280, height: 653, touch: true },
  { name: "iPhone SE (1st gen)", width: 320, height: 568, touch: true },
  { name: "Galaxy S8", width: 360, height: 740, touch: true },
  { name: "iPhone SE", width: 375, height: 667, touch: true },
  { name: "Pixel 7", width: 412, height: 915, touch: true },
  { name: "iPhone 15 Pro Max", width: 430, height: 932, touch: true },
  { name: "Phone landscape", width: 844, height: 390, touch: true },
  { name: "iPad Mini", width: 768, height: 1024, touch: true },
  { name: "iPad Air", width: 820, height: 1180, touch: true },
  { name: "iPad landscape", width: 1180, height: 820, touch: true },
  { name: "iPad Pro", width: 1024, height: 1366, touch: true },
  { name: "Laptop", width: 1280, height: 720, touch: false },
  { name: "Desktop", width: 1920, height: 1080, touch: false },
];

type Screen = { name: string; path: string; opts?: MockOpts; signedIn?: boolean; drawer?: boolean; chat?: boolean };

const SCREENS: Screen[] = [
  { name: "landing", path: "/" },
  { name: "login", path: "/login" },
  { name: "register", path: "/register" },
  { name: "forgot password", path: "/forgot-password" },
  { name: "privacy", path: "/privacy" },
  { name: "terms", path: "/terms" },
  { name: "welcome", path: "/welcome", signedIn: true, opts: { onboarded: false } },
  { name: "chat thread", path: "/chat/c1", signedIn: true, chat: true, opts: { messages: thread(3) } },
  { name: "new chat", path: "/chat/c1", signedIn: true, chat: true },
  { name: "menu open", path: "/chat/c1", signedIn: true, drawer: true, opts: { messages: thread(1) } },
  { name: "workspaces", path: "/workspace", signedIn: true },
  { name: "workspace", path: "/workspace/w1", signedIn: true },
  { name: "documents", path: "/workspace/w1/documents", signedIn: true },
  { name: "search", path: "/workspace/w1/search", signedIn: true },
  { name: "profile", path: "/profile", signedIn: true },
  { name: "settings", path: "/settings", signedIn: true },
  { name: "admin", path: "/admin", signedIn: true, opts: { admin: true } },
];

/** Everything wrong with what's on screen now, as readable lines. */
async function problems(page: Page): Promise<string[]> {
  return page.evaluate(async () => {
    const out: string[] = [];
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const label = (el: Element) => {
      const t = (el.getAttribute("aria-label") || (el as HTMLElement).innerText || el.getAttribute("placeholder") || el.getAttribute("title") || "").trim().replace(/\s+/g, " ").slice(0, 40);
      return `${el.tagName.toLowerCase()} "${t}"`;
    };
    const shown = (el: Element) => {
      const r = el.getBoundingClientRect();
      if (r.width <= 1 || r.height <= 1) return false; // sr-only, collapsed
      for (let n: Element | null = el; n; n = n.parentElement) {
        const cs = getComputedStyle(n);
        if (cs.display === "none" || cs.visibility === "hidden") return false;
        if (n.getAttribute("aria-hidden") === "true" || (n as HTMLElement).inert) return false;
      }
      return true;
    };

    // sideways scroll
    for (const box of [document.documentElement, document.querySelector("main")]) {
      if (box && box.scrollWidth - box.clientWidth > 1) out.push(`page scrolls sideways by ${box.scrollWidth - box.clientWidth}px`);
    }

    // every control: on screen once scrolled to, and not covered
    // With a modal open (the phone menu, a sheet), only it can be used.
    const modal = [...document.querySelectorAll('[aria-modal="true"]')].filter(shown).at(-1) ?? document;
    const controls = [...modal.querySelectorAll("button, a[href], input:not([type=hidden]), textarea, select, [role=radio], [role=tab], [role=menuitem]")].filter(shown);
    for (const el of controls) {
      el.scrollIntoView({ block: "center", inline: "center" });
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const r = el.getBoundingClientRect();
      if (r.left < -1 || r.right > vw + 1) {
        out.push(`${label(el)} off screen sideways (${Math.round(r.left)}..${Math.round(r.right)} of ${vw})`);
        continue;
      }
      if (r.height <= vh && (r.top < -1 || r.bottom > vh + 1)) {
        out.push(`${label(el)} can't be scrolled fully on screen (${Math.round(r.top)}..${Math.round(r.bottom)} of ${vh})`);
        continue;
      }
      // clipped by a scroll box or overflow:hidden ancestor
      let clipped = false;
      for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
        const cs = getComputedStyle(n);
        if (cs.overflowX === "visible" && cs.overflowY === "visible") continue;
        const b = n.getBoundingClientRect();
        if (r.left < b.left - 1 || r.right > b.right + 1 || r.top < b.top - 1 || r.bottom > b.bottom + 1) {
          // a fraction peeking out of a fading scroll row is by design; most of it hidden is not
          const visW = Math.min(r.right, b.right) - Math.max(r.left, b.left);
          const visH = Math.min(r.bottom, b.bottom) - Math.max(r.top, b.top);
          if (visW < r.width * 0.9 || visH < r.height * 0.9) {
            out.push(`${label(el)} cut off by its container (${Math.round(visW)}x${Math.round(visH)} of ${Math.round(r.width)}x${Math.round(r.height)} visible)`);
            clipped = true;
          }
          break;
        }
      }
      if (clipped) continue;
      const cx = Math.min(Math.max(r.left + r.width / 2, 0), vw - 1);
      const cy = Math.min(Math.max(r.top + r.height / 2, 0), vh - 1);
      const hit = document.elementFromPoint(cx, cy);
      if (hit && hit !== el && !el.contains(hit) && !hit.contains(el)) {
        // a label wrapping its own input counts as the input
        const lab = hit.closest("label");
        if (!(lab && (lab.contains(el) || (lab as HTMLLabelElement).control === el))) {
          out.push(`${label(el)} covered by ${label(hit)}`);
        }
      }
    }
    window.scrollTo(0, 0);

    // text cut off without an ellipsis
    for (const el of document.querySelectorAll("h1, h2, h3, h4, p, span, label, button, a, li, td, th")) {
      if (!shown(el) || !(el as HTMLElement).innerText?.trim()) continue;
      const cs = getComputedStyle(el);
      if (cs.overflowX === "visible" || cs.textOverflow === "ellipsis") continue;
      if (cs.webkitLineClamp && cs.webkitLineClamp !== "none") continue;
      const h = el as HTMLElement;
      if (h.scrollWidth > h.clientWidth + 2 && cs.overflowX !== "auto" && cs.overflowX !== "scroll")
        out.push(`${label(el)} text cut off (${h.scrollWidth}px in ${h.clientWidth}px)`);
    }
    return [...new Set(out)];
  });
}

for (const device of DEVICES) {
  test.describe(device.name, () => {
    test.use({
      viewport: { width: device.width, height: device.height },
      hasTouch: device.touch,
      isMobile: device.touch && device.width < 1024,
    });

    for (const screen of SCREENS) {
      test(`D ${device.name} ${device.width}x${device.height}: ${screen.name} @D`, async ({ page }) => {
        await mockApi(page, screen.opts ?? {});
        await seedStorage(page, { signedIn: !!screen.signedIn });
        await page.goto(screen.path);
        await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => undefined);
        if (screen.chat) await expect(page.locator(sel.composer)).toBeVisible({ timeout: 30_000 });
        if (screen.drawer) {
          const open = page.locator(sel.openNav);
          if (await open.isVisible()) {
            await open.click();
            await expect(page.locator(sel.drawer)).toBeVisible();
          }
        }
        await settleAnimations(page);

        if (screen.chat) {
          const r = await page.locator(sel.composer).boundingBox();
          const vh = await page.evaluate(() => window.innerHeight);
          expect.soft(r && r.y >= 0 && r.y + r.height <= vh + 1, `composer fully on screen (${r?.y}..${r ? r.y + r.height : "?"} of ${vh})`).toBe(true);
        }
        // the top bar's page title gets room to be read
        const crumb = page.locator('nav[aria-label="Breadcrumb"]');
        if (!screen.drawer && (await crumb.isVisible().catch(() => false))) {
          // a short title is narrow and that's fine; a cut-off one must still have room
          const t = await crumb.locator(".truncate").last().evaluate((el) => ({ cut: el.scrollWidth > el.clientWidth + 1, w: el.getBoundingClientRect().width, text: el.textContent }));
          if (t.cut) expect.soft(t.w, `page title "${t.text}" cut to ${Math.round(t.w)}px`).toBeGreaterThanOrEqual(80);
        }
        // a thread keeps a fair share of the screen (a phone held sideways)
        if (screen.name === "chat thread") {
          const list = await page.locator(sel.messageList).boundingBox();
          const vh = await page.evaluate(() => window.innerHeight);
          expect.soft((list?.height ?? 0) / vh, "the conversation gets at least a quarter of the screen").toBeGreaterThanOrEqual(0.25);
        }
        const found = await problems(page);
        expect(found, found.join("\n")).toEqual([]);
      });
    }
  });
}
