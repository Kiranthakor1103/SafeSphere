import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import {
  LayoutDashboard, Zap, AlertTriangle, Home, Users, UserCheck,
  Shield, Package, Bell, LogOut, Radio, X, HeartHandshake, Megaphone, UserCog
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { canAccessModule, formatRoleLabel, type Module } from '../config/permissions';
import { createVolunteerAPI, unregisterVolunteerAPI } from '../services/api';
import toast from 'react-hot-toast';
import ProfileModal from './ProfileModal';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', module: 'dashboard' },
  { to: '/disasters', icon: Zap, label: 'Disasters', module: 'disasters' },
  { to: '/sos', icon: Radio, label: 'SOS Alerts', module: 'sos' },
  { to: '/shelters', icon: Home, label: 'Shelters', module: 'shelters' },
  { to: '/missing-persons', icon: AlertTriangle, label: 'Missing Persons', module: 'missing-persons' },
  { to: '/volunteers', icon: Users, label: 'Volunteers', module: 'volunteers' },
  { to: '/rescue-teams', icon: UserCheck, label: 'Rescue Teams', module: 'rescue-teams' },
  { to: '/resources', icon: Package, label: 'Resources', module: 'resources' },
  { to: '/alerts', icon: Megaphone, label: 'Broadcast Alerts', module: 'alerts' },
  { to: '/users', icon: UserCog, label: 'Users', module: 'users' },
  { to: '/notifications', icon: Bell, label: 'Notifications', module: 'dashboard' },
] as const satisfies ReadonlyArray<{ to: string; icon: LucideIcon; label: string; module: Module }>;

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { user, logout, refreshUser } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [toggling, setToggling] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = () => {
    if (onClose) onClose();
    logout();
    navigate('/login');
  };

  const isVolunteer = user?.role === 'volunteer';
  const showToggle = user?.role === 'citizen' || user?.role === 'volunteer';

  const handleToggleVolunteer = async () => {
    if (toggling) return;
    setToggling(true);
    try {
      if (isVolunteer) {
        await unregisterVolunteerAPI();
        toast.success('Opted out of volunteering.');
      } else {
        await createVolunteerAPI({ skills: [], availability: 'available' });
        toast.success('Successfully registered as a volunteer!');
      }
      await refreshUser();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update volunteer status.');
    } finally {
      setToggling(false);
    }
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        className={`sidebar-backdrop ${isOpen ? 'is-open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`sidebar ${isOpen ? 'is-mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <div className="sidebar-logo-icon">
              <Shield size={20} color="white" />
            </div>
            <div>
              <div className="sidebar-logo-text">DisasterConnect</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>Emergency Platform</div>
            </div>
          </div>
          {onClose && (
            <button 
              type="button" 
              className="mobile-close-btn"
              onClick={onClose}
              aria-label="Close Sidebar"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-title">Navigation</div>
          {navItems.filter(item => canAccessModule(user?.role, item.module)).map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => onClose && onClose()}
              className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon size={18} />
                <span>{label}</span>
              </div>
              {to === '/notifications' && unreadCount > 0 && (
                <span
                  style={{
                    background: '#ef4444',
                    color: '#ffffff',
                    borderRadius: '999px',
                    padding: '2px 7px',
                    fontSize: '10px',
                    fontWeight: 800,
                    lineHeight: 1,
                    boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)',
                  }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {showToggle && (
            <div className="volunteer-toggle-card">
              <span className="volunteer-toggle-label">
                <HeartHandshake size={16} className="volunteer-toggle-icon" />
                Volunteer Mode
              </span>
              <label className="premium-switch" title={isVolunteer ? "Deactivate Volunteer Mode" : "Activate Volunteer Mode"}>
                <input 
                  type="checkbox" 
                  checked={isVolunteer} 
                  onChange={handleToggleVolunteer} 
                  disabled={toggling}
                />
                <span className="premium-switch-slider"></span>
              </label>
            </div>
          )}
          <div className="sidebar-user">
            <div 
              className="sidebar-user-details" 
              onClick={() => setIsProfileOpen(true)}
              title="Edit Profile Settings"
            >
              {user?.profilePhoto ? (
                <img 
                  src={user.profilePhoto} 
                  alt="Profile" 
                  className="sidebar-user-avatar"
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div className="sidebar-user-avatar">{initials}</div>
              )}
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{user?.name || 'User'}</div>
                <div className="sidebar-user-role">{formatRoleLabel(user?.role)}</div>
              </div>
            </div>
            <button className="btn-ghost btn btn-sm" onClick={handleLogout} title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  );
};

export default Sidebar;
