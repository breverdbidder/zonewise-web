import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

// jsdom doesn't implement scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn()

// jsdom doesn't implement ResizeObserver (used by assistant-ui's ThreadPrimitive.Viewport)
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-expect-error jsdom has no ResizeObserver
window.ResizeObserver = MockResizeObserver

vi.mock('@/lib/safe-clerk', () => ({
  useSafeAuth: () => ({ userId: null, isLoaded: true }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}))

import ChatWidget from '../components/ChatWidget'

describe('ChatWidget', () => {
  it('renders without crashing', () => {
    const { container } = render(<ChatWidget />)
    expect(container).toBeDefined()
  })
})
