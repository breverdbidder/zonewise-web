"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface CurtainRevealProps {
  leftWord?: string;
  rightWord?: string;
  children?: React.ReactNode;
  className?: string;
}

export function CurtainReveal({
  leftWord = "DIS",
  rightWord = "COVER",
  children,
  className,
}: CurtainRevealProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function init() {
      const gsapMod = await import("gsap");
      const stMod = await import("gsap/ScrollTrigger");
      const gsap = gsapMod.default;
      const { ScrollTrigger } = stMod;
      gsap.registerPlugin(ScrollTrigger);

      const section = sectionRef.current;
      if (!section || !leftRef.current || !rightRef.current) return;

      const t1 = gsap.to(leftRef.current, {
        xPercent: -100, ease: "power2.inOut",
        scrollTrigger: { trigger: section, start: "top top", end: "60% top", scrub: 0.5 },
      });
      const t2 = gsap.to(rightRef.current, {
        xPercent: 100, ease: "power2.inOut",
        scrollTrigger: { trigger: section, start: "top top", end: "60% top", scrub: 0.5 },
      });

      return () => {
        t1.kill(); t2.kill();
        ScrollTrigger.getAll().forEach(st => st.kill());
      };
    }

    const cleanup = init();
    return () => { cleanup.then(fn => fn?.()); };
  }, []);

  return (
    <div
      ref={sectionRef}
      className={cn("relative", className)}
      style={{ height: "300vh" }}
    >
      <div className="sticky top-0 min-h-dvh overflow-hidden flex items-center justify-center">
        {/* Content behind curtain */}
        <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center text-center p-10"
          style={{ background: "linear-gradient(135deg, #0d1829, #020617)" }}>
          {children ?? (
            <>
              <h3 className="text-3xl md:text-5xl font-semibold text-white mb-3" style={{ letterSpacing: "-0.02em" }}>
                The intelligence lives here
              </h3>
              <p className="text-base md:text-lg max-w-[45ch] leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                245K+ auction records. 10.8M FL parcels. AI deal scoring.
              </p>
            </>
          )}
        </div>
        {/* Left curtain */}
        <div
          ref={leftRef}
          className="absolute top-0 bottom-0 left-0 w-1/2 z-[2] flex items-center justify-end pr-10"
          style={{ background: "#020617", borderRight: "1px solid rgba(30,58,95,0.4)" }}
        >
          <h2 className="font-bold text-white" style={{ fontSize: "clamp(36px, 7vw, 80px)", letterSpacing: "-0.04em", lineHeight: 0.95 }}>
            {leftWord}
          </h2>
        </div>
        {/* Right curtain */}
        <div
          ref={rightRef}
          className="absolute top-0 bottom-0 right-0 w-1/2 z-[2] flex items-center justify-start pl-10"
          style={{ background: "#020617", borderLeft: "1px solid rgba(30,58,95,0.4)" }}
        >
          <h2 className="font-bold text-white" style={{ fontSize: "clamp(36px, 7vw, 80px)", letterSpacing: "-0.04em", lineHeight: 0.95 }}>
            {rightWord}
          </h2>
        </div>
      </div>
    </div>
  );
}
