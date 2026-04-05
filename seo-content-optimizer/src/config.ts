import type { SEOConfig } from "./types";

function parseReadabilityTarget(value: string): number {
  const match = value.match(/grade[- ]?(\d+)/i);
  if (match) return parseInt(match[1], 10);
  const num = parseInt(value, 10);
  if (!Number.isNaN(num) && num >= 1 && num <= 16) return num;
  return 8;
}

export function loadConfig(): SEOConfig {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is required. " + "Set it before running the optimizer.");
  }

  return {
    anthropicApiKey: apiKey,
    targetKeywordCount: parseInt(process.env.TARGET_KEYWORD_COUNT ?? "5", 10),
    minWordCount: parseInt(process.env.MIN_WORD_COUNT ?? "1500", 10),
    readabilityTarget: parseReadabilityTarget(process.env.READABILITY_TARGET ?? "grade-8"),
    informationGainWeight: parseFloat(process.env.INFORMATION_GAIN_WEIGHT ?? "0.8"),
  };
}
