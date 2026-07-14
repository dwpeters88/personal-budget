import { KV } from '../config/kv';
import { repo } from '../store/db';

const SYNC_URL = '/api/sync';

export interface SyncResult {
  ok: boolean;
  savedAt?: string;
  error?: string;
}

function syncHeaders(): HeadersInit {
  const token = KV.syncToken.read();
  return {
    'Content-Type': 'application/json',
    'X-Budget-Sync-Token': token,
  };
}

export async function pushState(): Promise<SyncResult> {
  if (!KV.syncToken.read()) {
    return { ok: false, error: 'no_token' };
  }
  try {
    const body = await repo.exportAll();
    const res = await fetch(SYNC_URL, {
      method: 'POST',
      headers: syncHeaders(),
      body,
    });
    const data = (await res.json()) as { ok: boolean; savedAt?: string; error?: string };
    if (data.ok && data.savedAt) {
      KV.lastSyncAt.write(data.savedAt);
    }
    return data;
  } catch {
    return { ok: false, error: 'network' };
  }
}

export async function pullState(): Promise<SyncResult & { imported?: boolean }> {
  if (!KV.syncToken.read()) {
    return { ok: false, error: 'no_token' };
  }
  try {
    const res = await fetch(SYNC_URL, { headers: syncHeaders() });
    if (res.status === 404) {
      return { ok: true, imported: false };
    }
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      return { ok: false, error: data.error ?? 'pull_failed' };
    }
    const text = await res.text();
    const parsed = JSON.parse(text) as { exportedAt?: string };
    const localBackup = await repo.getLatestBackup();
    const cloudTime = parsed.exportedAt ? new Date(parsed.exportedAt).getTime() : 0;
    const localTime = localBackup?.createdAt ? new Date(localBackup.createdAt).getTime() : 0;

    if (cloudTime > localTime) {
      await repo.clearAll();
      await repo.importAll(text);
      await repo.putBackup(text);
      KV.lastSyncAt.write(parsed.exportedAt ?? new Date().toISOString());
      return { ok: true, imported: true, savedAt: parsed.exportedAt };
    }

    return { ok: true, imported: false, savedAt: parsed.exportedAt };
  } catch {
    return { ok: false, error: 'network' };
  }
}

export async function getCloudSavedAt(): Promise<string | null> {
  if (!KV.syncToken.read()) return null;
  try {
    const res = await fetch(SYNC_URL, { headers: syncHeaders() });
    if (!res.ok) return null;
    const text = await res.text();
    const parsed = JSON.parse(text) as { exportedAt?: string };
    return parsed.exportedAt ?? null;
  } catch {
    return null;
  }
}
