"use client";

import { useCallback, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ParticleType = "particles" | "confetti" | "ring";

interface ParticleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  particleType?: ParticleType;
  particleColor?: string;
  variant?: "primary" | "outline" | "danger" | "success";
}

function spawnParticles(x: number, y: number, color: string) {
  for (let i = 0; i < 12; i++) {
    const el = document.createElement("div");
    el.style.cssText = `
      position: fixed; width: 8px; height: 8px; border-radius: 50%;
      background: ${color}; pointer-events: none; z-index: 9999;
      left: ${x}px; top: ${y}px;
    `;
    document.body.appendChild(el);

    const angle = (i / 12) * Math.PI * 2;
    const distance = 60 + Math.random() * 60;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;

    el.animate(
      [
        { transform: "translate(-50%, -50%) scale(1)", opacity: 1 },
        { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0)`, opacity: 0 },
      ],
      { duration: 600 + Math.random() * 300, easing: "cubic-bezier(0,0,0.2,1)", fill: "forwards" },
    ).onfinish = () => el.remove();
  }
}

function spawnConfetti(x: number, y: number, color: string) {
  const colors = [color, "#F59E0B", "#ffffff", "#1E3A5F"];
  for (let i = 0; i < 20; i++) {
    const el = document.createElement("div");
    const c = colors[i % colors.length];
    el.style.cssText = `
      position: fixed; width: 6px; height: 12px; border-radius: 2px;
      background: ${c}; pointer-events: none; z-index: 9999;
      left: ${x}px; top: ${y}px;
    `;
    document.body.appendChild(el);

    const tx = (Math.random() - 0.5) * 200;
    const ty = -(Math.random() * 150 + 50);
    const rot = Math.random() * 720 - 360;

    el.animate(
      [
        { transform: "translate(-50%, -50%) rotate(0deg)", opacity: 1 },
        { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) rotate(${rot}deg)`, opacity: 0 },
      ],
      { duration: 800 + Math.random() * 400, easing: "cubic-bezier(0,0,0.2,1)", fill: "forwards" },
    ).onfinish = () => el.remove();
  }
}

function spawnRing(x: number, y: number, color: string) {
  const el = document.createElement("div");
  el.style.cssText = `
    position: fixed; border-radius: 50%; pointer-events: none; z-index: 9998;
    border: 2px solid ${color}; left: ${x}px; top: ${y}px;
  `;
  document.body.appendChild(el);

  el.animate(
    [
      { width: "0px", height: "0px", opacity: 0.8, transform: "translate(-50%, -50%)" },
      { width: "120px", height: "120px", opacity: 0, transform: "translate(-50%, -50%)" },
    ],
    { duration: 500, easing: "cubic-bezier(0,0,0.2,1)", fill: "forwards" },
  ).onfinish = () => el.remove();
}

export function ParticleButton({
  children,
  className,
  onClick,
  particleType = "particles",
  particleColor = "#F59E0B",
  variant = "primary",
  ...props
}: ParticleButtonProps) {
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      if (particleType === "particles") spawnParticles(x, y, particleColor);
      else if (particleType === "confetti") spawnConfetti(x, y, particleColor);
      else if (particleType === "ring") spawnRing(x, y, particleColor);

      onClick?.(e);
    },
    [onClick, particleType, particleColor],
  );

  const variantStyles: Record<string, string> = {
    primary: "bg-[#F59E0B] text-[#020617] hover:bg-[#d97706]",
    outline: "bg-transparent border border-white/20 text-white hover:bg-white/10",
    danger: "bg-red-600 text-white hover:bg-red-700",
    success: "bg-green-600 text-white hover:bg-green-700",
  };

  return (
    <button
      className={cn(
        "relative inline-flex items-center justify-center px-8 py-3 rounded-xl text-sm font-medium transition-transform active:scale-95",
        variantStyles[variant],
        className,
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}
