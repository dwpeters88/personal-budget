import type { ParsedCsvRow } from '../types';

function normalizeDescription(desc: string): string {
  return desc.toLowerCase().replace(/\s+/g, ' ').trim();
}

function normalizeAmount(amount: number): string {
  return amount.toFixed(2);
}

export async function computeDedupeHash(
  accountId: number,
  date: string,
  amount: number,
  description: string,
): Promise<string> {
  const payload = `${accountId}|${date}|${normalizeAmount(amount)}|${normalizeDescription(description)}`;
  const data = new TextEncoder().encode(payload);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function filterDuplicates(
  rows: ParsedCsvRow[],
  accountId: number,
  existingHashes: Set<string>,
): Promise<{ newRows: ParsedCsvRow[]; duplicates: ParsedCsvRow[] }> {
  const newRows: ParsedCsvRow[] = [];
  const duplicates: ParsedCsvRow[] = [];
  const seen = new Set(existingHashes);

  for (const row of rows) {
    const hash = await computeDedupeHash(accountId, row.date, row.amount, row.description);
    if (seen.has(hash)) {
      duplicates.push(row);
    } else {
      seen.add(hash);
      newRows.push(row);
    }
  }

  return { newRows, duplicates };
}
