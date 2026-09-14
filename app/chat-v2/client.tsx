"use client";

import { Thread } from "@/components/assistant-ui/thread";
import {
  AssistantRuntimeProvider,
  type ChatModelAdapter,
  useLocalRuntime,
} from "@assistant-ui/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useCallback, useMemo } from "react";
import { MapPin, Building2, Ruler, Search, Loader2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParcelData {
  parcel_id: string;
  address: string;
  acres?: number;
  city?: string;
  use_description?: string;
}

interface ZoningStandards {
  max_height_ft?: number;
  front_setback_ft?: number;
  max_lot_coverage_pct?: number;
  max_far?: number;
  max_density_du_acre?: number;
}

interface ZoningData {
  zone_code: string;
  zone_name?: string;
  standards?: ZoningStandards;
}

interface ArtifactState {
  parcel?: ParcelData;
  zoning?: ZoningData;
  loading: boolean;
}

// ─── Adapter (conditional: Dify SSE → fallback zoning-chat) ──────────────────

function createAdapter(
  onArtifactUpdate: (update: Partial<ArtifactState>) => void,
): ChatModelAdapter {
  return {
    async *run({ messages }) {
      const lastMessage = messages[messages.length - 1];
      const userText = lastMessage.content
        .filter((c): c is { type: "text"; text: string } => c.type === "text")
        .map((c) => c.text)
        .join("\n");

      onArtifactUpdate({ loading: true });

      try {
        // Try Dify SSE endpoint first (/api/chat-v2)
        const difyRes = await fetch("/api/chat-v2", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages }),
        });

        const contentType = difyRes.headers.get("content-type") ?? "";

        if (difyRes.ok && contentType.includes("text/event-stream")) {
          // ── SSE streaming path (Dify) ─────────────────────────────────────
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
                  yield {
                    content: [{ type: "text" as const, text: accumulated }],
                  };
                }
              } catch {
                // malformed SSE chunk — skip
              }
            }
          }

          onArtifactUpdate({ loading: false });
          return;
        }

        // ── Fallback path: /api/zoning-chat (JSON, non-streaming) ────────────
        const fallbackRes = await fetch("/api/zoning-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userText }),
        });

        if (!fallbackRes.ok) {
          onArtifactUpdate({ loading: false });
          yield {
            content: [
              {
                type: "text" as const,
                text: "Sorry, something went wrong. Please try again.",
              },
            ],
          };
          return;
        }

        const data = await fallbackRes.json();

        // Push parcel + zoning data to artifact panel
        if (data.parcel || data.zoning) {
          onArtifactUpdate({
            parcel: data.parcel ?? undefined,
            zoning: data.zoning ?? undefined,
            loading: false,
          });
        } else {
          onArtifactUpdate({ loading: false });
        }

        yield {
          content: [
            { type: "text" as const, text: data.response ?? "No response received." },
          ],
        };
      } catch {
        onArtifactUpdate({ loading: false });
        yield {
          content: [
            { type: "text" as const, text: "Connection error. Please try again." },
          ],
        };
      }
    },
  };
}

// ─── Artifact Panel ───────────────────────────────────────────────────────────

