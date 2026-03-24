// components/PostHogProvider.tsx
// P1-1: AnalyticsWise — PostHog React Provider
// Wraps app with PostHog context, auto-tracks page views

'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { initPostHog, identifyUser, resetUser, posthog } from '@/lib/posthog';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || '';

// Inner component uses useSearchParams — must be wrapped in Suspense
function PostHogTracking() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isSignedIn, userId } = useAuth();
  const { user } = useUser();

  // Initialize PostHog once
  useEffect(() => {
    if (POSTHOG_KEY) {
      initPostHog(POSTHOG_KEY);
    }
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (!POSTHOG_KEY) return;
    const url = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;
    posthog.capture('$pageview', { $current_url: url });
  }, [pathname, searchParams]);

  // Identify/reset user on auth state change
  useEffect(() => {
    if (!POSTHOG_KEY) return;
    if (isSignedIn && userId) {
      identifyUser(userId, {
        email: user?.primaryEmailAddress?.emailAddress,
        name: user?.fullName,
        created_at: user?.createdAt,
      });
    } else {
      resetUser();
    }
  }, [isSignedIn, userId, user]);

  return null;
}

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <PostHogTracking />
      </Suspense>
      {children}
    </>
  );
}
