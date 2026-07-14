export type AccountType = 'checking' | 'savings' | 'credit';
export type CategoryType = 'income' | 'expense';
export type MatchType = 'contains' | 'startsWith' | 'regex';
export type RecurringFrequency = 'weekly' | 'monthly' | 'yearly';

export interface ColumnMapping {
  date: string;
  description: string;
  amount?: string;
  debit?: string;
  credit?: string;
  skipRows?: number;
}

export interface Account {
  id?: number;
  name: string;
  bankName: string;
  type: AccountType;
  currency: string;
  color?: string;
  icon?: string;
  archived: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BankProfile {
  id?: number;
  name: string;
  delimiter: string;
  dateFormat: string;
  columnMapping: ColumnMapping;
  createdAt: Date;
}

export interface Transaction {
  id?: number;
  accountId: number;
  date: string;
  description: string;
  amount: number;
  categoryId?: number;
  importBatchId?: number;
  dedupeHash: string;
  notes?: string;
  createdAt: Date;
}

export interface Category {
  id?: number;
  name: string;
  type: CategoryType;
  parentId?: number;
  archived: number;
  createdAt: Date;
}

export interface Budget {
  id?: number;
  categoryId: number;
  monthKey: string;
  limit: number;
  createdAt: Date;
}

export interface CategorizationRule {
  id?: number;
  pattern: string;
  matchType: MatchType;
  categoryId: number;
  priority: number;
  enabled: number;
  createdAt: Date;
}

export interface RecurringTemplate {
  id?: number;
  name: string;
  categoryId: number;
  amount: number;
  frequency: RecurringFrequency;
  nextDueDate: string;
  enabled: number;
  createdAt: Date;
}

export interface ImportBatch {
  id?: number;
  accountId: number;
  bankProfileId: number;
  importedAt: Date;
  filename: string;
  rowCount: number;
  newCount: number;
  duplicateCount: number;
}

export interface Backup {
  id?: number;
  data: string;
  createdAt: Date;
}

export type ViewId =
  | 'dashboard'
  | 'accounts'
  | 'import'
  | 'transactions'
  | 'categories'
  | 'budgets'
  | 'rules'
  | 'recurring'
  | 'reports'
  | 'settings';

export interface ParsedCsvRow {
  date: string;
  description: string;
  amount: number;
  raw: Record<string, string>;
}

export interface DedupResult {
  newRows: ParsedCsvRow[];
  duplicates: ParsedCsvRow[];
}

export interface BudgetSummary {
  categoryId: number;
  categoryName: string;
  limit: number;
  spent: number;
  remaining: number;
  percentUsed: number;
}

export interface MissedRecurring {
  template: RecurringTemplate;
  expectedDate: string;
}

export interface AppBackupPayload {
  schemaVersion: number;
  exportedAt: string;
  accounts: Account[];
  bankProfiles: BankProfile[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  categorizationRules: CategorizationRule[];
  recurringTemplates: RecurringTemplate[];
  importBatches: ImportBatch[];
}
