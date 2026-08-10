'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Mic, Square } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────
// Bold hero placement of the ZoneWise Voice Assistant on the Zoning Chat
// page. Same custom raw-WebSocket client as components/floorplan/
// VoiceDraftsman.tsx (kept as a separate file since the two live in
// different route groups and are styled very differently -- this one is
// meant to be the first thing a visitor sees, not a footer widget).
// The agent behind this button now also has query_zoning_database wired
// in, so it answers real zoning/parcel questions grounded in Supabase,
// not just floor plan drafting.
// ─────────────────────────────────────────────────────────────────────────

const AGENT_ID = 'agent_8801kzppqvkqewtaabvh8wyg7tyv'
const SIGNED_URL_ENDPOINT = 'https://mocerqjnksmhcjzxrewo.supabase.co/functions/v1/elevenlabs-signed-url'
const UPLOAD_ENDPOINT = 'https://mocerqjnksmhcjzxrewo.supabase.co/functions/v1/elevenlabs-upload-file'
const LEAD_ENDPOINT = '/api/floorplan/lead'
const SAMPLE_RATE = 16000
const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
const MAX_BYTES = 20 * 1024 * 1024
const CAP_WARN_MS = 8 * 60 * 1000
const CAP_HARD_MS = 10 * 60 * 1000

function isValidEmail(e: string) {
  if (!e || e.indexOf(' ') !== -1) return false
  const at = e.indexOf('@')
  if (at < 1 || e.indexOf('@', at + 1) !== -1) return false
  const domain = e.slice(at + 1)
  const dot = domain.indexOf('.')
  return dot > 0 && dot < domain.length - 1
}

function pcm32ToBase64(float32arr: Float32Array): string {
  const buf = new ArrayBuffer(float32arr.length * 2)
  const view = new DataView(buf)
  for (let i = 0; i < float32arr.length; i++) {
    const s = Math.max(-1, Math.min(1, float32arr[i]))
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }
  const bytes = new Uint8Array(buf)
  let bin = ''
  for (let j = 0; j < bytes.byteLength; j++) bin += String.fromCharCode(bytes[j])
  return btoa(bin)
}

type Status = 'idle' | 'requesting-mic' | 'connecting' | 'listening' | 'cap-reached'

