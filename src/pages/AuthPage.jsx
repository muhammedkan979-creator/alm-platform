import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, Globe } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const copy = {
  en: {
    brand: 'ALM Platform',
    heroTitle: 'Every investor you bring in pays forward — three generations deep.',
    heroBody: 'Joining with a code credits three people above you — your referrer, and the two generations before them.',
    heroYou: 'You',
    heroJoiningNow: 'joining now',
    heroGen1: 'Your referrer',
    heroGen2: '2nd generation up',
    heroGen3: '3rd generation up',
    pointsBadge: '+25 pts',
    tabSignIn: 'Sign in',
    tabSignUp: 'Create account',
    fullName: 'Full name',
    fullNamePlaceholder: 'Your name',
    email: 'Email',
    emailPlaceholder: 'you@example.com',
    phone: 'Phone',
    phonePlaceholder: '079 000 0000',
    phoneOptional: 'optional',
    password: 'Password',
    passwordPlaceholder: 'At least 8 characters',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    referralCode: 'Referral code',
    referralPlaceholder: 'The code the person who invited you shared',
    referralValid: (name) => `Joining via ${name}`,
    referralInvalid: "We couldn't find that code",
    signInButton: 'Sign in',
    signUpButton: 'Create account',
    submitting: 'Just a moment…',
    switchToSignUp: 'New here? Create an account',
    switchToSignIn: 'Already have an account? Sign in',
    errorRequired: 'Required',
    errorEmail: 'Enter a valid email',
    errorPassword: 'Use at least 8 characters',
    switchLanguage: 'العربية',
    successTitle: 'Account created',
    successBody: 'Check your email to confirm your account before signing in.',
  },
  ar: {
    brand: 'منصّة ALM',
    heroTitle: 'كل مستثمر بتجيبه، بيرجع نفعه لتلاتة أجيال.',
    heroBody: 'لما تنسجل بكود، بتتوزع نقاط لتلاتة أشخاص فوقك — يلي دعاك، والجيلين يلي قبله.',
    heroYou: 'إنت',
    heroJoiningNow: 'عم تنسجل هلق',
    heroGen1: 'يلي دعاك',
    heroGen2: 'الجيل التاني',
    heroGen3: 'الجيل التالت',
    pointsBadge: '+25 نقطة',
    tabSignIn: 'تسجيل الدخول',
    tabSignUp: 'إنشاء حساب',
    fullName: 'الاسم الكامل',
    fullNamePlaceholder: 'اسمك',
    email: 'البريد الإلكتروني',
    emailPlaceholder: 'you@example.com',
    phone: 'رقم الهاتف',
    phonePlaceholder: '079 000 0000',
    phoneOptional: 'اختياري',
    password: 'كلمة المرور',
    passwordPlaceholder: '8 أحرف عالأقل',
    showPassword: 'إظهار كلمة المرور',
    hidePassword: 'إخفاء كلمة المرور',
    referralCode: 'كود الدعوة',
    referralPlaceholder: 'الكود يلي شاركك ياه يلي دعاك',
    referralValid: (name) => `عم تنسجل عن طريق ${name}`,
    referralInvalid: 'ما لقينا هيك كود',
    signInButton: 'دخول',
    signUpButton: 'إنشاء حساب',
    submitting: 'لحظة…',
    switchToSignUp: 'أول مرة هون؟ أنشئ حساب',
    switchToSignIn: 'عندك حساب؟ سجّل دخول',
    errorRequired: 'مطلوب',
    errorEmail: 'دخّل إيميل صحيح',
    errorPassword: 'استخدم 8 أحرف عالأقل',
    switchLanguage: 'English',
    successTitle: 'تم إنشاء الحساب',
    successBody: 'افحص إيميلك لتأكيد حسابك قبل ما تسجّل دخول.',
  },
};

const inputClass =
  'w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2.5 text-slate-50 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors';

function Field({ id, label, hint, error, children }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label htmlFor={id} className="text-sm font-medium text-slate-300">
          {label}
        </label>
        {hint && <span className="text-xs text-slate-500">{hint}</span>}
      </div>
      {children}
      {error && <p className="mt-1.5 text-xs text-rose-400">{error}</p>}
    </div>
  );
}

