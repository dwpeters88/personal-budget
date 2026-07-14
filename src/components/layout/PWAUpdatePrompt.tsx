import { useEffect, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useToasts } from '../../store/toastStore';

export function PWAUpdatePrompt(): null {
  const addToast = useToasts((s) => s.addToast);
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(err) {
      console.warn('[pwa] sw register error', err);
    },
  });

  const toastedRef = useRef<'update' | 'offline' | null>(null);

  useEffect(() => {
    if (needRefresh && toastedRef.current !== 'update') {
      toastedRef.current = 'update';
      addToast({
        type: 'info',
        message: 'New version available',
        action: {
          label: 'Reload',
          onClick: () => {
            void updateServiceWorker(true);
            setNeedRefresh(false);
          },
        },
      });
    }
  }, [needRefresh, addToast, setNeedRefresh, updateServiceWorker]);

  useEffect(() => {
    if (offlineReady && toastedRef.current !== 'offline') {
      toastedRef.current = 'offline';
      addToast({ type: 'success', message: 'Ready to work offline' });
      setOfflineReady(false);
    }
  }, [offlineReady, addToast, setOfflineReady]);

  return null;
}
