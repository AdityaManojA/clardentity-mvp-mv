"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import { ImportHistory } from "@/components/profile/ImportHistory";
import { CompanionNames } from "@/components/profile/CompanionNames";
import { DeleteAccount } from "@/components/profile/DeleteAccount";
import { InstallAppButton } from "@/components/system/InstallAppButton";
import { UpgradeDialog } from "@/components/chat/UpgradeDialog";
import { authErrorMessage } from "@/lib/auth";
import { AspectList, type Aspect } from "@/components/profile/AspectList";
import { Badge, Spinner } from "@/components/ui/primitives";
import { OutlineButton, ProfileSection } from "@/components/profile/ProfileSection";
import { useAuth } from "@/lib/auth";

type ProfileRole = {
  role_id: string;
  label: string;
  qualifiers: Record<string, string[]>;
  evidence: string;
};

type Profile = {
  personality_md: string | null;
  aspects: Aspect[];
  roles: ProfileRole[];
  user_edited: boolean;
  updated_at: string | null;
};

/** "4 minutes ago", "yesterday" - the line under the name, which is the
 *  only place the profile says when it last learned anything. */
function sinceLabel(iso: string | null): string {
  if (!iso) return "Nothing learned yet";
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 90) return "Last synchronized just now";
  const units: Array<[number, string]> = [
    [60, "minute"],
    [3600, "hour"],
    [86400, "day"],
  ];
  let unit = units[0];
  for (const next of units) if (seconds >= next[0]) unit = next;
  const n = Math.floor(seconds / unit[0]);
  return `Last synchronized ${n} ${unit[1]}${n === 1 ? "" : "s"} ago`;
}

