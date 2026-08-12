'use client'

import { useState } from 'react'

const languages = [
  { code: 'EN', label: 'English' },
  { code: 'ES', label: 'Espa\u00f1ol' },
  { code: 'HE', label: '\u05E2\u05D1\u05E8\u05D9\u05EA' },
  { code: 'RU', label: '\u0420\u0443\u0441\u0441\u043A\u0438\u0439' },
]

const chatMessages = [
  { role: 'user' as const, text: 'What foreclosures are happening in Duval County this month?' },
  { role: 'assistant' as const, text: 'I found 47 active foreclosure cases in Duval County for February 2026. Here are the highlights:\n\n- 12 residential properties scheduled for auction\n- 8 tax deed sales pending\n- Average assessed value: $215,400\n- Most activity in ZIP 32210 and 32244' },
  { role: 'user' as const, text: 'Show me the ones under $150K with clear title' },
  { role: 'assistant' as const, text: 'Filtered to 5 properties under $150K with clear title status. I\'ve plotted them on the map and generated a comparison table. The best opportunity appears to be at 4521 Moncrief Rd — assessed at $89,200 with no outstanding liens.' },
]

const suggestedChips = ['View 3D Envelope', 'Check HBU', 'Run CMA']

const calendarDays = Array.from({ length: 28 }, (_, i) => {
  const day = i + 1
  if (day === 5 || day === 19) return { day, type: 'foreclosure' as const }
  if (day === 8 || day === 22) return { day, type: 'tax-deed' as const }
  if (day === 12) return { day, type: 'surplus' as const }
  return { day, type: null }
})

const kpiCards = [
  { label: 'Median Value', value: '$247K', change: '+3.2%', up: true },
  { label: 'Inventory', value: '1,204', change: '-8.1%', up: false },
  { label: 'Days on Market', value: '34', change: '-12%', up: false },
  { label: 'Cap Rate', value: '6.8%', change: '+0.4%', up: true },
]

type RightTab = 'map' | 'calendar' | 'analytics'

