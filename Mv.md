# Mv: project checklist

Fork: `AdityaManojA/clardentity-mvp-mv` · Upstream: `clardentity/clardentity-mvp`

Status key: ✅ Done · ⬜ To do · 🟨 Needs decision

---

## 1. Upstream sync

| Status | Task |
|:---:|---|
| ✅ | Hourly check for new changes on upstream `main`, plus a manual "Run now" button |
| ✅ | Nothing is fetched or merged until a reviewer approves the run |
| ✅ | Safe merge into the fork's `main`: fast-forward or merge commit, never a force-push |
| ✅ | Merge conflicts or rejected pushes stop the run with a clear message; `main` is left untouched |
| ✅ | Re-running with no new changes does nothing (no empty commits) |
| ✅ | Least-privilege permissions; only the approved step can write |
| ✅ | Overlapping runs prevented; never runs inside the upstream repo |
| ✅ | Merge script tested locally against every failure case |
| ✅ | Setup and testing guide (`.github/SYNC_UPSTREAM.md`) |
| ⬜ | Enable Actions on the fork and create the `sync-approval` environment with reviewers |
| ⬜ | Run the tests automatically before every sync is pushed |
| ⬜ | Real-time sync triggered by upstream (needs admin access on the upstream repo) |
| ⬜ | Open upstream PRs from feature branches so fork-only files stay out of them |

## 2. Mobile testing

| Status | Task |
|:---:|---|
| ✅ | Playwright test setup with desktop and mobile (375×812, touch) profiles |
| ✅ | Tests run without a backend or real account (simulated API); optional live mode |
| ✅ | Desktop checks the mobile tests depend on: login, workspaces, forms, navigation, errors, logout |
| ✅ | M01: Mobile layout renders with no sideways scrolling |
| 🟨 | M02: Buttons and links are at least 44px to tap (see Section 4) |
| ✅ | M03: Menu drawer opens and closes, keeps keyboard focus inside, supports Escape and the Back button |
| ✅ | M04: Login works on mobile; the right keyboard shows and the button stays visible |
| ✅ | M05: Workspace cards fit the screen and long names are shortened neatly |
| ✅ | M06: Forms stay usable with the keyboard open; validation and submit work by tap |
| ✅ | M07: Network errors show a clear message inside the mobile layout |
| ✅ | M08: Content scrolls and the top bar never covers input fields |
| ✅ | M09: Portrait and landscape both work, including the menu |
| ✅ | M10: Swiping vertically always scrolls the page |
| ✅ | M11: Logout clears the session and returns to the login screen |
| ✅ | Critical path (login → workspaces → logout) stable across repeated parallel runs |
| ⬜ | M10b: Swipe test on the chat mode carousel (needs a live test account) |
| ⬜ | Run the test suite on every pull request |
| ⬜ | Save test reports from CI when a test fails |
| ⬜ | Dedicated test account for live-mode runs |
| ⬜ | Mobile tests for the chat screen (typing, scrolling messages, mode carousel) |
| ⬜ | iPhone / Safari testing profile |
| ⬜ | Screenshot comparison to catch layout changes |
| ⬜ | Automated accessibility scan (login, workspaces, menu) |
| ⬜ | Mobile tests for remaining screens: register, password reset, profile, settings, documents, search, admin |
| ⬜ | Full offline test after the app has loaded |

## 3. App improvements (mobile)

| Status | Task |
|:---:|---|
| ✅ | Fixed workspace cards running off the edge of phone screens |
| ✅ | Menu drawer is now a proper accessible dialog for screen readers |
| ✅ | Keyboard focus moves into the menu and stays there while it's open |
| ✅ | Escape key closes the menu |
| ✅ | Phone Back button closes the menu instead of leaving the page |
| ⬜ | Friendly error page instead of a blank screen if something crashes |
| ⬜ | Stop the page behind the open menu from scrolling |
| ⬜ | Swipe to close the menu |
| ⬜ | Larger tap area for the ⋮ menu on recent chats |
| ⬜ | Fix an outdated code comment about phone scaling |

## 4. Decisions needed

| Status | Task |
|:---:|---|
| 🟨 | **Tap target size.** The app is scaled to 85% on phones, so some buttons are under the recommended 44px. Options: (a) don't scale on phones, (b) enlarge just the tappable area so it looks the same, (c) keep as is (meets the 24px accessibility minimum, WCAG AA) |

## 5. Code knowledge graph

| Status | Task |
|:---:|---|
| ✅ | Knowledge graph of the codebase built (graphify) |
| ⬜ | Refresh the graph after the latest changes |
| ⬜ | Add project documents and PDFs to the graph |
