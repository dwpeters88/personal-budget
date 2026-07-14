import { AppShell } from './components/layout/AppShell';
import { useApp } from './store/appStore';
import { DashboardView } from './views/DashboardView';
import { AccountsView } from './views/AccountsView';
import { ImportView } from './views/ImportView';
import { TransactionsView } from './views/TransactionsView';
import { CategoriesView } from './views/CategoriesView';
import { BudgetsView } from './views/BudgetsView';
import { RulesView } from './views/RulesView';
import { RecurringView } from './views/RecurringView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';
import type { ViewId } from './types';

const VIEWS: Record<ViewId, () => JSX.Element> = {
  dashboard: DashboardView,
  accounts: AccountsView,
  import: ImportView,
  transactions: TransactionsView,
  categories: CategoriesView,
  budgets: BudgetsView,
  rules: RulesView,
  recurring: RecurringView,
  reports: ReportsView,
  settings: SettingsView,
};

export default function App(): JSX.Element {
  const currentView = useApp((s) => s.currentView);
  const View = VIEWS[currentView];

  return (
    <AppShell>
      <View />
    </AppShell>
  );
}
