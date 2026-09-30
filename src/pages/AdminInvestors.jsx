import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const copy = {
  en: {
    title: 'Investors',
    loading: 'Loading…',
    empty: 'No investors yet.',
    statusApproved: 'Approved',
    statusPending: 'Pending',
    statusRejected: 'Rejected',
    deleteButton: 'Delete',
    deleteConfirm: (name) => `Permanently delete ${name}'s account? This cannot be undone — they will lose all access.`,
  },
  ar: {
    title: 'المستثمرين',
    loading: 'عم يحمّل…',
    empty: 'ما في مستثمرين لسا.',
    statusApproved: 'موافَق عليه',
    statusPending: 'بانتظار الموافقة',
    statusRejected: 'مرفوض',
    deleteButton: 'حذف',
    deleteConfirm: (name) => `تحذف حساب ${name} نهائياً؟ ما فيك ترجعو — رح يخسر كل صلاحية دخول.`,
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
  const [deletingId, setDeletingId] = useState(null);

  async function loadData() {
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

  useEffect(() => {
    loadData();
  }, []);

  async function handleDelete(inv) {
    if (!window.confirm(t.deleteConfirm(inv.full_name))) return;
    setDeletingId(inv.id);
    setErrorMsg('');
    try {
      const { error } = await supabase.rpc('delete_investor_account', { p_profile_id: inv.id });
      if (error) throw error;
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || String(err));
    } finally {
      setDeletingId(null);
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
      ) : investors.length === 0 ? (
        <p className="text-slate-400 text-sm">{t.empty}</p>
      ) : (
        <div className="space-y-2">
          {investors.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-slate-900 border border-slate-800 p-4"
            >
              <Link to={`/admin/investors/${inv.id}`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
                <span className="font-medium text-slate-100 truncate">{inv.full_name}</span>
                <StatusBadge status={inv.status} t={t} />
                <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
              </Link>
              <button
                type="button"
                disabled={deletingId === inv.id}
                onClick={() => handleDelete(inv)}
                className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-rose-400/10 text-rose-400 hover:bg-rose-400/20 disabled:opacity-50 transition-colors flex-shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t.deleteButton}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
