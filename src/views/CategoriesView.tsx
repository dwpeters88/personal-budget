import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus } from 'lucide-react';
import { useApp } from '../store/appStore';
import { repo } from '../store/db';
import type { CategoryType } from '../types';

export function CategoriesView(): JSX.Element {
  const bump = useApp((s) => s.bumpDataVersion);
  const categories = useLiveQuery(() => repo.getActiveCategories()) ?? [];
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('expense');

  const income = categories.filter((c) => c.type === 'income');
  const expense = categories.filter((c) => c.type === 'expense');

  const handleAdd = async (): Promise<void> => {
    if (!name.trim()) return;
    await repo.addCategory({ name: name.trim(), type, archived: 0 });
    setName('');
    setShowForm(false);
    bump();
  };

  const renderGroup = (title: string, items: typeof categories): JSX.Element => (
    <section>
      <h2 className="mb-2 text-sm font-medium text-ink-muted">{title}</h2>
      <div className="space-y-1">
        {items.map((c) => (
          <div key={c.id} className="rounded-lg bg-surface-container px-3 py-2">{c.name}</div>
        ))}
      </div>
    </section>
  );

  return (
    <div className="space-y-4 p-4">
      <button type="button" onClick={() => setShowForm(!showForm)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary/20 py-3 text-primary">
        <Plus size={18} /> Add category
      </button>

      {showForm && (
        <div className="space-y-3 rounded-xl bg-surface-container p-4">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="input-field" />
          <select value={type} onChange={(e) => setType(e.target.value as CategoryType)} className="input-field">
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <button type="button" onClick={() => void handleAdd()} className="btn-primary w-full">Save</button>
        </div>
      )}

      {renderGroup('Income', income)}
      {renderGroup('Expenses', expense)}
    </div>
  );
}
