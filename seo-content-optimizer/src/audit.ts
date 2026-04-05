import type Anthropic from "@anthropic-ai/sdk";
import { computeReadability } from "./readability";
import type {
  AICitationReadiness,
  AuditResult,
  HeadingNode,
  KeywordAnalysis,
  SEOConfig,
  StructureAnalysis,
} from "./types";

function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  if (match) return match[1].trim();
  const htmlMatch = content.match(/<title>(.+?)<\/title>/i);
  if (htmlMatch) return htmlMatch[1].trim();
  const h1Match = content.match(/<h1[^>]*>(.+?)<\/h1>/i);
  if (h1Match) return h1Match[1].trim();
  return "";
}

function extractHeadings(content: string): { level: number; text: string }[] {
  const headings: { level: number; text: string }[] = [];

  const mdRegex = /^(#{1,6})\s+(.+)$/gm;
  let match = mdRegex.exec(content);
  while (match !== null) {
    headings.push({ level: match[1].length, text: match[2].trim() });
    match = mdRegex.exec(content);
  }

  if (headings.length === 0) {
    const htmlRegex = /<h([1-6])[^>]*>(.+?)<\/h\1>/gi;
    match = htmlRegex.exec(content);
    while (match !== null) {
      headings.push({ level: parseInt(match[1], 10), text: match[2].trim() });
      match = htmlRegex.exec(content);
    }
  }

  return headings;
}

function buildHeadingHierarchy(headings: { level: number; text: string }[]): HeadingNode[] {
  const root: HeadingNode[] = [];
  const stack: { node: HeadingNode; level: number }[] = [];

  for (const h of headings) {
    const node: HeadingNode = { level: h.level, text: h.text, children: [] };

    while (stack.length > 0 && stack[stack.length - 1].level >= h.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(node);
    } else {
      const parent = stack[stack.length - 1].node;
      if (!parent.children) parent.children = [];
      parent.children.push(node);
    }

    stack.push({ node, level: h.level });
  }

  return root;
}

function stripMarkup(content: string): string {
  return content
    .replace(/<[^>]+>/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_~`]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function analyzeKeyword(
  keyword: string,
  content: string,
  title: string,
  headings: { level: number; text: string }[],
): KeywordAnalysis {
  const lowerContent = content.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();
  const words = stripMarkup(content).split(/\s+/).length;
  const keywordWords = lowerKeyword.split(/\s+/).length;

  const bodyText = stripMarkup(content).toLowerCase();
  const escapedKw = lowerKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const kwRegex = new RegExp(`\\b${escapedKw}\\b`, "gi");
  const bodyMatches = bodyText.match(kwRegex) ?? [];

  const density = words > 0 ? (bodyMatches.length * keywordWords) / words : 0;

  const position = lowerContent.indexOf(lowerKeyword);

  return {
    keyword,
    inTitle: title.toLowerCase().includes(lowerKeyword),
    inHeadings: headings.some((h) => h.text.toLowerCase().includes(lowerKeyword)),
    inBody: bodyMatches.length > 0,
    density: Math.round(density * 10000) / 10000,
    position: position >= 0 ? position : -1,
  };
}

function analyzeStructure(content: string): StructureAnalysis {
  const headings = extractHeadings(content);
  const hierarchy = buildHeadingHierarchy(headings);

  const paragraphs = content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && !p.startsWith("#") && !p.startsWith("-") && !p.startsWith("|"));

  const paragraphLengths = paragraphs.map((p) => stripMarkup(p).split(/\s+/).length);

  const listItems = content.match(/^[\s]*[-*+]\s+.+$/gm) ?? [];
  const orderedItems = content.match(/^[\s]*\d+\.\s+.+$/gm) ?? [];
  const listCount = listItems.length + orderedItems.length;

  const tables = content.match(/\|.+\|/g) ?? [];
  const tableCount = tables.length > 0 ? Math.max(1, Math.floor(tables.length / 3)) : 0;

  const images = content.match(/!\[.*?\]\(.*?\)/g) ?? [];
  const htmlImages = content.match(/<img\s/gi) ?? [];
  const imageCount = images.length + htmlImages.length;

  return { headingHierarchy: hierarchy, paragraphLengths, listCount, tableCount, imageCount };
}

function assessCitationReadiness(content: string): AICitationReadiness {
  const plain = stripMarkup(content);
  const sentences = plain.split(/[.!?]+/).filter((s) => s.trim().length > 10);

  let extractableFacts = 0;
  let entityDefinitions = 0;
  let attributionSafe = 0;

  for (const sentence of sentences) {
    const s = sentence.trim();
    if (/\d+%|\d+\s*(million|billion|thousand|percent)/i.test(s)) extractableFacts++;
    if (/\bis\s+(a|an|the)\s+/i.test(s) && s.length < 200) entityDefinitions++;
    if (/according to|research shows|studies indicate|data suggests/i.test(s)) attributionSafe++;
    if (/defined as|refers to|means that/i.test(s)) entityDefinitions++;
  }

  const maxScore = Math.max(sentences.length, 1);
  const raw = (extractableFacts + entityDefinitions + attributionSafe) / maxScore;
  const score = Math.round(Math.min(raw * 10, 10) * 10) / 10;

  return { extractableFacts, entityDefinitions, attributionSafeStatements: attributionSafe, score };
}

async function identifyInformationGain(
  content: string,
  keywords: string[],
  _config: SEOConfig,
  client: Anthropic,
): Promise<string[]> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Analyze this content and identify 3-5 unique angles or information gaps that competing articles about "${keywords.join(", ")}" likely do not cover. Focus on original insights, data opportunities, and expert perspectives.

Return ONLY a JSON array of strings, each describing one opportunity. No explanation.

Content:
${content.slice(0, 6000)}`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    const lines = text
      .split("\n")
      .map((l: string) => l.replace(/^[-*\d.]+\s*/, "").trim())
      .filter((l: string) => l.length > 10);
    return lines.slice(0, 5);
  }
  return [];
}

export async function auditContent(
  content: string,
  keywords: string[],
  config: SEOConfig,
  client: Anthropic,
): Promise<AuditResult> {
  const title = extractTitle(content);
  const headings = extractHeadings(content);

  const keywordAnalysis = keywords.map((kw) => analyzeKeyword(kw, content, title, headings));

  const structureAnalysis = analyzeStructure(content);

  const plainText = stripMarkup(content);
  const readability = computeReadability(plainText);

  const aiCitationReadiness = assessCitationReadiness(content);

  const informationGainOpportunities = await identifyInformationGain(content, keywords, config, client);

  const internalLinkOpportunities = keywords
    .filter((kw) => kw.split(/\s+/).length >= 2)
    .map((kw) => `Add internal link for "${kw}" to a relevant deep-dive page or glossary entry`);

  return {
    keywordAnalysis,
    structureAnalysis,
    readabilityScore: readability.score,
    readabilityGrade: readability.grade,
    informationGainOpportunities,
    internalLinkOpportunities,
    aiCitationReadiness,
  };
}
