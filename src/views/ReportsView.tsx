import { useLiveQuery } from 'dexie-react-hooks';
import { Download } from 'lucide-react';
import { useApp } from '../store/appStore';
import { repo } from '../store/db';
import { totalIncomeForMonth, totalSpentForMonth } from '../engines/budget';
import { formatCurrency, formatMonthKey } from '../utils/helpers';

export function ReportsView(): JSX.Element {
  const { selectedMonth } = useApp();
  const transactions = useLiveQuery(() => repo.getTransactionsByMonth(selectedMonth), [selectedMonth]) ?? [];

  const income = totalIncomeForMonth(selectedMonth, transactions);
  const spent = totalSpentForMonth(selectedMonth, transactions);

  const exportTransactionsCsv = (): void => {
    const header = 'Date,Description,Amount,CategoryId,AccountId\n';
    const rows = transactions.map((t) =>
      `${t.date},"${t.description.replace(/"/g, '""')}",${t.amount},${t.categoryId ?? ''},${t.accountId}`,
    ).join('\n');
    downloadFile(`transactions-${selectedMonth}.csv`, header + rows, 'text/csv');
  };

  const exportBackupJson = async (): Promise<void> => {
    const data = await repo.exportAll();
    downloadFile(`budget-backup-${new Date().toISOString().slice(0, 10)}.json`, data, 'application/json');
  };

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-xl bg-surface-container p-4">
        <h2 className="mb-3 font-medium">{formatMonthKey(selectedMonth)} Summary</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-ink-muted">Income</p>
            <p className="text-lg text-success">{formatCurrency(income)}</p>
          </div>
          <div>
            <p className="text-ink-muted">Expenses</p>
            <p className="text-lg text-danger">{formatCurrency(spent)}</p>
          </div>
          <div className="col-span-2">
            <p className="text-ink-muted">Net</p>
            <p className="text-lg font-semibold">{formatCurrency(income - spent)}</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-ink-muted">{transactions.length} transactions</p>
      </div>

      <button type="button" onClick={exportTransactionsCsv} className="flex w-full items-center justify-center gap-2 rounded-xl bg-surface-container py-3">
        <Download size={18} /> Export transactions CSV
      </button>

      <button type="button" onClick={() => void exportBackupJson()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-surface-container py-3">
        <Download size={18} /> Export full backup JSON
      </button>
    </div>
  );
}

function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
