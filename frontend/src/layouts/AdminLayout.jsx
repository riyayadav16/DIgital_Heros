import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Zap, LayoutDashboard, Users, Trophy, Heart, Award,
  Target, LogOut, Shield, Menu, X
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/scores', icon: Target, label: 'All Scores' },
  { to: '/admin/draws', icon: Trophy, label: 'Draw Management' },
  { to: '/admin/winners', icon: Award, label: 'Winners' },
  { to: '/admin/charities', icon: Heart, label: 'Charities' },
];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface-900 flex">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 border-r border-white/5 flex flex-col transform transition-transform duration-200 lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'rgba(15,15,26,0.95)', backdropFilter: 'blur(20px)' }}>
        <div className="px-6 py-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}>
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold gradient-text text-sm">Digital Heroes</span>
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-primary-400" />
                <span className="text-xs text-primary-400 font-medium">Admin Panel</span>
              </div>
            </div>
          </div>
          <button className="lg:hidden text-white/40 hover:text-white/70" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-4 border-b border-white/5">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name}</p>
              <p className="text-primary-400 text-xs">Administrator</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              id={`admin-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-4 pb-6 border-t border-white/5 pt-4">
          <button onClick={() => { logout(); navigate('/'); }} id="admin-logout"
            className="sidebar-link w-full text-red-400/70 hover:text-red-400 hover:bg-red-500/10">
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <main className="flex-1 overflow-auto">
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/5 bg-surface-800/50">
          <button onClick={() => setSidebarOpen(true)} className="text-white/70 hover:text-white">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold gradient-text text-sm">Digital Heroes Admin</span>
          <div className="w-6" />
        </div>
        <div className="p-4 lg:p-8 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
