'use client'

import Script from 'next/script'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'elevenlabs-convai': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { 'agent-id': string },
        HTMLElement
      >
    }
  }
}

/**
 * Embeds the ElevenLabs Conversational AI widget for the ZoneWise Voice
 * Draftsman agent (agent_8801kzppqvkqewtaabvh8wyg7tyv). The agent talks a
 * customer through a floor plan by voice, drafts it via the same
 * compile_floor_plan / save_floor_plan backend this page's manual editor
 * uses, and tells the customer the Parcel ID + Plan name to Load here
 * afterward.
 */
export default function VoiceDraftsman() {
  return (
    <div className="mt-6 rounded border border-slate-800 bg-slate-950 p-4">
      <p className="text-sm font-medium text-slate-300 mb-1">Talk to the Voice Draftsman</p>
      <p className="text-xs text-slate-500 mb-3">
        Describe what you want built out loud — the agent drafts it live using this same compiler, then gives you a Parcel ID and Plan name to Load above.
      </p>
      <elevenlabs-convai agent-id="agent_8801kzppqvkqewtaabvh8wyg7tyv" />
      <Script src="https://unpkg.com/@elevenlabs/convai-widget-embed" strategy="afterInteractive" async />
    </div>
  )
}
