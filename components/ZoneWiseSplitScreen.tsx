// ZoneWise Split-Screen Component
// Based on assistant-ui with-artifacts example
// Chat left, map/artifacts right
// House brand: Navy rgb(var(--zw-elev)), Orange rgb(var(--zw-brand)), BG rgb(var(--zw-page))

"use client";

import { Thread } from "@/components/assistant-ui/thread";
import {
  makeAssistantTool,
  useAuiState,
} from "@assistant-ui/react";
import type { ToolCallMessagePart } from "@assistant-ui/react";
import { MapPin, FileText, Search } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

// Tool: Zoning Lookup renders as a card in the artifact panel
const ZoningLookupTool = makeAssistantTool({
  toolName: "zoning_lookup",
  description: "Look up zoning for a Florida address",
  parameters: z.object({
    address: z.string(),
    city: z.string(),
    zone_code: z.string().optional(),
    zone_description: z.string().optional(),
    permitted_uses: z.array(z.string()).optional(),
  }),
  execute: async () => ({}),
  render: ({ args }) => (
    <div className="my-2 inline-flex items-center gap-2 rounded-full border border-[rgb(var(--zw-brand))] bg-[rgb(var(--zw-elev))] px-4 py-2 text-[rgb(var(--zw-ink))]">
      <MapPin className="size-4 text-[rgb(var(--zw-brand))]" />
      Zoning: {args.zone_code || "Looking up..."} — {args.address}
    </div>
  ),
});

// Tool: Report generation
const ReportTool = makeAssistantTool({
  toolName: "zoning_report",
  description: "Generate a PDF zoning report",
  parameters: z.object({
    address: z.string(),
    report_url: z.string().optional(),
  }),
  execute: async () => ({}),
  render: ({ args }) => (
    <div className="my-2 inline-flex items-center gap-2 rounded-full border border-[rgb(var(--zw-brand))] bg-[rgb(var(--zw-elev))] px-4 py-2 text-[rgb(var(--zw-ink))]">
      <FileText className="size-4 text-[rgb(var(--zw-brand))]" />
      Report: {args.address}
    </div>
  ),
});

// Artifact panel — shows zoning data, maps, reports
function ArtifactPanel() {
  const [tab, setTab] = useState<"zoning" | "map" | "report">("zoning");

  const lastToolCall = useAuiState((s) => {
    const messages = s.thread.messages;
    return messages
      .flatMap((m) =>
        m.content.filter(
          (c): c is ToolCallMessagePart =>
            c.type === "tool-call" &&
            ["zoning_lookup", "zoning_report"].includes(c.toolName),
        ),
      )
      .at(-1);
  });

  if (!lastToolCall) {
    return (
      <div className="flex flex-grow basis-full items-center justify-center p-6 text-[rgb(var(--zw-ink2))]">
        <div className="text-center">
          <Search className="mx-auto mb-3 size-12 text-[rgb(var(--zw-brand))] opacity-50" />
          <p className="text-lg font-medium text-[rgb(var(--zw-ink))]">Ask about any address</p>
          <p className="mt-1 text-sm">Zoning data, development standards, and reports will appear here</p>
        </div>
      </div>
    );
  }

  const args = lastToolCall.args as Record<string, unknown>;

  return (
    <div className="flex flex-grow basis-full flex-col p-3">
      <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-[rgb(var(--zw-border2)/0.3)]">
        {/* Tab bar */}
        <div className="flex border-b border-[rgb(var(--zw-border2)/0.3)] bg-[rgb(var(--zw-page))]">
          {(["zoning", "map", "report"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                tab === t
                  ? "bg-[rgb(var(--zw-elev))] text-[rgb(var(--zw-brand))]"
                  : "text-[rgb(var(--zw-ink2))] hover:text-[rgb(var(--zw-ink))]"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto bg-[rgb(var(--zw-page))] p-4">
          {tab === "zoning" && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-[rgb(var(--zw-ink))]">
                {(args.address as string) || "Property"}
              </h3>
              {args.zone_code && (
                <div className="rounded-lg bg-[rgb(var(--zw-elev)/0.2)] p-3">
                  <span className="text-[rgb(var(--zw-brand))] font-mono text-xl font-bold">
                    {args.zone_code as string}
                  </span>
                  <p className="mt-1 text-sm text-[rgb(var(--zw-ink2))]">
                    {args.zone_description as string || "Zoning district"}
                  </p>
                </div>
              )}
            </div>
          )}
          {tab === "map" && (
            <div className="flex h-full items-center justify-center text-[rgb(var(--zw-ink2))]">
              Mapbox integration — Sprint 3
            </div>
          )}
          {tab === "report" && (
            <div className="flex h-full items-center justify-center text-[rgb(var(--zw-ink2))]">
              PDF report generation — Sprint 5
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Main split-screen layout — must be wrapped in AssistantRuntimeProvider (see app/chat-v2/client.tsx)
export default function ZoneWiseSplitScreen() {
  return (
    <main className="flex h-dvh bg-[rgb(var(--zw-page))]">
      {/* Chat panel — left */}
      <div className="flex-grow basis-full border-r border-[rgb(var(--zw-border2)/0.3)]">
        <Thread />
      </div>

      {/* Tools (invisible, register with runtime) */}
      <ZoningLookupTool />
      <ReportTool />

      {/* Artifact panel — right */}
      <ArtifactPanel />
    </main>
  );
}
