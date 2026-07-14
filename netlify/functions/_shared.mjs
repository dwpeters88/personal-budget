// Shared helpers for Netlify Functions.

function resolveAllowedOrigin(req) {
  const siteUrl = (typeof Netlify !== 'undefined' && Netlify.env?.get('URL')) || '';
  const requestOrigin = req.headers.get('origin') ?? '';

  if (requestOrigin && siteUrl && requestOrigin === siteUrl) return requestOrigin;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(requestOrigin)) return requestOrigin;
  return siteUrl || '';
}

export function corsHeaders(req) {
  return {
    'Access-Control-Allow-Origin': resolveAllowedOrigin(req),
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Budget-Sync-Token',
    Vary: 'Origin',
  };
}

export function jsonResponse(data, status, req) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(req),
    },
  });
}

export function preflight(req) {
  if (req.method !== 'OPTIONS') return null;
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}

export function hasValidSyncToken(req) {
  const expected = (typeof Netlify !== 'undefined' && Netlify.env?.get('BUDGET_SYNC_TOKEN')) || '';
  if (!expected) return false;
  const provided = req.headers.get('x-budget-sync-token') ?? '';
  return provided.length > 0 && provided === expected;
}

export function logError(fn, err) {
  console.error(`[${fn}]`, err instanceof Error ? err.message : err);
}
