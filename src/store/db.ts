import Dexie, { type Table } from 'dexie';
import type {
  Account,
  AppBackupPayload,
  Backup,
  BankProfile,
  Budget,
  CategorizationRule,
  Category,
  ImportBatch,
  RecurringTemplate,
  Transaction,
} from '../types';

export const CURRENT_SCHEMA_VERSION = 1;

const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'createdAt'>[] = [
  { name: 'Salary', type: 'income', archived: 0 },
  { name: 'Freelance', type: 'income', archived: 0 },
  { name: 'Other Income', type: 'income', archived: 0 },
  { name: 'Groceries', type: 'expense', archived: 0 },
  { name: 'Dining Out', type: 'expense', archived: 0 },
  { name: 'Transport', type: 'expense', archived: 0 },
  { name: 'Utilities', type: 'expense', archived: 0 },
  { name: 'Rent', type: 'expense', archived: 0 },
  { name: 'Entertainment', type: 'expense', archived: 0 },
  { name: 'Healthcare', type: 'expense', archived: 0 },
  { name: 'Shopping', type: 'expense', archived: 0 },
  { name: 'Subscriptions', type: 'expense', archived: 0 },
  { name: 'Savings Transfer', type: 'expense', archived: 0 },
  { name: 'Uncategorized', type: 'expense', archived: 0 },
];

class PersonalBudgetDB extends Dexie {
  accounts!: Table<Account, number>;
  bankProfiles!: Table<BankProfile, number>;
  transactions!: Table<Transaction, number>;
  categories!: Table<Category, number>;
  budgets!: Table<Budget, number>;
  categorizationRules!: Table<CategorizationRule, number>;
  recurringTemplates!: Table<RecurringTemplate, number>;
  importBatches!: Table<ImportBatch, number>;
  backups!: Table<Backup, number>;

  constructor() {
    super('PersonalBudgetDB');
    this.version(1).stores({
      accounts: '++id, name, bankName, type, currency, archived',
      bankProfiles: '++id, name',
      transactions: '++id, accountId, date, categoryId, importBatchId, dedupeHash',
      categories: '++id, name, type, parentId, archived',
      budgets: '++id, categoryId, monthKey, [categoryId+monthKey]',
      categorizationRules: '++id, priority, enabled',
      recurringTemplates: '++id, categoryId, frequency, nextDueDate, enabled',
      importBatches: '++id, accountId, bankProfileId, importedAt',
      backups: '++id, createdAt',
    });
  }
}

const db = new PersonalBudgetDB();

export const EXPORTABLE_TABLES = [
  'accounts',
  'bankProfiles',
  'transactions',
  'categories',
  'budgets',
  'categorizationRules',
  'recurringTemplates',
  'importBatches',
] as const;

export type ExportableTableName = (typeof EXPORTABLE_TABLES)[number];

const DATA_TABLES = [
  db.accounts,
  db.bankProfiles,
  db.transactions,
  db.categories,
  db.budgets,
  db.categorizationRules,
  db.recurringTemplates,
  db.importBatches,
] as const;

