import { useToasts } from '../../store/toastStore';

export function ToastLayer(): JSX.Element {
  const toasts = useToasts((s) => s.toasts);
  const removeToast = useToasts((s) => s.removeToast);

  if (toasts.length === 0) return <></>;

  const colors: Record<string, string> = {
    success: 'border-success/50 bg-success/10',
    error: 'border-danger/50 bg-danger/10',
    info: 'border-primary/50 bg-primary/10',
    warning: 'border-warning/50 bg-warning/10',
  };

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur ${colors[t.type]}`}
        >
          <div className="flex items-center justify-between gap-3">
            <span>{t.message}</span>
            <div className="flex gap-2">
              {t.action && (
                <button
                  type="button"
                  onClick={t.action.onClick}
                  className="font-semibold text-primary hover:underline"
                >
                  {t.action.label}
                </button>
              )}
              <button type="button" onClick={() => removeToast(t.id)} className="text-ink-muted">
                ×
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
