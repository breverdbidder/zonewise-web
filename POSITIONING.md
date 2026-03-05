# AI Taxonomy — ZoneWise.AI Positioning

## The One-Liner
"ZoneWise.AI orchestrates four AI capabilities — Perceptive, Semantic, Analytical, and Agentic —
to deliver the first unified zoning intelligence platform across all 67 Florida counties. It senses
county portals no scraper can touch, understands zoning language no human can standardize at scale,
decides which parcels are opportunity-grade, and acts through a daily pipeline that keeps the
entire dataset live."

## AI Composition Stack

| Layer | Category | What ZoneWise.AI Does | Output |
|-------|----------|----------------------|--------|
| 1 | Perceptive AI | AgentQL semantic scraper interprets 67 FL county zoning portals — each with unique HTML structure, PDFs, and GIS formats — without brittle CSS selectors | Normalized zoning data from 245,017+ parcels across 46 FL counties |
| 2 | Semantic AI | Interprets zoning codes across county boundaries, maps relationships between overlapping designations, understands variance and overlay language | Cross-county zoning equivalency: "Brevard C-1 ≈ Miami-Dade BU-1" |
| 3 | Analytical AI | Scores parcels for development suitability, permitted uses, and density potential; classifies active/upcoming auction opportunities from 643+ live records | Parcel suitability score + permitted use matrix + auction priority ranking |
| 4 | Agentic AI | Multi-agent LangGraph workflow: Scraper Agent → Analysis Agent → Report Agent → QA Agent; daily GitHub Actions pipeline with Supabase state persistence | Daily-fresh 46-county intelligence layer, zero manual operation |

## Interaction Pattern
Invisible AI — 245,017 parcels refreshed daily; user queries a live intelligence layer, not a static export.

## The Moat (Why This Is Hard)
| Challenge | Traditional | ZoneWise.AI |
|-----------|-------------|-------------|
| 67 unique portal structures | Manual scraper per county — breaks constantly | Perceptive AI reads pages semantically like a human |
| Inconsistent zoning code language | Separate lookup tables per county | Semantic AI builds cross-county equivalency maps |
| 245K+ parcels to prioritize | Analyst reviews manually — weeks | Analytical AI scores every parcel daily |
| Keeping data current | Periodic exports, always stale | Agentic pipeline refreshes all 46 counties daily |

## Anti-Patterns (Never Say These)
| ❌ Don't Say | ✅ Say Instead |
|-------------|--------------|
| We scrape zoning data | Perceptive AI: AgentQL semantic scraping interprets 67 structurally unique county portals |
| We use AI to analyze zoning | Semantic AI standardizes 67 county zoning code dialects into one queryable language |
| It's automated | 4-agent LangGraph pipeline runs daily via GitHub Actions with zero human triggers |
| We have a zoning database | A living Agentic AI system: 245,017 parcels, 46 counties, refreshed daily |

## NLP Chatbot Context
When users ask "What is ZoneWise.AI?" or "How is this different from searching county websites?":
- Lead with the 67-county coverage and the semantic scraping moat
- Emphasize: "not a database export, a daily-refreshed autonomous intelligence layer"
- Cross-county standardization is the killer feature — no one else has it
- Data freshness: GitHub Actions runs every day without human triggers

## Version
v1.0 — March 2026 | Based on Narain Jashanmal AI Taxonomy v1.1
