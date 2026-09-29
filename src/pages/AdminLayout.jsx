import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Menu, X, Home, Clock, Wallet, Users, CreditCard, ListChecks, Gift, UserCircle, Globe, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/*
  Shell for the admin area: a hamburger-triggered side drawer with links
  to every admin sub-page, plus the shared header (brand, language
  toggle, sign out). Sub-pages render inside <Outlet /> and read the
  current locale via useOutletContext().
*/

const copy = {
  en: {
    brand: 'ALM Platform',
    switchLanguage: 'العربية',
    navOverview: 'Overview',
    navApprovals: 'Pending approvals',
    navWithdrawals: 'Pending withdrawals',
    navTeam: 'Team & roles',
    navRecordPayment: 'Record a payment',
    navPaymentsLog: 'Payments log',
    navRewards: 'Manage rewards',
    navInvestors: 'Investors',
  },
  ar: {
    brand: 'منصّة ALM',
    switchLanguage: 'English',
    navOverview: 'الرئيسية',
    navApprovals: 'حسابات بانتظار الموافقة',
    navWithdrawals: 'طلبات سحب النقاط المعلّقة',
    navTeam: 'الفريق والأدوار',
    navRecordPayment: 'تسجيل دفعة',
    navPaymentsLog: 'سجل الدفعات',
    navRewards: 'إدارة الجوائز',
    navInvestors: 'المستثمرين',
  },
};

const navItems = [
  { to: '/admin', end: true, icon: Home, label: 'navOverview' },
  { to: '/admin/approvals', icon: Clock, label: 'navApprovals' },
  { to: '/admin/withdrawals', icon: Wallet, label: 'navWithdrawals' },
  { to: '/admin/team', icon: Users, label: 'navTeam' },
  { to: '/admin/record-payment', icon: CreditCard, label: 'navRecordPayment' },
  { to: '/admin/payments', icon: ListChecks, label: 'navPaymentsLog' },
  { to: '/admin/rewards', icon: Gift, label: 'navRewards' },
  { to: '/admin/investors', icon: UserCircle, label: 'navInvestors' },
];

export default function AdminLayout() {
  const { signOut, profile } = useAuth();
  const [locale, setLocale] = useState('en');
  const [menuOpen, setMenuOpen] = useState(false);

  const t = copy[locale];
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <div dir={dir} lang={locale} className="min-h-screen bg-slate-950 font-sans text-slate-50">
      <header className="border-b border-slate-800 bg-slate-900 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="rounded-md p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-amber-400 font-semibold tracking-tight text-lg">{t.brand}</div>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
              className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <Globe className="w-4 h-4" />
              {t.switchLanguage}
            </button>
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm font-medium text-slate-300">
              {(profile?.full_name || 'A').charAt(0)}
            </div>
            <button
              type="button"
              onClick={signOut}
              aria-label="Sign out"
              className="rounded-md p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-30 flex" style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row' }}>
          <div className="w-72 max-w-[80vw] bg-slate-900 border-e border-slate-800 h-full overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800">
              <span className="text-amber-400 font-semibold">{t.brand}</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="rounded-md p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-3 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive ? 'bg-amber-400/10 text-amber-400' : 'text-slate-300 hover:bg-slate-800'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {t[item.label]}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex-1 bg-slate-950/60" onClick={() => setMenuOpen(false)} />
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Outlet context={{ locale }} />
      </main>
    </div>
  );
}
