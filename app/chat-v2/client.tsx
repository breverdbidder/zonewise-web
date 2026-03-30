"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import ZoneWiseSplitScreen from "@/components/ZoneWiseSplitScreen";

// Client wrapper: wires useChatRuntime → /api/chat-v2 (Dify adapter)
export default function ChatV2Client() {
  const runtime = useChatRuntime({ api: "/api/chat-v2" });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ZoneWiseSplitScreen />
    </AssistantRuntimeProvider>
  );
}
