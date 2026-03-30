// components/PostHogProvider.tsx
// PostHog disabled — Clerk dependency caused ERR_NAME_NOT_RESOLVED
// Re-enable after Clerk is properly configured

'use client';

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
