"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ZoomParallaxProps {
  headline?: string;
  subheadline?: string;
  accentWord?: string;
  children?: React.ReactNode;
  className?: string;
}

export function ZoomParallax({
  headline = "Intelligence",
  subheadline = "Auction data. Zoning AI. Max bid formula.",
  accentWord,
  children,
  className,
}: ZoomParallaxProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const midRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<HTMLDivElement>(null);
  const productRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let gsap: typeof import("gsap").default;
    let ScrollTrigger: typeof import("gsap/ScrollTrigger").ScrollTrigger;

    async function init() {
      const gsapMod = await import("gsap");
      const stMod = await import("gsap/ScrollTrigger");
      gsap = gsapMod.default;
      ScrollTrigger = stMod.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);

      const section = sectionRef.current;
      if (!section || !bgRef.current || !midRef.current || !fgRef.current || !productRef.current) return;

      const tls: gsap.core.Tween[] = [];

      tls.push(
        gsap.fromTo(bgRef.current, { scale: 1 }, {
          scale: 1.15, ease: "none",
          scrollTrigger: { trigger: section, start: "top top", end: "bottom bottom", scrub: true },
        }),
        gsap.fromTo(midRef.current, { scale: 1, y: 0 }, {
          scale: 1.6, y: -80, ease: "none",
          scrollTrigger: { trigger: section, start: "top top", end: "bottom bottom", scrub: true },
        }),
        gsap.fromTo(fgRef.current, { scale: 1, opacity: 0.9 }, {
          scale: 6, opacity: 0, ease: "none",
          scrollTrigger: { trigger: section, start: "top top", end: "50% top", scrub: true },
        }),
        gsap.fromTo(productRef.current, { opacity: 0, scale: 0.85 }, {
          opacity: 1, scale: 1, ease: "power2.out",
          scrollTrigger: { trigger: section, start: "40% top", end: "60% top", scrub: true },
        }),
      );

      return () => {
        tls.forEach(t => t.kill());
        ScrollTrigger.getAll().forEach(st => st.kill());
      };
    }

    const cleanup = init();
    return () => {
      cleanup.then(fn => fn?.());
    };
  }, []);

  return (
    <div ref={sectionRef} className={cn("relative", className)} style={{ height: "500vh" }}>
      <div className="sticky top-0 min-h-dvh overflow-hidden flex items-center justify-center perspective-1000">
        {/* Background layer */}
        <div
          ref={bgRef}
          className="absolute inset-[-20%] z-[1]"
          style={{ background: "radial-gradient(ellipse at 50% 40%, #1a2a4a 0%, #020617 70%)" }}
        />
        {/* Mid shapes */}
        <div ref={midRef} className="absolute inset-0 z-[2]">
          <div className="absolute w-72 h-72 rounded-full opacity-15 top-[15%] left-[10%]"
            style={{ background: "radial-gradient(circle, #F59E0B 0%, transparent 70%)" }} />
          <div className="absolute w-48 h-48 rounded-full opacity-10 top-[60%] right-[15%]"
            style={{ background: "radial-gradient(circle, #1E3A5F 0%, transparent 70%)" }} />
          <div className="absolute w-96 h-96 rounded-full opacity-10 bottom-[10%] left-[40%]"
            style={{ background: "radial-gradient(circle, #F59E0B 0%, transparent 70%)" }} />
        </div>
        {/* Foreground headline */}
        <div ref={fgRef} className="absolute inset-0 z-[3] flex items-center justify-center">
          <h2
            className="text-white font-bold text-center leading-none opacity-90"
            style={{ fontSize: "clamp(48px, 12vw, 160px)", letterSpacing: "-0.04em", lineHeight: "0.95" }}
          >
            {accentWord
              ? headline.split(accentWord).map((part, i, arr) => (
                  <span key={i}>{part}{i < arr.length - 1 && <span style={{ color: "#F59E0B" }}>{accentWord}</span>}</span>
                ))
              : headline}
          </h2>
        </div>
        {/* Product reveal */}
        <div ref={productRef} className="absolute inset-0 z-[4] flex items-center justify-center opacity-0">
          <div className="rounded-3xl p-14 text-center max-w-md shadow-2xl"
            style={{ background: "#0d1829", border: "1px solid rgba(30,58,95,0.6)" }}>
            <h3 className="text-3xl font-semibold text-white mb-3" style={{ letterSpacing: "-0.025em" }}>
              {headline}
            </h3>
            <p className="text-base mb-6" style={{ color: "rgba(255,255,255,0.55)", lineHeight: "1.6" }}>
              {subheadline}
            </p>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
