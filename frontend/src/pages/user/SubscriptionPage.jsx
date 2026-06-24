import { useState, useEffect } from 'react';
import UserLayout from '../../layouts/UserLayout';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { CheckCircle, ArrowRight, Zap, Shield } from 'lucide-react';

const formatDate = d => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const PLANS = [
  {
    key: 'MONTHLY',
    name: 'Monthly',
    price: '$9.99',
    period: 'per month',
    features: ['Monthly draw participation', '5 active scores', 'Charity contributions', 'Dashboard analytics'],
  },
  {
    key: 'YEARLY',
    name: 'Yearly',
    price: '$99.99',
    period: 'per year (save 17%)',
    features: ['Everything in Monthly', '2 months free', 'Priority support', 'Advanced analytics'],
    popular: true
  }
];

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(null);

  useEffect(() => {
    api.get('/subscriptions/status')
      .then(r => setSubscription(r.data))
      .finally(() => setLoading(false));
  }, []);

  const handleSubscribe = async (planType) => {
    setSubscribing(planType);
    try {
      const res = await api.post('/subscriptions/subscribe', { planType });
      setSubscription(res.data.subscription);
      toast.success(`🎉 ${planType} plan activated!`);
} catch {
       toast.error('Subscription failed');
     }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return;
    try {
      await api.post('/subscriptions/cancel');
      setSubscription(p => ({ ...p, status: 'CANCELLED' }));
      toast.success('Subscription cancelled');
    } catch {
      toast.error('Failed to cancel');
    }
  };

  const isActive = subscription?.status === 'ACTIVE';

  return (
    <UserLayout>
      <div className="mb-8 animate-slide-up">
        <h1 className="text-3xl font-bold text-white mb-1">
          <span className="gradient-text">Subscription</span>
        </h1>
        <p className="text-white/50">Manage your plan and billing</p>
      </div>

      {/* Current status */}
      {!loading && subscription && subscription.status !== 'INACTIVE' && (
        <div className={`mb-6 p-5 rounded-xl border ${isActive ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: isActive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' }}>
                {isActive ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <Shield className="w-5 h-5 text-red-400" />}
              </div>
              <div>
                <p className="font-semibold text-white">{subscription.planType} Plan — {subscription.status}</p>
                {isActive && <p className="text-white/50 text-sm">Renews on {formatDate(subscription.renewalDate)} · ${subscription.amount}</p>}
              </div>
            </div>
            {isActive && (
              <button onClick={handleCancel} className="btn-danger text-sm">Cancel Subscription</button>
            )}
          </div>
        </div>
      )}

      {/* Plans */}
      <div className="grid md:grid-cols-2 gap-6">
        {PLANS.map(plan => {
          const isCurrent = isActive && subscription?.planType === plan.key;
          return (
            <div key={plan.key} className={`relative p-8 rounded-2xl border transition-all duration-300 ${
              plan.popular ? 'border-primary-500/50' : 'border-white/10'
            }`} style={{ background: plan.popular ? 'rgba(99,102,241,0.07)' : 'rgba(255,255,255,0.04)' }}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}>
                    BEST VALUE
                  </span>
                </div>
              )}

              <h2 className="text-xl font-bold mb-1">{plan.name}</h2>
              <p className="text-white/40 text-sm mb-4">{plan.period}</p>
              <div className="text-4xl font-extrabold mb-6">{plan.price}</div>

              <ul className="space-y-3 mb-8">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="flex items-center justify-center gap-2 py-3 rounded-xl border border-emerald-500/30 text-emerald-400 text-sm font-medium">
                  <CheckCircle className="w-4 h-4" /> Current Plan
                </div>
              ) : (
                <button
                  onClick={() => handleSubscribe(plan.key)}
                  disabled={!!subscribing}
                  className={`w-full py-3 flex items-center justify-center gap-2 ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {subscribing === plan.key ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      {isActive ? 'Switch Plan' : 'Activate Plan'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
        <p className="text-white/40 text-xs text-center">
          <Shield className="w-3 h-3 inline mr-1" />
          Mock payment — no real charges. Subscription activates immediately.
        </p>
      </div>
    </UserLayout>
  );
}
