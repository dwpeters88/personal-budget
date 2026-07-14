export interface Accessor<T> {
  readonly key: string;
  read(): T;
  write(value: T): void;
  remove(): void;
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* quota */
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function stringKey(key: string, defaultValue = ''): Accessor<string> {
  return {
    key,
    read: () => safeGet(key) ?? defaultValue,
    write: (v) => safeSet(key, v),
    remove: () => safeRemove(key),
  };
}

export function boolKey(key: string, defaultValue = false): Accessor<boolean> {
  return {
    key,
    read: () => {
      const raw = safeGet(key);
      if (raw == null) return defaultValue;
      return raw === 'true';
    },
    write: (v) => safeSet(key, String(v)),
    remove: () => safeRemove(key),
  };
}

export const KV = {
  syncToken: stringKey('pb_sync_token'),
  lastSyncAt: stringKey('pb_last_sync_at'),
  selectedMonth: stringKey('pb_selected_month'),
} as const;

export function clearAppStorage(): void {
  for (const accessor of Object.values(KV)) {
    accessor.remove();
  }
}
