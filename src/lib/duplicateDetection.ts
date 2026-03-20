import type { Candidate } from "@/types/ats";

interface SimilarityScore {
  candidateId: string;
  score: number;
}

/**
 * Calculate similarity between two strings using Levenshtein distance
 */
function levenshteinDistance(str1: string, str2: string): number {
  const track = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(0));

  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i;
  }
  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      );
    }
  }

  return track[str2.length][str1.length];
}

/**
 * Calculate string similarity on a scale of 0-1
 */
function stringSimilarity(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length);
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return 1 - distance / maxLength;
}

/**
 * Normalize string for comparison (remove extra spaces, lowercase)
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s@.]/g, "");
}

/**
 * Check if two candidates are likely duplicates
 */
export function areCandidatesDuplicates(
  candidate1: Candidate,
  candidate2: Candidate,
  thresholds = { name: 0.85, email: 0.9, combined: 0.75 }
): boolean {
  // Exact email match is strong indicator
  if (
    candidate1.email &&
    candidate2.email &&
    candidate1.email.toLowerCase() === candidate2.email.toLowerCase()
  ) {
    return true;
  }

  // Check name similarity
  const nameSimilarity = stringSimilarity(
    normalizeString(candidate1.name),
    normalizeString(candidate2.name)
  );

  // If names are very similar and emails are similar too
  if (nameSimilarity >= thresholds.name) {
    if (
      candidate1.email &&
      candidate2.email &&
      stringSimilarity(candidate1.email, candidate2.email) >= thresholds.email
    ) {
      return true;
    }

    // If names are extremely similar (typos), consider it a match
    if (nameSimilarity >= 0.95) {
      return true;
    }
  }

  // Check if name and email domain are the same
  if (candidate1.email && candidate2.email) {
    const domain1 = candidate1.email.split("@")[1];
    const domain2 = candidate2.email.split("@")[1];

    if (domain1 && domain2 && domain1 === domain2 && nameSimilarity >= 0.8) {
      return true;
    }
  }

  return false;
}

/**
 * Find potential duplicates for a given candidate
 */
export function findPotentialDuplicates(
  candidate: Candidate,
  allCandidates: Candidate[]
): SimilarityScore[] {
  return allCandidates
    .filter((c) => c.id !== candidate.id && !c.isDuplicate)
    .map((c) => ({
      candidateId: c.id,
      score: calculateDuplicateScore(candidate, c),
    }))
    .filter((item) => item.score >= 0.65)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10); // Return top 10 potential matches
}

/**
 * Calculate duplicate similarity score
 */
export function calculateDuplicateScore(
  candidate1: Candidate,
  candidate2: Candidate
): number {
  let score = 0;

  // Name similarity (40% weight)
  const nameSimilarity = stringSimilarity(
    normalizeString(candidate1.name),
    normalizeString(candidate2.name)
  );
  score += nameSimilarity * 0.4;

  // Email similarity (35% weight)
  const emailSimilarity =
    candidate1.email && candidate2.email
      ? stringSimilarity(candidate1.email, candidate2.email)
      : 0;
  score += emailSimilarity * 0.35;

  // Location and phone (15% weight)
  let locationPhoneScore = 0;
  if (candidate1.location && candidate2.location) {
    locationPhoneScore +=
      candidate1.location.toLowerCase() === candidate2.location.toLowerCase()
        ? 1
        : 0;
  }
  if (candidate1.phone && candidate2.phone) {
    locationPhoneScore += candidate1.phone === candidate2.phone ? 1 : 0;
  }
  score += Math.min(locationPhoneScore / 2, 1) * 0.15;

  // Experience similarity (10% weight)
  const experienceDiff = Math.abs(
    candidate1.experience - candidate2.experience
  );
  const experienceSimilarity = Math.max(0, 1 - experienceDiff / 20);
  score += experienceSimilarity * 0.1;

  return score;
}

/**
 * Detect duplicates across all candidates and enrich them with duplicate info
 */
export function enrichCandidatesWithDuplicateInfo(
  candidates: Candidate[]
): Candidate[] {
  const enriched = candidates.map((c) => ({ ...c }));

  // Find potential duplicates for each candidate
  enriched.forEach((candidate) => {
    const potentialDups = findPotentialDuplicates(candidate, enriched);
    candidate.potentialDuplicates = potentialDups
      .filter((d) => d.score >= 0.75)
      .map((d) => d.candidateId);
  });

  return enriched;
}
