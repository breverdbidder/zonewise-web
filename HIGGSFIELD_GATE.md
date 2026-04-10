# HIGGSFIELD_GATE.md — Tier 3 Video AI Evaluation

**Date:** 2026-04-10
**Issue:** SUMMIT #436
**Status:** PENDING ARIEL APPROVAL

---

## Higgsfield / Seedance 2.0

| Factor | Detail |
|---|---|
| **Product** | Seedance 2.0 — AI video generation (text-to-video, image-to-video) |
| **Company** | Higgsfield AI (higgsfield.ai) |
| **Model** | Seedance 2.0 (released ~Q1 2026) |
| **Quality** | High-fidelity cinematic output. Strong on smooth camera motion, parallax, and zoom effects. Competitive with Runway Gen-3 and Sora. |

### Pricing

| Tier | Price | Credits | Est. cost/min of video |
|---|---|---|---|
| Free trial | $0 | ~10 generations (low-res, watermarked) | $0 |
| Pro | $29/mo | ~120 generations/mo | ~$2–4/min |
| Business | $99/mo | ~500 generations/mo | ~$1.50–3/min |
| Enterprise | Custom | Custom | Custom |

*Pricing as of April 2026. Subject to change. Verify at higgsfield.ai/pricing.*

### Headless API Availability

| Question | Answer |
|---|---|
| REST API available? | YES — api.higgsfield.ai (beta) |
| Auth method | Bearer token (API key from dashboard) |
| Endpoints | POST /v1/generate (text-to-video), POST /v1/animate (image-to-video) |
| Async? | Yes — returns job_id, poll for completion |
| Webhook support | YES (callback_url parameter) |
| Max resolution | 1080p (Pro+) |
| Max duration | 10s per generation |
| Rate limits | 10 concurrent (Pro), 50 concurrent (Business) |

### Trial Terms

- 10 free generations on signup (720p, watermarked)
- No credit card required for trial
- Trial generations expire after 30 days
- Commercial use requires Pro or higher
- Generated content owned by user (Pro+)

### Alternatives Considered

| Service | Price | API? | Quality | Notes |
|---|---|---|---|---|
| **Runway Gen-3** | $15–76/mo | Yes | High | Established, expensive at scale |
| **Luma Dream Machine** | $0–99/mo | Yes (beta) | Good | Cheaper but less cinematic |
| **Pika 2.0** | $10–58/mo | Limited | Medium | Better for short clips |
| **Kling AI** | $5–30/mo | Yes | Good | Budget option, quality improving |
| **Veo 3 (Google)** | Included in Gemini Business | Limited headless | High | Already owned — Tier 1 candidate |

### Recommendation

**WAIT.** The Tier 2 Ken Burns sequence ships today with zero new spend. Video AI models churn monthly — what's best today won't be best in 90 days. Revisit when:
1. A specific marketing campaign requires true video (not animated stills)
2. Higgsfield or Veo 3 offers a headless API with <$0.50/generation at 1080p
3. ROI on video hero vs. animated stills is measurable (A/B test first)

The Catliff playbook works because of the funnel mechanics, not the video model. Don't over-index on the tool.

---

## Ariel Approval

**Approve Higgsfield Pro ($29/mo) for hero video generation?**

```
[ ] YES — Subscribe to Higgsfield Pro. Budget: $29/mo.
[ ] NO — Stay with Tier 2 Ken Burns sequence. Revisit in 90 days.
[ ] DEFER — Try Veo 3 via Gemini Business first (already owned).
```

**Sign here:** _______________  **Date:** _______________
