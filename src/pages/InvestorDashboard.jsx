import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Globe, Copy, Check, TrendingUp, Coins, Wallet, ChevronDown, Send, LogOut, Gift } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

/*
  Investor dashboard for the ALM Platform — wired to real Supabase data.
  Reads the investor's own profile, investments, membership status,
  advisor assignment, messages, referral network (via profiles.referred_by),
  and points via the get_points / available_points RPCs. Withdrawal
  requests are submitted through request_point_withdrawal.
*/

const copy = {
  en: {
    brand: 'ALM Platform',
    switchLanguage: 'العربية',
    welcomeBack: (name) => `Welcome back, ${name}`,
    loading: 'Loading…',
    statusApproved: 'Approved investor',
    statusPending: 'Pending approval',
    membershipActive: 'Membership active',
    membershipInactive: 'No active membership',
    statTotalInvested: 'Total invested',
    statPoints: 'Points balance',
    statActiveInvestments: 'Active investments',
    statReferralCode: 'Your referral code',
    copied: 'Copied',
    investmentsTitle: 'Your investments',
    investmentsEmpty: "You don't have any investments yet.",
    rateLabel: 'Rate',
    profitCalculating: 'Calculating',
    profitDue: 'Profit due',
    profitPaid: 'Profit paid',
    messagesTitle: 'Messages',
    advisorRoleTitle: 'Senior investment advisor',
    noAdvisor: 'No advisor assigned yet',
    chatPlaceholder: 'Write a message…',
    chatSend: 'Send',
    networkTitle: 'Your referral network',
    networkBody: 'Every investor below you — up to three generations — adds 25 points once they invest.',
    gen1Label: 'Direct referrals',
    gen2Label: '2nd generation',
    gen3Label: '3rd generation',
    investedOf: (invested, total) => `${invested} of ${total} invested`,
    ptsUnit: 'pts',
    pointsBadge: '+25 pts',
    notInvestedYet: 'Not invested yet',
    browseNetworkTitle: 'Browse your network',
    browseNetworkHint: 'Tap a name to see who they brought in.',
    networkEmpty: "You haven't referred anyone yet.",
    withdrawTitle: 'Redeem points',
    withdrawAvailable: (n) => `${n} points available`,
    withdrawButton: 'Request withdrawal',
    withdrawPlaceholder: 'Points to withdraw',
    withdrawSubmit: 'Submit request',
    withdrawCancel: 'Cancel',
    withdrawErrorRange: (n) => `Enter a number between 1 and ${n}`,
    recentRequests: 'Recent requests',
    reqStatusPending: 'Pending',
    reqStatusApproved: 'Approved',
    reqStatusRejected: 'Rejected',
  },
  ar: {
    brand: 'منصّة ALM',
    switchLanguage: 'English',
    welcomeBack: (name) => `أهلين، ${name}`,
    loading: 'عم يحمّل…',
    statusApproved: 'مستثمر موافق عليه',
    statusPending: 'بانتظار الموافقة',
    membershipActive: 'العضوية فعّالة',
    membershipInactive: 'ما في عضوية فعّالة',
    statTotalInvested: 'إجمالي الاستثمار',
    statPoints: 'رصيد النقاط',
    statActiveInvestments: 'استثمارات فعّالة',
    statReferralCode: 'كود الدعوة تبعك',
    copied: 'تم النسخ',
    investmentsTitle: 'استثماراتك',
    investmentsEmpty: 'لسا ما عندك أي استثمار.',
    rateLabel: 'نسبة الربح',
    profitCalculating: 'عم يتحسب',
    profitDue: 'ربح مستحق',
    profitPaid: 'الربح انصرف',
    messagesTitle: 'الرسائل',
    advisorRoleTitle: 'مستشار استثمار أول',
    noAdvisor: 'لسا ما تعيّن مستشار',
    chatPlaceholder: 'اكتب رسالة…',
    chatSend: 'إرسال',
    networkTitle: 'شبكة الإحالة تبعتك',
    networkBody: 'كل مستثمر تحتك — لحد تلات أجيال — بيضيفلك 25 نقطة لما يستثمر.',
    gen1Label: 'دعوات مباشرة',
    gen2Label: 'الجيل التاني',
    gen3Label: 'الجيل التالت',
    investedOf: (invested, total) => `${invested} من ${total} استثمروا`,
    ptsUnit: 'نقطة',
    pointsBadge: '+25 نقطة',
    notInvestedYet: 'لسا ما استثمر',
    browseNetworkTitle: 'تصفح شبكتك',
    browseNetworkHint: 'دوس عأي اسم لتشوف مين جابهم.',
    networkEmpty: 'لسا ما دعيت حدا.',
    withdrawTitle: 'استبدال النقاط',
    withdrawAvailable: (n) => `${n} نقطة متوفرة`,
    withdrawButton: 'اطلب سحب',
    withdrawPlaceholder: 'عدد النقاط يلي بدك تسحبها',
    withdrawSubmit: 'إرسال الطلب',
    withdrawCancel: 'إلغاء',
    withdrawErrorRange: (n) => `دخّل رقم بين 1 و ${n}`,
    recentRequests: 'آخر الطلبات',
    reqStatusPending: 'قيد المراجعة',
    reqStatusApproved: 'موافَق عليه',
    reqStatusRejected: 'مرفوض',
  },
};

