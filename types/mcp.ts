/**
 * Type definitions for MCP server integration
 */

export interface MCPTool {
  name: string;
  description: string;
  url: string;
  category?: string;
  platform?: "web" | "mobile" | "both";
}

export interface MCPSubcategory {
  id: string;
  name: string;
  description: string;
  toolCount: number;
  hasGuides: boolean;
  tools?: MCPTool[];
}

export interface MCPSection {
  id: string;
  name: string;
  group: string;
  subcategories: MCPSubcategory[];
}

export interface MCPServerConfig {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  protocol: string;
  version: string;
  tools: string[];
  categories: string[];
  stats: {
    total_tools: number;
    sections: number;
    subcategories: number;
    last_scraped: string;
  };
}

export interface MarketplaceCategory {
  id: string;
  label: string;
  icon: string;
  tools: number;
  priority: "P0" | "P1" | "P2" | "P3";
}
