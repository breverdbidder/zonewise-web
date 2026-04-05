---
name: seo-content-optimizer
description: "Analyzes existing content for search optimization gaps, rewrites for higher rankings, and generates structured data for AI citation."
---

## Goal

Analyze existing content for search optimization opportunities and produce
improved versions that rank higher in both traditional search engines and AI
citation systems. The workflow prioritizes information gain (unique insights
that competitors lack) over keyword stuffing, aligns with how AI models evaluate
content for citation, and generates valid structured data markup.

## When to Use

- Existing blog posts or landing pages are underperforming in search despite
  targeting relevant keywords.
- You want to optimize content for AI-powered search (Perplexity, ChatGPT
  search, Google AI Overviews) in addition to traditional rankings.
- Your content team needs data-driven optimization recommendations rather than
  guesswork.
- You need to generate schema markup for existing content to improve rich
  snippet appearance.

## Setup

### Models

- Verified with `anthropic/claude-sonnet-4-20250514` (cloud API — requires
  `ANTHROPIC_API_KEY`) for content analysis, gap identification, optimization
  rewrites, and schema markup generation. Sonnet's long context handles
  articles up to 10,000 words.

### Services

- **Google Search Console API** (optional but recommended): provides actual
  keyword performance data, impressions, clicks, and average position. Without
  it, provide target keywords manually.

### Parameters

- `target_keyword_count`: `5` — number of primary keywords per piece. More
  keywords dilute focus.
- `min_word_count`: `1500` — minimum target for comprehensive content.
- `readability_target`: `grade-8` — accessible but authoritative. Adjust up
  for technical audiences.
- `information_gain_weight`: `0.8` — heavily weight unique insights. Lower for
  commodity content.

### Environment

- Node.js 20+ runtime.
- `ANTHROPIC_API_KEY` environment variable.
- Optional: Google Search Console API credentials.

## Steps

1. Accept the content to optimize as Markdown, HTML, or plain text. Parse to a
   clean text representation for analysis.

2. If Search Console API is configured, pull keyword performance data for the
   content URL:
   - Current ranking keywords with position and CTR
   - Impression-weighted keywords the page appears for but does not rank well
   - Competing pages ranking for the same keywords

3. If brand voice examples are provided, analyze them to extract:
   - Tone (formal, conversational, technical)
   - Sentence structure patterns
   - Common phrasing and terminology
   - First/second/third person usage

4. Perform the SEO audit:
   - **Keyword analysis**: coverage of target keywords in title, headings,
     body, meta description, and URL
   - **Content structure**: heading hierarchy (H1-H4), paragraph length,
     use of lists and tables
   - **Readability**: Flesch-Kincaid grade level, sentence length distribution
   - **Information gain**: unique data points, expert quotes, original
     research, or perspectives not found in top 10 competing articles
   - **Internal linking**: opportunities to link to other relevant content
   - **AI citation readiness**: clear entity definitions, extractable facts,
     attribution-safe statements

5. Generate the optimized content:
   - Rewrite title and meta description for click-through optimization
   - Restructure headings for better keyword coverage and scannability
   - Add information-gain sections with unique angles the competition misses
   - Improve readability to match the target grade level
   - Maintain brand voice consistency using calibration from step 3
   - Add FAQ sections derived from "People Also Ask" patterns
   - Ensure key claims are stated as extractable, citable facts for AI systems

6. Generate schema markup:
   - Article schema with author, datePublished, and description
   - FAQ schema from the FAQ section
   - HowTo schema if the content is procedural
   - Validate JSON-LD against schema.org vocabulary

7. Produce the final audit report with:
   - Before/after comparison of keyword coverage
   - Readability score improvement
   - Information gain additions
   - Schema markup to add
   - Suggested internal links

## Failures Overcome

- Keyword-dense rewrites ranked initially but dropped within weeks. Fixed by
  prioritizing information gain — unique insights and data that competitors do
  not cover.
- Generated JSON-LD schema was invalid and caused Search Console errors. Fixed
  with a validation step against schema.org vocabulary.
- Optimized content did not match brand voice. Fixed with a calibration step
  using sample on-brand content as style references.

## Validation

- Run the audit on a known underperforming page and verify the report
  identifies the correct gaps.
- Verify generated JSON-LD passes Google's Rich Results Test.
- Compare the optimized content against brand voice examples to confirm style
  consistency.
- Check that information gain sections contain unique angles not found in the
  top 3 competing articles.

## Constraints

- Google Search Console data has a 2-3 day delay — real-time keyword positions
  are not available.
- Content optimization is guidance, not a guarantee of ranking improvement.
  Search algorithms consider hundreds of factors beyond content quality.
- Very short content (under 500 words) may not benefit significantly from
  this workflow.

## Safety Notes

- Do not fabricate data, statistics, or expert quotes in optimized content.
  Information gain must come from real insights, not hallucinated facts.
- Schema markup must accurately represent the page content — misuse of FAQ or
  HowTo schema for unrelated content violates Google's guidelines and can
  result in manual actions.
- Competitor keyword data from Search Console should be treated as confidential
  business intelligence.
- Review all optimized content for accuracy before publishing — AI-generated
  rewrites may introduce subtle factual errors.
