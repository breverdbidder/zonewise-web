'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

/* ─── TIMING CONSTANTS ─────────────────────────────────────────────── */
const T = {
  TD: 90, TP: 600, AG: 2400, AD: 2200, LI: 700, SR: 12800, RR: 13600,
  TL: 7000, CE: 15500, CC: 18000,
  RPT_START: 20000, RPT_K1: 21200, RPT_K2: 22800, RPT_K3: 24400,
  RPT_K4: 26000, RPT_SCORE: 27800, RPT_DONE: 29200, LR: 34000,
}

/* ─── DATA ──────────────────────────────────────────────────────────── */
const AGENTS = [
  { id: 'scraper', label: 'GatherWise',  desc: 'DiscoverWise — live auction listings' },
  { id: 'title',   label: 'TitleWise',   desc: 'TitleWise — chain of title verified' },
  { id: 'lien',    label: 'LienWise',    desc: 'LienWise — lien waterfall analysis' },
  { id: 'ml',      label: 'ScoreWise',   desc: 'ScoreWise — AI bid probability model' },
  { id: 'report',  label: 'InsightWise', desc: 'InsightWise — 298-KPI BidWise report' },
]

const PROPS = [
  { addr: '2847 Harbor Blvd',    city: 'Cocoa Beach 32931',    arv: 387000, maxBid: 213000, judgment: 198500, tag: 'BID',    score: 84, liens: ['1st Mortgage: $198,500', 'HOA: $4,200'],         sqft: 1842, year: 1987 },
  { addr: '519 Merritt Ave',     city: 'Merritt Island 32953', arv: 445000, maxBid: 233500, judgment: 302000, tag: 'REVIEW', score: 71, liens: ['1st Mortgage: $302,000', 'Tax Cert: $8,100'],    sqft: 2190, year: 1994 },
  { addr: '1104 Atlantic Dr',    city: 'Satellite Beach 32937',arv: 512000, maxBid: 287400, judgment: 389000, tag: 'REVIEW', score: 68, liens: ['1st Mortgage: $389,000'],                        sqft: 2644, year: 2001 },
  { addr: '3301 S Banana River', city: 'Cocoa Beach 32931',    arv: 298000, maxBid: 83600,  judgment: 271000, tag: 'SKIP',   score: 31, liens: ['1st Mortgage: $271,000', 'Code Liens: $22,400', 'HOA: $9,800'], sqft: 1520, year: 1973 },
]

const LOGS = [
  '[DiscoverWise] Connecting to auction calendar ...', '[DiscoverWise] Session authenticated',
  '[GatherWise]  Loading Brevard County auctions ...', '[DiscoverWise] 19 properties found for analysis',
  '[GatherWise]  Fetching parcel + BCPAO data ...',   '[TitleWise]   Title chain verification running',
  '[LienWise]    Lien priority waterfall running',    '[ScoreWise]   AI bid probability model loaded',
  '[ScoreWise]   Generating bid scores ...',          '[BidWise]     4 BID · 3 REVIEW · 12 SKIP',
  '[InsightWise] Compiling 298-KPI BidWise report ...', '[BidWise]     Analysis complete. 19/19 processed.',
]

