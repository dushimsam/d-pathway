import { getCurrentUserServer } from '@/lib/server-api';
import { HeroScreen } from '@/components/landing/HeroScreen';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { OpenBriefs } from '@/components/landing/OpenBriefs';
import { WhyChooseUs } from '@/components/landing/WhyChooseUs';
import { CtaBanner } from '@/components/landing/CtaBanner';
import { Faqs } from '@/components/landing/Faqs';
import { LandingFooter } from '@/components/landing/LandingFooter';

export default async function LandingPage() {
  const user = await getCurrentUserServer();
  const home = user ? (user.role === 'COMPANY' ? '/projects' : '/dashboard') : null;

  return (
    <div className="min-h-screen bg-white text-[#0b1020] antialiased selection:bg-[#3b5bfd] selection:text-white">
      {/* 1. First screen: light nav + blue hero card + trusted strip */}
      <HeroScreen home={home} />

      <main id="main">
        {/* 2. How it works — 3 steps */}
        <HowItWorks />

        {/* 3. Open briefs — showcase grid */}
        <OpenBriefs />

        {/* 4. Why choose us — visual bento */}
        <WhyChooseUs />

        {/* 5. CTA banner with cut-out person */}
        <CtaBanner />

        {/* 6. FAQs */}
        <Faqs />
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
