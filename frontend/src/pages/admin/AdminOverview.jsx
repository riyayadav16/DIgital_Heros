import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../lib/api';
import { Users, CreditCard, Trophy, Award, DollarSign, Activity, ChevronLeft, ChevronRight } from 'lucide-react';

const formatCurrency = v => `$${Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function AdminOverview() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transPage, setTransPage] = useState(1);

  useEffect(() => {
    api.get('/admin/analytics').then(r => setAnalytics(r.data)).finally(() => setLoading(false));
  }, []);

  const stats = [
    { icon: Users, label: 'Total Users', value: analytics?.totalUsers || 0, color: 'text-primary-400', bg: 'rgba(99,102,241,0.15)' },
    { icon: CreditCard, label: 'Active Subscribers', value: analytics?.activeSubscriptions || 0, color: 'text-emerald-400', bg: 'rgba(16,185,129,0.15)' },
    { icon: Trophy, label: 'Draws Completed', value: analytics?.totalDraws || 0, color: 'text-yellow-400', bg: 'rgba(234,179,8,0.15)' },
    { icon: Award, label: 'Total Winners', value: analytics?.totalWinners || 0, color: 'text-purple-400', bg: 'rgba(168,85,247,0.15)' },
    { icon: DollarSign, label: 'Total Revenue', value: formatCurrency(analytics?.totalRevenue), color: 'text-accent-400', bg: 'rgba(6,182,212,0.15)', wide: true },
  ];

  const transLimit = 10;
  const transactions = analytics?.recentTransactions || [];
  const totalTransPages = Math.ceil(transactions.length / transLimit);
  const paginatedTrans = transactions.slice((transPage - 1) * transLimit, transPage * transLimit);

  if (loading) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Admin <span className="gradient-text">Overview</span></h1>
        <p className="text-white/50">Platform analytics and recent activity</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.filter(s => !s.wide).map((s, i) => (
          <div key={i} className="glass-card-hover p-6 animate-slide-up" style={{ animationDelay: `${i * 0.07}s` }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-white/50 text-sm">{s.label}</p>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: s.bg }}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
            </div>
            <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-8 p-6 rounded-2xl border border-accent-500/30 glow-accent animate-slide-up"
        style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.08), rgba(99,102,241,0.08))' }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(6,182,212,0.2)' }}>
            <DollarSign className="w-7 h-7 text-accent-400" />
          </div>
          <div>
            <p className="text-white/60 text-sm mb-1">Total Subscription Revenue</p>
            <p className="text-4xl font-black text-accent-400">{formatCurrency(analytics?.totalRevenue)}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-white/40 text-xs mb-1">Prize Pool Distribution</p>
            <p className="text-white/60 text-xs">40% Jackpot · 35% Medium · 25% Small</p>
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary-400" /> Recent Transactions
        </h2>
        {analytics?.recentTransactions?.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-8">No transactions yet</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTrans.map(t => (
                    <tr key={t.id}>
                      <td>{t.user?.name || '—'}</td>
                      <td>
                        <span className={`badge ${
                          t.type === 'SUBSCRIPTION' ? 'badge-blue' :
                          t.type === 'PRIZE' ? 'badge-yellow' : 'badge-purple'
                        }`}>{t.type}</span>
                      </td>
                      <td className="text-emerald-400 font-medium">{formatCurrency(t.amount)}</td>
                      <td className="text-white/40">{new Date(t.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-4">
              <button disabled={transPage === 1} onClick={() => setTransPage(p => p - 1)}
                className="btn-secondary text-xs flex items-center gap-1 disabled:opacity-30">
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <span className="text-white/50 text-xs">Page {transPage} of {totalTransPages || 1}</span>
              <button disabled={transPage >= totalTransPages} onClick={() => setTransPage(p => p + 1)}
                className="btn-secondary text-xs flex items-center gap-1 disabled:opacity-30">
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}