const KPI_SECTIONS = [
  { id: 'fin',  label: 'BidWise Intelligence',      icon: '$', color: '#F59E0B', count: 74, kpis: [
    { l: 'After-Repair Value',     v: '$387,000', s: 'BCPAO + 6-comp CMA',       score: 88 },
    { l: 'Max Bid (Formula)',       v: '$213,000', s: '(ARV×70%)−Repairs−$10K',  score: 95, hi: true },
    { l: 'Estimated Repairs',       v: '$42,000',  s: 'Contractor estimate',      score: 72 },
    { l: 'Judgment Amount',         v: '$198,500', s: 'Wells Fargo NA v. Torres', score: null },
    { l: 'Bid/Judgment Ratio',      v: '107%',     s: 'Above threshold ≥75%',     score: 100, hi: true },
    { l: 'Gross Profit Potential',  v: '$131,500', s: 'ARV − MaxBid − Repairs',   score: 90 },
    { l: 'Projected ROI (Flip)',    v: '61.7%',    s: '12-month hold scenario',   score: 87 },
    { l: 'Monthly MTR Cash Flow',   v: '$2,840',   s: '32937 avg $3,200/mo',      score: 82 },
    { l: 'Cap Rate',                v: '8.8%',     s: 'Annual NOI / ARV',         score: 78 },
    { l: 'Break-Even Occupancy',    v: '64%',      s: 'MTR scenario',             score: 85 },
    { l: 'Equity Capture Day 1',    v: '$131,500', s: 'ARV minus all-in cost',    score: 90 },
    { l: 'Price Per Sqft (ARV)',    v: '$210/sqft',s: 'Zip median: $228',         score: 83 },
  ]},
  { id: 'mkt',  label: 'NeighborWise Intelligence', icon: '◈', color: '#3B82F6', count: 68, kpis: [
    { l: 'Zip Median Sale Price',   v: '$398,000', s: '32931 — L12M median',      score: 82 },
    { l: 'Days on Market (Avg)',    v: '24 days',  s: '32931 — L90D',             score: 88 },
    { l: 'List-to-Sale Ratio',      v: '98.4%',    s: 'Hot seller market',        score: 91 },
    { l: 'Price Appreciation YoY',  v: '+7.2%',    s: 'Brevard County',           score: 85 },
    { l: 'Inventory Level',         v: '1.8 mo',   s: 'Below 3mo = seller\'s mkt',score: 90 },
    { l: 'Foreclosure Rate',        v: '0.31%',    s: 'Below FL avg 0.48%',       score: 76 },
    { l: 'MTR Demand Score',        v: '91/100',   s: '32937 AirDNA data',        score: 91, hi: true },
    { l: 'Rental Vacancy Rate',     v: '4.2%',     s: '32937 zip',                score: 84 },
    { l: 'Population Growth 5yr',   v: '+6.8%',    s: 'Brevard County',           score: 79 },
    { l: 'Median HH Income',        v: '$79,400',  s: '32937 Census ACS',         score: 88 },
    { l: 'Walkability Score',       v: '52/100',   s: 'Car-dependent area',       score: 55 },
    { l: 'Flood Zone',              v: 'Zone X',   s: 'Minimal flood risk',       score: 92 },
  ]},
  { id: 'risk', label: 'TitleWise + LienWise',     icon: '⚠', color: '#EF4444', count: 82, kpis: [
    { l: 'Title Chain Integrity',   v: 'CLEAN',    s: 'No breaks detected',       score: 98, hi: true },
    { l: 'Senior Lien Survived?',   v: 'CHECK',    s: 'HOA foreclosure — verify', score: 60 },
    { l: 'Open Permits',            v: '0',        s: 'BCPAO permit search',      score: 100 },
    { l: 'Code Violations',         v: '0',        s: 'City of Cocoa Beach',      score: 100 },
    { l: 'HOA Lien Priority',       v: 'Junior',   s: 'Behind 1st mortgage',      score: 85 },
    { l: 'Tax Delinquency',         v: 'Current',  s: '2024 taxes paid',          score: 100 },
    { l: 'Lis Pendens (Other)',      v: 'None',     s: 'AcclaimWeb search',        score: 100 },
    { l: 'Bankruptcy Flag',         v: 'None',     s: 'PACER cross-reference',    score: 100 },
    { l: 'Environmental Flag',      v: 'Clear',    s: 'EPA ECHO + state DB',      score: 95 },
    { l: 'Mold/WDO Risk',           v: 'Moderate', s: '1987 build — inspect req', score: 62 },
    { l: 'Wind Insurance Risk',     v: 'Medium',   s: 'Coastal proximity',        score: 65 },
    { l: 'HOA Monthly',             v: '$185/mo',  s: 'Harbour Isle POA',         score: 80 },
  ]},
  { id: 'nbr',  label: 'NeighborWise + TaxWise',  icon: '◉', color: '#22C55E', count: 74, kpis: [
    { l: 'School District Rating',  v: 'B+',       s: 'Brevard County Schools',   score: 82 },
    { l: 'Crime Index',             v: '32/100',   s: 'Lower = safer. FL avg: 48',score: 85 },
    { l: 'Distance to Beach',       v: '0.4 mi',   s: 'Atlantic Ocean access',    score: 97, hi: true },
    { l: 'Distance to I-95',        v: '4.1 mi',   s: 'Major highway access',     score: 78 },
    { l: 'Nearby Employers',        v: '8 major',  s: 'KSC, Harris, Northrop',    score: 91 },
    { l: 'STR Regulation',          v: 'Allowed',  s: 'Cocoa Beach permits STR',  score: 95 },
    { l: 'ARV Neighborhood Trend',  v: '+$18K',    s: 'L12M comp appreciation',   score: 86 },
    { l: 'Investor Activity 90d',   v: 'High',     s: '14 third-party purchases', score: 82 },
    { l: 'HOA Restrictions',        v: 'Moderate', s: 'No STR ban, pets OK',      score: 75 },
    { l: 'Utility Infrastructure',  v: 'City',     s: 'City water + sewer',       score: 92 },
    { l: 'Flood Insurance Est.',    v: '$1,240/yr',s: 'Zone X — standard rate',   score: 78 },
    { l: 'Comparable Sales 90d',    v: '6 comps',  s: 'Within 0.5mi ±200sqft',   score: 88 },
  ]},
]

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

