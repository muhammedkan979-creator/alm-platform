import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const copy = {
  en: {
    title: 'Payments log',
    loading: 'Loading…',
    noPayments: 'No payments recorded yet.',
    typeMembership: 'Membership',
    typeInvestment: 'Investment',
    typeOther: 'Other',
  },
  ar: {
    title: 'سجل الدفعات',
    loading: 'عم يحمّل…',
    noPayments: 'لسا ما في دفعات مسجّلة.',
    typeMembership: 'عضوية',
    typeInvestment: 'استثمار',
    typeOther: 'أخرى',
  },
};

function formatCurrency(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function formatDate(dateStr, locale) {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(
    new Date(dateStr)
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

export default function AdminPaymentsLog() {
  const { locale } = useOutletContext();
  const t = copy[locale];

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErrorMsg('');
      try {
        const { data, error } = await supabase
          .from('payments')
          .select('id, profile_id, type, amount, note, created_at')
          .order('created_at', { ascending: false })
          .limit(100);
        if (error) throw error;

        const profileIds = [...new Set((data || []).map((p) => p.profile_id))];
        let nameMap = {};
        if (profileIds.length > 0) {
          const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', profileIds);
          nameMap = Object.fromEntries((profiles || []).map((p) => [p.id, p.full_name]));
        }

        setPayments(
          (data || []).map((p) => ({
            id: p.id,
            investorName: nameMap[p.profile_id] || '—',
            type: p.type,
            amount: Number(p.amount),
            note: p.note || '',
            recordedAt: p.created_at,
          }))
        );
      } catch (err) {
        setErrorMsg(err.message || String(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t.title}</h1>

      {errorMsg && (
        <div className="rounded-lg bg-rose-400/10 border border-rose-400/20 px-4 py-3 text-sm text-rose-400">{errorMsg}</div>
      )}

      <div className="rounded-xl bg-slate-900 border border-slate-800 p-6">
        {loading ? (
          <p className="text-slate-400 text-sm">{t.loading}</p>
        ) : payments.length === 0 ? (
          <p className="text-slate-400 text-sm">{t.noPayments}</p>
        ) : (
          <div className="space-y-2">
            {payments.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 text-sm py-2 border-b border-slate-800 last:border-0">
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
    </div>
  );
}
