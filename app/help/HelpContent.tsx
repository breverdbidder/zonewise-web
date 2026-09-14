'use client';

// app/help/HelpContent.tsx
// P2B-1: SupportWise — FAQ accordion client component

import { useState, useMemo } from 'react';

interface FAQItem {
  category: string;
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    category: 'Getting Started',
    question: 'What is ZoneWise.AI?',
    answer:
      'ZoneWise.AI is an AI-powered zoning intelligence platform for Florida real estate. It provides interactive maps, parcel-level zoning data, and natural language search across 67 Florida counties.',
  },
  {
    category: 'Getting Started',
    question: 'How do I use the explorer?',
    answer:
      'Navigate to the Explorer page and click any Florida county on the map. You can zoom in to see individual parcels, click parcels for zoning details, or use the chat input to ask questions in natural language.',
  },
  {
    category: 'Data',
    question: 'What data sources do you use?',
    answer:
      'We aggregate data from Florida GIO (10.5M parcels), county GIS systems, property appraiser records, and public zoning ordinances. Data is refreshed regularly to maintain accuracy.',
  },
  {
    category: 'Data',
    question: 'Which counties are currently covered?',
    answer:
      'ZoneWise.AI covers all 67 Florida counties. Coverage depth varies — Brevard County has the deepest verification at 93.3% of parcels. We are continuously expanding and deepening coverage across all counties.',
  },
  {
    category: 'Pricing',
    question: "What's the difference between Free and Pro?",
    answer:
      'Free users get limited explorer access with a capped number of queries per day. Pro users ($39/month) get unlimited queries, full 67-county access, API access, data export, and priority support.',
  },
  {
    category: 'Data',
    question: 'How accurate is the zoning data?',
    answer:
      'Our data comes from official county sources and is cross-verified against multiple databases. However, zoning data changes frequently — always verify with the local planning department before making investment decisions.',
  },
  {
    category: 'Features',
    question: 'Can I export data?',
    answer:
      'Pro users can export parcel data, zoning classifications, and analysis results. Export formats include CSV and JSON via the API.',
  },
  {
    category: 'Features',
    question: 'How does the AI chat work?',
    answer:
      'The chat uses Claude AI to understand natural language queries about zoning. Ask questions like "Show me residential zones in Duval County" or "What zoning allows multifamily in Orlando?" and the AI will query our database and display results on the map.',
  },
  {
    category: 'Support',
    question: 'How do I contact support?',
    answer:
      'Use the chat widget in the bottom-right corner for real-time help. For account issues, email support@zonewise.ai. We aim to respond within 24 hours.',
  },
  {
    category: 'Security',
    question: 'Is my data secure?',
    answer:
      'Yes. We use Clerk for authentication, Supabase with row-level security for data storage, and all connections are encrypted via HTTPS. We never share or sell user data.',
  },
];

const categories = Array.from(new Set(faqs.map((f) => f.category)));

export default function HelpContent() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return faqs.filter((f) => {
      const matchesSearch =
        !search ||
        f.question.toLowerCase().includes(search.toLowerCase()) ||
        f.answer.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !activeCategory || f.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  return (
    <div className="min-h-screen bg-[rgb(var(--zw-page))] text-[rgb(var(--zw-ink2))]">
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="mb-2 text-3xl font-bold text-[rgb(var(--zw-brand))]">Help Center</h1>
        <p className="mb-8 text-sm text-[rgb(var(--zw-ink2))]">
          Find answers to common questions about ZoneWise.AI
        </p>

        {/* Search */}
        <input
          type="text"
          placeholder="Search questions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-6 w-full rounded-lg border border-[rgb(var(--zw-border2))] bg-[rgb(var(--zw-page))] px-4 py-3 text-sm text-[rgb(var(--zw-ink2))] placeholder-[rgb(var(--zw-ink2))] outline-none focus:border-[rgb(var(--zw-brand))] focus:ring-1 focus:ring-[rgb(var(--zw-brand))]"
          aria-label="Search FAQ questions"
        />

        {/* Category filters */}
        <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          <button
            onClick={() => setActiveCategory(null)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              !activeCategory
                ? 'bg-[rgb(var(--zw-brand))] text-[rgb(var(--zw-brand-ink))]'
                : 'bg-[rgb(var(--zw-card))] text-[rgb(var(--zw-ink2))] hover:text-[rgb(var(--zw-ink2))]'
            }`}
            aria-pressed={!activeCategory}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                activeCategory === cat
                  ? 'bg-[rgb(var(--zw-brand))] text-[rgb(var(--zw-brand-ink))]'
                  : 'bg-[rgb(var(--zw-card))] text-[rgb(var(--zw-ink2))] hover:text-[rgb(var(--zw-ink2))]'
              }`}
              aria-pressed={activeCategory === cat}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ accordion */}
        <div className="space-y-2">
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-[rgb(var(--zw-ink2))]">
              No matching questions found. Try a different search term.
            </p>
          )}
          {filtered.map((faq) => {
            const globalIndex = faqs.indexOf(faq);
            const isOpen = openIndex === globalIndex;
            return (
              <div
                key={globalIndex}
                className="overflow-hidden rounded-lg border border-[rgb(var(--zw-border2))] bg-[rgb(var(--zw-page)/0.5)]"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : globalIndex)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${globalIndex}`}
                >
                  <div>
                    <span className="mr-2 rounded bg-[rgb(var(--zw-card))] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[rgb(var(--zw-ink2))]">
                      {faq.category}
                    </span>
                    <span className="text-sm font-medium text-[rgb(var(--zw-ink2))]">{faq.question}</span>
                  </div>
                  <span
                    className={`ml-4 text-lg text-[rgb(var(--zw-ink2))] transition-transform ${
                      isOpen ? 'rotate-45' : ''
                    }`}
                    aria-hidden="true"
                  >
                    +
                  </span>
                </button>
                {isOpen && (
                  <div
                    id={`faq-answer-${globalIndex}`}
                    className="border-t border-[rgb(var(--zw-border2))] px-5 py-4 text-sm leading-relaxed text-[rgb(var(--zw-ink2))]"
                  >
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* API Docs Link */}
        <div className="mt-8 rounded-xl border border-[rgb(var(--zw-border2)/0.4)] bg-[rgb(var(--zw-elev)/0.1)] p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[rgb(var(--zw-ink2))]">Building on ZoneWise?</p>
            <p className="text-xs text-[rgb(var(--zw-ink2))] mt-0.5">REST API, authentication, rate limits, and code examples</p>
          </div>
          <a
            href="/docs"
            className="shrink-0 inline-block rounded-lg border border-[rgb(var(--zw-border2))] px-4 py-2 text-xs font-semibold text-[rgb(var(--zw-brand))] hover:bg-[rgb(var(--zw-elev)/0.3)] transition"
          >
            API Docs →
          </a>
        </div>

        {/* Contact CTA */}
        <div className="mt-6 rounded-xl border border-[rgb(var(--zw-border2))] bg-[rgb(var(--zw-page)/0.5)] p-6 text-center">
          <p className="mb-1 text-sm font-medium text-[rgb(var(--zw-ink2))]">Still need help?</p>
          <p className="mb-4 text-xs text-[rgb(var(--zw-ink2))]">
            Our team typically responds within 24 hours
          </p>
          <a
            href="mailto:support@zonewise.ai"
            className="inline-block rounded-lg bg-[rgb(var(--zw-brand))] px-6 py-2.5 text-sm font-semibold text-[rgb(var(--zw-brand-ink))] transition hover:bg-[#005EB8]"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