function collectGenerations(tree) {
  const gen1 = tree;
  const gen2 = gen1.flatMap((p) => p.children || []);
  const gen3 = gen2.flatMap((p) => p.children || []);
  return { gen1, gen2, gen3 };
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

function StatusBadge({ status, t }) {
  const map = {
    calculating: { text: t.profitCalculating, cls: 'bg-slate-800 text-slate-400' },
    due: { text: t.profitDue, cls: 'bg-amber-400/10 text-amber-400' },
    paid: { text: t.profitPaid, cls: 'bg-emerald-400/10 text-emerald-400' },
  };
  const s = map[status] || map.calculating;
  return <span className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${s.cls}`}>{s.text}</span>;
}

function RequestStatusBadge({ status, t }) {
  const map = {
    pending: { text: t.reqStatusPending, cls: 'bg-slate-800 text-slate-400' },
    approved: { text: t.reqStatusApproved, cls: 'bg-emerald-400/10 text-emerald-400' },
    rejected: { text: t.reqStatusRejected, cls: 'bg-rose-400/10 text-rose-400' },
  };
  const s = map[status] || map.pending;
  return <span className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${s.cls}`}>{s.text}</span>;
}

function NetworkTier({ label, data, t, opacity }) {
  return (
    <div className="rounded-lg bg-slate-950 border border-slate-800 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" style={{ opacity }} />
        <span className="text-sm text-slate-300">{label}</span>
      </div>
      <div className="text-lg font-semibold text-slate-50 mb-1">
        {data.invested * 25} {t.ptsUnit}
      </div>
      <div className="text-xs text-slate-500">{t.investedOf(data.invested, data.total)}</div>
    </div>
  );
}

