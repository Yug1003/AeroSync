import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, ArrowRight, ArrowUp, ShieldCheck } from 'lucide-react';

export default function LuxuryFooter() {
  const navigate = useNavigate();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-[#09090b] border-t border-white/10 pt-20 pb-16 px-6 sm:px-12 text-zinc-400 font-sans">
      <div className="max-w-6xl w-full mx-auto flex flex-col items-center text-center">
        
        {/* Main Footer Header */}
        <div className="flex flex-col items-center max-w-2xl mx-auto mb-12">
          {/* Brand Mark */}
          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-[#86efac]">
              <Plane className="w-5 h-5 -rotate-45" />
            </div>
            <span className="font-bold text-2xl tracking-[0.25em] text-white uppercase font-mono">
              AEROSYNC
            </span>
          </div>

          <p className="text-sm text-zinc-400 max-w-md leading-relaxed font-normal mb-8">
            Next-Generation Airport Operations & Ramp Dispatch Command Center.
          </p>

          {/* Telemetry Status Indicator Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-xs font-mono tracking-wider text-[#86efac] mb-10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>SYSTEM TELEMETRY ONLINE · ALL HUBS OPERATIONAL</span>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={() => navigate('/dashboard')}
            className="group relative inline-flex items-center gap-3 px-8 py-3.5 text-xs sm:text-sm font-semibold tracking-[0.2em] font-mono uppercase text-black bg-[#86efac] rounded-md transition-all duration-300 hover:bg-white"
          >
            <span>ENTER DASHBOARD</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Horizontal Divider */}
        <div className="w-full h-px bg-white/10 mb-10" />

        {/* Bottom Bar: Copyright, Links & Back to Top */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-6 text-xs font-mono text-zinc-400 tracking-wider">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#86efac]" />
            <span>© {new Date().getFullYear()} AEROSYNC INC. ALL RIGHTS RESERVED.</span>
          </div>

          <div className="flex items-center gap-6 text-zinc-400">
            <span className="hover:text-white transition-colors cursor-pointer">PRIVACY POLICY</span>
            <span className="w-1 h-1 rounded-full bg-zinc-600" />
            <span className="hover:text-white transition-colors cursor-pointer">TERMS OF SERVICE</span>
          </div>

          <button
            onClick={scrollToTop}
            className="group flex items-center gap-2 hover:text-white transition-colors tracking-widest uppercase font-semibold"
          >
            <span>BACK TO TOP</span>
            <ArrowUp className="w-3.5 h-3.5 text-[#86efac] transition-transform group-hover:-translate-y-0.5" />
          </button>
        </div>

      </div>
    </footer>
  );
}
