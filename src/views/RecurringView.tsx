import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, AlertTriangle } from 'lucide-react';
import { useApp } from '../store/appStore';
import { repo } from '../store/db';
import { findMissedRecurring } from '../engines/recurring';
import { formatCurrency } from '../utils/helpers';
import type { RecurringFrequency } from '../types';

export function RecurringView(): JSX.Element {
  const { selectedMonth, bumpDataVersion } = useApp();
  const templates = useLiveQuery(() => repo.getRecurringTemplates()) ?? [];
  const transactions = useLiveQuery(() => repo.getTransactionsByMonth(selectedMonth), [selectedMonth]) ?? [];
  const categories = useLiveQuery(() => repo.getActiveCategories()) ?? [];

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [nextDueDate, setNextDueDate] = useState('');

  const catMap = new Map(categories.map((c) => [c.id!, c.name]));
  const missed = findMissedRecurring(selectedMonth, templates, transactions);

  const handleAdd = async (): Promise<void> => {
    if (!name.trim() || !categoryId || !nextDueDate) return;
    await repo.addRecurring({
      name: name.trim(),
      categoryId,
      amount: parseFloat(amount) || 0,
      frequency,
      nextDueDate,
      enabled: 1,
    });
    setName('');
    setAmount('');
    setShowForm(false);
    bumpDataVersion();
  };

  return (
    <div className="space-y-4 p-4">
      {missed.length > 0 && (
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-4">
          <div className="mb-2 flex items-center gap-2 text-warning">
            <AlertTriangle size={16} /> Missed this month
          </div>
          {missed.map((m, i) => (
            <p key={i} className="text-sm">{m.template.name} — expected {m.expectedDate}</p>
          ))}
        </div>
      )}

      <button type="button" onClick={() => setShowForm(!showForm)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary/20 py-3 text-primary">
        <Plus size={18} /> Add template
      </button>

      {showForm && (
        <div className="space-y-3 rounded-xl bg-surface-container p-4">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="input-field" />
          <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" type="number" className="input-field" />
          <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))} className="input-field">
            <option value="">Category…</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={frequency} onChange={(e) => setFrequency(e.target.value as RecurringFrequency)} className="input-field">
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
          <input value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} type="date" className="input-field" />
          <button type="button" onClick={() => void handleAdd()} className="btn-primary w-full">Save</button>
        </div>
      )}

      <div className="space-y-2">
        {templates.map((t) => (
          <div key={t.id} className="rounded-xl bg-surface-container p-4">
            <div className="flex justify-between">
              <span className="font-medium">{t.name}</span>
              <span>{formatCurrency(t.amount)}</span>
            </div>
            <p className="text-sm text-ink-muted">{catMap.get(t.categoryId)} · {t.frequency} · next {t.nextDueDate}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
