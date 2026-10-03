import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, Plus, Pencil, Trash2, MapPin, Phone, Users, CheckCircle2,
  Utensils, Droplets, HeartPulse, Zap, Bath, Wifi, UserCheck, Baby, Accessibility,
  Building, GraduationCap, ShieldAlert, Cross, Search, X, RotateCcw, ArrowUpDown, ArrowUp, ArrowDown, Package, AlertCircle, Download
} from 'lucide-react';
import { can } from '../../config/permissions';
import { DeleteConfirmModal, CustomButton, Pagination, formatPhoneDisplay, CustomSelect, Loader, CardScrollContainer } from '../../components/ui';
import { exportToCSV } from '../../utils/exportToCSV';

const statusBadge: Record<string, { label: string; badgeClass: string; dotClass: string }> = {
  open: { label: 'OPEN', badgeClass: 'badge-green', dotClass: 'status-dot-green' },
  full: { label: 'FULL', badgeClass: 'badge-red', dotClass: 'status-dot-red' },
  preparing: { label: 'PREPARING', badgeClass: 'badge-yellow', dotClass: 'status-dot-yellow' },
  closed: { label: 'CLOSED', badgeClass: 'badge-gray', dotClass: 'status-dot-gray' },
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  school: <GraduationCap size={20} />,
  community_center: <Building size={20} />,
  community_hall: <Building size={20} />,
  temple: <Building size={20} />,
  stadium: <Building size={20} />,
  hotel: <Building size={20} />,
  camp: <ShieldAlert size={20} />,
  hospital: <Cross size={20} />,
  other: <Building size={20} />,
};

const FACILITIES_CONFIG: Array<{ key: string; label: string; icon: React.ReactNode }> = [
  { key: 'foodAvailable', label: 'Food', icon: <Utensils size={13} /> },
  { key: 'drinkingWater', label: 'Water', icon: <Droplets size={13} /> },
  { key: 'medicalSupport', label: 'Medical', icon: <HeartPulse size={13} /> },
  { key: 'electricity', label: 'Power', icon: <Zap size={13} /> },
  { key: 'washrooms', label: 'Toilets', icon: <Bath size={13} /> },
  { key: 'wifi', label: 'WiFi', icon: <Wifi size={13} /> },
  { key: 'womenArea', label: 'Women', icon: <UserCheck size={13} /> },
  { key: 'childrenArea', label: 'Kids', icon: <Baby size={13} /> },
  { key: 'wheelchairAccess', label: 'Accessible', icon: <Accessibility size={13} /> },
];

interface SheltersListProps {
  shelters: any[];
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
  filterStatus: string;
  onFilterStatusChange: (val: string) => void;
  sortBy: string;
  onSortByChange: (val: string) => void;
  sortOrder: string;
  onSortOrderChange: (val: string) => void;
  isProximityActive: boolean;
  radiusKm: number;
  onToggleProximity: () => void;
  onRadiusChange: (radius: number) => void;
  onResetFilters: () => void;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (size: number) => void;
  onOpenCreate: () => void;
  onOpenEdit: (shelter: any) => void;
  onUpdateStatus?: (id: string, status: string) => void;
  onDeleteRequest: (target: { id: string; name: string }) => void;
  deleteTarget: { id: string; name: string } | null;
  deleteLoading: boolean;
  onConfirmDelete: () => void;
  onCloseDeleteModal: () => void;
}

