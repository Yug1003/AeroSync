import React from 'react';
import { useNavigate } from 'react-router-dom';

const capabilities = [
  {
    code: '01',
    title: 'LIVE AIRSPACE RADAR',
    description: 'Satellite flight tracking via OpenSky Network feeds.',
  },
  {
    code: '02',
    title: 'STAND & GATE INSPECTOR',
    description: 'Real-time occupancy grid & turnaround milestones.',
  },
  {
    code: '03',
    title: 'AUTOMATED DISRUPTION RECOVERY',
    description: 'AI gate reallocation algorithm compresses slots.',
  },
  {
    code: '04',
    title: 'GROUND FLEET TELEMETRY',
    description: 'GPS dispatch for fuel trucks, tugs & catering ramps.',
  },
  {
    code: '05',
    title: 'BAGGAGE CAROUSEL ENGINE',
    description: 'Automated claim belt mapping & overload detection.',
  },
  {
    code: '06',
    title: 'C-SUITE EXECUTIVE ANALYTICS',
    description: 'Pandas in-memory turnaround delay metrics.',
  },
];

export default function EnterpriseCapabilities() {
  const navigate = useNavigate();

  return (
    <section className="relative py-28 px-6 sm:px-12 bg-[#09090b] text-white flex flex-col items-center justify-center">
      <div className="max-w-4xl w-full mx-auto flex flex-col items-center justify-center text-center">
        {/* Enter Dashboard Button (Generous margin below) */}
        <div className="mb-32 sm:mb-36">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center justify-center px-12 py-6 text-2xl sm:text-4xl font-extrabold tracking-[0.25em] font-mono uppercase text-black bg-[#86efac] rounded-xl"
          >
            <span>ENTER DASHBOARD →</span>
          </button>
        </div>

        {/* Section Header (Smaller heading) */}
        <div className="text-center max-w-2xl mx-auto mb-12 flex flex-col items-center justify-center">
          <h2 className="text-base sm:text-xl font-bold tracking-[0.2em] text-white font-mono uppercase leading-tight text-center">
            AIRPORT DISPATCH MATRIX
          </h2>
        </div>

        {/* Centered Capabilities Grid with reduced card sizes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
          {capabilities.map((item) => (
            <div
              key={item.code}
              className="p-6 rounded-lg bg-[#121215] flex flex-col items-center justify-center text-center min-h-[135px]"
            >
              <span className="text-[11px] font-mono font-bold tracking-widest text-[#86efac] block mb-1.5 text-center">
                {item.code}
              </span>
              <h3 className="text-xs sm:text-sm font-bold tracking-[0.12em] text-white font-mono uppercase text-center leading-snug mb-1.5">
                {item.title}
              </h3>
              <p className="text-[11px] text-zinc-400 font-sans text-center leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
