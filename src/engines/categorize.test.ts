import { describe, it, expect } from 'vitest';
import { categorizeDescription, testRule } from './categorize';
import type { CategorizationRule } from '../types';

const rules: CategorizationRule[] = [
  { id: 1, pattern: 'grocery', matchType: 'contains', categoryId: 10, priority: 1, enabled: 1, createdAt: new Date() },
  { id: 2, pattern: 'uber', matchType: 'startsWith', categoryId: 20, priority: 2, enabled: 1, createdAt: new Date() },
  { id: 3, pattern: 'disabled', matchType: 'contains', categoryId: 99, priority: 0, enabled: 0, createdAt: new Date() },
];

describe('categorize', () => {
  it('matches by priority order', () => {
    expect(categorizeDescription('WHOLE FOODS GROCERY', rules)).toBe(10);
  });

  it('matches startsWith', () => {
    expect(categorizeDescription('UBER TRIP', rules)).toBe(20);
  });

  it('skips disabled rules', () => {
    expect(categorizeDescription('disabled item', rules)).toBeUndefined();
  });

  it('testRule works for live preview', () => {
    expect(testRule('coffee', 'contains', 'STARBUCKS COFFEE')).toBe(true);
  });
});
