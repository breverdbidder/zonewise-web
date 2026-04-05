const ABBREVIATIONS = new Set([
  "mr",
  "mrs",
  "ms",
  "dr",
  "prof",
  "sr",
  "jr",
  "st",
  "ave",
  "blvd",
  "dept",
  "est",
  "fig",
  "govt",
  "inc",
  "ltd",
  "vs",
  "etc",
  "approx",
  "gen",
  "hon",
  "sgt",
  "cpl",
  "pvt",
  "capt",
  "lt",
  "col",
  "maj",
  "cmdr",
  "adm",
  "rev",
  "msgr",
]);

export function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 2) return 1;

  let count = 0;
  const vowels = "aeiouy";
  let prevVowel = false;

  for (let i = 0; i < w.length; i++) {
    const isVowel = vowels.includes(w[i]);
    if (isVowel && !prevVowel) count++;
    prevVowel = isVowel;
  }

  if (w.endsWith("e") && !w.endsWith("le") && count > 1) count--;
  if (w.endsWith("ed") && count > 1) count--;
  if (w.endsWith("es") && !w.endsWith("ses") && !w.endsWith("zes") && count > 1) count--;

  return Math.max(count, 1);
}

export function splitSentences(text: string): string[] {
  const sentences: string[] = [];
  let current = "";

  const tokens = text.split(/\s+/);
  for (const token of tokens) {
    current += (current ? " " : "") + token;

    if (/[.!?]["'\u201D\u2019)]*$/.test(token)) {
      const bare = token.replace(/[.!?:"'\u201D\u2019)]+$/g, "").toLowerCase();
      if (ABBREVIATIONS.has(bare)) continue;
      if (/^\d+\.$/.test(token)) continue;
      if (/^[A-Z]\.$/.test(token)) continue;

      sentences.push(current.trim());
      current = "";
    }
  }
  if (current.trim()) sentences.push(current.trim());

  return sentences.filter((s) => s.length > 0);
}

function extractWords(text: string): string[] {
  return text
    .replace(/[^\w\s'-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

export interface ReadabilityResult {
  score: number;
  grade: number;
  avgSentenceLength: number;
  avgSyllablesPerWord: number;
}

/**
 * Computes Flesch-Kincaid readability metrics.
 *
 * Flesch Reading Ease = 206.835 - 1.015 * (words/sentences) - 84.6 * (syllables/words)
 * Flesch-Kincaid Grade = 0.39 * (words/sentences) + 11.8 * (syllables/words) - 15.59
 */
export function computeReadability(text: string): ReadabilityResult {
  const sentences = splitSentences(text);
  const words = extractWords(text);

  if (sentences.length === 0 || words.length === 0) {
    return { score: 0, grade: 0, avgSentenceLength: 0, avgSyllablesPerWord: 0 };
  }

  const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const avgSentenceLength = words.length / sentences.length;
  const avgSyllablesPerWord = totalSyllables / words.length;

  const score = 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;

  const grade = 0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59;

  return {
    score: Math.round(score * 10) / 10,
    grade: Math.round(Math.max(0, grade) * 10) / 10,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 100) / 100,
  };
}
