"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface TextMaskRevealProps {
  text: string;
  className?: string;
  color?: string;
}

export function TextMaskReveal({
  text,
  className,
  color = "#F59E0B",
}: TextMaskRevealProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function init() {
      const gsapMod = await import("gsap");
      const stMod = await import("gsap/ScrollTrigger");
      const gsap = gsapMod.default;
      const { ScrollTrigger } = stMod;
      gsap.registerPlugin(ScrollTrigger);

      const section = sectionRef.current;
      const reveal = revealRef.current;
      if (!section || !reveal) return;

      const tween = gsap.fromTo(
        reveal,
        { clipPath: "inset(100% 0 0 0)" },
        {
          clipPath: "inset(0% 0 0 0)",
          ease: "power2.inOut",
          scrollTrigger: {
            trigger: section,
            start: "top center",
            end: "center center",
            scrub: 0.5,
          },
        },
      );

      return () => {
        tween.kill();
        ScrollTrigger.getAll().forEach(st => st.kill());
      };
    }

    const cleanup = init();
    return () => { cleanup.then(fn => fn?.()); };
  }, []);

  const textStyle: React.CSSProperties = {
    fontSize: "clamp(60px, 15vw, 200px)",
    fontWeight: 800,
    letterSpacing: "-0.04em",
    lineHeight: 0.9,
    textAlign: "center",
    textTransform: "uppercase",
  };

  return (
    <div
      ref={sectionRef}
      className={cn("relative flex items-center justify-center min-h-[50vh] overflow-hidden", className)}
    >
      {/* Outline layer */}
      <div
        style={{
          ...textStyle,
          color: "transparent",
          WebkitTextStroke: `2px rgba(255,255,255,0.12)`,
          userSelect: "none",
        }}
        aria-hidden="true"
      >
        {text}
      </div>
      {/* Filled reveal layer */}
      <div
        ref={revealRef}
        className="absolute inset-0 flex items-center justify-center"
        style={{ clipPath: "inset(100% 0 0 0)" }}
      >
        <div style={{ ...textStyle, color }} aria-label={text}>
          {text}
        </div>
      </div>
    </div>
  );
}
