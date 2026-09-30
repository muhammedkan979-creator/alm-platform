import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Gift, Power, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const copy = {
  en: {
    title: 'Manage rewards',
    rewardNameEn: 'Reward name (English)',
    rewardNameAr: 'Reward name (Arabic)',
    pointsCostLabel: 'Points cost',
    stockLabel: 'Stock (leave empty for unlimited)',
    addRewardButton: 'Add reward',
    unlimitedStock: 'Unlimited',
    inStock: (n) => `${n} left`,
    outOfStock: 'Out of stock',
    activeLabel: 'Active',
    inactiveLabel: 'Inactive',
    deactivateButton: 'Deactivate',
    activateButton: 'Activate',
    deleteButton: 'Delete',
    deleteConfirm: 'Delete this reward? This cannot be undone.',
    errorRequired: 'Required',
    errorAmount: 'Enter an amount greater than 0',
  },
  ar: {
    title: 'إدارة الجوائز',
    rewardNameEn: 'اسم الجائزة (انجليزي)',
    rewardNameAr: 'اسم الجائزة (عربي)',
    pointsCostLabel: 'عدد النقاط المطلوبة',
    stockLabel: 'الكمية (اتركها فاضية لغير محدود)',
    addRewardButton: 'إضافة جائزة',
    unlimitedStock: 'غير محدود',
    inStock: (n) => `${n} متبقي`,
    outOfStock: 'خلصت',
    activeLabel: 'فعّالة',
    inactiveLabel: 'موقوفة',
    deactivateButton: 'إيقاف',
    activateButton: 'تفعيل',
    deleteButton: 'حذف',
    deleteConfirm: 'تحذف هالجائزة؟ ما فيك ترجعها بعدين.',
    errorRequired: 'مطلوب',
    errorAmount: 'دخّل مبلغ أكبر من 0',
  },
};

function translateReward(value, locale) {
  return (value && value[locale]) || (value && value.en) || '';
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-300 mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

const inputClass =
  'w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2.5 text-slate-50 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors';

export default function AdminRewards() {
  const { locale } = useOutletContext();
  const t = copy[locale];

  const [rewardsList, setRewardsList] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  const [newRewardNameEn, setNewRewardNameEn] = useState('');
  const [newRewardNameAr, setNewRewardNameAr] = useState('');
  const [newRewardCost, setNewRewardCost] = useState('');
  const [newRewardStock, setNewRewardStock] = useState('');
  const [rewardErrors, setRewardErrors] = useState({});
  const [deletingId, setDeletingId] = useState(null);

  async function loadData() {
    setErrorMsg('');
    const { data, error } = await supabase.from('rewards').select('*').order('created_at', { ascending: false });
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    setRewardsList(data || []);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleToggleActive(reward) {
    setErrorMsg('');
    const { error } = await supabase.from('rewards').update({ active: !reward.active }).eq('id', reward.id);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    await loadData();
  }

  async function handleDelete(reward) {
    if (!window.confirm(t.deleteConfirm)) return;
    setDeletingId(reward.id);
    setErrorMsg('');
    const { error } = await supabase.from('rewards').delete().eq('id', reward.id);
    setDeletingId(null);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    await loadData();
  }

  async function handleAddReward(e) {
    e.preventDefault();
    const next = {};
    if (!newRewardNameEn.trim()) next.nameEn = t.errorRequired;
    if (!newRewardNameAr.trim()) next.nameAr = t.errorRequired;
    if (!newRewardCost || Number(newRewardCost) <= 0) next.cost = t.errorAmount;
    setRewardErrors(next);
    if (Object.keys(next).length > 0) return;

    setErrorMsg('');
    const { error } = await supabase.from('rewards').insert({
      name: { en: newRewardNameEn.trim(), ar: newRewardNameAr.trim() },
      points_cost: Number(newRewardCost),
      stock_quantity: newRewardStock.trim() === '' ? null : Number(newRewardStock),
      active: true,
    });
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    setNewRewardNameEn('');
    setNewRewardNameAr('');
    setNewRewardCost('');
    setNewRewardStock('');
    await loadData();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t.title}</h1>

      {errorMsg && (
        <div className="rounded-lg bg-rose-400/10 border border-rose-400/20 px-4 py-3 text-sm text-rose-400">{errorMsg}</div>
      )}

      <div className="rounded-xl bg-slate-900 border border-slate-800 p-6">
        <div className="space-y-2 mb-6">
          {rewardsList.map((r) => {
            const stockText =
              r.stock_quantity === null ? t.unlimitedStock : r.stock_quantity > 0 ? t.inStock(r.stock_quantity) : t.outOfStock;
            return (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-950 border border-slate-800 px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center flex-shrink-0">
                    <Gift className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-100 truncate">{translateReward(r.name, locale)}</div>
                    <div className="text-xs text-slate-500">
                      {t.pointsCostLabel}: {r.points_cost} · {stockText}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full ${
                      r.active ? 'bg-emerald-400/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {r.active ? t.activeLabel : t.inactiveLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(r)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    <Power className="w-3.5 h-3.5" />
                    {r.active ? t.deactivateButton : t.activateButton}
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === r.id}
                    onClick={() => handleDelete(r)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-rose-400/10 text-rose-400 hover:bg-rose-400/20 disabled:opacity-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {t.deleteButton}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <form onSubmit={handleAddReward} className="space-y-4 border-t border-slate-800 pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t.rewardNameEn}>
              <input value={newRewardNameEn} onChange={(e) => setNewRewardNameEn(e.target.value)} className={inputClass} />
              {rewardErrors.nameEn && <p className="mt-1.5 text-xs text-rose-400">{rewardErrors.nameEn}</p>}
            </Field>
            <Field label={t.rewardNameAr}>
              <input value={newRewardNameAr} onChange={(e) => setNewRewardNameAr(e.target.value)} className={inputClass} dir="rtl" />
              {rewardErrors.nameAr && <p className="mt-1.5 text-xs text-rose-400">{rewardErrors.nameAr}</p>}
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t.pointsCostLabel}>
              <input type="number" min="1" value={newRewardCost} onChange={(e) => setNewRewardCost(e.target.value)} className={inputClass} />
              {rewardErrors.cost && <p className="mt-1.5 text-xs text-rose-400">{rewardErrors.cost}</p>}
            </Field>
            <Field label={t.stockLabel}>
              <input type="number" min="0" value={newRewardStock} onChange={(e) => setNewRewardStock(e.target.value)} className={inputClass} />
            </Field>
          </div>
          <button
            type="submit"
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors"
          >
            {t.addRewardButton}
          </button>
        </form>
      </div>
    </div>
  );
}
