import { describe, it, expect } from 'vitest';
import { computeBudgetSummaries, totalSpentForMonth, spendByCategory } from './budget';
import type { Budget, Category, Transaction } from '../types';

const categories: Category[] = [
  { id: 1, name: 'Groceries', type: 'expense', archived: 0, createdAt: new Date() },
  { id: 2, name: 'Transport', type: 'expense', archived: 0, createdAt: new Date() },
];

const transactions: Transaction[] = [
  { id: 1, accountId: 1, date: '2025-01-05', description: 'Store', amount: -50, categoryId: 1, dedupeHash: 'a', createdAt: new Date() },
  { id: 2, accountId: 1, date: '2025-01-08', description: 'Uber', amount: -20, categoryId: 2, dedupeHash: 'b', createdAt: new Date() },
  { id: 3, accountId: 1, date: '2025-01-10', description: 'Pay', amount: 1000, categoryId: undefined, dedupeHash: 'c', createdAt: new Date() },
];

const budgets: Budget[] = [
  { id: 1, categoryId: 1, monthKey: '2025-01', limit: 400, createdAt: new Date() },
];

describe('budget engine', () => {
  it('computes budget summaries', () => {
    const summaries = computeBudgetSummaries('2025-01', transactions, budgets, categories);
    expect(summaries[0]).toMatchObject({ categoryName: 'Groceries', spent: 50, remaining: 350 });
  });

  it('totals monthly spend', () => {
    expect(totalSpentForMonth('2025-01', transactions)).toBe(70);
  });

  it('groups spend by category', () => {
    const groups = spendByCategory('2025-01', transactions, categories);
    expect(groups).toHaveLength(2);
    expect(groups[0].amount).toBe(50);
  });
});