const SheltersList: React.FC<SheltersListProps> = ({
  shelters,
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
  filterStatus,
  onFilterStatusChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  isProximityActive,
  radiusKm,
  onToggleProximity,
  onRadiusChange,
  onResetFilters,
  onPageChange,
  onItemsPerPageChange,
  onOpenCreate,
  onOpenEdit,
  onUpdateStatus,
  onDeleteRequest,
  deleteTarget,
  deleteLoading,
  onConfirmDelete,
  onCloseDeleteModal,
}) => {
  const navigate = useNavigate();
  const paginatedShelters = shelters.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (initialLoading) {
    return (
      <div className="page">
        <Loader variant="page" text="Loading emergency shelters..." subtext="Fetching shelter capacity and provisions..." />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Home size={24} style={{ display: 'inline', marginRight: 10, color: '#10b981', verticalAlign: 'middle' }} />
            Emergency Shelters
          </h1>
          <div className="page-subtitle">Manage shelter capacity, operational status, and spatial radius search</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {can(userRole, 'shelters:export') && shelters.length > 0 && (
            <CustomButton
              variant="secondary"
              icon={<Download size={15} />}
              onClick={() => {
                const exportData = shelters.map(s => ({
                  Name: s.name,
                  Type: s.type,
                  Capacity: s.capacity,
                  Occupancy: s.currentOccupancy || 0,
                  Status: s.status,
                  Address: s.location?.address || '',
                  ContactPerson: s.contactPerson || '',
                  ContactPhone: s.contactPhone || '',
                }));
                exportToCSV('shelters_report', exportData);
              }}
            >
              Export CSV
            </CustomButton>
          )}
          {can(userRole, 'shelters:create') && (
            <CustomButton variant="primary" onClick={onOpenCreate}>
              Add Shelter
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
              placeholder="Search shelter name, location, manager..."
              value={search}
              onChange={e => onSearchChange(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'cursor' }}
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
                { value: 'school', label: 'School' },
                { value: 'community_center', label: 'Community Center' },
                { value: 'community_hall', label: 'Community Hall' },
                { value: 'stadium', label: 'Stadium' },
                { value: 'camp', label: 'Camp' },
                { value: 'hospital', label: 'Hospital' },
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
                { value: 'open', label: 'Open' },
                { value: 'full', label: 'Full' },
                { value: 'preparing', label: 'Preparing' },
                { value: 'closed', label: 'Closed' },
              ]}
              value={filterStatus}
              onChange={onFilterStatusChange}
              size="sm"
            />
          </div>

          {/* Proximity Radius Toggle Button */}
          <CustomButton
            variant={isProximityActive ? 'primary' : 'secondary'}
            size="sm"
            onClick={onToggleProximity}
            style={{ height: 38 }}
          >
            <MapPin size={14} style={{ marginRight: 6 }} />
            {isProximityActive ? `Nearest (${radiusKm} km)` : 'Find Nearest'}
          </CustomButton>

          {isProximityActive && (
            <div style={{ width: '130px' }}>
              <CustomSelect
                options={[
                  { value: '5', label: 'Within 5 km' },
                  { value: '10', label: 'Within 10 km' },
                  { value: '25', label: 'Within 25 km' },
                  { value: '50', label: 'Within 50 km' },
                ]}
                value={String(radiusKm)}
                onChange={(val) => onRadiusChange(Number(val))}
                size="sm"
              />
            </div>
          )}

          {/* Reset Filters */}
          {(search || filterType !== 'all' || filterStatus !== 'all' || isProximityActive) && (
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

      {loading ? (
        <Loader variant="page" text="Searching shelters..." subtext="Filtering shelter records..." />
      ) : shelters.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 60 }}>
          {isProximityActive ? `No open shelters found within ${radiusKm}km radius.` : 'No emergency shelters logged yet.'}
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 24 }}>
            <CardScrollContainer>
              {paginatedShelters.map(s => {
                const cap = s.capacity || 1;
                const occ = s.currentOccupancy || 0;
                const occupancyPct = Math.min(100, Math.round((occ / cap) * 100));
                const barColor = occupancyPct > 90 ? '#ef4444' : occupancyPct > 70 ? '#f59e0b' : '#10b981';
                const status = statusBadge[s.status] || { label: s.status?.toUpperCase() || 'UNKNOWN', badgeClass: 'badge-gray', dotClass: 'status-dot-gray' };
                const activeFacilitiesCount = FACILITIES_CONFIG.filter(f => s.facilities?.[f.key]).length;

                return (
                  <div className="shelter-card-modern" key={s._id}>
                    <div>
                      {/* Header Row */}
                      <div className="shelter-header-row">
                        <div className="shelter-title-box">
                          <div className="shelter-type-icon-wrapper">
                            {TYPE_ICONS[s.type] || <Building size={20} />}
                          </div>
                          <div>
                            <div className="shelter-type-tag flex items-center gap-2">
                              <span>{s.type ? s.type.replace('_', ' ') : 'SHELTER'}</span>
                              {s.distanceKm !== undefined && (
                                <span className="badge badge-blue" style={{ fontSize: 11, padding: '2px 6px' }}>
                                  📍 {s.distanceKm} km away
                                </span>
                              )}
                            </div>
                            <h3 className="shelter-main-name" style={{ maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} data-tooltip={s.name}>{s.name}</h3>
                          </div>
                        </div>
                        <span className={`badge ${status.badgeClass}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span className={`status-dot ${status.dotClass}`} />
                          {status.label}
                        </span>
                      </div>

                      {/* Location Address */}
                      <div className="shelter-location-line">
                        <MapPin size={15} />
                        <span className="shelter-address-text">{s.location?.address || 'Address not specified'}</span>
                      </div>

                      {/* Capacity Section */}
                      <div className="shelter-capacity-card">
                        <div className="capacity-card-top">
                          <span className="capacity-title-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            Occupancy Rate
                            {occupancyPct >= 90 && (
                              <span className="badge badge-red" style={{ fontSize: 10, padding: '1px 6px' }}>
                                <AlertCircle size={11} style={{ marginRight: 2 }} /> HIGH OCCUPANCY
                              </span>
                            )}
                          </span>
                          <span className="capacity-counts">
                            <strong>{occ}</strong> / {cap} ({occupancyPct}%)
                          </span>
                        </div>
                        <div className="capacity-track">
                          <div
                            className="capacity-fill"
                            style={{ width: `${occupancyPct}%`, backgroundColor: barColor }}
                          />
                        </div>
                      </div>

                      {/* Facilities Badges */}
                      <div className="shelter-facilities-section">
                        <div className="facilities-section-title">
                          <span>Provisions & Amenities</span>
                          <span className="facilities-badge-count">{activeFacilitiesCount} Available</span>
                        </div>
                        <div className="facilities-flex-wrap">
                          {FACILITIES_CONFIG.map(f => {
                            const active = s.facilities?.[f.key];
                            return (
                              <span key={f.key} className={`facility-pill-modern ${active ? 'active' : 'disabled'}`}>
                                {f.icon}
                                {f.label}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Contact Person Card */}
                      {(s.contactPerson || s.contactPhone) && (
                        <div className="shelter-contact-box">
                          <div className="shelter-contact-icon">
                            <Phone size={14} />
                          </div>
                          <div className="shelter-contact-info">
                            <span className="shelter-contact-name">{s.contactPerson || 'Shelter Manager'}</span>
                            <span className="shelter-contact-phone">{formatPhoneDisplay(s.contactPhone, s.countryCode)}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions Footer */}
                    {(can(userRole, 'resources:create') || can(userRole, 'shelters:open') || can(userRole, 'shelters:close') || can(userRole, 'shelters:edit') || can(userRole, 'shelters:delete')) && (
                      <div className="shelter-card-actions">
                        {can(userRole, 'resources:create') && (
                          <CustomButton variant="secondary" size="sm" icon={<Package size={13} />} onClick={() => navigate('/resources/add')}>
                            Request Supplies
                          </CustomButton>
                        )}
                        {(s.status === 'closed' || s.status === 'preparing') && can(userRole, 'shelters:open') && onUpdateStatus && (
                          <CustomButton variant="success" size="sm" onClick={() => onUpdateStatus(s._id, 'open')}>
                            Open Shelter
                          </CustomButton>
                        )}
                        {(s.status === 'open' || s.status === 'full') && can(userRole, 'shelters:close') && onUpdateStatus && (
                          <CustomButton variant="secondary" size="sm" onClick={() => onUpdateStatus(s._id, 'closed')}>
                            Close Shelter
                          </CustomButton>
                        )}
                        {can(userRole, 'shelters:edit') && (
                          <CustomButton variant="secondary" size="sm" icon={<Pencil size={13} />} onClick={() => onOpenEdit(s)}>
                            Edit
                          </CustomButton>
                        )}
                        {can(userRole, 'shelters:delete') && (
                          <CustomButton variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={() => onDeleteRequest({ id: s._id, name: s.name })}>
                            Delete
                          </CustomButton>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardScrollContainer>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={shelters.length}
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
        title="Delete Emergency Shelter"
        itemName={deleteTarget?.name}
        loading={deleteLoading}
      />
    </div>
  );
};

export default SheltersList;

