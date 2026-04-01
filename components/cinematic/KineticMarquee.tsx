"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface KineticMarqueeProps {
  items: string[];
  speed?: number;
  direction?: "left" | "right";
  variant?: "filled" | "outline";
  separator?: string;
  className?: string;
  textClassName?: string;
}

export function KineticMarquee({
  items,
  speed = 0.5,
  direction = "left",
  variant = "filled",
  separator = "·",
  className,
  textClassName,
}: KineticMarqueeProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>(0);
  const posRef = useRef<number>(0);
  const widthRef = useRef<number>(0);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;

    // Duplicate children until we have enough to fill + overflow
    const measureAndFill = () => {
      const children = Array.from(row.children) as HTMLElement[];
      if (children.length === 0) return;
      const singleWidth = children[0].offsetWidth;
      widthRef.current = singleWidth;
      const needed = Math.ceil((window.innerWidth * 3) / singleWidth) + 2;
      const current = children.length;
      const original = children.slice(0, Math.ceil(current / 2));
      for (let i = current; i < needed; i++) {
        const clone = original[i % original.length].cloneNode(true) as HTMLElement;
        row.appendChild(clone);
      }
    };

    measureAndFill();

    function animate() {
      const totalW = widthRef.current * Math.ceil((row!.children.length) / 2);
      if (totalW === 0) { frameRef.current = requestAnimationFrame(animate); return; }

      posRef.current += direction === "left" ? -speed : speed;

      if (direction === "left" && posRef.current <= -totalW) {
        posRef.current += totalW;
      } else if (direction === "right" && posRef.current >= 0) {
        posRef.current -= totalW;
      }

      row!.style.transform = `translateX(${posRef.current}px)`;
      frameRef.current = requestAnimationFrame(animate);
    }

    frameRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameRef.current);
  }, [speed, direction]);

  const textStyle =
    variant === "outline"
      ? {
          color: "transparent",
          WebkitTextStroke: "1.5px rgba(255,255,255,0.6)",
        }
      : { color: "rgba(255,255,255,0.9)" };

  return (
    <div className={cn("overflow-hidden py-3", className)}>
      <div ref={rowRef} className="flex whitespace-nowrap will-change-transform">
        {[...items, ...items].map((item, i) => (
          <div
            key={i}
            className={cn(
              "inline-flex items-center shrink-0 px-8",
              textClassName,
            )}
            style={{
              fontSize: "clamp(32px, 6vw, 80px)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1,
              ...textStyle,
            }}
          >
            {item}
            <span
              className="mx-6"
              style={{
                fontSize: "0.4em",
                color: "rgba(245,158,11,0.6)",
                verticalAlign: "middle",
              }}
            >
              {separator}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
