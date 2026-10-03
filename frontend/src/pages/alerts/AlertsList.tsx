import React, { useState } from 'react';
import { Megaphone, AlertTriangle, AlertOctagon, Info, CheckCircle2, User, Clock, Pencil, Trash2, Search, ShieldAlert, Radio, X, Download, MapPin, Smartphone } from 'lucide-react';
import { can } from '../../config/permissions';
import { DeleteConfirmModal, CustomButton, Pagination, Loader } from '../../components/ui';
import { exportToCSV } from '../../utils/exportToCSV';

const alertTypeConfig: Record<string, { icon: any; color: string; bg: string; border: string; badgeClass: string; label: string }> = {
  danger: { icon: AlertTriangle, color: '#dc2626', bg: 'rgba(220, 38, 38, 0.08)', border: 'rgba(220, 38, 38, 0.25)', badgeClass: 'badge-red', label: 'DANGER' },
  warning: { icon: AlertOctagon, color: '#d97706', bg: 'rgba(217, 119, 6, 0.08)', border: 'rgba(217, 119, 6, 0.25)', badgeClass: 'badge-orange', label: 'WARNING' },
  evacuation: { icon: Megaphone, color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.08)', border: 'rgba(124, 58, 237, 0.25)', badgeClass: 'badge-purple', label: 'EVACUATION' },
  info: { icon: Info, color: '#2563eb', bg: 'rgba(37, 99, 235, 0.08)', border: 'rgba(37, 99, 235, 0.25)', badgeClass: 'badge-blue', label: 'INFO' },
  success: { icon: CheckCircle2, color: '#059669', bg: 'rgba(5, 150, 105, 0.08)', border: 'rgba(5, 150, 105, 0.25)', badgeClass: 'badge-green', label: 'RESOLVED' },
};

interface AlertsListProps {
  alerts: any[];
  loading: boolean;
  userRole?: string;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (size: number) => void;
  onOpenCreate: () => void;
  onOpenEdit: (alert: any) => void;
  onDeleteRequest: (target: { id: string; title: string }) => void;
  deleteTarget: { id: string; title: string } | null;
  deleteLoading: boolean;
  onConfirmDelete: () => void;
  onCloseDeleteModal: () => void;
}

