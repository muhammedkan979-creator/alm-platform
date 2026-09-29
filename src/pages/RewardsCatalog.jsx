import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Globe, Gift, Coins, Loader2, LogOut, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

/*
  Rewards catalog for the ALM Platform — wired to real Supabase data.
  Reads active rewards from the rewards table and the investor's
  available points via the available_points RPC. Redemption calls
  redeem_reward(), which re-checks points, stock, and active status
  server-side and decrements stock atomically.
*/

const copy = {
  en: {
    brand: 'ALM Platform',
    switchLanguage: 'العربية',
    pageTitle: 'Rewards catalog',
    pageSubtitle: 'Redeem your points for rewards.',
    loading: 'Loading…',
    pointsAvailable: (n) => `${n} points available`,
    redeemButton: 'Redeem',
    notEnoughPoints: 'Not enough points',
    pointsCost: (n) => `${n} pts`,
    redeemedToast: (name) => `Redeemed: ${name}`,
    unlimitedStock: 'Unlimited',
    inStock: (n) => `${n} left`,
    outOfStock: 'Out of stock',
    catalogEmpty: 'No rewards available right now.',
  },
  ar: {
    brand: 'منصّة ALM',
    switchLanguage: 'English',
    pageTitle: 'كتالوج الجوائز',
    pageSubtitle: 'استبدل نقاطك بجوائز.',
    loading: 'عم يحمّل…',
    pointsAvailable: (n) => `${n} نقطة متوفرة`,
    redeemButton: 'استبدال',
    notEnoughPoints: 'نقاط غير كافية',
    pointsCost: (n) => `${n} نقطة`,
    redeemedToast: (name) => `تم استبدال: ${name}`,
    unlimitedStock: 'غير محدود',
    inStock: (n) => `${n} متبقي`,
    outOfStock: 'خلصت',
    catalogEmpty: 'ما في جوائز متوفرة هلق.',
  },
};

function translate(value, locale) {
  return (value && value[locale]) || (value && value.en) || '';
}

export default function RewardsCatalog() {
  const { signOut, profile } = useAuth();
  const [locale, setLocale] = useState('en');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [rewardsCatalog, setRewardsCatalog] = useState([]);
  const [available, setAvailable] = useState(0);
  const [processingId, setProcessingId] = useState(null);
  const [toast, setToast] = useState('');

  const t = copy[locale];
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  async function loadData() {
    if (!profile?.id) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const [rewardsRes, availableRes] = await Promise.all([
        supabase.from('rewards').select('*').eq('active', true).order('points_cost', { ascending: true }),
        supabase.rpc('available_points', { p_profile_id: profile.id }),
      ]);
      if (rewardsRes.error) throw rewardsRes.error;
      if (availableRes.error) throw availableRes.error;
      setRewardsCatalog(rewardsRes.data || []);
      setAvailable(availableRes.data || 0);
    } catch (err) {
      setErrorMsg(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  async function handleRedeem(reward) {
    const outOfStock = reward.stock_quantity !== null && reward.stock_quantity <= 0;
    if (reward.points_cost > available || outOfStock) return;
    setProcessingId(reward.id);
    setErrorMsg('');
    try {
      const { error } = await supabase.rpc('redeem_reward', { p_reward_id: reward.id });
      if (error) throw error;
      setToast(t.redeemedToast(translate(reward.name, locale)));
      setTimeout(() => setToast(''), 2200);
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || String(err));
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div dir={dir} lang={locale} className="min-h-screen bg-slate-950 font-sans text-slate-50">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/investor"
              aria-label="Back to dashboard"
              className="rounded-md p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" style={{ transform: dir === 'rtl' ? 'scaleX(-1)' : 'none' }} />
            </Link>
            <div className="text-amber-400 font-semibold tracking-tight text-lg">{t.brand}</div>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
              className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <Globe className="w-4 h-4" />
              {t.switchLanguage}
            </button>
            <button
              type="button"
              onClick={signOut}
              aria-label="Sign out"
              className="rounded-md p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold mb-1">{t.pageTitle}</h1>
            <p className="text-slate-400 text-sm">{t.pageSubtitle}</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg bg-slate-900 border border-slate-800 px-4 py-2.5">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 font-semibold">{t.pointsAvailable(available)}</span>
          </div>
        </div>

        {errorMsg && (
          <div className="rounded-lg bg-rose-400/10 border border-rose-400/20 px-4 py-3 text-sm text-rose-400">{errorMsg}</div>
        )}

        {loading ? (
          <p className="text-slate-400 text-sm">{t.loading}</p>
        ) : rewardsCatalog.length === 0 ? (
          <p className="text-slate-400 text-sm">{t.catalogEmpty}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewardsCatalog.map((reward) => {
              const outOfStock = reward.stock_quantity !== null && reward.stock_quantity <= 0;
              const insufficient = reward.points_cost > available;
              const disabled = insufficient || outOfStock;
              const isProcessing = processingId === reward.id;
              const stockText =
                reward.stock_quantity === null
                  ? t.unlimitedStock
                  : reward.stock_quantity > 0
                  ? t.inStock(reward.stock_quantity)
                  : t.outOfStock;
              return (
                <div key={reward.id} className="rounded-xl bg-slate-900 border border-slate-800 p-5 flex flex-col">
                  <div className="flex-1">
                    <div className="w-9 h-9 rounded-lg bg-amber-400/10 flex items-center justify-center mb-3">
                      <Gift className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="font-semibold text-slate-50 mb-2">{translate(reward.name, locale)}</div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-amber-400 text-sm font-medium">{t.pointsCost(reward.points_cost)}</span>
                      <span className="text-slate-500 text-xs">{stockText}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={disabled || isProcessing}
                    onClick={() => handleRedeem(reward)}
                    className={`mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      disabled
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                    }`}
                  >
                    {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                    {outOfStock ? t.outOfStock : insufficient ? t.notEnoughPoints : t.redeemButton}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {toast && (
        <div className="fixed bottom-6 inset-x-0 flex justify-center px-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-100 shadow-lg">{toast}</div>
        </div>
      )}
    </div>
  );
}
