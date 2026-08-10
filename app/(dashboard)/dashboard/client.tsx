"use client";

import {
  AssistantRuntimeProvider,
  type ChatModelAdapter,
  useLocalRuntime,
} from "@assistant-ui/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Thread } from "@/components/assistant-ui/thread";
import DashboardContainer from "@/components/conversion/DashboardContainer";
import { ClickTrackerProvider } from "@/components/conversion/ClickTracker";
import { useMemo } from "react";

// Dify SSE adapter — mirrors chat-v2/client.tsx adapter logic
function createDashboardAdapter(): ChatModelAdapter {
  return {
    async *run({ messages }) {
      const lastMessage = messages[messages.length - 1];
      const userText = lastMessage.content
        .filter((c): c is { type: "text"; text: string } => c.type === "text")
        .map((c) => c.text)
        .join("\n");

      try {
        // Try Dify SSE endpoint first
        const difyRes = await fetch("/api/chat-v2", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages }),
        });

        const contentType = difyRes.headers.get("content-type") ?? "";

        if (difyRes.ok && contentType.includes("text/event-stream")) {
          const reader = difyRes.body!.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          let accumulated = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const raw = line.slice(6).trim();
              if (raw === "[DONE]") break;
              try {
                const event = JSON.parse(raw);
                const chunk =
                  event.answer ?? event.delta?.text ?? event.text ?? "";
                if (chunk) {
                  accumulated += chunk;
                  yield { content: [{ type: "text" as const, text: accumulated }] };
                }
              } catch {
                // malformed SSE chunk — skip
              }
            }
          }
          return;
        }

        // Fallback: /api/zoning-chat (JSON, non-streaming)
        const fallbackRes = await fetch("/api/zoning-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userText }),
        });

        if (!fallbackRes.ok) {
          yield { content: [{ type: "text" as const, text: "Sorry, something went wrong. Please try again." }] };
          return;
        }

        const data = await fallbackRes.json();
        yield { content: [{ type: "text" as const, text: data.response ?? "No response received." }] };
      } catch {
        yield { content: [{ type: "text" as const, text: "Connection error. Please try again." }] };
      }
    },
  };
}

export default function DashboardClient() {
  const adapter = useMemo(createDashboardAdapter, []);
  const runtime = useLocalRuntime(adapter);

  return (
    <TooltipProvider>
      <AssistantRuntimeProvider runtime={runtime}>
        {/*
          Split-screen: artifact KPIs left (60%), chat right (40%).
          h-full fills the SidebarInset remaining space after SiteHeader.
          No h-dvh — container height is owned by the layout shell.
        */}
        <div className="flex h-full min-h-0 bg-[#020617] md:flex-row flex-col">
          {/* Left: Dashboard KPIs / artifact panel */}
          <div
            className="
              relative min-h-0 overflow-auto
              border-b border-[#1E3A5F]/30
              [height:40vh]
              md:h-full md:w-[60%] md:flex-none
              md:border-b-0 md:border-r
            "
          >
            <ClickTrackerProvider>
              <DashboardContainer />
            </ClickTrackerProvider>
            {/* Scroll affordance: content routinely exceeds the 40vh mobile height */}
            <div className="pointer-events-none sticky bottom-0 left-0 h-8 w-full bg-gradient-to-t from-[#020617] to-transparent md:hidden" />
          </div>

          {/* Right: Chat panel (Thread via Dify) */}
          <div className="flex min-h-0 flex-1 flex-col [height:60vh] md:h-full">
            <Thread />
          </div>
        </div>
      </AssistantRuntimeProvider>
    </TooltipProvider>
  );
}
