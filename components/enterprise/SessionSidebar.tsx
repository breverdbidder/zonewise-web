'use client'

import { useState } from 'react'
import { Session, User } from '@/types'
import Link from 'next/link'

interface SessionSidebarProps {
  sessions: Session[]
  activeSession: Session | null
  collapsed: boolean
  onToggleCollapse: () => void
  onSelectSession: (session: Session) => void
  onNewSession: () => void
  user: User | null
  onSignOut: () => void
}

export default function SessionSidebar({
  sessions,
  activeSession,
  collapsed,
  onToggleCollapse,
  onSelectSession,
  onNewSession,
  user,
  onSignOut
}: SessionSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  
  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const groupedSessions = groupSessionsByDate(filteredSessions)
  
  if (collapsed) {
    return (
      <div className="w-16 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-4 gap-4">
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          title="Expand sidebar"
        >
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
        
        <button
          onClick={onNewSession}
          className="p-2 bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
          title="New chat"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        
        <div className="flex-1" />
        
        <Link
          href="/"
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          title="Home"
        >
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </Link>
      </div>
    )
  }
  
  return (
    <div className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-700 rounded-lg flex items-center justify-center shadow-lg shadow-teal-500/20">
              <span className="text-white font-bold text-sm">Z</span>
            </div>
            <span className="font-semibold text-slate-100">ZoneWise.AI</span>
          </Link>
          <button
            onClick={onToggleCollapse}
            className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>
        
        <button
          onClick={onNewSession}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-all hover:shadow-lg hover:shadow-teal-500/20"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </button>
      </div>
      
      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
          />
        </div>
      </div>
      
      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {Object.entries(groupedSessions).map(([group, groupSessions]) => (
          <div key={group} className="mb-4">
            <h3 className="px-2 py-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider">
              {group}
            </h3>
            <div className="space-y-1">
              {groupSessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => onSelectSession(session)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all group ${
                    activeSession?.id === session.id
                      ? 'bg-teal-600/20 text-teal-100 border border-teal-500/30'
                      : 'hover:bg-slate-800/70 text-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${activeSession?.id === session.id ? 'text-teal-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{session.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {session.metadata?.queryCount || 0} queries
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
        
        {filteredSessions.length === 0 && (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-slate-700 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-slate-500 text-sm">No conversations yet</p>
            <p className="text-slate-600 text-xs mt-1">Start a new chat to begin</p>
          </div>
        )}
      </div>
      
      {/* User Section */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-slate-200">
              {user?.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{user?.email}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role} Plan</p>
          </div>
          <button
            onClick={onSignOut}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            title="Sign out"
          >
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
        
        {/* Usage indicator */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-500">Queries used</span>
            <span className="text-slate-400">{user?.queryCount || 0} / {user?.queryLimit || 500}</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full transition-all"
              style={{ width: `${Math.min(((user?.queryCount || 0) / (user?.queryLimit || 500)) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function groupSessionsByDate(sessions: Session[]): Record<string, Session[]> {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  const groups: Record<string, Session[]> = {
    'Today': [],
    'Yesterday': [],
    'Previous 7 Days': [],
    'Older': []
  }
  
  sessions.forEach(session => {
    const sessionDate = new Date(session.updatedAt)
    if (sessionDate >= today) {
      groups['Today'].push(session)
    } else if (sessionDate >= yesterday) {
      groups['Yesterday'].push(session)
    } else if (sessionDate >= lastWeek) {
      groups['Previous 7 Days'].push(session)
    } else {
      groups['Older'].push(session)
    }
  })
  
  // Remove empty groups
  return Object.fromEntries(
    Object.entries(groups).filter(([_, sessions]) => sessions.length > 0)
  )
}
