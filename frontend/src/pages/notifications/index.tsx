import React, { useState } from 'react';
import { Bell, CheckCheck, Trash2, Search, Shield, Radio, Home, Flame, AlertTriangle, RotateCcw, X, Info, Clock, Sparkles, Users, Package, UserCog } from 'lucide-react';
import { useNotifications, NotificationItem } from '../../context/NotificationContext';
import { CustomButton } from '../../components/ui';

export const NotificationsPage: React.FC = () => {
  const { notifications, unreadCount, markAsRead, toggleRead, markAllAsRead, deleteSingleNotif, clearAll } = useNotifications();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'sos' | 'disaster' | 'team' | 'shelter' | 'missing-person' | 'volunteer' | 'resource' | 'user'>('all');
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');

  const filteredNotifications = notifications.filter((item) => {
    const matchesSearch =
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const cat = (item.category || '').toLowerCase();
    let matchesCategory = true;
    if (categoryFilter === 'disaster') matchesCategory = cat === 'disaster' || cat === 'disasters';
    else if (categoryFilter === 'sos') matchesCategory = cat === 'sos';
    else if (categoryFilter === 'team') matchesCategory = cat === 'team' || cat === 'teams';
    else if (categoryFilter === 'shelter') matchesCategory = cat === 'shelter' || cat === 'shelters';
    else if (categoryFilter === 'missing-person') matchesCategory = cat === 'missing-person';
    else if (categoryFilter === 'volunteer') matchesCategory = cat === 'volunteer';
    else if (categoryFilter === 'resource') matchesCategory = cat === 'resource';
    else if (categoryFilter === 'user') matchesCategory = cat === 'user';

    let matchesRead = true;
    if (readFilter === 'unread') matchesRead = !item.read;
    else if (readFilter === 'read') matchesRead = item.read;

    return matchesSearch && matchesCategory && matchesRead;
  });

  const getCategoryIcon = (category: string) => {
    const cat = (category || '').toLowerCase();
    if (cat === 'sos') return <Radio size={18} style={{ color: '#ef4444' }} />;
    if (cat === 'team' || cat === 'teams') return <Shield size={18} style={{ color: '#3b82f6' }} />;
    if (cat === 'disaster' || cat === 'disasters') return <Flame size={18} style={{ color: '#f97316' }} />;
    if (cat === 'shelter' || cat === 'shelters') return <Home size={18} style={{ color: '#10b981' }} />;
    if (cat === 'missing-person') return <Search size={18} style={{ color: '#ec4899' }} />;
    if (cat === 'volunteer') return <Users size={18} style={{ color: '#06b6d4' }} />;
    if (cat === 'resource') return <Package size={18} style={{ color: '#8b5cf6' }} />;
    if (cat === 'user') return <UserCog size={18} style={{ color: '#2563eb' }} />;
    return <AlertTriangle size={18} style={{ color: '#a855f7' }} />;
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'add':
        return <span className="badge badge-green">NEW INCIDENT</span>;
      case 'edit':
        return <span className="badge badge-blue">UPDATED</span>;
      case 'delete':
        return <span className="badge badge-red">REMOVED</span>;
      case 'dispatch':
        return <span className="badge badge-orange">TEAM DISPATCHED</span>;
      case 'broadcast':
        return <span className="badge badge-purple">BROADCAST</span>;
      default:
        return null;
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  };

  const sosCount = notifications.filter((n) => n.category === 'sos').length;
  const disasterCount = notifications.filter((n) => n.category === 'disaster').length;
  const teamCount = notifications.filter((n) => n.category === 'team').length;
  const shelterCount = notifications.filter((n) => n.category === 'shelter').length;
  const missingCount = notifications.filter((n) => n.category === 'missing-person').length;
  const volunteerCount = notifications.filter((n) => n.category === 'volunteer').length;
  const resourceCount = notifications.filter((n) => n.category === 'resource').length;
  const userCount = notifications.filter((n) => n.category === 'user').length;

  return (
    <div className="page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bell size={22} style={{ color: 'var(--accent-blue, #2563eb)' }} />
            </div>
            Activity Notifications & Incident Audit
          </h1>
          <div className="page-subtitle">
            Real-time activity feed of system events, distress calls, shelter updates, and team deployments
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {unreadCount > 0 && (
            <CustomButton variant="secondary" icon={<CheckCheck size={16} />} onClick={markAllAsRead}>
              Mark All Read
            </CustomButton>
          )}
          {notifications.length > 0 && (
            <CustomButton variant="danger" icon={<Trash2 size={16} />} onClick={clearAll}>
              Clear History
            </CustomButton>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: 14,
          marginBottom: 20,
        }}
      >
        <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ padding: 10, borderRadius: 10, background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb' }}>
            <Sparkles size={22} />
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 800 }}>{notifications.length}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Notifications</div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ padding: 10, borderRadius: 10, background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
            <Bell size={22} />
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#ef4444' }}>{unreadCount}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Unread Alerts</div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ padding: 10, borderRadius: 10, background: 'rgba(249, 115, 22, 0.12)', color: '#f97316' }}>
            <Flame size={22} />
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 800 }}>{disasterCount}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Disaster Events</div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ padding: 10, borderRadius: 10, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
            <Shield size={22} />
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 800 }}>{teamCount}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Team Deployments</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        className="card"
        style={{
          padding: '14px 18px',
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 400 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search notification history..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: 36, paddingRight: searchTerm ? 36 : 12, height: 38 }}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { id: 'all', label: 'All Modules' },
              { id: 'sos', label: `SOS (${sosCount})` },
              { id: 'disaster', label: `Disasters (${disasterCount})` },
              { id: 'team', label: `Teams (${teamCount})` },
              { id: 'shelter', label: `Shelters (${shelterCount})` },
              { id: 'missing-person', label: `Missing (${missingCount})` },
              { id: 'volunteer', label: `Volunteers (${volunteerCount})` },
              { id: 'resource', label: `Resources (${resourceCount})` },
              { id: 'user', label: `Users (${userCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCategoryFilter(tab.id as any)}
                style={{
                  background: categoryFilter === tab.id ? 'var(--accent-blue, #2563eb)' : 'var(--bg-primary, #f1f5f9)',
                  border: '1px solid ' + (categoryFilter === tab.id ? 'var(--accent-blue)' : 'var(--border-color)'),
                  borderRadius: '20px',
                  padding: '5px 12px',
                  fontSize: '11px',
                  fontWeight: categoryFilter === tab.id ? 700 : 500,
                  color: categoryFilter === tab.id ? '#ffffff' : 'var(--text-main)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Read State Pills */}
          <div style={{ display: 'flex', gap: 4, paddingLeft: 8, borderLeft: '1px solid var(--border-color)' }}>
            {(['all', 'unread', 'read'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setReadFilter(st)}
                style={{
                  background: readFilter === st ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                  border: '1px solid ' + (readFilter === st ? 'rgba(59, 130, 246, 0.3)' : 'transparent'),
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: readFilter === st ? 700 : 500,
                  color: readFilter === st ? 'var(--accent-blue, #2563eb)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 60 }}>
          <Info size={36} style={{ margin: '0 auto 12px auto', display: 'block', opacity: 0.4 }} />
          No activity notifications found matching your filter criteria.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredNotifications.map((item) => (
            <div
              key={item.id}
              className="card"
              role={!item.read ? 'button' : undefined}
              tabIndex={!item.read ? 0 : undefined}
              onClick={() => !item.read && markAsRead(item.id)}
              onKeyDown={(event) => {
                if (!item.read && (event.key === 'Enter' || event.key === ' ')) {
                  event.preventDefault();
                  markAsRead(item.id);
                }
              }}
              style={{
                padding: '16px 20px',
                background: item.read ? 'var(--bg-card, #ffffff)' : 'rgba(59, 130, 246, 0.06)',
                borderLeft: item.read ? '4px solid transparent' : '4px solid #2563eb',
                display: 'flex',
                gap: 16,
                alignItems: 'flex-start',
                transition: 'all 0.2s ease',
                cursor: item.read ? 'default' : 'pointer',
              }}
            >
              <div
                style={{
                  padding: 10,
                  borderRadius: 12,
                  background: item.read ? 'var(--bg-primary, #f8fafc)' : 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid ' + (item.read ? 'var(--border-color)' : 'rgba(59, 130, 246, 0.3)'),
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                {getCategoryIcon(item.category)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: item.read ? 600 : 700, color: 'var(--text-main)' }}>
                      {item.title}
                    </h3>
                    {getActionBadge(item.action)}
                    {!item.read && (
                      <span className="badge badge-blue" style={{ fontSize: 9 }}>UNREAD</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', color: 'var(--text-muted)' }}>
                    <Clock size={13} />
                    <span>{formatTime(item.timestamp)}</span>
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: '13px', color: item.read ? 'var(--text-muted)' : 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {item.description}
                </p>

                {item.performedBy && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: '11px', color: 'var(--text-muted)' }}>
                    <Users size={12} style={{ color: 'var(--accent-blue, #2563eb)' }} />
                    <span>Action performed by: <strong>{item.performedBy}</strong></span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                  <CustomButton
                    variant="danger"
                    size="sm"
                    icon={<X size={13} />}
                    onClick={(event) => {
                      event.stopPropagation();
                      deleteSingleNotif(item.id);
                    }}
                  >
                    Remove
                  </CustomButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
