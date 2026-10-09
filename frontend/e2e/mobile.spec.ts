/* Mobile M-nodes. Runs in the `mobile` project: Pixel 5, 375x812, touch.
 * Responsive app - same URLs as web; only the drawer controls differ (see sel).
 * Upstream T-deps are in the table at the end of e2e/README.md. */
import type { Page } from "@playwright/test";
import { test, expect, sel, login, mockApi, seedStorage, press, KEYS, LIVE } from "./fixtures";

const W = 375;
const H = 812;

/** Side-scroll on the page or inside <main> (the shell's own scroll box, which
 *  scrolls sideways on its own when content is too wide). */
async function horizontalOverflow(page: Page) {
  return page.evaluate(() =>
    Math.max(
      ...[document.documentElement, document.querySelector("main")]
        .filter((e): e is HTMLElement => !!e)
        .map((e) => e.scrollWidth - e.clientWidth),
    ),
  );
}

/** Visible elements whose right edge passes the viewport - the usual cause of side-scroll. */
async function offenders(page: Page) {
  return page.evaluate((w) => {
    return [...document.querySelectorAll<HTMLElement>("body *")]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return false;
        // ignore content clipped by a scrolling/overflow-hidden ancestor
        for (let p = el.parentElement; p; p = p.parentElement) {
          const o = getComputedStyle(p).overflowX;
          if (o === "hidden" || o === "auto" || o === "scroll" || o === "clip") return false;
        }
        return r.right > w + 1;
      })
      .slice(0, 5)
      .map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].slice(0, 3).join(".")}`);
  }, W);
}

/** A real finger drag (touchStart/Move/End), not a wheel event. */
async function touchSwipe(page: Page, x1: number, y1: number, x2: number, y2: number, steps = 12) {
  const cdp = await page.context().newCDPSession(page);
  const at = (x: number, y: number) => [{ x, y, id: 1 }];
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: at(x1, y1) });
  for (let i = 1; i <= steps; i++)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove", touchPoints: at(x1 + ((x2 - x1) * i) / steps, y1 + ((y2 - y1) * i) / steps),
    });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await page.waitForTimeout(300);
}

async function openDrawer(page: Page) {
  await press(page, sel.openNav);
  const drawer = page.locator("div.fixed.inset-0.z-40 aside");
  await expect(drawer).toBeVisible();
  return drawer;
}

test.describe("render & layout", () => {
  test("M01 viewport render @M01", async ({ signedIn: page }) => {
    for (const path of ["/workspace", "/login"]) {
      // signed out for /login, or RedirectIfSignedIn sends it on to /start
      if (path === "/login") await page.evaluate((k) => { localStorage.removeItem(k.access); localStorage.removeItem(k.refresh); }, KEYS);
      await page.goto(path);
      // a rendered landmark, not "networkidle": the dev server's HMR socket
      // and polling keep the network busy indefinitely
      await page.locator(path === "/login" ? sel.email : sel.openNav).waitFor();
      expect(page.viewportSize()).toEqual({ width: W, height: H });
      expect(await horizontalOverflow(page), `side-scroll on ${path}: ${await offenders(page)}`).toBeLessThanOrEqual(0);
      const ox = await page.evaluate(() => [getComputedStyle(document.documentElement).overflowX, getComputedStyle(document.body).overflowX]);
      test.info().annotations.push({ type: "overflow-x", description: `${path} html/body: ${ox.join("/")}` });
      const minFont = await page.evaluate(() =>
        Math.min(...[...document.querySelectorAll<HTMLElement>("p, label, input, button, a, h1")]
          .filter((e) => e.offsetParent && e.innerText?.trim())
          .map((e) => parseFloat(getComputedStyle(e).fontSize))),
      );
      expect.soft(minFont, `smallest text on ${path}`).toBeGreaterThanOrEqual(12);
      if (path === "/workspace") await expect(page.locator(sel.openNav)).toBeVisible(); // mobile header, not sidebar
    }
  });

  test("M02 touch targets >= 44px @M02", async ({ signedIn: page }) => {
    await page.goto("/workspace");
    const small: string[] = [];
    const check = async (scope: string) => {
      for (const el of await page.locator(`${scope} :is(button, a[href]):visible`).all()) {
        const b = await el.boundingBox();
        if (b && (Math.round(b.width) < 44 || Math.round(b.height) < 44)) {
          const name = (await el.getAttribute("aria-label")) ?? (await el.innerText()).trim().slice(0, 24);
          small.push(`${scope} "${name}" ${Math.round(b.width)}x${Math.round(b.height)}`);
        }
      }
    };
    await check("header");
    // enlarged hit areas must not overlap their neighbours
    const hdr = (await Promise.all((await page.locator("header button:visible").all()).map((el) => el.boundingBox())))
      .filter(Boolean)
      .sort((p, q) => p!.x - q!.x) as { x: number; width: number }[];
    for (let i = 1; i < hdr.length; i++) expect.soft(hdr[i].x).toBeGreaterThanOrEqual(hdr[i - 1].x + hdr[i - 1].width - 1);
    const drawer = await openDrawer(page);
    await check("div.fixed.inset-0.z-40 aside");
    // nav items must not overlap each other
    const boxes = (await Promise.all((await drawer.locator("nav a").all()).map((a) => a.boundingBox()))).filter(Boolean) as { y: number; height: number }[];
    for (let i = 1; i < boxes.length; i++) expect.soft(boxes[i].y).toBeGreaterThanOrEqual(boxes[i - 1].y + boxes[i - 1].height - 1);
    expect(small, small.join("\n")).toEqual([]);
  });
});

test.describe("navigation", () => {
  test("M03 drawer: open/close, focus trap, back @M03", async ({ signedIn: page }) => {
    await page.goto("/workspace");
    const drawer = await openDrawer(page);
    await press(page, sel.closeNav);
    await expect(drawer).toBeHidden();

    await openDrawer(page);
    // the drawer covers the backdrop's centre; tap the strip to its right
    await page.locator(sel.navBackdrop).tap({ position: { x: W - 20, y: H / 2 } });
    await expect(drawer).toBeHidden();

    // a11y: modal semantics + focus stays inside while open
    await openDrawer(page);
    await expect.soft(page.locator('[role="dialog"][aria-modal="true"]'), "drawer has no dialog/aria-modal").toHaveCount(1);
    let escaped = 0;
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press("Tab");
      if (!(await page.evaluate(() => !!document.activeElement?.closest("div.fixed.inset-0.z-40")))) escaped++;
    }
    expect.soft(escaped, "focus left the open drawer on Tab").toBe(0);
    await page.keyboard.press("Escape");
    await expect.soft(drawer, "Escape should close the drawer").toBeHidden();

    // Android/hardware Back while open should close the drawer, not leave the page
    await page.goto("/workspace");
    await openDrawer(page);
    await page.goBack();
    await expect.soft(page, "Back with drawer open navigated away").toHaveURL(/\/workspace$/);

    // Back after navigating through the drawer returns to where we were
    // (from a workspace, so Search goes somewhere other than this page)
    await page.goto("/workspace/w1");
    const d = await openDrawer(page);
    await d.getByRole("link", { name: "Search" }).tap();
    await expect(page).toHaveURL(/\/workspace\/w1\/search$/, { timeout: 15_000 }); // first hit compiles the route in dev
    await page.goBack();
    await expect(page).toHaveURL(/\/workspace\/w1$/);
  });
});

test.describe("auth & core", () => {
  test("M04 login on mobile -> /chat @M04 @critical", async ({ app: page }) => {
    await page.goto("/login");
    await page.locator(sel.email).tap();
    await expect(page.locator(sel.email)).toBeFocused();
    await expect(page.locator(sel.email)).toHaveAttribute("inputmode", "email"); // email keyboard
    await page.locator(sel.email).fill(process.env.E2E_EMAIL ?? "e2e@clardentity.test");
    await page.locator(sel.password).tap();
    await page.locator(sel.password).fill(process.env.E2E_PASSWORD ?? "e2e-password");
    // keyboard open: shrink the viewport like the visual viewport does
    await page.setViewportSize({ width: W, height: 480 });
    await page.waitForTimeout(300);
    await page.locator(sel.loginSubmit).scrollIntoViewIfNeeded();
    await expect(page.locator(sel.loginSubmit)).toBeInViewport();
    await press(page, sel.loginSubmit);
    await page.waitForURL(/\/(start|chat\/)/);
    await page.setViewportSize({ width: W, height: H });
  });

  test("M05 workspace cards scale, no cut-off @M05 @critical", async ({ signedIn: page }) => {
    await page.goto("/workspace");
    const cards = page.locator('a[href^="/workspace/w"]');
    await expect(cards.first()).toBeVisible();
    for (const c of await cards.all()) {
      const b = (await c.boundingBox())!;
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width).toBeLessThanOrEqual(W);
    }
    // long name truncates inside its card instead of pushing it wider
    const long = page.locator("span.truncate", { hasText: "deliberately long name" });
    expect(await long.evaluate((e) => e.scrollWidth > e.clientWidth && getComputedStyle(e).textOverflow === "ellipsis")).toBe(true);
    // state change visible: Create opens the inline composer
    await press(page, sel.wsCreate);
    await expect(page.locator(sel.wsName)).toBeVisible();
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });

  test("M06 form + keyboard: submit stays reachable @M06 @critical", async ({ signedIn: page }) => {
    await page.goto("/workspace");
    await press(page, sel.wsCreate);
    const input = page.locator(sel.wsName);
    await expect(input).toBeFocused();
    await page.setViewportSize({ width: W, height: 480 }); // keyboard up
    await page.waitForTimeout(300);
    await expect(page.locator(sel.wsSubmit)).toBeInViewport();
    await expect(page.locator(sel.wsSubmit)).toBeDisabled(); // validation: empty name
    await input.fill("Mobile workspace");
    await expect(page.locator(sel.wsSubmit)).toBeEnabled();
    await press(page, sel.wsSubmit);
    await expect(page.getByText("Mobile workspace")).toBeVisible();
    await page.setViewportSize({ width: W, height: H });
  });

  test("M07 network error in mobile layout @M07", async ({ page }) => {
    test.skip(LIVE, "uses the network mock");
    await mockApi(page, { failWorkspaces: true });
    await seedStorage(page, { signedIn: true });
    await page.goto("/workspace");
    const banner = page.locator(sel.errorBanner).first();
    await expect(banner).toBeVisible();
    await expect(banner).not.toBeEmpty();
    const b = (await banner.boundingBox())!;
    expect(b.x + b.width).toBeLessThanOrEqual(W);
    await expect(page.locator(sel.openNav)).toBeVisible(); // shell intact, not a white screen
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });
});

test.describe("scroll & gestures", () => {
  test("M08 scroll + sticky header doesn't cover inputs @M08", async ({ page }) => {
    if (!LIVE) await mockApi(page, { extraWorkspaces: 12 });
    await seedStorage(page, { signedIn: !LIVE });
    if (LIVE) await login(page);
    await page.goto("/workspace");
    await expect(page.locator('a[href^="/workspace/x11"]')).toBeAttached();
    const main = page.locator("main");
    const top = await main.evaluate((m) => m.scrollHeight > m.clientHeight);
    expect(top, "content should overflow and scroll at 812h").toBe(true);
    await main.evaluate((m) => m.scrollTo(0, m.scrollHeight));
    await expect(page.locator('a[href^="/workspace/x11"]')).toBeInViewport();
    const header = (await page.locator(sel.header).boundingBox())!;
    expect(header.y).toBe(0); // stays put while main scrolls
    await main.evaluate((m) => m.scrollTo(0, 0));
    await press(page, sel.wsCreate);
    const input = (await page.locator(sel.wsName).boundingBox())!;
    expect(input.y).toBeGreaterThanOrEqual(header.y + header.height);
  });

  test("M09 orientation portrait <-> landscape @M09", async ({ signedIn: page }) => {
    await page.goto("/workspace");
    for (const vp of [{ width: H, height: W }, { width: W, height: H }]) {
      await page.setViewportSize(vp);
      await page.waitForTimeout(300);
      expect(await horizontalOverflow(page), `${vp.width}x${vp.height}`).toBeLessThanOrEqual(0);
      await expect(page.locator(sel.openNav)).toBeVisible(); // < lg (1024): still the drawer
      const drawer = await openDrawer(page);
      const b = (await drawer.boundingBox())!;
      expect(b.height).toBeLessThanOrEqual(vp.height + 1);
      expect(b.width).toBeLessThan(vp.width);
      await press(page, sel.closeNav);
    }
  });

  test("M10 vertical swipe still scrolls @M10", async ({ page, browserName }) => {
    // The finger drag is driven through CDP (Input.dispatchTouchEvent), which
    // only Chromium has; synthetic TouchEvents in WebKit don't move native scroll.
    test.skip(browserName === "webkit", "WebKit: no CDP touch input - real-device check (see Mv.md)");
    if (!LIVE) await mockApi(page, { extraWorkspaces: 12 });
    await seedStorage(page, { signedIn: !LIVE });
    if (LIVE) await login(page);
    await page.goto("/workspace");
    await expect(page.locator('a[href^="/workspace/x11"]')).toBeAttached();
    await touchSwipe(page, 180, 650, 180, 250);
    expect(await page.locator("main").evaluate((m) => m.scrollTop)).toBeGreaterThan(0);
  });

});

test("M11 logout from drawer clears session @M11 @critical", async ({ signedIn: page }) => {
  await page.goto("/workspace");
  await openDrawer(page);
  await press(page, `div.fixed.inset-0.z-40 ${sel.accountMenu}`);
  await press(page, sel.logout);
  await expect(page).toHaveURL(/\/login/);
  await expect(page.locator(sel.email)).toBeVisible();
  const tokens = await page.evaluate((k) => [localStorage.getItem(k.access), localStorage.getItem(k.refresh)], KEYS);
  expect(tokens).toEqual([null, null]);
});
