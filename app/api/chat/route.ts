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

    // Check query limit (simplified - in production use proper tracking)
    const { messages } = await request.json()
    
    const response = await chat(messages)
    
    // Log usage
    await supabase.from('chat_logs').insert({
      user_id: user.id,
      query: messages[messages.length - 1]?.content,
      response: response,
      created_at: new Date().toISOString()
    }).catch(() => {}) // Don't fail if logging fails

    return NextResponse.json({ response })
  } catch (error: any) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 })
  }
}
