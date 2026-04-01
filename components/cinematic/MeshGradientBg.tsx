"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface Blob {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
}

interface MeshGradientBgProps {
  colors?: string[];
  speed?: number;
  className?: string;
  children?: React.ReactNode;
}

const DEFAULT_COLORS = [
  "rgba(30, 58, 95, 0.8)",    // Navy
  "rgba(245, 158, 11, 0.4)",  // Orange
  "rgba(13, 24, 41, 0.9)",    // Deep navy
  "rgba(245, 158, 11, 0.25)", // Soft orange
  "rgba(10, 20, 40, 0.95)",   // Very dark
];

function initBlobs(colors: string[], speed: number): Blob[] {
  return colors.map((color) => ({
    x: Math.random(),
    y: Math.random(),
    vx: (Math.random() - 0.5) * speed,
    vy: (Math.random() - 0.5) * speed,
    r: 0.3 + Math.random() * 0.2,
    color,
  }));
}

export function MeshGradientBg({
  colors = DEFAULT_COLORS,
  speed = 0.0008,
  className,
  children,
}: MeshGradientBgProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const blobsRef = useRef<Blob[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    blobsRef.current = initBlobs(colors, speed);

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    function draw() {
      const w = canvas!.width;
      const h = canvas!.height;
      ctx!.clearRect(0, 0, w, h);

      blobsRef.current.forEach((blob) => {
        blob.x += blob.vx;
        blob.y += blob.vy;
        if (blob.x < -blob.r) blob.x = 1 + blob.r;
        if (blob.x > 1 + blob.r) blob.x = -blob.r;
        if (blob.y < -blob.r) blob.y = 1 + blob.r;
        if (blob.y > 1 + blob.r) blob.y = -blob.r;

        const grad = ctx!.createRadialGradient(
          blob.x * w, blob.y * h, 0,
          blob.x * w, blob.y * h, blob.r * Math.max(w, h),
        );
        grad.addColorStop(0, blob.color);
        grad.addColorStop(1, "transparent");
        ctx!.fillStyle = grad;
        ctx!.fillRect(0, 0, w, h);
      });

      frameRef.current = requestAnimationFrame(draw);
    }

    frameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frameRef.current);
      ro.disconnect();
    };
  }, [colors, speed]);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      />
      {children && (
        <div className="relative z-10">{children}</div>
      )}
    </div>
  );
}
