'use client'

import React, { useState, useRef, useCallback } from 'react'
import { ClickTrackerProvider, useClickTracker } from './ClickTracker'
import DashboardTeaser from './DashboardTeaser'
import ConversionModal from './ConversionModal'

interface SplitScreenInnerProps {
  left: React.ReactNode
  right: React.ReactNode
}

function SplitScreenInner({ left, right }: SplitScreenInnerProps) {
  const [leftPct, setLeftPct] = useState(60)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const { isTeaser, trackClick } = useClickTracker()

  const onMouseDown = useCallback(() => {
    dragging.current = true
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragging.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const rawPct = ((e.clientX - rect.left) / rect.width) * 100
    setLeftPct(Math.min(70, Math.max(30, rawPct)))
  }, [])

  const onMouseUp = useCallback(() => {
    dragging.current = false
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative flex w-full h-full"
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onClick={trackClick}
    >
      {/* Left panel */}
      <div style={{ flex: `0 0 ${leftPct}%`, overflow: 'hidden', minWidth: 0 }}>
        {left}
      </div>

      {/* Draggable divider */}
      <div
        onMouseDown={onMouseDown}
        style={{
          width: '4px',
          flexShrink: 0,
          cursor: 'col-resize',
          background: 'rgba(245, 158, 11, 0.15)',
          transition: 'background 0.15s',
          zIndex: 10,
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#F59E0B' }}
        onMouseLeave={(e) => {
          if (!dragging.current) {
            (e.currentTarget as HTMLDivElement).style.background = 'rgba(245, 158, 11, 0.15)'
          }
        }}
      />

      {/* Right panel */}
      <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
        {right}
      </div>

      {/* Teaser sidebar */}
      {isTeaser && <DashboardTeaser />}

      {/* Conversion modal */}
      <ConversionModal />
    </div>
  )
}

interface SplitScreenProps {
  left: React.ReactNode
  right: React.ReactNode
}

export default function SplitScreen({ left, right }: SplitScreenProps) {
  return (
    <ClickTrackerProvider>
      <SplitScreenInner left={left} right={right} />
    </ClickTrackerProvider>
  )
}
