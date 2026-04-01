'use client'

import React from 'react'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'
import { ClickTrackerProvider, useClickTracker } from './ClickTracker'
import DashboardTeaser from './DashboardTeaser'
import ConversionModal from './ConversionModal'

interface SplitScreenInnerProps {
  left: React.ReactNode
  right: React.ReactNode
}

function SplitScreenInner({ left, right }: SplitScreenInnerProps) {
  const { isTeaser, trackClick } = useClickTracker()

  return (
    <div className="relative w-full h-full" onClick={trackClick}>
      <ResizablePanelGroup
        direction="horizontal"
        className="w-full h-full"
      >
        <ResizablePanel defaultSize={60} minSize={30} maxSize={70}>
          <div className="h-full overflow-auto">{left}</div>
        </ResizablePanel>
        <ResizableHandle
          withHandle
          className="bg-[rgba(245,158,11,0.15)] hover:bg-[#F59E0B] data-[resize-handle-active]:bg-[#F59E0B] transition-colors w-[4px]"
        />
        <ResizablePanel defaultSize={40} minSize={30} maxSize={70}>
          <div className="h-full overflow-auto">{right}</div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {isTeaser && <DashboardTeaser />}
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
