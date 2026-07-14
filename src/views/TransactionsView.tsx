import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useApp } from '../store/appStore';
import { repo } from '../store/db';
import { formatCurrency } from '../utils/helpers';

export function TransactionsView(): JSX.Element {
  const bump = useApp((s) => s.bumpDataVersion);
  const { selectedMonth } = useApp();
  const transactions = useLiveQuery(() => repo.getTransactionsByMonth(selectedMonth)) ?? [];
  const categories = useLiveQuery(() => repo.getActiveCategories()) ?? [];
  const accounts = useLiveQuery(() => repo.getActiveAccounts()) ?? [];

  const [filterAccount, setFilterAccount] = useState<number | ''>('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkCategory, setBulkCategory] = useState<number | ''>('');

  const filtered = filterAccount
    ? transactions.filter((t) => t.accountId === filterAccount)
    : transactions;

  const accountMap = new Map(accounts.map((a) => [a.id!, a.name]));

  const toggleSelect = (id: number): void => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCategoryChange = async (id: number, categoryId: number): Promise<void> => {
    await repo.updateTransaction(id, { categoryId });
    bump();
  };

  const handleBulkRecategorize = async (): Promise<void> => {
    if (!bulkCategory || selected.size === 0) return;
    await repo.bulkUpdateTransactions([...selected], { categoryId: bulkCategory });
    setSelected(new Set());
    bump();
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex gap-2">
        <select value={filterAccount} onChange={(e) => setFilterAccount(e.target.value ? Number(e.target.value) : '')} className="input-field flex-1">
          <option value="">All accounts</option>
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>

      {selected.size > 0 && (
        <div className="flex gap-2 rounded-xl bg-surface-container p-3">
          <select value={bulkCategory} onChange={(e) => setBulkCategory(e.target.value ? Number(e.target.value) : '')} className="input-field flex-1">
            <option value="">Category…</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button type="button" onClick={() => void handleBulkRecategorize()} className="btn-primary">Apply ({selected.size})</button>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((t) => (
          <div key={t.id} className="rounded-xl bg-surface-container p-3">
            <div className="flex items-start gap-2">
              <input type="checkbox" checked={selected.has(t.id!)} onChange={() => toggleSelect(t.id!)} className="mt-1" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-2">
                  <span className="truncate font-medium">{t.description}</span>
                  <span className={t.amount < 0 ? 'text-danger' : 'text-success'}>{formatCurrency(t.amount)}</span>
                </div>
                <p className="text-xs text-ink-muted">{t.date} · {accountMap.get(t.accountId)}</p>
                <select
                  value={t.categoryId ?? ''}
                  onChange={(e) => void handleCategoryChange(t.id!, Number(e.target.value))}
                  className="mt-2 w-full rounded bg-surface text-sm"
                >
                  <option value="">Uncategorized</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-ink-muted">No transactions this month.</p>}
      </div>
    </div>
  );
}