const TAG: Record<string, { bg: string; bd: string; tx: string }> = {
  BID:    { bg: 'rgba(34,197,94,.08)',  bd: 'rgba(34,197,94,.5)',  tx: '#22C55E' },
  REVIEW: { bg: 'rgba(245,158,11,.08)', bd: 'rgba(245,158,11,.5)', tx: '#F59E0B' },
  SKIP:   { bg: 'rgba(239,68,68,.08)',  bd: 'rgba(239,68,68,.5)',  tx: '#EF4444' },
}

const LC: Record<string, string> = {
  DiscoverWise: '#3B82F6', GatherWise: '#F59E0B', TitleWise: '#94A3B8',
  LienWise: '#F59E0B', ScoreWise: '#3B82F6', BidWise: '#22C55E', InsightWise: '#94A3B8',
}

/* ─── CSS KEYFRAMES injected once ──────────────────────────────────── */
const CSS = `
@keyframes pulse-ring   { 0%{transform:scale(1);opacity:.7} 100%{transform:scale(2.4);opacity:0} }
@keyframes blink        { 0%,100%{opacity:1} 50%{opacity:0} }
@keyframes slide-up     { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
@keyframes fade-in      { from{opacity:0} to{opacity:1} }
@keyframes data-in      { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
@keyframes glow         { 0%,100%{box-shadow:0 0 10px rgba(245,158,11,.12)} 50%{box-shadow:0 0 32px rgba(245,158,11,.45)} }
@keyframes spin         { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes border-pulse { 0%,100%{border-color:rgba(245,158,11,.3)} 50%{border-color:rgba(245,158,11,.85)} }
@keyframes scanline     { 0%{top:0%;opacity:.6} 100%{top:110%;opacity:0} }
@keyframes cursor-blink { 0%,100%,49%{opacity:1} 50%,99%{opacity:0} }
`

