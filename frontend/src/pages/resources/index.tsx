import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { getResourcesAPI, createResourceAPI, updateResourceAPI, deleteResourceAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import ResourcesList from './ResourcesList';
import ResourcesForm from './ResourcesForm';

export const ResourcesPage: React.FC<{ initialView?: 'list' | 'form' }> = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();

  const isAddRoute = location.pathname.endsWith('/add');
  const isEditRoute = location.pathname.includes('/edit/');
  const view = isAddRoute || isEditRoute ? 'form' : 'list';

  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const initialLoadDone = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'food', quantity: 0, unit: 'units', status: 'available', providedBy: '' });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter & Search & Sorting State
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        sortBy,
        sortOrder,
      };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (filterType !== 'all') params.type = filterType;
      if (filterStatus !== 'all') params.status = filterStatus;

      const r = await getResourcesAPI(params);
      const list = r.data.resources || [];
      setResources(list);

      if (isEditRoute && id) {
        const res = list.find((item: any) => item._id === id);
        if (res) {
          setEditItem(res);
          setForm({
            name: res.name,
            type: res.type,
            quantity: res.quantity,
            unit: res.unit || 'units',
            status: res.status || 'available',
            providedBy: res.providedBy || ''
          });
        }
      } else if (isAddRoute) {
        setEditItem(null);
        setForm({ name: '', type: 'food', quantity: 0, unit: 'units', status: 'available', providedBy: '' });
      } else {
        setEditItem(null);
      }
    } catch {}
    setLoading(false);
    initialLoadDone.current = true;
  }, [debouncedSearch, filterType, filterStatus, sortBy, sortOrder, id, isEditRoute, isAddRoute]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = Math.ceil(resources.length / itemsPerPage);

  const resetFilters = () => {
    setSearch('');
    setFilterType('all');
    setFilterStatus('all');
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const openCreate = () => {
    navigate('/resources/add');
  };

  const openEdit = (res: any) => {
    navigate(`/resources/edit/${res._id}`);
  };

  const closeForm = () => {
    navigate('/resources', { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, quantity: Number(form.quantity) };
      const editId = id || editItem?._id;
      if (editId) {
        await updateResourceAPI(editId, payload);
        addNotification({ category: 'resource', action: 'edit', title: '✏️ Resource Record Updated', description: `Resource "${form.name || ''}" updated. Status: ${form.status?.toUpperCase() || 'AVAILABLE'}.`, performedBy: user?.name || 'Administrator' });
        toast.success('Resource updated!');
      } else {
        await createResourceAPI(payload);
        addNotification({ category: 'resource', action: 'add', title: '📦 New Resource Added', description: `"${form.name || 'Resource'}" (${form.type?.toUpperCase() || 'SUPPLY'}) added. Quantity: ${form.quantity || 'N/A'}.`, performedBy: user?.name || 'Administrator' });
        toast.success('Resource created!');
      }
      navigate('/resources', { replace: true });
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
      await deleteResourceAPI(deleteTarget.id);
      addNotification({ category: 'resource', action: 'delete', title: '🗑️ Resource Removed', description: `Resource "${deleteTarget.name || ''}" removed from inventory.`, performedBy: user?.name || 'Administrator' });
      setResources(prev => prev.filter(r => r._id !== deleteTarget.id));
      toast.success('Resource deleted!');
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete resource');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (view === 'form') {
    return (
      <ResourcesForm
        editing={id || editItem}
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
    <ResourcesList
      resources={resources}
      loading={loading}
      initialLoading={!initialLoadDone.current && loading}
      userRole={user?.role}
      currentPage={currentPage}
      itemsPerPage={itemsPerPage}
      totalPages={totalPages}
      onPageChange={(page) => setCurrentPage(page)}
      onItemsPerPageChange={(size) => {
        setItemsPerPage(size);
        setCurrentPage(1);
      }}
      search={search}
      onSearchChange={(val) => { setSearch(val); setCurrentPage(1); }}
      filterType={filterType}
      onFilterTypeChange={(val) => { setFilterType(val); setCurrentPage(1); }}
      filterStatus={filterStatus}
      onFilterStatusChange={(val) => { setFilterStatus(val); setCurrentPage(1); }}
      sortBy={sortBy}
      onSortByChange={(val) => { setSortBy(val); setCurrentPage(1); }}
      sortOrder={sortOrder}
      onSortOrderChange={(val) => { setSortOrder(val); setCurrentPage(1); }}
      onResetFilters={resetFilters}
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

export default ResourcesPage;