export default function VoiceZoningAssistant() {
  const [status, setStatus] = useState<Status>('idle')
  const [statusMsg, setStatusMsg] = useState('')
  const [showGate, setShowGate] = useState(false)
  const [gateEmail, setGateEmail] = useState('')
  const [gateErr, setGateErr] = useState(false)
  const [voiceEmail, setVoiceEmail] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<{ who: 'user' | 'agent'; text: string } | null>(null)
  const [attachVisible, setAttachVisible] = useState(false)
  const [attachCaption, setAttachCaption] = useState('')
  const [attachProgress, setAttachProgress] = useState<{ state: 'uploading' | 'ok' | 'err'; msg: string } | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const activeRef = useRef(false)
  const conversationIdRef = useRef<string | null>(null)
  const agentAudioQueueRef = useRef<string[]>([])
  const agentPlayingRef = useRef(false)
  const capWarnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const capHardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const clearCapTimers = useCallback(() => {
    if (capWarnTimerRef.current) clearTimeout(capWarnTimerRef.current)
    if (capHardTimerRef.current) clearTimeout(capHardTimerRef.current)
    capWarnTimerRef.current = null
    capHardTimerRef.current = null
  }, [])

  const stopSession = useCallback(() => {
    clearCapTimers()
    activeRef.current = false
    conversationIdRef.current = null
    setStatus('idle')
    setStatusMsg('')
    setAttachVisible(false)
    agentAudioQueueRef.current = []
    agentPlayingRef.current = false
    if (processorRef.current) {
      try {
        processorRef.current.disconnect()
      } catch {}
      processorRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (wsRef.current && wsRef.current.readyState < 2) wsRef.current.close()
    wsRef.current = null
  }, [clearCapTimers])

  const drainAudioQueue = useCallback(() => {
    if (!agentAudioQueueRef.current.length) {
      agentPlayingRef.current = false
      return
    }
    agentPlayingRef.current = true
    const b64 = agentAudioQueueRef.current.shift()!
    const raw = atob(b64)
    const pcm16 = new Int16Array(raw.length / 2)
    const dv = new DataView(new ArrayBuffer(raw.length))
    for (let i = 0; i < raw.length; i++) dv.setUint8(i, raw.charCodeAt(i))
    for (let i = 0; i < pcm16.length; i++) pcm16[i] = dv.getInt16(i * 2, true)
    const ctx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: SAMPLE_RATE })
    audioCtxRef.current = ctx
    const floatBuf = new Float32Array(pcm16.length)
    for (let i = 0; i < pcm16.length; i++) floatBuf[i] = pcm16[i] / 32768
    const audioBuf = ctx.createBuffer(1, floatBuf.length, SAMPLE_RATE)
    audioBuf.getChannelData(0).set(floatBuf)
    const src = ctx.createBufferSource()
    src.buffer = audioBuf
    src.connect(ctx.destination)
    src.onended = () => drainAudioQueue()
    src.start()
  }, [])

  const playAgentAudio = useCallback(
    (b64: string) => {
      agentAudioQueueRef.current.push(b64)
      if (!agentPlayingRef.current) drainAudioQueue()
    },
    [drainAudioQueue]
  )

  const startMicStream = useCallback(() => {
    const ctx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: SAMPLE_RATE })
    audioCtxRef.current = ctx
    const src = ctx.createMediaStreamSource(streamRef.current!)
    const processor = ctx.createScriptProcessor(4096, 1, 1)
    src.connect(processor)
    processor.connect(ctx.destination)
    processor.onaudioprocess = (e) => {
      if (!activeRef.current || !wsRef.current || wsRef.current.readyState !== 1) return
      const float32 = e.inputBuffer.getChannelData(0)
      const b64 = pcm32ToBase64(float32)
      wsRef.current.send(JSON.stringify({ user_audio_chunk: b64 }))
    }
    processorRef.current = processor
  }, [])

  const showCapPanel = useCallback(() => {
    setStatus('cap-reached')
  }, [])

  const startCapTimer = useCallback(() => {
    clearCapTimers()
    capWarnTimerRef.current = setTimeout(() => {
      if (!activeRef.current || !wsRef.current || wsRef.current.readyState !== 1) return
      wsRef.current.send(
        JSON.stringify({
          type: 'contextual_update',
          text: 'System note: 2 minutes remain in this free session. If it fits naturally, you may mention that ZoneWise Pro members ($99/mo) get unlimited AI assistant access, detailed zoning reports, and full 67-county coverage. Do not interrupt what the user is currently saying — work it in naturally or wait for a pause.',
        })
      )
      capHardTimerRef.current = setTimeout(() => {
        if (!activeRef.current) return
        stopSession()
        showCapPanel()
      }, CAP_HARD_MS - CAP_WARN_MS)
    }, CAP_WARN_MS)
  }, [clearCapTimers, stopSession, showCapPanel])

  const startSession = useCallback(async () => {
    setStatus('requesting-mic')
    setStatusMsg('Requesting mic…')
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: SAMPLE_RATE, channelCount: 1, echoCancellation: true, noiseSuppression: true },
      })
    } catch {
      stopSession()
      setStatusMsg('Mic permission denied — try again or use the text box below.')
      return
    }
    setStatus('connecting')
    setStatusMsg('Connecting…')
    let signedUrl: string
    try {
      const res = await fetch(SIGNED_URL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: AGENT_ID }),
      })
      if (!res.ok) throw new Error(`signed-url ${res.status}`)
      const data = await res.json()
      signedUrl = data.signed_url
      if (!signedUrl) throw new Error('no signed_url')
    } catch {
      stopSession()
      setStatusMsg('Could not connect — please try again.')
      return
    }

    let ws: WebSocket
    try {
      ws = new WebSocket(signedUrl)
      wsRef.current = ws
    } catch {
      stopSession()
      setStatusMsg('WebSocket error — please try again.')
      return
    }

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'conversation_initiation_client_data', conversation_config_override: {} }))
    }
    ws.onmessage = (evt) => {
      let msg: any
      try {
        msg = JSON.parse(evt.data)
      } catch {
        return
      }
      const t = msg.type
      if (t === 'conversation_initiation_metadata') {
        const meta = msg.conversation_initiation_metadata_event
        if (meta?.conversation_id) conversationIdRef.current = meta.conversation_id
        setStatus('listening')
        setStatusMsg('🎙️ Listening…')
        activeRef.current = true
        setAttachVisible(true)
        startCapTimer()
        startMicStream()
      } else if (t === 'ping') {
        const eid = msg.ping_event?.event_id ?? 0
        ws.send(JSON.stringify({ type: 'pong', event_id: eid }))
      } else if (t === 'audio') {
        const b64 = msg.audio_event?.audio_base_64
        if (b64) playAgentAudio(b64)
      } else if (t === 'agent_response') {
        const text = msg.agent_response_event?.agent_response
        if (text) setTranscript({ who: 'agent', text })
      } else if (t === 'user_transcript') {
        const utext = msg.user_transcription_event?.user_transcript
        if (utext) setTranscript({ who: 'user', text: utext })
      } else if (t === 'interruption') {
        agentAudioQueueRef.current = []
        agentPlayingRef.current = false
      }
    }
    ws.onerror = () => {
      if (!activeRef.current) return
      stopSession()
      setStatusMsg('Connection lost — please try again.')
    }
    ws.onclose = () => {
      if (activeRef.current) stopSession()
    }
  }, [playAgentAudio, startCapTimer, startMicStream, stopSession])

  const submitGateEmail = useCallback(async () => {
    const email = gateEmail.trim()
    if (!isValidEmail(email)) {
      setGateErr(true)
      return
    }
    setGateErr(false)
    setVoiceEmail(email)
    setShowGate(false)
    fetch(LEAD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, source: 'zoning_chat_voice_gate' }),
    }).catch(() => {})
    startSession()
  }, [gateEmail, startSession])

  const handleMainButton = useCallback(() => {
    if (activeRef.current) {
      stopSession()
    } else if (voiceEmail) {
      startSession()
    } else {
      setShowGate((s) => !s)
    }
  }, [voiceEmail, startSession, stopSession])

  const handleFileSelected = useCallback(async (file: File) => {
    setAttachProgress(null)
    if (!ALLOWED_TYPES.includes(file.type)) {
      setAttachProgress({ state: 'err', msg: 'Invalid file type — PDF, PNG, JPEG, or WEBP only.' })
      return
    }
    if (file.size > MAX_BYTES) {
      setAttachProgress({ state: 'err', msg: 'File too large — maximum 20 MB.' })
      return
    }
    if (!conversationIdRef.current || !wsRef.current || wsRef.current.readyState !== 1) {
      setAttachProgress({ state: 'err', msg: 'No active conversation — start talking first.' })
      return
    }
    setAttachProgress({ state: 'uploading', msg: `Uploading ${file.name}…` })
    const form = new FormData()
    form.append('conversation_id', conversationIdRef.current)
    form.append('file', file)
    let fileId: string
    try {
      const res = await fetch(UPLOAD_ENDPOINT, { method: 'POST', body: form })
      const payload = await res.json()
      if (!res.ok) {
        setAttachProgress({ state: 'err', msg: `Upload failed: ${payload.error || res.status}` })
        return
      }
      fileId = payload.file_id
      if (!fileId) {
        setAttachProgress({ state: 'err', msg: 'Upload error: no file_id returned.' })
        return
      }
    } catch {
      setAttachProgress({ state: 'err', msg: 'Upload failed — check connection.' })
      return
    }
    wsRef.current.send(
      JSON.stringify({
        type: 'multimodal_message',
        file: { file_id: fileId, type: 'file_input' },
        text: { type: 'user_message', text: attachCaption.trim() },
      })
    )
    setAttachProgress({ state: 'ok', msg: `✓ ${file.name} sent${attachCaption.trim() ? ' with caption' : ''}. The assistant is reviewing it.` })
    setAttachCaption('')
  }, [attachCaption])

  useEffect(() => stopSession, [stopSession])

  const isRTL = transcript ? /[\u0590-\u05FF]/.test(transcript.text) : false
  const isLive = status === 'listening' || status === 'connecting' || status === 'requesting-mic'

  return (
    <div className="mx-4 mt-3 rounded-2xl border-2 border-[#F59E0B] bg-gradient-to-br from-[#1E3A5F] via-[#0f2340] to-[#020617] p-6 shadow-[0_0_40px_rgba(245,158,11,0.15)]">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block h-2 w-2 rounded-full bg-[#F59E0B] animate-pulse" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#F59E0B]">Voice Assistant</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white">Just ask it out loud.</h2>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            Real zoning and parcel answers pulled live from our database — setbacks, height limits, permitted uses, any address or zone code. It can draft a floor plan for you too.
          </p>
        </div>

        {status !== 'cap-reached' && (
          <button
            onClick={handleMainButton}
            className={`flex items-center gap-3 rounded-full px-6 py-4 text-base font-bold shadow-lg transition-all shrink-0 ${
              isLive
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-[#F59E0B] hover:bg-[#fbbf24] text-slate-950 hover:scale-105'
            }`}
          >
            {isLive ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            {status === 'idle' ? 'Talk to ZoneWise' : 'Stop'}
          </button>
        )}
      </div>

      {status === 'cap-reached' && (
        <div className="mt-4 rounded-lg border border-amber-700 bg-amber-950/40 p-3 text-sm text-amber-200">
          Free session limit reached. ZoneWise Pro members ($99/mo) get unlimited AI assistant time, detailed zoning
          reports, and full 67-county access.
        </div>
      )}

      {showGate && (
        <div className="mt-4 flex gap-2 items-start max-w-md">
          <div className="flex-1">
            <input
              type="email"
              value={gateEmail}
              onChange={(e) => setGateEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitGateEmail()}
              placeholder="your@email.com"
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-[#F59E0B]"
            />
            {gateErr && <p className="text-xs text-red-400 mt-1">Enter a valid email to start.</p>}
          </div>
          <button
            onClick={submitGateEmail}
            className="px-4 py-2 rounded bg-[#F59E0B] hover:bg-[#fbbf24] text-slate-950 text-sm font-bold"
          >
            Start
          </button>
        </div>
      )}

      {statusMsg && <p className="mt-3 text-xs text-slate-400">{statusMsg}</p>}

      {transcript && (
        <div dir={isRTL ? 'rtl' : 'ltr'} className="mt-3 rounded-lg bg-slate-950/60 border border-slate-800 px-4 py-3 text-sm text-slate-200 max-w-2xl">
          <span className="font-semibold text-[#F59E0B]">{transcript.who === 'user' ? 'You: ' : 'ZoneWise: '}</span>
          {transcript.text}
        </div>
      )}

      {attachVisible && (
        <div className="mt-3 flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_TYPES.join(',')}
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-xs px-2 py-1 rounded border border-slate-700 text-slate-400 hover:text-slate-200"
          >
            📎 Attach a photo or PDF
          </button>
          <input
            type="text"
            value={attachCaption}
            onChange={(e) => setAttachCaption(e.target.value)}
            placeholder="optional note about this file"
            className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 placeholder:text-slate-600"
          />
        </div>
      )}
      {attachProgress && (
        <p
          className={`mt-2 text-xs ${
            attachProgress.state === 'err' ? 'text-red-400' : attachProgress.state === 'ok' ? 'text-emerald-400' : 'text-slate-400'
          }`}
        >
          {attachProgress.msg}
        </p>
      )}
    </div>
  )
}
