import React from 'react';
import { Radio, MapPin, Users, Pencil, Trash2, Search, X, RotateCcw, ArrowUpDown, ArrowUp, ArrowDown, Send, Download, Bot, Sparkles } from 'lucide-react';
import { can } from '../../config/permissions';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { DeleteConfirmModal, CustomButton, Pagination, CustomSelect, formatPhoneDisplay, Loader } from '../../components/ui';
import { exportToCSV } from '../../utils/exportToCSV';

// Fix for default marker icons in React Leaflet
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

const STATUSES = ['pending', 'assigned', 'in_progress', 'resolved', 'cancelled'];
const priorityBadge: any = { low: 'green', medium: 'yellow', high: 'orange', critical: 'red' };
const statusBadge: any = { pending: 'red', assigned: 'orange', in_progress: 'blue', resolved: 'green', cancelled: 'gray' };

interface SOSListProps {
  alerts: any[];
  loading: boolean;
  initialLoading?: boolean;
  userRole?: string;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  search: string;
  onSearchChange: (val: string) => void;
  filterPriority: string;
  onFilterPriorityChange: (val: string) => void;
  filterStatus: string;
  onFilterStatusChange: (val: string) => void;
  sortBy: string;
  onSortByChange: (val: string) => void;
  sortOrder: string;
  onSortOrderChange: (val: string) => void;
  onResetFilters: () => void;
  editStatus: { id: string; status: string } | null;
  setEditStatus: React.Dispatch<React.SetStateAction<{ id: string; status: string } | null>>;
  onStatusChange: (id: string, status: string) => void;
  onOpenDispatchModal?: (alert: any) => void;
  onOpenTriageModal?: (alert: any) => void;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (size: number) => void;
  onOpenCreate: () => void;
  onDeleteRequest: (target: { id: string; name: string }) => void;
  deleteTarget: { id: string; name: string } | null;
  deleteLoading: boolean;
  onConfirmDelete: () => void;
  onCloseDeleteModal: () => void;
}

