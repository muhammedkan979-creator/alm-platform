import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

const copy = {
  en: {
    title: 'Investors',
    loading: 'Loading…',
    empty: 'No investors yet.',
    statusApproved: 'Approved',
    statusPending: 'Pending',
    statusRejected: 'Rejected',
  },
  ar: {
    title: 'المستثمرين',
    loading: 'عم يحمّل…',
    empty: 'ما في مستثمرين لسا.',
    statusApproved: 'موافَق عليه',
    statusPending: 'بانتظار الموافقة',
    statusRejected: 'مرفوض',
  },
};

function StatusBadge({ status, t }) {
  const map = {
    approved: { text: t.statusApproved, cls: 'bg-emerald-400/10 text-emerald-400' },
    pending: { text: t.statusPending, cls: 'bg-amber-400/10 text-amber-400' },
    rejected: { text: t.statusRejected, cls: 'bg-rose-400/10 text-rose-400' },
  };
  const s = map[status] || map.pending;
  return <span className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${s.cls}`}>{s.text}</span>;
}

export default function AdminInvestors() {
  const locale = 'en';
  const t = copy[locale];

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [investors, setInvestors] = useState([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErrorMsg('');
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, status')
          .eq('role', 'investor')
          .order('full_name', { ascending: true });
        if (error) throw error;
        setInvestors(data || []);
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

      {loading ? (
        <p className="text-slate-400 text-sm">{t.loading}</p>
      ) : investors.length === 0 ? (
        <p className="text-slate-400 text-sm">{t.empty}</p>
      ) : (
        <div className="space-y-2">
          {investors.map((inv) => (
            <Link
              key={inv.id}
              to={`/admin/investors/${inv.id}`}
              className="flex items-center justify-between gap-3 rounded-xl bg-slate-900 border border-slate-800 p-4 hover:bg-slate-800/60 transition-colors"
            >
              <span className="font-medium text-slate-100">{inv.full_name}</span>
              <div className="flex items-center gap-2">
                <StatusBadge status={inv.status} t={t} />
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
