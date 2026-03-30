import type { Metadata } from "next";
import ChatV2Client from "./client";

export const metadata: Metadata = {
  title: "ZoneWise AI Chat | Florida Zoning Intelligence",
  description: "AI-powered zoning lookup for any Florida address. Get parcel data, zoning codes, and development standards instantly.",
};

export default function ChatV2Page() {
  return <ChatV2Client />;
}
