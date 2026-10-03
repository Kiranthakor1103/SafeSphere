import React from 'react';
import { Zap, MapPin, Pencil, Trash2, Search, X, RotateCcw, ArrowUpDown, ArrowUp, ArrowDown, Download } from 'lucide-react';
import { can } from '../../config/permissions';
import { DeleteConfirmModal, CustomButton, Pagination, CustomSelect, Loader } from '../../components/ui';
import { exportToCSV } from '../../utils/exportToCSV';

const severityBadge: any = { low: 'green', medium: 'yellow', high: 'orange', critical: 'red' };
const statusBadge: any = { active: 'red', monitoring: 'orange', resolved: 'green', closed: 'gray' };

interface DisastersListProps {
  disasters: any[];
  loading: boolean;
  initialLoading?: boolean;
  userRole?: string;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  search: string;
  onSearchChange: (val: string) => void;
  filterType: string;
  onFilterTypeChange: (val: string) => void;
  filterSeverity: string;
  onFilterSeverityChange: (val: string) => void;
  filterStatus: string;
  onFilterStatusChange: (val: string) => void;
  sortBy: string;
  onSortByChange: (val: string) => void;
  sortOrder: string;
  onSortOrderChange: (val: string) => void;
  onResetFilters: () => void;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (size: number) => void;
  onOpenCreate: () => void;
  onOpenEdit: (disaster: any) => void;
  onDeleteRequest: (target: { id: string; title: string }) => void;
  deleteTarget: { id: string; title: string } | null;
  deleteLoading: boolean;
  onConfirmDelete: () => void;
  onCloseDeleteModal: () => void;
}

