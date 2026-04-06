'use client';

import { useRef } from 'react';
import LandingNav from '@/components/lp/LandingNav';
import HeroSection from '@/components/lp/HeroSection';
import SocialProofSection from '@/components/lp/SocialProofSection';
import FeaturesSection from '@/components/lp/FeaturesSection';
import PricingSection from '@/components/lp/PricingSection';
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
    <div className="landing-page min-h-screen bg-background">
      <LandingNav onCtaClick={scrollToCreate} />

      <HeroSection onCtaClick={scrollToCreate} />
      <SocialProofSection />
      <FeaturesSection />
      <PricingSection />
      <CreateFloorSection ref={createRef} />
      <FAQSection />
      <Footer />
    </div>
  );
}
