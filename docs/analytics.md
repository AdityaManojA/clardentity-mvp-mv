# Analytics

## What was chosen, and why

**PostHog, EU cloud, free tier.** Not GA4.

GA4 is free and everybody has it, and for this product it is the wrong
instrument. It is built to attribute marketing spend to conversions: its
model is sessions and pageviews, custom events are second-class, reports
sample above a threshold, and getting "how many people who asked a
question in Decision mode came back the next day" out of it means
exporting to BigQuery. It is also a Google cookie on a page where the
product's whole promise is that it is careful with what you tell it.

PostHog is built for the question actually being asked - which features
get used, and where people stop - and answers it out of the box with
funnels, retention and trends over named events. The free tier is 1
million events a month, which at the shape below is somewhere around ten
thousand sessions; the EU host keeps one jurisdiction rather than two.

Worth knowing about the alternatives, for the record: Plausible and
Fathom are cheaper and lighter but only count pages, so they cannot
answer either question here; Amplitude and Mixpanel are peers of PostHog
with smaller free tiers; self-hosting PostHog is possible and is not
worth the operational cost at this size.

## Turning it on

1. Create a project at <https://eu.posthog.com> (choose the EU region -
   the code defaults to the EU host).
2. Copy the **Project API key** (starts with `phc_`). It is a publishable
   key: it identifies the project to the browser and grants nothing but
   the right to send events. It is not a secret and belongs in the client
   bundle.
3. In Vercel, add an environment variable for Production (and Preview if
   you want to watch a branch):

   ```
   NEXT_PUBLIC_POSTHOG_KEY=phc_...
   ```

   Optionally `NEXT_PUBLIC_POSTHOG_HOST` for a different region or a
   self-hosted instance; it defaults to `https://eu.i.posthog.com`.
4. Redeploy. That is the whole setup - no snippet in the HTML, no tag
   manager.

**With no key set, nothing happens.** Every function is a one-comparison
no-op, the SDK is never downloaded, and no cookie is written. That is the
state local development and CI run in, so neither pollutes the numbers.

## What is deliberately not collected

The product's promise is that you can see what an answer rests on. An app
like that cannot ship a tracker that quietly ships the questions people
ask. So:

- **No content, ever.** No question text, no answer text, no chat titles,
  no file names, no document contents. Events carry a name and enumerated
  properties - a mode, a count, a duration bucket.
- **No email addresses.** A signed-in person is identified by their
  account UUID and nothing else.
- **No ids in URLs.** PostHog attaches the current address to every event
  by itself; a hook rewrites `/chat/6f2a…` to `/chat/[id]` and drops the
  query string before anything is sent, so no conversation id and no
  password-reset token can ride along.
- **No session replay and no autocapture.** Replay records the screen -
  which here is somebody's divorce question. Autocapture records the text
  of what was clicked. Both are off in code, not just in the dashboard.
- **A belt-and-braces filter at the send.** Any property whose name
  matches content/question/answer/text/title/email/name/filename/query/
  prompt is dropped, as is any string over 40 characters, whatever the
  caller passed. See `frontend/lib/analytics.ts`.

Durations are sent as buckets (`0-2s`, `2-5s`, `5-10s`, …) rather than
milliseconds: the question is whether something felt instant or slow, and
a bucket answers it without making each answer individually identifiable.

## The events

| Event | Properties | Answers |
|---|---|---|
| `app_opened` | viewport, installed | Phone or desktop; is anyone installing the PWA |
| `signed_in` | – | Sessions per account |
| `$pageview` | pattern | Which screens get used |
| `question_asked` | mode, attachments, documents, smart_switching, follow_up | **Which companions people actually use**; how often files are attached; how many turns a conversation runs |
| `gist_shown` | mode, after | Time-to-first-useful-output, per mode |
| `answer_shown` | mode, after | Time to the full answer, per mode |
| `answer_failed` | mode, after | How often a turn errors |
| `stream_dropped` | – | How often connections die mid-answer |
| `gate_shown` | kind (context / refined / options / mode), mode | **Where the app interrupts before answering** |
| `mode_picked` | mode | Manual mode choice |
| `mode_switched_automatically` | from, to | Whether smart switching fires, and where it sends people |
| `mode_switch_reverted` | to, via (countdown / banner) | Whether people disagree with it |
| `quick_answer_tapped` | mode | How often waiting becomes intolerable |
| `attachment_added` | kind, extension, size_kb | Which file types matter |
| `voice_recorded` | words | Is voice used |
| `call_started` | – | Is the call mode used |
| `completion_accepted` | words | Is inline autocomplete earning its place |
| `locked_mode_tapped` | mode, via (picker / smart_switch) | **Demand for the paid companions** |
| `preview_opened` | – | Take-up of "Skip for now" |
| `chat_renamed` / `chat_pinned` / `chat_moved` / `chat_deleted` | pinned (for pin) | Which housekeeping verbs are worth their place |
| `tour_started` | tour, replayed | Coachmark take-up |
| `tour_finished` | tour, outcome, at_step | **Which step people quit the tour on** |
| `feedback_given` | – | (not yet wired) |

### The two questions, as PostHog queries

- *Most used features*: Trends on `question_asked`, broken down by
  `mode`. Then Trends on the feature events (`attachment_added`,
  `voice_recorded`, `call_started`, `completion_accepted`,
  `quick_answer_tapped`) to see which of them anybody touches.
- *The common path*: a Funnel of `app_opened` → `signed_in` →
  `question_asked` → `answer_shown`, with `gate_shown` as an intermediate
  step to see how many turns get interrupted and how many of those come
  back. Add User Paths starting at `$pageview` for the screen order.

## Still to do

- **Privacy policy.** There is no privacy page yet, and adding analytics
  is the point at which one is needed - what is collected, by whom, for
  how long. The list above is the honest content of it.
- **Consent.** Nothing here writes a cookie until a key is set, and no
  content or email leaves the browser, which is the lightest possible
  footing - but an EU user base still argues for a short, honest banner
  with "decline" as a real option, in keeping with how the app already
  treats consent banners elsewhere.
- **Server-side events.** Answer quality (claims cited, confidence band,
  search provider, per-phase latency) is known on the backend and logged
  there already. Sending it to the same project would put "which modes
  produce well-sourced answers" next to "which modes get used". Needs the
  PostHog Python SDK and a server-side key.
