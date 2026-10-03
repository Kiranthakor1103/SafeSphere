import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { getDisastersAPI, createDisasterAPI, updateDisasterAPI, deleteDisasterAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import DisastersList from './DisastersList';
import DisastersForm from './DisastersForm';

export const DisastersPage: React.FC<{ initialView?: 'list' | 'form' }> = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();

  const isAddRoute = location.pathname.endsWith('/add');
  const isEditRoute = location.pathname.includes('/edit/');
  const view = isAddRoute || isEditRoute ? 'form' : 'list';

  const [disasters, setDisasters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const initialLoadDone = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'flood', severity: 'medium', status: 'active', description: '', location: { lat: '', lng: '', address: '' }, affectedCount: '' });

  // Filter & Search states
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [filterType, setFilterType] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        sortBy,
        sortOrder,
      };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (filterType !== 'all') params.type = filterType;
      if (filterSeverity !== 'all') params.severity = filterSeverity;
      if (filterStatus !== 'all') params.status = filterStatus;

      const r = await getDisastersAPI(params);
      const list = r.data.disasters || [];
      setDisasters(list);

      if (isEditRoute && id) {
        const itemToEdit = list.find((d: any) => d._id === id);
        if (itemToEdit) {
          setEditing(itemToEdit);
          setForm({
            title: itemToEdit.title || '',
            type: itemToEdit.type || 'flood',
            severity: itemToEdit.severity || 'medium',
            status: itemToEdit.status || 'active',
            description: itemToEdit.description || '',
            location: itemToEdit.location || { lat: '', lng: '', address: '' },
            affectedCount: itemToEdit.affectedCount || ''
          });
        }
      } else if (isAddRoute) {
        setEditing(null);
        setForm({ title: '', type: 'flood', severity: 'medium', status: 'active', description: '', location: { lat: '', lng: '', address: '' }, affectedCount: '' });
      } else {
        setEditing(null);
      }
    } catch (err) {}
    setLoading(false);
    initialLoadDone.current = true;
  }, [id, isAddRoute, isEditRoute, debouncedSearch, filterType, filterSeverity, filterStatus, sortBy, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleResetFilters = () => {
    setSearch('');
    setFilterType('all');
    setFilterSeverity('all');
    setFilterStatus('all');
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(disasters.length / itemsPerPage);

  const openCreate = () => {
    navigate('/disasters/add');
  };

  const openEdit = (d: any) => {
    navigate(`/disasters/edit/${d._id}`);
  };

  const closeForm = () => {
    navigate('/disasters', { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        affectedCount: form.affectedCount ? Number(form.affectedCount) : 0,
        location: form.location.address ? {
          ...form.location,
          lat: form.location.lat ? Number(form.location.lat) : 0,
          lng: form.location.lng ? Number(form.location.lng) : 0
        } : undefined
      };
      const editId = id || editing?._id;
      if (editId) {
        await updateDisasterAPI(editId, payload);
        addNotification({
          category: 'disaster',
          action: 'edit',
          title: `✏️ Disaster Information Updated`,
          description: `Disaster record "${form.title}" details modified. Status: ${form.status?.toUpperCase()}.`,
          performedBy: user?.name || 'Administrator',
        });
        toast.success('Disaster updated!');
      } else {
        await createDisasterAPI(payload);
        addNotification({
          category: 'disaster',
          action: 'add',
          title: `⚡ New Disaster Reported (${form.type?.toUpperCase() || 'DISASTER'})`,
          description: `"${form.title}" declared in ${form.location.address || 'Affected Zone'}. Severity: ${form.severity?.toUpperCase()}.`,
          performedBy: user?.name || 'Administrator',
        });
        toast.success('Incident logged!');
      }
      navigate('/disasters', { replace: true });
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
      await deleteDisasterAPI(deleteTarget.id);
      addNotification({
        category: 'disaster',
        action: 'delete',
        title: `🗑️ Disaster Record Removed`,
        description: `Disaster incident record "${deleteTarget.title || 'Disaster'}" was deleted from live situation overview.`,
        performedBy: user?.name || 'Administrator',
      });
      setDisasters(prev => prev.filter(d => d._id !== deleteTarget.id));
      toast.success('Disaster deleted!');
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete disaster');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (view === 'form') {
    return (
      <DisastersForm
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
    <DisastersList
      disasters={disasters}
      loading={loading}
      initialLoading={!initialLoadDone.current && loading}
      userRole={user?.role}
      currentPage={currentPage}
      itemsPerPage={itemsPerPage}
      totalPages={totalPages}
      search={search}
      onSearchChange={(val) => { setSearch(val); setCurrentPage(1); }}
      filterType={filterType}
      onFilterTypeChange={(val) => { setFilterType(val); setCurrentPage(1); }}
      filterSeverity={filterSeverity}
      onFilterSeverityChange={(val) => { setFilterSeverity(val); setCurrentPage(1); }}
      filterStatus={filterStatus}
      onFilterStatusChange={(val) => { setFilterStatus(val); setCurrentPage(1); }}
      sortBy={sortBy}
      onSortByChange={(val) => { setSortBy(val); setCurrentPage(1); }}
      sortOrder={sortOrder}
      onSortOrderChange={(val) => { setSortOrder(val); setCurrentPage(1); }}
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

export default DisastersPage;