/* ─── SUB COMPONENTS ────────────────────────────────────────────────── */
function AgentNode({ agent, status }: { agent: typeof AGENTS[0]; status: string }) {
  const c = { idle: '#1E293B', active: '#F59E0B', done: '#22C55E' }[status] ?? '#1E293B'
  const tc = { idle: '#64748B', active: '#F1F5F9', done: '#F1F5F9' }[status] ?? '#64748B'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '11px 15px',
      background: status === 'active' ? 'rgba(245,158,11,.05)' : 'transparent',
      border: `1px solid ${status === 'active' ? 'rgba(245,158,11,.3)' : '#1E293B'}`,
      borderRadius: 9, transition: 'all .35s',
      animation: status === 'active' ? 'glow 2s ease infinite, border-pulse 2s ease infinite' : 'none',
    }}>
      <div style={{ position: 'relative', width: 30, height: 30, flexShrink: 0 }}>
        {status === 'active' && (
          <>
            <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: '50%', border: '2px solid #F59E0B', animation: 'pulse-ring 1.3s ease-out infinite' }} />
            <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: '50%', border: '2px solid #F59E0B', animation: 'pulse-ring 1.3s ease-out infinite', animationDelay: '.4s' }} />
          </>
        )}
        <div style={{
          width: 30, height: 30, borderRadius: '50%', border: `2px solid ${c}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: status === 'done' ? 'rgba(34,197,94,.1)' : status === 'active' ? 'rgba(245,158,11,.08)' : 'transparent',
          fontSize: 12, color: c, transition: 'all .35s',
          animation: status === 'active' ? 'spin 2.5s linear infinite' : 'none',
          fontFamily: 'monospace',
        }}>
          {status === 'done' ? '✓' : status === 'active' ? '◎' : '○'}
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: tc, transition: 'color .3s' }}>{agent.label}</div>
        <div style={{ fontFamily: 'monospace', fontSize: 10, color: status === 'active' ? '#94A3B8' : '#334155', marginTop: 1 }}>
          {status === 'active' ? agent.desc : status === 'done' ? '✓ Complete' : 'Standby'}
        </div>
      </div>
      {status === 'active' && <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#F59E0B', animation: 'blink .9s infinite', letterSpacing: '.08em' }}>LIVE</span>}
      {status === 'done'   && <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#22C55E', letterSpacing: '.08em' }}>DONE</span>}
    </div>
  )
}

type KpiDef = { l: string; v: string; s: string; score: number | null; hi?: boolean }

function KpiRow({ kpi, vis, delay }: { kpi: KpiDef; vis: boolean; delay: number }) {
  const sc = kpi.score === null ? '#64748B' : kpi.score >= 80 ? '#22C55E' : kpi.score >= 60 ? '#F59E0B' : '#EF4444'
  const circ = 2 * Math.PI * 11
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
      background: kpi.hi ? 'rgba(245,158,11,.04)' : 'rgba(255,255,255,.01)',
      border: `1px solid ${kpi.hi ? 'rgba(245,158,11,.18)' : '#1E293B'}`, borderRadius: 6,
      opacity: vis ? 1 : 0, transform: vis ? 'translateX(0)' : 'translateX(-14px)',
      transition: 'opacity .3s,transform .3s', transitionDelay: `${delay}s`,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: kpi.hi ? '#F59E0B' : '#F1F5F9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{kpi.l}</div>
        <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#64748B', marginTop: 1 }}>{kpi.s}</div>
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: kpi.hi ? '#F59E0B' : '#F1F5F9', whiteSpace: 'nowrap', flexShrink: 0 }}>{kpi.v}</div>
      {kpi.score !== null && (
        <div style={{ width: 28, height: 28, flexShrink: 0, position: 'relative' }}>
          <svg width="28" height="28" viewBox="0 0 28 28">
            <circle cx="14" cy="14" r="11" fill="none" stroke="#1E293B" strokeWidth="2.5" />
            <circle cx="14" cy="14" r="11" fill="none" stroke={sc} strokeWidth="2.5"
              strokeDasharray={circ} strokeDashoffset={vis ? circ - (circ * kpi.score / 100) : circ}
              strokeLinecap="round" transform="rotate(-90 14 14)"
              style={{ transition: 'stroke-dashoffset 1s ease', transitionDelay: `${delay + .25}s` }} />
          </svg>
          <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 6, fontWeight: 700, color: sc, fontFamily: 'monospace' }}>{kpi.score}</span>
          </div>
        </div>
      )}
    </div>
  )
}

type KpiSection = typeof KPI_SECTIONS[0]

function KpiSectionComp({ sec, vis, kvis }: { sec: KpiSection; vis: boolean; kvis: boolean }) {
  return (
    <div style={{
      border: `1px solid ${sec.color}22`, borderRadius: 9, overflow: 'hidden', background: 'rgba(255,255,255,.01)',
      opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(18px)',
      transition: 'opacity .5s,transform .5s',
    }}>
      <div style={{
        padding: '10px 14px', borderBottom: `1px solid ${sec.color}22`,
        background: `linear-gradient(135deg,${sec.color}0D 0%,transparent 100%)`,
        display: 'flex', alignItems: 'center', gap: 9,
      }}>
        <div style={{ width: 26, height: 26, borderRadius: 5, background: `${sec.color}18`, border: `1px solid ${sec.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: sec.color }}>{sec.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#F1F5F9' }}>{sec.label}</div>
          <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#64748B', marginTop: 1 }}>{sec.count} KPIs ANALYZED</div>
        </div>
        <div style={{ padding: '2px 8px', borderRadius: 10, background: `${sec.color}18`, border: `1px solid ${sec.color}35` }}>
          <span style={{ fontFamily: 'monospace', fontSize: 8, color: sec.color, fontWeight: 700, letterSpacing: '.06em' }}>COMPLETE</span>
        </div>
      </div>
      <div style={{ padding: 8, display: 'grid', gap: 4 }}>
        {sec.kpis.map((k, i) => <KpiRow key={i} kpi={k} vis={kvis} delay={i * .04} />)}
      </div>
    </div>
  )
}

