import { useApp } from '../../store/appStore';
import type { ViewId } from '../../types';
import { LayoutDashboard, Upload, List, PiggyBank, Settings } from 'lucide-react';

const TABS: { view: ViewId; icon: typeof LayoutDashboard; label: string }[] = [
  { view: 'dashboard', icon: LayoutDashboard, label: 'Home' },
  { view: 'transactions', icon: List, label: 'Ledger' },
  { view: 'import', icon: Upload, label: 'Import' },
  { view: 'budgets', icon: PiggyBank, label: 'Budgets' },
  { view: 'settings', icon: Settings, label: 'More' },
];

const MORE_VIEWS: ViewId[] = ['accounts', 'categories', 'rules', 'recurring', 'reports'];

export function TabBar(): JSX.Element {
  const { currentView, navigate } = useApp();
  const moreActive = MORE_VIEWS.includes(currentView);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-surface-container-high bg-surface/95 backdrop-blur print:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
        {TABS.map(({ view, icon: Icon, label }) => {
          const active = view === 'settings' ? moreActive || currentView === 'settings' : currentView === view;
          return (
            <button
              key={view}
              type="button"
              onClick={() => navigate(view)}
              className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-xs transition-colors ${
                active ? 'text-primary' : 'text-ink-muted hover:text-ink'
              }`}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={20} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function Header(): JSX.Element {
  const { currentView } = useApp();
  const titles: Record<ViewId, string> = {
    dashboard: 'Dashboard',
    accounts: 'Accounts',
    import: 'Import CSV',
    transactions: 'Transactions',
    categories: 'Categories',
    budgets: 'Budgets',
    rules: 'Rules',
    recurring: 'Recurring',
    reports: 'Reports',
    settings: 'Settings',
  };

  return (
    <header
      className="fixed left-0 right-0 top-0 z-40 border-b border-surface-container-high bg-surface/95 backdrop-blur"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="mx-auto flex h-14 max-w-lg items-center px-4">
        <h1 className="text-lg font-semibold">{titles[currentView]}</h1>
      </div>
    </header>
  );
}
