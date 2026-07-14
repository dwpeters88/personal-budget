import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Copy } from 'lucide-react';
import { useApp } from '../store/appStore';
import { repo } from '../store/db';
import { formatCurrency, formatMonthKey, shiftMonthKey } from '../utils/helpers';

export function BudgetsView(): JSX.Element {
  const { selectedMonth, bumpDataVersion } = useApp();
  const categories = useLiveQuery(() => repo.getActiveCategories()) ?? [];
  const budgets = useLiveQuery(() => repo.getBudgetsForMonth(selectedMonth), [selectedMonth]) ?? [];
  const expenseCats = categories.filter((c) => c.type === 'expense');

  const [limits, setLimits] = useState<Record<number, string>>({});

  const budgetMap = new Map(budgets.map((b) => [b.categoryId, b.limit]));

  const handleSave = async (categoryId: number): Promise<void> => {
    const raw = limits[categoryId] ?? String(budgetMap.get(categoryId) ?? '');
    const limit = parseFloat(raw);
    if (!Number.isFinite(limit) || limit < 0) return;
    await repo.upsertBudget({ categoryId, monthKey: selectedMonth, limit });
    bumpDataVersion();
  };

  const handleCopyPrev = async (): Promise<void> => {
    const prev = shiftMonthKey(selectedMonth, -1);
    const copied = await repo.copyBudgetsFromMonth(prev, selectedMonth);
    bumpDataVersion();
    if (copied > 0) {
      setLimits({});
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">{formatMonthKey(selectedMonth)}</h2>
        <button type="button" onClick={() => void handleCopyPrev()} className="flex items-center gap-1 text-sm text-primary">
          <Copy size={14} /> Copy previous month
        </button>
      </div>

      <div className="space-y-2">
        {expenseCats.map((c) => (
          <div key={c.id} className="flex items-center gap-2 rounded-xl bg-surface-container p-3">
            <span className="flex-1 text-sm">{c.name}</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              value={limits[c.id!] ?? (budgetMap.get(c.id!) ?? '')}
              onChange={(e) => setLimits({ ...limits, [c.id!]: e.target.value })}
              onBlur={() => void handleSave(c.id!)}
              className="w-24 rounded bg-surface px-2 py-1 text-right text-sm"
            />
          </div>
        ))}
      </div>

      {budgets.length > 0 && (
        <p className="text-xs text-ink-muted">
          Total budget: {formatCurrency(budgets.reduce((s, b) => s + b.limit, 0))}
        </p>
      )}
    </div>
  );
}
