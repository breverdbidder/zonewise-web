// app/parcel/[id]/view-pixel.tsx
// SUMMIT 77c39794 — client-side view increment (CSP-compliant, no inline script)

'use client';

import { useEffect } from 'react';

type Props = {
  cardId: string;
  supabaseUrl: string;
  anonKey: string;
};

export default function ViewPixel({ cardId, supabaseUrl, anonKey }: Props) {
  useEffect(() => {
    // Fire-and-forget view increment via Supabase RPC
    // keepalive=true ensures it survives page transitions
    fetch(`${supabaseUrl}/rest/v1/rpc/increment_parcel_card_view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ p_card_id: cardId }),
      keepalive: true,
    }).catch(() => {
      // Silently drop — metrics tracking must not break the page
    });
  }, [cardId, supabaseUrl, anonKey]);

  return null;
}
