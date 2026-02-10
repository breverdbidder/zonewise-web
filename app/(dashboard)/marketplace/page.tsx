import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tool Marketplace | ZoneWise.AI",
  description: "Browse 627+ curated modern dev tools — AI agents, MCP servers, skills, and full-stack resources",
};

const CATEGORIES = [
  { id: "ai-agents", label: "AI Agents & Frameworks", icon: "🤖", tools: 20, priority: "P0" },
  { id: "mcp", label: "MCP Servers", icon: "🔌", tools: 24, priority: "P0" },
  { id: "skills", label: "Skills", icon: "⚡", tools: 122, priority: "P0" },
  { id: "modern-stack", label: "Modern Stack", icon: "🏗️", tools: 69, priority: "P1" },
  { id: "web", label: "UI Components", icon: "🎨", tools: 161, priority: "P1" },
  { id: "design", label: "Design & Assets", icon: "🖼️", tools: 83, priority: "P2" },
  { id: "dev-tools", label: "Dev Tools", icon: "🛠️", tools: 25, priority: "P2" },
  { id: "getting-started", label: "Templates", icon: "📋", tools: 26, priority: "P2" },
  { id: "mobile", label: "Mobile", icon: "📱", tools: 97, priority: "P3" },
];

export default function MarketplacePage() {
  const totalTools = CATEGORIES.reduce((sum, cat) => sum + cat.tools, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Tool Marketplace
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {totalTools}+ curated modern dev tools — AI agents, MCP servers, skills,
            UI components, and full-stack resources
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Powered by{" "}
            <a
              href="https://vibe-code-best-practices.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              vibe-code-best-practices
            </a>{" "}
            MCP Server by Gal Havkin
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { label: "Total Tools", value: totalTools, color: "bg-green-100 text-green-800" },
            { label: "Categories", value: 9, color: "bg-blue-100 text-blue-800" },
            { label: "MCP Servers", value: 24, color: "bg-purple-100 text-purple-800" },
            { label: "Skills", value: 122, color: "bg-orange-100 text-orange-800" },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`rounded-xl p-4 text-center ${stat.color}`}
            >
              <div className="text-3xl font-bold">{stat.value}</div>
              <div className="text-sm font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">{cat.icon}</span>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    cat.priority === "P0"
                      ? "bg-green-100 text-green-800"
                      : cat.priority === "P1"
                      ? "bg-blue-100 text-blue-800"
                      : cat.priority === "P2"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {cat.priority}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {cat.label}
              </h3>
              <p className="text-sm text-gray-500">
                {cat.tools} tools available
              </p>
            </div>
          ))}
        </div>

        {/* API Info */}
        <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            API Access
          </h2>
          <p className="text-gray-600 mb-4">
            Query the marketplace programmatically via our MCP proxy:
          </p>
          <div className="bg-gray-900 rounded-lg p-4 text-sm font-mono text-gray-100 overflow-x-auto">
            <pre>{`// List all sections
fetch("/api/mcp/vibe-code", {
  method: "POST",
  body: JSON.stringify({ action: "list-sections" })
})

// Search for tools
fetch("/api/mcp/vibe-code", {
  method: "POST",
  body: JSON.stringify({ action: "search-tools", query: "React" })
})

// Get full section with all tools
fetch("/api/mcp/vibe-code", {
  method: "POST",
  body: JSON.stringify({ action: "get-section", sectionId: "ai-agents" })
})`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
