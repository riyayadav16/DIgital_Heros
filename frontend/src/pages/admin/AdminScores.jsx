import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Search, Trash2 } from 'lucide-react';

const formatDate = d => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

export default function AdminScores() {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    api.get('/admin/scores')
      .then(r => {
        const data = r.data;
        setScores(Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []));
      })
      .catch(() => setScores([]))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this score?')) return;
    setDeleting(id);
    try {
      await api.delete(`/admin/scores/${id}`);
      setScores(s => Array.isArray(s) ? s.filter(x => x.id !== id) : []);
      toast.success('Score deleted');
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  const filtered = Array.isArray(scores) ? scores.filter(s =>
    s.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.user?.email?.toLowerCase().includes(search.toLowerCase())
  ) : [];

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Score <span className="gradient-text">Management</span></h1>
        <p className="text-white/50">{scores.length} total scores</p>
      </div>

      <div className="glass-card p-6">
        <div className="mb-5 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search by user name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            id="admin-score-search"
            className="input-field pl-10"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Score</th>
                  <th>Date</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}>
                          {s.user?.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{s.user?.name}</p>
                          <p className="text-white/40 text-xs">{s.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-purple">{s.score}</span>
                    </td>
                    <td className="text-white/60 text-xs">{formatDate(s.date)}</td>
                    <td className="text-white/40 text-xs">{formatDate(s.createdAt)}</td>
                    <td>
                      <button
                        onClick={() => handleDelete(s.id)}
                        disabled={deleting === s.id}
                        className="btn-danger text-xs py-1.5 px-3 disabled:opacity-30 disabled:cursor-not-allowed"
                        id={`delete-score-${s.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="text-center text-white/30 text-sm py-8">No scores found</p>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
