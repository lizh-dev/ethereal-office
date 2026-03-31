'use client';

import { useRef } from 'react';
import HeroSection from '@/components/lp/HeroSection';
import ProblemSection from '@/components/lp/ProblemSection';
import FeaturesSection from '@/components/lp/FeaturesSection';
import ScreenshotSection from '@/components/lp/ScreenshotSection';
import PricingSection from '@/components/lp/PricingSection';
import StepsSection from '@/components/lp/StepsSection';
import FAQSection from '@/components/lp/FAQSection';
import CreateFloorSection from '@/components/lp/CreateFloorSection';
import Footer from '@/components/lp/Footer';

export default function LandingPage() {
  const createRef = useRef<HTMLElement>(null);

  const scrollToCreate = () => {
    createRef.current?.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => {
      const input = createRef.current?.querySelector<HTMLInputElement>('input[type="text"]');
      input?.focus();
    }, 800);
  };

  return (
    <div className="landing-page min-h-screen bg-white">
      <div className="fixed inset-0 bg-gradient-to-b from-sky-50 via-white to-sky-50/30 -z-10" />

      <HeroSection onCtaClick={scrollToCreate} />
      <ProblemSection />
      <FeaturesSection />
      <ScreenshotSection />
      <PricingSection />
      <StepsSection />
      <CreateFloorSection ref={createRef} />
      <FAQSection />
      <Footer />
    </div>
  );
}
