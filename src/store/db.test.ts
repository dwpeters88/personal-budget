import { describe, it, expect, beforeEach } from 'vitest';
import { repo } from '../store/db';

describe('repo export/import', () => {
  beforeEach(async () => {
    await repo.clearAll();
    await repo.seedCategoriesIfEmpty();
  });

  it('exports and imports round-trip', async () => {
    const accountId = await repo.addAccount({
      name: 'Test', bankName: 'Bank', type: 'checking', currency: 'USD', archived: 0,
    });
    const json = await repo.exportAll();
    await repo.clearAll();
    const result = await repo.importAll(json);
    expect(result.counts.accounts).toBe(1);
    const accounts = await repo.getAccounts();
    expect(accounts[0]?.name).toBe('Test');
    expect(accountId).toBeTruthy();
  });
});
