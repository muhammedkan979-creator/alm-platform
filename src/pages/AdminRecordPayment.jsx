import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const copy = {
  en: {
    title: 'Record a payment',
    selectInvestor: 'Select investor',
    paymentType: 'Payment type',
    typeMembership: 'Membership',
    typeInvestment: 'Investment',
    typeOther: 'Other',
    amountLabel: 'Amount ($)',
    noteLabel: 'Note (optional)',
    notePlaceholder: 'e.g. bank transfer ref #1234',
    recordButton: 'Record payment',
    recordSuccess: (name) => `Payment recorded for ${name}.`,
    errorRequired: 'Required',
    errorAmount: 'Enter an amount greater than 0',
  },
  ar: {
    title: 'تسجيل دفعة',
    selectInvestor: 'اختار المستثمر',
    paymentType: 'نوع الدفعة',
    typeMembership: 'عضوية',
    typeInvestment: 'استثمار',
    typeOther: 'أخرى',
    amountLabel: 'المبلغ ($)',
    noteLabel: 'ملاحظة (اختياري)',
    notePlaceholder: 'مثلاً: رقم حوالة بنكية 1234',
    recordButton: 'سجّل الدفعة',
    recordSuccess: (name) => `تم تسجيل الدفعة لـ ${name}.`,
    errorRequired: 'مطلوب',
    errorAmount: 'دخّل مبلغ أكبر من 0',
  },
};

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

export default function AdminRecordPayment() {
  const { locale } = useOutletContext();
  const t = copy[locale];

  const [investorsList, setInvestorsList] = useState([]);
  const [selectedInvestor, setSelectedInvestor] = useState('');
  const [paymentType, setPaymentType] = useState('membership');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadInvestors() {
      const { data, error } = await supabase.from('profiles').select('id, full_name').eq('role', 'investor').eq('status', 'approved');
      if (!error) setInvestorsList(data || []);
    }
    loadInvestors();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const next = {};
    if (!selectedInvestor) next.investor = t.errorRequired;
    if (!amount || Number(amount) <= 0) next.amount = t.errorAmount;
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    setSuccess('');
    setErrorMsg('');
    try {
      const { error } = await supabase.rpc('record_payment', {
        p_profile_id: selectedInvestor,
        p_type: paymentType,
        p_amount: Number(amount),
        p_note: note.trim() || null,
      });
      if (error) throw error;
      const investorName = investorsList.find((i) => i.id === selectedInvestor)?.full_name || '';
      setSuccess(t.recordSuccess(investorName));
      setSelectedInvestor('');
      setPaymentType('membership');
      setAmount('');
      setNote('');
    } catch (err) {
      setErrorMsg(err.message || String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t.title}</h1>

      {errorMsg && (
        <div className="rounded-lg bg-rose-400/10 border border-rose-400/20 px-4 py-3 text-sm text-rose-400">{errorMsg}</div>
      )}

      <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label={t.selectInvestor}>
            <select value={selectedInvestor} onChange={(e) => setSelectedInvestor(e.target.value)} className={inputClass}>
              <option value="">{t.selectInvestor}</option>
              {investorsList.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.full_name}
                </option>
              ))}
            </select>
            {errors.investor && <p className="mt-1.5 text-xs text-rose-400">{errors.investor}</p>}
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t.paymentType}>
              <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)} className={inputClass}>
                <option value="membership">{t.typeMembership}</option>
                <option value="investment">{t.typeInvestment}</option>
                <option value="other">{t.typeOther}</option>
              </select>
            </Field>
            <Field label={t.amountLabel}>
              <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} />
              {errors.amount && <p className="mt-1.5 text-xs text-rose-400">{errors.amount}</p>}
            </Field>
          </div>

          <Field label={t.noteLabel}>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t.notePlaceholder} className={inputClass} />
          </Field>

          <button
            type="submit"
            disabled={submitting}
            className="bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-950 font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors"
          >
            {t.recordButton}
          </button>
          {success && <p className="text-emerald-400 text-sm">{success}</p>}
        </form>
      </div>
    </div>
  );
}
