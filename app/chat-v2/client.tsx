"use client";

import { Thread } from "@/components/assistant-ui/thread";
import {
  AssistantRuntimeProvider,
  type ChatModelAdapter,
  useLocalRuntime,
} from "@assistant-ui/react";

// Adapter that calls our existing /api/zoning-chat endpoint
const zonewiseAdapter: ChatModelAdapter = {
  async *run({ messages }) {
    const lastMessage = messages[messages.length - 1];
    const userText = lastMessage.content
      .filter((c): c is { type: "text"; text: string } => c.type === "text")
      .map((c) => c.text)
      .join("\n");

    try {
      const res = await fetch("/api/zoning-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });

      if (!res.ok) {
        yield { content: [{ type: "text" as const, text: "Sorry, something went wrong. Please try again." }] };
        return;
      }

      const data = await res.json();
      const response = data.response || "No response received.";

      // Build rich response with parcel + zoning info
      let fullResponse = response;

      if (data.parcel) {
        const p = data.parcel;
        fullResponse += "\n\n---\n";
        fullResponse += `**Parcel:** ${p.parcel_id}\n`;
        fullResponse += `**Address:** ${p.address}\n`;
        if (p.city) fullResponse += `**City:** ${p.city.trim()}\n`;
        if (p.acres) fullResponse += `**Acres:** ${p.acres}\n`;
        if (p.use_description) fullResponse += `**Use:** ${p.use_description.trim()}\n`;
      }

      if (data.zoning) {
        const z = data.zoning;
        fullResponse += `\n**Zone Code:** ${z.zone_code}\n`;
        if (z.zone_name) fullResponse += `**Zone Name:** ${z.zone_name}\n`;
        if (z.standards) {
          const s = z.standards;
          if (s.max_height_ft) fullResponse += `**Max Height:** ${s.max_height_ft} ft\n`;
          if (s.front_setback_ft) fullResponse += `**Front Setback:** ${s.front_setback_ft} ft\n`;
          if (s.max_lot_coverage_pct) fullResponse += `**Max Lot Coverage:** ${s.max_lot_coverage_pct}%\n`;
        }
      }

      yield {
        content: [{ type: "text" as const, text: fullResponse }],
      };
    } catch {
      yield {
        content: [{ type: "text" as const, text: "Connection error. Please try again." }],
      };
    }
  },
};

export default function ChatV2Client() {
  const runtime = useLocalRuntime(zonewiseAdapter);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="h-dvh bg-[#020617]">
        <div className="mx-auto h-full max-w-3xl">
          <Thread />
        </div>
      </div>
    </AssistantRuntimeProvider>
  );
}
