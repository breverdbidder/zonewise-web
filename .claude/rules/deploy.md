---
pattern: ".github/workflows/**"
---
# ZoneWise Deploy Rules

- 5 workflows ONLY: ci, deploy-prod, promote-now, security-checks, webhook_notify
- deploy-prod auto-fires on push to main. No manual trigger needed
- NEVER create new workflows without deleting equivalent stale ones
- Vercel project zonewise-web serves zonewise.ai + www
- CF zone: b32406b78aaaefd55557d77c843a5940
- DNS changes: Cloudflare API only, never manual dashboard edits
- Rollback: Vercel instant rollback via CLI, not by reverting commits
