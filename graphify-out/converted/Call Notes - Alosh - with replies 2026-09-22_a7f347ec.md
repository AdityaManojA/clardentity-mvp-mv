<!-- converted from Call Notes - Alosh - with replies 2026-09-22.docx -->

Items implemented are marked with a yellow marker.
Items that look implemented but are not sure are marked with a blue marker.
Replies added 19 Sep 2026 and updated 22 Sep 2026 (an updated reply starts 'Update 22/09'), under each point: Done (live on clardentity.ai), Partly, Open (not built yet), Reply (a view, or a question back). Numbers inside replies are this document's list numbers. Backend items are live once the Render deploy of 22 Sep is in.
Call Dates – 06/09/2026 & 07/09/2026
- Changes on the landing page texts and visibility of modes / coracles post discussions with Nandan. Also inputs on App design.
- Open - Landing copy and mode visibility are queued for the Nandan pass (see #80/#82). Modes on the landing page already read from the same catalogue as the picker, so renames flow through automatically.
- Animation for the insight to the features of the Clardentity AI
- Open - Needs a designer/animator; not something I can produce well in code. Parked with the landing-page work.
- Could you share the coach marks for the website?
- Done - Two tours are live: a 9-step workspace tour and a 10-step chat tour (companion, modes, switching, composer, model, voice, call, attach, autocomplete, Ask). Replay any time from the ? in the top bar.
- Can we have two types of switching between modes – Smart (auto) switching and Manual Switching.
- Done - Switching: Smart / Manual toggle beside the mode strip. Manual never switches.
- Can we have Smart switching as the default mode? It should be shown as “switching to X mode’ while the smart switching modes shifts from one mode to another.
- Update 22/09: Smart is the default. It switches automatically and shows 'Switched to X' with a 4-second countdown ring and a 'Stay in Finder' button (was 10 seconds - shortened so the switch feels done, not still happening).
- Can we restrict the switching to any of the grayed out three modes? We can implement the upgradation message display or we can implement the subscription category.
- Done - Greyed-out modes can't be started or switched into; tapping one opens the plans dialog. A Smart suggestion for a locked mode opens the plans and answers in the current mode.
- Can we have 4 categories of subscriptions? Features can be changed.
- Partly - The four tiers are shown in the plans dialog with prices, credits and the companions each opens. Enforcement (limits, billing, locking by tier) is not built - that is the payment-gateway work in #79.
- Clar-Basic (Freeminum +Individual) per day & per Month free tokens limitations set. Accessible modes Rapid-fire, knowing and thinking trainer modes only. First time user will get the per day tokens without signing up. After that user will be asked to sign up. Upon signing up one day free token will be given as bonus. Options to download profiles from other AI Apps. 30-50 text prompts per day.
- Shown as Clar-Basic in the dialog: Finder and Thought coach, daily allowance. Token metering and the guest trial are part of the PAYG build (#68, #79).
- Clar-Pro (Individual) - Accessible modes knowing, thinking trainer, decision making and creative modes only. Price - $20 Credit pool 2000 Premium credits.
- Shown as Clar-Pro · $20: any 5 of the 8 companions, 2,000 credits.
- Clar-Max (Individual) - Accessible modes knowing, thinking trainer, decision making, creative, learning, mentoring and Reflect & Relieve modes + Options to choose from the listed Models and versions in creative mode. Price - $40 Credit pool 5500 Elite credits.
- Shown as Clar-Max · $40: any 7 of the 8, plus model choice in Co-Creative, 5,500 credits.
- Clar-Ultra (Enterprise) – Clar-Max + Multi-user co-working / team working space etc., (Whatever enterprises feature we need to have should have here.) Price - $100 Credit pool 13000 Ultra Elite credits.
- Shown as Clar-Ultra · $100 · Teams: all 8, shared workspaces, 13,000 credits.
- Can we have the options to switch from text mode to call mode and call mode to chat in between a chat session.
- Done - The call button sits next to the mic in the composer; a finished call is saved into the same chat, and you carry on typing in it.
- Can we rename “Psychotherapy” to “Reflect & Relieve” or Reflecting & Relieving”? The term Psycho-therapy, counselling etc., will cause legal challenges.
- Done - Reflect & Relieve.
- Can we have Stop button / Press esc button to stop while preparing the output.
- Done - Stop button and Esc while an answer is being written.
- Can we have Timings of each chats visible?
- Done - Time on every message; date shown too for messages from another day (#37).
- Can we have Deletion of each chat to restart a fresh continuation from the deleted chat point onwards?
- Done - Bin icon on any message deletes it and everything after it, so the chat continues fresh from there.
- Can we have the “Read as one thread” as the default mode in response display part? “Split by mode” should be only when manually selected.
- Done - One thread is the default; Split by mode is a manual toggle.
- Can we have all questions displayed as Clardentity asked? At times certain follow up questions are not displayed.
- Done - Every gate the companion raises is embedded in your message and shown as a small chat thread inside it (Clardentity left, you right), including chains of several.
- “Did you mean question” is generated after displaying the response for a series of Q&A. Can we have the questions placed as Did you mean:  to be part of the Q&A for context gathering and should be asked/displayed before the response rather than showing above the text response.
- Done - All four gates (did-you-mean, options, context question, mode) now run before the answer, never after. And at most one question comes back per message - four in a row was happening.
- When citation box overlaps with the chat box borderline it is displayed partially only. Can we have it corrected?
- Done - Citation popover is portaled to the page and clamped to the viewport; no more clipping at the bubble edge.
- Responsiveness - On mobile the citation box opens somewhere much below the clickable citation number. One can’t find the citation box unless scrolled down further from the clickable citation number.
- Done - Same fix covers mobile - the popover is positioned against the marker you tapped, flipping above/below to stay on screen.
- Can we have the scoring inside the citation box displayed as “Probable Fact95% Factual Evidence only strongly supported, though short of direct confirmation?
- Done - Popover reads e.g. 'Probable Fact · 95% Factual Evidence only · Strongly supported, though short of direct confirmation', plus the source's own support line.
- Some of the Clardentity AI options are still shown as the “Appears as fabricated / malicious 0% Factual Evidence Nothing found here backs this up. Worth checking yourself. . Can we have it corrected?
- Done - Root cause fixed. 'Appears fabricated' was being applied to claims that were never checked (no source found). Those now read 'Not verified - no source found to check against'. Fabricated is reserved for checked-and-contradicted. Separately, every unsupported claim is now researched (was only the first two) and searches run through Tavily, so far fewer claims end up unchecked at all.
- In thinking trainer mode can we have the “How to think about this” Box should appear as the first response.
- Done - 'How to think about this' box leads, then the gist, then 'Details of thinking journey' folded.
- In decision making mode can we have “One decision that holds up, and the ones that don't “box should appear as the first response.
- Done - The decisions box leads, then the gist, then 'Details of the decision making journey' folded (your Option 2 in #59/#60).
- Can we replace the word “Holds up” with “best/correct/appropriate”?
- Done - 'One decision that's correct, and the ones that aren't'; rows read Correct / Incorrect (or the bias name).
- Can we have only decisions rather than next round of steps or actions under the decision that “Holds up” section?
- Done - The box lists decisions only; steps and actions stay in the journey.
- Hallucination rate is high. Quickly loses context and repeats the same series of questions.
- Update 22/09: Done - Three causes found and fixed: (a) the gate check read only the newest message, so a follow-up re-asked things you had already answered - it now reads the last 8 turns; (b) at most one question comes back per message; (c) claims are checked against live web sources (Tavily) and anything with no source is labelled 'Not verified' rather than passed off. Hallucination is now visible per claim in the popover rather than hidden; on a typical factual answer 8-9 of 10 claims are cited.
- Turnaround time is high.
- Done - Measured and cut. Finder: gist in 4-6s, full answer 9-11s, verdict 13-15s (was 25 / 30 / 35-75s). Quick answer: 1-3s. Details in #56.
- Task profiles & Strategic Model Routing Examples (It includes baseline models/ community-built user bots/ curated connectors and MCP)  – [ Tier-1 Corporate Frontier Models (90+) + Challenger & Speciality Frontier Models (100+) + Open-Weights & Open-Source Foundations(250+)+ Multimodal Generation & Canvas Engines(50+)]
- Open - Routing today: Opus for reasoning modes (Thought coach, Mentoring, Reflect), Sonnet for Finder / Learning / Co-Creative / Decision bodies, Haiku for quick answers, gate checks and naming, plus OpenAI as automatic fallback. A wider model catalogue (Llama, Gemini, DeepSeek, Qwen...) is a separate integration - see #71.
User task Profile - Primary Routed Model Example | Backup or Alternative Example
General Chat, Summarization, Translation - Llama 4 Maverick | Mistral Medium 3.5
Massive Docs / Video File Analysis - Gemini 3.5 Pro | Llama 4 Scout (10M Context)
High-Volume Math, Logic & Coding - Deep Seek V4 Pro | Qwen 3.6 Max
Deep Reasoning & Code Architecture - Claude Fable 5.1 | GPT-6 Astra
- In thinking trainer mode “How to think about this” response box & in Decision making mode “One decision that holds up, and the ones that don’t “response box should be the first to appear. Presently the details of responses is shown before these boxes. This should be shown below the “How to think about this” response box and “One decision that holds up, and the ones that don’t “response box as an expandable part with clickable option to expand. The title for this part can be “Details of thinking journey” and “Details of the decision making journey”.
- Done - As in #20/#21: box first, journey folded beneath with those exact titles.


Call Dates – 09/09/2026
- Preparation of the journey response is displayed first, then followed by the “The Gist” box, along with, in thinking trainer mode, the “How to think about this” response box & in decision-making mode, the “One decision that holds up, and the ones that don’t response box above the Journey response. Can we have the Preparation of the journey response run in the background and display it as per the following flow. 1st “The Gist”, 2nd “How to think about this” & “One decision that holds up, and the ones that don’t “response boxes?
- Done - Generation runs under the hood now: a 'Thinking…' rabbit until the gist lands, then the gist card, then the whole answer at once; boxes and gist order as you specified.
- Can we have a ‘Hurry Burry" and “Legal Companion " mode?
- Update 22/09: Done - Legal is built: its own brief (area of law and jurisdiction, the rules and process in plain words, what a lawyer will ask, what to gather, deadlines; orientation not advice, said once at the end). It sits in the picker locked to the paid tiers, as in the plan table. Hurry Burry became the Quick answer button rather than a mode - your 16/09 direction.
- The following previous points are not reflected –
- Both now reflected - see the two items below.
- Can we have Smart switching as the default mode? It should be shown as “switching to X mode’ while the smart switching mode shifts from one mode to another.
- Done - Smart is the default and the switch is announced as it happens.
- Can we restrict the switching to any of the three greyed-out modes? We can implement the upgrade message display, or we can implement the subscription category.
- Done - Locked modes open the plans dialog and never switch.
- Clicking the record a voice message changed the colour of the icon from grey to red. Can we have an animated icon that indicates it is recording or not recording or to stop recording?
- Done - Recorder shows a red blinking dot, a running timer and a stop square while recording.
- If no voice was passed while the voice mode was on and live upon clicking the icon to stop voice recording, the following message is shown in the text box: “Thank you for watching or Thank you so much for watching”.
- Done - Silence and Whisper's 'thank you for watching' hallucinations are detected (no-speech probability + known phrases) and reported as 'didn't catch anything' instead of being typed in.
- While recording a voice message, if the mic is away or the voice is unclear to the system, it shows the question and answer in a different language in the chat box. For example when spoken in English it showed Hindi, and when spoken in Malayalam, it showed Tamil. Can we have a system where, if the voice is unclear, it should say it is unclear, or it should ask and verify if the language is the same as what the AI has thought?
- Done - The transcript's detected language is checked; if it isn't English we say so and ask you to re-record rather than guessing.
- Language correction support like the basic/free version of Grammarly.
- Update 22/09: Done - Both halves, Gmail-style: spelling autocorrects as you type (in-browser dictionaries, no model, Backspace undoes), and after a short pause a grey completion appears ahead of your words - press Shift to take it, or keep typing. The wand button was replaced by this inline suggestion on 19/09.
- Can we get rid of the title “The Gist” from the box?
- Done - Title removed; the gist is framed as the main content instead.
- Unable to delete the chats directly from the Workspace.
- Done - Bin icon on every chat row in the workspace.
- It would have been nice to have the date along with the time of each question and answer.
- Done - Date shown alongside the time for messages from another day.
- Login credential memorisation is not there, even though not logged out from the last session.
- Done - Root cause fixed: refreshing on one device was silently signing out the other (per-user token rotation). Sessions now persist across devices for 30 days. See #55.
- Clardentity AI opinion is not displayed.
- Done - Opinion claims carry an inline OPINION tag in the text.
- Do we need to display ‘need verification’ when we are not showing the old expandable part?
- Done - Kept, but it now explains itself: tap the badge for what the band means, how many claims are backed by a source, and the count per tier. See #65.
- App download is not working both website/ Mobile.
- Done - Install app button in the sidebar and on the landing page (Android/desktop prompt; iOS shows the add-to-home-screen steps).
- Unable to delete old workspaces or group chat as a whole.
- Done - Owner can delete a workspace from its page; it takes its chats and attachments with it.
- Should we rename “Creative” mode as “Co-Creative/Work”?
- Done - Co-Creative.
- Mode switching message example:
- Done - Superseded by automatic switching: the message is now 'Switched to X - it suits this question better', with Stay in [mode].
Switching to Mentoring mode because it suits this better.
You'd get guidance on exploring options rather than just a list of facts
Nothing has been answered yet - whichever you pick is what gets written, checked and scored.
Ok                 Stay in knowing
- If the user selects Ok and later wants to go back to knowing mode how can they reverse the switching.
- Done - While the switched answer is being written: 'Stay in Finder' on the countdown card stops it and re-asks in the old mode. Afterwards: a 'Back to Finder' link for the next question.
- Chats are getting vanished or automatically deleted while continuing the chat.
- Update 22/09: Done - Root cause found. The chat list was ordered by creation date, and the sidebar shows the newest twelve: a chat started earlier and continued today stayed at its old position, dropped off the list, and looked deleted. Nothing was ever deleted - the chat was still in the workspace. Lists are now ordered by last activity, so a chat you are continuing is always at the top. (The multi-device sign-out, fixed 13/09, was the other way a chat could look gone.)
- In learning mode – users will be students and teachers. Whenever there is a question to learn the response needs to be based on the Board/syllabus and Year so that it matches and meets the need. So the system need to have access to the information on Board/syllabus and Year globally.
- Done - Learning mode asks for board and year once (e.g. 'CBSE Class 10 or A-level Year 12?') on curriculum topics, then pitches scope, depth and terminology to it. It uses the model's knowledge of syllabi plus web search; a curated syllabus database would be a later addition.

- Call Dates – 12/09/2026

- Replacing ‘Hurry Burry” with the word “Instanter” or “Rapid-fire”.
- Done - Went through Rapid-fire and Quick; ended as the Quick answer button per your 16/09 direction (#63/#64).
- Can we have the sequence of companion modes in the following order?
- Done - Order is Finder | Decision-making | Thought coach | Learning | Co-Creative | Mentoring | Reflect & Relieve | Legal (quick answer is a button, not a mode).
Instanter/Rapid-fire | Knowing | Decision-making | Thinking trainer | Learning | Co-creative | Mentoring | Reflect & Relive |Legal
- Should we have an option in each subscription type to choose any from the 9 companions based on what they need?
- Partly - The plans dialog states it (Basic fixed 2, Pro any 5, Max any 7, Ultra all). Letting a subscriber actually choose their companions is part of the billing build (#79).
For example – Basic – Choose any 3 companions | Pro – Choose any 5 companions | Max – Choose any 7 companions + Options to choose from the listed Models and versions in creative mode | Ultra – All companions + Options to choose from the listed Models and versions in creative mode
- Can we improve the Chat Interface UI Layout and Output Formats (Consumer Web/App Level) with the help of the file I shared named “Index of Structured Outputs and UI Layout Formats” details?
- Done - Now functional (this was the item flagged in #77): bold, italic, code, bullet and numbered lists, and pipe tables render; a request to 'tabulate' produces a real table with citations in the cells (AKS vs EKS came back as a 7-row table). Sources are listed as cards under each answer.
- FB/ Twitter/ Insta posting update suggestion box displayed upon signing up and subscribing.
- Open - Needs Facebook/X/Instagram OAuth apps and review - not started. A lightweight 'share Clardentity' card with pre-filled post text is possible without OAuth if you want it sooner.
- Can we add/ mention the names of the “Accessible modes” available in each category of subscription, along with details, in the present version of the display box.
- Done - Each tier names its companions in the plans dialog.
- Some follow-up question boxes are not fully visible on Android phones. It is hidden under the input text box and the last response, or partially visible behind the input text box. I shall share the screenshots when I get it again.
- Done - Fixed - the cards were being squeezed behind the composer by a flexbox rule. Verified on a 390px viewport with all options visible.
- Doesn’t remember the sign in credential in web and Android app, even if the previous session is not logged out. It asks me to log in every time I try to log in.
- Done - Same root cause as #38; fixed on 13/09 (Render deploy). Sign-in on web and Android now survives across each other.

- Call Dates – 14/09/2026


- It seems at times the response time is really high. Could you check and suggest how we improve the response speed?
- Done - Full breakdown done. Biggest wins: searching through Tavily instead of the model's own search tool (5-20s -> 1-3s), everything before the answer running in parallel, Sonnet for Finder/Decision bodies, no rewrite pass on Finder, Devil's Draft off the critical path. Finder gist 4-6s, answer 9-11s, verdict 13-15s; quick answers 1-3s. A per-turn timing line in the server logs keeps this measurable.
- Shall we change “Rapid-fire” mode to ‘Tailored/ Knowing' and “Knowing” mode to “Verified Knowing”?
- Done - Settled on 16/09: Knowing -> Finder; the quick path is a button, not a mode.
- What do you think would be better between ‘Rapid vs Quick vs Unverified '? I am a little confused.  If we use unverified, then it can develop curiosity about the difference between ‘verified and unverified knowing '”. If we use “Quick Knowing” it will clearly indicate the need to be quicker.
- My view, for the record: 'Unverified' is a negative label on the product's own answer; 'Quick' says what the user gets. You chose to make it a button ('Quick answer') that appears when an answer is slow - which sidesteps the naming problem entirely.
- At present, the sequence of decision making response appearance is
- Current live order is your Option 2, from the first frame since 20/09 - see #74.
- The Gist box
- (Old order, no longer live.)
- Journey just below Gist
- (Old order, no longer live.)
- "One decision that's correct, and the ones that aren't" box appears above the Gist.
- (Old order, no longer live.)
- I am confused about what we should have as the on-screen appearance sequence. I think Option 2 will be better -
- Update 22/09: Done - Option 2 is live and now holds from the first frame (see #74 for what was fixed on 20/09).
Appearance Option 1
- The Gist box
- Option 1 - not chosen.
- "One decision that's correct, and the ones that aren't" box
- Option 1 - not chosen.
- Journey just below the "One decision that's correct, and the ones that aren't" box
- Option 1 - not chosen.
OR

Appearance Option 2
- "One decision that's correct, and the ones that aren't" box.
- Done - Live: this box first.
- The Gist box.
- Done - Live: gist second.
- Journey just below the "One decision that's correct, and the ones that aren't" box.
- Done - Live: journey folded beneath.
- Can we avoid compelling users to create a Workspace before they start a chat?
- Done - Sign-in lands straight in a chat; a workspace is made for you if you have none.
- Can we allow users to get to the chat screen directly with a default chat mode and a clickable new chat button active on all different screens, rather than compelling users to select a chat mode / Workspace before allowing them to chat straight away, so that they can chat in whichever mode they want to use.
- Done - Every chat opens in Finder with the box ready to type; New chat is live on every screen (sidebar, and a bubble icon in the phone header).
- Can we have the option to move a chat from and to different chat series or workspaces?
- Done - Move to… on each chat row (folder icon), listing your other workspaces.
- Can we have coach marks repeat selection options on the different pages for people to go through if they have skipped it or who want to go through it again?
- Done - ? in the top bar replays the tour for the page you're on (workspace or chat).
- Do we really need the ‘plausible’ or “Needs verification” in red colour text just above the gist box? Because it doesn’t give the details in any manner.
- Done - Kept, made useful: tapping it shows what the band means, 'N of M factual claims backed by a source', the per-tier counts and where to look.
- Can we make mode switching fully automatic with a few-milliseconds message box display, with an option to remain in the current mode? If the mode is outside the current subscription category, then we will show the subscription option selection to choose from. If not selected, then it will get them back to the present mode.
- Update 22/09: Done - Automatic switching with a 4-second countdown card and 'Stay in [mode]'; locked mode -> plans dialog, answer continues in the current mode.
- The ideal user experience would be that
- Understood as the target flow. Guest access + metered trial + compulsory sign-up + daily quota + subscribe screen is the next big build (with #68/#79). Not started; needs the PAYG decisions below.
- On the landing page, there should be get started and log in buttons and no sign in button.
- Open - Landing buttons: Get started + Log in, no separate Sign in - easy once the guest flow exists (Get started must open a chat without an account).
- Upon clicking get start button they should reach interface that we get upon clicking the new chat, with access to limited modes.
- Open - Requires guest sessions (anonymous accounts with a device token) and per-mode gating.
- After they are exhausted with the first 30-50 tokens they should get a compulsive sign up screen.
- Open - Requires token metering per session/day. Not built.
- After signing up they will get another 20-30 tokens as a daily quota. After it is exhausted they should get subscribe screen.
- Open - Requires metering + the subscribe screen. Not built.
- One the subscription screen, we should have two options. I will discuss these options when we have our five-minute call.
- Covered in #68.

- Call Dates – 16/09/2026


- One the Pay As You Go (PAYG) subscription screen, we should have two options.
- Noted. My view is under Option 2.
- Option 1 - Paid and advertisement free
- Straightforward once the gateway exists (#79).
- Option 2  - Unpaid with advertisement (You said you want to think and share your view on this)
- My view: don't do ads at launch. The product's whole promise is 'an answer you can trust with its sources shown'; ads beside it undercut that, and an ad-funded free tier needs volume we won't have at MVP. Better free tier: a metered daily quota (your #67 plan) and a hard sign-up wall, with the paid tier removing the quota. Revisit ads only if acquisition data says the free tier is where users stay.
- Change the New Chat ‘+’ icon dialogue pop-up icon.
- Done - New chat is a speech bubble with a plus (sidebar and phone header).
- Could you change the subscription icon to a better one?
- Done - Plans/Upgrade uses a gem; locked models in the model picker show the same gem instead of a padlock.
- Need to decide, make a list and plan which models will used for Primary and Back up or alternative Routing Models based on user task profile, complexity of task requests and cost optimization.
- Open - Current routing is in place (see #26) and env-configurable per mode. A proper routing plan across a wider catalogue - by task profile, complexity and cost, with primary/backup per row - is a piece of work I'd propose as a short doc for your review before building.
- On web the default mode is Decision-making. Could you change it to Finder mode?
- Done - Every new chat now opens in Finder, always (it was remembering the device's last-used mode).
- Could you change the label ‘Legal Companion’ to just ‘Legal’ as we are not using the word companion in the mode tab?
- Done - 'Legal'.
- The points 59 & 60 is unresolved.
- Update 22/09: Done - You were right; it was not fully live on 19/09. Fixed 20/09: the 'One decision that's correct' box is now written before the answer and sent to the screen the moment it is ready, ahead of the gist; while it is being weighed, a dashed placeholder holds its slot at the top so the order box -> gist -> journey is visible from the first frame and nothing drops in above what you are reading. Also on 21/09: the gist is cut to one sentence on the server (a Decision answer had shown its whole opening paragraph as the gist).
- When switching it from one mode to another it says in the message box that “Keep in ______”. Instead can we make it “Continue to stay / Stay in _____ Companion mode”.
- Done - Button reads 'Stay in Finder' (the mode you were in).
- Can we have Coach Mark icon to replay the Coach Mark if a user wants to see it again after skipping it in the starting stage for some reason.
- Done - The ? icon in the top bar - on workspace and chat pages - replays that page's tour.
- The point 51 is not functional yet.
- Done - #51 (chat layout/output formats) is now functional: formatting, lists and tables render - see #51.
- The point 34 is partially functional. It does only spell check. Can we also so a grammatical check and rephrasing recommendations while typing?
- Update 22/09: Done - #34 does both: spelling autocorrects as you type, and grammar/phrasing comes as an inline grey completion you accept with Shift (replacing the wand, per your 19/09 note).
- Activation of payment gateway with options to pay in local currency, upi, micro lending.( Final Public Release Version)
- Open - Payment gateway (local currency, UPI, micro-lending) - Final Public Release scope. Recommend Razorpay for INR/UPI with Stripe for international; needs company/KYC details from you before integration can start.
- Editing and cleaning up overcrowded landing page texts to get rid of excess reading in the Final MVP version.
- Open - Landing copy edit - will do alongside the Nandan UI pass (#82) so text and design move together.
- Planning post Final MVP version to Final Public Release Version release date.
- For the call. My suggestion: Final MVP freeze after the guest/PAYG flow, then a 2-3 week hardening window before Public Release.
- Getting Nandan or someone for basic UI/UX features and colour improvement of Final MVP version.
- Agreed - the app is functionally complete enough that a designer's pass will show.
- Timelines of onboarding UI/UX, tester, Full stack, Frontend and backend resources.
- For the call.
- Planning and deciding rough timeline on renting servers.
- Current footprint (Render + Vercel + Supabase + Tavily + model APIs) runs fine at MVP volume; renting servers only becomes relevant if you self-host models. Happy to size it once the routing plan (#71) is decided.


Also fixed since 19 Sep (from your messages, not in the notes)
- Done - Gist length: the gist is one sentence on the server, whatever the model hands over; the rest goes to the answer body. The prompt says the same (one sentence, at most 30 words).
- Done - Text crossing the answer box border on phones: a layout rule let one wide token widen the whole bubble; fixed and verified at 375px.
- Done - Attachments: the paperclip now takes documents as well as images - PDF, Word, Excel, PowerPoint and text formats (txt, md, csv, tsv, json, xml, html, rtf). The file is read, cited by name in the answer and kept in the workspace for later questions. Old .doc/.xls/.ppt ask to be saved as .docx/.xlsx/.pptx.
- Done - Mode strip opened scrolled to the far right on web (Finder out of view); it now opens on Finder.
- Done - Chat titles are a 3-5 word summary, not the question repeated.