import { useEffect, useRef, type ReactNode } from 'react';
import { Header, TabBar } from './TabBar';
import { ToastLayer } from '../shared/ToastLayer';
import { PWAUpdatePrompt } from './PWAUpdatePrompt';
import { useApp } from '../../store/appStore';
import { useToasts } from '../../store/toastStore';
import { repo } from '../../store/db';
import { pullState, pushState } from '../../utils/sync';
import { KV } from '../../config/kv';
import { debounce } from '../../utils/helpers';

const AUTO_SYNC_MS = 3000;

export function AppShell({ children }: { children: ReactNode }): JSX.Element {
  const dataVersion = useApp((s) => s.dataVersion);
  const addToast = useToasts((s) => s.addToast);
  const pushRef = useRef(debounce(() => {
    void pushState().then((r) => {
      if (!r.ok && r.error !== 'no_token') {
        addToast({ type: 'warning', message: 'Cloud sync failed', dedupeKey: 'sync-fail' });
      }
    });
  }, AUTO_SYNC_MS));

  useEffect(() => {
    void repo.seedCategoriesIfEmpty();
  }, []);

  useEffect(() => {
    let cancelled = false;
    void pullState().then((r) => {
      if (cancelled) return;
      if (r.imported) {
        addToast({ type: 'success', message: 'Restored newer data from cloud' });
        window.location.reload();
      }
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (dataVersion > 0 && KV.syncToken.read()) {
      pushRef.current();
    }
  }, [dataVersion]);

  return (
    <div className="min-h-dvh bg-surface text-ink">
      <Header />
      <main
        className="relative z-10 mx-auto max-w-lg"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 56px)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 72px)',
        }}
      >
        {children}
      </main>
      <TabBar />
      <ToastLayer />
      <PWAUpdatePrompt />
    </div>
  );
}