function PersonNode({ person, t, depth = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = Boolean(person.children && person.children.length > 0);
  const dotOpacity = [1, 0.7, 0.45][Math.min(depth, 2)];

  return (
    <div>
      <button
        type="button"
        onClick={() => hasChildren && setExpanded((e) => !e)}
        className={`w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors ${
          hasChildren ? 'hover:bg-slate-800' : ''
        }`}
      >
        <span className="flex items-center gap-2.5 min-w-0">
          <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" style={{ opacity: dotOpacity }} />
          <span className="text-sm text-slate-200 truncate">{person.name}</span>
        </span>
        <span className="flex items-center gap-2 flex-shrink-0">
          {person.invested ? (
            <span className="text-xs text-amber-400 font-medium">{t.pointsBadge}</span>
          ) : (
            <span className="text-xs text-slate-500">{t.notInvestedYet}</span>
          )}
          {hasChildren && (
            <ChevronDown
              className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            />
          )}
        </span>
      </button>
      {expanded && hasChildren && (
        <div style={{ marginInlineStart: '1.25rem', borderInlineStart: '1px solid #1e293b', paddingInlineStart: '0.75rem' }}>
          {person.children.map((child) => (
            <PersonNode key={child.id} person={child} t={t} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

const inputClass =
  'w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2.5 text-slate-50 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors';

export default function InvestorDashboard() {
  const { signOut, profile } = useAuth();
  const [locale, setLocale] = useState('en');

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [membershipActive, setMembershipActive] = useState(false);
  const [investments, setInvestments] = useState([]);
  const [advisor, setAdvisor] = useState(null);
  const [messages, setMessages] = useState([]);
  const [referralTree, setReferralTree] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [available, setAvailable] = useState(0);
  const [requests, setRequests] = useState([]);

  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawError, setWithdrawError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatEndRef = useRef(null);

  const t = copy[locale];
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  async function loadData() {
    if (!profile?.id) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const [membershipRes, investmentsRes, advisorLinkRes, messagesRes, gen1Res, pointsRes, availableRes, requestsRes] =
        await Promise.all([
          supabase.from('memberships').select('id').eq('profile_id', profile.id).limit(1),
          supabase.from('investments').select('*').eq('profile_id', profile.id).order('start_at', { ascending: false }),
          supabase.from('advisor_assignments').select('advisor_id').eq('investor_id', profile.id).limit(1),
          supabase.from('messages').select('*').eq('investor_id', profile.id).order('created_at', { ascending: true }),
          supabase.from('profiles').select('id, full_name, referred_by').eq('referred_by', profile.id),
          supabase.rpc('get_points', { p_profile_id: profile.id }),
          supabase.rpc('available_points', { p_profile_id: profile.id }),
          supabase.from('point_withdrawal_requests').select('*').eq('profile_id', profile.id).order('requested_at', { ascending: false }),
        ]);

      const results = [membershipRes, investmentsRes, advisorLinkRes, messagesRes, gen1Res, pointsRes, availableRes, requestsRes];
      const firstError = results.find((r) => r.error);
      if (firstError) throw firstError.error;

      setMembershipActive((membershipRes.data || []).length > 0);
      setInvestments(investmentsRes.data || []);
      setMessages(messagesRes.data || []);
      setTotalPoints(pointsRes.data || 0);
      setAvailable(availableRes.data || 0);
      setRequests(requestsRes.data || []);

      const advisorId = (advisorLinkRes.data || [])[0]?.advisor_id;
      if (advisorId) {
        const { data: advisorProfile } = await supabase.from('profiles').select('full_name').eq('id', advisorId).single();
        setAdvisor(advisorProfile || null);
      } else {
        setAdvisor(null);
      }

      const gen1 = gen1Res.data || [];
      const gen1Ids = gen1.map((p) => p.id);
      let gen2 = [];
      let gen2Ids = [];
      if (gen1Ids.length > 0) {
        const { data } = await supabase.from('profiles').select('id, full_name, referred_by').in('referred_by', gen1Ids);
        gen2 = data || [];
        gen2Ids = gen2.map((p) => p.id);
      }
      let gen3 = [];
      if (gen2Ids.length > 0) {
        const { data } = await supabase.from('profiles').select('id, full_name, referred_by').in('referred_by', gen2Ids);
        gen3 = data || [];
      }

      const allIds = [...gen1Ids, ...gen2Ids, ...gen3.map((p) => p.id)];
      let investedSet = new Set();
      if (allIds.length > 0) {
        const { data: investedRows } = await supabase.from('investments').select('profile_id').in('profile_id', allIds);
        investedSet = new Set((investedRows || []).map((r) => r.profile_id));
      }

      function buildNode(person) {
        const children = gen2
          .filter((p) => p.referred_by === person.id)
          .map((p2) => ({
            id: p2.id,
            name: p2.full_name,
            invested: investedSet.has(p2.id),
            children: gen3
              .filter((p3) => p3.referred_by === p2.id)
              .map((p3) => ({ id: p3.id, name: p3.full_name, invested: investedSet.has(p3.id), children: [] })),
          }));
        return { id: person.id, name: person.full_name, invested: investedSet.has(person.id), children };
      }

      setReferralTree(gen1.map((p) => buildNode(p)));
    } catch (err) {
      setErrorMsg(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const { gen1, gen2, gen3 } = collectGenerations(referralTree);
  const genStats = {
    gen1: { total: gen1.length, invested: gen1.filter((p) => p.invested).length },
    gen2: { total: gen2.length, invested: gen2.filter((p) => p.invested).length },
    gen3: { total: gen3.length, invested: gen3.filter((p) => p.invested).length },
  };

  const totalInvested = investments.reduce((sum, inv) => sum + Number(inv.amount), 0);

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(profile?.referral_code || '');
    } catch {
      // clipboard API may be unavailable
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function handleSendMessage(e) {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || !profile?.id) return;
    setSendingMessage(true);
    setErrorMsg('');
    try {
      const { error } = await supabase.from('messages').insert({
        investor_id: profile.id,
        sender_id: profile.id,
        body: text,
      });
      if (error) throw error;
      setChatInput('');
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || String(err));
    } finally {
      setSendingMessage(false);
    }
  }

  async function handleWithdrawSubmit(e) {
    e.preventDefault();
    const n = parseInt(withdrawAmount, 10);
    if (!n || n < 1 || n > available) {
      setWithdrawError(t.withdrawErrorRange(available));
      return;
    }
    setWithdrawError('');
    setSubmitting(true);
    setErrorMsg('');
    try {
      const { error } = await supabase.rpc('request_point_withdrawal', { p_points: n });
      if (error) throw error;
      setShowWithdrawForm(false);
      setWithdrawAmount('');
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || String(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (!profile) {
    return null;
  }

  return (
    <div dir={dir} lang={locale} className="min-h-screen bg-slate-950 font-sans text-slate-50">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="text-amber-400 font-semibold tracking-tight text-lg">{t.brand}</div>
          <div className="flex items-center gap-4">
            <Link
              to="/rewards"
              className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <Gift className="w-4 h-4" />
              {locale === 'ar' ? 'الجوائز' : 'Rewards'}
            </Link>
            <button
              type="button"
              onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
              className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <Globe className="w-4 h-4" />
              {t.switchLanguage}
            </button>
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm font-medium text-slate-300">
              {(profile?.full_name || 'I').charAt(0)}
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
        <div>
          <h1 className="text-2xl font-semibold mb-3">{t.welcomeBack(profile?.full_name || '')}</h1>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-400/10 text-emerald-400">
              {profile?.status === 'approved' ? t.statusApproved : t.statusPending}
            </span>
            <span
              className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${
                membershipActive ? 'bg-amber-400/10 text-amber-400' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {membershipActive ? t.membershipActive : t.membershipInactive}
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="rounded-lg bg-rose-400/10 border border-rose-400/20 px-4 py-3 text-sm text-rose-400">{errorMsg}</div>
        )}

        {loading ? (
          <p className="text-slate-400 text-sm">{t.loading}</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={TrendingUp} label={t.statTotalInvested} value={formatCurrency(totalInvested)} />
              <StatCard icon={Coins} label={t.statPoints} value={`${totalPoints} ${t.ptsUnit}`} />
              <StatCard icon={Wallet} label={t.statActiveInvestments} value={investments.length} />
              <div className="rounded-xl bg-slate-900 border border-slate-800 p-4">
                <div className="text-sm text-slate-400 mb-2">{t.statReferralCode}</div>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-amber-400 font-mono text-sm tracking-wide">{profile?.referral_code}</code>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    aria-label={t.copied}
                    className="rounded-md p-1.5 hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                  </button>
                </div>
              </div>
            </div>

            <section>
              <h2 className="text-lg font-semibold mb-4">{t.investmentsTitle}</h2>
              {investments.length === 0 ? (
                <p className="text-slate-400 text-sm">{t.investmentsEmpty}</p>
              ) : (
                <div className="space-y-3">
                  {investments.map((inv) => (
                    <div
                      key={inv.id}
                      className="rounded-xl bg-slate-900 border border-slate-800 p-4 flex flex-wrap items-center justify-between gap-4"
                    >
                      <div>
                        <div className="text-lg font-semibold">{formatCurrency(Number(inv.amount))}</div>
                        <div className="text-sm text-slate-400">
                          {formatDate(inv.start_at, locale)} – {formatDate(inv.end_at, locale)}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {inv.annual_profit_rate != null && (
                          <div className="text-sm text-slate-400">
                            {t.rateLabel}: {inv.annual_profit_rate}%
                          </div>
                        )}
                        <StatusBadge status={inv.profit_status} t={t} />
                        {inv.profit_amount != null && (
                          <div className="text-emerald-400 font-medium">+{formatCurrency(Number(inv.profit_amount))}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-xl bg-slate-900 border border-slate-800 p-6">
              <h2 className="text-lg font-semibold mb-4">{t.messagesTitle}</h2>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-sm font-medium text-slate-300 flex-shrink-0">
                  {(advisor?.full_name || '—').charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-100">{advisor?.full_name || t.noAdvisor}</div>
                  {advisor && <div className="text-xs text-slate-500">{t.advisorRoleTitle}</div>}
                </div>
              </div>

              <div className="space-y-2.5 max-h-80 overflow-y-auto mb-4">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender_id === profile.id ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-xs rounded-lg px-3 py-2 text-sm ${
                        m.sender_id === profile.id ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-100'
                      }`}
                    >
                      {m.body}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={t.chatPlaceholder}
                  className={inputClass}
                />
                <button
                  type="submit"
                  disabled={sendingMessage}
                  aria-label={t.chatSend}
                  className="flex-shrink-0 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-950 rounded-lg px-3 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </section>

            <section className="rounded-xl bg-slate-900 border border-slate-800 p-6">
              <h2 className="text-lg font-semibold mb-1">{t.networkTitle}</h2>
              <p className="text-sm text-slate-400 mb-5">{t.networkBody}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <NetworkTier label={t.gen1Label} data={genStats.gen1} t={t} opacity={1} />
                <NetworkTier label={t.gen2Label} data={genStats.gen2} t={t} opacity={0.7} />
                <NetworkTier label={t.gen3Label} data={genStats.gen3} t={t} opacity={0.45} />
              </div>

              <div className="border-t border-slate-800 pt-5 mb-5">
                <div className="text-sm font-medium text-slate-300">{t.browseNetworkTitle}</div>
                <div className="text-xs text-slate-500 mb-2">{t.browseNetworkHint}</div>
                {referralTree.length === 0 ? (
                  <p className="text-slate-400 text-sm">{t.networkEmpty}</p>
                ) : (
                  <div>
                    {referralTree.map((person) => (
                      <PersonNode key={person.id} person={person} t={t} depth={0} />
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-800 pt-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-sm text-slate-400">{t.withdrawTitle}</div>
                  <div className="text-xl font-semibold text-amber-400">{t.withdrawAvailable(available)}</div>
                </div>
                {!showWithdrawForm && (
                  <button
                    type="button"
                    onClick={() => setShowWithdrawForm(true)}
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold rounded-lg px-4 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                  >
                    {t.withdrawButton}
                  </button>
                )}
              </div>

              {showWithdrawForm && (
                <form onSubmit={handleWithdrawSubmit} className="mt-4 flex flex-wrap items-start gap-3">
                  <div className="flex-1">
                    <input
                      type="number"
                      min="1"
                      max={available}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder={t.withdrawPlaceholder}
                      className={inputClass}
                      autoFocus
                    />
                    {withdrawError && <p className="mt-1.5 text-xs text-rose-400">{withdrawError}</p>}
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-950 font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors"
                  >
                    {t.withdrawSubmit}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowWithdrawForm(false);
                      setWithdrawError('');
                    }}
                    className="text-slate-400 hover:text-slate-200 rounded-lg px-4 py-2.5 text-sm transition-colors"
                  >
                    {t.withdrawCancel}
                  </button>
                </form>
              )}

              {requests.length > 0 && (
                <div className="mt-6">
                  <div className="text-sm font-medium text-slate-300 mb-2">{t.recentRequests}</div>
                  <div className="space-y-2">
                    {requests.map((r) => (
                      <div key={r.id} className="flex items-center justify-between text-sm py-2 border-b border-slate-800 last:border-0">
                        <span className="text-slate-300">
                          {r.points} {t.ptsUnit} — {formatDate(r.requested_at, locale)}
                        </span>
                        <RequestStatusBadge status={r.status} t={t} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
