import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, LegalSection } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy Policy - D-Pathway',
  description:
    'How D-Pathway collects, uses, and protects your personal data, and your rights under Rwanda Law No. 058/2021.',
};

// TODO: publish a real contact email for privacy requests and data-rights
// requests. There is no contact address anywhere in the codebase yet.
const CONTACT = '[contact email to be added]';

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      lastUpdated="20 November 2026"
      intro="This policy explains, in plain language, what personal data D-Pathway collects, why, who can see it, and the rights you have over it."
    >
      <LegalSection title="Who we are">
        <p>
          D-Pathway is a student capstone project built at African Leadership
          University (ALU) in Kigali, Rwanda. It connects companies that post
          real projects with graduates who apply, submit work, and receive
          feedback. This is a pilot, not a commercial company.
        </p>
        <p>For privacy questions, email us at {CONTACT}.</p>
      </LegalSection>

      <LegalSection title="What we collect">
        <p>
          We only store what you enter and what the platform needs to run. For
          every account we keep your email, a hashed password, and your role
          (graduate or company).
        </p>
        <p>
          Graduates: full name, education, skills, portfolio links, location,
          and an optional profile photo. Companies: company name, and optionally
          an industry, description, representative title, logo, website,
          location and size.
        </p>
        <p>
          We also store your applications, the deliverables you submit (a link
          and/or an uploaded file, plus a note), the evaluations companies
          record, and your wallet ledger entries (prize holds, payouts, refunds
          and top-ups).
        </p>
      </LegalSection>

      <LegalSection title="Why we collect it">
        <p>
          We use your data only to run the core workflow: posting projects,
          applying to them, submitting deliverables, evaluating them, and
          tracking prize balances.
        </p>
        <p>
          We do not sell your data, we do not show advertising, and we do not
          share your data with anyone outside the services listed below.
        </p>
      </LegalSection>

      <LegalSection title="Who can see what">
        <p>
          A deliverable is private. Only the graduate who submitted it (and
          accepted teammates) and the company that posted the project can view
          it; the API rejects anyone else. The same rule applies to an
          evaluation: only the graduate it concerns and the owning company can
          read it.
        </p>
        <p>
          Companies see the applicants to their own projects; graduates see only
          their own applications. A graduate&apos;s public profile (name,
          skills, and completed-work stats) is visible to anyone with the link.
        </p>
      </LegalSection>

      <LegalSection title="Third-party services">
        <p>
          A few outside services power specific features. Cloudinary stores
          uploaded files - your browser uploads directly to Cloudinary, and our
          server never receives the file bytes. Stripe handles wallet top-ups
          and currently runs in test mode only. Resend sends email
          notifications when it is configured.
        </p>
        <p>These services may store data on servers outside Rwanda.</p>
      </LegalSection>

      <LegalSection title="Where your data is stored">
        <p>
          Your account and project data live in a PostgreSQL database on a
          server in Kigali, Rwanda.
        </p>
      </LegalSection>

      <LegalSection title="How we protect it">
        <p>
          Passwords are never stored in plain text; we hash them with bcrypt.
          All traffic uses HTTPS. Access is role-based: the server checks your
          identity and role on every request and returns only data you are
          allowed to see. Your login token is kept in an HTTP-only cookie that
          browser scripts cannot read.
        </p>
      </LegalSection>

      <LegalSection title="How decisions are made">
        <p>
          Every evaluation is made by a person at the company. They choose the
          score, write the feedback, and set the outcome. No automated system
          scores your work or decides interview invitations.
        </p>
      </LegalSection>

      <LegalSection title="Your rights (Rwanda Law No. 058/2021)">
        <p>
          Rwanda&apos;s Law No. 058/2021 on the protection of personal data and
          privacy gives you the following rights:
        </p>
        <ul className="ml-5 list-disc space-y-2">
          <li>
            <strong>Consent and withdrawing it (Arts. 6 and 8).</strong> You
            give consent by creating an account. You can withdraw it at any time
            by deleting your account (graduates: Profile; companies: Settings),
            which removes your profile and its data.
          </li>
          <li>
            <strong>Access to your data (Art. 18).</strong> You can see the data
            we hold about you inside the app: your profile, applications,
            deliverables, evaluations and wallet. A one-click export is not built
            yet; email us at {CONTACT} to request a copy.
          </li>
          <li>
            <strong>Correction (Art. 24).</strong> Edit your profile at any time
            (graduates: Profile; companies: Settings), and change your password
            from the same place.
          </li>
          <li>
            <strong>Erasure (Art. 23).</strong> Delete your account from
            Profile or Settings. This permanently removes your account and
            cascades to your profile, applications, deliverables and evaluations.
          </li>
          <li>
            <strong>Not being subject to solely automated decisions (Art. 21).</strong>{' '}
            No decision about you is made by an automated system - a person at
            the company makes every evaluation and interview decision.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="How long we keep data">
        <p>
          We keep your data while your account exists. When you delete your
          account, your personal data is removed.
        </p>
        {/* TODO: a fixed retention schedule for any residual records (e.g.
            wallet ledger for audit) is not defined in the code. */}
        <p>
          A fixed retention schedule for any residual records is not defined
          yet.
        </p>
      </LegalSection>

      <LegalSection title="Changes to this policy">
        <p>
          If we change this policy, we will update the date at the top of this
          page. You can also review our{' '}
          <Link href="/terms" className="text-[#2847d3] hover:underline">
            Terms of Use
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