export default function SplitScreenPreview() {
  const [activeLang, setActiveLang] = useState('EN')
  const [activeTab, setActiveTab] = useState<RightTab>('map')

  return (
    <div className="flex flex-col md:flex-row rounded-xl overflow-hidden border border-gray-200 shadow-lg bg-white">
      {/* Left Panel — AI Chatbot */}
      <div className="w-full md:w-[40%] bg-[#1E3A5F] text-white flex flex-col min-h-[480px]">
        {/* Chat Header */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center">
              <span className="text-xs font-bold">Z</span>
            </div>
            <span className="text-sm font-medium">AI Assistant</span>
          </div>
          {/* Language Toggle */}
          <div className="flex gap-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setActiveLang(lang.code)}
                className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                  activeLang === lang.code
                    ? 'bg-[#F59E0B] text-[#1E3A5F]'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {lang.code}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-white/20 rounded-br-sm'
                    : 'bg-[#162D4A] border border-white/10 rounded-bl-sm'
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Suggested Chips */}
        <div className="px-4 py-3 border-t border-white/10 flex gap-2 flex-wrap">
          {suggestedChips.map((chip) => (
            <a
              href={`/explorer?q=${encodeURIComponent(chip.toLowerCase())}`}
              key={chip}
              className="px-3 py-1.5 bg-white/10 text-white/80 text-xs rounded-full border border-white/10"
            >
              {chip}
            </a>
          ))}
        </div>
      </div>

      {/* Right Panel — Tabbed Interface */}
      <div className="w-full md:w-[60%] flex flex-col min-h-[480px]">
        {/* Tab Bar */}
        <div className="flex border-b border-gray-200">
          {(['map', 'calendar', 'analytics'] as RightTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-3 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'text-[#1E3A5F] border-b-2 border-[#F59E0B]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          {activeTab === 'map' && <MapTab />}
          {activeTab === 'calendar' && <CalendarTab />}
          {activeTab === 'analytics' && <AnalyticsTab />}
        </div>
      </div>
    </div>
  )
}

function MapTab() {
  const mapboxToken = 'pk.eyJ1IjoiZXZlcmVzdDE4IiwiYSI6ImNtanB5cDQ5ZzF1eWgzaHB2cGVhZXdqbjMifQ.4RPrkTf84GL1-clmhmCnTw' // nosemgrep: generic.secrets.security.detected-jwt-token.detected-jwt-token -- public Mapbox pk. token, safe for client exposure by design (verified noise, recon #18878)
  const markers = 'pin-s+FF0000(-81.60,30.35),pin-s+F59E0B(-81.55,30.30),pin-s+1E3A5F(-81.70,30.28),pin-s+FF0000(-81.50,30.40),pin-s+1E3A5F(-81.65,30.25)'
  const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${markers}/-81.60,30.32,10.5,0/800x500@2x?access_token=${mapboxToken}`

  return (
    <div className="h-full relative rounded-lg overflow-hidden min-h-[400px]">
      {/* Real Mapbox static map */}
      <img
        src={mapUrl}
        alt="Duval County foreclosure distress map"
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />

      {/* Semi-transparent heatmap overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[15%] left-[20%] w-28 h-24 bg-red-500/20 rounded-full blur-2xl" />
        <div className="absolute top-[35%] left-[50%] w-36 h-28 bg-orange-500/15 rounded-full blur-2xl" />
        <div className="absolute top-[55%] left-[25%] w-24 h-20 bg-green-500/15 rounded-full blur-2xl" />
        <div className="absolute top-[40%] right-[15%] w-32 h-24 bg-red-500/15 rounded-full blur-2xl" />
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur p-3 rounded-lg shadow-sm text-xs">
        <p className="font-medium text-gray-700 mb-2">Distress Heat Map</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500/60 rounded-sm" />
            <span className="text-gray-600">High distress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500/60 rounded-sm" />
            <span className="text-gray-600">Moderate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500/60 rounded-sm" />
            <span className="text-gray-600">Low distress</span>
          </div>
        </div>
      </div>

      {/* County label */}
      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm">
        <span className="text-xs font-medium text-gray-700">Duval County, FL</span>
      </div>
    </div>
  )
}

function CalendarTab() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">February 2026</h3>
        <div className="flex gap-2 text-xs">
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full" /> Foreclosure</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#F59E0B] rounded-full" /> Tax Deed</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#1E3A5F] rounded-full" /> Surplus</span>
        </div>
      </div>
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
        ))}
      </div>
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map(({ day, type }) => (
          <div
            key={day}
            className={`aspect-square flex items-center justify-center rounded-lg text-sm relative ${
              type ? 'font-medium' : 'text-gray-600'
            } ${
              type === 'foreclosure' ? 'bg-red-50 text-red-700 border border-red-200' :
              type === 'tax-deed' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
              type === 'surplus' ? 'bg-[#E8F4FD] text-[#1E3A5F] border border-[#C5DFEF]' :
              'hover:bg-gray-50'
            }`}
          >
            {day}
            {type && (
              <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                type === 'foreclosure' ? 'bg-red-500' :
                type === 'tax-deed' ? 'bg-[#F59E0B]' :
                'bg-[#1E3A5F]'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function AnalyticsTab() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {kpiCards.map((kpi) => (
          <div key={kpi.label} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">{kpi.label}</p>
            <p className="text-2xl font-bold text-[#1E3A5F]">{kpi.value}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className={`text-xs font-medium ${kpi.up ? 'text-green-600' : 'text-red-500'}`}>
                {kpi.change}
              </span>
              <svg className={`w-3 h-3 ${kpi.up ? 'text-green-600' : 'text-red-500 rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </div>
            {/* Sparkline placeholder */}
            <div className="mt-3 h-8 flex items-end gap-0.5">
              {[40, 55, 35, 60, 45, 70, 50, 65, 80, 60, 75, 85].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-[#1E3A5F]/20 rounded-t-sm"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
