import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Trash2 } from 'lucide-react';
import { useApp } from '../store/appStore';
import { repo } from '../store/db';
import { testRule } from '../engines/categorize';
import type { MatchType } from '../types';

export function RulesView(): JSX.Element {
  const bump = useApp((s) => s.bumpDataVersion);
  const rules = useLiveQuery(() => repo.getRules()) ?? [];
  const categories = useLiveQuery(() => repo.getActiveCategories()) ?? [];

  const [showForm, setShowForm] = useState(false);
  const [pattern, setPattern] = useState('');
  const [matchType, setMatchType] = useState<MatchType>('contains');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [priority, setPriority] = useState('10');
  const [sample, setSample] = useState('');

  const catMap = new Map(categories.map((c) => [c.id!, c.name]));
  const sampleMatch = sample ? testRule(pattern, matchType, sample) : null;

  const handleAdd = async (): Promise<void> => {
    if (!pattern.trim() || !categoryId) return;
    await repo.addRule({
      pattern: pattern.trim(),
      matchType,
      categoryId,
      priority: Number(priority) || 10,
      enabled: 1,
    });
    setPattern('');
    setShowForm(false);
    bump();
  };

  const handleDelete = async (id: number): Promise<void> => {
    await repo.deleteRule(id);
    bump();
  };

  const handleToggle = async (id: number, enabled: number): Promise<void> => {
    await repo.updateRule(id, { enabled: enabled ? 0 : 1 });
    bump();
  };

  return (
    <div className="space-y-4 p-4">
      <button type="button" onClick={() => setShowForm(!showForm)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary/20 py-3 text-primary">
        <Plus size={18} /> Add rule
      </button>

      {showForm && (
        <div className="space-y-3 rounded-xl bg-surface-container p-4">
          <input value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="Pattern" className="input-field" />
          <select value={matchType} onChange={(e) => setMatchType(e.target.value as MatchType)} className="input-field">
            <option value="contains">Contains</option>
            <option value="startsWith">Starts with</option>
            <option value="regex">Regex</option>
          </select>
          <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))} className="input-field">
            <option value="">Category…</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input value={priority} onChange={(e) => setPriority(e.target.value)} placeholder="Priority" className="input-field" />
          <input value={sample} onChange={(e) => setSample(e.target.value)} placeholder="Test against sample…" className="input-field" />
          {sampleMatch !== null && (
            <p className={`text-sm ${sampleMatch ? 'text-success' : 'text-danger'}`}>
              {sampleMatch ? 'Matches' : 'No match'}
            </p>
          )}
          <button type="button" onClick={() => void handleAdd()} className="btn-primary w-full">Save</button>
        </div>
      )}

      <div className="space-y-2">
        {rules.map((r) => (
          <div key={r.id} className="flex items-center gap-2 rounded-xl bg-surface-container p-3">
            <button type="button" onClick={() => void handleToggle(r.id!, r.enabled)} className={`text-xs px-2 py-0.5 rounded ${r.enabled ? 'bg-success/20 text-success' : 'bg-ink-muted/20'}`}>
              {r.enabled ? 'On' : 'Off'}
            </button>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium">{r.pattern}</p>
              <p className="text-xs text-ink-muted">{r.matchType} → {catMap.get(r.categoryId)} · p{r.priority}</p>
            </div>
            <button type="button" onClick={() => void handleDelete(r.id!)} className="text-ink-muted hover:text-danger">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
