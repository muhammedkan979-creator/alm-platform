import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Globe, Gift, Check, Coins, Loader2, LogOut, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/*
  Prototype rewards catalog for the ALM Platform.
  Stock and active status here are mocked to match what the admin
  dashboard's "Manage rewards" section sets — inactive rewards are
  filtered out, and out-of-stock ones are shown but disabled. To make
  redemption persist for real, swap handleRedeem() for a call to the
  redeem_reward() RPC, which re-checks points, stock, and active status
  server-side and decrements stock atomically.
*/

const copy = {
  en: {
    brand: 'ALM Platform',
    switchLanguage: 'العربية',
    pageTitle: 'Rewards catalog',
    pageSubtitle: 'Redeem your points for rewards.',
    pointsAvailable: (n) => `${n} points available`,
    redeemButton: 'Redeem',
    redeemedButton: 'Redeemed',
    notEnoughPoints: 'Not enough points',
    pointsCost: (n) => `${n} pts`,
    redeemedToast: (name) => `Redeemed: ${name}`,
    unlimitedStock: 'Unlimited',
    inStock: (n) => `${n} left`,
    outOfStock: 'Out of stock',
  },
  ar: {
    brand: 'منصّة ALM',
    switchLanguage: 'English',
    pageTitle: 'كتالوج الجوائز',
    pageSubtitle: 'استبدل نقاطك بجوائز.',
    pointsAvailable: (n) => `${n} نقطة متوفرة`,
    redeemButton: 'استبدال',
    redeemedButton: 'تم الاستبدال',
    notEnoughPoints: 'نقاط غير كافية',
    pointsCost: (n) => `${n} نقطة`,
    redeemedToast: (name) => `تم استبدال: ${name}`,
    unlimitedStock: 'غير محدود',
    inStock: (n) => `${n} متبقي`,
    outOfStock: 'خلصت',
  },
};

const investorPoints = 275;

const initialRewardsCatalog = [
  { id: 1, name: { en: 'Amazon gift card — $50', ar: 'بطاقة أمازون هدية — 50$' }, pointsCost: 200, stock: 12, active: true },
  { id: 2, name: { en: 'Free financial consultation', ar: 'استشارة مالية مجانية' }, pointsCost: 100, stock: null, active: true },
  { id: 3, name: { en: 'Premium membership upgrade', ar: 'ترقية عضوية بريميوم' }, pointsCost: 500, stock: 0, active: true },
  { id: 4, name: { en: 'Branded gift set', ar: 'طقم هدايا مميز' }, pointsCost: 150, stock: 5, active: false },
  {
    id: 5,
    name: { en: 'Priority access to new projects', ar: 'أولوية دخول لمشاريع جديدة' },
    pointsCost: 350,
    stock: null,
    active: true,
  },
  {
    id: 6,
    name: { en: 'Referral bonus boost — 2x for 30 days', ar: 'مضاعفة نقاط الإحالة لمدة 30 يوم' },
    pointsCost: 400,
    stock: 3,
    active: true,
  },
];

function translate(value, locale) {
  return value[locale] || value.en;
}

export default function RewardsCatalog() {
  const { signOut } = useAuth();
  const [locale, setLocale] = useState('en');
  const [rewardsCatalog, setRewardsCatalog] = useState(initialRewardsCatalog);
  const [redeemed, setRedeemed] = useState(new Set());
  const [processingId, setProcessingId] = useState(null);
  const [toast, setToast] = useState('');
  const [spent, setSpent] = useState(0);

  const t = copy[locale];
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const available = investorPoints - spent;

  function handleRedeem(reward) {
    const outOfStock = reward.stock !== null && reward.stock <= 0;
    if (redeemed.has(reward.id) || reward.pointsCost > available || outOfStock) return;
    setProcessingId(reward.id);
    setTimeout(() => {
      setRedeemed((prev) => new Set(prev).add(reward.id));
      setSpent((prev) => prev + reward.pointsCost);
      setRewardsCatalog((prev) =>
        prev.map((r) => (r.id === reward.id && r.stock !== null ? { ...r, stock: r.stock - 1 } : r))
      );
      setProcessingId(null);
      setToast(t.redeemedToast(translate(reward.name, locale)));
      setTimeout(() => setToast(''), 2200);
    }, 700);
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewardsCatalog
            .filter((reward) => reward.active)
            .map((reward) => {
              const isRedeemed = redeemed.has(reward.id);
              const outOfStock = reward.stock !== null && reward.stock <= 0;
              const insufficient = reward.pointsCost > available && !isRedeemed;
              const disabled = isRedeemed || insufficient || outOfStock;
              const isProcessing = processingId === reward.id;
              const stockText = reward.stock === null ? t.unlimitedStock : reward.stock > 0 ? t.inStock(reward.stock) : t.outOfStock;
              return (
                <div key={reward.id} className="rounded-xl bg-slate-900 border border-slate-800 p-5 flex flex-col">
                  <div className="flex-1">
                    <div className="w-9 h-9 rounded-lg bg-amber-400/10 flex items-center justify-center mb-3">
                      <Gift className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="font-semibold text-slate-50 mb-2">{translate(reward.name, locale)}</div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-amber-400 text-sm font-medium">{t.pointsCost(reward.pointsCost)}</span>
                      <span className="text-slate-500 text-xs">{stockText}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={disabled || isProcessing}
                    onClick={() => handleRedeem(reward)}
                    className={`mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      isRedeemed
                        ? 'bg-emerald-400/10 text-emerald-400 cursor-default'
                        : disabled
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                    }`}
                  >
                    {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isRedeemed && <Check className="w-4 h-4" />}
                    {isRedeemed ? t.redeemedButton : outOfStock ? t.outOfStock : insufficient ? t.notEnoughPoints : t.redeemButton}
                  </button>
                </div>
              );
            })}
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-6 inset-x-0 flex justify-center px-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-100 shadow-lg">{toast}</div>
        </div>
      )}
    </div>
  );
    }
