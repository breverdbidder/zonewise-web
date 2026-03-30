// /chat-v2 — ZoneWise AI Chat (Sprint 3 prep)
// Split-screen: chat left, zoning artifact panel right
// Runtime: Dify on Hetzner via /api/chat-v2
// Full functionality requires NEXT_PUBLIC_DIFY_API_URL + DIFY_API_KEY

import type { Metadata } from "next";
import ChatV2Client from "./client";

export const metadata: Metadata = {
  title: "ZoneWise AI Chat | Ask About Any Florida Property",
  description: "AI-powered zoning lookup and property intelligence for Florida foreclosure investors.",
};

export default function ChatV2Page() {
  return <ChatV2Client />;
}