const AlertsList: React.FC<AlertsListProps> = ({
  alerts,
  loading,
  userRole,
  currentPage,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  onOpenCreate,
  onOpenEdit,
  onDeleteRequest,
  deleteTarget,
  deleteLoading,
  onConfirmDelete,
  onCloseDeleteModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  const filteredAlerts = alerts.filter((a) => {
    const matchesSearch =
      a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.message?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || a.type === selectedType;
    return matchesSearch && matchesType;
  });

  const paginatedAlerts = filteredAlerts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const dangerCount = alerts.filter((a) => a.type === 'danger').length;
  const warningCount = alerts.filter((a) => a.type === 'warning').length;
  const evacuationCount = alerts.filter((a) => a.type === 'evacuation').length;
  const infoCount = alerts.filter((a) => a.type === 'info' || a.type === 'success').length;

  if (loading) {
    return (
      <div className="page">
        <Loader variant="page" text="Loading broadcast alerts..." subtext="Fetching emergency directives..." />
      </div>
    );
  }

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
                background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.2), rgba(249, 115, 22, 0.15))',
                border: '1px solid rgba(234, 179, 8, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Megaphone size={20} style={{ color: '#d97706' }} />
            </div>
            Broadcast Emergency Alerts
          </h1>
          <div className="page-subtitle">
            Officially issued emergency broadcasts, evacuation orders, and safety advisories
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {can(userRole, 'alerts:export') && alerts.length > 0 && (
            <CustomButton
              variant="secondary"
              icon={<Download size={15} />}
              onClick={() => {
                const exportData = alerts.map(a => ({
                  Title: a.title,
                  Type: a.type,
                  Severity: a.severity || '',
                  Message: a.message,
                  AffectedAreas: (a.affectedAreas || []).join('; '),
                  IssuedBy: a.issuedBy?.name || '',
                  CreatedAt: a.createdAt ? new Date(a.createdAt).toLocaleString() : '',
                }));
                exportToCSV('broadcast_alerts_report', exportData);
              }}
            >
              Export CSV
            </CustomButton>
          )}
          {can(userRole, 'alerts:create') && (
            <CustomButton variant="primary"  onClick={onOpenCreate}>
              Issue Broadcast
            </CustomButton>
          )}
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14,
          marginBottom: 22,
        }}
      >
        {[
          { count: alerts.length, label: 'Total Broadcasts', icon: Radio, color: '#2563eb', bg: 'rgba(59, 130, 246, 0.12)' },
          { count: dangerCount, label: 'Danger Alerts', icon: AlertTriangle, color: '#dc2626', bg: 'rgba(220, 38, 38, 0.12)' },
          { count: warningCount, label: 'Warnings', icon: AlertOctagon, color: '#d97706', bg: 'rgba(217, 119, 6, 0.12)' },
          { count: evacuationCount, label: 'Evacuations', icon: Megaphone, color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.12)' },
          { count: infoCount, label: 'Info / Resolved', icon: Info, color: '#059669', bg: 'rgba(5, 150, 105, 0.12)' },
        ].map((stat, idx) => {
          const StatIcon = stat.icon;
          return (
            <div className="card" key={idx} style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ padding: 10, borderRadius: 10, background: stat.bg, color: stat.color, flexShrink: 0 }}>
                <StatIcon size={22} />
              </div>
              <div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: stat.color, lineHeight: 1.1 }}>{stat.count}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 2 }}>{stat.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div
        className="card"
        style={{
          padding: '12px 16px',
          marginBottom: 22,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 380 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search broadcasts..."
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

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All' },
            { id: 'danger', label: 'Danger' },
            { id: 'warning', label: 'Warning' },
            { id: 'evacuation', label: 'Evacuation' },
            { id: 'info', label: 'Info' },
          ].map((tab) => {
            const isActive = selectedType === tab.id;
            const cfg = tab.id !== 'all' ? alertTypeConfig[tab.id] : null;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                style={{
                  background: isActive ? (cfg ? cfg.bg : 'var(--accent-blue, #2563eb)') : 'var(--bg-primary, #f1f5f9)',
                  border: '1px solid ' + (isActive ? (cfg ? cfg.border : 'var(--accent-blue)') : 'var(--border-color)'),
                  borderRadius: '20px',
                  padding: '5px 12px',
                  fontSize: '11px',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? (cfg ? cfg.color : '#ffffff') : 'var(--text-main)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Alert Cards — Full Width List Layout */}
      {filteredAlerts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 60 }}>
          <ShieldAlert size={36} style={{ margin: '0 auto 12px auto', display: 'block', opacity: 0.4 }} />
          No broadcast alerts match your search criteria.
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {paginatedAlerts.map((a) => {
              const config = alertTypeConfig[a.type] || alertTypeConfig.warning;
              const IconComponent = config.icon;

              return (
                <div
                  key={a._id}
                  className="card"
                  style={{
                    padding: 0,
                    overflow: 'hidden',
                    borderLeft: `4px solid ${config.color}`,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Top colored accent strip */}
                  <div
                    style={{
                      height: 3,
                      background: `linear-gradient(90deg, ${config.color}, transparent)`,
                    }}
                  />

                  <div style={{ padding: '20px 24px' }}>
                    {/* Header row: icon + title + type badge */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: 16,
                        marginBottom: 12,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 12,
                            background: config.bg,
                            border: `1px solid ${config.border}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <IconComponent size={22} style={{ color: config.color }} />
                        </div>

                        <div style={{ minWidth: 0, flex: 1 }}>
                          <h3
                            style={{
                              margin: 0,
                              fontSize: '16px',
                              fontWeight: 700,
                              color: 'var(--text-primary)',
                              lineHeight: 1.4,
                              wordBreak: 'break-word',
                            }}
                          >
                            {a.title}
                          </h3>
                        </div>
                      </div>

                      <span
                        className={`badge ${config.badgeClass}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '5px 12px',
                          fontSize: '10px',
                          letterSpacing: '0.7px',
                          fontWeight: 700,
                          flexShrink: 0,
                          borderRadius: 20,
                        }}
                      >
                        <span
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: '50%',
                            backgroundColor: config.color,
                            display: 'inline-block',
                          }}
                        />
                        {config.label}
                      </span>
                    </div>

                    {/* Message body — full text, no truncation */}
                    <p
                      style={{
                        margin: '0 0 16px 0',
                        fontSize: '14px',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.6,
                        wordBreak: 'break-word',
                      }}
                    >
                      {a.message}
                    </p>

                    {/* Footer meta + actions */}
                    <div
                      style={{
                        paddingTop: 14,
                        borderTop: '1px solid var(--border-color, #e2e8f0)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 12,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <User size={14} style={{ color: 'var(--text-muted)' }} />
                          <span>
                            Issued by <strong style={{ color: 'var(--text-main)' }}>{a.issuedBy?.name || 'System Command'}</strong>
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                          <span>
                            {new Date(a.createdAt).toLocaleString(undefined, {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(66, 109, 196, 0.08)', padding: '2px 8px', borderRadius: '6px', color: 'var(--accent-blue)', fontWeight: 600 }}>
                          <MapPin size={13} />
                          <span>Region: {a.targetDistrict || 'All Regions'}</span>
                        </div>

                        {a.sendSMS && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(5, 150, 105, 0.1)', padding: '2px 8px', borderRadius: '6px', color: '#059669', fontWeight: 600 }}>
                            <Smartphone size={13} />
                            <span>Mobile SMS Sent</span>
                          </div>
                        )}
                      </div>

                      {(can(userRole, 'alerts:edit') || can(userRole, 'alerts:delete')) && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          {can(userRole, 'alerts:edit') && (
                            <CustomButton
                              variant="secondary"
                              size="sm"
                              icon={<Pencil size={13} />}
                              onClick={() => onOpenEdit(a)}
                            >
                              Edit
                            </CustomButton>
                          )}
                          {can(userRole, 'alerts:delete') && (
                            <CustomButton
                              variant="danger"
                              size="sm"
                              icon={<Trash2 size={13} />}
                              onClick={() => onDeleteRequest({ id: a._id, title: a.title })}
                            >
                              Delete
                            </CustomButton>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredAlerts.length / itemsPerPage)}
            totalItems={filteredAlerts.length}
            itemsPerPage={itemsPerPage}
            onPageChange={onPageChange}
            onItemsPerPageChange={onItemsPerPageChange}
          />
        </>
      )}

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={onCloseDeleteModal}
        onConfirm={onConfirmDelete}
        title="Delete Emergency Broadcast"
        itemName={deleteTarget?.title}
        loading={deleteLoading}
      />
    </div>
  );
};

export default AlertsList;
