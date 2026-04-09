# SUMMIT #411 -- Vulnerability Matrix
Generated: 2026-04-09

## zonewise-web

### Summary
- Total: 1 vulnerable package (5 advisories)
- Critical: 0
- High: 0
- Moderate: 4 advisories
- Low: 1 advisory
- Dependencies scanned: 955

### Critical/High Details
| Package | Severity | Via | Fix Available |
|---------|----------|-----|---------------|
| (none)  | --       | --  | --            |

No critical or high vulnerabilities found.

### Moderate/Low Details
| Package | Severity | Advisory | Title | Fix Available |
|---------|----------|----------|-------|---------------|
| next@16.1.6 | moderate | GHSA-ggv3-7p47-pfv8 | HTTP request smuggling in rewrites | Yes (16.2.3) |
| next@16.1.6 | moderate | GHSA-3x4c-7xq6-9pq8 | Unbounded next/image disk cache growth can exhaust storage | Yes (16.2.3) |
| next@16.1.6 | moderate | GHSA-h27x-g6w4-24gq | Unbounded postponed resume buffering can lead to DoS | Yes (16.2.3) |
| next@16.1.6 | moderate | GHSA-mq59-m269-xvcx | null origin can bypass Server Actions CSRF checks | Yes (16.2.3) |
| next@16.1.6 | low | GHSA-jcc7-9wpm-mj36 | null origin can bypass dev HMR websocket CSRF checks | Yes (16.2.3) |

### Auto-fixable
- 1 package (next) can be patched by upgrading to 16.2.3
- Requires `npm audit fix --force` (outside stated dependency range: 16.1.6 -> 16.2.3)
- This is a minor version bump (non-breaking per semver)

### Recommended Action
```bash
# Upgrade next from 16.1.6 to 16.2.3 (resolves all 5 advisories)
npm install next@16.2.3
```

## Other Repos
(Will be populated by separate audits)
