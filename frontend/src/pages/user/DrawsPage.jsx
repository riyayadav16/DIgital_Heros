import { useState, useEffect } from 'react';
import UserLayout from '../../layouts/UserLayout';
import api from '../../lib/api';
import { Trophy, Upload, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

const formatDate = d => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const TIER_LABELS = { 3: 'Small Prize', 4: 'Medium Prize', 5: '🏆 Jackpot!' };
const TIER_CLASSES = { 3: 'badge-blue', 4: 'badge-purple', 5: 'badge-yellow' };

export default function DrawsPage() {
  const [history, setHistory] = useState([]);
  const [draws, setDraws] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState(null);

  useEffect(() => {
    Promise.all([api.get('/draws/my-history'), api.get('/draws')])
      .then(([h, d]) => { setHistory(h.data); setDraws(d.data); })
      .finally(() => setLoading(false));
  }, []);

  const handleUpload = async (winnerId, file) => {
    if (!file) return;
    setUploadingId(winnerId);
    const fd = new FormData();
    fd.append('proof', file);
    try {
      await api.post(`/draws/${winnerId}/proof`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Proof uploaded! Admin will review shortly.');
      const res = await api.get('/draws/my-history');
      setHistory(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <UserLayout>
      <div className="mb-8 animate-slide-up">
        <h1 className="text-3xl font-bold text-white mb-1">Draw <span className="gradient-text">History</span></h1>
        <p className="text-white/50">Your participation records and prize winnings</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* My Winnings */}
          <div className="glass-card p-6 mb-6">
            <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" /> My Winnings
            </h2>

            {history.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-12 h-12 text-white/10 mx-auto mb-3" />
                <p className="text-white/30">No wins yet — keep your scores active for the next draw!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map(w => (
                  <div key={w.id} className="p-5 rounded-xl border border-white/5 bg-white/[0.03]">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <div>
                        <p className="text-white font-semibold">{w.draw?.month}/{w.draw?.year} Draw</p>
                        <p className="text-white/40 text-xs">{formatDate(w.createdAt)}</p>
                      </div>
                      <span className={`badge ${TIER_CLASSES[w.tier] || 'badge-blue'} ml-auto`}>
                        {TIER_LABELS[w.tier] || `${w.tier} matches`}
                      </span>
                    </div>

                    {/* Draw numbers */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {w.draw?.numbers?.map(n => (
                        <div key={n} className={`number-ball text-xs ${w.matchedNumbers?.includes(n) ? 'number-ball-matched' : ''}`}>
                          {n}
                        </div>
                      ))}
                    </div>

                    {/* Matched numbers */}
                    {w.matchedNumbers?.length > 0 && (
                      <p className="text-emerald-400 text-xs mb-3">
                        ✓ Your matched numbers: {w.matchedNumbers.join(', ')}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 text-yellow-400 font-semibold">
                          <DollarSign className="w-3.5 h-3.5" /> ${w.prizeAmount?.toFixed(2)}
                        </span>
                        <span className={`flex items-center gap-1 text-xs ${
                          w.verificationStatus === 'APPROVED' ? 'text-emerald-400' :
                          w.verificationStatus === 'REJECTED' ? 'text-red-400' : 'text-yellow-400'
                        }`}>
                          {w.verificationStatus === 'APPROVED' ? <CheckCircle className="w-3.5 h-3.5" /> :
                           w.verificationStatus === 'REJECTED' ? <XCircle className="w-3.5 h-3.5" /> :
                           <Clock className="w-3.5 h-3.5" />}
                          Verification: {w.verificationStatus}
                        </span>
                        <span className={`badge ${
                          w.payoutStatus === 'PAID' ? 'badge-green' :
                          w.payoutStatus === 'APPROVED' ? 'badge-blue' : 'badge-yellow'
                        } text-xs`}>
                          Payout: {w.payoutStatus}
                        </span>
                      </div>

                      {/* Proof upload */}
                      {w.verificationStatus === 'PENDING' && !w.proofUrl && (
                        <label className="cursor-pointer flex items-center gap-1.5 text-xs text-primary-400 border border-primary-500/30 px-3 py-1.5 rounded-lg hover:bg-primary-500/10 transition-colors">
                          {uploadingId === w.id ? (
                            <div className="w-3 h-3 border border-primary-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Upload className="w-3.5 h-3.5" />
                          )}
                          Upload Proof
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={e => handleUpload(w.id, e.target.files[0])}
                          />
                        </label>
                      )}
                      {w.proofUrl && (
                        <span className="text-xs text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Proof submitted
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Published Draws */}
          <div className="glass-card p-6">
            <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary-400" /> Recent Published Draws
            </h2>

            {draws.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-8">No published draws yet</p>
            ) : (
              <div className="space-y-3">
                {draws.slice(0, 5).map(draw => (
                  <div key={draw.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white font-medium">{draw.month}/{draw.year} Draw</p>
                      <span className="badge badge-green">Published</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {draw.numbers?.map(n => (
                        <div key={n} className="number-ball text-xs">{n}</div>
                      ))}
                    </div>
                    <p className="text-white/40 text-xs">
                      {draw.winners?.length || 0} winners · Prize pool: ${draw.totalPool?.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </UserLayout>
  );
}
