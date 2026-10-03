import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { getMissingPersonsAPI, createMissingPersonAPI, updateMissingPersonAPI, deleteMissingPersonAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import MissingPersonsList from './MissingPersonsList';
import MissingPersonsForm from './MissingPersonsForm';

export const MissingPersonsPage: React.FC<{ initialView?: 'list' | 'form' }> = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();

  const isAddRoute = location.pathname.endsWith('/add');
  const isEditRoute = location.pathname.includes('/edit/');
  const view = isAddRoute || isEditRoute ? 'form' : 'list';

  const [persons, setPersons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const initialLoadDone = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [form, setForm] = useState({ name: '', age: '', gender: 'other', status: 'missing', lastSeenLocation: { lat: '', lng: '', address: '' }, lastSeenDate: '', contactPerson: '', contactPhone: '', countryCode: '+91', distinguishingFeatures: '', description: '' });

  // Filter & Search states
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [filterGender, setFilterGender] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { sortBy, sortOrder };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (filterGender !== 'all') params.gender = filterGender;
      if (filterStatus !== 'all') params.status = filterStatus;

      const r = await getMissingPersonsAPI(params);
      const list = r.data.persons || [];
      setPersons(list);

      if (isEditRoute && id) {
        const p = list.find((item: any) => item._id === id);
        if (p) {
          setEditing(p);
          setForm({
            name: p.name || '',
            age: p.age || '',
            gender: p.gender || 'other',
            status: p.status || 'missing',
            lastSeenLocation: p.lastSeenLocation || { lat: '', lng: '', address: '' },
            lastSeenDate: p.lastSeenDate ? new Date(p.lastSeenDate).toISOString().split('T')[0] : '',
            contactPerson: p.contactPerson || '',
            contactPhone: p.contactPhone || '',
            countryCode: p.countryCode || '+91',
            distinguishingFeatures: p.distinguishingFeatures || '',
            description: p.description || '',
          });
        }
      } else if (isAddRoute) {
        setEditing(null);
        setForm({ name: '', age: '', gender: 'other', status: 'missing', lastSeenLocation: { lat: '', lng: '', address: '' }, lastSeenDate: '', contactPerson: '', contactPhone: '', countryCode: '+91', distinguishingFeatures: '', description: '' });
      } else {
        setEditing(null);
      }
    } catch {}
    setLoading(false);
    initialLoadDone.current = true;
  }, [id, isAddRoute, isEditRoute, debouncedSearch, filterGender, filterStatus, sortBy, sortOrder]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleResetFilters = () => {
    setSearch('');
    setFilterGender('all');
    setFilterStatus('all');
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(persons.length / itemsPerPage);

  const openCreate = () => {
    navigate('/missing-persons/add');
  };

  const openEdit = (p: any) => {
    navigate(`/missing-persons/edit/${p._id}`);
  };

  const closeForm = () => {
    navigate('/missing-persons', { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        age: form.age ? Number(form.age) : undefined,
        lastSeenLocation: form.lastSeenLocation.address ? {
          ...form.lastSeenLocation,
          lat: form.lastSeenLocation.lat ? Number(form.lastSeenLocation.lat) : 0,
          lng: form.lastSeenLocation.lng ? Number(form.lastSeenLocation.lng) : 0
        } : undefined
      };
      const editId = id || editing?._id;
      if (editId) {
        await updateMissingPersonAPI(editId, payload);
        addNotification({ category: 'missing-person', action: 'edit', title: '✏️ Missing Person Record Updated', description: `Record for "${form.name || 'Unknown'}" updated. Status: ${form.status?.toUpperCase() || 'MISSING'}.`, performedBy: user?.name || 'Administrator' });
        toast.success('Record updated!');
      } else {
        await createMissingPersonAPI(payload);
        addNotification({ category: 'missing-person', action: 'add', title: '🔍 Missing Person Report Filed', description: `"${form.name || 'Unknown'}" reported missing. Age: ${form.age || 'N/A'}, Gender: ${form.gender || 'N/A'}.`, performedBy: user?.name || 'Administrator' });
        toast.success('Missing person report filed!');
      }
      navigate('/missing-persons', { replace: true });
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
      await deleteMissingPersonAPI(deleteTarget.id);
      addNotification({ category: 'missing-person', action: 'delete', title: '🗑️ Missing Person Record Removed', description: `Missing person record "${deleteTarget.name || ''}" has been removed from the registry.`, performedBy: user?.name || 'Administrator' });
      setPersons(prev => prev.filter(p => p._id !== deleteTarget.id));
      toast.success('Record deleted!');
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete record');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (view === 'form') {
    return (
      <MissingPersonsForm
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
    <MissingPersonsList
      persons={persons}
      loading={loading}
      initialLoading={!initialLoadDone.current && loading}
      userRole={user?.role}
      currentPage={currentPage}
      itemsPerPage={itemsPerPage}
      totalPages={totalPages}
      search={search}
      onSearchChange={val => { setSearch(val); setCurrentPage(1); }}
      filterGender={filterGender}
      onFilterGenderChange={val => { setFilterGender(val); setCurrentPage(1); }}
      filterStatus={filterStatus}
      onFilterStatusChange={val => { setFilterStatus(val); setCurrentPage(1); }}
      sortBy={sortBy}
      onSortByChange={val => { setSortBy(val); setCurrentPage(1); }}
      sortOrder={sortOrder}
      onSortOrderChange={val => { setSortOrder(val); setCurrentPage(1); }}
      onResetFilters={handleResetFilters}
      onPageChange={(page) => setCurrentPage(page)}
      onItemsPerPageChange={(size) => {
        setItemsPerPage(size);
        setCurrentPage(1);
      }}
      onOpenCreate={openCreate}
      onOpenEdit={openEdit}
      onDeleteRequest={(target) => setDeleteTarget(target)}
      deleteTarget={deleteTarget}
      deleteLoading={deleteLoading}
      onConfirmDelete={confirmDelete}
      onCloseDeleteModal={() => setDeleteTarget(null)}
    />
  );
};

export default MissingPersonsPage;
