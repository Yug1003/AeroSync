import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function LandingHeader() {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-10 py-8 bg-transparent flex items-center justify-end pointer-events-none">
      <div className="pointer-events-auto">
        <button
          onClick={() => navigate('/dashboard')}
          className="group relative inline-flex items-center justify-center px-6 py-3 text-xs sm:text-sm font-bold tracking-widest font-mono uppercase text-black bg-white rounded-md overflow-hidden transition-all duration-300 hover:bg-[#86efac]"
        >
          <span className="flex items-center gap-2.5">
            <span>ENTER DASHBOARD</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </button>
      </div>
    </header>
  );
}
