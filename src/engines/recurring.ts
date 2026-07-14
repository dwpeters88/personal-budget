import type { MissedRecurring, RecurringTemplate, Transaction } from '../types';

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function addFrequency(dateStr: string, frequency: RecurringTemplate['frequency']): string {
  const d = new Date(dateStr + 'T12:00:00');
  switch (frequency) {
    case 'weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() + 1);
      break;
    case 'yearly':
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  return d.toISOString().slice(0, 10);
}

function getExpectedDatesInMonth(
  template: RecurringTemplate,
  monthKey: string,
): string[] {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const dates: string[] = [];
  let cursor = template.nextDueDate;

  while (cursor < `${monthKey}-01`) {
    cursor = addFrequency(cursor, template.frequency);
  }

  const lastDay = daysInMonth(year, month);
  const end = `${monthKey}-${String(lastDay).padStart(2, '0')}`;

  while (cursor <= end) {
    if (cursor.startsWith(monthKey)) dates.push(cursor);
    cursor = addFrequency(cursor, template.frequency);
    if (dates.length > 10) break;
  }

  return dates;
}

export function matchTransactionToTemplate(
  tx: Transaction,
  templates: RecurringTemplate[],
  tolerance = 0.01,
): RecurringTemplate | undefined {
  return templates.find((t) => {
    if (t.enabled !== 1) return false;
    const amountMatch = Math.abs(Math.abs(tx.amount) - Math.abs(t.amount)) <= tolerance;
    const nameMatch = tx.description.toLowerCase().includes(t.name.toLowerCase());
    return amountMatch && nameMatch;
  });
}

export function findMissedRecurring(
  monthKey: string,
  templates: RecurringTemplate[],
  transactions: Transaction[],
): MissedRecurring[] {
  const enabled = templates.filter((t) => t.enabled === 1);
  const monthTxs = transactions.filter((t) => t.date.startsWith(monthKey));
  const missed: MissedRecurring[] = [];

  for (const template of enabled) {
    const expectedDates = getExpectedDatesInMonth(template, monthKey);
    for (const expectedDate of expectedDates) {
      const matched = monthTxs.some((tx) => matchTransactionToTemplate(tx, [template]));
      if (!matched) {
        missed.push({ template, expectedDate });
      }
    }
  }

  return missed;
}
