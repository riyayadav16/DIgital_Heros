import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Heart, Plus, Pencil, Trash2, X, Save } from 'lucide-react';
import { sanitizeText } from '../../utils/sanitize';

export default function AdminCharities() {
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | charity object
  const [form, setForm] = useState({ name: '', description: '', logoUrl: '', isActive: true });
  const [saving, setSaving] = useState(false);

  const fetchCharities = () => api.get('/admin/charities').then(r => setCharities(r.data));

  useEffect(() => { fetchCharities().finally(() => setLoading(false)); }, []);

  const openAdd = () => { setForm({ name: '', description: '', logoUrl: '', isActive: true }); setModal('add'); };
  const openEdit = (c) => { setForm({ name: c.name, description: c.description, logoUrl: c.logoUrl || '', isActive: c.isActive }); setModal(c); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const cleanForm = {
        name: sanitizeText(form.name),
        description: sanitizeText(form.description),
        logoUrl: sanitizeText(form.logoUrl),
        isActive: form.isActive
      };
      if (modal === 'add') {
        await api.post('/admin/charities', cleanForm);
        toast.success('Charity created');
      } else {
        await api.patch(`/admin/charities/${modal.id}`, cleanForm);
        toast.success('Charity updated');
      }
      fetchCharities();
      setModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete charity "${name}"?`)) return;
    try {
      await api.delete(`/admin/charities/${id}`);
      toast.success('Charity deleted');
      fetchCharities();
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Charity <span className="gradient-text">Management</span></h1>
          <p className="text-white/50">Manage available charities for users to support</p>
        </div>
        <button onClick={openAdd} id="add-charity-btn" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Charity
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 flex justify-center py-10"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : charities.map(c => (
          <div key={c.id} className="glass-card-hover p-6 animate-slide-up">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(236,72,153,0.15)' }}>
                <Heart className="w-5 h-5 text-pink-400" />
              </div>
              <span className={`badge ${c.isActive ? 'badge-green' : 'badge-red'}`}>
                {c.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <h3 className="text-white font-semibold mb-1">{c.name}</h3>
            <p className="text-white/50 text-sm mb-3 line-clamp-2">{c.description}</p>
            <p className="text-white/30 text-xs mb-4">{c._count?.users || 0} users supporting</p>
            <div className="flex gap-2">
              <button onClick={() => openEdit(c)} id={`edit-charity-${c.id}`}
                className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 flex-1 justify-center">
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
              <button onClick={() => handleDelete(c.id, c.name)} id={`delete-charity-${c.id}`}
                className="btn-danger text-xs py-1.5 px-3">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="glass-card p-8 w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">{modal === 'add' ? 'Add Charity' : 'Edit Charity'}</h2>
              <button onClick={() => setModal(null)} className="text-white/40 hover:text-white/70 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-1">Name *</label>
                <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  required className="input-field" placeholder="Charity name" />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Description *</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  required rows={3} className="input-field resize-none" placeholder="Charity description" />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Logo URL</label>
                <input type="url" value={form.logoUrl} onChange={e => setForm(p => ({ ...p, logoUrl: e.target.value }))}
                  className="input-field" placeholder="https://..." />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="charity-active" checked={form.isActive}
                  onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))}
                  className="w-4 h-4 accent-primary-500" />
                <label htmlFor="charity-active" className="text-sm text-white/70">Active (visible to users)</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
