import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function LandingHeader() {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-6 bg-transparent flex items-center justify-end pointer-events-none">
      <div className="pointer-events-auto">
        <button
          onClick={() => navigate('/dashboard')}
          className="group relative inline-flex items-center justify-center px-5 py-2.5 text-xs font-semibold tracking-wider font-mono uppercase text-black bg-white rounded-md overflow-hidden transition-all duration-300 hover:bg-[#86efac]"
        >
          <span className="flex items-center gap-2">
            <span>ENTER DASHBOARD</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </button>
      </div>
    </header>
  );
}
