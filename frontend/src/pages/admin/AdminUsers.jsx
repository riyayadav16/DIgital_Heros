import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Search, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

const formatDate = d => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });

  const fetchUsers = useCallback(() => {
    setLoading(true);
    api.get(`/admin/users?page=${page}&limit=${limit}`)
      .then(r => {
        setUsers(r.data.items);
        if (r.data.meta) setMeta(r.data.meta);
      })
      .finally(() => setLoading(false));
  }, [page, limit]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(u => u.filter(x => x.id !== id));
      setMeta(m => ({ ...m, total: m.total - 1 }));
      toast.success('User deleted');
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">User <span className="gradient-text">Management</span></h1>
        <p className="text-white/50">{meta.total} total users</p>
      </div>

      <div className="glass-card p-6">
        <div className="mb-5 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            id="admin-user-search"
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
                  <th>Role</th>
                  <th>Subscription</th>
                  <th>Charity</th>
                  <th>Scores</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}>
                          {u.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{u.name}</p>
                          <p className="text-white/40 text-xs">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${u.role === 'ADMIN' ? 'badge-purple' : 'badge-blue'}`}>{u.role}</span>
                    </td>
                    <td>
                      {u.subscription ? (
                        <div>
                          <span className={`badge ${u.subscription.status === 'ACTIVE' ? 'badge-green' : 'badge-red'}`}>
                            {u.subscription.planType}
                          </span>
                          <p className="text-white/30 text-xs mt-0.5">{u.subscription.status}</p>
                        </div>
                      ) : <span className="text-white/30 text-xs">None</span>}
                    </td>
                    <td className="text-white/60 text-xs">{u.charity?.name || '—'}</td>
                    <td>
                      <span className="badge badge-blue">{u._count?.scores || 0} scores</span>
                    </td>
                    <td className="text-white/40 text-xs">{formatDate(u.createdAt)}</td>
                    <td>
                      <button
                        onClick={() => handleDelete(u.id, u.name)}
                        disabled={u.role === 'ADMIN' || deleting === u.id}
                        className="btn-danger text-xs py-1.5 px-3 disabled:opacity-30 disabled:cursor-not-allowed"
                        id={`delete-user-${u.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="text-center text-white/30 text-sm py-8">No users found</p>
            )}
          </div>
        )}
        <div className="flex items-center justify-between mt-4">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
            className="btn-secondary text-xs flex items-center gap-1 disabled:opacity-30">
            <ChevronLeft className="w-3.5 h-3.5" /> Previous
          </button>
          <span className="text-white/50 text-xs">Page {page} of {meta.totalPages}</span>
          <button disabled={page === meta.totalPages} onClick={() => setPage(p => p + 1)}
            className="btn-secondary text-xs flex items-center gap-1 disabled:opacity-30">
            Next <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
