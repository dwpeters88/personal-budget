import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { parseCsvText } from './csvParser';
import type { BankProfile } from '../types';

const fixturesDir = resolve(dirname(fileURLToPath(import.meta.url)), '../test/fixtures');

function loadFixture(name: string): string {
  return readFileSync(resolve(fixturesDir, name), 'utf-8');
}

describe('csvParser', () => {
  it('parses single-amount column format', () => {
    const profile: Pick<BankProfile, 'delimiter' | 'dateFormat' | 'columnMapping'> = {
      delimiter: ',',
      dateFormat: 'YYYY-MM-DD',
      columnMapping: { date: 'Date', description: 'Description', amount: 'Amount' },
    };
    const rows = parseCsvText(loadFixture('single-amount.csv'), profile);
    expect(rows).toHaveLength(5);
    expect(rows[0]).toMatchObject({ date: '2025-01-05', description: 'GROCERY STORE', amount: -45.67 });
    expect(rows[1].amount).toBe(2500);
  });

  it('parses debit/credit column format', () => {
    const profile: Pick<BankProfile, 'delimiter' | 'dateFormat' | 'columnMapping'> = {
      delimiter: ',',
      dateFormat: 'MM/DD/YYYY',
      columnMapping: { date: 'Date', description: 'Details', debit: 'Debit', credit: 'Credit' },
    };
    const rows = parseCsvText(loadFixture('debit-credit.csv'), profile);
    expect(rows).toHaveLength(5);
    expect(rows[0]).toMatchObject({ date: '2025-01-05', description: 'WHOLE FOODS MARKET', amount: -52.3 });
    expect(rows[1].amount).toBe(3000);
    expect(rows[4].amount).toBe(2.15);
  });
});
