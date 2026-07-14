import type { Budget, BudgetSummary, Category, Transaction } from '../types';

export function monthKeyFromDate(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function computeBudgetSummaries(
  monthKey: string,
  transactions: Transaction[],
  budgets: Budget[],
  categories: Category[],
): BudgetSummary[] {
  const catMap = new Map(categories.map((c) => [c.id!, c]));
  const monthTxs = transactions.filter((t) => t.date.startsWith(monthKey) && t.amount < 0);

  const spentByCategory = new Map<number, number>();
  for (const tx of monthTxs) {
    if (!tx.categoryId) continue;
    spentByCategory.set(tx.categoryId, (spentByCategory.get(tx.categoryId) ?? 0) + Math.abs(tx.amount));
  }

  const budgetCats = new Set(budgets.map((b) => b.categoryId));
  const summaries: BudgetSummary[] = [];

  for (const budget of budgets) {
    const cat = catMap.get(budget.categoryId);
    const spent = spentByCategory.get(budget.categoryId) ?? 0;
    const remaining = budget.limit - spent;
    summaries.push({
      categoryId: budget.categoryId,
      categoryName: cat?.name ?? 'Unknown',
      limit: budget.limit,
      spent,
      remaining,
      percentUsed: budget.limit > 0 ? Math.min(100, (spent / budget.limit) * 100) : 0,
    });
  }

  for (const [catId, spent] of spentByCategory) {
    if (budgetCats.has(catId)) continue;
    const cat = catMap.get(catId);
    summaries.push({
      categoryId: catId,
      categoryName: cat?.name ?? 'Unknown',
      limit: 0,
      spent,
      remaining: -spent,
      percentUsed: 100,
    });
  }

  return summaries.sort((a, b) => b.spent - a.spent);
}

export function totalSpentForMonth(monthKey: string, transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.date.startsWith(monthKey) && t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

export function totalIncomeForMonth(monthKey: string, transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.date.startsWith(monthKey) && t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
}

export function spendByCategory(
  monthKey: string,
  transactions: Transaction[],
  categories: Category[],
): Array<{ categoryId: number; name: string; amount: number }> {
  const catMap = new Map(categories.map((c) => [c.id!, c.name]));
  const totals = new Map<number, number>();

  for (const tx of transactions) {
    if (!tx.date.startsWith(monthKey) || tx.amount >= 0 || !tx.categoryId) continue;
    totals.set(tx.categoryId, (totals.get(tx.categoryId) ?? 0) + Math.abs(tx.amount));
  }

  return Array.from(totals.entries())
    .map(([categoryId, amount]) => ({
      categoryId,
      name: catMap.get(categoryId) ?? 'Uncategorized',
      amount,
    }))
    .sort((a, b) => b.amount - a.amount);
}
