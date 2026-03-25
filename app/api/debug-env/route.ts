import { NextResponse } from "next/server"
export async function GET() {
  const key = process.env.GEMINI_API_KEY ?? ""
  let result = ""; let error = ""; let http = 0
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Say hello" }] }], generationConfig: { temperature: 0.1, maxOutputTokens: 50 } }) })
    http = res.status
    const t = await res.text()
    if (res.ok) { try { const j = JSON.parse(t); result = j.candidates?.[0]?.content?.parts?.[0]?.text ?? "no text" } catch { result = t.slice(0,300) } }
    else { error = t.slice(0,500) }
  } catch (e: any) { error = e.message }
  return NextResponse.json({ key_prefix: key.slice(0,10)+"...", model: "gemini-2.5-flash", http, result, error })
}
