'use client'

import { useState } from 'react'
import { Session, User } from '@/types'
import { useTheme } from '@/lib/theme-context'
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
  sessions, activeSession, collapsed, onToggleCollapse,
  onSelectSession, onNewSession, user, onSignOut
}: SessionSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const { theme, toggleTheme } = useTheme()

  const filteredSessions = sessions.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const groupedSessions = groupSessionsByDate(filteredSessions)

  if (collapsed) {
    return (
      <div className="w-16 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col items-center py-4 gap-4 transition-colors">
        <button onClick={onToggleCollapse} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Expand sidebar">
          <svg className="w-5 h-5 text-gray-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
        <button onClick={onNewSession} className="p-2 bg-zw-navy-600 hover:bg-zw-navy-700 rounded-lg transition-colors" title="New chat">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button onClick={toggleTheme} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          {theme === 'dark' ? (
            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
        <div className="flex-1" />
        <Link href="/" className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Home">
          <svg className="w-5 h-5 text-gray-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </Link>
      </div>
    )
  }

  return (
    <div className="w-72 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col transition-colors">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-zw-navy-500 to-zw-navy-700 rounded-lg flex items-center justify-center shadow-lg shadow-zw-navy-500/20">
              <span className="text-white font-bold text-sm">Z</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-slate-100">ZoneWise.AI</span>
          </Link>
          <div className="flex items-center gap-1">
            <button onClick={toggleTheme} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
              {theme === 'dark' ? (
                <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            <button onClick={onToggleCollapse} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
              <svg className="w-4 h-4 text-gray-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>
        <button onClick={onNewSession} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-zw-navy-600 hover:bg-zw-navy-700 text-white rounded-lg font-medium transition-all hover:shadow-lg hover:shadow-zw-navy-500/20">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Search conversations..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-zw-navy-500/50 focus:border-zw-navy-500 transition-colors" />
        </div>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {Object.entries(groupedSessions).map(([group, groupSessions]) => (
          <div key={group} className="mb-4">
            <h3 className="px-2 py-1.5 text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wider">{group}</h3>
            <div className="space-y-1">
              {groupSessions.map((session) => (
                <button key={session.id} onClick={() => onSelectSession(session)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all group ${
                    activeSession?.id === session.id
                      ? 'bg-zw-navy-50 dark:bg-zw-navy-600/20 text-zw-navy-700 dark:text-slate-100 border border-zw-navy-200 dark:border-zw-navy-500/30'
                      : 'hover:bg-gray-100 dark:hover:bg-slate-800/70 text-gray-700 dark:text-slate-300'
                  }`}>
                  <div className="flex items-start gap-2">
                    <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${activeSession?.id === session.id ? 'text-zw-navy-500 dark:text-zw-navy-400' : 'text-gray-400 dark:text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{session.title}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{session.metadata?.queryCount || 0} queries</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
        {filteredSessions.length === 0 && (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-300 dark:text-slate-700 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-gray-500 dark:text-slate-500 text-sm">No conversations yet</p>
            <p className="text-gray-400 dark:text-slate-600 text-xs mt-1">Start a new chat to begin</p>
          </div>
        )}
      </div>

      {/* User Section */}
      <div className="p-4 border-t border-gray-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-gray-400 dark:from-slate-600 to-gray-500 dark:to-slate-700 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-white">{user?.email?.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-slate-200 truncate">{user?.email}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 capitalize">{user?.role} Plan</p>
          </div>
          <button onClick={onSignOut} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Sign out">
            <svg className="w-4 h-4 text-gray-400 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-400 dark:text-slate-500">Queries used</span>
            <span className="text-gray-500 dark:text-slate-400">{user?.queryCount || 0} / {user?.queryLimit || 500}</span>
          </div>
          <div className="h-1.5 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-zw-navy-500 to-zw-navy-400 rounded-full transition-all"
              style={{ width: `${Math.min(((user?.queryCount || 0) / (user?.queryLimit || 500)) * 100, 100)}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}

function groupSessionsByDate(sessions: Session[]): Record<string, Session[]> {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const lastWeek = new Date(today.getTime() - 604800000)
  const groups: Record<string, Session[]> = { 'Today': [], 'Yesterday': [], 'Previous 7 Days': [], 'Older': [] }
  sessions.forEach(session => {
    const d = new Date(session.updatedAt)
    if (d >= today) groups['Today'].push(session)
    else if (d >= yesterday) groups['Yesterday'].push(session)
    else if (d >= lastWeek) groups['Previous 7 Days'].push(session)
    else groups['Older'].push(session)
  })
  return Object.fromEntries(Object.entries(groups).filter(([_, s]) => s.length > 0))
}
