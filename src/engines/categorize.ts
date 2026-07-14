import type { CategorizationRule, MatchType } from '../types';

function matches(pattern: string, description: string, matchType: MatchType): boolean {
  const desc = description.toLowerCase();
  const pat = pattern.toLowerCase();
  switch (matchType) {
    case 'contains':
      return desc.includes(pat);
    case 'startsWith':
      return desc.startsWith(pat);
    case 'regex':
      try {
        return new RegExp(pattern, 'i').test(description);
      } catch {
        return false;
      }
    default:
      return false;
  }
}

export function categorizeDescription(
  description: string,
  rules: CategorizationRule[],
): number | undefined {
  const sorted = [...rules]
    .filter((r) => r.enabled === 1)
    .sort((a, b) => a.priority - b.priority);

  for (const rule of sorted) {
    if (matches(rule.pattern, description, rule.matchType)) {
      return rule.categoryId;
    }
  }
  return undefined;
}

export function testRule(pattern: string, matchType: MatchType, sample: string): boolean {
  return matches(pattern, sample, matchType);
}
