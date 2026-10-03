import React from 'react';
import { UserCheck, Plus, Pencil, Trash2, Search, X, RotateCcw, ArrowUpDown, ArrowUp, ArrowDown, Send, Download } from 'lucide-react';
import { can } from '../../config/permissions';
import { DeleteConfirmModal, CustomButton, Pagination, CustomSelect, formatPhoneDisplay, Loader } from '../../components/ui';
import { exportToCSV } from '../../utils/exportToCSV';

const statusBadge: any = { available: 'green', deployed: 'red', standby: 'yellow', off_duty: 'gray' };

interface RescueTeamsListProps {
  teams: any[];
  loading: boolean;
  initialLoading?: boolean;
  userRole?: string;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (size: number) => void;
  search: string;
  onSearchChange: (val: string) => void;
  filterStatus: string;
  onFilterStatusChange: (val: string) => void;
  filterVehicle: string;
  onFilterVehicleChange: (val: string) => void;
  sortBy: string;
  onSortByChange: (val: string) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (val: 'asc' | 'desc') => void;
  onResetFilters: () => void;
  onOpenCreate: () => void;
  onOpenEdit: (team: any) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onOpenDispatchModal?: (team: any) => void;
  onDeleteRequest: (target: { id: string; name: string }) => void;
  deleteTarget: { id: string; name: string } | null;
  deleteLoading: boolean;
  onConfirmDelete: () => void;
  onCloseDeleteModal: () => void;
}

