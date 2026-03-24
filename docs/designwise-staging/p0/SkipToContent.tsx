// src/components/SkipToContent.tsx
// P0-1: A11yWise — Skip-to-content link
// MUST be first focusable element in DOM

'use client';

export default function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="
        fixed top-0 left-0 z-[9999]
        -translate-y-full focus:translate-y-0
        bg-[#F59E0B] text-[#020617]
        px-4 py-2 text-sm font-bold
        transition-transform duration-200
        focus:outline-none focus:ring-2 focus:ring-white
        rounded-br-lg
      "
    >
      Skip to content
    </a>
  );
}
