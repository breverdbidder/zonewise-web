"use client";

import { cn } from "@/lib/utils";

interface StickyCard {
  num: string;
  title: string;
  description: string;
  bg?: string;
  color?: string;
}

interface StickyCardsProps {
  cards: StickyCard[];
  className?: string;
}

const DEFAULT_COLORS = [
  { bg: "#1E3A5F", color: "#e8ecf0" },
  { bg: "#162d47", color: "#e8f0ec" },
  { bg: "#2d3a4a", color: "#f0ece8" },
  { bg: "#1a2a3a", color: "#e8ecf0" },
  { bg: "#0d1829", color: "#eae7e2" },
];

export function StickyCards({ cards, className }: StickyCardsProps) {
  return (
    <div className={cn("max-w-2xl mx-auto px-6 pb-48", className)}>
      {cards.map((card, i) => {
        const defaults = DEFAULT_COLORS[i % DEFAULT_COLORS.length];
        const bg = card.bg ?? defaults.bg;
        const color = card.color ?? defaults.color;
        const topOffset = 80 + i * 20;

        return (
          <div
            key={i}
            className="sticky rounded-3xl px-10 py-12 mb-8 min-h-[280px] flex flex-col justify-end shadow-xl will-change-transform"
            style={{
              top: `${topOffset}px`,
              zIndex: i + 1,
              background: bg,
              color,
              border: "1px solid rgba(245,158,11,0.08)",
            }}
          >
            <div
              className="text-xs uppercase tracking-widest mb-4 font-normal opacity-50"
              style={{ letterSpacing: "0.12em" }}
            >
              {card.num}
            </div>
            <h3
              className="font-semibold mb-3"
              style={{ fontSize: "clamp(24px, 4vw, 36px)", letterSpacing: "-0.02em", lineHeight: "1.15" }}
            >
              {card.title}
            </h3>
            <p className="text-base opacity-70 max-w-[50ch] leading-relaxed">
              {card.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}
