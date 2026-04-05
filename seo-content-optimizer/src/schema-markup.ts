import type Anthropic from "@anthropic-ai/sdk";
import type { SchemaMarkup } from "./types";

const VALID_ARTICLE_FIELDS = new Set([
  "@context",
  "@type",
  "headline",
  "description",
  "author",
  "datePublished",
  "dateModified",
  "image",
  "publisher",
  "mainEntityOfPage",
  "articleBody",
  "wordCount",
  "keywords",
  "articleSection",
  "inLanguage",
]);

const VALID_FAQ_FIELDS = new Set(["@context", "@type", "mainEntity"]);

const VALID_FAQ_ITEM_FIELDS = new Set(["@type", "name", "acceptedAnswer"]);

const VALID_HOWTO_FIELDS = new Set([
  "@context",
  "@type",
  "name",
  "description",
  "step",
  "totalTime",
  "estimatedCost",
  "supply",
  "tool",
  "image",
]);

function hasQAPattern(content: string): boolean {
  const qaIndicators = [/\?\s*\n/g, /^#{2,4}\s+.*\?/gm, /FAQ/i, /frequently asked/i, /common questions/i];
  let matches = 0;
  for (const pattern of qaIndicators) {
    if (pattern.test(content)) matches++;
  }
  return matches >= 1;
}

function isProceduralContent(content: string): boolean {
  const indicators = [/step\s+\d+/gi, /how\s+to/gi, /^\d+\.\s+/gm, /first,?\s.*then,?\s/gi, /instructions/gi];
  let matches = 0;
  for (const pattern of indicators) {
    const found = content.match(pattern);
    if (found && found.length >= 2) matches++;
  }
  return matches >= 2;
}

export function validateJsonLd(schema: Record<string, unknown>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!schema["@context"]) {
    errors.push('Missing required "@context" field');
  } else if (schema["@context"] !== "https://schema.org") {
    errors.push('"@context" should be "https://schema.org"');
  }

  if (!schema["@type"]) {
    errors.push('Missing required "@type" field');
  }

  const type = schema["@type"] as string;

  if (type === "Article" || type === "BlogPosting" || type === "NewsArticle") {
    if (!schema.headline) errors.push("Article schema missing 'headline'");
    if (typeof schema.headline === "string" && schema.headline.length > 110) {
      errors.push("Article headline exceeds 110 characters");
    }
    for (const key of Object.keys(schema)) {
      if (!VALID_ARTICLE_FIELDS.has(key)) {
        errors.push(`Unrecognized Article field: "${key}"`);
      }
    }
  }

  if (type === "FAQPage") {
    if (!schema.mainEntity || !Array.isArray(schema.mainEntity)) {
      errors.push("FAQPage schema missing 'mainEntity' array");
    } else {
      for (const item of schema.mainEntity as Record<string, unknown>[]) {
        if (item["@type"] !== "Question") {
          errors.push("FAQ mainEntity items must have @type 'Question'");
        }
        for (const key of Object.keys(item)) {
          if (!VALID_FAQ_ITEM_FIELDS.has(key)) {
            errors.push(`Unrecognized FAQ Question field: "${key}"`);
          }
        }
      }
    }
    for (const key of Object.keys(schema)) {
      if (!VALID_FAQ_FIELDS.has(key)) {
        errors.push(`Unrecognized FAQPage field: "${key}"`);
      }
    }
  }

  if (type === "HowTo") {
    if (!schema.name) errors.push("HowTo schema missing 'name'");
    if (!schema.step || !Array.isArray(schema.step)) {
      errors.push("HowTo schema missing 'step' array");
    }
    for (const key of Object.keys(schema)) {
      if (!VALID_HOWTO_FIELDS.has(key)) {
        errors.push(`Unrecognized HowTo field: "${key}"`);
      }
    }
  }

  try {
    JSON.stringify(schema);
  } catch {
    errors.push("Schema is not valid JSON");
  }

  return { valid: errors.length === 0, errors };
}

export async function generateSchemaMarkup(content: string, client: Anthropic): Promise<SchemaMarkup[]> {
  const schemas: SchemaMarkup[] = [];

  const articleMsg = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Generate a valid JSON-LD Article schema for this content. Include headline, description (max 160 chars), author (use "Author" as placeholder name), and datePublished (use today's date).

Return ONLY the JSON object, no explanation, no markdown fences.

Content:
${content.slice(0, 4000)}`,
      },
    ],
  });

  const articleText = articleMsg.content[0].type === "text" ? articleMsg.content[0].text : "";
  try {
    const cleaned = articleText
      .replace(/```json?\s*/g, "")
      .replace(/```/g, "")
      .trim();
    const articleSchema = JSON.parse(cleaned);
    articleSchema["@context"] = "https://schema.org";
    if (!articleSchema["@type"]) articleSchema["@type"] = "Article";
    const validation = validateJsonLd(articleSchema);
    if (validation.valid) {
      schemas.push({ type: "Article", jsonLd: articleSchema });
    }
  } catch {
    schemas.push({
      type: "Article",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: content.split("\n")[0].replace(/^#\s*/, "").slice(0, 110),
        description: content.slice(0, 160),
        author: { "@type": "Person", name: "Author" },
        datePublished: new Date().toISOString().split("T")[0],
      },
    });
  }

  if (hasQAPattern(content)) {
    const faqMsg = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Extract Q&A pairs from this content and generate a valid FAQPage JSON-LD schema. Each question should be a "Question" type with an "acceptedAnswer" of type "Answer".

Return ONLY the JSON object, no explanation, no markdown fences.

Content:
${content.slice(0, 4000)}`,
        },
      ],
    });

    const faqText = faqMsg.content[0].type === "text" ? faqMsg.content[0].text : "";
    try {
      const cleaned = faqText
        .replace(/```json?\s*/g, "")
        .replace(/```/g, "")
        .trim();
      const faqSchema = JSON.parse(cleaned);
      faqSchema["@context"] = "https://schema.org";
      faqSchema["@type"] = "FAQPage";
      schemas.push({ type: "FAQ", jsonLd: faqSchema });
    } catch {
      // Skip FAQ schema if generation fails
    }
  }

  if (isProceduralContent(content)) {
    const howtoMsg = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Extract procedural steps from this content and generate a valid HowTo JSON-LD schema. Include name, description, and step array with HowToStep items.

Return ONLY the JSON object, no explanation, no markdown fences.

Content:
${content.slice(0, 4000)}`,
        },
      ],
    });

    const howtoText = howtoMsg.content[0].type === "text" ? howtoMsg.content[0].text : "";
    try {
      const cleaned = howtoText
        .replace(/```json?\s*/g, "")
        .replace(/```/g, "")
        .trim();
      const howtoSchema = JSON.parse(cleaned);
      howtoSchema["@context"] = "https://schema.org";
      howtoSchema["@type"] = "HowTo";
      schemas.push({ type: "HowTo", jsonLd: howtoSchema });
    } catch {
      // Skip HowTo schema if generation fails
    }
  }

  return schemas;
}
