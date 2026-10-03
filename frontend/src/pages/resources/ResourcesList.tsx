import React from 'react';
import { Package, Plus, Pencil, Trash2, Search, X, RotateCcw, ArrowUpDown, ArrowUp, ArrowDown, Download } from 'lucide-react';
import { can } from '../../config/permissions';
import { DeleteConfirmModal, CustomButton, Pagination, CustomSelect, Loader } from '../../components/ui';
import { exportToCSV } from '../../utils/exportToCSV';

const statusBadge: any = { available: 'green', allocated: 'orange', depleted: 'red', requested: 'blue' };

interface ResourcesListProps {
  resources: any[];
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
  filterType: string;
  onFilterTypeChange: (val: string) => void;
  filterStatus: string;
  onFilterStatusChange: (val: string) => void;
  sortBy: string;
  onSortByChange: (val: string) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (val: 'asc' | 'desc') => void;
  onResetFilters: () => void;
  onOpenCreate: () => void;
  onOpenEdit: (resource: any) => void;
  onDeleteRequest: (target: { id: string; name: string }) => void;
  deleteTarget: { id: string; name: string } | null;
  deleteLoading: boolean;
  onConfirmDelete: () => void;
  onCloseDeleteModal: () => void;
}

const ResourcesList: React.FC<ResourcesListProps> = ({
  resources,
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
  filterType,
  onFilterTypeChange,
  filterStatus,
  onFilterStatusChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  onResetFilters,
  onOpenCreate,
  onOpenEdit,
  onDeleteRequest,
  deleteTarget,
  deleteLoading,
  onConfirmDelete,
  onCloseDeleteModal,
}) => {
  const paginatedResources = resources.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
        <Loader variant="page" text="Loading resource inventory..." subtext="Fetching relief materials and supplies..." />
      </div>
    );
  }

  const hasActions = can(userRole, 'resources:edit') || can(userRole, 'resources:delete');

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Package size={24} style={{ display: 'inline', marginRight: 10, color: '#ec4899', verticalAlign: 'middle' }} />
            Resources Inventory
          </h1>
          <div className="page-subtitle">Manage supplies, equipment, and relief materials</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {can(userRole, 'resources:export') && resources.length > 0 && (
            <CustomButton
              variant="secondary"
              icon={<Download size={15} />}
              onClick={() => {
                const exportData = resources.map(r => ({
                  ItemName: r.name,
                  Category: r.category,
                  Quantity: r.quantity,
                  Unit: r.unit || 'units',
                  Status: r.status,
                  Location: r.location?.address || r.storageLocation || '',
                  Provider: r.provider || '',
                }));
                exportToCSV('resources_inventory_report', exportData);
              }}
            >
              Export CSV
            </CustomButton>
          )}
          {can(userRole, 'resources:create') && (
            <CustomButton variant="primary" onClick={onOpenCreate}>
              Add Resource
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
              placeholder="Search resource name, provider..."
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
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'food', label: 'Food' },
                { value: 'water', label: 'Water' },
                { value: 'medicine', label: 'Medicine' },
                { value: 'clothing', label: 'Clothing' },
                { value: 'equipment', label: 'Equipment' },
                { value: 'vehicle', label: 'Vehicle' },
                { value: 'other', label: 'Other' },
              ]}
              value={filterType}
              onChange={onFilterTypeChange}
              size="sm"
            />
          </div>

          {/* Status Filter */}
          <div style={{ width: '150px' }}>
            <CustomSelect
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'available', label: 'Available' },
                { value: 'allocated', label: 'Allocated' },
                { value: 'depleted', label: 'Depleted' },
                { value: 'requested', label: 'Requested' },
              ]}
              value={filterStatus}
              onChange={onFilterStatusChange}
              size="sm"
            />
          </div>

          {/* Reset Filters */}
          {(search || filterType !== 'all' || filterStatus !== 'all') && (
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
                  {renderSortHeader('Type', 'type')}
                  {renderSortHeader('Quantity', 'quantity')}
                  {renderSortHeader('Status', 'status')}
                  {renderSortHeader('Provider', 'providedBy')}
                  {hasActions && <th style={{ textAlign: 'right', paddingRight: 24 }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={hasActions ? 6 : 5} style={{ padding: 0 }}>
                      <Loader variant="page" text="Searching resources..." subtext="Filtering resource inventory..." />
                    </td>
                  </tr>
                ) : resources.length === 0 ? (
                  <tr>
                    <td colSpan={hasActions ? 6 : 5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
                      No resources logged yet.
                    </td>
                  </tr>
                ) : null}
                {!loading && paginatedResources.map(r => (
                    <tr key={r._id}>
                      <td style={{ fontWeight: 700, maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} data-tooltip={r.name}>
                        {r.name}
                      </td>
                      <td>
                        <span className="badge badge-gray" style={{ textTransform: 'capitalize' }}>
                          {r.type}
                        </span>
                      </td>
                      <td>{r.quantity} {r.unit}</td>
                      <td>
                        <span className={`badge badge-${statusBadge[r.status] || 'gray'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{r.providedBy || '—'}</td>
                      {hasActions && (
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 8, justifyContent: 'flex-end' }}>
                            {can(userRole, 'resources:edit') && (
                              <CustomButton variant="secondary" size="sm" icon={<Pencil size={13} />} onClick={() => onOpenEdit(r)}>
                                Edit
                              </CustomButton>
                            )}
                            {can(userRole, 'resources:delete') && (
                              <CustomButton variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={() => onDeleteRequest({ id: r._id, name: r.name })}>
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
          totalItems={resources.length}
          itemsPerPage={itemsPerPage}
          onPageChange={onPageChange}
          onItemsPerPageChange={onItemsPerPageChange}
        />
      </div>

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={onCloseDeleteModal}
        onConfirm={onConfirmDelete}
        title="Delete Resource Item"
        itemName={deleteTarget?.name}
        loading={deleteLoading}
      />
    </div>
  );
};

export default ResourcesList;
