import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

window.HTMLElement.prototype.scrollIntoView = vi.fn()
window.HTMLElement.prototype.scrollTo = vi.fn()

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver

import ZoningChatbot from '../components/chat/ZoningChatbot'

const PAYLOAD = '<img src=x onerror=alert(1)>'

describe('ZoningChatbot XSS negative test', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ response: PAYLOAD }),
      })
    )
  })

  it('renders a malicious <img onerror> message as escaped text, not executable HTML', async () => {
    const { container } = render(<ZoningChatbot />)

    const input = screen.getByPlaceholderText(/Ask about zoning in Brevard County/i)
    fireEvent.change(input, { target: { value: 'trigger malicious response' } })
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 })

    await waitFor(() => {
      expect(container.textContent).toContain(PAYLOAD)
    })

    // The payload must appear as literal text content, never as a live DOM node.
    expect(container.querySelector('img[onerror]')).toBeNull()
    expect(container.querySelector('img[src="x"]')).toBeNull()
    expect(container.innerHTML).not.toMatch(/<img[^>]*onerror=/i)
  })
})
