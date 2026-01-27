import { NextRequest, NextResponse } from 'next/server'
import { chat } from '@/lib/ai/claude'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messages } = await request.json()
    
    const response = await chat(messages)
    
    // Log usage (don't fail if logging fails)
    try {
      await supabase.from('chat_logs').insert({
        user_id: user.id,
        query: messages[messages.length - 1]?.content,
        response: response,
        created_at: new Date().toISOString()
      })
    } catch {
      // Silently ignore logging errors
    }

    return NextResponse.json({ response })
  } catch (error: unknown) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 })
  }
}
