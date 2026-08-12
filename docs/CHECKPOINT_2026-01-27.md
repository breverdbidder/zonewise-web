# ZoneWise.AI Vercel Deployment Checkpoint

**Created:** January 27, 2026 5:00 PM EST  
**Source Chat:** https://claude.ai/chat/df050750-4ee1-4765-9413-498f98c583cf  
**Project:** Craft Agents White-Label UI for ZoneWise.AI

---

## 🎯 Current Status: PAUSED AT VERCEL DEPLOYMENT

### What's Complete
- [x] Craft Agents OSS forked to `breverdbidder/zonewise-desktop`
- [x] ZoneWise web app created at `breverdbidder/zonewise-web` (29 files)
- [x] GitHub Secrets configured (Supabase, Mapbox, Anthropic, Cloudflare)
- [x] Cloudflare Pages attempted but abandoned (API routes incompatible)
- [x] Vercel deployment link created with pre-configured env vars
- [x] Stripe API key guide created

### What's Pending
- [ ] Click Vercel deploy link
- [ ] Add Stripe keys to Vercel env vars
- [ ] Point zonewise.ai domain to Vercel
- [ ] Test full UI functionality

---

## 📦 Repository Inventory

| Repository | URL | Purpose |
|------------|-----|---------|
| zonewise-web | https://github.com/breverdbidder/zonewise-web | Next.js production app |
| zonewise-desktop | https://github.com/breverdbidder/zonewise-desktop | Craft Agents white-label |
| zonewise-skills | https://github.com/breverdbidder/zonewise-skills | Multi-platform MCP skills |

---

## 🚀 ONE-CLICK VERCEL DEPLOY

```
https://vercel.com/new/clone?repository-url=https://github.com/breverdbidder/zonewise-web&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,NEXT_PUBLIC_MAPBOX_TOKEN,NEXT_PUBLIC_APP_URL,ANTHROPIC_API_KEY&project-name=zonewise-web
```

---

## 🔐 Environment Variables (Pre-Configured)

### Ready to Paste
```env
NEXT_PUBLIC_SUPABASE_URL=https://mocerqjnksmhcjzxrewo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vY2VycWpua3NtaGNqenhyZXdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzI1MjYsImV4cCI6MjA4MDEwODUyNn0.ySFJIOngWWB0aqYra4PoGFuqcbdHOx1ZV6T9-klKQDw
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoiZXZlcmVzdDE4IiwiYSI6ImNtanB5cDQ5ZzF1eWgzaHB2cGVhZXdqbjMifQ.4RPrkTf84GL1-clmhmCnTw
NEXT_PUBLIC_APP_URL=https://zonewise.ai
```

### Needs Manual Addition (After Deploy)
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 💳 Stripe API Key Guide

### Where to Get Keys
1. **Dashboard:** https://dashboard.stripe.com/apikeys
2. **Webhooks:** https://dashboard.stripe.com/webhooks

### Keys Needed
| Key Type | Format | Location in Stripe |
|----------|--------|-------------------|
| Publishable Key | `pk_live_...` | Developers → API Keys |
| Secret Key | `sk_live_...` | Developers → API Keys |
| Webhook Secret | `whsec_...` | Developers → Webhooks → Create endpoint |

### Webhook Endpoint Configuration
- **URL:** `https://[your-vercel-url]/api/webhooks/stripe`
- **Events:** `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

---

## 🏗️ Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React 18, Tailwind CSS, Shadcn/UI |
| Backend | Supabase (PostgreSQL, Auth) |
| Payments | Stripe (Subscriptions) |
| AI | Claude API (Anthropic) |
| Maps | Mapbox GL JS |
| Hosting | Vercel (recommended) or Cloudflare Pages |

---

## 📊 Data Moat (Deployed to Supabase)

| Asset | Count |
|-------|-------|
| Zoning Districts | 301 |
| GIS Polygons | 10,092 |
| Jurisdictions | 17 |
| Unique Zone Codes | 56 |

---

## 🔄 Resume Instructions

1. **Open Vercel Deploy Link** (above)
2. **Authorize GitHub** if prompted
3. **Paste Environment Variables** when prompted
4. **Click Deploy**
5. **Wait ~2 minutes** for build
6. **Test at** `https://zonewise-web.vercel.app`
7. **Add Stripe Keys** in Vercel → Settings → Environment Variables
8. **Redeploy** after adding Stripe
9. **Point Domain** zonewise.ai to Vercel

---

## 🎯 Decision Made: Vercel Over Cloudflare Pages

**Why we switched:**
- Cloudflare Pages requires `@cloudflare/next-on-pages` adapter for API routes
- Vercel created Next.js - native support, zero config
- One-click deploy vs. complex adapter setup
- Free tier sufficient for launch

---

## 📋 Files in zonewise-web Repo

```
zonewise-web/
├── app/
│   ├── (auth)/          # Login, signup pages
│   ├── (dashboard)/     # Protected chat + map
│   ├── (marketing)/     # Landing page, pricing
│   ├── api/             # API routes (chat, stripe webhooks)
│   ├── terms/           # Terms of Service
│   ├── privacy/         # Privacy Policy
│   └── disclaimer/      # Zoning Disclaimer
├── components/
│   ├── chat/            # Chat interface
│   ├── map/             # Mapbox integration
│   └── ui/              # Shadcn components
├── lib/
│   ├── supabase/        # Auth client
│   ├── stripe/          # Payment helpers
│   └── ai/              # Claude integration
└── public/
    └── manifest.json    # PWA manifest
```

---

**Checkpoint Created:** Ready to resume with zero context loss.

*© 2026 ZoneWise.AI 2026 - ZoneWise.AI*
