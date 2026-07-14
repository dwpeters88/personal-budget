import { getStore } from '@netlify/blobs';
import type { Config } from '@netlify/functions';
// @ts-expect-error — plain .mjs helper without .d.ts
import { preflight, jsonResponse, corsHeaders, hasValidSyncToken, logError } from './_shared.mjs';

const STORE_NAME = 'budget-sync';
const BLOB_KEY = 'state';

export default async (request: Request): Promise<Response> => {
  const pre = preflight(request);
  if (pre) return pre;

  if (!hasValidSyncToken(request)) {
    return jsonResponse({ ok: false, error: 'unauthorized' }, 401, request);
  }

  const store = getStore(STORE_NAME);

  if (request.method === 'POST') {
    try {
      const body = await request.text();
      const parsed = JSON.parse(body);
      if (!Array.isArray(parsed.transactions)) {
        return jsonResponse({ ok: false, error: 'invalid_format' }, 400, request);
      }
      await store.set(BLOB_KEY, body);
      return jsonResponse({ ok: true, savedAt: new Date().toISOString() }, 200, request);
    } catch (e) {
      logError('sync', e);
      return jsonResponse({ ok: false, error: 'invalid_json' }, 400, request);
    }
  }

  try {
    const data = await store.get(BLOB_KEY);
    if (!data) {
      return jsonResponse({ ok: false, error: 'no_data' }, 404, request);
    }
    return new Response(data, {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(request) },
    });
  } catch (e) {
    logError('sync', e);
    return jsonResponse({ ok: false, error: 'read_failed' }, 500, request);
  }
};

export const config: Config = {
  path: '/api/sync',
};
