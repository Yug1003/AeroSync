import React, { useRef, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function PlaneMorph({ images = [] }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const frameIndex = useTransform(scrollYProgress, [0, 1], [0, Math.max(0, images.length - 1)]);

  const text1Opacity = useTransform(scrollYProgress, [0, 0.15, 0.35], [1, 1, 0]);
  const text1Scale = useTransform(scrollYProgress, [0, 0.35], [1, 0.95]);

  const text3Opacity = useTransform(scrollYProgress, [0.75, 0.9, 1], [0, 1, 1]);
  const text3Y = useTransform(scrollYProgress, [0.75, 1], [50, 0]);

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
      <div className="sticky top-0 w-full h-screen overflow-hidden flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover block"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-[#09090b] via-transparent to-[#09090b] pointer-events-none" />

        {/* Phase 1 Text */}
        <motion.div
          style={{ opacity: text1Opacity, scale: text1Scale }}
          className="absolute top-24 sm:top-28 left-6 sm:left-16 max-w-md pointer-events-none px-2"
        >
          <h2 className="text-2xl sm:text-5xl font-bold tracking-[0.2em] text-white font-mono uppercase leading-tight">
            AIRCRAFT TURNAROUND VECTORING
          </h2>
        </motion.div>

        {/* Phase 3 Text (Shifted to Bottom Right) */}
        <motion.div
          style={{ opacity: text3Opacity, y: text3Y }}
          className="absolute bottom-20 right-6 sm:right-16 max-w-2xl flex flex-col items-end text-right px-6 pointer-events-none z-10"
        >
          <span className="text-xs font-mono tracking-[0.4em] uppercase text-[#86efac] mb-3 block text-right">
            COMMAND CENTER ACCESS
          </span>
          <h2 className="text-2xl sm:text-5xl font-bold tracking-[0.25em] text-white font-mono uppercase leading-snug text-right">
            THE FUTURE OF SMART AIRPORT DISPATCH
          </h2>
        </motion.div>

        {/* Transition gradient fade to next section */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#09090b] via-[#09090b]/80 to-transparent pointer-events-none z-10" />
      </div>
    </div>
  );
}
