import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

const copy = {
  en: {
    title: 'Pending approvals',
    loading: 'Loading…',
    approvalsEmpty: 'No pending approvals.',
    referredByLabel: 'Referred by',
    assignAdvisorPlaceholder: 'Assign advisor (optional)',
    approveButton: 'Approve',
    rejectButton: 'Reject',
  },
  ar: {
    title: 'حسابات بانتظار الموافقة',
    loading: 'عم يحمّل…',
    approvalsEmpty: 'ما في حسابات بانتظار الموافقة.',
    referredByLabel: 'دعوة من',
    assignAdvisorPlaceholder: 'عيّن مستشار (اختياري)',
    approveButton: 'موافقة',
    rejectButton: 'رفض',
  },
};

function formatDate(dateStr, locale) {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(
    new Date(dateStr)
  );
}

const approveBtnClass =
  'inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20 disabled:opacity-50 transition-colors';
const rejectBtnClass =
  'inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg bg-rose-400/10 text-rose-400 hover:bg-rose-400/20 disabled:opacity-50 transition-colors';

export default function AdminApprovals() {
  const { locale } = useOutletContext();
  const t = copy[locale];

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [advisorsList, setAdvisorsList] = useState([]);
  const [advisorSelections, setAdvisorSelections] = useState({});
  const [processingId, setProcessingId] = useState(null);

  async function loadData() {
    setLoading(true);
    setErrorMsg('');
    try {
      const [pendingRes, advisorsRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name, referral_code, referred_by, created_at').eq('status', 'pending'),
        supabase.from('profiles').select('id, full_name').eq('role', 'advisor').eq('status', 'approved'),
      ]);
      if (pendingRes.error) throw pendingRes.error;
      if (advisorsRes.error) throw advisorsRes.error;

      const referrerIds = [...new Set((pendingRes.data || []).map((a) => a.referred_by).filter(Boolean))];
      let referrerMap = {};
      if (referrerIds.length > 0) {
        const { data: referrers } = await supabase.from('profiles').select('id, full_name').in('id', referrerIds);
        referrerMap = Object.fromEntries((referrers || []).map((r) => [r.id, r.full_name]));
      }

      setAccounts(
        (pendingRes.data || []).map((a) => ({
          id: a.id,
          name: a.full_name,
          referralCode: a.referral_code,
          referredBy: a.referred_by ? referrerMap[a.referred_by] || '—' : '—',
          requestedAt: a.created_at,
        }))
      );
      setAdvisorsList(advisorsRes.data || []);
    } catch (err) {
      setErrorMsg(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleApprove(account) {
    setProcessingId(account.id);
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
      setProcessingId(null);
    }
  }

  async function handleReject(account) {
    setProcessingId(account.id);
    setErrorMsg('');
    try {
      const { error } = await supabase.rpc('reject_account', { p_profile_id: account.id });
      if (error) throw error;
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || String(err));
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t.title}</h1>

      {errorMsg && (
        <div className="rounded-lg bg-rose-400/10 border border-rose-400/20 px-4 py-3 text-sm text-rose-400">{errorMsg}</div>
      )}

      {loading ? (
        <p className="text-slate-400 text-sm">{t.loading}</p>
      ) : accounts.length === 0 ? (
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
                <button type="button" disabled={processingId === account.id} onClick={() => handleApprove(account)} className={approveBtnClass}>
                  <Check className="w-4 h-4" />
                  {t.approveButton}
                </button>
                <button type="button" disabled={processingId === account.id} onClick={() => handleReject(account)} className={rejectBtnClass}>
                  <X className="w-4 h-4" />
                  {t.rejectButton}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
