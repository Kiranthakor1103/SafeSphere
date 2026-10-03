import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { getSheltersAPI, getNearestSheltersAPI, createShelterAPI, updateShelterAPI, deleteShelterAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import SheltersList from './SheltersList';
import SheltersForm from './SheltersForm';

const EMPTY_FACILITIES = {
  foodAvailable: false, drinkingWater: false, medicalSupport: false,
  electricity: false, washrooms: false, wifi: false,
  womenArea: false, childrenArea: false, wheelchairAccess: false
};

const EMPTY_FORM = {
  name: '', type: 'school', status: 'open', capacity: 100, currentOccupancy: 0,
  contactPerson: '', contactPhone: '', countryCode: '+91',
  location: { lat: '', lng: '', address: '' },
  facilities: { ...EMPTY_FACILITIES }
};

export const SheltersPage: React.FC<{ initialView?: 'list' | 'form' }> = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();

  const isAddRoute = location.pathname.endsWith('/add');
  const isEditRoute = location.pathname.includes('/edit/');
  const view = isAddRoute || isEditRoute ? 'form' : 'list';

  const [shelters, setShelters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const initialLoadDone = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  // Filter & Search states
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Proximity Search states
  const [isProximityActive, setIsProximityActive] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(20);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (isProximityActive && userCoords) {
        const r = await getNearestSheltersAPI(userCoords.lat, userCoords.lng, radiusKm, filterStatus);
        setShelters(r.data.shelters || []);
      } else {
        const params: any = { sortBy, sortOrder };
        if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
        if (filterType !== 'all') params.type = filterType;
        if (filterStatus !== 'all') params.status = filterStatus;

        const r = await getSheltersAPI(params);
        const list = r.data.shelters || [];
        setShelters(list);

        if (isEditRoute && id) {
          const s = list.find((item: any) => item._id === id);
          if (s) {
            setEditing(s);
            setForm({
              name: s.name, type: s.type, status: s.status,
              capacity: s.capacity, currentOccupancy: s.currentOccupancy || 0,
              contactPerson: s.contactPerson || '', contactPhone: s.contactPhone || '', countryCode: s.countryCode || '+91',
              location: s.location || { lat: '', lng: '', address: '' },
              facilities: { ...EMPTY_FACILITIES, ...(s.facilities || {}) }
            });
          }
        } else if (isAddRoute) {
          setEditing(null);
          setForm(EMPTY_FORM);
        } else {
          setEditing(null);
        }
      }
    } catch (err: any) {
      toast.error('Failed to load shelters');
    }
    setLoading(false);
    initialLoadDone.current = true;
  }, [id, isAddRoute, isEditRoute, debouncedSearch, filterType, filterStatus, sortBy, sortOrder, isProximityActive, userCoords, radiusKm]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggleProximity = () => {
    if (isProximityActive) {
      setIsProximityActive(false);
      setUserCoords(null);
    } else {
      if ('geolocation' in navigator) {
        toast.loading('Acquiring your location...', { id: 'geo-loc' });
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            toast.success('Location acquired!', { id: 'geo-loc' });
            setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setIsProximityActive(true);
            setCurrentPage(1);
          },
          (err) => {
            toast.error('Could not get GPS location. Using default center.', { id: 'geo-loc' });
            // Default center e.g. Mumbai (19.0760, 72.8777)
            setUserCoords({ lat: 19.0760, lng: 72.8777 });
            setIsProximityActive(true);
            setCurrentPage(1);
          }
        );
      } else {
        toast.error('Geolocation not supported by browser.');
      }
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setFilterType('all');
    setFilterStatus('all');
    setSortBy('createdAt');
    setSortOrder('desc');
    setIsProximityActive(false);
    setUserCoords(null);
    setRadiusKm(20);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(shelters.length / itemsPerPage);

  const openCreate = () => {
    navigate('/shelters/add');
  };

  const openEdit = (s: any) => {
    navigate(`/shelters/edit/${s._id}`);
  };

  const closeForm = () => {
    navigate('/shelters', { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        capacity: Number(form.capacity),
        currentOccupancy: Number(form.currentOccupancy),
        location: form.location.address ? {
          ...form.location,
          lat: form.location.lat ? Number(form.location.lat) : 0,
          lng: form.location.lng ? Number(form.location.lng) : 0
        } : undefined
      };
      const editId = id || editing?._id;
      if (editId) {
        await updateShelterAPI(editId, payload);
        addNotification({
          category: 'shelter', action: 'edit', title: '✏️ Shelter Details Updated',
          description: `Shelter "${form.name}" occupancy or status updated to ${form.status.toUpperCase()}.`,
          performedBy: user?.name || 'Administrator',
        });
        toast.success('Shelter updated!');
      } else {
        await createShelterAPI(payload);
        addNotification({
          category: 'shelter', action: 'add', title: '🏠 New Relief Shelter Registered',
          description: `Shelter "${form.name}" opened. Capacity: ${form.capacity} people at ${form.location.address || 'Site'}.`,
          performedBy: user?.name || 'Administrator',
        });
        toast.success('Shelter registered!');
      }
      navigate('/shelters', { replace: true });
    } catch (err: any) { 
      toast.error(err.response?.data?.message || 'Error'); 
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteShelterAPI(deleteTarget.id);
      addNotification({
        category: 'shelter', action: 'delete', title: '🗑️ Shelter Record Removed',
        description: `Relief shelter "${deleteTarget.name}" removed from registry.`,
        performedBy: user?.name || 'Administrator',
      });
      setShelters(prev => prev.filter(s => s._id !== deleteTarget.id));
      toast.success('Shelter deleted!');
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete shelter');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await updateShelterAPI(id, { status });
      const shelter = shelters.find(item => item._id === id);
      addNotification({
        category: 'shelter', action: 'edit', title: '✏️ Shelter Details Updated',
        description: `Shelter "${shelter?.name || 'Shelter'}" occupancy or status updated to ${status.toUpperCase()}.`,
        performedBy: user?.name || 'Administrator',
      });
      toast.success(`Shelter status updated to ${status.toUpperCase()}!`);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update shelter status');
    }
  };

  if (view === 'form') {
    return (
      <SheltersForm
        editing={id || editing}
        form={form}
        setForm={setForm}
        onSubmit={handleSubmit}
        onCancel={closeForm}
        submitting={submitting}
        loading={loading}
      />
    );
  }

  return (
    <SheltersList
      shelters={shelters}
      loading={loading}
      initialLoading={!initialLoadDone.current && loading}
      userRole={user?.role}
      currentPage={currentPage}
      itemsPerPage={itemsPerPage}
      totalPages={totalPages}
      search={search}
      onSearchChange={val => { setSearch(val); setCurrentPage(1); }}
      filterType={filterType}
      onFilterTypeChange={val => { setFilterType(val); setCurrentPage(1); }}
      filterStatus={filterStatus}
      onFilterStatusChange={val => { setFilterStatus(val); setCurrentPage(1); }}
      sortBy={sortBy}
      onSortByChange={val => { setSortBy(val); setCurrentPage(1); }}
      sortOrder={sortOrder}
      onSortOrderChange={val => { setSortOrder(val); setCurrentPage(1); }}
      isProximityActive={isProximityActive}
      radiusKm={radiusKm}
      onToggleProximity={handleToggleProximity}
      onRadiusChange={(val) => { setRadiusKm(val); setCurrentPage(1); }}
      onResetFilters={handleResetFilters}
      onPageChange={(page) => setCurrentPage(page)}
      onItemsPerPageChange={(size) => {
        setItemsPerPage(size);
        setCurrentPage(1);
      }}
      onOpenCreate={openCreate}
      onOpenEdit={openEdit}
      onUpdateStatus={handleUpdateStatus}
      onDeleteRequest={(target) => setDeleteTarget(target)}
      deleteTarget={deleteTarget}
      deleteLoading={deleteLoading}
      onConfirmDelete={confirmDelete}
      onCloseDeleteModal={() => setDeleteTarget(null)}
    />
  );
};

export default SheltersPage;
