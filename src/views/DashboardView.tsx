import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../store/appStore';
import { repo } from '../store/db';
import { computeBudgetSummaries, spendByCategory, totalIncomeForMonth, totalSpentForMonth } from '../engines/budget';
import { formatCurrency, formatMonthKey, shiftMonthKey } from '../utils/helpers';

export function DashboardView(): JSX.Element {
  const { selectedMonth, setSelectedMonth, dataVersion } = useApp();
  const [balances, setBalances] = useState<Array<{ id: number; name: string; balance: number }>>([]);

  const transactions = useLiveQuery(() => repo.getTransactions(), [dataVersion]) ?? [];
  const categories = useLiveQuery(() => repo.getActiveCategories(), [dataVersion]) ?? [];
  const budgets = useLiveQuery(() => repo.getBudgetsForMonth(selectedMonth), [selectedMonth, dataVersion]) ?? [];
  const accounts = useLiveQuery(() => repo.getActiveAccounts(), [dataVersion]) ?? [];

  useEffect(() => {
    void (async () => {
      const rows = await Promise.all(
        accounts.map(async (a) => ({
          id: a.id!,
          name: a.name,
          balance: await repo.getAccountBalance(a.id!),
        })),
      );
      setBalances(rows);
    })();
  }, [accounts, dataVersion]);

  const summaries = computeBudgetSummaries(selectedMonth, transactions, budgets, categories);
  const spendGroups = spendByCategory(selectedMonth, transactions, categories);
  const maxSpend = Math.max(...spendGroups.map((g) => g.amount), 1);
  const income = totalIncomeForMonth(selectedMonth, transactions);
  const spent = totalSpentForMonth(selectedMonth, transactions);

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between rounded-xl bg-surface-container p-3">
        <button type="button" onClick={() => setSelectedMonth(shiftMonthKey(selectedMonth, -1))} aria-label="Previous month">
          <ChevronLeft size={20} />
        </button>
        <span className="font-medium">{formatMonthKey(selectedMonth)}</span>
        <button type="button" onClick={() => setSelectedMonth(shiftMonthKey(selectedMonth, 1))} aria-label="Next month">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-surface-container p-4">
          <p className="text-xs text-ink-muted">Income</p>
          <p className="text-xl font-semibold text-success">{formatCurrency(income)}</p>
        </div>
        <div className="rounded-xl bg-surface-container p-4">
          <p className="text-xs text-ink-muted">Spent</p>
          <p className="text-xl font-semibold text-danger">{formatCurrency(spent)}</p>
        </div>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-medium text-ink-muted">Account balances</h2>
        <div className="space-y-2">
          {balances.map((b) => (
            <div key={b.id} className="flex justify-between rounded-lg bg-surface-container px-3 py-2">
              <span>{b.name}</span>
              <span className={b.balance >= 0 ? 'text-success' : 'text-danger'}>{formatCurrency(b.balance)}</span>
            </div>
          ))}
          {balances.length === 0 && <p className="text-sm text-ink-muted">Add an account to get started.</p>}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-ink-muted">Spend by category</h2>
        <div className="space-y-2">
          {spendGroups.map((g) => (
            <div key={g.categoryId}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{g.name}</span>
                <span>{formatCurrency(g.amount)}</span>
              </div>
              <div className="h-2 rounded-full bg-surface-container-high">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${(g.amount / maxSpend) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-ink-muted">Budget status</h2>
        <div className="space-y-2">
          {summaries.map((s) => (
            <div key={s.categoryId} className="flex items-center justify-between rounded-lg bg-surface-container px-3 py-2">
              <span className="text-sm">{s.categoryName}</span>
              <span className={`text-sm font-medium ${s.remaining < 0 ? 'text-danger' : 'text-success'}`}>
                {s.limit > 0 ? `${Math.round(s.percentUsed)}%` : formatCurrency(s.spent)}
              </span>
            </div>
          ))}
          {summaries.length === 0 && <p className="text-sm text-ink-muted">Set budget limits to track spending.</p>}
        </div>
      </section>
    </div>
  );
}