export function ProfileView() {
  const { user } = useAuth();
  const [plansOpen, setPlansOpen] = useState(false);
  // The add form lives inside the facts list; the button that opens it is in
  // that section's header, where the design puts it.
  const [addingAspect, setAddingAspect] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [busy, setBusy] = useState<"rebuild" | "clear" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // `reloadKey` drives the fetch instead of calling a loader directly, so the
  // effect body never calls setState (which cascades renders); refreshing is
  // just a key bump.
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    apiFetch<Profile>("/profile")
      .then((p) => {
        if (cancelled) return;
        setProfile(p);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(authErrorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);


  async function handleAddAspect(label: string, value: string) {
    setError(null);
    try {
      setProfile(
        await apiFetch<Profile>("/profile/aspects", {
          method: "POST",
          body: { label, value },
        }),
      );
      setAddingAspect(false);
    } catch (err) {
      setError(authErrorMessage(err));
    }
  }

  async function handleRemoveAspect(id: string) {
    setError(null);
    try {
      setProfile(
        await apiFetch<Profile>(`/profile/aspects/${id}`, { method: "DELETE" }),
      );
    } catch (err) {
      setError(authErrorMessage(err));
    }
  }

  async function handleRebuild() {
    setBusy("rebuild");
    setError(null);
    setNotice(null);
    try {
      await apiFetch("/profile/rebuild", { method: "POST" });
      setNotice(
        "Rebuilding from your history. This runs in the background - use Refresh in a moment to see it.",
      );
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function handleClear() {
    setBusy("clear");
    setError(null);
    try {
      await apiFetch("/profile", { method: "DELETE" });
      setProfile({
        personality_md: null,
        aspects: [],
        roles: [],
        user_edited: false,
        updated_at: null,
      });
      setNotice("Profile deleted. It will start building again as you use the app.");
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  if (!profile && !error) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Spinner className="text-ink-muted" />
      </div>
    );
  }

  // A profile now exists as soon as there is anything in it, inferred or
  // written by hand. Gating on personality_md hid the add form from exactly
  // the people who had nothing yet and most wanted to write something.
  // Optional chaining rather than a direct read. A response missing either
  // array - an older backend, a partial payload, a proxy that dropped a field
  // - took the whole page down to a runtime error, which is a strictly worse
  // outcome than rendering the empty state and letting them add something.
  const aspects = profile?.aspects ?? [];
  const roles = profile?.roles ?? [];
  const hasProfile = aspects.length > 0 || roles.length > 0;

  const name = user?.display_name || user?.email || "Your profile";
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <div className="mx-auto w-full max-w-[1441px] px-5 pb-16 pt-[74px] sm:px-10 xl:px-[128px]">
      <div className="mx-auto w-full max-w-[1185px]">
        {/* The head of the page: who this profile is about, when it last
            learned anything, and the two things you can do to it. */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-[60px] shrink-0 items-center justify-center rounded-full bg-brand text-2xl font-medium text-white">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-4xl font-medium leading-[normal] text-ink">{name}</p>
              <p className="text-xl leading-[normal] text-ink-secondary">
                {sinceLabel(profile?.updated_at ?? null)}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              disabled={busy !== null}
              title="Read it again"
              aria-label="Refresh profile"
              className="flex size-[42px] items-center justify-center rounded-full border border-hairline-strong text-ink transition-colors hover:bg-surface-hover disabled:opacity-50"
            >
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="block size-5"
              >
                <path d="M16.3 8.1A6.5 6.5 0 1 0 16 12.4" />
                <path d="M16.5 4.2v4h-4" />
              </svg>
            </button>
            <OutlineButton onClick={handleRebuild} disabled={busy !== null}>
              {busy === "rebuild" ? "Rebuilding…" : "Rebuild"}
            </OutlineButton>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-band-low-border bg-band-low-bg px-3 py-2 text-sm text-band-low">
            {error}
          </div>
        )}
        {notice && (
          <div className="mt-6 rounded-lg border border-hairline bg-surface-muted px-3 py-2 text-sm text-ink-secondary">
            {notice}
          </div>
        )}

        <div className="mt-6">
          <ProfileSection
            title="Conversation History"
            description="Bring your previous conversations with you. Only your messages are read."
          >
            <ImportHistory onImported={() => setReloadKey((k) => k + 1)} />
          </ProfileSection>

          <ProfileSection
            title="Companion Naming"
            description="Provide distinct identifiers for each model personality. Leave a field blank to keep its system label."
          >
            <CompanionNames />
          </ProfileSection>

          <ProfileSection
            title="Learned Profile Facts"
            description="Autonomous deductions based on interaction history. Each fact can be removed independently."
            action={
              <OutlineButton
                onClick={() => setAddingAspect((v) => !v)}
                disabled={busy !== null}
              >
                {addingAspect ? "Close" : "Add Aspect"}
              </OutlineButton>
            }
          >
            <AspectList
              aspects={aspects}
              adding={addingAspect}
              onAddingChange={setAddingAspect}
              busy={busy !== null}
              onAdd={handleAddAspect}
              onRemove={handleRemoveAspect}
            />
            {hasProfile && (
              // Not in the design, and not the same thing as deleting the
              // account below: this throws away what Clardentity has worked
              // out about you and lets it start again, which is the lighter
              // of the two things someone uneasy about a wrong profile
              // actually wants.
              <button
                type="button"
                onClick={handleClear}
                disabled={busy !== null}
                className="mt-6 text-sm leading-[normal] text-ink-muted underline-offset-4 transition-colors hover:text-band-low hover:underline disabled:opacity-50"
              >
                {busy === "clear" ? "Deleting…" : "Forget everything learned so far"}
              </button>
            )}
          </ProfileSection>

          <ProfileSection
            title="Occupational Roles"
            description="The positions you appear to occupy, and what suggested each one."
          >
            {roles.length > 0 ? (
              <ul className="space-y-5">
                {roles.map((r) => (
                  <li key={r.role_id}>
                    <div className="flex items-start gap-3">
                      <span className="flex flex-wrap items-center gap-2 text-xl font-medium leading-[normal] text-ink">
                        {r.label}
                        {Object.values(r.qualifiers)
                          .flat()
                          .map((v) => (
                            <Badge key={v} tone="brand">
                              {v}
                            </Badge>
                          ))}
                      </span>
                    </div>
                    {r.evidence && (
                      <p className="mt-1 text-xl leading-[normal] text-ink-secondary">
                        {r.evidence}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xl leading-[normal] text-ink-secondary">
                No roles inferred yet - nothing in your history clearly indicated one.
              </p>
            )}
          </ProfileSection>

          {/* Plans live here now. The design's sidebar has no Upgrade row -
              it ends at the account card - so the surface moved to the page
              that card opens rather than being dropped. Install sits beside
              it for the same reason. */}
          <ProfileSection
            title="Your Plan"
            description="See what each plan opens, or install Clardentity as an app."
            action={
              <>
                <InstallAppButton className="flex h-[42px] items-center rounded-[34px] border border-hairline-strong px-[21px] text-xl leading-[normal] text-ink transition-colors hover:bg-surface-hover" />
                <button
                  type="button"
                  onClick={() => setPlansOpen(true)}
                  className="flex h-[42px] items-center rounded-[34px] bg-brand px-[21px] text-xl leading-[normal] text-white transition-colors hover:bg-brand-dark"
                >
                  See plans
                </button>
              </>
            }
          />

          <ProfileSection
            title="Account Termination"
            description="Permanent deletion of every workspace, chat, attachment, and learned profile fact."
            action={<DeleteAccount />}
            className="border-b-0"
          />
        </div>

        <UpgradeDialog open={plansOpen} onClose={() => setPlansOpen(false)} />
      </div>
    </div>
  );
}
