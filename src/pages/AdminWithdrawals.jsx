import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

const copy = {
  en: {
    title: 'Pending withdrawal requests',
    loading: 'Loading…',
    withdrawalsEmpty: 'No pending withdrawal requests.',
    pointsUnit: 'pts',
    approveButton: 'Approve',
    rejectButton: 'Reject',
  },
  ar: {
    title: 'طلبات سحب النقاط المعلّقة',
    loading: 'عم يحمّل…',
    withdrawalsEmpty: 'ما في طلبات سحب معلّقة.',
    pointsUnit: 'نقطة',
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

export default function AdminWithdrawals() {
  const { locale } = useOutletContext();
  const t = copy[locale];

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [withdrawals, setWithdrawals] = useState([]);
  const [processingId, setProcessingId] = useState(null);

  async function loadData() {
    setLoading(true);
    setErrorMsg('');
    try {
      const { data, error } = await supabase
        .from('point_withdrawal_requests')
        .select('id, profile_id, points, requested_at')
        .eq('status', 'pending');
      if (error) throw error;

      const profileIds = [...new Set((data || []).map((w) => w.profile_id))];
      let nameMap = {};
      if (profileIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', profileIds);
        nameMap = Object.fromEntries((profiles || []).map((p) => [p.id, p.full_name]));
      }

      setWithdrawals(
        (data || []).map((w) => ({
          id: w.id,
          investorName: nameMap[w.profile_id] || '—',
          points: w.points,
          requestedAt: w.requested_at,
        }))
      );
    } catch (err) {
      setErrorMsg(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleDecision(w, approve) {
    setProcessingId(w.id);
    setErrorMsg('');
    try {
      const { error } = await supabase.rpc('decide_withdrawal_request', { p_request_id: w.id, p_approve: approve });
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
      ) : withdrawals.length === 0 ? (
        <p className="text-slate-400 text-sm">{t.withdrawalsEmpty}</p>
      ) : (
        <div className="space-y-3">
          {withdrawals.map((w) => (
            <div key={w.id} className="rounded-xl bg-slate-900 border border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-slate-50">{w.investorName}</div>
                <div className="text-xs text-slate-500 mt-0.5">{formatDate(w.requestedAt, locale)}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-amber-400 font-semibold">
                  {w.points} {t.pointsUnit}
                </span>
                <button type="button" disabled={processingId === w.id} onClick={() => handleDecision(w, true)} className={approveBtnClass}>
                  <Check className="w-4 h-4" />
                  {t.approveButton}
                </button>
                <button type="button" disabled={processingId === w.id} onClick={() => handleDecision(w, false)} className={rejectBtnClass}>
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
