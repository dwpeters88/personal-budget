# Personal Budget

Local-first personal budget PWA: track accounts, categories, monthly budgets, and transactions in the browser (IndexedDB via Dexie). Optional cloud sync stores a JSON snapshot on Netlify Blobs.

**Live app:** https://personal-budget-dwp.netlify.app

## Local development

```bash
npm install
npm run dev
```

Open the URL Vite prints (typically http://localhost:5173). Data stays in your browser unless you enable sync.

## Cloud sync

Sync uses `/api/sync` with a shared secret:

1. In [Netlify](https://app.netlify.com/) → site **personal-budget-dwp** → **Project configuration** → **Environment variables**, set `BUDGET_SYNC_TOKEN` to a strong random value (production, deploy previews, and branch deploys should all use the same token).
2. Redeploy after changing env vars so serverless functions pick up the new value.
3. In the app, open **Settings**, paste the same token under **Sync token**, and save.
4. Use **Push to cloud** / **Pull from cloud** to upload or download your budget state.

The API rejects requests without a matching `X-Budget-Sync-Token` header (401).

## CSV import

1. Create at least one **Account** (Settings → Accounts, or the Accounts view).
2. Open **Import** from the main navigation.
3. Choose the account, upload a bank CSV, map date/description/amount columns (or pick a saved bank profile), preview new vs duplicate rows, then confirm import.

Imported transactions are deduplicated per account; categorization rules can run on import.