function ReferralChain({ t }) {
  const cx = 90;
  const nodes = [
    { key: 'gen3', cy: 100, r: 20, fillOpacity: 0.45, label: t.heroGen3 },
    { key: 'gen2', cy: 230, r: 24, fillOpacity: 0.7, label: t.heroGen2 },
    { key: 'gen1', cy: 360, r: 28, fillOpacity: 1, label: t.heroGen1 },
    { key: 'you', cy: 480, r: 22, fillOpacity: 0, label: t.heroYou },
  ];

  return (
    <svg viewBox="0 0 280 560" style={{ direction: 'ltr' }} className="w-full mx-auto" aria-hidden="true">
      <line x1={cx} y1="30" x2={cx} y2="78" stroke="#334155" strokeWidth="2" strokeDasharray="2 6" strokeLinecap="round" />
      <line x1={cx} y1="120" x2={cx} y2="206" stroke="#475569" strokeWidth="2" />
      <line x1={cx} y1="254" x2={cx} y2="332" stroke="#64748B" strokeWidth="2" />
      <line x1={cx} y1="388" x2={cx} y2="458" stroke="#94A3B8" strokeWidth="2" />

      {nodes.map((n, i) => (
        <circle
          key={`${n.key}-glow`}
          cx={cx}
          cy={n.cy}
          r={n.r + 12}
          fill="#FBBF24"
          opacity={0.16}
          className="motion-safe:animate-pulse"
          style={{ animationDelay: `${i * 0.35}s` }}
        />
      ))}

      {nodes.map((n) => (
        <circle
          key={n.key}
          cx={cx}
          cy={n.cy}
          r={n.r}
          fill={n.key === 'you' ? 'none' : '#FBBF24'}
          fillOpacity={n.key === 'you' ? 1 : n.fillOpacity}
          stroke={n.key === 'you' ? '#FBBF24' : 'none'}
          strokeWidth={n.key === 'you' ? 2 : 0}
          strokeDasharray={n.key === 'you' ? '4 3' : undefined}
        />
      ))}

      {nodes.map((n) => (
        <g key={`${n.key}-label`}>
          <text x={cx + 42} y={n.cy - 3} fill="#E2E8F0" fontSize="14" fontWeight="500">
            {n.label}
          </text>
          <text x={cx + 42} y={n.cy + 15} fill={n.key === 'you' ? '#64748B' : '#FBBF24'} fontSize="12" fontWeight="600">
            {n.key === 'you' ? t.heroJoiningNow : t.pointsBadge}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function AuthPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [locale, setLocale] = useState('en');
  const [mode, setMode] = useState('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [referralStatus, setReferralStatus] = useState('idle');
  const [referrerName, setReferrerName] = useState('');
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const t = copy[locale];
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  async function handleReferralBlur() {
    const code = referralCode.trim();
    if (!code) {
      setReferralStatus('idle');
      return;
    }
    setReferralStatus('checking');
    const { data, error } = await supabase.rpc('resolve_referral_code', { p_code: code });
    if (error || !data || data.length === 0) {
      setReferralStatus('invalid');
      setReferrerName('');
      return;
    }
    setReferralStatus('valid');
    setReferrerName(data[0].referrer_name);
  }

  function validate() {
    const next = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = t.errorEmail;
    if (password.length < 8) next.password = t.errorPassword;
    if (mode === 'signup') {
      if (!fullName.trim()) next.fullName = t.errorRequired;
      if (!referralCode.trim()) next.referralCode = t.errorRequired;
      else if (referralStatus !== 'valid') next.referralCode = t.referralInvalid;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;
    setLoading(true);

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone || null,
            referral_code: referralCode,
          },
        },
      });
      setLoading(false);
      if (error) {
        setApiError(error.message);
        return;
      }
      setSuccess(true);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        setApiError(error.message);
        return;
      }
      navigate('/');
    }
  }

  function switchMode(next) {
    setMode(next);
    setErrors({});
    setApiError('');
    setSuccess(false);
  }

  if (success) {
    return (
      <div dir={dir} lang={locale} className="min-h-screen flex items-center justify-center bg-slate-950 p-6 font-sans">
        <div className="max-w-sm w-full text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-400/10 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-50">{t.successTitle}</h2>
          <p className="text-slate-400 text-sm">{t.successBody}</p>
        </div>
      </div>
    );
  }

  return (
    <div dir={dir} lang={locale} className="min-h-screen flex bg-slate-950 font-sans">
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-b from-slate-900 to-slate-950 flex-col justify-center px-10 py-12">
        <div className="max-w-xs mx-auto w-full space-y-8">
          <div>
            <div className="text-amber-400 font-semibold tracking-tight text-lg mb-4">{t.brand}</div>
            <h1 className="text-2xl font-semibold text-slate-50 leading-snug mb-3">{t.heroTitle}</h1>
            <p className="text-slate-400 text-sm leading-relaxed">{t.heroBody}</p>
          </div>
          <ReferralChain t={t} />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="lg:hidden text-amber-400 font-semibold tracking-tight text-lg">{t.brand}</div>
            <div className="flex-1 flex justify-end">
              <button
                type="button"
                onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
                className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <Globe className="w-4 h-4" />
                {t.switchLanguage}
              </button>
            </div>
          </div>

          <div className="bg-slate-900 rounded-lg p-1 flex gap-1 mb-6">
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                mode === 'signin' ? 'bg-slate-800 text-slate-50' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.tabSignIn}
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                mode === 'signup' ? 'bg-slate-800 text-slate-50' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.tabSignUp}
            </button>
          </div>

          {apiError && (
            <div className="mb-4 rounded-lg bg-rose-400/10 border border-rose-400/20 px-3 py-2.5 text-sm text-rose-400">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {mode === 'signup' && (
              <Field id="fullName" label={t.fullName} error={errors.fullName}>
                <input
                  id="fullName"
                  className={inputClass}
                  placeholder={t.fullNamePlaceholder}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </Field>
            )}

            <Field id="email" label={t.email} error={errors.email}>
              <input
                id="email"
                type="email"
                className={inputClass}
                placeholder={t.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>

            {mode === 'signup' && (
              <Field id="phone" label={t.phone} hint={t.phoneOptional}>
                <input
                  id="phone"
                  type="tel"
                  className={inputClass}
                  placeholder={t.phonePlaceholder}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </Field>
            )}

            <Field id="password" label={t.password} error={errors.password}>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={inputClass}
                  placeholder={t.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingInlineEnd: '2.75rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? t.hidePassword : t.showPassword}
                  className="absolute inset-y-0 flex items-center px-3 text-slate-500 hover:text-slate-300"
                  style={{ insetInlineEnd: 0 }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>

            {mode === 'signup' && (
              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <label htmlFor="referralCode" className="text-sm font-medium text-slate-300">
                    {t.referralCode}
                  </label>
                </div>
                <div className="relative">
                  <input
                    id="referralCode"
                    className={inputClass}
                    placeholder={t.referralPlaceholder}
                    value={referralCode}
                    onChange={(e) => {
                      setReferralCode(e.target.value);
                      setReferralStatus('idle');
                    }}
                    onBlur={handleReferralBlur}
                    style={{ paddingInlineEnd: '2.75rem' }}
                  />
                  <div className="absolute inset-y-0 flex items-center px-3" style={{ insetInlineEnd: 0 }}>
                    {referralStatus === 'checking' && <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />}
                    {referralStatus === 'valid' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {referralStatus === 'invalid' && <AlertCircle className="w-4 h-4 text-rose-400" />}
                  </div>
                </div>
                {referralStatus === 'valid' && <p className="mt-1.5 text-xs text-emerald-400">{t.referralValid(referrerName)}</p>}
                {(referralStatus === 'invalid' || errors.referralCode) && (
                  <p className="mt-1.5 text-xs text-rose-400">{errors.referralCode || t.referralInvalid}</p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-semibold rounded-lg py-2.5 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-950 flex items-center justify-center gap-2 mt-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? t.submitting : mode === 'signin' ? t.signInButton : t.signUpButton}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            <button
              type="button"
              onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
              className="text-amber-400 hover:text-amber-300 font-medium"
            >
              {mode === 'signin' ? t.switchToSignUp : t.switchToSignIn}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
    }
