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
          className="inline-flex items-center justify-center px-8 py-4 text-sm sm:text-base font-bold tracking-widest font-mono uppercase text-black bg-white rounded-md"
        >
          <span className="flex items-center gap-3">
            <span>ENTER DASHBOARD</span>
            <ArrowRight className="w-5 h-5" />
          </span>
        </button>
      </div>
    </header>
  );
}