const RescueTeamsList: React.FC<RescueTeamsListProps> = ({
  teams,
  loading,
  initialLoading,
  userRole,
  currentPage,
  itemsPerPage,
  totalPages,
  onPageChange,
  onItemsPerPageChange,
  search,
  onSearchChange,
  filterStatus,
  onFilterStatusChange,
  filterVehicle,
  onFilterVehicleChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  onResetFilters,
  onOpenCreate,
  onOpenEdit,
  onUpdateStatus,
  onOpenDispatchModal,
  onDeleteRequest,
  deleteTarget,
  deleteLoading,
  onConfirmDelete,
  onCloseDeleteModal,
}) => {
  const paginatedTeams = teams.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
        <Loader variant="page" text="Loading rescue teams..." subtext="Fetching rescue team units and status..." />
      </div>
    );
  }

  const hasActions = can(userRole, 'rescue-teams:edit') || can(userRole, 'rescue-teams:delete');

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <UserCheck size={22} style={{ display: 'inline', marginRight: 8, color: '#a855f7' }} />
            Rescue Teams
          </h1>
          <div className="page-subtitle">Coordinate and deploy specialized rescue units</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {can(userRole, 'rescue-teams:export') && teams.length > 0 && (
            <CustomButton
              variant="secondary"
              icon={<Download size={15} />}
              onClick={() => {
                const exportData = teams.map(t => ({
                  Name: t.name,
                  ContactPhone: t.contactPhone || '',
                  Specializations: (t.specializations || []).join('; '),
                  Status: t.status,
                  VehicleType: t.vehicleType || '',
                  Capacity: t.capacity || 0,
                  MembersCount: t.membersCount || 0,
                }));
                exportToCSV('rescue_teams_report', exportData);
              }}
            >
              Export CSV
            </CustomButton>
          )}
          {can(userRole, 'rescue-teams:create') && (
            <CustomButton variant="primary" onClick={onOpenCreate}>
              Create Team
            </CustomButton>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-card">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 220px', minWidth: '180px' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: 36, paddingRight: search ? 36 : 12, height: 38, fontSize: 13 }}
              placeholder="Search team name, vehicle, specialization..."
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

          {/* Status Filter */}
          <div style={{ width: '150px' }}>
            <CustomSelect
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'available', label: 'Available' },
                { value: 'standby', label: 'Standby' },
                { value: 'deployed', label: 'Deployed' },
                { value: 'off_duty', label: 'Off Duty' },
              ]}
              value={filterStatus}
              onChange={onFilterStatusChange}
              size="sm"
            />
          </div>

          {/* Vehicle Type Filter */}
          <div style={{ width: '150px' }}>
            <CustomSelect
              options={[
                { value: 'all', label: 'All Vehicles' },
                { value: 'AirCraft', label: 'AirCraft' },
                { value: 'Helicopter', label: 'Helicopter' },
                { value: 'Boat', label: 'Boat' },
                { value: 'Truck', label: 'Truck' },
                { value: 'Car', label: 'Car' },
                { value: 'Ambulance', label: 'Ambulance' },
                { value: 'Heavy Rig', label: 'Heavy Rig' },
                { value: 'SUV', label: 'SUV' },
                { value: 'Other', label: 'Other' },
              ]}
              value={filterVehicle}
              onChange={onFilterVehicleChange}
              size="sm"
            />
          </div>

          {/* Reset Filters */}
          {(search || filterStatus !== 'all' || filterVehicle !== 'all') && (
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
                  {renderSortHeader('Team Name', 'name')}
                  <th>Contact Phone</th>
                  <th>Specialization</th>
                  {renderSortHeader('Status', 'status')}
                  {renderSortHeader('Vehicle', 'vehicleType')}
                  {renderSortHeader('Capacity', 'capacity')}
                  {hasActions && <th style={{ textAlign: 'right', paddingRight: 24 }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={hasActions ? 7 : 6} style={{ padding: 0 }}>
                      <Loader variant="page" text="Searching rescue teams..." subtext="Filtering team records..." />
                    </td>
                  </tr>
                ) : teams.length === 0 ? (
                  <tr>
                    <td colSpan={hasActions ? 7 : 6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
                      No rescue teams created yet.
                    </td>
                  </tr>
                ) : null}
                {!loading && paginatedTeams.map(t => (
                  <tr key={t._id}>
                    <td style={{ fontWeight: 700, maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} data-tooltip={t.name}>
                      {t.name}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{formatPhoneDisplay(t.contactPhone || t.leader?.phone, t.countryCode)}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {t.specialization?.map((s: string) => (
                          <span key={s} className="badge badge-purple" style={{ fontSize: 10 }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      {can(userRole, 'rescue-teams:edit') ? (
                        <CustomSelect
                          size="sm"
                          options={Object.keys(statusBadge)}
                          value={t.status}
                          onChange={val => onUpdateStatus(t._id, val)}
                        />
                      ) : (
                        <span className={`badge badge-${statusBadge[t.status]}`}>{t.status}</span>
                      )}
                    </td>
                    <td style={{ fontSize: 12 }}>{t.vehicleType || '—'}</td>
                    <td>{t.capacity}</td>
                    {hasActions && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px', justifyContent: 'flex-end' }}>
                          {can(userRole, 'rescue-teams:edit') && (t.status === 'available' || t.status === 'standby') && onOpenDispatchModal && (
                            <CustomButton variant="danger" size="sm" icon={<Send size={13} />} onClick={() => onOpenDispatchModal(t)}>
                              Dispatch
                            </CustomButton>
                          )}
                          {can(userRole, 'rescue-teams:edit') && (
                            <CustomButton variant="secondary" size="sm" icon={<Pencil size={13} />} onClick={() => onOpenEdit(t)}>
                              Edit
                            </CustomButton>
                          )}
                          {can(userRole, 'rescue-teams:delete') && (
                            <CustomButton variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={() => onDeleteRequest({ id: t._id, name: t.name })}>
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
          totalItems={teams.length}
          itemsPerPage={itemsPerPage}
          onPageChange={onPageChange}
          onItemsPerPageChange={onItemsPerPageChange}
        />
      </div>

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={onCloseDeleteModal}
        onConfirm={onConfirmDelete}
        title="Delete Rescue Team"
        itemName={deleteTarget?.name}
        loading={deleteLoading}
      />
    </div>
  );
};

export default RescueTeamsList;
