import { describe, it, expect } from 'vitest';
import { matchTransactionToTemplate, findMissedRecurring } from './recurring';
import type { RecurringTemplate, Transaction } from '../types';

const template: RecurringTemplate = {
  id: 1,
  name: 'Netflix',
  categoryId: 5,
  amount: 15.99,
  frequency: 'monthly',
  nextDueDate: '2025-01-15',
  enabled: 1,
  createdAt: new Date(),
};

describe('recurring engine', () => {
  it('matches transaction to template', () => {
    const tx: Transaction = {
      id: 1, accountId: 1, date: '2025-01-15', description: 'NETFLIX SUBSCRIPTION',
      amount: -15.99, categoryId: 5, dedupeHash: 'x', createdAt: new Date(),
    };
    expect(matchTransactionToTemplate(tx, [template])?.name).toBe('Netflix');
  });

  it('finds missed recurring items', () => {
    const missed = findMissedRecurring('2025-01', [template], []);
    expect(missed.length).toBeGreaterThan(0);
    expect(missed[0].template.name).toBe('Netflix');
  });
});
