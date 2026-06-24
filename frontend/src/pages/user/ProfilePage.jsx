import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import UserLayout from '../../layouts/UserLayout';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { User, Save, Lock, Eye, EyeOff } from 'lucide-react';
import { sanitizeText } from '../../utils/sanitize';

export default function ProfilePage() {
  const { user, updateProfile, changePassword } = useAuth();
  const [charities, setCharities] = useState([]);
  const [saving, setSaving] = useState(false);
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    charityId: user?.charityId || '',
    donationPct: user?.donationPct || 10,
  });

  useEffect(() => {
    api.get('/charities').then(r => setCharities(r.data));
  }, []);

  useEffect(() => {
    if (user) {
      setTimeout(() => {
        setForm({
          name: user.name || '',
          charityId: user.charityId || '',
          donationPct: user.donationPct || 10,
        });
      }, 0);
    }
  }, [user]);

  const handleAccountSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ name: sanitizeText(form.name), charityId: form.charityId, donationPct: form.donationPct });
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setPwSaving(true);
    try {
      await changePassword(passwordData.oldPassword, passwordData.newPassword);
      toast.success('Password changed successfully');
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <UserLayout>
      <div className="mb-8 animate-slide-up">
        <h1 className="text-3xl font-bold text-white mb-1">My <span className="gradient-text">Profile</span></h1>
        <p className="text-white/50">Your account information and charity settings</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 max-w-3xl">
        <form onSubmit={handleAccountSave} className="glass-card p-6">
          <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
            <User className="w-4 h-4 text-primary-400" /> Account Details
          </h2>
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white mb-4"
              style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Full Name</label>
              <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                required className="input-field" />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Email</label>
              <input type="email" value={user?.email} disabled className="input-field opacity-60" />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Role</label>
              <input type="text" value={user?.role} disabled className="input-field opacity-60" />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Charity</label>
              <select value={form.charityId} onChange={e => setForm(p => ({ ...p, charityId: e.target.value }))}
                className="input-field">
                <option value="">Select a charity</option>
                {charities.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Donation Percentage</label>
              <input type="range" min={10} max={50} value={form.donationPct}
                onChange={e => setForm(p => ({ ...p, donationPct: Number(e.target.value) }))}
                className="w-full accent-primary-500" />
              <div className="flex justify-between text-xs text-white/30 mt-1">
                <span>10% (min)</span>
                <span className="text-pink-400 font-bold">{form.donationPct}%</span>
                <span>50%</span>
              </div>
            </div>
            <button type="submit" disabled={saving}
              className="btn-primary w-full flex items-center justify-center gap-2">
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </form>

        <form onSubmit={handlePasswordChange} className="glass-card p-6">
          <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary-400" /> Change Password
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/70 mb-1">Current Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={passwordData.oldPassword}
                  onChange={e => setPasswordData(p => ({ ...p, oldPassword: e.target.value }))}
                  required className="input-field pr-12" />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">New Password</label>
              <input type="password" value={passwordData.newPassword}
                onChange={e => setPasswordData(p => ({ ...p, newPassword: e.target.value }))}
                required minLength={6} className="input-field" />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Confirm New Password</label>
              <input type="password" value={passwordData.confirmPassword}
                onChange={e => setPasswordData(p => ({ ...p, confirmPassword: e.target.value }))}
                required minLength={6} className="input-field" />
            </div>
            <button type="submit" disabled={pwSaving}
              className="btn-secondary w-full flex items-center justify-center gap-2">
              {pwSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Lock className="w-4 h-4" />}
              Change Password
            </button>
          </div>
        </form>
      </div>
    </UserLayout>
  );
}
