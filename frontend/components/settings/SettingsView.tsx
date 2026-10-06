"use client";

import { useState } from "react";
import { Appearance } from "@/components/profile/Appearance";
import { CompanionNames } from "@/components/profile/CompanionNames";
import { DeleteAccount } from "@/components/profile/DeleteAccount";
import { InstallAppButton } from "@/components/system/InstallAppButton";
import { UpgradeDialog } from "@/components/chat/UpgradeDialog";
import { ProfileSection } from "@/components/profile/ProfileSection";

/* How the app behaves, and the account it belongs to.
 *
 * Everything used to be on one page - what Clardentity had worked out about
 * you, what colour it was drawn in, what the companions were called, the
 * plan, and the button that deletes the lot - which made the page you went
 * to to read your profile the same page you went to to change a theme, and
 * the thing you wanted was always six scrolls away from the top.
 *
 * The line between the two is what the page is *about*. The profile is about
 * you and is mostly written by the app; this is about the app and is entirely
 * written by you.
 */
export function SettingsView() {
  const [plansOpen, setPlansOpen] = useState(false);

  return (
    <div className="mx-auto w-full max-w-[1441px] px-5 pb-16 pt-[74px] sm:px-10 xl:px-[128px]">
      <div className="mx-auto w-full max-w-[1185px]">
        <h1 className="text-2xl font-medium leading-[normal] text-ink">Settings</h1>
        <p className="text-sm leading-[normal] text-ink-secondary">
          How Clardentity looks and behaves, and what happens to your account.
        </p>

        <div className="mt-6">
          <ProfileSection
            title="Appearance"
            description="The colour the app is drawn in, and whether it runs light or dark. The marketing page follows your colour too, once you are signed in."
          >
            <Appearance />
          </ProfileSection>

          <ProfileSection
            title="Companion Naming"
            description="Provide distinct identifiers for each model personality. Leave a field blank to keep its system label."
          >
            <CompanionNames />
          </ProfileSection>

          {/* The design's sidebar has no Upgrade row - it ends at the account
              card - so the plan surface lives behind that card rather than
              being dropped. Install sits beside it for the same reason. */}
          <ProfileSection
            title="Your Plan"
            description="See what each plan opens, or install Clardentity as an app."
            action={
              <>
                <InstallAppButton className="flex h-[42px] items-center rounded-[34px] border border-hairline-strong px-[21px] text-sm leading-[normal] text-ink transition-colors hover:bg-surface-hover" />
                <button
                  type="button"
                  onClick={() => setPlansOpen(true)}
                  className="flex h-[42px] items-center rounded-[34px] bg-brand px-[21px] text-sm leading-[normal] text-white transition-colors hover:bg-brand-dark"
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
