import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, ArrowRight, ArrowUp } from 'lucide-react';

export default function LuxuryFooter() {
  const navigate = useNavigate();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-[#09090b] border-t border-white/10 pt-20 pb-20 px-6 sm:px-12 text-zinc-300 font-mono text-sm flex flex-col items-center justify-center text-center">
      <div className="max-w-5xl w-full mx-auto flex flex-col items-center justify-center text-center">
        {/* Brand Mark */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-[#86efac]">
            <Plane className="w-6 h-6 -rotate-45" />
          </div>
          <span className="font-bold text-2xl sm:text-3xl tracking-[0.25em] text-white uppercase font-mono">
            AEROSYNC
          </span>
        </div>

        {/* Enter Dashboard Button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="group relative inline-flex items-center gap-3.5 px-10 py-4.5 text-sm sm:text-base font-bold tracking-[0.2em] font-mono uppercase text-black bg-[#86efac] rounded-lg transition-all duration-300 hover:bg-white mb-16"
        >
          <span>ENTER DASHBOARD</span>
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1.5" />
        </button>

        {/* Bottom Bar: Meta, Links & Back to Top */}
        <div className="pt-10 border-t border-white/10 w-full flex flex-col sm:flex-row items-center justify-between gap-6 text-xs sm:text-sm text-zinc-400 tracking-[0.15em] uppercase">
          <span>© {new Date().getFullYear()} AEROSYNC INC. ALL RIGHTS RESERVED.</span>

          <div className="flex items-center gap-6">
            <span className="hover:text-white transition-colors cursor-pointer font-medium">PRIVACY POLICY</span>
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
            <span className="hover:text-white transition-colors cursor-pointer font-medium">TERMS</span>
          </div>

          <button
            onClick={scrollToTop}
            className="hover:text-white transition-colors tracking-[0.2em] flex items-center gap-2 font-bold"
          >
            <span>BACK TO TOP</span>
            <ArrowUp className="w-4 h-4 text-[#86efac]" />
          </button>
        </div>
      </div>
    </footer>
  );
}
