import type Anthropic from "@anthropic-ai/sdk";
import type { AuditResult, BrandVoice, ContentChange, OptimizedContent, SEOConfig } from "./types";

function buildBrandVoicePrompt(voice: BrandVoice): string {
  return `
Brand Voice Guidelines:
- Tone: ${voice.tone}
- Person: ${voice.personUsage} person
- Sentence patterns: ${voice.sentencePatterns.join("; ")}
- Preferred terminology: ${voice.terminology.join(", ")}

Maintain this voice consistently throughout the rewrite.`;
}

function buildAuditSummary(audit: AuditResult): string {
  const kwSummary = audit.keywordAnalysis
    .map(
      (kw) =>
        `"${kw.keyword}": title=${kw.inTitle}, headings=${kw.inHeadings}, body=${kw.inBody}, density=${kw.density}`,
    )
    .join("\n");

  const structureSummary = [
    `Headings: ${audit.structureAnalysis.headingHierarchy.length} top-level`,
    `Paragraphs: ${audit.structureAnalysis.paragraphLengths.length} (avg ${Math.round(audit.structureAnalysis.paragraphLengths.reduce((a, b) => a + b, 0) / Math.max(audit.structureAnalysis.paragraphLengths.length, 1))} words)`,
    `Lists: ${audit.structureAnalysis.listCount}, Tables: ${audit.structureAnalysis.tableCount}, Images: ${audit.structureAnalysis.imageCount}`,
  ].join("\n");

  return `Keyword Coverage:\n${kwSummary}\n\nStructure:\n${structureSummary}\n\nReadability: grade ${audit.readabilityGrade} (score ${audit.readabilityScore})\n\nAI Citation Readiness: ${audit.aiCitationReadiness.score}/10\n\nInformation Gain Opportunities:\n${audit.informationGainOpportunities.map((o) => `- ${o}`).join("\n")}`;
}

function extractTitle(raw: string): string {
  const match = raw.match(/Title:\s*(.+)/i);
  return match ? match[1].trim() : raw.split("\n")[0].replace(/^#\s*/, "").trim();
}

function extractMetaDescription(raw: string): string {
  const match = raw.match(/Meta\s*Description:\s*(.+)/i);
  return match ? match[1].trim() : "";
}

function extractContentBody(raw: string): string {
  const lines = raw.split("\n");
  let startIdx = 0;
  for (let i = 0; i < lines.length; i++) {
    if (/^#{1,2}\s/.test(lines[i]) && i > 0) {
      startIdx = i;
      break;
    }
  }
  return lines.slice(startIdx).join("\n").trim();
}

function parseChanges(changesText: string): ContentChange[] {
  const changes: ContentChange[] = [];
  const lines = changesText.split("\n").filter((l) => l.trim().length > 0);

  for (const line of lines) {
    const cleaned = line.replace(/^[-*]\s*/, "").trim();
    if (cleaned.length < 5) continue;

    let type: ContentChange["type"] = "content";
    if (/title/i.test(cleaned)) type = "title";
    else if (/meta/i.test(cleaned)) type = "meta";
    else if (/heading/i.test(cleaned)) type = "heading";
    else if (/structure|reorganiz/i.test(cleaned)) type = "structure";
    else if (/faq/i.test(cleaned)) type = "faq";
    else if (/readab/i.test(cleaned)) type = "readability";

    changes.push({ type, description: cleaned });
  }

  return changes;
}

export async function optimizeContent(
  content: string,
  audit: AuditResult,
  keywords: string[],
  brandVoice: BrandVoice | null,
  config: SEOConfig,
  client: Anthropic,
): Promise<OptimizedContent> {
  const auditSummary = buildAuditSummary(audit);
  const voiceInstructions = brandVoice
    ? buildBrandVoicePrompt(brandVoice)
    : "Use a clear, professional tone. No specific brand voice constraints.";

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are an expert SEO content optimizer. Rewrite the following content to improve search rankings while maintaining quality and accuracy.

## SEO Audit Results
${auditSummary}

## Target Keywords
${keywords.join(", ")}

## Brand Voice
${voiceInstructions}

## Optimization Requirements
1. Rewrite the title for higher click-through rate while including the primary keyword
2. Write a compelling meta description (150-160 characters) with primary keyword
3. Restructure headings (H2-H4) for better keyword coverage and scannability
4. Add information-gain sections covering these unique angles:
${audit.informationGainOpportunities.map((o) => `   - ${o}`).join("\n")}
5. Improve readability to approximately grade ${config.readabilityTarget}
6. Add a FAQ section with 3-5 questions derived from common user queries about these keywords
7. Ensure key claims are stated as extractable, citable facts for AI citation systems
8. Minimum word count: ${config.minWordCount}
9. Information gain weight: ${config.informationGainWeight} (${config.informationGainWeight >= 0.7 ? "prioritize unique insights over keyword density" : "balance keywords and unique content"})

## Output Format
Return EXACTLY in this format:

Title: [optimized title]
Meta Description: [optimized meta description]

[Full optimized content in Markdown]

---CHANGES---
[Bulleted list of every change made and why]

## Original Content
${content.slice(0, 8000)}`,
      },
    ],
  });

  const responseText = message.content[0].type === "text" ? message.content[0].text : "";

  const changeSplit = responseText.split("---CHANGES---");
  const mainContent = changeSplit[0].trim();
  const changesRaw = changeSplit[1]?.trim() ?? "";

  const title = extractTitle(mainContent);
  const metaDescription = extractMetaDescription(mainContent);
  const body = extractContentBody(mainContent);
  const changes = parseChanges(changesRaw);

  if (changes.length === 0) {
    changes.push({
      type: "content",
      description: "Full content rewrite for improved SEO performance",
    });
  }

  return {
    title: title || "Optimized Article",
    metaDescription: metaDescription || `Learn about ${keywords[0]} with expert insights and practical guidance.`,
    content: body || mainContent,
    changes,
  };
}
