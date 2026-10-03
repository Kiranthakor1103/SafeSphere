import React from 'react';
import { Users, Plus, ShieldCheck, Clock, Mail, Pencil, Trash2, Download } from 'lucide-react';
import { can } from '../../config/permissions';
import { DeleteConfirmModal, CustomButton, Pagination, Loader } from '../../components/ui';
import { exportToCSV } from '../../utils/exportToCSV';

const getAvailBadge = (isAvailable: boolean) => {
  return isAvailable
    ? { class: 'badge-green', dot: 'status-dot-green', label: 'Available' }
    : { class: 'badge-gray', dot: 'status-dot-gray', label: 'Unavailable' };
};

const getInitials = (name?: any) => {
  if (!name) return 'V';
  const str = typeof name === 'string' ? name : (typeof name === 'object' && name.name ? String(name.name) : String(name));
  const parts = str.trim().split(' ');
  return parts.length > 1 ? (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase() : parts[0].substring(0, 2).toUpperCase();
};

interface VolunteersListProps {
  volunteers: any[];
  loading: boolean;
  userRole?: string;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (size: number) => void;
  onOpenCreate: () => void;
  onOpenEdit: (volunteer: any) => void;
  onDeleteRequest: (target: { id: string; name: string }) => void;
  deleteTarget: { id: string; name: string } | null;
  deleteLoading: boolean;
  onConfirmDelete: () => void;
  onCloseDeleteModal: () => void;
}

const VolunteersList: React.FC<VolunteersListProps> = ({
  volunteers,
  loading,
  userRole,
  currentPage,
  itemsPerPage,
  totalPages,
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
  const paginatedVolunteers = volunteers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) {
    return (
      <div className="page">
        <Loader variant="page" text="Loading volunteer profiles..." subtext="Fetching registered disaster response volunteers..." />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Users size={24} style={{ display: 'inline', marginRight: 10, color: '#3b82f6', verticalAlign: 'middle' }} />
            Volunteers
          </h1>
          <div className="page-subtitle">Manage registered volunteers, active assignments, and contributed hours</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {can(userRole, 'volunteers:export') && volunteers.length > 0 && (
            <CustomButton
              variant="secondary"
              icon={<Download size={15} />}
              onClick={() => {
                const exportData = volunteers.map(v => ({
                  Name: typeof v.userId === 'object' && v.userId?.name ? String(v.userId.name) : (typeof v.name === 'string' ? v.name : 'Volunteer'),
                  Email: typeof v.userId === 'object' && v.userId?.email ? String(v.userId.email) : (typeof v.email === 'string' ? v.email : ''),
                  Skills: Array.isArray(v.skills) ? v.skills.map((s: any) => typeof s === 'string' ? s : (s?.name || String(s))).join('; ') : '',
                  Availability: v.isAvailable ? 'Available' : 'Unavailable',
                  Experience: typeof v.experience === 'string' ? v.experience : '',
                  AssignedTask: typeof v.assignedDisaster === 'object' && v.assignedDisaster?.title ? String(v.assignedDisaster.title) : 'Unassigned',
                }));
                exportToCSV('volunteers_report', exportData);
              }}
            >
              Export CSV
            </CustomButton>
          )}
          {can(userRole, 'volunteers:create') && (
            <CustomButton variant="primary" onClick={onOpenCreate}>
              Register as Volunteer
            </CustomButton>
          )}
        </div>
      </div>

      {volunteers.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 60 }}>
          No volunteers registered yet.
        </div>
      ) : (
        <>
          <div className="cards-grid" style={{ marginBottom: 24 }}>
            {paginatedVolunteers.map((v, idx) => {
              const availInfo = getAvailBadge(v.isAvailable !== false);
              const nameStr = typeof v.userId === 'object' && v.userId?.name 
                ? String(v.userId.name) 
                : (typeof v.name === 'string' ? v.name : 'Volunteer');
              const emailStr = typeof v.userId === 'object' && v.userId?.email 
                ? String(v.userId.email) 
                : (typeof v.email === 'string' ? v.email : 'N/A');
              const initials = getInitials(nameStr);
              const cardKey = v._id ? String(v._id) : `vol-${idx}`;

              return (
                <div className="volunteer-card" key={cardKey}>
                  <div className="volunteer-card-top">
                    <div className="volunteer-card-header">
                      <div className="volunteer-user-meta">
                        <div className="volunteer-avatar-circle">{initials}</div>
                        <div className="volunteer-user-info">
                          <div className="volunteer-name-row">
                            <span className="volunteer-name" style={{ maxWidth: '140px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block', verticalAlign: 'bottom' }} data-tooltip={nameStr}>{nameStr}</span>
                            {v.isVerified && (
                              <span className="verified-badge-chip">
                                <ShieldCheck size={11} /> Verified
                              </span>
                            )}
                          </div>
                          <span className="volunteer-email">
                            <Mail size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                            {emailStr}
                          </span>
                        </div>
                      </div>

                      <span className={`badge ${availInfo.class} volunteer-status-badge`}>
                        <span className={`status-dot ${availInfo.dot}`} />
                        {availInfo.label}
                      </span>
                    </div>

                    <div className="volunteer-skills-section">
                      <span className="skills-title">Specialized Skills</span>
                      <div className="volunteer-skill-chips">
                        {Array.isArray(v.skills) && v.skills.length > 0 ? (
                          v.skills.map((s: any, sIdx: number) => {
                            const skillStr = typeof s === 'string' ? s : (s?.name || String(s));
                            return (
                              <span className="volunteer-skill-chip" key={`${skillStr}-${sIdx}`}>
                                {skillStr}
                              </span>
                            );
                          })
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No skills listed</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="volunteer-card-footer">
                    <div className="volunteer-stat-pill">
                      <Clock size={13} className="stat-icon" />
                      <span><strong>{typeof v.hoursContributed === 'number' ? v.hoursContributed : 0}</strong> hours</span>
                    </div>

                    {(can(userRole, 'volunteers:edit') || can(userRole, 'volunteers:delete')) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {can(userRole, 'volunteers:edit') && (
                          <CustomButton variant="secondary" size="sm" icon={<Pencil size={13} />} onClick={() => onOpenEdit(v)}>
                            Edit
                          </CustomButton>
                        )}
                        {can(userRole, 'volunteers:delete') && (
                          <CustomButton variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={() => onDeleteRequest({ id: v._id, name: nameStr })}>
                            Delete
                          </CustomButton>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={volunteers.length}
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
        title="Delete Volunteer"
        itemName={deleteTarget?.name}
        loading={deleteLoading}
      />
    </div>
  );
};

export default VolunteersList;
