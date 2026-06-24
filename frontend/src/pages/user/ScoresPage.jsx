import { useState, useEffect } from 'react';
import UserLayout from '../../layouts/UserLayout';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Target, Plus, Trash2, AlertCircle, Calendar, Hash, Edit2, X } from 'lucide-react';

const formatDate = d => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

export default function ScoresPage() {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [form, setForm] = useState({ score: '', date: new Date().toISOString().slice(0, 10) });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ score: '', date: '' });
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    Promise.all([api.get('/scores'), api.get('/subscriptions/status')])
      .then(([sc, sub]) => {
        setScores(sc.data);
        setSubscription(sub.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const num = parseInt(form.score);
    if (!num || num < 1 || num > 45) {
      toast.error('Score must be between 1 and 45');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/scores', { score: num, date: form.date });
      toast.success('Score submitted!');
      const res = await api.get('/scores');
      setScores(res.data);
      setForm(p => ({ ...p, score: '' }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit score');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (s) => {
    setEditingId(s.id);
    setEditForm({ score: s.score, date: s.date?.slice(0, 10) });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ score: '', date: '' });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const num = parseInt(editForm.score);
    if (!num || num < 1 || num > 45) {
      toast.error('Score must be between 1 and 45');
      return;
    }
    try {
      await api.put(`/scores/${editingId}`, { score: num, date: editForm.date });
      toast.success('Score updated!');
      const updated = await api.get('/scores');
      setScores(updated.data);
      cancelEdit();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update score');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this score?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/scores/${id}`);
      toast.success('Score deleted');
      const res = await api.get('/scores');
      setScores(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete score');
    } finally {
      setDeletingId(null);
    }
  };

  const isActive = subscription?.status === 'ACTIVE';

  return (
    <UserLayout>
      <div className="mb-8 animate-slide-up">
        <h1 className="text-3xl font-bold text-white mb-1">My <span className="gradient-text">Scores</span></h1>
        <p className="text-white/50">Submit and manage your latest 5 scores for draw participation</p>
      </div>

      <div className="mb-6 p-4 rounded-xl border border-primary-500/20 bg-primary-500/5 flex gap-3">
        <AlertCircle className="w-5 h-5 text-primary-400 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="text-primary-300 font-medium mb-1">Score Rules</p>
          <ul className="text-white/50 space-y-0.5 list-disc list-inside">
            <li>Scores must be between <strong className="text-white/80">1 and 45</strong></li>
            <li>Only <strong className="text-white/80">1 score per date</strong> allowed</li>
            <li>Only your <strong className="text-white/80">latest 5 scores</strong> are kept (oldest auto-removed)</li>
          </ul>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary-400" /> Submit New Score
          </h2>

          {!isActive ? (
            <div className="text-center py-10">
              <AlertCircle className="w-10 h-10 text-yellow-400/50 mx-auto mb-3" />
              <p className="text-white/50 text-sm">An active subscription is required to submit scores</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5" /> Score (1–45)
                </label>
                <input
                  type="number"
                  id="score-input"
                  min={1}
                  max={45}
                  value={form.score}
                  onChange={e => setForm(p => ({ ...p, score: e.target.value }))}
                  placeholder="Enter a number between 1 and 45"
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Date
                </label>
                <input
                  type="date"
                  id="score-date"
                  value={form.date}
                  onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                  required
                  max={new Date().toISOString().slice(0, 10)}
                  className="input-field"
                />
              </div>

              <button
                type="submit"
                id="score-submit"
                disabled={submitting}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><Plus className="w-4 h-4" /> Submit Score</>
                )}
              </button>
            </form>
          )}
        </div>

        <div className="glass-card p-6">
          <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
            <Target className="w-4 h-4 text-primary-400" /> Your Active Scores
            <span className="ml-auto badge badge-purple">{scores.length}/5</span>
          </h2>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : scores.length === 0 ? (
            <div className="text-center py-10">
              <Target className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <p className="text-white/30 text-sm">No scores yet. Submit your first score!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scores.map((s, i) => (
                <div key={s.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/5 group animate-slide-up"
                  style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="number-ball text-lg">{s.score}</div>
                  <div className="flex-1">
                    <p className="text-white font-semibold">Score: {s.score}</p>
                    <p className="text-white/40 text-xs">{formatDate(s.date)}</p>
                  </div>
                  {i === 0 && <span className="badge badge-green">Latest</span>}
                  {i === scores.length - 1 && scores.length === 5 && (
                    <span className="badge badge-yellow text-xs">Will be removed next</span>
                  )}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(s)} className="btn-secondary text-xs py-1.5 px-2">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(s.id)} disabled={deletingId === s.id}
                      className="btn-danger text-xs py-1.5 px-2 disabled:opacity-30">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {scores.length === 5 && (
                <p className="text-center text-white/30 text-xs mt-2">
                  Maximum 5 scores reached. Adding a new score will remove the oldest.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={cancelEdit}>
          <div className="glass-card p-6 w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg">Edit Score</h3>
              <button onClick={cancelEdit} className="text-white/40 hover:text-white/70"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-1">Score (1-45)</label>
                <input type="number" min={1} max={45} value={editForm.score}
                  onChange={e => setEditForm(p => ({ ...p, score: e.target.value }))}
                  required className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Date</label>
                <input type="date" value={editForm.date}
                  onChange={e => setEditForm(p => ({ ...p, date: e.target.value }))}
                  max={new Date().toISOString().slice(0, 10)}
                  required className="input-field" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={cancelEdit} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </UserLayout>
  );
}
