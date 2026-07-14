import { describe, it, expect } from 'vitest';
import { computeDedupeHash, filterDuplicates } from './dedup';
import type { ParsedCsvRow } from '../types';

describe('dedup', () => {
  it('computes stable hash for same inputs', async () => {
    const h1 = await computeDedupeHash(1, '2025-01-05', -45.67, 'Grocery Store');
    const h2 = await computeDedupeHash(1, '2025-01-05', -45.67, 'grocery  store');
    expect(h1).toBe(h2);
  });

  it('filters duplicate rows', async () => {
    const rows: ParsedCsvRow[] = [
      { date: '2025-01-05', description: 'Test', amount: -10, raw: {} },
      { date: '2025-01-06', description: 'Other', amount: -20, raw: {} },
    ];
    const hash = await computeDedupeHash(1, '2025-01-05', -10, 'Test');
    const { newRows, duplicates } = await filterDuplicates(rows, 1, new Set([hash]));
    expect(newRows).toHaveLength(1);
    expect(duplicates).toHaveLength(1);
  });
});
