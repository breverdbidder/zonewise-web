"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";

function scrambleText(target: string, progress: number): string {
  return target
    .split("")
    .map((char, i) => {
      if (char === " ") return " ";
      const threshold = progress * target.length;
      if (i < threshold) return char;
      return CHARS[Math.floor(Math.random() * CHARS.length)];
    })
    .join("");
}

interface TextScrambleProps {
  text: string;
  trigger?: "mount" | "hover" | "scroll";
  className?: string;
  duration?: number;
  color?: string;
  scramblingColor?: string;
}

export function TextScramble({
  text,
  trigger = "scroll",
  className,
  duration = 1200,
  color = "#F59E0B",
  scramblingColor = "rgba(255,255,255,0.3)",
}: TextScrambleProps) {
  const [displayed, setDisplayed] = useState<{ char: string; resolved: boolean }[]>(
    text.split("").map((char) => ({ char, resolved: false })),
  );
  const [running, setRunning] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>(0);

  const runScramble = useCallback(() => {
    if (running) return;
    setRunning(true);
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);

      setDisplayed(
        text.split("").map((char, i) => {
          if (char === " ") return { char: " ", resolved: true };
          const threshold = progress * text.length;
          if (i < threshold) return { char, resolved: true };
          return { char: CHARS[Math.floor(Math.random() * CHARS.length)], resolved: false };
        }),
      );

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setRunning(false);
      }
    }

    frameRef.current = requestAnimationFrame(tick);
  }, [text, duration, running]);

  useEffect(() => {
    if (trigger === "mount") {
      const timer = setTimeout(runScramble, 200);
      return () => clearTimeout(timer);
    }

    if (trigger === "scroll" && ref.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            runScramble();
            observer.disconnect();
          }
        },
        { threshold: 0.5 },
      );
      observer.observe(ref.current);
      return () => observer.disconnect();
    }

    return () => cancelAnimationFrame(frameRef.current);
  }, [trigger, runScramble]);

  return (
    <div
      ref={ref}
      className={cn("cursor-default font-mono select-none", className)}
      onMouseEnter={trigger === "hover" ? runScramble : undefined}
    >
      {displayed.map((d, i) => (
        <span
          key={i}
          style={{ color: d.char === " " ? "transparent" : d.resolved ? color : scramblingColor }}
        >
          {d.char}
        </span>
      ))}
    </div>
  );
}
