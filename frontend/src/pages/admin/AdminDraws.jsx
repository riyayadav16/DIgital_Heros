import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Trophy, Play, Eye, Send, Zap, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function AdminDraws() {
  const [draws, setDraws] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState('');
  const [simResult, setSimResult] = useState(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [expandedId, setExpandedId] = useState(null);

  const fetchDraws = () => api.get('/admin/draws')
    .then(r => {
      const data = r.data;
      setDraws(Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []));
    })
    .catch(() => setDraws([]));

  useEffect(() => {
    fetchDraws().finally(() => setLoading(false));
  }, []);

  const handleRun = async () => {
    setRunning('run');
    try {
      await api.post('/admin/draws/run', { month, year });
      toast.success('Draw numbers generated!');
      fetchDraws();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setRunning('');
    }
  };

  const handleSimulate = async () => {
    setRunning('sim');
    try {
      const res = await api.post('/admin/draws/simulate', { month, year });
      setSimResult(res.data);
      toast.success('Simulation complete!');
      fetchDraws();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setRunning('');
    }
  };

  const handlePublish = async (id) => {
    if (!confirm('Publish this draw? This will compute all winners and distribute prizes.')) return;
    setRunning('pub-' + id);
    try {
      await api.post(`/admin/draws/publish/${id}`);
      toast.success('🎉 Draw published! Winners computed.');
      fetchDraws();
      setSimResult(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setRunning('');
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Draw <span className="gradient-text">Management</span></h1>
        <p className="text-white/50">Generate, simulate, and publish monthly draws</p>
      </div>

      {/* Draw control panel */}
      <div className="glass-card p-6 mb-6">
        <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary-400" /> Draw Control Panel
        </h2>

        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="block text-xs text-white/50 mb-1">Month</label>
            <select value={month} onChange={e => setMonth(+e.target.value)} id="draw-month" className="input-field w-36">
              {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Year</label>
            <input type="number" value={year} onChange={e => setYear(+e.target.value)} id="draw-year"
              className="input-field w-28" min={2024} max={2030} />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button onClick={handleRun} disabled={running !== ''} id="draw-run-btn"
            className="btn-secondary flex items-center gap-2">
            {running === 'run' ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play className="w-4 h-4" />}
            Generate Numbers
          </button>

          <button onClick={handleSimulate} disabled={running !== ''} id="draw-simulate-btn"
            className="btn-accent flex items-center gap-2">
            {running === 'sim' ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Eye className="w-4 h-4" />}
            Simulate Draw
          </button>
        </div>

        {/* Simulation Results */}
        {simResult && (
          <div className="mt-5 p-5 rounded-xl border border-accent-500/30 bg-accent-500/5 animate-slide-up">
            <p className="text-accent-400 font-semibold mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4" /> Simulation Results (not published)
            </p>
            <div className="flex gap-2 mb-4">
              {Array.isArray(simResult.numbers) ? simResult.numbers.map(n => <div key={n} className="number-ball">{n}</div>) : null}
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
              {[5,4,3].map(t => (
                <div key={t} className="p-3 rounded-lg bg-white/5 text-center">
                  <p className="text-white/50 text-xs mb-1">{t} matches</p>
                  <p className="text-white font-bold text-lg">{Array.isArray(simResult.tierResults?.[t]) ? simResult.tierResults[t].length : 0}</p>
                  <p className="text-white/30 text-xs">winners</p>
                </div>
              ))}
            </div>
            <p className="text-white/50 text-xs">Total subscribers checked: {simResult.subscribers ?? 0}</p>

            {/* Find the current draw to publish */}
            {Array.isArray(draws) && draws.find(d => d.month === month && d.year === year && d.status !== 'PUBLISHED') && (
              <button
                id="draw-publish-btn"
                onClick={() => handlePublish(draws.find(d => d.month === month && d.year === year)?.id)}
                disabled={running !== ''}
                className="btn-primary mt-4 flex items-center gap-2"
              >
                {running.startsWith('pub') ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                Publish Draw & Compute Winners
              </button>
            )}
          </div>
        )}
      </div>

      {/* Draw history */}
      <div className="glass-card p-6">
        <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-400" /> All Draws
        </h2>

        {loading ? (
          <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : !Array.isArray(draws) || draws.length === 0 ? (
          <p className="text-white/30 text-center py-8">No draws yet</p>
        ) : (
          <div className="space-y-3">
            {draws.map(draw => (
              <div key={draw.id} className="rounded-xl border border-white/5 bg-white/[0.03] overflow-hidden">
                <div className="flex items-center gap-4 p-4 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === draw.id ? null : draw.id)}>
                  <div>
                    <p className="text-white font-semibold">{MONTHS[(draw.month || 1) - 1]} {draw.year || ''}</p>
                    <p className="text-white/40 text-xs">{(draw._count?.winners ?? 0)} winners</p>
                  </div>
                  <div className="flex gap-1.5 ml-2">
                    {Array.isArray(draw.numbers) ? draw.numbers.map(n => <div key={n} className="number-ball text-xs w-8 h-8">{n}</div>) : null}
                  </div>
                  <span className={`badge ml-auto ${
                    draw.status === 'PUBLISHED' ? 'badge-green' :
                    draw.status === 'SIMULATED' ? 'badge-blue' : 'badge-yellow'
                  }`}>{draw.status || 'UNKNOWN'}</span>
                  {draw.status !== 'PUBLISHED' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handlePublish(draw.id); }}
                      disabled={running !== ''}
                      className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" /> Publish
                    </button>
                  )}
                  {expandedId === draw.id ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                </div>

                {expandedId === draw.id && (draw.jackpotCarryover ?? 0) > 0 && (
                  <div className="px-4 pb-4">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      <p className="text-yellow-300 text-xs">Jackpot rolled over: ${(draw.jackpotCarryover || 0).toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}