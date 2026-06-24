import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import UserLayout from '../../layouts/UserLayout';
import api from '../../lib/api';
import {
  CreditCard, Target, Trophy, Heart,
  ArrowRight, AlertCircle
} from 'lucide-react';

const formatDate = d => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const formatCurrency = v => `$${Number(v || 0).toFixed(2)}`;

export default function DashboardPage() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [scores, setScores] = useState([]);
  const [winHistory, setWinHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/subscriptions/status'),
      api.get('/scores'),
      api.get('/draws/my-history'),
    ]).then(([sub, sc, hist]) => {
      setSubscription(sub.data);
      setScores(sc.data);
      setWinHistory(hist.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <UserLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </UserLayout>
    );
  }

  const totalWinnings = winHistory.reduce((s, w) => s + (w.prizeAmount || 0), 0);
  const isActive = subscription?.status === 'ACTIVE';

  const stats = [
    {
      icon: CreditCard,
      label: 'Subscription',
      value: isActive ? subscription.planType : 'Inactive',
      sub: isActive ? `Renews ${formatDate(subscription.renewalDate)}` : 'No active plan',
      color: isActive ? 'text-emerald-400' : 'text-red-400',
      iconBg: 'rgba(16,185,129,0.15)',
    },
    {
      icon: Target,
      label: 'Active Scores',
      value: scores.length,
      sub: 'Latest 5 scores tracked',
      color: 'text-primary-400',
      iconBg: 'rgba(99,102,241,0.15)',
    },
    {
      icon: Trophy,
      label: 'Total Winnings',
      value: formatCurrency(totalWinnings),
      sub: `${winHistory.length} draw participations`,
      color: 'text-yellow-400',
      iconBg: 'rgba(234,179,8,0.15)',
    },
    {
      icon: Heart,
      label: 'Charity',
      value: user?.charity?.name || 'Not selected',
      sub: user?.charity ? `${user.donationPct}% of subscription` : 'Select during profile',
      color: 'text-pink-400',
      iconBg: 'rgba(236,72,153,0.15)',
    },
  ];

  return (
    <UserLayout>
      {/* Header */}
      <div className="mb-8 animate-slide-up">
        <h1 className="text-3xl font-bold text-white mb-1">
          Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p className="text-white/50">Here's your activity overview</p>
      </div>

      {/* Subscription alert */}
      {!isActive && (
        <div className="mb-6 flex items-center justify-between gap-4 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0" />
            <p className="text-yellow-300 text-sm">You need an active subscription to submit scores and participate in draws.</p>
          </div>
          <Link to="/subscription" className="btn-primary text-sm py-2 px-4 whitespace-nowrap">Subscribe Now</Link>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map((s, i) => (
          <div key={i} className="glass-card-hover p-6 animate-slide-up" style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-white/50 text-sm font-medium">{s.label}</p>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: s.iconBg }}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${s.color} mb-1`}>{s.value}</p>
            <p className="text-white/30 text-xs">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Scores */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-primary-400" /> My Latest Scores
            </h2>
            <Link to="/scores" className="text-primary-400 text-sm flex items-center gap-1 hover:text-primary-300">
              Manage <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {scores.length === 0 ? (
            <div className="text-center py-10">
              <Target className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <p className="text-white/30 text-sm">No scores yet</p>
              {isActive && (
                <Link to="/scores" className="btn-primary text-sm py-2 px-4 mt-4 inline-block">Add First Score</Link>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {scores.map((s, i) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="number-ball text-sm">{s.score}</div>
                    <div>
                      <p className="text-white text-sm font-medium">Score: {s.score}</p>
                      <p className="text-white/40 text-xs">{formatDate(s.date)}</p>
                    </div>
                  </div>
                  {i === 0 && <span className="badge badge-green text-xs">Latest</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Draw History */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" /> Draw History
            </h2>
            <Link to="/draws" className="text-primary-400 text-sm flex items-center gap-1 hover:text-primary-300">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {winHistory.length === 0 ? (
            <div className="text-center py-10">
              <Trophy className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <p className="text-white/30 text-sm">No draw history yet</p>
              <p className="text-white/20 text-xs mt-1">Participate in the next monthly draw</p>
            </div>
          ) : (
            <div className="space-y-2">
              {winHistory.slice(0, 5).map(w => (
                <div key={w.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <div>
                    <p className="text-white text-sm font-medium">
                      {w.draw?.month}/{w.draw?.year} Draw — {w.tier} matches
                    </p>
                    <p className="text-white/40 text-xs">{formatCurrency(w.prizeAmount)} prize</p>
                  </div>
                  <span className={`badge ${
                    w.payoutStatus === 'PAID' ? 'badge-green' :
                    w.payoutStatus === 'APPROVED' ? 'badge-blue' : 'badge-yellow'
                  }`}>
                    {w.payoutStatus}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  );
}
