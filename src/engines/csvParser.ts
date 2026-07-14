import Papa from 'papaparse';
import type { BankProfile, ColumnMapping, ParsedCsvRow } from '../types';

function parseDate(raw: string, format: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  if (format === 'YYYY-MM-DD' && /^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  if (format === 'MM/DD/YYYY') {
    const m = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
  }
  if (format === 'DD/MM/YYYY') {
    const m = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  }
  if (format === 'DD-MM-YYYY') {
    const m = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  }

  const d = new Date(trimmed);
  if (!Number.isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  return '';
}

function parseAmount(raw: string): number {
  const cleaned = raw.replace(/[,$\s]/g, '').replace(/\((.+)\)/, '-$1');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function rowAmount(row: Record<string, string>, mapping: ColumnMapping): number {
  if (mapping.amount) {
    return parseAmount(row[mapping.amount] ?? '0');
  }
  const debit = parseAmount(row[mapping.debit ?? ''] ?? '0');
  const credit = parseAmount(row[mapping.credit ?? ''] ?? '0');
  if (debit !== 0) return -Math.abs(debit);
  if (credit !== 0) return Math.abs(credit);
  return 0;
}

export function parseCsvText(
  csvText: string,
  profile: Pick<BankProfile, 'delimiter' | 'dateFormat' | 'columnMapping'>,
): ParsedCsvRow[] {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    delimiter: profile.delimiter || undefined,
  });

  const mapping = profile.columnMapping;
  const skip = mapping.skipRows ?? 0;
  const rows = result.data.slice(skip);

  return rows
    .map((row) => {
      const date = parseDate(row[mapping.date] ?? '', profile.dateFormat);
      const description = (row[mapping.description] ?? '').trim();
      const amount = rowAmount(row, mapping);
      if (!date || !description) return null;
      return { date, description, amount, raw: row };
    })
    .filter((r): r is ParsedCsvRow => r !== null);
}

export function getCsvHeaders(csvText: string, delimiter = ','): string[] {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    preview: 1,
    delimiter: delimiter || undefined,
  });
  return result.meta.fields ?? [];
}
