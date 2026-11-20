import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, LegalSection } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Terms of Use - D-Pathway',
  description:
    'The rules for using D-Pathway: accounts, projects, deliverables, evaluations, intellectual property, and prizes.',
};

// TODO: publish a real contact email for terms questions.
const CONTACT = '[contact email to be added]';

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      lastUpdated="20 November 2026"
      intro="These terms explain the rules for using D-Pathway. By creating an account you agree to them."
    >
      <LegalSection n={1} title="About D-Pathway">
        <p>
          D-Pathway is a student capstone project built at African Leadership
          University (ALU). Companies post projects, graduates apply and submit
          deliverables, and companies evaluate the work. It is a pilot, not a
          commercial service.
        </p>
      </LegalSection>

      <LegalSection n={2} title="Accounts and roles">
        <p>
          There are two roles: graduate and company. You are responsible for
          keeping your login details safe and for everything done under your
          account.
        </p>
      </LegalSection>

      <LegalSection n={3} title="For companies">
        <p>
          Post only real problems that you have the right to share. Once a
          project is published (open for applications), its brief, deadlines,
          required skills and IP terms are frozen - you can edit these only
          while the project is still a draft.
        </p>
        <p>
          You cannot delete a project once an applicant has been accepted; close
          it instead. An evaluation (a score from 1 to 5, written feedback, and
          an outcome) is recorded once per deliverable and is shown to the
          graduate.
        </p>
      </LegalSection>

      <LegalSection n={4} title="For graduates">
        <p>
          You must accept a project&apos;s terms before you can apply, and we
          record the moment you accept them. Your first submission must be on or
          before the project&apos;s submission deadline; late first submissions
          are refused.
        </p>
        <p>
          You can resubmit to improve your work. A resubmission replaces the link,
          file and note on your single deliverable and flags any existing
          evaluation so the company knows to review it again.
        </p>
      </LegalSection>

      <LegalSection n={5} title="Intellectual property">
        <p>
          Each project states its own IP terms, which are shown to you before you
          apply. You must accept them to apply, and your acceptance is recorded
          with a timestamp.
        </p>
        <p>
          The default terms assign the work to the company, while you keep the
          right to describe it in your portfolio. This follows Rwanda&apos;s Law
          No. 055/2024 on the protection of intellectual property, under which
          assigning economic rights rests on the agreed terms (Arts. 316 and
          319-320).
        </p>
      </LegalSection>

      <LegalSection n={6} title="Prizes and the wallet">
        <p>
          When a company creates a project with a cash prize, that amount is held
          from the company&apos;s wallet. It is released to the one graduate the
          company awards. It is refunded to the company if the project is deleted
          before any applicant is accepted, if the prize is changed, or if the
          project is closed without awarding. D-Pathway takes no fee.
        </p>
        <p>
          Payments currently run in test mode only. No real money moves, and
          payouts to mobile money are not yet available. D-Pathway is not a
          payment service provider.
        </p>
      </LegalSection>

      <LegalSection n={7} title="Interviews">
        <p>
          An interview invitation (the &quot;selected for interview&quot;
          outcome) is not a job offer. The company arranges any interview with
          you directly, off the platform.
        </p>
      </LegalSection>

      <LegalSection n={8} title="Acceptable use">
        <p>
          Do not create fake companies or projects, do not submit work that is
          not your own, and do not harass or abuse other users. Accounts that
          break these rules may be removed.
        </p>
        {/* TODO: there is no admin suspension/moderation tooling in the code
            yet; enforcement is manual. */}
      </LegalSection>

      <LegalSection n={9} title="Ending your account">
        <p>
          You can delete your account at any time from Profile (graduates) or
          Settings (companies). This permanently removes your account and
          cascades to your profile, applications, deliverables and evaluations.
        </p>
      </LegalSection>

      <LegalSection n={10} title="Limits of the service">
        <p>
          D-Pathway is a student project, provided &quot;as is&quot; and without
          warranties. It may change, pause, or go offline, and it is offered for
          this pilot only.
        </p>
      </LegalSection>

      <LegalSection n={11} title="Changes to these terms">
        <p>
          We may update these terms and will change the date at the top of this
          page. For questions, email us at {CONTACT}. You can also read our{' '}
          <Link href="/privacy" className="text-[#2847d3] hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
