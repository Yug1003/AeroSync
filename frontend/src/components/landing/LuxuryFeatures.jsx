import React from 'react';
import { motion } from 'framer-motion';

const features = [
  {
    title: 'LIVE RADAR TELEMETRY',
    description: 'Real-time flight radar tracking across global airspace with OpenSky telemetry.',
  },
  {
    title: 'STAND & GATE INSPECTOR',
    description: 'Stand status grid, 4-stage turnaround milestone tracking, and safety-gated pushback.',
  },
  {
    title: 'AI VOICE ASSISTANT',
    description: 'Voice-controlled dispatch commands, METAR weather alerts, and status toggles.',
  },
  {
    title: 'GANTT SCHEDULE TIMELINE',
    description: 'Interactive turnaround schedule timeline with automated delay conflict prevention.',
  },
];

export default function LuxuryFeatures() {
  return (
    <section className="relative pt-36 sm:pt-48 pb-36 sm:pb-48 px-6 bg-[#09090b] border-t border-white/10 overflow-hidden flex flex-col items-center justify-center text-center">
      <div className="max-w-4xl w-full mx-auto relative z-10 flex flex-col items-center justify-center text-center">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-20 flex flex-col items-center justify-center">
          <span className="text-xs font-mono tracking-[0.35em] text-[#86efac] uppercase block mb-4 text-center">
            ENTERPRISE CAPABILITIES
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-[0.2em] text-white font-mono uppercase text-center">
            CORE PLATFORM FEATURES
          </h2>
        </div>

        {/* Centered Feature Grid (Heading & Description Only) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full justify-items-center">
          {features.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="group p-8 sm:p-10 rounded-xl bg-[#121215] border border-white/10 hover:border-emerald-400/30 transition-all duration-300 flex flex-col items-center justify-center text-center w-full"
            >
              <h3 className="text-lg sm:text-xl font-bold tracking-[0.15em] text-white font-mono uppercase mb-4 group-hover:text-[#86efac] transition-colors text-center w-full">
                {item.title}
              </h3>

              <p className="text-xs sm:text-sm text-zinc-400 tracking-[0.05em] font-sans leading-relaxed max-w-sm text-center mx-auto">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
