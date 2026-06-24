import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Zap, Eye, EyeOff, ArrowRight, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { sanitizeText } from '../utils/sanitize';

export default function SignupPage() {
  const { signup, user } = useAuth();
  const navigate = useNavigate();
  const [charities, setCharities] = useState([]);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    charityId: '',
    donationPct: 10,
  });
  const justSignedUpRef = useRef(false);

  useEffect(() => {
    api.get('/charities').then(r => setCharities(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (justSignedUpRef.current && user) {
      toast.success(`Welcome, ${user.name}! Account created.`);
      navigate('/dashboard');
      justSignedUpRef.current = false;
    }
  }, [user, navigate]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: name === 'donationPct' ? Number(value) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[SignupPage] handleSubmit triggered', formData);
    const cleanData = {
      ...formData,
      name: sanitizeText(formData.name),
      email: sanitizeText(formData.email),
    };
    if (cleanData.donationPct < 10) {
      toast.error('Donation percentage must be at least 10%');
      return;
    }
    setLoading(true);
    try {
      await signup(cleanData);
      justSignedUpRef.current = true;
    } catch (err) {
      console.error('[SignupPage] error', err);
      toast.error(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-900 animated-bg flex items-center justify-center p-6 relative overflow-hidden">
      <div className="orb orb-purple w-80 h-80 -top-20 right-0" />
      <div className="orb orb-cyan w-64 h-64 bottom-0 left-0" />

      <div className="w-full max-w-lg relative z-10 animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}>
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">Digital Heroes</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Create your account</h1>
          <p className="text-white/50">Start winning and giving back today</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                id="signup-name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Jane Doe"
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                id="signup-email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  id="signup-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
                  className="input-field pr-12"
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Charity */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2 flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-pink-400" /> Choose Your Charity
              </label>
              <select
                name="charityId"
                id="signup-charity"
                value={formData.charityId}
                onChange={handleChange}
                className="input-field"
              >
                <option value="">Select a charity (optional)</option>
                {charities.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Donation % */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Donation Percentage <span className="text-primary-400 font-bold">{formData.donationPct}%</span>
              </label>
              <input
                type="range"
                name="donationPct"
                id="signup-donation-pct"
                min={10}
                max={50}
                value={formData.donationPct}
                onChange={handleChange}
                className="w-full accent-primary-500"
              />
              <div className="flex justify-between text-xs text-white/30 mt-1">
                <span>10% (min)</span>
                <span>50%</span>
              </div>
            </div>

            <button
              type="submit"
              id="signup-submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Create Account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-white/50 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
