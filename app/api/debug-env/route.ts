import { NextResponse } from "next/server"

export async function GET() {
  const key = process.env.GEMINI_API_KEY ?? ""
  return NextResponse.json({
    key_present: key.length > 0,
    key_length: key.length,
    key_prefix: key.slice(0, 10) + "...",
    key_suffix: "..." + key.slice(-4),
  })
}

