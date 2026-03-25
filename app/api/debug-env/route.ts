import { NextResponse } from "next/server"

export async function GET() {
  const key = process.env.GEMINI_API_KEY ?? ""
  let geminiResult = "not tested"
  let geminiError = ""
  let httpStatus = 0

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Say hello in one word" }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 50 },
        }),
      }
    )
    httpStatus = res.status
    const text = await res.text()
    if (res.ok) {
      try {
        const json = JSON.parse(text)
        geminiResult = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "no text"
      } catch {
        geminiResult = text.slice(0, 300)
      }
    } else {
      geminiError = text.slice(0, 500)
    }
  } catch (e: any) {
    geminiError = e.message ?? String(e)
  }

  return NextResponse.json({
    key_present: key.length > 0,
    key_prefix: key.slice(0, 10) + "...",
    gemini_http: httpStatus,
    gemini_result: geminiResult,
    gemini_error: geminiError,
  })
}

