export interface HeadingNode {
  level: number;
  text: string;
  children?: HeadingNode[];
}

export interface KeywordAnalysis {
  keyword: string;
  inTitle: boolean;
  inHeadings: boolean;
  inBody: boolean;
  density: number;
  position: number;
}

export interface StructureAnalysis {
  headingHierarchy: HeadingNode[];
  paragraphLengths: number[];
  listCount: number;
  tableCount: number;
  imageCount: number;
}

export interface AuditResult {
  keywordAnalysis: KeywordAnalysis[];
  structureAnalysis: StructureAnalysis;
  readabilityScore: number;
  readabilityGrade: number;
  informationGainOpportunities: string[];
  internalLinkOpportunities: string[];
  aiCitationReadiness: AICitationReadiness;
}

export interface AICitationReadiness {
  extractableFacts: number;
  entityDefinitions: number;
  attributionSafeStatements: number;
  score: number;
}

export interface ContentChange {
  type: "title" | "meta" | "heading" | "content" | "structure" | "faq" | "readability";
  description: string;
  before?: string;
  after?: string;
}

export interface OptimizedContent {
  title: string;
  metaDescription: string;
  content: string;
  changes: ContentChange[];
}

export interface SchemaMarkup {
  type: "Article" | "FAQ" | "HowTo";
  jsonLd: Record<string, unknown>;
}

export interface BrandVoice {
  tone: "formal" | "conversational" | "technical";
  sentencePatterns: string[];
  terminology: string[];
  personUsage: "first" | "second" | "third";
}

export interface SEOConfig {
  anthropicApiKey: string;
  targetKeywordCount: number;
  minWordCount: number;
  readabilityTarget: number;
  informationGainWeight: number;
}
