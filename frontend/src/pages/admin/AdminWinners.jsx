import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Award, CheckCircle, XCircle, DollarSign } from 'lucide-react';

const TIER_LABELS = { 3: 'Small', 4: 'Medium', 5: 'Jackpot' };
const TIER_CLASSES = { 3: 'badge-blue', 4: 'badge-purple', 5: 'badge-yellow' };

export default function AdminWinners() {
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    api.get('/admin/winners').then(r => setWinners(r.data)).finally(() => setLoading(false));
  }, []);

  const handleVerify = async (id, status) => {
    setUpdating(id + status);
    try {
      const res = await api.patch(`/admin/winners/${id}/verify`, { verificationStatus: status });
      setWinners(ws => ws.map(w => w.id === id ? { ...w, verificationStatus: res.data.verificationStatus } : w));
      toast.success(`Winner ${status.toLowerCase()}`);
    } catch {
      toast.error('Update failed');
    } finally {
      setUpdating(null);
    }
  };

  const handlePayout = async (id, status) => {
    setUpdating(id + status);
    try {
      const res = await api.patch(`/admin/winners/${id}/payout`, { payoutStatus: status });
      setWinners(ws => ws.map(w => w.id === id ? { ...w, payoutStatus: res.data.payoutStatus } : w));
      toast.success(`Payout marked as ${status.toLowerCase()}`);
    } catch {
      toast.error('Update failed');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Winner <span className="gradient-text">Management</span></h1>
        <p className="text-white/50">Review proof uploads, approve winners, and process payouts</p>
      </div>

      <div className="glass-card p-6">
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : winners.length === 0 ? (
          <div className="text-center py-16">
            <Award className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <p className="text-white/30">No winners yet — run and publish a draw first</p>
          </div>
        ) : (
          <div className="space-y-4">
            {winners.map(w => (
              <div key={w.id} className="p-5 rounded-xl border border-white/5 bg-white/[0.03]">
                <div className="flex flex-wrap gap-3 items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-semibold">{w.user?.name}</p>
                      <span className={`badge ${TIER_CLASSES[w.tier] || 'badge-blue'}`}>
                        {TIER_LABELS[w.tier] || `${w.tier} matches`}
                      </span>
                    </div>
                    <p className="text-white/40 text-xs">{w.user?.email} · Draw {w.draw?.month}/{w.draw?.year}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-yellow-400 font-bold text-xl flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />{w.prizeAmount?.toFixed(2)}
                    </p>
                    <p className="text-white/30 text-xs">Prize</p>
                  </div>
                </div>

                {/* Matched numbers */}
                <div className="flex gap-1.5 mb-4">
                  {w.draw?.numbers?.map(n => (
                    <div key={n} className={`number-ball text-xs w-8 h-8 ${w.matchedNumbers?.includes(n) ? 'number-ball-matched' : ''}`}>{n}</div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3 items-center">
                  {/* Proof */}
                  <div className="text-xs">
                    {w.proofUrl ? (
                      <a href={`http://localhost:5000${w.proofUrl}`} target="_blank" rel="noreferrer"
                        className="text-primary-400 hover:text-primary-300 underline">View Proof</a>
                    ) : (
                      <span className="text-white/30">No proof uploaded</span>
                    )}
                  </div>

                  {/* Verification */}
                  <div className="flex items-center gap-2 ml-auto">
                    <span className={`badge ${
                      w.verificationStatus === 'APPROVED' ? 'badge-green' :
                      w.verificationStatus === 'REJECTED' ? 'badge-red' : 'badge-yellow'
                    }`}>{w.verificationStatus}</span>

                    {w.verificationStatus === 'PENDING' && (
                      <>
                        <button onClick={() => handleVerify(w.id, 'APPROVED')} disabled={!!updating}
                          className="btn-success text-xs py-1.5 px-3 flex items-center gap-1" id={`approve-${w.id}`}>
                          <CheckCircle className="w-3 h-3" /> Approve
                        </button>
                        <button onClick={() => handleVerify(w.id, 'REJECTED')} disabled={!!updating}
                          className="btn-danger text-xs py-1.5 px-3 flex items-center gap-1" id={`reject-${w.id}`}>
                          <XCircle className="w-3 h-3" /> Reject
                        </button>
                      </>
                    )}

                    {/* Payout */}
                    {w.verificationStatus === 'APPROVED' && w.payoutStatus !== 'PAID' && (
                      <button onClick={() => handlePayout(w.id, 'PAID')} disabled={!!updating}
                        className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1" id={`payout-${w.id}`}>
                        <DollarSign className="w-3 h-3" /> Mark Paid
                      </button>
                    )}

                    <span className={`badge ${
                      w.payoutStatus === 'PAID' ? 'badge-green' :
                      w.payoutStatus === 'APPROVED' ? 'badge-blue' : 'badge-yellow'
                    }`}>{w.payoutStatus}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
