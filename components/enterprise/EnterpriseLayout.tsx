'use client'

import { useState, useEffect } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import { createBrowserClient } from '@supabase/ssr'
import SessionSidebar from '@/components/enterprise/SessionSidebar'
import ChatPanel from '@/components/enterprise/ChatPanel'
import ArtifactPanel from '@/components/enterprise/ArtifactPanel'
import { Session, Message, Artifact, User } from '@/types'

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export default function EnterpriseLayout() {
  const [user, setUser] = useState<User | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeSession, setActiveSession] = useState<Session | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const { user: clerkUser, isLoaded } = useUser()
  const { signOut } = useClerk()
  const supabase = getSupabase()

  useEffect(() => { if (isLoaded) initializeUser() }, [isLoaded])

  const initializeUser = async () => {
    try {
      if (clerkUser) {
        // Authenticated user — load profile and sessions
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', clerkUser.id).single()
        setUser({
          id: clerkUser.id,
          email: clerkUser.emailAddresses?.[0]?.emailAddress || '',
          role: (profile?.subscription_tier as any) || 'free',
          queryCount: 0,
          queryLimit: profile?.subscription_tier === 'pro' ? 500 : profile?.subscription_tier === 'investor' ? 2000 : 25,
          createdAt: new Date()
        })
        await loadSessions(authUser.id)
      } else {
        // Guest mode — render UI without Supabase sessions
        setUser({
          id: 'guest',
          email: 'guest@zonewise.ai',
          role: 'free',
          queryCount: 0,
          queryLimit: 25,
          createdAt: new Date()
        })
      }
    } catch (err) {
      console.error('Auth check failed, entering guest mode:', err)
      setUser({
        id: 'guest',
        email: 'guest@zonewise.ai',
        role: 'free',
        queryCount: 0,
        queryLimit: 25,
        createdAt: new Date()
      })
    } finally {
      setLoading(false)
    }
  }

  const loadSessions = async (userId: string) => {
    const { data } = await supabase.from('zw_chat_sessions').select('*').eq('user_id', userId).order('updated_at', { ascending: false }).limit(50)
    if (data) {
      setSessions(data.map(s => ({
        id: s.id, title: s.title || 'New Chat', messages: [],
        createdAt: new Date(s.created_at), updatedAt: new Date(s.updated_at),
        userId: s.user_id, metadata: { queryCount: s.query_count || 0 }
      })))
    }
  }

  const createNewSession = async () => {
    if (!user) return
    if (user.id === 'guest') {
      // Local-only session for guests
      const newSession: Session = {
        id: crypto.randomUUID(), title: 'New Chat', messages: [],
        createdAt: new Date(), updatedAt: new Date(), userId: 'guest',
        metadata: { queryCount: 0 }
      }
      setSessions(prev => [newSession, ...prev])
      setActiveSession(newSession)
      setMessages([])
      setArtifacts([])
      setActiveArtifact(null)
      return
    }
    const { data } = await supabase.from('zw_chat_sessions').insert({ user_id: user.id, title: 'New Chat', query_count: 0 }).select().single()
    if (data) {
      const newSession: Session = { id: data.id, title: 'New Chat', messages: [], createdAt: new Date(), updatedAt: new Date(), userId: user.id, metadata: { queryCount: 0 } }
      setSessions(prev => [newSession, ...prev])
      setActiveSession(newSession)
      setMessages([])
      setArtifacts([])
      setActiveArtifact(null)
    }
  }

  const selectSession = async (session: Session) => {
    setActiveSession(session)
    if (user?.id === 'guest') return
    const { data } = await supabase.from('zw_chat_messages').select('*').eq('session_id', session.id).order('created_at', { ascending: true })
    if (data) {
      const formattedMessages: Message[] = data.map(m => ({ id: m.id, role: m.role, content: m.content, timestamp: new Date(m.created_at), artifacts: m.artifacts || [] }))
      setMessages(formattedMessages)
      const allArtifacts = formattedMessages.flatMap(m => m.artifacts || [])
      setArtifacts(allArtifacts)
      if (allArtifacts.length > 0) setActiveArtifact(allArtifacts[allArtifacts.length - 1])
    }
  }

  const handleSendMessage = async (content: string) => {
    if (!activeSession || !user) await createNewSession()
    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content, timestamp: new Date() }
    setMessages(prev => [...prev, userMessage])
    try {
      const response = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })), sessionId: activeSession?.id })
      })
      const data = await response.json()
      const assistantMessage: Message = { id: crypto.randomUUID(), role: 'assistant', content: data.response, timestamp: new Date(), artifacts: data.artifacts || [] }
      setMessages(prev => [...prev, assistantMessage])
      if (data.artifacts?.length > 0) { setArtifacts(prev => [...prev, ...data.artifacts]); setActiveArtifact(data.artifacts[data.artifacts.length - 1]) }
      if (messages.length === 0 && activeSession && user?.id !== 'guest') {
        const title = content.slice(0, 50) + (content.length > 50 ? '...' : '')
        await supabase.from('zw_chat_sessions').update({ title, updated_at: new Date().toISOString() }).eq('id', activeSession.id)
        setSessions(prev => prev.map(s => s.id === activeSession.id ? { ...s, title } : s))
      }
    } catch {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: 'Sorry, there was an error. Please try again.', timestamp: new Date() }])
    }
  }

  const handleSignOut = async () => { await signOut(); window.location.href = '/' }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-slate-950 transition-colors">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-zw-navy-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 dark:text-slate-400 font-medium">Loading ZoneWise.AI...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 overflow-hidden transition-colors">
      <SessionSidebar sessions={sessions} activeSession={activeSession} collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onSelectSession={selectSession} onNewSession={createNewSession} user={user} onSignOut={handleSignOut} />
      <div className="flex-1 flex min-w-0">
        <ChatPanel messages={messages} onSendMessage={handleSendMessage} activeSession={activeSession} artifacts={artifacts} onSelectArtifact={setActiveArtifact} />
        <ArtifactPanel artifact={activeArtifact} artifacts={artifacts} onSelectArtifact={setActiveArtifact} onClose={() => setActiveArtifact(null)} />
      </div>
    </div>
  )
}
