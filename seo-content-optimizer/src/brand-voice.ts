import type Anthropic from "@anthropic-ai/sdk";
import type { BrandVoice } from "./types";

function detectPerson(text: string): BrandVoice["personUsage"] {
  const firstPerson = (text.match(/\b(I|we|our|my|us)\b/gi) ?? []).length;
  const secondPerson = (text.match(/\b(you|your|yours)\b/gi) ?? []).length;
  const thirdPerson = (text.match(/\b(they|their|theirs|he|she|it|one)\b/gi) ?? []).length;

  const max = Math.max(firstPerson, secondPerson, thirdPerson);
  if (max === firstPerson) return "first";
  if (max === secondPerson) return "second";
  return "third";
}

function extractSentencePatterns(text: string): string[] {
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);

  const patterns: string[] = [];
  let shortCount = 0;
  let longCount = 0;
  let questionCount = 0;
  let imperativeCount = 0;
  let listCount = 0;

  for (const sentence of sentences) {
    const words = sentence.split(/\s+/).length;
    if (words <= 10) shortCount++;
    if (words >= 25) longCount++;
  }

  questionCount = (text.match(/\?/g) ?? []).length;
  imperativeCount = (text.match(/^(Use|Try|Consider|Start|Add|Create|Build|Set|Check|Run)\b/gm) ?? []).length;
  listCount = (text.match(/^[-*]\s+/gm) ?? []).length;

  if (shortCount > sentences.length * 0.3) patterns.push("Favors short, punchy sentences");
  if (longCount > sentences.length * 0.3) patterns.push("Uses longer, detailed sentences");
  if (questionCount >= 3) patterns.push("Frequently uses rhetorical questions");
  if (imperativeCount >= 3) patterns.push("Uses imperative/instructional openings");
  if (listCount >= 5) patterns.push("Heavy use of bullet lists for scannability");

  if (patterns.length === 0) patterns.push("Balanced sentence length, standard structure");

  return patterns;
}

function extractTerminology(text: string): string[] {
  const wordFreq = new Map<string, number>();
  const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) ?? [];

  const stopWords = new Set([
    "that",
    "this",
    "with",
    "from",
    "have",
    "been",
    "were",
    "they",
    "their",
    "will",
    "would",
    "could",
    "should",
    "about",
    "which",
    "when",
    "what",
    "your",
    "more",
    "some",
    "than",
    "them",
    "each",
    "also",
    "into",
    "most",
    "just",
    "over",
    "such",
    "only",
    "very",
    "then",
    "here",
    "there",
    "these",
    "those",
    "being",
    "does",
    "other",
    "after",
    "before",
    "make",
    "like",
    "well",
    "back",
  ]);

  for (const word of words) {
    if (stopWords.has(word)) continue;
    wordFreq.set(word, (wordFreq.get(word) ?? 0) + 1);
  }

  return Array.from(wordFreq.entries())
    .filter(([, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word]) => word);
}

export async function calibrateBrandVoice(samples: string[], client: Anthropic): Promise<BrandVoice> {
  const combined = samples.join("\n\n---\n\n");

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Analyze these content samples and determine the brand voice. Return ONLY a JSON object with:
- "tone": exactly one of "formal", "conversational", or "technical"
- "reasoning": one sentence explaining why

No other fields, no markdown fences.

Samples:
${combined.slice(0, 6000)}`,
      },
    ],
  });

  const responseText = message.content[0].type === "text" ? message.content[0].text : "";

  let tone: BrandVoice["tone"] = "conversational";
  try {
    const cleaned = responseText
      .replace(/```json?\s*/g, "")
      .replace(/```/g, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    if (["formal", "conversational", "technical"].includes(parsed.tone)) {
      tone = parsed.tone;
    }
  } catch {
    if (/formal/i.test(responseText)) tone = "formal";
    else if (/technical/i.test(responseText)) tone = "technical";
  }

  const personUsage = detectPerson(combined);
  const sentencePatterns = extractSentencePatterns(combined);
  const terminology = extractTerminology(combined);

  return { tone, sentencePatterns, terminology, personUsage };
}
