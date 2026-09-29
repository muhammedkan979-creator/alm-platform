import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Users, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const copy = {
  en: {
    welcomeAdmin: (name) => `Welcome back, ${name}`,
    loading: 'Loading…',
    statTotalInvestors: 'Total investors',
    statTotalInvested: 'Total invested',
  },
  ar: {
    welcomeAdmin: (name) => `أهلين، ${name}`,
    loading: 'عم يحمّل…',
    statTotalInvestors: 'إجمالي المستثمرين',
    statTotalInvested: 'إجمالي الاستثمار',
  },
};

function formatCurrency(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
      <div className="flex items-center gap-2 text-slate-400 mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-sm">{label}</span>
      </div>
      <div className="text-2xl font-semibold text-slate-50">{value}</div>
    </div>
  );
}

export default function AdminOverview() {
  const { profile } = useAuth();
  const { locale } = useOutletContext();
  const t = copy[locale];

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [totalInvestors, setTotalInvestors] = useState(0);
  const [totalInvested, setTotalInvested] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErrorMsg('');
      try {
        const [investorsCountRes, investmentsRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'investor'),
          supabase.from('investments').select('amount'),
        ]);
        if (investorsCountRes.error) throw investorsCountRes.error;
        if (investmentsRes.error) throw investmentsRes.error;
        setTotalInvestors(investorsCountRes.count || 0);
        setTotalInvested((investmentsRes.data || []).reduce((sum, inv) => sum + Number(inv.amount), 0));
      } catch (err) {
        setErrorMsg(err.message || String(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">{t.welcomeAdmin(profile?.full_name || '')}</h1>

      {errorMsg && (
        <div className="rounded-lg bg-rose-400/10 border border-rose-400/20 px-4 py-3 text-sm text-rose-400">{errorMsg}</div>
      )}

      {loading ? (
        <p className="text-slate-400 text-sm">{t.loading}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard icon={Users} label={t.statTotalInvestors} value={totalInvestors} />
          <StatCard icon={TrendingUp} label={t.statTotalInvested} value={formatCurrency(totalInvested)} />
        </div>
      )}
    </div>
  );
}
