import React, { useEffect } from 'react';
import Lenis from 'lenis';
import useImagePreloader, { generateSequenceUrls } from '../hooks/useImagePreloader';
import LandingHeader from '../components/landing/LandingHeader';
import HeroScroll from '../components/landing/HeroScroll';
import PlaneMorph from '../components/landing/PlaneMorph';
import LuxuryFeatures from '../components/landing/LuxuryFeatures';
import LuxuryFooter from '../components/landing/LuxuryFooter';
import { Plane } from 'lucide-react';

const sequence1Urls = generateSequenceUrls('sequence1', 120);
const sequence2Urls = generateSequenceUrls('sequence2', 120);

export default function LandingPage() {
  const { images: sequence1Images, isLoaded: seq1Loaded, progress: seq1Progress } = useImagePreloader(sequence1Urls);
  const { images: sequence2Images, isLoaded: seq2Loaded, progress: seq2Progress } = useImagePreloader(sequence2Urls);

  const totalProgress = Math.round((seq1Progress + seq2Progress) / 2);
  const isReady = seq1Loaded || seq2Loaded;

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  if (!isReady) {
    return (
      <div className="fixed inset-0 z-50 bg-[#09090b] flex flex-col items-center justify-center font-mono text-white px-6">
        <div className="relative z-10 flex flex-col items-center max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#86efac] mb-8 animate-pulse">
            <Plane className="w-8 h-8 -rotate-45" />
          </div>

          <span className="text-xs tracking-[0.35em] text-[#86efac] uppercase mb-2">
            AEROSYNC JETS
          </span>
          <h1 className="text-2xl font-bold tracking-[0.2em] uppercase mb-8">
            INITIALIZING ENGINE TELEMETRY
          </h1>

          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-4 relative">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-[#86efac] transition-all duration-300 rounded-full"
              style={{ width: `${totalProgress}%` }}
            />
          </div>

          <div className="w-full flex items-center justify-between text-xs text-zinc-400">
            <span>PRECACHING SEQUENCES (240 FRAMES)</span>
            <span className="font-bold text-[#86efac]">{totalProgress}%</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#09090b] text-white min-h-screen selection:bg-[#86efac] selection:text-black">
      <LandingHeader />
      <main>
        <HeroScroll images={sequence1Images} />
        <PlaneMorph images={sequence2Images} />
        <LuxuryFeatures />
      </main>
      <LuxuryFooter />
    </div>
  );
}
