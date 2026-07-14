import { useState } from 'react';
import { Cloud, CloudUpload, CloudDownload, Wallet, Tags, Wand2, Repeat, BarChart3 } from 'lucide-react';
import { useApp } from '../store/appStore';
import { useToasts } from '../store/toastStore';
import { KV } from '../config/kv';
import { pushState, pullState } from '../utils/sync';
import { repo } from '../store/db';
import type { ViewId } from '../types';

const MORE_LINKS: { view: ViewId; icon: typeof Wallet; label: string }[] = [
  { view: 'accounts', icon: Wallet, label: 'Accounts' },
  { view: 'categories', icon: Tags, label: 'Categories' },
  { view: 'rules', icon: Wand2, label: 'Categorization rules' },
  { view: 'recurring', icon: Repeat, label: 'Recurring' },
  { view: 'reports', icon: BarChart3, label: 'Reports' },
];

export function SettingsView(): JSX.Element {
  const navigate = useApp((s) => s.navigate);
  const bump = useApp((s) => s.bumpDataVersion);
  const addToast = useToasts((s) => s.addToast);
  const [token, setToken] = useState(KV.syncToken.read());
  const [syncing, setSyncing] = useState(false);
  const lastSync = KV.lastSyncAt.read();

  const saveToken = (): void => {
    KV.syncToken.write(token.trim());
    addToast({ type: 'success', message: 'Sync token saved' });
  };

  const handlePush = async (): Promise<void> => {
    setSyncing(true);
    const r = await pushState();
    setSyncing(false);
    if (r.ok) addToast({ type: 'success', message: 'Pushed to cloud' });
    else addToast({ type: 'error', message: r.error ?? 'Push failed' });
  };

  const handlePull = async (): Promise<void> => {
    setSyncing(true);
    const r = await pullState();
    setSyncing(false);
    if (r.ok) {
      addToast({ type: 'success', message: r.imported ? 'Pulled newer data' : 'Already up to date' });
      if (r.imported) window.location.reload();
      else bump();
    } else {
      addToast({ type: 'error', message: r.error ?? 'Pull failed' });
    }
  };

  const handleImportBackup = async (file: File): Promise<void> => {
    const text = await file.text();
    await repo.clearAll();
    await repo.importAll(text);
    bump();
    addToast({ type: 'success', message: 'Backup restored' });
    window.location.reload();
  };

  return (
    <div className="space-y-4 p-4">
      <section className="rounded-xl bg-surface-container p-4">
        <h2 className="mb-3 flex items-center gap-2 font-medium"><Cloud size={18} /> Cloud sync</h2>
        <p className="mb-3 text-xs text-ink-muted">
          Set BUDGET_SYNC_TOKEN in Netlify, then enter the same token here.
        </p>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Sync token"
          className="input-field mb-2"
        />
        <button type="button" onClick={saveToken} className="btn-primary mb-3 w-full">Save token</button>
        <div className="flex gap-2">
          <button type="button" onClick={() => void handlePush()} disabled={syncing} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-surface py-2 text-sm">
            <CloudUpload size={16} /> Push
          </button>
          <button type="button" onClick={() => void handlePull()} disabled={syncing} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-surface py-2 text-sm">
            <CloudDownload size={16} /> Pull
          </button>
        </div>
        {lastSync && <p className="mt-2 text-xs text-ink-muted">Last sync: {new Date(lastSync).toLocaleString()}</p>}
      </section>

      <section className="rounded-xl bg-surface-container p-4">
        <h2 className="mb-2 font-medium">Restore backup</h2>
        <input type="file" accept=".json" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleImportBackup(f); }} />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-ink-muted">More</h2>
        <div className="space-y-1">
          {MORE_LINKS.map(({ view, icon: Icon, label }) => (
            <button
              key={view}
              type="button"
              onClick={() => navigate(view)}
              className="flex w-full items-center gap-3 rounded-xl bg-surface-container px-4 py-3 text-left"
            >
              <Icon size={18} className="text-primary" />
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl bg-surface-container p-4 text-xs text-ink-muted">
        <p>Personal Budget v{__APP_VERSION__}</p>
        <p>Build {__BUILD_DATE__}</p>
        <p className="mt-2">Install this app from your browser menu for offline access.</p>
      </section>
    </div>
  );
}
