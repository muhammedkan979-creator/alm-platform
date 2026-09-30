import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Coins, Wallet, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

const copy = {
  title: 'Investor details',
  loading: 'Loading…',
  notFound: 'Investor not found.',
  backButton: 'Back to investors',
  statusApproved: 'Approved',
  statusPending: 'Pending',
  statusRejected: 'Rejected',
  statTotalInvested: 'Total invested',
  statPoints: 'Points balance',
  statActiveInvestments: 'Active investments',
  referralCodeLabel: 'Referral code',
  advisorLabel: 'Assigned advisor',
  noAdvisor: 'No advisor assigned',
  investmentsTitle: 'Investments',
  investmentsEmpty: 'No investments yet.',
  rateLabel: 'Rate',
  profitCalculating: 'Calculating',
  profitDue: 'Profit due',
  profitPaid: 'Profit paid',
  paymentsTitle: 'Payments',
  paymentsEmpty: 'No payments recorded.',
  withdrawalsTitle: 'Withdrawal requests',
  withdrawalsEmpty: 'No withdrawal requests.',
  pointsUnit: 'pts',
  reqStatusPending: 'Pending',
  reqStatusApproved: 'Approved',
  reqStatusRejected: 'Rejected',
  typeMembership: 'Membership',
  typeInvestment: 'Investment',
  typeOther: 'Other',
};

function formatCurrency(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function formatDate(dateStr) {
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(dateStr));
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

function StatusBadge({ status }) {
  const map = {
    approved: { text: copy.statusApproved, cls: 'bg-emerald-400/10 text-emerald-400' },
    pending: { text: copy.statusPending, cls: 'bg-amber-400/10 text-amber-400' },
    rejected: { text: copy.statusRejected, cls: 'bg-rose-400/10 text-rose-400' },
  };
  const s = map[status] || map.pending;
  return <span className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${s.cls}`}>{s.text}</span>;
}

function ProfitStatusBadge({ status }) {
  const map = {
    calculating: { text: copy.profitCalculating, cls: 'bg-slate-800 text-slate-400' },
    due: { text: copy.profitDue, cls: 'bg-amber-400/10 text-amber-400' },
    paid: { text: copy.profitPaid, cls: 'bg-emerald-400/10 text-emerald-400' },
  };
  const s = map[status] || map.calculating;
  return <span className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${s.cls}`}>{s.text}</span>;
}

function RequestStatusBadge({ status }) {
  const map = {
    pending: { text: copy.reqStatusPending, cls: 'bg-slate-800 text-slate-400' },
    approved: { text: copy.reqStatusApproved, cls: 'bg-emerald-400/10 text-emerald-400' },
    rejected: { text: copy.reqStatusRejected, cls: 'bg-rose-400/10 text-rose-400' },
  };
  const s = map[status] || map.pending;
  return <span className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${s.cls}`}>{s.text}</span>;
}

function PaymentTypeBadge({ type }) {
  const map = {
    membership: { text: copy.typeMembership, cls: 'bg-amber-400/10 text-amber-400' },
    investment: { text: copy.typeInvestment, cls: 'bg-emerald-400/10 text-emerald-400' },
    other: { text: copy.typeOther, cls: 'bg-slate-800 text-slate-400' },
  };
  const s = map[type] || map.other;
  return <span className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${s.cls}`}>{s.text}</span>;
}

