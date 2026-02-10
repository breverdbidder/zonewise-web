import { NextRequest, NextResponse } from "next/server";

/**
 * /api/mcp/vibe-code — Proxy to vibe-code-best-practices MCP server
 * 
 * Provides server-side access to 627+ curated modern dev tools.
 * Used by the marketplace page and search functionality.
 * 
 * Supported operations:
 *   POST { action: "list-sections" }
 *   POST { action: "search-tools", query: "...", platform?: "web"|"mobile"|"both", section?: "..." }
 *   POST { action: "get-section", sectionId: "..." }
 */

const MCP_ENDPOINT = "https://vibe-code-best-practices.vercel.app/api/mcp";

let requestId = 1;
let initialized = false;

async function ensureInitialized() {
  if (initialized) return;
  
  await fetch(MCP_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: requestId++,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "zonewise-web", version: "1.0.0" },
      },
    }),
  });
  
  initialized = true;
}

async function mcpCall(toolName: string, args: Record<string, unknown>) {
  await ensureInitialized();
  
  const response = await fetch(MCP_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: requestId++,
      method: "tools/call",
      params: { name: toolName, arguments: args },
    }),
  });

  const data = await response.json();
  const text = data.result?.content?.[0]?.text;
  
  if (!text) {
    return { error: "No content returned from MCP server" };
  }
  
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case "list-sections":
        return NextResponse.json(await mcpCall("list-sections", {}));

      case "search-tools": {
        const { query, platform, section } = params;
        if (!query) {
          return NextResponse.json({ error: "query is required" }, { status: 400 });
        }
        return NextResponse.json(
          await mcpCall("search-tools", { query, ...(platform && { platform }), ...(section && { section }) })
        );
      }

      case "get-section": {
        const { sectionId } = params;
        if (!sectionId) {
          return NextResponse.json({ error: "sectionId is required" }, { status: 400 });
        }
        return NextResponse.json(await mcpCall("get-section", { sectionId }));
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Use: list-sections, search-tools, get-section` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("MCP proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error communicating with MCP server" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    name: "vibe-code-best-practices",
    description: "Proxy to vibe-code-best-practices MCP server — 627+ curated modern dev tools",
    endpoint: "/api/mcp/vibe-code",
    actions: ["list-sections", "search-tools", "get-section"],
    upstream: MCP_ENDPOINT,
    stats: {
      total_tools: 627,
      sections: 9,
      subcategories: 70,
    },
  });
}
