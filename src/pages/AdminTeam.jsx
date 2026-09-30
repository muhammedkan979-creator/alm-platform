import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const copy = {
  en: {
    title: 'Team & roles',
    loading: 'Loading…',
    teamEmpty: 'No approved members yet.',
    roleInvestor: 'Investor',
    roleAdvisorLabel: 'Advisor',
    promoteButton: 'Promote to advisor',
    demoteButton: 'Demote to investor',
  },
  ar: {
    title: 'الفريق والأدوار',
    loading: 'عم يحمّل…',
    teamEmpty: 'ما في أعضاء موافَق عليهم لسا.',
    roleInvestor: 'مستثمر',
    roleAdvisorLabel: 'مستشار',
    promoteButton: 'رقّي لمستشار',
    demoteButton: 'رجّع لمستثمر',
  },
};

const approveBtnClass =
  'inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20 disabled:opacity-50 transition-colors';
const rejectBtnClass =
  'inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg bg-rose-400/10 text-rose-400 hover:bg-rose-400/20 disabled:opacity-50 transition-colors';

function RoleBadge({ role, t }) {
  const isAdvisor = role === 'advisor';
  return (
    <span
      className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${
        isAdvisor ? 'bg-amber-400/10 text-amber-400' : 'bg-slate-800 text-slate-400'
      }`}
    >
      {isAdvisor ? t.roleAdvisorLabel : t.roleInvestor}
    </span>
  );
}

export default function AdminTeam() {
  const { locale } = useOutletContext();
  const t = copy[locale];

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  const [processingId, setProcessingId] = useState(null);

  async function loadData() {
    setLoading(true);
    setErrorMsg('');
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('status', 'approved')
        .in('role', ['investor', 'advisor'])
        .order('role', { ascending: true });
      if (error) throw error;
      setTeamMembers(data || []);
    } catch (err) {
      setErrorMsg(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleToggle(member) {
    setProcessingId(member.id);
    setErrorMsg('');
    try {
      const makeAdvisor = member.role !== 'advisor';
      const { error } = await supabase.rpc('set_advisor_role', {
        p_profile_id: member.id,
        p_make_advisor: makeAdvisor,
      });
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
      ) : teamMembers.length === 0 ? (
        <p className="text-slate-400 text-sm">{t.teamEmpty}</p>
      ) : (
        <div className="space-y-2">
          {teamMembers.map((member) => (
            <div key={member.id} className="rounded-xl bg-slate-900 border border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="font-medium text-slate-100">{member.full_name}</span>
                <RoleBadge role={member.role} t={t} />
              </div>
              <button
                type="button"
                disabled={processingId === member.id}
                onClick={() => handleToggle(member)}
                className={member.role === 'advisor' ? rejectBtnClass : approveBtnClass}
              >
                {member.role === 'advisor' ? <ArrowDownCircle className="w-4 h-4" /> : <ArrowUpCircle className="w-4 h-4" />}
                {member.role === 'advisor' ? t.demoteButton : t.promoteButton}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