function ArtifactPanel({ artifact }: { artifact: ArtifactState }) {
  if (artifact.loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 size-10 animate-spin text-[rgb(var(--zw-brand))]" />
          <p className="text-sm text-[rgb(var(--zw-ink2))]">Looking up property data…</p>
        </div>
      </div>
    );
  }

  if (!artifact.parcel && !artifact.zoning) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <Search className="mx-auto mb-3 size-12 text-[rgb(var(--zw-brand))] opacity-40" />
          <p className="text-lg font-semibold text-[rgb(var(--zw-ink))]">Ask about any address</p>
          <p className="mt-1 text-sm text-[rgb(var(--zw-ink2))]">
            Property details and zoning regulations will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Property Details card */}
      {artifact.parcel && (
        <div className="rounded-lg border border-[rgb(var(--zw-border2)/0.4)] bg-[#0D1B2E] p-4">
          <div className="mb-3 flex items-center gap-2">
            <MapPin className="size-4 text-[rgb(var(--zw-brand))]" />
            <h3 className="font-semibold text-[rgb(var(--zw-ink))]">Property Details</h3>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="shrink-0 text-[rgb(var(--zw-ink2))]">Parcel ID</dt>
              <dd className="truncate font-mono text-[rgb(var(--zw-ink))]">
                {artifact.parcel.parcel_id}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="shrink-0 text-[rgb(var(--zw-ink2))]">Address</dt>
              <dd className="text-right text-[rgb(var(--zw-ink))]">{artifact.parcel.address}</dd>
            </div>
            {artifact.parcel.city && (
              <div className="flex justify-between gap-4">
                <dt className="shrink-0 text-[rgb(var(--zw-ink2))]">City</dt>
                <dd className="text-[rgb(var(--zw-ink))]">{artifact.parcel.city.trim()}</dd>
              </div>
            )}
            {artifact.parcel.acres != null && (
              <div className="flex justify-between gap-4">
                <dt className="shrink-0 text-[rgb(var(--zw-ink2))]">Acreage</dt>
                <dd className="text-[rgb(var(--zw-ink))]">{artifact.parcel.acres} ac</dd>
              </div>
            )}
            {artifact.parcel.use_description && (
              <div className="flex justify-between gap-4">
                <dt className="shrink-0 text-[rgb(var(--zw-ink2))]">Use</dt>
                <dd className="text-right text-[rgb(var(--zw-ink))]">
                  {artifact.parcel.use_description.trim()}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Zoning card */}
      {artifact.zoning && (
        <div className="rounded-lg border border-[rgb(var(--zw-border2)/0.4)] bg-[#0D1B2E] p-4">
          <div className="mb-3 flex items-center gap-2">
            <Building2 className="size-4 text-[rgb(var(--zw-brand))]" />
            <h3 className="font-semibold text-[rgb(var(--zw-ink))]">Zoning</h3>
          </div>
          <div className="mb-4 rounded-md bg-[rgb(var(--zw-elev)/0.3)] p-3 text-center">
            <span className="font-mono text-2xl font-bold text-[rgb(var(--zw-brand))]">
              {artifact.zoning.zone_code}
            </span>
            {artifact.zoning.zone_name && (
              <p className="mt-1 text-sm text-[rgb(var(--zw-ink2))]">
                {artifact.zoning.zone_name}
              </p>
            )}
          </div>

          {artifact.zoning.standards && (
            <>
              <div className="mb-2 flex items-center gap-2">
                <Ruler className="size-3 text-[rgb(var(--zw-ink2))]" />
                <span className="text-xs font-medium uppercase tracking-wide text-[rgb(var(--zw-ink2))]">
                  Development Standards
                </span>
              </div>
              <dl className="space-y-2 text-sm">
                {artifact.zoning.standards.max_height_ft != null && (
                  <div className="flex justify-between">
                    <dt className="text-[rgb(var(--zw-ink2))]">Max Height</dt>
                    <dd className="text-[rgb(var(--zw-ink))]">
                      {artifact.zoning.standards.max_height_ft} ft
                    </dd>
                  </div>
                )}
                {artifact.zoning.standards.front_setback_ft != null && (
                  <div className="flex justify-between">
                    <dt className="text-[rgb(var(--zw-ink2))]">Front Setback</dt>
                    <dd className="text-[rgb(var(--zw-ink))]">
                      {artifact.zoning.standards.front_setback_ft} ft
                    </dd>
                  </div>
                )}
                {artifact.zoning.standards.max_lot_coverage_pct != null && (
                  <div className="flex justify-between">
                    <dt className="text-[rgb(var(--zw-ink2))]">Max Lot Coverage</dt>
                    <dd className="text-[rgb(var(--zw-ink))]">
                      {artifact.zoning.standards.max_lot_coverage_pct}%
                    </dd>
                  </div>
                )}
                {artifact.zoning.standards.max_far != null && (
                  <div className="flex justify-between">
                    <dt className="text-[rgb(var(--zw-ink2))]">Max FAR</dt>
                    <dd className="text-[rgb(var(--zw-ink))]">{artifact.zoning.standards.max_far}</dd>
                  </div>
                )}
                {artifact.zoning.standards.max_density_du_acre != null && (
                  <div className="flex justify-between">
                    <dt className="text-[rgb(var(--zw-ink2))]">Max Density</dt>
                    <dd className="text-[rgb(var(--zw-ink))]">
                      {artifact.zoning.standards.max_density_du_acre} du/ac
                    </dd>
                  </div>
                )}
              </dl>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function ChatV2Client() {
  const [artifact, setArtifact] = useState<ArtifactState>({ loading: false });

  const updateArtifact = useCallback((update: Partial<ArtifactState>) => {
    setArtifact((prev) => ({ ...prev, ...update }));
  }, []);

  // Stable adapter reference — only recreated if updateArtifact changes (never)
  const adapter = useMemo(() => createAdapter(updateArtifact), [updateArtifact]);
  const runtime = useLocalRuntime(adapter);

  return (
    <TooltipProvider>
      <AssistantRuntimeProvider runtime={runtime}>
        {/*
          Split-screen layout:
          - Mobile (default): flex-col — chat top (60vh), artifact bottom (40vh)
          - Desktop (md+): flex-row — chat left 40%, artifact right 60%
        */}
        <main className="flex h-dvh flex-col bg-[rgb(var(--zw-page))] md:flex-row">
          {/* Chat panel */}
          <div
            className="
              flex min-h-0 flex-col
              border-b border-[rgb(var(--zw-border2)/0.3)]
              [height:60vh]
              md:h-full md:w-[40%] md:flex-none
              md:border-b-0 md:border-r
            "
          >
            <Thread />
          </div>

          {/* Artifact panel */}
          <div
            className="
              min-h-0 flex-1
              [height:40vh]
              md:h-full
            "
          >
            <ArtifactPanel artifact={artifact} />
          </div>
        </main>
      </AssistantRuntimeProvider>
    </TooltipProvider>
  );
}
