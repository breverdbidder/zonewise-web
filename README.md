# 🗺️ ZoneWise.AI

**Brevard County Zoning Intelligence Platform**

> Query zoning regulations, setbacks, building heights, and permitted uses for all 17 Brevard County jurisdictions using AI-powered natural language.

## 🚀 Live

**Production:** https://zonewise.ai

## ✨ Features

- 💬 **AI Chat** - Ask questions in plain English
- 🗺️ **10,092 GIS Polygons** - Real zoning boundaries
- 🏛️ **17 Jurisdictions** - Complete Brevard County coverage
- 📊 **301 Districts** - Dimensional standards for all zones
- 🔐 **Auth** - Email, Google, GitHub login
- 💳 **Payments** - Stripe subscriptions
- 📱 **PWA** - Install on mobile home screen

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React 18, Tailwind CSS |
| Backend | Supabase (PostgreSQL, Auth) |
| Payments | Stripe |
| AI | Claude API (Anthropic) |
| Maps | Mapbox GL JS |
| Hosting | Cloudflare Pages |

## 📦 Data Moat

| Asset | Count |
|-------|-------|
| Zoning Districts | 301 |
| GIS Polygons | 10,092 |
| Jurisdictions | 17 |
| Unique Zone Codes | 56 |

## 🔧 Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Claude API
ANTHROPIC_API_KEY=

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=

# App
NEXT_PUBLIC_APP_URL=https://zonewise.ai
```

## 🚀 Development

```bash
# Install
bun install

# Dev
bun dev

# Build
bun run build
```

## 📁 Project Structure

```
zonewise-web/
├── app/
│   ├── (marketing)/     # Landing page
│   ├── (auth)/          # Login, signup
│   ├── (dashboard)/     # Protected dashboard + chat
│   ├── api/             # API routes (chat, stripe)
│   ├── terms/           # Terms of Service
│   ├── privacy/         # Privacy Policy
│   └── disclaimer/      # Zoning Disclaimer
├── components/
├── lib/
│   ├── supabase/        # Auth client
│   ├── stripe/          # Payment integration
│   └── ai/              # Claude integration
└── public/
    └── manifest.json    # PWA manifest
```

## 💰 Pricing

| Tier | Price | Queries/mo |
|------|-------|------------|
| Free | $0 | 25 |
| Pro | $29 | 500 |
| Team | $99 | 2,000 |
| Enterprise | Custom | Unlimited |

## ⚠️ Disclaimer

Information provided by ZoneWise.AI is for general guidance only. Always verify with the appropriate local Planning Department.

## 📄 License

© 2026 Everest Capital USA. All rights reserved.

---

**Data is the moat. ZoneWise is the truth.** 🏰

<!-- Build trigger: 2026-01-27T22:47:13Z -->

