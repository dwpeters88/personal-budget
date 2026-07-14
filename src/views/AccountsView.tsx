import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Archive } from 'lucide-react';
import { useApp } from '../store/appStore';
import { repo } from '../store/db';
import type { AccountType } from '../types';

export function AccountsView(): JSX.Element {
  const bump = useApp((s) => s.bumpDataVersion);
  const accounts = useLiveQuery(() => repo.getActiveAccounts()) ?? [];
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [bankName, setBankName] = useState('');
  const [type, setType] = useState<AccountType>('checking');
  const [currency, setCurrency] = useState('USD');

  const handleAdd = async (): Promise<void> => {
    if (!name.trim()) return;
    await repo.addAccount({ name: name.trim(), bankName: bankName.trim(), type, currency, archived: 0 });
    setName('');
    setBankName('');
    setShowForm(false);
    bump();
  };

  const handleArchive = async (id: number): Promise<void> => {
    await repo.archiveAccount(id);
    bump();
  };

  return (
    <div className="space-y-4 p-4">
      <button
        type="button"
        onClick={() => setShowForm(!showForm)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary/20 py-3 text-primary"
      >
        <Plus size={18} /> Add account
      </button>

      {showForm && (
        <div className="space-y-3 rounded-xl bg-surface-container p-4">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Account name" className="input-field" />
          <input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Bank name" className="input-field" />
          <select value={type} onChange={(e) => setType(e.target.value as AccountType)} className="input-field">
            <option value="checking">Checking</option>
            <option value="savings">Savings</option>
            <option value="credit">Credit</option>
          </select>
          <input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="Currency" className="input-field" />
          <button type="button" onClick={() => void handleAdd()} className="btn-primary w-full">Save</button>
        </div>
      )}

      <div className="space-y-2">
        {accounts.map((a) => (
          <div key={a.id} className="flex items-center justify-between rounded-xl bg-surface-container p-4">
            <div>
              <p className="font-medium">{a.name}</p>
              <p className="text-sm text-ink-muted">{a.bankName} · {a.type}</p>
            </div>
            <button type="button" onClick={() => void handleArchive(a.id!)} aria-label="Archive" className="text-ink-muted hover:text-danger">
              <Archive size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