const DisastersList: React.FC<DisastersListProps> = ({
  disasters,
  loading,
  initialLoading,
  userRole,
  currentPage,
  itemsPerPage,
  totalPages,
  search,
  onSearchChange,
  filterType,
  onFilterTypeChange,
  filterSeverity,
  onFilterSeverityChange,
  filterStatus,
  onFilterStatusChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  onResetFilters,
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
  const paginatedDisasters = disasters.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const isFiltered = search || filterType !== 'all' || filterSeverity !== 'all' || filterStatus !== 'all';

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'flood', label: 'Flood' },
    { value: 'earthquake', label: 'Earthquake' },
    { value: 'cyclone', label: 'Cyclone' },
    { value: 'fire', label: 'Fire' },
    { value: 'landslide', label: 'Landslide' },
    { value: 'tsunami', label: 'Tsunami' },
    { value: 'drought', label: 'Drought' },
    { value: 'other', label: 'Other' },
  ];

  const severityOptions = [
    { value: 'all', label: 'All Severities' },
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'monitoring', label: 'Monitoring' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' },
  ];

  const sortOptions = [
    { value: 'createdAt', label: 'Sort: Date' },
    { value: 'title', label: 'Sort: Title' },
    { value: 'affectedCount', label: 'Sort: Affected Count' },
    { value: 'severity', label: 'Sort: Severity' },
  ];

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
        <Loader variant="page" text="Loading active disasters..." subtext="Fetching real-time incident records..." />
      </div>
    );
  }

  const hasActions = can(userRole, 'disasters:edit') || can(userRole, 'disasters:delete');

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Zap size={22} style={{ display: 'inline', marginRight: 8, color: '#ef4444' }} />
            Disaster Management
          </h1>
          <div className="page-subtitle">Track, filter, and manage active disaster events</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {can(userRole, 'disasters:export') && disasters.length > 0 && (
            <CustomButton
              variant="secondary"
              icon={<Download size={15} />}
              onClick={() => {
                const exportData = disasters.map(d => ({
                  Title: d.title,
                  Type: d.type,
                  Severity: d.severity,
                  Status: d.status,
                  Location: d.location?.address || '',
                  AffectedCount: d.affectedCount || 0,
                  CreatedAt: d.createdAt ? new Date(d.createdAt).toLocaleString() : '',
                }));
                exportToCSV('disasters_report', exportData);
              }}
            >
              Export CSV
            </CustomButton>
          )}
          {can(userRole, 'disasters:create') && (
            <CustomButton variant="primary" onClick={onOpenCreate}>
              Add Disaster
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
              placeholder="Search title, location, details..."
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

          {/* Type Filter */}
          <div style={{ width: '150px' }}>
            <CustomSelect
              options={typeOptions}
              value={filterType}
              onChange={onFilterTypeChange}
              size="sm"
            />
          </div>

          {/* Severity Filter */}
          <div style={{ width: '150px' }}>
            <CustomSelect
              options={severityOptions}
              value={filterSeverity}
              onChange={onFilterSeverityChange}
              size="sm"
            />
          </div>

          {/* Status Filter */}
          <div style={{ width: '150px' }}>
            <CustomSelect
              options={statusOptions}
              value={filterStatus}
              onChange={onFilterStatusChange}
              size="sm"
            />
          </div>

          {/* Reset Filters */}
          {isFiltered && (
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

      <div className="table-container">
        <div className="table-wrapper">
          <table className="table">
                <thead>
                  <tr>
                    {renderSortHeader('Title', 'title')}
                    {renderSortHeader('Type', 'type')}
                    {renderSortHeader('Severity', 'severity')}
                    {renderSortHeader('Status', 'status')}
                    <th>Location</th>
                    {renderSortHeader('Affected', 'affectedCount')}
                    {hasActions && <th style={{ textAlign: 'right', paddingRight: 24 }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={hasActions ? 7 : 6} style={{ padding: 0 }}>
                        <Loader variant="page" text="Searching disasters..." subtext="Filtering records..." />
                      </td>
                    </tr>
                  ) : disasters.length === 0 ? (
                    <tr>
                      <td colSpan={hasActions ? 7 : 6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
                        No disasters match your filter criteria.
                      </td>
                    </tr>
                  ) : null}
                  {!loading && paginatedDisasters.map(d => (
                    <tr key={d._id}>
                      <td style={{ fontWeight: 600, maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'middle' }} title={d.title}>
                        {d.title}
                      </td>
                      <td style={{ verticalAlign: 'middle' }}><span className="badge badge-blue">{d.type}</span></td>
                      <td style={{ verticalAlign: 'middle' }}><span className={`badge badge-${severityBadge[d.severity]}`}>{d.severity}</span></td>
                      <td style={{ verticalAlign: 'middle' }}><span className={`badge badge-${statusBadge[d.status]}`}>{d.status}</span></td>
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
                          title={d.location?.address || '—'}
                        >
                          {d.location?.address ? (
                            <>
                              <MapPin size={12} style={{ display: 'inline', marginRight: 4, color: 'var(--accent-blue)', verticalAlign: '-1px', flexShrink: 0 }} />
                              {d.location.address}
                            </>
                          ) : '—'}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, verticalAlign: 'middle' }}>{d.affectedCount?.toLocaleString() || 0}</td>
                      {hasActions && (
                        <td style={{ textAlign: 'right', verticalAlign: 'middle' }}>
                          <div style={{ display: 'inline-flex', gap: 8, justifyContent: 'flex-end' }}>
                            {can(userRole, 'disasters:edit') && (
                              <CustomButton variant="secondary" size="sm" icon={<Pencil size={13} />} onClick={() => onOpenEdit(d)}>
                                Edit
                              </CustomButton>
                            )}
                            {can(userRole, 'disasters:delete') && (
                              <CustomButton variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={() => onDeleteRequest({ id: d._id, title: d.title })}>
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
              totalItems={disasters.length}
              itemsPerPage={itemsPerPage}
              onPageChange={onPageChange}
              onItemsPerPageChange={onItemsPerPageChange}
            />
      </div>

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={onCloseDeleteModal}
        onConfirm={onConfirmDelete}
        title="Delete Disaster Event"
        itemName={deleteTarget?.title}
        loading={deleteLoading}
      />
    </div>
  );
};

export default DisastersList;