const SOSList: React.FC<SOSListProps> = ({
  alerts,
  loading,
  initialLoading,
  userRole,
  currentPage,
  itemsPerPage,
  totalPages,
  search,
  onSearchChange,
  filterPriority,
  onFilterPriorityChange,
  filterStatus,
  onFilterStatusChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  onResetFilters,
  editStatus,
  setEditStatus,
  onStatusChange,
  onOpenDispatchModal,
  onOpenTriageModal,
  onPageChange,
  onItemsPerPageChange,
  onOpenCreate,
  onDeleteRequest,
  deleteTarget,
  deleteLoading,
  onConfirmDelete,
  onCloseDeleteModal,
}) => {
  const paginatedAlerts = alerts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const activeAlerts = alerts.filter(a => a.location && a.location.lat && a.location.lng);
  const mapCenter: [number, number] = activeAlerts.length > 0 
    ? [Number(activeAlerts[0].location.lat), Number(activeAlerts[0].location.lng)]
    : [13.0827, 80.2707];

  const handleHeaderSort = (field: string) => {
    if (sortBy === field) {
      onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSortByChange(field);
      onSortOrderChange('asc');
    }
  };

  const renderSortHeader = (label: string, field: string) => {
    const isSorted = sortBy === field;
    return (
      <th
        onClick={() => handleHeaderSort(field)}
        style={{ cursor: 'pointer', userSelect: 'none' }}
        title={`Sort by ${label}`}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ color: isSorted ? 'var(--accent-blue)' : 'inherit', fontWeight: isSorted ? 700 : 'inherit' }}>
            {label}
          </span>
          {isSorted ? (
            sortOrder === 'asc' ? <ArrowUp size={13} style={{ color: 'var(--accent-blue)' }} /> : <ArrowDown size={13} style={{ color: 'var(--accent-blue)' }} />
          ) : (
            <ArrowUpDown size={12} style={{ opacity: 0.35 }} />
          )}
        </div>
      </th>
    );
  };

  if (initialLoading) {
    return (
      <div className="page">
        <Loader variant="page" text="Loading SOS alerts..." subtext="Fetching emergency distress signals and map markers..." />
      </div>
    );
  }

  const hasActions = can(userRole, 'sos:edit') || can(userRole, 'sos:delete');

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Radio size={22} style={{ display: 'inline', marginRight: 8, color: '#ef4444' }} />
            Emergency SOS Alerts
          </h1>
          <div className="page-subtitle">Real-time distress signals & rescue dispatches</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {can(userRole, 'sos:export') && alerts.length > 0 && (
            <CustomButton
              variant="secondary"
              icon={<Download size={15} />}
              onClick={() => {
                const exportData = alerts.map(a => ({
                  Reporter: a.userId?.name || 'Emergency Contact',
                  ContactPhone: a.contactPhone || a.userId?.phone || '',
                  Type: a.type,
                  Priority: a.priority,
                  Status: a.status,
                  Message: a.message,
                  Location: a.location?.address || '',
                  NumberOfPeople: a.numberOfPeople || 1,
                  CreatedAt: a.createdAt ? new Date(a.createdAt).toLocaleString() : '',
                }));
                exportToCSV('sos_alerts_report', exportData);
              }}
            >
              Export CSV
            </CustomButton>
          )}
        {can(userRole, 'sos:create') && (
  <CustomButton variant="danger" onClick={onOpenCreate}>
    Trigger Emergency SOS
  </CustomButton>
)}
        </div>
      </div>

      {/* Filter and Search Bar using CustomSelect */}
      <div className="filter-card">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 220px', minWidth: '180px' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: 36, paddingRight: search ? 36 : 12, height: 38, fontSize: 13 }}
              placeholder="Search user, contact phone, message..."
              value={search}
              onChange={e => onSearchChange(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Priority Filter */}
          <div style={{ width: '150px' }}>
            <CustomSelect
              options={[
                { value: 'all', label: 'All Priorities' },
                { value: 'critical', label: 'Critical' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' },
              ]}
              value={filterPriority}
              onChange={onFilterPriorityChange}
              size="sm"
            />
          </div>

          {/* Status Filter */}
          <div style={{ width: '150px' }}>
            <CustomSelect
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'pending', label: 'Pending' },
                { value: 'assigned', label: 'Assigned' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'resolved', label: 'Resolved' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
              value={filterStatus}
              onChange={onFilterStatusChange}
              size="sm"
            />
          </div>

          {/* Reset Filters */}
          {(search || filterPriority !== 'all' || filterStatus !== 'all') && (
            <CustomButton
              variant="secondary"
              size="sm"
              onClick={onResetFilters}
              style={{ height: 38, color: '#ef4444' }}
            >
              <RotateCcw size={14} style={{ marginRight: 4 }} />
              Reset
            </CustomButton>
          )}
        </div>
      </div>

      <div className="card mb-4" style={{ padding: 0, overflow: 'hidden', height: '400px' }}>
        <MapContainer center={mapCenter} zoom={11} style={{ height: '100%', width: '100%', background: '#dce8f7' }}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          {activeAlerts.map((a: any) => (
            <Marker key={a._id} position={[Number(a.location.lat), Number(a.location.lng)]}>
              <Popup>
                <div style={{ color: '#000' }}>
                  <strong>{a.type?.toUpperCase()} Emergency</strong><br/>
                  <em>{a.userId?.name || 'Unknown User'}</em><br/>
                  Priority: {a.priority}<br/>
                  Status: {a.status}<br/>
                  Message: {a.message}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="table-container">
        <div className="table-wrapper">
          <table className="table">
              <thead>
                <tr>
                  <th>Reporter</th>
                  <th>Type</th>
                  {renderSortHeader('Priority', 'priority')}
                  {renderSortHeader('Status', 'status')}
                  <th>Message</th>
                  <th>Location</th>
                  <th>People</th>
                  {hasActions && <th style={{ textAlign: 'right', paddingRight: 24 }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={hasActions ? 8 : 7} style={{ padding: 0 }}>
                      <Loader variant="page" text="Searching SOS alerts..." subtext="Filtering emergency records..." />
                    </td>
                  </tr>
                ) : alerts.length === 0 ? (
                  <tr>
                    <td colSpan={hasActions ? 8 : 7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
                      No SOS alerts yet.
                    </td>
                  </tr>
                ) : null}
                {!loading && paginatedAlerts.map(a => (
                  <tr key={a._id}>
                    <td style={{ fontWeight: 600, verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600 }}>
                          {a.userId?.name || 'Emergency Contact'}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>
                          {formatPhoneDisplay(a.contactPhone || a.userId?.phone, a.countryCode)}
                        </span>
                      </div>
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      <span className="badge badge-blue">{a.type}</span>
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      <span className={`badge badge-${priorityBadge[a.priority]}`}>{a.priority}</span>
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      {can(userRole, 'sos:edit') && editStatus?.id === a._id ? (
                        <CustomSelect
                          size="sm"
                          options={STATUSES}
                          value={editStatus.status}
                          onChange={(val) => setEditStatus(p => p ? { ...p, status: val } : null)}
                          style={{ minWidth: 110, marginBottom: 0 }}
                        />
                      ) : (
                        <span className={`badge badge-${statusBadge[a.status]}`}>{a.status}</span>
                      )}
                    </td>
                    <td style={{ maxWidth: '180px', verticalAlign: 'middle' }}>
                      <div 
                        style={{ 
                          fontSize: '12px', 
                          color: 'var(--text-primary)', 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis' 
                        }} 
                        title={a.message}
                      >
                        {a.message}
                      </div>
                    </td>
                    <td style={{ maxWidth: '240px', minWidth: '180px', verticalAlign: 'middle' }}>
                      <div 
                        style={{ 
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontSize: '12px', 
                          color: 'var(--text-secondary)',
                          lineHeight: '1.4'
                        }} 
                        title={a.location?.address || '—'}
                      >
                        {a.location?.address ? (
                          <>
                            <MapPin size={12} style={{ display: 'inline', marginRight: 4, color: 'var(--accent-blue)', verticalAlign: '-1px', flexShrink: 0 }} />
                            {a.location.address}
                          </>
                        ) : '—'}
                      </div>
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      <span 
                        style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '4px', 
                          background: 'var(--bg-secondary)', 
                          border: '1px solid var(--border)', 
                          padding: '3px 8px', 
                          borderRadius: '6px', 
                          fontSize: '12px', 
                          fontWeight: 600, 
                          color: 'var(--text-primary)' 
                        }}
                      >
                        <Users size={12} style={{ color: 'var(--accent-blue)' }} />
                        {a.numberOfPeople}
                      </span>
                    </td>
                    {hasActions && (
                      <td style={{ textAlign: 'right', verticalAlign: 'middle' }}>
                        <div style={{ display: 'inline-flex', gap: 6, justifyContent: 'flex-end' }}>
                          {onOpenTriageModal && (
                            <CustomButton size="sm" variant="secondary" icon={<Bot size={13} style={{ color: '#3b82f6' }} />} onClick={() => onOpenTriageModal(a)}>
                              AI Triage
                            </CustomButton>
                          )}
                          {can(userRole, 'sos:edit') && a.status === 'pending' && onOpenDispatchModal && (
                            <CustomButton size="sm" variant="danger" icon={<Send size={13} />} onClick={() => onOpenDispatchModal(a)}>
                              Dispatch
                            </CustomButton>
                          )}
                          {can(userRole, 'sos:edit') && editStatus?.id === a._id ? (
                            <>
                              <CustomButton size="sm" variant="success" onClick={() => onStatusChange(a._id, editStatus.status)}>Save</CustomButton>
                              <CustomButton size="sm" variant="secondary" onClick={() => setEditStatus(null)}>Cancel</CustomButton>
                            </>
                          ) : can(userRole, 'sos:edit') ? (
                            <CustomButton size="sm" variant="secondary" icon={<Pencil size={13} />} onClick={() => setEditStatus({ id: a._id, status: a.status })}>
                              Edit
                            </CustomButton>
                          ) : null}
                          {can(userRole, 'sos:delete') && (
                            <CustomButton size="sm" variant="danger" icon={<Trash2 size={13} />} onClick={() => onDeleteRequest({ id: a._id, name: `${a.type?.toUpperCase()} from ${a.userId?.name || 'Unknown'}` })}>
                              Delete
                            </CustomButton>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={alerts.length}
          itemsPerPage={itemsPerPage}
          onPageChange={onPageChange}
          onItemsPerPageChange={onItemsPerPageChange}
        />
      </div>

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={onCloseDeleteModal}
        onConfirm={onConfirmDelete}
        title="Delete SOS Alert"
        itemName={deleteTarget?.name}
        loading={deleteLoading}
      />
    </div>
  );
};

export default SOSList;
