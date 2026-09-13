import { useState } from 'react';
import { Globe, Check, X, Users, TrendingUp, Clock, Wallet, Gift, Power, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/*
  Prototype admin dashboard for the ALM Platform.
  Data below is mocked so the screen is fully interactive as a preview —
  swap it out for real Supabase calls once this lives in your project:
  approve_account / reject_account, assign_advisor, decide_withdrawal_request,
  record_payment, and (for the rewards section) direct insert/update on the
  rewards table — admin-only per the "admin manage rewards" RLS policy, no
  RPC wrapper needed there.
*/

const copy = {
  en: {
    brand: 'ALM Platform',
    switchLanguage: 'العربية',
    welcomeAdmin: (name) => `Welcome back, ${name}`,
    statTotalInvestors: 'Total investors',
    statTotalInvested: 'Total invested',
    statPendingApprovals: 'Pending approvals',
    statPendingWithdrawals: 'Pending withdrawals',
    approvalsTitle: 'Pending approvals',
    approvalsEmpty: 'No pending approvals.',
    referredByLabel: 'Referred by',
    assignAdvisorPlaceholder: 'Assign advisor (optional)',
    approveButton: 'Approve',
    rejectButton: 'Reject',
    withdrawalsTitle: 'Pending withdrawal requests',
    withdrawalsEmpty: 'No pending withdrawal requests.',
    pointsUnit: 'pts',
    recordPaymentTitle: 'Record a payment',
    selectInvestor: 'Select investor',
    paymentType: 'Payment type',
    typeMembership: 'Membership',
    typeInvestment: 'Investment',
    typeOther: 'Other',
    amountLabel: 'Amount ($)',
    noteLabel: 'Note (optional)',
    notePlaceholder: 'e.g. bank transfer ref #1234',
    recordButton: 'Record payment',
    recordSuccess: (name) => `Payment recorded for ${name}.`,
    errorRequired: 'Required',
    errorAmount: 'Enter an amount greater than 0',
    recentPaymentsTitle: 'Recent payments',
    noPayments: 'No payments recorded yet.',
    manageRewardsTitle: 'Manage rewards',
    rewardNameEn: 'Reward name (English)',
    rewardNameAr: 'Reward name (Arabic)',
    pointsCostLabel: 'Points cost',
    stockLabel: 'Stock (leave empty for unlimited)',
    addRewardButton: 'Add reward',
    unlimitedStock: 'Unlimited',
    inStock: (n) => `${n} left`,
    outOfStock: 'Out of stock',
    activeLabel: 'Active',
    inactiveLabel: 'Inactive',
    deactivateButton: 'Deactivate',
    activateButton: 'Activate',
  },
  ar: {
    brand: 'منصّة ALM',
    switchLanguage: 'English',
    welcomeAdmin: (name) => `أهلين، ${name}`,
    statTotalInvestors: 'إجمالي المستثمرين',
    statTotalInvested: 'إجمالي الاستثمار',
    statPendingApprovals: 'بانتظار الموافقة',
    statPendingWithdrawals: 'طلبات سحب معلّقة',
    approvalsTitle: 'حسابات بانتظار الموافقة',
    approvalsEmpty: 'ما في حسابات بانتظار الموافقة.',
    referredByLabel: 'دعوة من',
    assignAdvisorPlaceholder: 'عيّن مستشار (اختياري)',
    approveButton: 'موافقة',
    rejectButton: 'رفض',
    withdrawalsTitle: 'طلبات سحب النقاط المعلّقة',
    withdrawalsEmpty: 'ما في طلبات سحب معلّقة.',
    pointsUnit: 'نقطة',
    recordPaymentTitle: 'تسجيل دفعة',
    selectInvestor: 'اختار المستثمر',
    paymentType: 'نوع الدفعة',
    typeMembership: 'عضوية',
    typeInvestment: 'استثمار',
    typeOther: 'أخرى',
    amountLabel: 'المبلغ ($)',
    noteLabel: 'ملاحظة (اختياري)',
    notePlaceholder: 'مثلاً: رقم حوالة بنكية 1234',
    recordButton: 'سجّل الدفعة',
    recordSuccess: (name) => `تم تسجيل الدفعة لـ ${name}.`,
    errorRequired: 'مطلوب',
    errorAmount: 'دخّل مبلغ أكبر من 0',
    recentPaymentsTitle: 'آخر الدفعات',
    noPayments: 'لسا ما في دفعات مسجّلة.',
    manageRewardsTitle: 'إدارة الجوائز',
    rewardNameEn: 'اسم الجائزة (انجليزي)',
    rewardNameAr: 'اسم الجائزة (عربي)',
    pointsCostLabel: 'عدد النقاط المطلوبة',
    stockLabel: 'الكمية (اتركها فاضية لغير محدود)',
    addRewardButton: 'إضافة جائزة',
    unlimitedStock: 'غير محدود',
    inStock: (n) => `${n} متبقي`,
    outOfStock: 'خلصت',
    activeLabel: 'فعّالة',
    inactiveLabel: 'موقوفة',
    deactivateButton: 'إيقاف',
    activateButton: 'تفعيل',
  },
};

const admin = { fullName: 'Omar Kanaan' };

const stats = {
  totalInvestors: 128,
  totalInvested: 640000,
  pendingApprovals: 3,
  pendingWithdrawals: 2,
};

const advisorsList = ['Nadeen Salameh', 'Karim Bishara', 'Huda Masri'];
const investorsList = ['Layla Haddad', 'Yousef Nassar', 'Hala Barakat', 'Mahmoud Rimawi', 'Omar Freij'];

const initialAccounts = [
  { id: 1, name: 'Marwan Sabbagh', referralCode: 'AB12CD34EF', referredBy: 'Yousef Nassar', requestedAt: '2026-09-08' },
  { id: 2, name: 'Dina Qasem', referralCode: 'QW99ER77TY', referredBy: 'Hala Barakat', requestedAt: '2026-09-09' },
  { id: 3, name: 'Firas Allan', referralCode: 'ZX44VB88NM', referredBy: 'Mahmoud Rimawi', requestedAt: '2026-09-10' },
];

const initialWithdrawals = [
  { id: 1, investorName: 'Layla Haddad', points: 50, requestedAt: '2026-08-20' },
  { id: 2, investorName: 'Omar Freij', points: 120, requestedAt: '2026-09-05' },
];

const initialPayments = [
  { id: 1, investorName: 'Layla Haddad', type: 'investment', amount: 5000, note: '', recordedAt: '2025-03-01' },
  { id: 2, investorName: 'Yousef Nassar', type: 'membership', amount: 200, note: '', recordedAt: '2026-08-12' },
  { id: 3, investorName: 'Hala Barakat', type: 'investment', amount: 2500, note: 'Wire transfer #4471', recordedAt: '2026-09-01' },
];

const initialRewardsList = [
  { id: 1, name: { en: 'Amazon gift card — $50', ar: 'بطاقة أمازون هدية — 50$' }, pointsCost: 200, stock: 12, active: true },
  { id: 2, name: { en: 'Free financial consultation', ar: 'استشارة مالية مجانية' }, pointsCost: 100, stock: null, active: true },
  { id: 3, name: { en: 'Premium membership upgrade', ar: 'ترقية عضوية بريميوم' }, pointsCost: 500, stock: 0, active: true },
  { id: 4, name: { en: 'Branded gift set', ar: 'طقم هدايا مميز' }, pointsCost: 150, stock: 5, active: false },
];

function translateReward(value, locale) {
  return value[locale] || value.en;
}

function formatCurrency(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function formatDate(dateStr, locale) {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(
    new Date(dateStr)
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl bg-slate-900 border border-slate-800 p-4">
      <div className="flex items-center gap-2 text-slate-400 mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-sm">{label}</span>
      </div>
      <div className="text-xl font-semibold text-slate-50">{value}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-300 mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

function PaymentTypeBadge({ type, t }) {
  const map = {
    membership: { text: t.typeMembership, cls: 'bg-amber-400/10 text-amber-400' },
    investment: { text: t.typeInvestment, cls: 'bg-emerald-400/10 text-emerald-400' },
    other: { text: t.typeOther, cls: 'bg-slate-800 text-slate-400' },
  };
  const s = map[type] || map.other;
  return <span className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${s.cls}`}>{s.text}</span>;
}

const inputClass =
  'w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2.5 text-slate-50 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors';

const approveBtnClass =
  'inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20 disabled:opacity-50 transition-colors';
const rejectBtnClass =
  'inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg bg-rose-400/10 text-rose-400 hover:bg-rose-400/20 disabled:opacity-50 transition-colors';

export default function AdminDashboard() {
  const { signOut } = useAuth();
  const [locale, setLocale] = useState('en');
  const [accounts, setAccounts] = useState(initialAccounts);
  const [withdrawals, setWithdrawals] = useState(initialWithdrawals);
  const [payments, setPayments] = useState(initialPayments);
  const [advisorSelections, setAdvisorSelections] = useState({});
  const [processingAccountId, setProcessingAccountId] = useState(null);
  const [processingWithdrawalId, setProcessingWithdrawalId] = useState(null);

  const [selectedInvestor, setSelectedInvestor] = useState('');
  const [paymentType, setPaymentType] = useState('membership');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [paymentErrors, setPaymentErrors] = useState({});
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState('');

  const [rewardsList, setRewardsList] = useState(initialRewardsList);
  const [newRewardNameEn, setNewRewardNameEn] = useState('');
  const [newRewardNameAr, setNewRewardNameAr] = useState('');
  const [newRewardCost, setNewRewardCost] = useState('');
  const [newRewardStock, setNewRewardStock] = useState('');
  const [rewardErrors, setRewardErrors] = useState({});

  const t = copy[locale];
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  function handleAccountDecision(id) {
    setProcessingAccountId(id);
    setTimeout(() => {
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      setProcessingAccountId(null);
    }, 600);
  }

  function handleWithdrawalDecision(id) {
    setProcessingWithdrawalId(id);
    setTimeout(() => {
      setWithdrawals((prev) => prev.filter((w) => w.id !== id));
      setProcessingWithdrawalId(null);
    }, 600);
  }

  function handleRecordPayment(e) {
    e.preventDefault();
    const next = {};
    if (!selectedInvestor) next.investor = t.errorRequired;
    if (!amount || Number(amount) <= 0) next.amount = t.errorAmount;
    setPaymentErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmittingPayment(true);
    setPaymentSuccess('');
    setTimeout(() => {
      setPayments((prev) => [
        {
          id: Date.now(),
          investorName: selectedInvestor,
          type: paymentType,
          amount: Number(amount),
          note,
          recordedAt: new Date().toISOString().slice(0, 10),
        },
        ...prev,
      ]);
      setSubmittingPayment(false);
      setPaymentSuccess(t.recordSuccess(selectedInvestor));
      setSelectedInvestor('');
      setPaymentType('membership');
      setAmount('');
      setNote('');
    }, 700);
  }

  function handleToggleRewardActive(id) {
    setRewardsList((prev) => prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r)));
  }

  function handleAddReward(e) {
    e.preventDefault();
    const next = {};
    if (!newRewardNameEn.trim()) next.nameEn = t.errorRequired;
    if (!newRewardNameAr.trim()) next.nameAr = t.errorRequired;
    if (!newRewardCost || Number(newRewardCost) <= 0) next.cost = t.errorAmount;
    setRewardErrors(next);
    if (Object.keys(next).length > 0) return;

    setRewardsList((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: { en: newRewardNameEn.trim(), ar: newRewardNameAr.trim() },
        pointsCost: Number(newRewardCost),
        stock: newRewardStock.trim() === '' ? null : Number(newRewardStock),
        active: true,
      },
    ]);
    setNewRewardNameEn('');
    setNewRewardNameAr('');
    setNewRewardCost('');
    setNewRewardStock('');
  }

  return (
    <div dir={dir} lang={locale} className="min-h-screen bg-slate-950 font-sans text-slate-50">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="text-amber-400 font-semibold tracking-tight text-lg">{t.brand}</div>
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
              {admin.fullName.charAt(0)}
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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <h1 className="text-2xl font-semibold">{t.welcomeAdmin(admin.fullName)}</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label={t.statTotalInvestors} value={stats.totalInvestors} />
          <StatCard icon={TrendingUp} label={t.statTotalInvested} value={formatCurrency(stats.totalInvested)} />
          <StatCard icon={Clock} label={t.statPendingApprovals} value={accounts.length} />
          <StatCard icon={Wallet} label={t.statPendingWithdrawals} value={withdrawals.length} />
        </div>

        <section>
          <h2 className="text-lg font-semibold mb-4">{t.approvalsTitle}</h2>
          {accounts.length === 0 ? (
            <p className="text-slate-400 text-sm">{t.approvalsEmpty}</p>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <div key={account.id} className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-50">{account.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {t.referredByLabel}: {account.referredBy} · {formatDate(account.requestedAt, locale)}
                      </div>
                    </div>
                    <code className="text-xs text-slate-500 font-mono">{account.referralCode}</code>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={advisorSelections[account.id] || ''}
                      onChange={(e) => setAdvisorSelections((prev) => ({ ...prev, [account.id]: e.target.value }))}
                      className="rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                    >
                      <option value="">{t.assignAdvisorPlaceholder}</option>
                      {advisorsList.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={processingAccountId === account.id}
                      onClick={() => handleAccountDecision(account.id)}
                      className={approveBtnClass}
                    >
                      <Check className="w-4 h-4" />
                      {t.approveButton}
                    </button>
                    <button
                      type="button"
                      disabled={processingAccountId === account.id}
                      onClick={() => handleAccountDecision(account.id)}
                      className={rejectBtnClass}
                    >
                      <X className="w-4 h-4" />
                      {t.rejectButton}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">{t.withdrawalsTitle}</h2>
          {withdrawals.length === 0 ? (
            <p className="text-slate-400 text-sm">{t.withdrawalsEmpty}</p>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((w) => (
                <div
                  key={w.id}
                  className="rounded-xl bg-slate-900 border border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-semibold text-slate-50">{w.investorName}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{formatDate(w.requestedAt, locale)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-amber-400 font-semibold">
                      {w.points} {t.pointsUnit}
                    </span>
                    <button
                      type="button"
                      disabled={processingWithdrawalId === w.id}
                      onClick={() => handleWithdrawalDecision(w.id)}
                      className={approveBtnClass}
                    >
                      <Check className="w-4 h-4" />
                      {t.approveButton}
                    </button>
                    <button
                      type="button"
                      disabled={processingWithdrawalId === w.id}
                      onClick={() => handleWithdrawalDecision(w.id)}
                      className={rejectBtnClass}
                    >
                      <X className="w-4 h-4" />
                      {t.rejectButton}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl bg-slate-900 border border-slate-800 p-6">
          <h2 className="text-lg font-semibold mb-4">{t.recordPaymentTitle}</h2>
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <Field label={t.selectInvestor}>
              <select value={selectedInvestor} onChange={(e) => setSelectedInvestor(e.target.value)} className={inputClass}>
                <option value="">{t.selectInvestor}</option>
                {investorsList.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              {paymentErrors.investor && <p className="mt-1.5 text-xs text-rose-400">{paymentErrors.investor}</p>}
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t.paymentType}>
                <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)} className={inputClass}>
                  <option value="membership">{t.typeMembership}</option>
                  <option value="investment">{t.typeInvestment}</option>
                  <option value="other">{t.typeOther}</option>
                </select>
              </Field>
              <Field label={t.amountLabel}>
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={inputClass}
                />
                {paymentErrors.amount && <p className="mt-1.5 text-xs text-rose-400">{paymentErrors.amount}</p>}
              </Field>
            </div>

            <Field label={t.noteLabel}>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t.notePlaceholder}
                className={inputClass}
              />
            </Field>

            <button
              type="submit"
              disabled={submittingPayment}
              className="bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-950 font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors"
            >
              {t.recordButton}
            </button>
            {paymentSuccess && <p className="text-emerald-400 text-sm">{paymentSuccess}</p>}
          </form>

          <div className="border-t border-slate-800 mt-6 pt-5">
            <div className="text-sm font-medium text-slate-300 mb-3">{t.recentPaymentsTitle}</div>
            {payments.length === 0 ? (
              <p className="text-slate-400 text-sm">{t.noPayments}</p>
            ) : (
              <div className="space-y-2">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-2 text-sm py-2 border-b border-slate-800 last:border-0"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-slate-200 flex-shrink-0">{p.investorName}</span>
                      <PaymentTypeBadge type={p.type} t={t} />
                      {p.note && <span className="text-slate-500 text-xs truncate">{p.note}</span>}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-slate-400 text-xs">{formatDate(p.recordedAt, locale)}</span>
                      <span className="font-medium text-slate-50">{formatCurrency(p.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-xl bg-slate-900 border border-slate-800 p-6">
          <h2 className="text-lg font-semibold mb-4">{t.manageRewardsTitle}</h2>

          <div className="space-y-2 mb-6">
            {rewardsList.map((r) => {
              const stockText = r.stock === null ? t.unlimitedStock : r.stock > 0 ? t.inStock(r.stock) : t.outOfStock;
              return (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-950 border border-slate-800 px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center flex-shrink-0">
                      <Gift className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-100 truncate">{translateReward(r.name, locale)}</div>
                      <div className="text-xs text-slate-500">
                        {t.pointsCostLabel}: {r.pointsCost} {t.pointsUnit} · {stockText}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full ${
                        r.active ? 'bg-emerald-400/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {r.active ? t.activeLabel : t.inactiveLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleRewardActive(r.id)}
                      className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                    >
                      <Power className="w-3.5 h-3.5" />
                      {r.active ? t.deactivateButton : t.activateButton}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleAddReward} className="space-y-4 border-t border-slate-800 pt-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t.rewardNameEn}>
                <input value={newRewardNameEn} onChange={(e) => setNewRewardNameEn(e.target.value)} className={inputClass} />
                {rewardErrors.nameEn && <p className="mt-1.5 text-xs text-rose-400">{rewardErrors.nameEn}</p>}
              </Field>
              <Field label={t.rewardNameAr}>
                <input
                  value={newRewardNameAr}
                  onChange={(e) => setNewRewardNameAr(e.target.value)}
                  className={inputClass}
                  dir="rtl"
                />
                {rewardErrors.nameAr && <p className="mt-1.5 text-xs text-rose-400">{rewardErrors.nameAr}</p>}
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t.pointsCostLabel}>
                <input
                  type="number"
                  min="1"
                  value={newRewardCost}
                  onChange={(e) => setNewRewardCost(e.target.value)}
                  className={inputClass}
                />
                {rewardErrors.cost && <p className="mt-1.5 text-xs text-rose-400">{rewardErrors.cost}</p>}
              </Field>
              <Field label={t.stockLabel}>
                <input
                  type="number"
                  min="0"
                  value={newRewardStock}
                  onChange={(e) => setNewRewardStock(e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>
            <button
              type="submit"
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors"
            >
              {t.addRewardButton}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