function OverallScore({ vis }: { vis: boolean }) {
  const c = 2 * Math.PI * 54
  return (
    <div style={{
      padding: 20, border: '1px solid rgba(245,158,11,.3)', borderRadius: 11,
      background: 'linear-gradient(135deg,rgba(245,158,11,.06) 0%,transparent 60%)',
      display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
      opacity: vis ? 1 : 0, transform: vis ? 'scale(1)' : 'scale(.92)',
      transition: 'opacity .6s,transform .6s cubic-bezier(.34,1.56,.64,1)',
      animation: vis ? 'glow 3s ease infinite' : 'none',
    }}>
      <div style={{ position: 'relative', width: 108, height: 108, flexShrink: 0 }}>
        <svg width="108" height="108" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="#1E293B" strokeWidth="7" />
          <circle cx="60" cy="60" r="54" fill="none" stroke="#F59E0B" strokeWidth="7"
            strokeDasharray={c} strokeDashoffset={vis ? c - (c * .84) : c}
            strokeLinecap="round" transform="rotate(-90 60 60)"
            style={{ transition: 'stroke-dashoffset 1.8s cubic-bezier(.4,0,.2,1)', transitionDelay: '.2s', filter: 'drop-shadow(0 0 8px rgba(245,158,11,.6))' }} />
        </svg>
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: '#F59E0B', lineHeight: 1 }}>84</div>
          <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#94A3B8', marginTop: 2 }}>/ 100</div>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#F59E0B', letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 6 }}>◉ OVERALL AUCTION SCORE</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#22C55E', marginBottom: 4 }}>⭐ BIDWISE: STRONG BID</div>
        <div style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.65, marginBottom: 12 }}>
          2847 Harbor Blvd clears all critical KPI thresholds. Clean title chain, junior HOA lien, 107% bid/judgment ratio, strong coastal MTR demand. Max bid $213,000.
        </div>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {[{ l: '298', d: 'KPIs Analyzed' }, { l: '4', d: 'Risk Flags' }, { l: '94%', d: 'Confidence' }, { l: '#1', d: 'Priority Bid' }].map(x => (
            <div key={x.l} style={{ padding: '5px 10px', background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 6, textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#F59E0B' }}>{x.l}</div>
              <div style={{ fontFamily: 'monospace', fontSize: 8, color: '#64748B', marginTop: 1 }}>{x.d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

type Prop = typeof PROPS[0]

function PropCard({ prop, highlightReport, index }: { prop: Prop; highlightReport: boolean; index: number }) {
  const t = TAG[prop.tag]
  const sc = prop.score >= 75 ? '#22C55E' : prop.score >= 60 ? '#F59E0B' : '#EF4444'
  return (
    <div style={{
      background: '#0F172A', border: `1px solid ${highlightReport ? 'rgba(245,158,11,.4)' : '#1E293B'}`,
      borderRadius: 9, padding: 13, animation: 'slide-up .4s ease both', animationDelay: `${index * .1}s`,
      boxShadow: highlightReport ? '0 0 18px rgba(245,158,11,.07)' : 'none', transition: 'all .3s',
    }}>
      {highlightReport && (
        <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#F59E0B', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ animation: 'blink 1s infinite' }}>●</span> GENERATING BIDWISE REPORT
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#F1F5F9' }}>{prop.addr}</div>
          <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#64748B', marginTop: 2 }}>{prop.city} · {prop.sqft.toLocaleString()} sqft · {prop.year}</div>
        </div>
        <div style={{ padding: '3px 10px', borderRadius: 18, fontSize: 10, fontWeight: 700, background: t.bg, border: `1px solid ${t.bd}`, color: t.tx, letterSpacing: '.06em', flexShrink: 0 }}>{prop.tag}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7, marginTop: 11 }}>
        {[{ l: 'ARV', v: fmt(prop.arv), c: '#F1F5F9' }, { l: 'Max Bid', v: fmt(prop.maxBid), c: '#F59E0B' }, { l: 'Judgment', v: fmt(prop.judgment), c: '#94A3B8' }].map(x => (
          <div key={x.l} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 600, color: x.c }}>{x.v}</div>
            <div style={{ fontSize: 9, color: '#64748B', marginTop: 1, textTransform: 'uppercase', letterSpacing: '.05em' }}>{x.l}</div>
          </div>
        ))}
      </div>
      <div style={{ height: 2, background: '#0F172A', borderRadius: 1, overflow: 'hidden', marginTop: 9 }}>
        <div style={{ height: '100%', borderRadius: 1, background: sc, width: `${prop.score}%`, transition: 'width 1.2s ease' }} />
      </div>
    </div>
  )
}

function Terminal({ lines, active }: { lines: string[]; active: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight }, [lines])
  return (
    <div ref={ref} style={{ background: '#020617', border: '1px solid #1E293B', borderRadius: 9, padding: 14, height: 180, overflowY: 'hidden', position: 'relative' }}>
      {active && <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'linear-gradient(transparent,rgba(245,158,11,.15),transparent)', animation: 'scanline 2s linear infinite', pointerEvents: 'none' }} />}
      {lines.map((line, i) => {
        const tag = line.match(/^\[(\w+)\]/)?.[1] ?? ''
        return (
          <div key={i} style={{ fontFamily: 'monospace', fontSize: 11, lineHeight: 1.85, animation: 'data-in .2s ease both', animationDelay: `${i * .03}s` }}>
            <span style={{ color: LC[tag] ?? '#64748B' }}>{line.slice(0, line.indexOf(']') + 1)}</span>
            <span style={{ color: '#94A3B8' }}>{line.slice(line.indexOf(']') + 1)}</span>
          </div>
        )
      })}
      {active && lines.length < 12 && <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#F59E0B', animation: 'cursor-blink 1s infinite' }}>█</span>}
    </div>
  )
}

function ReportView({ sections, scoreVis, done }: { sections: number; scoreVis: boolean; done: boolean }) {
  const prop = PROPS[0]
  const t = TAG[prop.tag]
  return (
    <div style={{ animation: 'fade-in .4s ease' }}>
      <div style={{
        padding: '14px 18px', background: 'linear-gradient(135deg,rgba(245,158,11,.08) 0%,transparent 100%)',
        border: '1px solid rgba(245,158,11,.25)', borderRadius: 10, marginBottom: 14,
        display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#F59E0B', letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 5 }}>◉ BidWise 298-KPI INTELLIGENCE REPORT</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#F1F5F9' }}>{prop.addr}</div>
          <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#94A3B8', marginTop: 2 }}>Cocoa Beach, FL 32931 · Parcel 24-37-14-00-00058.0-0000</div>
          <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#64748B', marginTop: 1 }}>1,842 sqft · Built 1987 · Single Family · Brevard County</div>
        </div>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ padding: '5px 12px', borderRadius: 18, background: t.bg, border: `1px solid ${t.bd}`, color: t.tx, fontSize: 11, fontWeight: 800, letterSpacing: '.08em' }}>{prop.tag}</div>
          <div style={{ padding: '5px 12px', borderRadius: 18, background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.3)' }}>
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#F59E0B', fontWeight: 700 }}>MAX BID: $213,000</span>
          </div>
          <div style={{ padding: '5px 12px', borderRadius: 18, background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.3)' }}>
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#22C55E', fontWeight: 700 }}>BID/JDG: 107%</span>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}><OverallScore vis={scoreVis} /></div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        {KPI_SECTIONS.map((sec, i) => (
          <KpiSectionComp key={sec.id} sec={sec} vis={sections > i} kvis={sections > i} />
        ))}
      </div>

      {done && (
        <div style={{
          padding: '14px 18px', background: 'rgba(34,197,94,.05)', border: '1px solid rgba(34,197,94,.3)',
          borderRadius: 10, animation: 'slide-up .5s ease', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
        }}>
          <div style={{ width: 40, height: 40, borderRadius: 9, background: 'rgba(34,197,94,.15)', border: '1px solid rgba(34,197,94,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18, color: '#22C55E' }}>✓</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#22C55E' }}>BIDWISE RECOMMENDATION: BID — UP TO $213,000</div>
            <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#94A3B8', marginTop: 3 }}>
              298/298 KPIs processed · 4 manageable risk flags · 94% data confidence · BidWise · Generated in 52 seconds
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: 'monospace', fontSize: 8, color: '#64748B', letterSpacing: '.1em', textTransform: 'uppercase' }}>POWERED BY BIDWISE — ZoneWise.AI</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#F59E0B' }}>ZoneWise.AI</div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── MAIN APP ──────────────────────────────────────────────────────── */
type Phase = 'idle' | 'typing' | 'agents' | 'results'
type AgentStatus = Record<string, string>

export default function DemoPage() {
  const [playing, setPlaying]       = useState(false)
  const [phase, setPhase]           = useState<Phase>('idle')
  const [typed, setTyped]           = useState('')
  const [agt, setAgt]               = useState<AgentStatus>({ scraper: 'idle', title: 'idle', lien: 'idle', ml: 'idle', report: 'idle' })
  const [logs, setLogs]             = useState<string[]>([])
  const [stats, setStats]           = useState<null | object>(null)
  const [stv, setStv]               = useState(false)
  const [props, setProps]           = useState<Prop[]>([])
  const [tab, setTab]               = useState('agents')
  const [rptSecs, setRptSecs]       = useState(0)
  const [scoreVis, setScoreVis]     = useState(false)
  const [rptDone, setRptDone]       = useState(false)
  const [rptProp, setRptProp]       = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const logRef  = useRef<string[]>([])

  const kill = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  const after = (ms: number, fn: () => void) => { const t = setTimeout(fn, ms); timers.current.push(t) }

  const run = useCallback(() => {
    logRef.current = []
    setTyped(''); setLogs([]); setProps([]); setStats(null); setStv(false)
    setAgt({ scraper: 'idle', title: 'idle', lien: 'idle', ml: 'idle', report: 'idle' })
    setTab('agents'); setPhase('typing')
    setRptSecs(0); setScoreVis(false); setRptDone(false); setRptProp(false)

    'Brevard'.split('').forEach((_, ci) => after(ci * T.TD, () => setTyped('Brevard'.slice(0, ci + 1))))
    const at = 'Brevard'.length * T.TD + T.TP

    after(at, () => {
      setPhase('agents'); setTab('agents')
      AGENTS.forEach(({ id }, ai) => {
        after(ai * T.AG,       () => setAgt(s => ({ ...s, [id]: 'active' })))
        after(ai * T.AG + T.AD, () => setAgt(s => ({ ...s, [id]: 'done' })))
      })
      LOGS.forEach((l, li) => after(li * T.LI + 200, () => { logRef.current = [...logRef.current, l]; setLogs([...logRef.current]) }))
      after(T.TL - at,       () => setTab('log'))
      after(T.SR - at,       () => { setStats({}); after(200, () => setStv(true)) })
      after(T.RR - at,       () => { setProps(PROPS); setPhase('results'); setTab('results') })
      after(T.CE - at,       () => setRptProp(true))
      after(T.CC - at,       () => setRptProp(false))
      after(T.RPT_START - at,() => setTab('report'))
      after(T.RPT_K1 - at,   () => setRptSecs(1))
      after(T.RPT_K2 - at,   () => setRptSecs(2))
      after(T.RPT_K3 - at,   () => setRptSecs(3))
      after(T.RPT_K4 - at,   () => setRptSecs(4))
      after(T.RPT_SCORE - at,() => setScoreVis(true))
      after(T.RPT_DONE - at, () => setRptDone(true))
      after(T.LR - at,       () => { setPhase('idle'); setPlaying(false) })
    })
  }, [])

  const handlePlay = () => {
    kill()
    setPlaying(true)
    run()
  }
  const handlePause = () => {
    kill()
    setPlaying(false)
  }
  const handleReplay = () => {
    kill()
    setPlaying(true)
    run()
  }

  useEffect(() => kill, [])

  const showPanel = phase === 'agents' || phase === 'results' || tab === 'report' || rptSecs > 0

  return (
    <>
      <style>{CSS}</style>
      <div style={{ minHeight: '100vh', background: '#020617', color: '#F1F5F9', display: 'flex', flexDirection: 'column' }}>
        <Navbar />

        <div style={{ maxWidth: 940, margin: '0 auto', padding: '34px 18px 60px', flex: 1, width: '100%' }}>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 28 }}>
            {!playing ? (
              <button onClick={handlePlay} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', background: '#F59E0B', color: '#020617', borderRadius: 8, fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}>
                ▶ Play Demo
              </button>
            ) : (
              <button onClick={handlePause} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', background: '#1E293B', color: '#F1F5F9', borderRadius: 8, fontWeight: 700, fontSize: 14, border: '1px solid #334155', cursor: 'pointer' }}>
                ⏸ Pause
              </button>
            )}
            <button onClick={handleReplay} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#1E293B', color: '#94A3B8', borderRadius: 8, fontWeight: 600, fontSize: 14, border: '1px solid #334155', cursor: 'pointer' }}>
              ↺ Replay
            </button>
          </div>

          {/* HERO (idle state) */}
          {phase === 'idle' && (
            <div style={{ textAlign: 'center', marginBottom: 32, animation: 'fade-in .5s ease' }}>
              <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#F59E0B', letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: 10 }}>◉ AUTONOMOUS DEMO</div>
              <h1 style={{ fontSize: 'clamp(24px,4.5vw,50px)', fontWeight: 800, lineHeight: 1.06, letterSpacing: '-.03em', marginBottom: 12, color: '#F1F5F9' }}>
                Every Florida auction.<br /><span style={{ color: '#F59E0B' }}>BidWise. 298 KPIs. In seconds.</span>
              </h1>
              <p style={{ fontSize: 14, color: '#94A3B8', maxWidth: 480, margin: '0 auto', lineHeight: 1.72 }}>
                5 Wise modules — DiscoverWise, TitleWise, LienWise, ScoreWise — deliver a full 298-KPI BidWise report. Autonomous. No analyst needed.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginTop: 24 }}>
                {[{ v: '67', l: 'FL Counties' }, { v: '298', l: 'KPIs / Property' }, { v: '5', l: 'AI Agents' }, { v: '< 60s', l: 'Full Report' }].map(x => (
                  <div key={x.l} style={{ padding: '9px 17px', background: '#0F172A', border: '1px solid #1E293B', borderRadius: 40, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#F59E0B' }}>{x.v}</span>
                    <span style={{ fontSize: 11, color: '#64748B' }}>{x.l}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SEARCH BAR */}
          {playing && (
            <div style={{ maxWidth: 520, margin: '0 auto', marginBottom: 20 }}>
              <div style={{
                display: 'flex', alignItems: 'center', background: '#0F172A',
                border: `1px solid ${phase !== 'idle' ? 'rgba(245,158,11,.7)' : '#334155'}`,
                borderRadius: 10, overflow: 'hidden', transition: 'border-color .4s,box-shadow .4s',
                boxShadow: phase !== 'idle' ? '0 0 28px rgba(245,158,11,.10)' : 'none',
              }}>
                <div style={{ padding: '0 13px', color: '#64748B', display: 'flex' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                </div>
                <div style={{ flex: 1, padding: '13px 0', display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: typed ? '#F1F5F9' : '#334155' }}>
                    {typed || (phase === 'idle' ? 'Searching Florida counties...' : '')}
                  </span>
                  {phase === 'typing' && <span style={{ display: 'inline-block', width: 2, height: 14, background: '#F59E0B', marginLeft: 2, animation: 'cursor-blink .9s infinite' }} />}
                </div>
                <div style={{
                  padding: '10px 18px', background: '#F59E0B', color: '#020617', fontWeight: 700, fontSize: 11, letterSpacing: '.04em',
                  opacity: phase === 'typing' ? .5 : 1, transition: 'opacity .3s', display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  {phase === 'agents' || phase === 'results' || tab === 'report'
                    ? <><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#020617', display: 'inline-block', animation: 'blink .7s infinite' }} /> RUNNING</>
                    : 'ANALYZE →'}
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE PANEL */}
          {showPanel && (
            <div>
              {/* Stats */}
              {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(70px,1fr))', gap: 1, background: '#1E293B', borderRadius: 9, overflow: 'hidden', marginBottom: 14 }}>
                  {[{ l: 'Total', v: 19, c: '#F1F5F9' }, { l: 'BID', v: 4, c: '#22C55E' }, { l: 'REVIEW', v: 3, c: '#F59E0B' }, { l: 'SKIP', v: 12, c: '#EF4444' }, { l: 'Judgment', v: '$4.4M', c: '#94A3B8' }].map(x => (
                    <div key={x.l} style={{ background: '#0F172A', padding: '11px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: 19, fontWeight: 800, color: x.c, opacity: stv ? 1 : 0, transform: stv ? 'scale(1)' : 'scale(.7)', transition: 'all .5s cubic-bezier(.34,1.56,.64,1)' }}>{x.v}</div>
                      <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#64748B', marginTop: 2, textTransform: 'uppercase', letterSpacing: '.1em' }}>{x.l}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab bar */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                {['agents', 'log', 'results', 'report'].map(t => (
                  <button key={t} onClick={() => setTab(t)} style={{
                    padding: '5px 14px', borderRadius: 5, fontSize: 11, fontWeight: 700,
                    letterSpacing: '.06em', textTransform: 'uppercase', position: 'relative',
                    background: tab === t ? '#F59E0B' : '#0F172A', color: tab === t ? '#020617' : '#475569',
                    border: tab === t ? 'none' : '1px solid #1E293B', transition: 'all .3s', cursor: 'pointer',
                  }}>
                    {t}
                    {t === 'report' && tab !== 'report' && rptSecs > 0 && (
                      <span style={{ position: 'absolute', top: -3, right: -3, width: 7, height: 7, borderRadius: '50%', background: '#F59E0B', animation: 'blink .8s infinite' }} />
                    )}
                  </button>
                ))}
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: rptDone ? '#22C55E' : tab === 'report' ? '#F59E0B' : phase === 'results' ? '#22C55E' : '#F59E0B',
                    animation: phase === 'agents' || (tab === 'report' && !rptDone) ? 'blink .7s infinite' : 'none',
                  }} />
                  <span style={{ fontFamily: 'monospace', fontSize: 9, color: rptDone ? '#22C55E' : tab === 'report' ? '#F59E0B' : phase === 'results' ? '#22C55E' : '#F59E0B' }}>
                    {rptDone ? 'BIDWISE COMPLETE' : tab === 'report' ? 'GENERATING BIDWISE REPORT' : phase === 'results' ? 'ANALYSIS COMPLETE' : 'ANALYZING BREVARD'}
                  </span>
                </div>
              </div>

              {tab === 'agents' && <div style={{ display: 'grid', gap: 7, animation: 'fade-in .3s ease' }}>{AGENTS.map(a => <AgentNode key={a.id} agent={a} status={agt[a.id]} />)}</div>}
              {tab === 'log' && <Terminal lines={logs} active={phase === 'agents'} />}
              {tab === 'results' && (
                <div style={{ display: 'grid', gap: 7, animation: 'fade-in .3s ease' }}>
                  {props.map((p, i) => <PropCard key={i} prop={p} highlightReport={i === 0 && rptProp} index={i} />)}
                  <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#334155', textAlign: 'center', marginTop: 6 }}>
                    Showing 4 of 19 · 4 BID · 3 REVIEW · 12 SKIP
                  </div>
                </div>
              )}
              {tab === 'report' && (
                <div style={{ overflowY: 'auto', maxHeight: '68vh', paddingRight: 3 }}>
                  <ReportView sections={rptSecs} scoreVis={scoreVis} done={rptDone} />
                </div>
              )}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: 44 }}>
            <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#1E293B', letterSpacing: '.14em' }}>
              ZONEWISE.AI · 298-KPI AGENTIC INTELLIGENCE · FLORIDA FORECLOSURE · Q1 2026
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  )
}
