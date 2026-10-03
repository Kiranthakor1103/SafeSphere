import React from 'react';
import { UserX, Plus, Pencil, Trash2, Search, X, RotateCcw, ArrowUpDown, ArrowUp, ArrowDown, Download } from 'lucide-react';
import { can } from '../../config/permissions';
import { DeleteConfirmModal, CustomButton, Pagination, formatPhoneDisplay, CustomSelect, Loader } from '../../components/ui';
import { exportToCSV } from '../../utils/exportToCSV';

const statusBadge: any = { missing: 'red', found: 'green', deceased: 'gray' };

interface MissingPersonsListProps {
  persons: any[];
  loading: boolean;
  initialLoading?: boolean;
  userRole?: string;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  search: string;
  onSearchChange: (val: string) => void;
  filterGender: string;
  onFilterGenderChange: (val: string) => void;
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
  onOpenEdit: (person: any) => void;
  onDeleteRequest: (target: { id: string; name: string }) => void;
  deleteTarget: { id: string; name: string } | null;
  deleteLoading: boolean;
  onConfirmDelete: () => void;
  onCloseDeleteModal: () => void;
}

const MissingPersonsList: React.FC<MissingPersonsListProps> = ({
  persons,
  loading,
  initialLoading,
  userRole,
  currentPage,
  itemsPerPage,
  totalPages,
  search,
  onSearchChange,
  filterGender,
  onFilterGenderChange,
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
  const paginatedPersons = persons.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
        <Loader variant="page" text="Loading missing person reports..." subtext="Fetching search and rescue missing records..." />
      </div>
    );
  }

  const hasActions = can(userRole, 'missing-persons:edit') || can(userRole, 'missing-persons:delete');

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <UserX size={22} style={{ display: 'inline', marginRight: 8, color: '#f97316' }} />
            Missing Persons
          </h1>
          <div className="page-subtitle">Report and search for missing individuals during emergencies</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {can(userRole, 'missing-persons:export') && persons.length > 0 && (
            <CustomButton
              variant="secondary"
              icon={<Download size={15} />}
              onClick={() => {
                const exportData = persons.map(p => ({
                  Name: p.name,
                  Age: p.age || '',
                  Gender: p.gender || '',
                  Status: p.status,
                  LastSeenAddress: p.lastSeenLocation?.address || '',
                  LastSeenDate: p.lastSeenDate ? new Date(p.lastSeenDate).toLocaleDateString() : '',
                  ContactPerson: p.contactPerson || '',
                  ContactPhone: p.contactPhone || '',
                  ReportedBy: p.reportedBy?.name || p.contactPerson || '',
                }));
                exportToCSV('missing_persons_report', exportData);
              }}
            >
              Export CSV
            </CustomButton>
          )}
          {can(userRole, 'missing-persons:create') && (
            <CustomButton variant="primary" onClick={onOpenCreate}>
              Report Missing Person
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
              placeholder="Search name, location, features..."
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

          {/* Gender Filter */}
          <div style={{ width: '150px' }}>
            <CustomSelect
              options={[
                { value: 'all', label: 'All Genders' },
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
              ]}
              value={filterGender}
              onChange={onFilterGenderChange}
              size="sm"
            />
          </div>

          {/* Status Filter */}
          <div style={{ width: '150px' }}>
            <CustomSelect
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'missing', label: 'Missing' },
                { value: 'found', label: 'Found' },
                { value: 'deceased', label: 'Deceased' },
              ]}
              value={filterStatus}
              onChange={onFilterStatusChange}
              size="sm"
            />
          </div>

          {/* Reset Filters */}
          {(search || filterGender !== 'all' || filterStatus !== 'all') && (
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
                  {renderSortHeader('Name', 'name')}
                  {renderSortHeader('Age/Gender', 'age')}
                  {renderSortHeader('Status', 'status')}
                  <th>Last Seen</th>
                  <th>Contact</th>
                  <th>Reported By</th>
                  {hasActions && <th style={{ textAlign: 'right', paddingRight: 24 }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={hasActions ? 7 : 6} style={{ padding: 0 }}>
                      <Loader variant="page" text="Searching missing persons..." subtext="Filtering person records..." />
                    </td>
                  </tr>
                ) : persons.length === 0 ? (
                  <tr>
                    <td colSpan={hasActions ? 7 : 6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
                      No missing person reports filed yet.
                    </td>
                  </tr>
                ) : null}
                {!loading && paginatedPersons.map(p => (
                  <tr key={p._id}>
                    <td style={{ fontWeight: 700, maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} data-tooltip={p.name}>
                      {p.name}
                    </td>
                    <td>{p.age ? `${p.age} yrs` : '—'} / {p.gender}</td>
                    <td><span className={`badge badge-${statusBadge[p.status]}`}>{p.status}</span></td>
                    <td style={{ fontSize: 12 }}>{p.lastSeenLocation?.address || '—'}</td>
                    <td style={{ fontSize: 12, fontWeight: 600 }}>{formatPhoneDisplay(p.contactPhone, p.countryCode)}</td>
                    <td style={{ fontSize: 12 }}>{p.reportedBy?.name || p.contactPerson || '—'}</td>
                    {hasActions && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px', justifyContent: 'flex-end' }}>
                          {can(userRole, 'missing-persons:edit') && (
                            <CustomButton variant="secondary" size="sm" icon={<Pencil size={13} />} onClick={() => onOpenEdit(p)}>
                              Edit
                            </CustomButton>
                          )}
                          {can(userRole, 'missing-persons:delete') && (
                            <CustomButton variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={() => onDeleteRequest({ id: p._id, name: p.name })}>
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
          totalItems={persons.length}
          itemsPerPage={itemsPerPage}
          onPageChange={onPageChange}
          onItemsPerPageChange={onItemsPerPageChange}
        />
      </div>

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={onCloseDeleteModal}
        onConfirm={onConfirmDelete}
        title="Delete Missing Person Report"
        itemName={deleteTarget?.name}
        loading={deleteLoading}
      />
    </div>
  );
};

export default MissingPersonsList;
