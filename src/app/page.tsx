'use client';

import { useRef } from 'react';
import HeroSection from '@/components/lp/HeroSection';
import ProblemSection from '@/components/lp/ProblemSection';
import FeaturesSection from '@/components/lp/FeaturesSection';
import StepsSection from '@/components/lp/StepsSection';
import CreateFloorSection from '@/components/lp/CreateFloorSection';
import Footer from '@/components/lp/Footer';

export default function LandingPage() {
  const createRef = useRef<HTMLElement>(null);

  const scrollToCreate = () => {
    createRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] overflow-y-auto overflow-x-hidden">
      {/* Fixed gradient background */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#0a0a1a] via-[#0f0f2e] to-[#0a0a1a] -z-10" />

      <HeroSection onCtaClick={scrollToCreate} />
      <ProblemSection />
      <FeaturesSection />
      <StepsSection />
      <CreateFloorSection ref={createRef} />
      <Footer />
    </div>
  );
}
