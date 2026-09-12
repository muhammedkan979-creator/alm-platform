import { useState } from 'react';
import { Globe, Copy, Check, TrendingUp, Coins, Wallet, ChevronDown, Send, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/*
  Prototype advisor dashboard for the ALM Platform — this is the same
  screen as the investor dashboard (an advisor is a profile too, with
  their own investments/points/referrals), plus a "My assigned investors"
  section at the bottom. Advisors are communication-only: they can view
  and message their assigned investors, but recording payments/memberships
  and deciding approvals/withdrawals are admin-only in the schema. The
  investor list itself is scoped by is_admin_or_assigned_advisor() — an
  advisor only sees investors in their own advisor_assignments row.
*/

const copy = {
  en: {
    brand: 'ALM Platform',
    switchLanguage: 'العربية',
    welcomeBack: (name) => `Welcome back, ${name}`,
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
    myInvestorsTitle: 'My assigned investors',
    myInvestorsEmpty: 'No investors assigned to you yet.',
    investedLabel: 'Invested',
    chatWithInvestor: (name) => `Chat with ${name}`,
  },
  ar: {
    brand: 'منصّة ALM',
    switchLanguage: 'English',
    welcomeBack: (name) => `أهلين، ${name}`,
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
    myInvestorsTitle: 'المستثمرين المعيّنين إلي',
    myInvestorsEmpty: 'ما في مستثمرين معيّنين إلك لسا.',
    investedLabel: 'استثمر',
    chatWithInvestor: (name) => `دردشة مع ${name}`,
  },
};

const investor = {
  fullName: 'Layla Haddad',
  referralCode: 'LH7K92XQPZ',
  status: 'approved',
  membershipActive: true,
};

const investments = [
  { id: 1, amount: 5000, startAt: '2025-03-01', endAt: '2026-03-01', profitStatus: 'due', profitAmount: 450, rate: 9 },
  { id: 2, amount: 2500, startAt: '2025-09-15', endAt: '2026-09-15', profitStatus: 'calculating', profitAmount: null, rate: null },
  { id: 3, amount: 10000, startAt: '2024-06-01', endAt: '2025-06-01', profitStatus: 'paid', profitAmount: 950, rate: 9.5 },
];

const referralTree = [
  {
    id: 1,
    name: 'Yousef Nassar',
    invested: true,
    children: [
      {
        id: 11,
        name: 'Rana Odeh',
        invested: true,
        children: [
          { id: 111, name: 'Khalid Amer', invested: false, children: [] },
          { id: 112, name: 'Dana Sami', invested: true, children: [] },
          { id: 113, name: 'Nabil Khatib', invested: true, children: [] },
        ],
      },
      {
        id: 12,
        name: 'Fadi Tarawneh',
        invested: false,
        children: [{ id: 121, name: 'Suha Barakat', invested: false, children: [] }],
      },
      {
        id: 13,
        name: 'Layla Zoubi',
        invested: true,
        children: [{ id: 131, name: 'Omar Freij', invested: true, children: [] }],
      },
    ],
  },
  {
    id: 2,
    name: 'Hala Barakat',
    invested: true,
    children: [
      {
        id: 21,
        name: 'Ziad Qasem',
        invested: true,
        children: [
          { id: 211, name: 'Nour Halasa', invested: true, children: [] },
          { id: 212, name: 'Tariq Odeh', invested: true, children: [] },
        ],
      },
      {
        id: 22,
        name: 'Rami Sawalha',
        invested: false,
        children: [{ id: 221, name: 'Maya Kilani', invested: false, children: [] }],
      },
    ],
  },
  {
    id: 3,
    name: 'Mahmoud Rimawi',
    invested: true,
    children: [
      {
        id: 31,
        name: 'Reem Tal',
        invested: true,
        children: [
          { id: 311, name: 'Ahmad Zureikat', invested: true, children: [] },
          { id: 312, name: 'Lina Haddadin', invested: false, children: [] },
        ],
      },
    ],
  },
  {
    id: 4,
    name: 'Sara Khleifat',
    invested: false,
    children: [
      {
        id: 41,
        name: 'Bilal Hourani',
        invested: true,
        children: [{ id: 411, name: 'Yara Absi', invested: false, children: [] }],
      },
    ],
  },
];

const initialRequests = [
  { id: 1, points: 100, status: 'approved', requestedAt: '2025-11-02' },
  { id: 2, points: 50, status: 'pending', requestedAt: '2026-08-20' },
];

const assignedInvestors = [
  { id: 1, name: 'Marwan Sabbagh', status: 'approved', membershipActive: true, totalInvested: 3000 },
  { id: 2, name: 'Dina Qasem', status: 'approved', membershipActive: false, totalInvested: 0 },
  { id: 3, name: 'Firas Allan', status: 'pending', membershipActive: false, totalInvested: 0 },
];

const initialInvestorChats = {
  1: [{ id: 1, from: 'advisor', body: 'Welcome aboard! Let me know if you have any questions.' }],
  2: [],
  3: [],
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

export default function AdvisorDashboard() {
  const { signOut } = useAuth();
  const [locale, setLocale] = useState('en');
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawError, setWithdrawError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState(initialRequests);
  const [copied, setCopied] = useState(false);

  const [selectedInvestorId, setSelectedInvestorId] = useState(null);
  const [investorChats, setInvestorChats] = useState(initialInvestorChats);
  const [investorChatInput, setInvestorChatInput] = useState('');

  const t = copy[locale];
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  const { gen1, gen2, gen3 } = collectGenerations(referralTree);
  const genStats = {
    gen1: { total: gen1.length, invested: gen1.filter((p) => p.invested).length },
    gen2: { total: gen2.length, invested: gen2.filter((p) => p.invested).length },
    gen3: { total: gen3.length, invested: gen3.filter((p) => p.invested).length },
  };
  const totalPoints = (genStats.gen1.invested + genStats.gen2.invested + genStats.gen3.invested) * 25;

  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const committed = requests
    .filter((r) => r.status === 'pending' || r.status === 'approved')
    .reduce((s, r) => s + r.points, 0);
  const available = totalPoints - committed;

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(investor.referralCode);
    } catch {
      // clipboard API may be unavailable in this preview; UI still confirms optimistically
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function handleWithdrawSubmit(e) {
    e.preventDefault();
    const n = parseInt(withdrawAmount, 10);
    if (!n || n < 1 || n > available) {
      setWithdrawError(t.withdrawErrorRange(available));
      return;
    }
    setWithdrawError('');
    setSubmitting(true);
    setTimeout(() => {
      setRequests((prev) => [
        { id: Date.now(), points: n, status: 'pending', requestedAt: new Date().toISOString().slice(0, 10) },
        ...prev,
      ]);
      setSubmitting(false);
      setShowWithdrawForm(false);
      setWithdrawAmount('');
    }, 700);
  }

  function handleSelectInvestor(id) {
    setSelectedInvestorId((prev) => (prev === id ? null : id));
    setInvestorChatInput('');
  }

  function handleSendInvestorMessage(e, investorId) {
    e.preventDefault();
    const text = investorChatInput.trim();
    if (!text) return;
    setInvestorChats((prev) => ({
      ...prev,
      [investorId]: [...(prev[investorId] || []), { id: Date.now(), from: 'advisor', body: text }],
    }));
    setInvestorChatInput('');
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
              {investor.fullName.charAt(0)}
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
          <h1 className="text-2xl font-semibold mb-3">{t.welcomeBack(investor.fullName)}</h1>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-400/10 text-emerald-400">
              {investor.status === 'approved' ? t.statusApproved : t.statusPending}
            </span>
            <span
              className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${
                investor.membershipActive ? 'bg-amber-400/10 text-amber-400' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {investor.membershipActive ? t.membershipActive : t.membershipInactive}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={TrendingUp} label={t.statTotalInvested} value={formatCurrency(totalInvested)} />
          <StatCard icon={Coins} label={t.statPoints} value={`${totalPoints} ${t.ptsUnit}`} />
          <StatCard icon={Wallet} label={t.statActiveInvestments} value={investments.length} />
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-4">
            <div className="text-sm text-slate-400 mb-2">{t.statReferralCode}</div>
            <div className="flex items-center justify-between gap-2">
              <code className="text-amber-400 font-mono text-sm tracking-wide">{investor.referralCode}</code>
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
                    <div className="text-lg font-semibold">{formatCurrency(inv.amount)}</div>
                    <div className="text-sm text-slate-400">
                      {formatDate(inv.startAt, locale)} – {formatDate(inv.endAt, locale)}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {inv.rate && (
                      <div className="text-sm text-slate-400">
                        {t.rateLabel}: {inv.rate}%
                      </div>
                    )}
                    <StatusBadge status={inv.profitStatus} t={t} />
                    {inv.profitAmount && <div className="text-emerald-400 font-medium">+{formatCurrency(inv.profitAmount)}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl bg-slate-900 border border-slate-800 p-6">
          <h2 className="text-lg font-semibold mb-1">{t.networkTitle}</h2>
          <p className="text-sm text-slate-400 
