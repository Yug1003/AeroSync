import React, { useRef, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function HeroScroll({ images = [] }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const frameIndex = useTransform(scrollYProgress, [0, 1], [0, Math.max(0, images.length - 1)]);

  const text1Opacity = useTransform(scrollYProgress, [0, 0.15, 0.3], [1, 1, 0]);
  const text1Y = useTransform(scrollYProgress, [0, 0.3], [0, -60]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let width = 0;
    let height = 0;
    let dpr = 1;

    const drawFrame = (index) => {
      const ctx = canvas.getContext('2d');
      if (!ctx || width === 0 || height === 0) return;

      let targetIdx = Math.floor(index);
      let img = images[targetIdx];

      if (!img) {
        for (let offset = 1; offset < 30; offset++) {
          if (images[targetIdx - offset]) { img = images[targetIdx - offset]; break; }
          if (images[targetIdx + offset]) { img = images[targetIdx + offset]; break; }
        }
      }
      if (!img) img = images[0] || images.find(Boolean);
      if (!img) return;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const imgAspect = img.width / img.height;
      const canvasAspect = width / height;

      let drawWidth, drawHeight, offsetX, offsetY;

      if (canvasAspect > imgAspect) {
        drawWidth = width;
        drawHeight = width / imgAspect;
        offsetX = 0;
        offsetY = (height - drawHeight) / 2;
      } else {
        drawHeight = height;
        drawWidth = height * imgAspect;
        offsetX = (width - drawWidth) / 2;
        offsetY = 0;
      }

      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      ctx.restore();
    };

    const updateCanvasSize = () => {
      if (!canvas) return;
      dpr = window.devicePixelRatio || 1;
      width = canvas.parentElement ? canvas.parentElement.clientWidth : window.innerWidth;
      height = canvas.parentElement ? canvas.parentElement.clientHeight : window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      drawFrame(frameIndex.get());
    };

    updateCanvasSize();

    let rafId = null;
    const unsubscribe = frameIndex.on('change', (latest) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => drawFrame(latest));
    });

    window.addEventListener('resize', updateCanvasSize);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      unsubscribe();
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [images]);

  return (
    <div ref={containerRef} className="relative h-[400vh] bg-[#09090b]">
      {/* Pinned Viewport Container */}
      <div className="sticky top-0 w-full h-screen overflow-hidden flex items-center justify-center">
        {/* Canvas Scrollytelling Layer */}
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover block"
        />

        {/* Dark Vignette Overlay for Depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-[#09090b]/80 pointer-events-none" />

        {/* Hero Title Overlay */}
        <motion.div
          style={{ opacity: text1Opacity, y: text1Y }}
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pointer-events-none z-10"
        >
          <h1 className="text-4xl sm:text-7xl lg:text-9xl font-bold tracking-[0.25em] text-white font-mono uppercase drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)]">
            AEROSYNC
          </h1>
          <p className="max-w-xl text-xs sm:text-base text-zinc-300 font-sans tracking-[0.15em] mt-4 sm:mt-6 uppercase">
            INTELLIGENT AIRPORT OPERATIONAL DISPATCH & TURNAROUND TELEMETRY
          </p>
        </motion.div>

        {/* Subtle Scroll Indicator */}
        <motion.div
          style={{ opacity: text1Opacity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none z-10"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="w-5 h-8 rounded-full border border-white/20 flex justify-center p-1"
          >
            <div className="w-1 h-2 bg-[#86efac] rounded-full" />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
