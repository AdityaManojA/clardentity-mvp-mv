import Link from "next/link";
import type { Metadata } from "next";
import { LegalPage, Section } from "../legal";

export const metadata: Metadata = {
  title: "Terms of Service · Clardentity",
  description: "The agreement between you and Clardentity.",
};

const VERSION = "2026-09-28";
const UPDATED = "28 September 2026";
const CONTACT = "hello@clardentity.ai";

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      version={VERSION}
      updated={UPDATED}
      intro={
        <>
          These terms are the agreement between you and Clardentity. They are written to be
          read, not to be scrolled past. By creating an account you accept them.
        </>
      }
    >
      <Section n={1} title="What Clardentity is">
        <p>
          Clardentity is an AI companion that answers questions in several modes and shows the
          evidence behind each claim it makes. It is a tool for thinking with, not a
          professional adviser.
        </p>
      </Section>

      <Section n={2} title="What it is not">
        <p>
          <strong>Nothing Clardentity says is professional advice.</strong> Not legal advice,
          not medical advice, not financial or investment advice, not tax advice, and not
          therapy. The Legal mode explains how rules generally work so you can talk to a lawyer
          better informed; it does not replace one. The Reflect &amp; Relieve mode is
          companionship for thinking something through; it is not treatment, and it is not a
          crisis service.
        </p>
        <p>
          <strong>If you are in crisis or someone is in danger, contact your local emergency
          services or a crisis line.</strong> Clardentity cannot help with an emergency.
        </p>
        <p>
          Answers can be wrong. That is why every claim carries its sources and a confidence
          label, and why claims with nothing behind them say so. Check anything that matters
          before you act on it. Decisions you take are yours.
        </p>
      </Section>

      <Section n={3} title="Your account">
        <p>
          You must be at least 16 years old, give an accurate email address, and keep your
          password to yourself. You are responsible for what happens under your account. Tell us
          at <a className="text-brand hover:underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>{" "}
          if you think someone else has got into it.
        </p>
      </Section>

      <Section n={4} title="What you may not do">
        <p>Do not use Clardentity to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>break the law, or help anyone else to;</li>
          <li>produce material that sexualises children, incites violence, or harasses someone;</li>
          <li>build weapons, malware, or tools whose purpose is to harm;</li>
          <li>impersonate a person or organisation, or pass its answers off as a professional&apos;s;</li>
          <li>upload other people&apos;s personal data that you have no right to share;</li>
          <li>
            attack the service - scraping at volume, probing for holes, working around rate
            limits, or reselling access.
          </li>
        </ul>
        <p>
          We may suspend or close an account that does these things, and will say why unless the
          law prevents it.
        </p>
      </Section>

      <Section n={5} title="Your content and ours">
        <p>
          What you write and upload stays yours. You give us only the permission needed to run
          the service: to store it, process it, and send it to the providers listed in the{" "}
          <Link className="text-brand hover:underline" href="/privacy">Privacy Policy</Link> so
          that an answer can be produced. We do not use your conversations to train models, and
          we do not sell them.
        </p>
        <p>
          As between you and us, the answers Clardentity gives you are yours to use. The
          software, design and name are ours.
        </p>
      </Section>

      <Section n={6} title="Plans, previews and payment">
        <p>
          Some companions belong to paid plans. While billing is not yet in place, you may open
          them for testing from the plans dialog, subject to a daily message allowance. That
          access is a courtesy, not a contract: we may change the allowance, or close the
          preview, at any time. When paid plans open we will say what they cost before charging
          anything.
        </p>
      </Section>

      <Section n={7} title="Availability">
        <p>
          The service is provided as it is. We aim to keep it up and quick, but we do not promise
          uninterrupted availability, and we may change or remove features. Clardentity is still
          being built; parts of it will change.
        </p>
      </Section>

      <Section n={8} title="Liability">
        <p>
          To the fullest extent the law allows, we are not liable for indirect or consequential
          loss, lost profits, or loss of data, and our total liability for any claim is limited
          to the greater of the amount you paid us in the twelve months before it arose, or
          fifty US dollars.
        </p>
        <p>
          Nothing here limits liability that cannot lawfully be limited - including for death or
          personal injury caused by negligence, or for fraud. If you are a consumer, you keep
          the statutory rights your country gives you.
        </p>
      </Section>

      <Section n={9} title="Ending it">
        <p>
          You can delete your account at any time from your profile; everything under it goes
          with it. We may close an account that breaks section 4, or with reasonable notice if
          we stop offering the service.
        </p>
      </Section>

      <Section n={10} title="Changes to these terms">
        <p>
          If we change these terms materially we will raise the version number and ask you to
          accept the new version. Continuing to use the service after that point means you
          accept it.
        </p>
      </Section>

      <Section n={11} title="Law and contact">
        <p>
          These terms are governed by the laws of India, and the courts of Bengaluru have
          jurisdiction - except where the law of the country you live in gives you the right to
          bring a claim locally, which it may.
        </p>
        <p>
          <a className="text-brand hover:underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>
        </p>
      </Section>
    </LegalPage>
  );
}