export default function AdminInvestorDetail() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [profile, setProfile] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [advisorName, setAdvisorName] = useState(null);
  const [points, setPoints] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErrorMsg('');
      try {
        const [profileRes, investmentsRes, paymentsRes, withdrawalsRes, advisorLinkRes, pointsRes] = await Promise.all([
          supabase.from('profiles').select('id, full_name, status, referral_code').eq('id', id).single(),
          supabase.from('investments').select('*').eq('profile_id', id).order('start_at', { ascending: false }),
          supabase.from('payments').select('*').eq('profile_id', id).order('created_at', { ascending: false }),
          supabase.from('point_withdrawal_requests').select('*').eq('profile_id', id).order('requested_at', { ascending: false }),
          supabase.from('advisor_assignments').select('advisor_id').eq('investor_id', id).limit(1),
          supabase.rpc('get_points', { p_profile_id: id }),
        ]);

        if (profileRes.error) throw profileRes.error;
        if (investmentsRes.error) throw investmentsRes.error;
        if (paymentsRes.error) throw paymentsRes.error;
        if (withdrawalsRes.error) throw withdrawalsRes.error;

        setProfile(profileRes.data);
        setInvestments(investmentsRes.data || []);
        setPayments(paymentsRes.data || []);
        setWithdrawals(withdrawalsRes.data || []);
        setPoints(pointsRes.data || 0);

        const advisorId = (advisorLinkRes.data || [])[0]?.advisor_id;
        if (advisorId) {
          const { data: advisorProfile } = await supabase.from('profiles').select('full_name').eq('id', advisorId).single();
          setAdvisorName(advisorProfile?.full_name || null);
        }
      } catch (err) {
        setErrorMsg(err.message || String(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const totalInvested = investments.reduce((sum, inv) => sum + Number(inv.amount), 0);

  return (
    <div className="space-y-6">
      <Link to="/admin/investors" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        {copy.backButton}
      </Link>

      {errorMsg && (
        <div className="rounded-lg bg-rose-400/10 border border-rose-400/20 px-4 py-3 text-sm text-rose-400">{errorMsg}</div>
      )}

      {loading ? (
        <p className="text-slate-400 text-sm">{copy.loading}</p>
      ) : !profile ? (
        <p className="text-slate-400 text-sm">{copy.notFound}</p>
      ) : (
        <>
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
                <User className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-semibold">{profile.full_name}</h1>
              <StatusBadge status={profile.status} />
            </div>
            <div className="text-sm text-slate-400 space-y-1">
              <div>{copy.referralCodeLabel}: <code className="text-amber-400 font-mono">{profile.referral_code}</code></div>
              <div>{copy.advisorLabel}: {advisorName || copy.noAdvisor}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard icon={TrendingUp} label={copy.statTotalInvested} value={formatCurrency(totalInvested)} />
            <StatCard icon={Coins} label={copy.statPoints} value={`${points} ${copy.pointsUnit}`} />
            <StatCard icon={Wallet} label={copy.statActiveInvestments} value={investments.length} />
          </div>

          <section>
            <h2 className="text-lg font-semibold mb-4">{copy.investmentsTitle}</h2>
            {investments.length === 0 ? (
              <p className="text-slate-400 text-sm">{copy.investmentsEmpty}</p>
            ) : (
              <div className="space-y-3">
                {investments.map((inv) => (
                  <div key={inv.id} className="rounded-xl bg-slate-900 border border-slate-800 p-4 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="text-lg font-semibold">{formatCurrency(Number(inv.amount))}</div>
                      <div className="text-sm text-slate-400">
                        {formatDate(inv.start_at)} – {formatDate(inv.end_at)}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {inv.annual_profit_rate != null && (
                        <div className="text-sm text-slate-400">{copy.rateLabel}: {inv.annual_profit_rate}%</div>
                      )}
                      <ProfitStatusBadge status={inv.profit_status} />
                      {inv.profit_amount != null && (
                        <div className="text-emerald-400 font-medium">+{formatCurrency(Number(inv.profit_amount))}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-4">{copy.paymentsTitle}</h2>
            {payments.length === 0 ? (
              <p className="text-slate-400 text-sm">{copy.paymentsEmpty}</p>
            ) : (
              <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-2">
                {payments.map((p) => (
                  <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 text-sm py-2 border-b border-slate-800 last:border-0">
                    <div className="flex items-center gap-2">
                      <PaymentTypeBadge type={p.type} />
                      {p.note && <span className="text-slate-500 text-xs">{p.note}</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 text-xs">{formatDate(p.created_at)}</span>
                      <span className="font-medium text-slate-50">{formatCurrency(Number(p.amount))}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-4">{copy.withdrawalsTitle}</h2>
            {withdrawals.length === 0 ? (
              <p className="text-slate-400 text-sm">{copy.withdrawalsEmpty}</p>
            ) : (
              <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-2">
                {withdrawals.map((w) => (
                  <div key={w.id} className="flex items-center justify-between text-sm py-2 border-b border-slate-800 last:border-0">
                    <span className="text-slate-300">
                      {w.points} {copy.pointsUnit} — {formatDate(w.requested_at)}
                    </span>
                    <RequestStatusBadge status={w.status} />
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
