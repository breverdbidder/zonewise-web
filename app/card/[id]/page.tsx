// app/parcel/[id]/page.tsx
// SUMMIT 77c39794 — Public parcel card renderer (ZoneWise + BidDeed)
// SSR for SEO, CSP-compliant via nonce from middleware
// Brand: Navy #1E3A5F, Orange #F59E0B, Inter, bg #020617

import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import ViewPixel from './view-pixel';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const revalidate = 300;

type Card = {
  id: string;
  app: 'zonewise' | 'biddeed';
  question: string;
  ai_answer_jsonb: {
    summary: string;
    confidence?: 'VERIFIED' | 'UNTESTED' | 'INFERRED';
    [k: string]: unknown;
  };
  citations: Array<{ source: string; section?: string; url?: string }>;
  referral_code: string | null;
  view_count: number;
  shared_count: number;
  created_at: string;
  og_image_url: string | null;
  county: string;
  pin: string;
  site_addr: string | null;
  site_city: string | null;
};

async function getCard(id: string): Promise<Card | null> {
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON, { auth: { persistSession: false } });
  const { data, error } = await sb
    .from('parcel_cards_public')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  return data as Card;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const card = await getCard(id);
  if (!card) return { title: 'Parcel Card · ZoneWise.AI' };
  const addr = card.site_addr ? `${card.site_addr}, ${card.site_city ?? ''}`.trim() : card.pin;
  const title = `${addr} · ${card.app === 'zonewise' ? 'Zoning' : 'Auction'} Analysis · ZoneWise.AI`;
  const description = card.ai_answer_jsonb.summary.slice(0, 155);
  return {
    title,
    description,
    openGraph: {
      title, description, type: 'article',
      images: card.og_image_url ? [{ url: card.og_image_url }] : [],
    },
    twitter: { card: 'summary_large_image', title, description },
    alternates: { canonical: `https://zonewise.ai/card/${card.id}` },
  };
}

export default async function ParcelCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const card = await getCard(id);
  if (!card) notFound();

  // Read per-request nonce set by middleware.ts for CSP strict-dynamic compliance
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  const signupHref = card.referral_code
    ? `https://chat.zonewise.ai/signup?ref=${card.referral_code}&from=${card.id}`
    : 'https://chat.zonewise.ai/signup';

  const confidence = card.ai_answer_jsonb.confidence ?? 'INFERRED';
  const confColor = confidence === 'VERIFIED' ? '#10B981' : confidence === 'UNTESTED' ? '#F59E0B' : '#64748B';
  const addrLine = card.site_addr
    ? `${card.site_addr}${card.site_city ? ', ' + card.site_city : ''}`
    : `PIN ${card.pin}`;

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Place',
    address: { '@type': 'PostalAddress', streetAddress: card.site_addr, addressLocality: card.site_city, addressRegion: 'FL' },
    identifier: card.pin,
    description: card.ai_answer_jsonb.summary,
  });

  return (
    <>
      {/* CSP-compliant ld+json via nonce from middleware */}
      <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <ViewPixel cardId={card.id} supabaseUrl={SUPABASE_URL} anonKey={SUPABASE_ANON} />

      <main style={{ background: '#020617', color: '#F1F5F9', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '48px 24px 80px' }}>
          <header style={{ borderBottom: '1px solid rgba(30,58,95,0.4)', paddingBottom: 20, marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <Logo app={card.app} />
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#F59E0B' }}>
                {card.app === 'zonewise' ? 'Zoning Intelligence' : 'Auction Intelligence'}
              </span>
            </div>
            <h1 style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.15, margin: 0, color: '#F8FAFC' }}>{addrLine}</h1>
            <div style={{ fontSize: 14, color: '#94A3B8', marginTop: 8 }}>
              {card.county} County, FL · PIN {card.pin}
            </div>
          </header>

          <section style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              Question
            </div>
            <p style={{ fontSize: 19, lineHeight: 1.5, color: '#CBD5E1', margin: '0 0 28px' }}>{card.question}</p>

            <div style={{
              background: 'linear-gradient(180deg, rgba(30,58,95,0.25) 0%, rgba(30,58,95,0.08) 100%)',
              border: '1px solid rgba(30,58,95,0.5)', borderRadius: 12, padding: '24px 28px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  AI Analysis
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: confColor, color: '#020617' }}>
                  {confidence}
                </span>
              </div>
              <p style={{ fontSize: 17, lineHeight: 1.65, color: '#F1F5F9', margin: 0 }}>
                {card.ai_answer_jsonb.summary}
              </p>
            </div>
          </section>

          {card.citations.length > 0 && (
            <section style={{ marginBottom: 40 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                Sources
              </div>
              <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {card.citations.map((c, i) => (
                  <li key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderTop: i === 0 ? 'none' : '1px solid rgba(30,58,95,0.3)' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', minWidth: 20 }}>[{i + 1}]</span>
                    <div style={{ flex: 1, fontSize: 14, color: '#CBD5E1' }}>
                      <strong style={{ color: '#F1F5F9' }}>{c.source}</strong>
                      {c.section && <span style={{ color: '#94A3B8' }}> — {c.section}</span>}
                      {c.url && (
                        <a href={c.url} target="_blank" rel="noopener nofollow" style={{ color: '#F59E0B', textDecoration: 'none', marginLeft: 8, fontSize: 13 }}>
                          view →
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section style={{
            background: '#1E3A5F', borderRadius: 12, padding: '32px 28px', textAlign: 'center', marginBottom: 32,
          }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px', color: '#F8FAFC' }}>
              Ask your own question about any FL parcel
            </h2>
            <p style={{ fontSize: 14, color: '#CBD5E1', margin: '0 0 20px' }}>
              67 counties. Zoning, setbacks, liens, tax-deed status, buy-box scoring.
            </p>
            <a href={signupHref}
               style={{
                 display: 'inline-block', background: '#F59E0B', color: '#020617',
                 fontWeight: 700, fontSize: 15, padding: '12px 28px', borderRadius: 8,
                 textDecoration: 'none', letterSpacing: '0.02em',
               }}>
              Start free — first 2 queries on us
            </a>
          </section>

          <footer style={{ fontSize: 12, color: '#475569', display: 'flex', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid rgba(30,58,95,0.3)' }}>
            <span>Viewed {card.view_count.toLocaleString()} times · Shared {card.shared_count}</span>
            <span>Generated {new Date(card.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </footer>
        </div>
      </main>
    </>
  );
}

function Logo({ app }: { app: 'zonewise' | 'biddeed' }) {
  const label = app === 'zonewise' ? 'ZoneWise.AI' : 'BidDeed.AI';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 24, height: 24, background: '#F59E0B', borderRadius: 6, position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 4, background: '#1E3A5F', borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 15, fontWeight: 700, color: '#F8FAFC', letterSpacing: '-0.01em' }}>{label}</span>
    </div>
  );
}
