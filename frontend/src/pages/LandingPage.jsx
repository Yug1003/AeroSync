import React, { useEffect } from 'react';
import Lenis from 'lenis';
import useImagePreloader, { generateSequenceUrls } from '../hooks/useImagePreloader';
import LandingHeader from '../components/landing/LandingHeader';
import HeroScroll from '../components/landing/HeroScroll';
import PlaneMorph from '../components/landing/PlaneMorph';
import EnterpriseCapabilities from '../components/landing/EnterpriseCapabilities';
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
      <div className="min-h-screen bg-[#09090b] text-white overflow-hidden relative">
        {/* Skeleton Header */}
        <header className="fixed top-0 left-0 right-0 z-50 px-10 py-8 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 animate-pulse" />
            <div className="w-24 h-4 rounded bg-white/10 animate-pulse" />
          </div>
          <div className="w-36 h-10 rounded-md bg-white/10 animate-pulse" />
        </header>

        {/* Skeleton Hero Frame */}
        <div className="h-screen w-full flex flex-col items-center justify-center px-6 relative">
          <div className="w-48 h-6 rounded-full bg-white/10 animate-pulse mb-6" />
          <div className="w-3/4 max-w-2xl h-12 rounded-lg bg-white/10 animate-pulse mb-4" />
          <div className="w-1/2 max-w-md h-5 rounded-md bg-white/10 animate-pulse mb-12" />

          {/* Skeleton Shimmer Canvas Frame */}
          <div className="w-full max-w-4xl h-64 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center animate-pulse relative overflow-hidden">
            <Plane className="w-12 h-12 text-white/20 -rotate-45 animate-pulse" />
          </div>

          {/* Bottom Loading Progress Bar */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-64 flex flex-col items-center">
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#86efac] transition-all duration-300 rounded-full"
                style={{ width: `${totalProgress}%` }}
              />
            </div>
            <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase mt-2">
              PRELOADING TELEMETRY · {totalProgress}%
            </span>
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
        <EnterpriseCapabilities />
      </main>
    </div>
  );
}
