import { describe, it, expect } from 'vitest'
import * as fs from 'fs'

describe('Dependency Security', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'))

  it('pins security-critical dependencies (no ^ or ~)', () => {
    const criticalDeps = ['next', '@supabase/ssr', '@supabase/supabase-js', 'stripe', '@anthropic-ai/sdk']
    for (const dep of criticalDeps) {
      const version = pkg.dependencies[dep]
      if (version) {
        expect(version, `${dep} should be pinned`).not.toMatch(/^[\^~]/)
      }
    }
  })

  it('has dependabot.yml configured', () => {
    expect(fs.existsSync('.github/dependabot.yml')).toBe(true)
  })

  it('dependabot targets npm ecosystem', () => {
    const dependabot = fs.readFileSync('.github/dependabot.yml', 'utf-8')
    expect(dependabot).toMatch(/package-ecosystem.*npm/s)
  })

  it('dependabot runs at least weekly', () => {
    const dependabot = fs.readFileSync('.github/dependabot.yml', 'utf-8')
    expect(dependabot).toMatch(/interval.*(?:daily|weekly)/s)
  })

  it('package is marked private (no accidental publish)', () => {
    expect(pkg.private).toBe(true)
  })
})
