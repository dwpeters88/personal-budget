import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useApp } from '../store/appStore';
import { repo } from '../store/db';
import { parseCsvText, getCsvHeaders } from '../engines/csvParser';
import { computeDedupeHash, filterDuplicates } from '../engines/dedup';
import { categorizeDescription } from '../engines/categorize';
import type { BankProfile, ColumnMapping, ParsedCsvRow } from '../types';

type Step = 1 | 2 | 3 | 4;

export function ImportView(): JSX.Element {
  const bump = useApp((s) => s.bumpDataVersion);
  const accounts = useLiveQuery(() => repo.getActiveAccounts()) ?? [];
  const profiles = useLiveQuery(() => repo.getBankProfiles()) ?? [];
  const rules = useLiveQuery(() => repo.getEnabledRules()) ?? [];

  const [step, setStep] = useState<Step>(1);
  const [accountId, setAccountId] = useState<number | null>(null);
  const [profileId, setProfileId] = useState<number | null>(null);
  const [csvText, setCsvText] = useState('');
  const [newRows, setNewRows] = useState<ParsedCsvRow[]>([]);
  const [dupRows, setDupRows] = useState<ParsedCsvRow[]>([]);
  const [filename, setFilename] = useState('');

  const [newProfileName, setNewProfileName] = useState('');
  const [mapping, setMapping] = useState<ColumnMapping>({ date: '', description: '', amount: '' });
  const [dateFormat, setDateFormat] = useState('YYYY-MM-DD');
  const [delimiter] = useState(',');

  const handleFile = async (file: File): Promise<void> => {
    const text = await file.text();
    setCsvText(text);
    setFilename(file.name);
    const headers = getCsvHeaders(text, delimiter);
    setMapping((m) => ({
      ...m,
      date: headers.find((h) => /date/i.test(h)) ?? headers[0] ?? '',
      description: headers.find((h) => /desc|detail|memo/i.test(h)) ?? headers[1] ?? '',
      amount: headers.find((h) => /amount/i.test(h)) ?? '',
      debit: headers.find((h) => /debit/i.test(h)) ?? '',
      credit: headers.find((h) => /credit/i.test(h)) ?? '',
    }));
  };

  const handlePreview = async (): Promise<void> => {
    if (!accountId) return;
    const profile = profileId
      ? await repo.getBankProfile(profileId)
      : { delimiter, dateFormat, columnMapping: mapping } as Pick<BankProfile, 'delimiter' | 'dateFormat' | 'columnMapping'>;
    if (!profile) return;
    const parsed = parseCsvText(csvText, profile);
    const hashes = await repo.getTransactionHashesForAccount(accountId);
    const { newRows: fresh, duplicates } = await filterDuplicates(parsed, accountId, hashes);
    setNewRows(fresh);
    setDupRows(duplicates);
    setStep(4);
  };

  const handleCommit = async (): Promise<void> => {
    if (!accountId) return;
    let bankProfileId = profileId;
    if (!bankProfileId && newProfileName) {
      bankProfileId = await repo.addBankProfile({
        name: newProfileName,
        delimiter,
        dateFormat,
        columnMapping: mapping,
      });
    }
    if (!bankProfileId) return;

    const txs = await Promise.all(
      newRows.map(async (row) => ({
        accountId,
        date: row.date,
        description: row.description,
        amount: row.amount,
        categoryId: categorizeDescription(row.description, rules),
        importBatchId: undefined as number | undefined,
        dedupeHash: await computeDedupeHash(accountId, row.date, row.amount, row.description),
      })),
    );

    const batchId = await repo.addImportBatch({
      accountId,
      bankProfileId,
      importedAt: new Date(),
      filename,
      rowCount: newRows.length + dupRows.length,
      newCount: newRows.length,
      duplicateCount: dupRows.length,
    });

    await repo.addTransactions(txs.map((t) => ({ ...t, importBatchId: batchId })));
    bump();
    setStep(1);
    setCsvText('');
    setNewRows([]);
    setDupRows([]);
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex gap-2 text-sm">
        {[1, 2, 3, 4].map((s) => (
          <span key={s} className={`rounded-full px-2 py-0.5 ${step === s ? 'bg-primary text-surface' : 'bg-surface-container text-ink-muted'}`}>
            {s}
          </span>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-3">
          <p className="text-sm text-ink-muted">Select account</p>
          {accounts.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => { setAccountId(a.id!); setStep(2); }}
              className={`w-full rounded-xl p-4 text-left ${accountId === a.id ? 'bg-primary/20' : 'bg-surface-container'}`}
            >
              {a.name}
            </button>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <p className="text-sm text-ink-muted">Bank profile</p>
          {profiles.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => { setProfileId(p.id!); setStep(3); }}
              className="w-full rounded-xl bg-surface-container p-4 text-left"
            >
              {p.name}
            </button>
          ))}
          <div className="rounded-xl bg-surface-container p-4 space-y-2">
            <p className="text-sm font-medium">New profile</p>
            <input value={newProfileName} onChange={(e) => setNewProfileName(e.target.value)} placeholder="Profile name" className="input-field" />
            <select value={dateFormat} onChange={(e) => setDateFormat(e.target.value)} className="input-field">
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            </select>
            <button type="button" onClick={() => { setProfileId(null); setStep(3); }} className="btn-primary w-full">Continue</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <input type="file" accept=".csv" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }} />
          {!profileId && csvText && (
            <div className="space-y-2 rounded-xl bg-surface-container p-4">
              <p className="text-sm font-medium">Column mapping</p>
              {(['date', 'description', 'amount', 'debit', 'credit'] as const).map((col) => (
                <input
                  key={col}
                  value={mapping[col] ?? ''}
                  onChange={(e) => setMapping({ ...mapping, [col]: e.target.value })}
                  placeholder={col}
                  className="input-field"
                />
              ))}
            </div>
          )}
          {csvText && (
            <button type="button" onClick={() => void handlePreview()} className="btn-primary w-full">Preview import</button>
          )}
        </div>
      )}

      {step === 4 && (
        <div className="space-y-3">
          <p className="text-sm">{newRows.length} new · {dupRows.length} duplicates skipped</p>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {newRows.slice(0, 20).map((r, i) => (
              <div key={i} className="rounded-lg bg-surface-container px-3 py-2 text-sm">
                <span className="text-ink-muted">{r.date}</span> {r.description} <span className={r.amount < 0 ? 'text-danger' : 'text-success'}>{r.amount}</span>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => void handleCommit()} className="btn-primary w-full" disabled={newRows.length === 0}>
            Import {newRows.length} transactions
          </button>
        </div>
      )}
    </div>
  );
}
