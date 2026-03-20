export function formatLpa(lpa: number | undefined): string {
  if (lpa == null || Number.isNaN(lpa)) return 'Not specified';
  return `Rs ${Number(lpa).toLocaleString()} LPA`;
}

export function formatExperienceYears(years: number | undefined): string {
  if (years == null || Number.isNaN(years)) return 'Not specified';
  return `${years}+ years`;
}

function splitTokens(raw: string): string[] {
  // Split on common separators while keeping tokens reasonably clean.
  return raw
    .split(/[,|\n\r•\u2022]+/g)
    .map((t) => t.trim())
    .filter(Boolean);
}

export function extractRequiredSkills(requirements?: string): string[] {
  if (!requirements) return [];
  const text = requirements.replace(/\r/g, '\n');

  // Try to find a "Skills" section first.
  const sectionMatch =
    text.match(/(?:^|\n)\s*(?:skills|required skills|must have|must-have)\s*:\s*([^\n]+)/i) ||
    text.match(/(?:^|\n)\s*(?:skills|required skills|must have|must-have)\s*\n\s*([^\n]+)/i);

  if (sectionMatch?.[1]) return splitTokens(sectionMatch[1]).slice(0, 8);

  // Fallback: take the first few comma-separated tokens from the whole requirements block.
  const tokens = splitTokens(text);
  return tokens.slice(0, 8);
}

export function extractPreferredSkills(requirements?: string): string[] {
  if (!requirements) return [];
  const text = requirements.replace(/\r/g, '\n');
  const match =
    text.match(/(?:^|\n)\s*(?:preferred skills|nice to have|nice-to-have)\s*:\s*([^\n]+)/i) ||
    text.match(/(?:^|\n)\s*(?:preferred skills|nice to have|nice-to-have)\s*\n\s*([^\n]+)/i);

  if (!match?.[1]) return [];
  return splitTokens(match[1]).slice(0, 8);
}

export function summarizeRequirements(requirements?: string, maxChars = 140): string | undefined {
  if (!requirements) return undefined;
  const s = requirements.replace(/\s+/g, ' ').trim();
  if (s.length <= maxChars) return s;
  return `${s.slice(0, maxChars - 3)}...`;
}
