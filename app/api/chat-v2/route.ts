// /api/chat-v2 — Dify streaming adapter for assistant-ui
// Proxies chat messages to Dify Service API on Hetzner (87.99.129.125:3100)
// Requires: NEXT_PUBLIC_DIFY_API_URL + DIFY_API_KEY env vars (Sprint 1, Task 1.3)

import { NextRequest, NextResponse } from "next/server";

const DIFY_API_URL = process.env.NEXT_PUBLIC_DIFY_API_URL || "http://87.99.129.125:3100";
const DIFY_API_KEY = process.env.DIFY_API_KEY || "";

export async function POST(req: NextRequest) {
  if (!DIFY_API_KEY) {
    return NextResponse.json(
      {
        error: "DIFY_API_KEY not configured. Dify must be running on Hetzner (Sprint 1, Task 1.3).",
      },
      { status: 503 },
    );
  }

  const body = await req.json();
  const messages: Array<{ role: string; content: Array<{ type: string; text?: string }> }> =
    body.messages ?? [];

  const lastMessage = messages[messages.length - 1];
  const userQuery = lastMessage?.content
    ?.filter((c) => c.type === "text")
    .map((c) => c.text ?? "")
    .join("\n") ?? "";

  const difyRes = await fetch(`${DIFY_API_URL}/v1/chat-messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DIFY_API_KEY}`,
    },
    body: JSON.stringify({
      inputs: {},
      query: userQuery,
      response_mode: "streaming",
      user: "zonewise-user",
    }),
  });

  if (!difyRes.ok) {
    return NextResponse.json(
      { error: `Dify API error: ${difyRes.status}` },
      { status: difyRes.status },
    );
  }

  // Stream the Dify SSE response back to the client
  return new NextResponse(difyRes.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
