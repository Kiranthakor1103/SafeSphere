import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Trash2, X, AlertTriangle, Shield, Home, Flame, Radio, Info, Check, ArrowRight, Sparkles, Search, Users, Package } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, toggleRead, markAllAsRead, deleteSingleNotif, clearAll } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'disaster' | 'sos' | 'team' | 'shelter'>('all');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === 'unread') return !item.read;
    if (activeTab === 'all') return true;
    const cat = (item.category || '').toLowerCase();
    if (activeTab === 'disaster') return cat === 'disaster' || cat === 'disasters';
    if (activeTab === 'sos') return cat === 'sos';
    if (activeTab === 'team') return cat === 'team' || cat === 'teams';
    if (activeTab === 'shelter') return cat === 'shelter' || cat === 'shelters';
    return cat === activeTab;
  });

  const getCategoryIcon = (category: string) => {
    const cat = (category || '').toLowerCase();
    if (cat === 'sos') return <Radio size={15} style={{ color: '#ef4444' }} />;
    if (cat === 'team' || cat === 'teams') return <Shield size={15} style={{ color: '#3b82f6' }} />;
    if (cat === 'disaster' || cat === 'disasters') return <Flame size={15} style={{ color: '#f97316' }} />;
    if (cat === 'shelter' || cat === 'shelters') return <Home size={15} style={{ color: '#10b981' }} />;
    if (cat === 'missing-person') return <Search size={15} style={{ color: '#ec4899' }} />;
    if (cat === 'volunteer') return <Users size={15} style={{ color: '#06b6d4' }} />;
    if (cat === 'resource') return <Package size={15} style={{ color: '#8b5cf6' }} />;
    return <AlertTriangle size={15} style={{ color: '#a855f7' }} />;
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'add':
        return <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: 'rgba(16, 185, 129, 0.15)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.3)' }}>NEW</span>;
      case 'edit':
        return <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: 'rgba(59, 130, 246, 0.15)', color: '#2563eb', border: '1px solid rgba(59, 130, 246, 0.3)' }}>EDIT</span>;
      case 'delete':
        return <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: 'rgba(239, 68, 68, 0.15)', color: '#dc2626', border: '1px solid rgba(239, 68, 68, 0.3)' }}>DELETE</span>;
      case 'dispatch':
        return <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: 'rgba(249, 115, 22, 0.15)', color: '#ea580c', border: '1px solid rgba(249, 115, 22, 0.3)' }}>DISPATCH</span>;
      case 'broadcast':
        return <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: 'rgba(168, 85, 247, 0.15)', color: '#9333ea', border: '1px solid rgba(168, 85, 247, 0.3)' }}>ALERT</span>;
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
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          background: isOpen ? 'var(--bg-card-hover, rgba(59,130,246,0.12))' : 'var(--bg-card, #ffffff)',
          border: '1px solid ' + (isOpen ? 'var(--accent-blue, #2563eb)' : 'var(--border-color, #e2e8f0)'),
          borderRadius: '10px',
          padding: '8px 12px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          cursor: 'pointer',
          color: 'var(--text-main, #1e293b)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isOpen ? '0 0 12px rgba(37, 99, 235, 0.2)' : '0 2px 5px rgba(0,0,0,0.04)',
        }}
        title="Live Emergency Activity"
      >
        <div style={{ position: 'relative' }}>
          <Bell size={18} style={{ color: unreadCount > 0 ? '#ef4444' : 'var(--text-muted)' }} />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -3,
                right: -3,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#ef4444',
                boxShadow: '0 0 8px #ef4444',
              }}
            />
          )}
        </div>
        <span style={{ fontSize: '12px', fontWeight: 600 }}>Activity</span>
        {unreadCount > 0 && (
          <span
            style={{
              background: '#ef4444',
              color: '#ffffff',
              borderRadius: '999px',
              padding: '1px 6px',
              fontSize: '10px',
              fontWeight: 700,
              minWidth: '16px',
              textAlign: 'center',
              lineHeight: '14px',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Modern Activity Drawer */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '400px',
            maxWidth: '92vw',
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '16px',
            boxShadow: '0 24px 48px -12px rgba(15, 23, 42, 0.25)',
            zIndex: 3000,
            overflow: 'hidden',
            backdropFilter: 'blur(16px)',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--bg-primary, #f8fafc)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Sparkles size={16} style={{ color: 'var(--accent-blue, #2563eb)' }} />
              </div>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>Live Activity</h4>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  style={{
                    background: 'rgba(37, 99, 235, 0.08)',
                    border: '1px solid rgba(37, 99, 235, 0.2)',
                    color: 'var(--accent-blue, #2563eb)',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 8px',
                    borderRadius: '6px',
                    transition: 'all 0.15s ease',
                  }}
                  title="Mark all as read"
                >
                  <CheckCheck size={13} />
                  Mark Read
                </button>
              )}

              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    fontSize: '11px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    padding: '4px 7px',
                    borderRadius: '6px',
                    transition: 'all 0.15s ease',
                  }}
                  title="Clear all notifications"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Single Segmented Pill Tab Bar */}
          <div
            style={{
              display: 'flex',
              gap: 4,
              padding: '8px 12px',
              borderBottom: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              overflowX: 'auto',
            }}
          >
            {[
              { id: 'all', label: `All (${notifications.length})` },
              { id: 'unread', label: `Unread (${unreadCount})`, isUnreadBadge: unreadCount > 0 },
              { id: 'disaster', label: 'Disasters' },
              { id: 'sos', label: 'SOS' },
              { id: 'team', label: 'Teams' },
              { id: 'shelter', label: 'Shelters' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    background: isActive ? 'var(--accent-blue, #2563eb)' : 'transparent',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#ffffff' : tab.isUnreadBadge ? '#2563eb' : 'var(--text-muted)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  {tab.isUnreadBadge && !isActive && (
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb' }} />
                  )}
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Cards List Body */}
          <div style={{ maxHeight: '350px', overflowY: 'auto', padding: '6px 8px' }}>
            {filteredNotifications.length === 0 ? (
              <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                <Info size={22} style={{ margin: '0 auto 8px auto', display: 'block', opacity: 0.4 }} />
                No activity notifications in this view.
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const isHovered = hoveredId === notif.id;
                return (
                  <div
                    key={notif.id}
                    onMouseEnter={() => setHoveredId(notif.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => markAsRead(notif.id)}
                    style={{
                      padding: '10px 12px',
                      marginBottom: 4,
                      borderRadius: '10px',
                      background: notif.read
                        ? (isHovered ? 'var(--bg-primary, #f8fafc)' : 'transparent')
                        : 'rgba(59, 130, 246, 0.07)',
                      borderLeft: notif.read ? '3px solid transparent' : '3px solid #2563eb',
                      display: 'flex',
                      gap: 10,
                      alignItems: 'flex-start',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}
                  >
                    {/* Category Icon */}
                    <div
                      style={{
                        padding: '6px',
                        borderRadius: '8px',
                        background: notif.read ? 'var(--bg-primary, #f1f5f9)' : 'rgba(59, 130, 246, 0.12)',
                        border: '1px solid ' + (notif.read ? 'var(--border-color)' : 'rgba(59, 130, 246, 0.25)'),
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      {getCategoryIcon(notif.category)}
                    </div>

                    {/* Card Content */}
                    <div style={{ flex: 1, minWidth: 0, paddingRight: isHovered ? 40 : 0, transition: 'padding 0.15s ease' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12px', fontWeight: notif.read ? 600 : 700, color: 'var(--text-main)' }}>
                          {notif.title}
                        </span>
                        {getActionBadge(notif.action)}
                      </div>

                      <div style={{ fontSize: '11px', color: notif.read ? 'var(--text-muted)' : 'var(--text-secondary)', lineHeight: '1.4', wordBreak: 'break-word' }}>
                        {notif.description}
                      </div>

                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>
                        {formatTime(notif.timestamp)}
                      </div>
                    </div>

                    {/* Quick Hover Controls on Right */}
                    {isHovered && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          background: 'var(--bg-card, #ffffff)',
                          padding: '2px 4px',
                          borderRadius: '6px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        {!notif.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notif.id);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#2563eb',
                              cursor: 'pointer',
                              padding: 3,
                              display: 'flex',
                              borderRadius: 4,
                            }}
                            title="Mark as Read"
                          >
                            <Check size={13} />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSingleNotif(notif.id);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: 3,
                            display: 'flex',
                            borderRadius: 4,
                          }}
                          title="Delete notification"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Bar Link */}
          <div
            onClick={() => {
              setIsOpen(false);
              navigate('/notifications');
            }}
            style={{
              padding: '10px 16px',
              borderTop: '1px solid var(--border-color)',
              background: 'var(--bg-primary, #f8fafc)',
              textAlign: 'center',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--accent-blue, #2563eb)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'background 0.15s ease',
            }}
          >
            <span>View Full Notifications History</span>
            <ArrowRight size={14} />
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
