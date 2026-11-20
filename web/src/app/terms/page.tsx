import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, LegalSection } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Terms of Use - D-Pathway',
  description:
    'In plain words: the rules for using D-Pathway. Accounts, projects, work, scores, and prizes.',
};

// TODO: publish a real contact email for questions about these terms.
const CONTACT = '[contact email to be added]';

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      lastUpdated="20 November 2026"
      intro="These are the rules for using D-Pathway. When you make an account, you agree to them."
    >
      <LegalSection n={1} title="What is D-Pathway?">
        <p>
          D-Pathway is a student project from African Leadership University (ALU).
        </p>
        <p>
          Companies post projects. Graduates apply and send their work. Companies
          then score the work. This is a test project, not a business.
        </p>
      </LegalSection>

      <LegalSection n={2} title="What about your account?">
        <p>There are two kinds of accounts. One for graduates and one for companies.</p>
        <p>Keep your login safe. You are responsible for anything done with your account.</p>
      </LegalSection>

      <LegalSection n={3} title="What must companies do?">
        <p>Post only real problems. Post only work you are allowed to share.</p>
        <p>
          You can edit a project while it is a draft. Once you publish it, you
          cannot change it. The brief, the dates, the skills, and the rules are
          then locked.
        </p>
        <p>You cannot delete a project after you accept someone. Close it instead.</p>
        <p>
          You give each piece of work one score. A score is 1 to 5, with notes
          and a result. The graduate can see it.
        </p>
      </LegalSection>

      <LegalSection n={4} title="What must graduates do?">
        <p>You must agree to a project&apos;s rules before you apply. We save the time you agree.</p>
        <p>Send your work on time. We refuse a first submission after the deadline.</p>
        <p>
          You can send a better version later. A new version replaces your old
          one. It also tells the company to check your score again.
        </p>
      </LegalSection>

      <LegalSection n={5} title="Who owns the work?">
        <p>
          Each project has its own rules about who owns the work. You see these
          rules before you apply. You must agree to them to apply. We save the
          time you agree.
        </p>
        <p>
          The normal rule is simple. The company owns the work. You can still
          show it in your portfolio.
        </p>
        <p>
          Rwanda has a law about this. Who owns the work depends on the rules you
          agreed to (Law No. 055/2024, Articles 316 and 319 to 320).
        </p>
      </LegalSection>

      <LegalSection n={6} title="How do prizes work?">
        <p>
          A company can add a prize to a project. When they do, we lock that
          money from their wallet. Locking means it is set aside and cannot be
          spent.
        </p>
        <p>We give the money to the one graduate the company picks.</p>
        <p>
          We give the money back to the company in three cases. If they delete
          the project before accepting anyone. If they change the prize. If they
          close the project without picking a winner.
        </p>
        <p>We take no fee.</p>
        <p>
          Right now, payments run in test mode only. No real money moves. You
          cannot cash out to mobile money yet. We are not a payment company.
        </p>
      </LegalSection>

      <LegalSection n={7} title="Is an interview a job offer?">
        <p>No. An interview invite is not a job offer.</p>
        <p>The company sets up the interview with you off the site.</p>
      </LegalSection>

      <LegalSection n={8} title="How must you behave?">
        <p>Do not make fake companies or fake projects. Do not send work that is not yours.</p>
        <p>Do not bully or abuse other people. We may remove accounts that break these rules.</p>
        {/* TODO: there is no admin suspension/moderation tool in the code yet;
            removal is manual. */}
      </LegalSection>

      <LegalSection n={9} title="Can you delete your account?">
        <p>Yes. You can delete your account any time.</p>
        <p>
          Go to your profile (graduates) or settings (companies). This removes
          your account and all your data.
        </p>
      </LegalSection>

      <LegalSection n={10} title="What are the limits?">
        <p>
          D-Pathway is a student project. We give it to you &quot;as is&quot;. It
          may change, pause, or stop. We make no promises about it.
        </p>
      </LegalSection>

      <LegalSection n={11} title="Will these terms change?">
        <p>We may change these rules. If we do, we will change the date at the top.</p>
        <p>
          Have a question? Email us at {CONTACT}. You can also read our{' '}
          <Link href="/privacy" className="text-[#2847d3] hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