export const repo = {
  async seedCategoriesIfEmpty(): Promise<void> {
    const count = await db.categories.count();
    if (count > 0) return;
    const now = new Date();
    await db.categories.bulkAdd(
      DEFAULT_CATEGORIES.map((c) => ({ ...c, createdAt: now })),
    );
  },

  async getAccounts(): Promise<Account[]> {
    return db.accounts.orderBy('name').toArray();
  },
  async getActiveAccounts(): Promise<Account[]> {
    return db.accounts.where('archived').equals(0).sortBy('name');
  },
  async getAccount(id: number): Promise<Account | undefined> {
    return db.accounts.get(id);
  },
  async addAccount(data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const now = new Date();
    return db.accounts.add({ ...data, createdAt: now, updatedAt: now });
  },
  async updateAccount(id: number, changes: Partial<Account>): Promise<void> {
    await db.accounts.update(id, { ...changes, updatedAt: new Date() });
  },
  async archiveAccount(id: number): Promise<void> {
    await db.accounts.update(id, { archived: 1, updatedAt: new Date() });
  },

  async getBankProfiles(): Promise<BankProfile[]> {
    return db.bankProfiles.orderBy('name').toArray();
  },
  async getBankProfile(id: number): Promise<BankProfile | undefined> {
    return db.bankProfiles.get(id);
  },
  async addBankProfile(data: Omit<BankProfile, 'id' | 'createdAt'>): Promise<number> {
    return db.bankProfiles.add({ ...data, createdAt: new Date() });
  },
  async updateBankProfile(id: number, changes: Partial<BankProfile>): Promise<void> {
    await db.bankProfiles.update(id, changes);
  },
  async deleteBankProfile(id: number): Promise<void> {
    await db.bankProfiles.delete(id);
  },

  async getTransactions(): Promise<Transaction[]> {
    return db.transactions.orderBy('date').reverse().toArray();
  },
  async getTransactionsByAccount(accountId: number): Promise<Transaction[]> {
    return db.transactions.where('accountId').equals(accountId).reverse().sortBy('date');
  },
  async getTransactionsByMonth(monthKey: string): Promise<Transaction[]> {
    const txs = await db.transactions.toArray();
    return txs.filter((t) => t.date.startsWith(monthKey)).sort((a, b) => b.date.localeCompare(a.date));
  },
  async getTransactionHashesForAccount(accountId: number): Promise<Set<string>> {
    const txs = await db.transactions.where('accountId').equals(accountId).toArray();
    return new Set(txs.map((t) => t.dedupeHash));
  },
  async addTransactions(txs: Omit<Transaction, 'id' | 'createdAt'>[]): Promise<void> {
    const now = new Date();
    await db.transactions.bulkAdd(txs.map((t) => ({ ...t, createdAt: now })));
  },
  async updateTransaction(id: number, changes: Partial<Transaction>): Promise<void> {
    await db.transactions.update(id, changes);
  },
  async bulkUpdateTransactions(ids: number[], changes: Partial<Transaction>): Promise<void> {
    await db.transaction('rw', db.transactions, async () => {
      for (const id of ids) {
        await db.transactions.update(id, changes);
      }
    });
  },
  async deleteTransaction(id: number): Promise<void> {
    await db.transactions.delete(id);
  },

  async getCategories(): Promise<Category[]> {
    return db.categories.orderBy('name').toArray();
  },
  async getActiveCategories(): Promise<Category[]> {
    return db.categories.where('archived').equals(0).sortBy('name');
  },
  async addCategory(data: Omit<Category, 'id' | 'createdAt'>): Promise<number> {
    return db.categories.add({ ...data, createdAt: new Date() });
  },
  async updateCategory(id: number, changes: Partial<Category>): Promise<void> {
    await db.categories.update(id, changes);
  },
  async archiveCategory(id: number): Promise<void> {
    await db.categories.update(id, { archived: 1 });
  },

  async getBudgetsForMonth(monthKey: string): Promise<Budget[]> {
    return db.budgets.where('monthKey').equals(monthKey).toArray();
  },
  async upsertBudget(data: Omit<Budget, 'id' | 'createdAt'>): Promise<number> {
    const all = await db.budgets.where('monthKey').equals(data.monthKey).toArray();
    const existing = all.find((b) => b.categoryId === data.categoryId);
    if (existing?.id) {
      await db.budgets.update(existing.id, { limit: data.limit });
      return existing.id;
    }
    return db.budgets.add({ ...data, createdAt: new Date() });
  },
  async copyBudgetsFromMonth(fromKey: string, toKey: string): Promise<number> {
    const source = await db.budgets.where('monthKey').equals(fromKey).toArray();
    const dest = await db.budgets.where('monthKey').equals(toKey).toArray();
    const destCats = new Set(dest.map((b) => b.categoryId));
    let copied = 0;
    for (const b of source) {
      if (destCats.has(b.categoryId)) continue;
      await db.budgets.add({
        categoryId: b.categoryId,
        monthKey: toKey,
        limit: b.limit,
        createdAt: new Date(),
      });
      copied++;
    }
    return copied;
  },

  async getRules(): Promise<CategorizationRule[]> {
    return db.categorizationRules.orderBy('priority').toArray();
  },
  async getEnabledRules(): Promise<CategorizationRule[]> {
    return db.categorizationRules.where('enabled').equals(1).sortBy('priority');
  },
  async addRule(data: Omit<CategorizationRule, 'id' | 'createdAt'>): Promise<number> {
    return db.categorizationRules.add({ ...data, createdAt: new Date() });
  },
  async updateRule(id: number, changes: Partial<CategorizationRule>): Promise<void> {
    await db.categorizationRules.update(id, changes);
  },
  async deleteRule(id: number): Promise<void> {
    await db.categorizationRules.delete(id);
  },

  async getRecurringTemplates(): Promise<RecurringTemplate[]> {
    return db.recurringTemplates.orderBy('name').toArray();
  },
  async getEnabledRecurring(): Promise<RecurringTemplate[]> {
    return db.recurringTemplates.where('enabled').equals(1).sortBy('name');
  },
  async addRecurring(data: Omit<RecurringTemplate, 'id' | 'createdAt'>): Promise<number> {
    return db.recurringTemplates.add({ ...data, createdAt: new Date() });
  },
  async updateRecurring(id: number, changes: Partial<RecurringTemplate>): Promise<void> {
    await db.recurringTemplates.update(id, changes);
  },
  async deleteRecurring(id: number): Promise<void> {
    await db.recurringTemplates.delete(id);
  },

  async addImportBatch(data: Omit<ImportBatch, 'id'>): Promise<number> {
    return db.importBatches.add(data);
  },
  async getImportBatches(): Promise<ImportBatch[]> {
    return db.importBatches.orderBy('importedAt').reverse().toArray();
  },

  async putBackup(data: string): Promise<number> {
    return db.backups.add({ data, createdAt: new Date() });
  },
  async getLatestBackup(): Promise<Backup | undefined> {
    return db.backups.orderBy('createdAt').reverse().first();
  },

  async exportAll(): Promise<string> {
    const [
      accounts, bankProfiles, transactions, categories, budgets,
      categorizationRules, recurringTemplates, importBatches,
    ] = await Promise.all([
      db.accounts.toArray(),
      db.bankProfiles.toArray(),
      db.transactions.toArray(),
      db.categories.toArray(),
      db.budgets.toArray(),
      db.categorizationRules.toArray(),
      db.recurringTemplates.toArray(),
      db.importBatches.toArray(),
    ]);
    const payload: AppBackupPayload = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      accounts,
      bankProfiles,
      transactions,
      categories,
      budgets,
      categorizationRules,
      recurringTemplates,
      importBatches,
    };
    return JSON.stringify(payload, null, 2);
  },

  async importAll(json: string): Promise<{
    counts: Record<ExportableTableName, number>;
    legacy: boolean;
    missingTables: ExportableTableName[];
    schemaVersion: number;
  }> {
    const data = JSON.parse(json) as Partial<AppBackupPayload> & { schemaVersion?: number };
    const schemaVersion = typeof data.schemaVersion === 'number' ? data.schemaVersion : 0;
    const legacy = schemaVersion < CURRENT_SCHEMA_VERSION;
    const missingTables = EXPORTABLE_TABLES.filter((t) => !Array.isArray(data[t]));

    await db.transaction('rw', DATA_TABLES, async () => {
      if (data.accounts) await db.accounts.bulkPut(data.accounts);
      if (data.bankProfiles) await db.bankProfiles.bulkPut(data.bankProfiles);
      if (data.transactions) await db.transactions.bulkPut(data.transactions);
      if (data.categories) await db.categories.bulkPut(data.categories);
      if (data.budgets) await db.budgets.bulkPut(data.budgets);
      if (data.categorizationRules) await db.categorizationRules.bulkPut(data.categorizationRules);
      if (data.recurringTemplates) await db.recurringTemplates.bulkPut(data.recurringTemplates);
      if (data.importBatches) await db.importBatches.bulkPut(data.importBatches);
    });

    const counts = Object.fromEntries(
      EXPORTABLE_TABLES.map((t) => [t, Array.isArray(data[t]) ? (data[t] as unknown[]).length : 0]),
    ) as Record<ExportableTableName, number>;

    return { counts, legacy, missingTables, schemaVersion };
  },

  async clearAll(): Promise<void> {
    await db.transaction('rw', DATA_TABLES, async () => {
      await Promise.all(DATA_TABLES.map((t) => t.clear()));
    });
  },

  async accountCount(): Promise<number> {
    return db.accounts.where('archived').equals(0).count();
  },

  async transactionCount(): Promise<number> {
    return db.transactions.count();
  },

  async getAccountBalance(accountId: number): Promise<number> {
    const txs = await db.transactions.where('accountId').equals(accountId).toArray();
    return txs.reduce((sum, t) => sum + t.amount, 0);
  },
};
