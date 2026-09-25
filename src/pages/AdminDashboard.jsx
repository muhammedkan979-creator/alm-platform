import { useState, useEffect } from 'react';
import { Globe, Check, X, Users, TrendingUp, Clock, Wallet, Gift, Power, LogOut, ArrowUpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

/*
  Admin dashboard for the ALM Platform — wired to real Supabase data.
  All stats, lists, and actions read from and write to the actual
  database (profiles, investments, payments, point_withdrawal_requests,
  rewards) via the RPCs defined in the schema: approve_account,
  reject_account, assign_advisor, record_payment, decide_withdrawal_request,
  promote_to_advisor.
*/

const copy = {
  en: {
    brand: 'ALM Platform',
    switchLanguage: 'العربية',
    welcomeAdmin: (name) => `Welcome back, ${name}`,
    loading: 'Loading…',
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
    manageUsersTitle: 'Manage users',
    manageUsersEmpty: 'No approved investors.',
    promoteButton: 'Promote to advisor',
    promoteSuccess: (name) => `${name} is now an advisor.`,
  },
  ar: {
    brand: 'منصّة ALM',
    switchLanguage: 'English',
    welcomeAdmin: (name) => `أهلين، ${name}`,
    loading: 'عم يحمّل…',
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
    manageUsersTitle: 'إدارة المستخدمين',
    manageUsersEmpty: 'ما في مستثمرين معتمدين.',
    promoteButton: 'رقّي لمستشار',
    promoteSuccess: (name) => `${name} صار مستشار.`,
  },
};

function translateReward(value, locale) {
  return (value && value[locale]) || (value && value.en) || '';
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
const promoteBtnClass =
  'inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg bg-amber-400/10 text-amber-400 hover:bg-amber-400/20 disabled:opacity-50 transition-colors';

export default function AdminDashboard() {
  const { signOut, profile } = useAuth();
  const [locale, setLocale] = useState('en');

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [stats, setStats] = useState({ totalInvestors: 0, totalInvested: 0, pendingApprovals: 0, pendingWithdrawals: 0 });
  const [accounts, setAccounts] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [payments, setPayments] = useState([]);
  const [rewardsList, setRewardsList] = useState([]);
  const [advisorsList, setAdvisorsList] = useState([]);
  const [investorsList, setInvestorsList] = useState([]);

  const [advisorSelections, setAdvisorSelections] = useState({});
  const [processingAccountId, setProcessingAccountId] = useState(null);
  const [processingWithdrawalId, setProcessingWithdrawalId] = useState(null);
  const [processingPromoteId, setProcessingPromoteId] = useState(null);
  const [promoteSuccessMsg, setPromoteSuccessMsg] = useState('');

  const [selectedInvestor, setSelectedInvestor] = useState('');
  const [paymentType, setPaymentType] = useState('membership');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [paymentErrors, setPaymentErrors] = useState({});
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState('');

  const [newRewardNameEn, setNewRewardNameEn] = useState('');
  const [newRewardNameAr, setNewRewardNameAr] = useState('');
  const [newRewardCost, setNewRewardCost] = useState('');
  const [newRewardStock, setNewRewardStock] = useState('');
  const [rewardErrors, setRewardErrors] = useState({});

  const t = copy[locale];
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  async function loadData() {
    setLoading(true);
    setErrorMsg('');
    try {
      const [investorsCountRes, investmentsRes, pendingAccountsRes, pendingWithdrawalsRes, paymentsRes, rewardsRes, advisorsRes, approvedInvestorsRes] =
        await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'investor'),
          supabase.from('investments').select('amount'),
          supabase.from('profiles').select('id, full_name, referral_code, referred_by, created_at').eq('status', 'pending'),
          supabase.from('point_withdrawal_requests').select('id, profile_id, points, requested_at').eq('status', 'pending'),
          supabase.from('payments').select('id, profile_id, type, amount, note, created_at').order('created_at', { ascending: false }).limit(20),
          supabase.from('rewards').select('*').order('created_at', { ascending: false }),
          supabase.from('profiles').select('id, full_name').eq('role', 'advisor').eq('status', 'approved'),
          supabase.from('profiles').select('id, full_name').eq('role', 'investor').eq('status', 'approved'),
        ]);

      const results = [
        investorsCountRes,
        investmentsRes,
        pendingAccountsRes,
        pendingWithdrawalsRes,
        paymentsRes,
        rewardsRes,
        advisorsRes,
        approvedInvestorsRes,
      ];
      const firstError = results.find((r) => r.error);
      if (firstError) throw firstError.error;

      const totalInvested = (investmentsRes.data || []).reduce((sum, inv) => sum + Number(inv.amount), 0);

      const referrerIds = [...new Set((pendingAccountsRes.data || []).map((a) => a.referred_by).filter(Boolean))];
      let referrerMap = {};
      if (referrerIds.length > 0) {
        const { data: referrers } = await supabase.from('profiles').select('id, full_name').in('id', referrerIds);
        referrerMap = Object.fromEntries((referrers || []).map((r) => [r.id, r.full_name]));
      }

      const withdrawalProfileIds = [...new Set((pendingWithdrawalsRes.data || []).map((w) => w.profile_id))];
      let withdrawalNameMap = {};
      if (withdrawalProfileIds.length > 0) {
        const { data: wProfiles } = await supabase.from('profiles').select('id, full_name').in('id', withdrawalProfileIds);
        withdrawalNameMap = Object.fromEntries((wProfiles || []).map((p) => [p.id, p.full_name]));
      }

      const paymentProfileIds = [...new Set((paymentsRes.data || []).map((p) => p.profile_id))];
      let paymentNameMap = {};
      if (paymentProfileIds.length > 0) {
        const { data: pProfiles } = await supabase.from('profiles').select('id, full_name').in('id', paymentProfileIds);
        paymentNameMap = Object.fromEntries((pProfiles || []).map((p) => [p.id, p.full_name]));
      }

      setStats({
        totalInvestors: investorsCountRes.count || 0,
        totalInvested,
        pendingApprovals: (pendingAccountsRes.data || []).length,
        pendingWithdrawals: (pendingWithdrawalsRes.data || []).length,
      });

      setAccounts(
        (pendingAccountsRes.data || []).map((a) => ({
          id: a.id,
          name: a.full_name,
          referralCode: a.referral_code,
          referredBy: a.referred_by ? referrerMap[a.referred_by] || '—' : '—',
          requestedAt: a.created_at,
        }))
      );

      setWithdrawals(
        (pendingWithdrawalsRes.data || []).map((w) => ({
          id: w.id,
          investorName: withdrawalNameMap[w.profile_id] || '—',
          points: w.points,
          requestedAt: w.requested_at,
        }))
      );

      setPayments(
        (paymentsRes.data || []).map((p) => ({
          id: p.id,
          investorName: paymentNameMap[p.profile_id] || '—',
          type: p.type,
          amount: Number(p.amount),
          note: p.note || '',
          recordedAt: p.created_at,
        }))
      );

      setRewardsList(rewardsRes.data || []);
      setAdvisorsList(advisorsRes.data || []);
      setInvestorsList(approvedInvestorsRes.data || []);
    } catch (err) {
      setErrorMsg(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleApproveAccount(account) {
    setProcessingAccountId(account.id);
    setErrorMsg('');
    try {
      const advisorId = advisorSelections[account.id];
      if (advisorId) {
        const { error: assignError } = await supabase.rpc('assign_advisor', {
          p_investor_id: account.id,
          p_advisor_id: advisorId,
        });
        if (assignError) throw assignError;
      }
      const { error } = await supabase.rpc('approve_account', { p_profile_id: account.id });
      if (error) throw error;
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || String(err));
    } finally {
      setProcessingAccountId(null);
    }
  }

  async function handleRejectAccount(account) {
    setProcessingAccountId(account.id);
    setErrorMsg('');
    try {
      const { error } = await supabase.rpc('reject_account', { p_profile_id: account.id });
      if (error) throw error;
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || String(err));
    } finally {
      setProcessingAccountId(null);
    }
  }

  async function handleWithdrawalDecision(w, approve) {
    setProcessingWithdrawalId(w.id);
    setErrorMsg('');
    try {
      const { error } = await supabase.rpc('decide_withdrawal_request', { p_request_id: w.id, p_approve: approve });
      if (error) throw error;
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || String(err));
    } finally {
      setProcessingWithdrawalId(null);
    }
  }

  async function handlePromoteToAdvisor(investor) {
    setProcessingPromoteId(investor.id);
    setErrorMsg('');
    setPromoteSuccessMsg('');
    try {
      const { error } = await supabase.rpc('promote_to_advisor', { target_user_id: investor.id });
      if (error) throw error;
      setPromoteSuccessMsg(t.promoteSuccess(investor.full_name));
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || String(err));
    } finally {
      setProcessingPromoteId(null);
    }
  }

  async function handleRecordPayment(e) {
    e.preventDefault();
    const next = {};
    if (!selectedInvestor) next.investor = t.errorRequired;
    if (!amount || Number(amount) <= 0) next.amount = t.errorAmount;
    setPaymentErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmittingPayment(true);
    setPaymentSuccess('');
    setErrorMsg('');
    try {
      const { error } = await supabase.rpc('record_payment', {
        p_profile_id: selectedInvestor,
        p_type: paymentType,
        p_amount: Number(amount),
        p_note: note.trim() || null,
      });
      if (error) throw error;
      const investorName = investorsList.find((i) => i.id === selectedInvestor)?.full_name || '';
      setPaymentSuccess(t.recordSuccess(investorName));
      setSelectedInvestor('');
      setPaymentType('membership');
      setAmount('');
      setNote('');
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || String(err));
    } finally {
      setSubmittingPayment(false);
    }
  }

  async function handleToggleRewardActive(reward) {
    setErrorMsg('');
    const { error } = await supabase.from('rewards').update({ active: !reward.active }).eq('id', reward.id);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    await loadData();
  }

  async function handleAddReward(e) {
    e.preventDefault();
    const next = {};
    if (!newRewardNameEn.trim()) next.nameEn = t.errorRequired;
    if (!newRewardNameAr.trim()) next.nameAr = t.errorRequired;
    if (!newRewardCost || Number(newRewardCost) <= 0) next.cost = t.errorAmount;
    setRewardErrors(next);
    if (Object.keys(next).length > 0) return;

    setErrorMsg('');
    const { error } = await supabase.from('rewards').insert({
      name: { en: newRewardNameEn.trim(), ar: newRewardNameAr.trim() },
      points_cost: Number(newRewardCost),
      stock: newRewardStock.trim() === '' ? null : Number(newRewardStock),
      active: true,
    });
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    setNewRewardNameEn('');
    setNewRewardNameAr('');
    setNewRewardCost('');
    setNewRewardStock('');
    await loadData();
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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <h1 className="text-2xl font-semibold">{t.welcomeAdmin(profile?.full_name || '')}</h1>

        {errorMsg && (
          <div className="rounded-lg bg-rose-400/10 border border-rose-400/20 px-4 py-3 text-sm text-rose-400">{errorMsg}</div>
        )}

        {loading ? (
          <p className="text-slate-400 text-sm">{t.loading}</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={Users} label={t.statTotalInvestors} value={stats.totalInvestors} />
              <StatCard icon={TrendingUp} label={t.statTotalInvested} value={formatCurrency(stats.totalInvested)} />
              <StatCard icon={Clock} label={t.statPendingApprovals} value={stats.pendingApprovals} />
              <StatCard icon={Wallet} label={t.statPendingWithdrawals} value={stats.pendingWithdrawals} />
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
                            <option key={a.id} value={a.id}>
                              {a.full_name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={processingAccountId === account.id}
                          onClick={() => handleApproveAccount(account)}
                          className={approveBtnClass}
                        >
                          <Check className="w-4 h-4" />
                          {t.approveButton}
                        </button>
                        <button
                          type="button"
                          disabled={processingAccountId === account.id}
                          onClick={() => handleRejectAccount(account)}
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
              <h2 className="text-lg font-semibold mb-4">{t.manageUsersTitle}</h2>
              {promoteSuccessMsg && <p className="text-emerald-400 text-sm mb-3">{promoteSuccessMsg}</p>}
              {investorsList.length === 0 ? (
                <p className="text-slate-400 text-sm">{t.manageUsersEmpty}</p>
              ) : (
                <div className="space-y-3">
                  {investorsList.map((investor) => (
                    <div
                      key={investor.id}
                      className="rounded-xl bg-slate-900 border border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="font-semibold text-slate-50">{investor.full_name}</div>
                      <button
                        type="button"
                        disabled={processingPromoteId === investor.id}
                        onClick={() => handlePromoteToAdvisor(investor)}
                        className={promoteBtnClass}
                      >
                        <ArrowUpCircle className="w-4 h-4" />
                        {t.promoteButton}
                      </button>
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
                          onClick={() => handleWithdrawalDecision(w, true)}
                          className={approveBtnClass}
                        >
                          <Check className="w-4 h-4" />
                          {t.approveButton}
                        </button>
                        <button
                          type="button"
                          disabled={processingWithdrawalId === w.id}
                          onClick={() => handleWithdrawalDecision(w, false)}
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
                    {investorsList.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.full_name}
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
                    <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} />
                    {paymentErrors.amount && <p className="mt-1.5 text-xs text-rose-400">{paymentErrors.amount}</p>}
                  </Field>
                </div>

                <Field label={t.noteLabel}>
                  <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t.notePlaceholder} className={inputClass} />
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
                            {t.pointsCostLabel}: {r.points_cost} {t.pointsUnit} · {stockText}
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
                          onClick={() => handleToggleRewardActive(r)}
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
          </>
        )}
      </main>
    </div>
  );
}
