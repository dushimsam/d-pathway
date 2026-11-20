import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, LegalSection } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy Policy - D-Pathway',
  description:
    'In plain words: what information D-Pathway keeps, why, who can see it, and your rights.',
};

// TODO: publish a real contact email for privacy and data questions.
// There is no contact address anywhere in the codebase yet.
const CONTACT = '[contact email to be added]';

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      lastUpdated="20 November 2026"
      intro="This page tells you how we handle your information. We wrote it in plain words."
    >
      <LegalSection title="Who are we?">
        <p>
          D-Pathway is a student project. We built it at African Leadership
          University (ALU) in Kigali, Rwanda.
        </p>
        <p>
          Companies post projects. Graduates do the work and get feedback. This
          is a test project, not a business.
        </p>
        <p>Do you have a question? Email us at {CONTACT}.</p>
      </LegalSection>

      <LegalSection title="What do we collect?">
        <p>We only keep what you type. We also keep what we need to run the site.</p>
        <p>
          For every account, we keep three things. Your email, your role, and
          your password. Your role is &quot;graduate&quot; or &quot;company&quot;.
        </p>
        <p>
          We never store your real password. We store a scrambled version. This
          scrambled version is called a &quot;hash&quot;.
        </p>
        <p>
          If you are a graduate, we keep your name, school, skills, links, and
          town. You can also add a photo.
        </p>
        <p>
          If you are a company, we keep your company name. You can also add more
          details. These are your industry, description, job title, logo,
          website, town, and size.
        </p>
        <p>
          We also keep your applications and the work you send. We keep the
          scores companies give. We also keep your wallet history. It shows prize
          money that was locked, paid out, or given back. It also shows money you
          added.
        </p>
      </LegalSection>

      <LegalSection title="Why do we collect it?">
        <p>
          We use your information to run the site. That means posting projects,
          applying, sending work, scoring it, and tracking prize money.
        </p>
        <p>
          We do not sell your information. We do not show ads. We do not give it
          to anyone else, apart from the helpers below.
        </p>
      </LegalSection>

      <LegalSection title="Who can see your work?">
        <p>
          Your work is private. Only you and the company that posted the project
          can see it. If you work in a team, your teammates can see it too.
        </p>
        <p>Scores work the same way. Only you and that company can see your score.</p>
        <p>
          Companies see the people who applied to their own projects. You see
          only your own applications.
        </p>
        <p>
          Your public profile is open. Anyone with the link can see your name,
          your skills, and your work stats.
        </p>
      </LegalSection>

      <LegalSection title="What outside services do we use?">
        <p>We use a few outside helpers for some jobs.</p>
        <p>
          Cloudinary keeps your uploaded files. Your file goes straight from your
          browser to Cloudinary. Our server never touches the file.
        </p>
        <p>
          Stripe handles adding money to wallets. Right now it runs in test mode
          only.
        </p>
        <p>Resend sends emails, when it is turned on.</p>
        <p>These helpers may keep data on computers outside Rwanda.</p>
      </LegalSection>

      <LegalSection title="Where do we keep your data?">
        <p>
          Your data lives in a database on a computer in Kigali, Rwanda. A
          database is a place that stores information.
        </p>
      </LegalSection>

      <LegalSection title="How do we keep it safe?">
        <p>We scramble every password, so no one can read it.</p>
        <p>The site uses HTTPS. This means your connection is locked and private.</p>
        <p>
          We check who you are on every request. We only show you what you are
          allowed to see.
        </p>
        <p>
          Your login code sits in a special cookie. Scripts in your browser
          cannot read it.
        </p>
      </LegalSection>

      <LegalSection title="Who makes the decisions?">
        <p>
          A real person at the company scores your work. They pick the score,
          write the notes, and choose the result.
        </p>
        <p>No robot or computer decides anything about you.</p>
      </LegalSection>

      <LegalSection title="What are your rights?">
        <p>Rwanda has a data law. It gives you these rights (Law No. 058/2021).</p>
        <ul className="ml-5 list-disc space-y-3">
          <li>
            <strong>You can say yes, and change your mind.</strong> You say yes
            when you make an account. You can change your mind any time. Just
            delete your account (Articles 6 and 8).
          </li>
          <li>
            <strong>You can see your data.</strong> You can view your profile,
            applications, work, scores, and wallet in the app. We cannot export
            it in one click yet. Email us at {CONTACT} for a copy (Article 18).
          </li>
          <li>
            <strong>You can fix your data.</strong> Edit your profile any time.
            You can change your password there too (Article 24).
          </li>
          <li>
            <strong>You can delete your data.</strong> Delete your account from
            your profile or settings. This removes your account and all your data
            (Article 23).
          </li>
          <li>
            <strong>No robot decides about you.</strong> A real person makes
            every score and every interview choice (Article 21).
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="How long do we keep your data?">
        <p>We keep your data while your account is open.</p>
        <p>When you delete your account, we remove your data.</p>
        {/* TODO: a fixed time to keep old records (e.g. wallet history) is not
            set in the code. */}
        <p>We have not set a fixed time to keep old records yet.</p>
      </LegalSection>

      <LegalSection title="Will this policy change?">
        <p>
          We may change this page. If we do, we will change the date at the top.
        </p>
        <p>
          You can also read our{' '}
          <Link href="/terms" className="text-[#2847d3] hover:underline">
            Terms of Use
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
