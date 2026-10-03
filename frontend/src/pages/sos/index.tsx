import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { useNavigate, useLocation } from 'react-router-dom';
import { getSOSAlertsAPI, createSOSAlertAPI, updateSOSAlertAPI, deleteSOSAlertAPI } from '../../services/api';
import { queueOfflineSOS } from '../../services/offlineStore';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useSocket } from '../../context/SocketContext';
import SOSList from './SOSList';
import SOSForm from './SOSForm';
import DispatchModal from '../../components/DispatchModal';
import AITriageModal from '../../components/AITriageModal';

export const SOSPage: React.FC<{ initialView?: 'list' | 'form' }> = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const isAddRoute = location.pathname.endsWith('/add');
  const view = isAddRoute ? 'form' : 'list';

  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const initialLoadDone = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [editStatus, setEditStatus] = useState<{ id: string; status: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [dispatchTarget, setDispatchTarget] = useState<any | null>(null);
  const [triageTarget, setTriageTarget] = useState<any | null>(null);
  const [form, setForm] = useState({
    type: 'rescue',
    priority: 'high',
    message: '',
    country: 'Select Country',
    state: 'Select State',
    district: 'Select District / Region',
    location: { lat: '', lng: '', address: '' },
    contactPhone: '',
    countryCode: '+91',
    numberOfPeople: 1
  });

  // Filter & Search states
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [filterPriority, setFilterPriority] = useState('all');
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
      if (filterPriority !== 'all') params.priority = filterPriority;
      if (filterStatus !== 'all') params.status = filterStatus;

      const r = await getSOSAlertsAPI(params);
      setAlerts(r.data.alerts || []);
    } catch {}
    setLoading(false);
    initialLoadDone.current = true;
  }, [debouncedSearch, filterPriority, filterStatus, sortBy, sortOrder]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!socket) return;
    const handleSocketEvent = () => {
      fetchData();
    };
    socket.on('sos:created', handleSocketEvent);
    socket.on('sos:updated', handleSocketEvent);
    socket.on('sos:deleted', handleSocketEvent);

    return () => {
      socket.off('sos:created', handleSocketEvent);
      socket.off('sos:updated', handleSocketEvent);
      socket.off('sos:deleted', handleSocketEvent);
    };
  }, [socket, fetchData]);

  const handleResetFilters = () => {
    setSearch('');
    setFilterPriority('all');
    setFilterStatus('all');
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(alerts.length / itemsPerPage);

  const openCreate = () => {
    navigate('/sos/add');
  };

  const closeForm = () => {
    navigate('/sos', { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      ...form,
      numberOfPeople: Number(form.numberOfPeople) || 1,
      location: form.location.address ? {
        ...form.location,
        lat: form.location.lat ? Number(form.location.lat) : 0,
        lng: form.location.lng ? Number(form.location.lng) : 0
      } : undefined
    };

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      queueOfflineSOS(payload);
      toast.success('Offline Mode: Your SOS alert is saved locally and will auto-sync when connected!');
      setSubmitting(false);
      navigate('/sos', { replace: true });
      return;
    }

    try {
      await createSOSAlertAPI(payload);
      addNotification({ category: 'sos', action: 'add', title: `🚨 SOS Distress Broadcasted (${payload.type?.toUpperCase() || 'EMERGENCY'})`, description: `${payload.message || 'Help requested'} at ${payload.location?.address || 'Field Location'}. People count: ${payload.numberOfPeople || 1}.`, performedBy: user?.name || 'Citizen' });
      toast.success('SOS Alert broadcasted! Emergency teams notified.');
      navigate('/sos', { replace: true });
    } catch (err: any) { 
      if (!err.response) {
        queueOfflineSOS(payload);
        toast.success('Network Disconnected: SOS alert queued offline for auto-sync!');
        navigate('/sos', { replace: true });
      } else {
        toast.error(err.response?.data?.message || 'Error creating SOS alert'); 
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateSOSAlertAPI(id, { status });
      const alert = alerts.find(item => item._id === id);
      addNotification({ category: 'sos', action: 'edit', title: '📝 SOS Alert Updated', description: `SOS Alert for ${alert?.type?.toUpperCase() || 'Emergency'} updated to status: ${status.toUpperCase()}.`, performedBy: user?.name || 'Dispatcher' });
      setAlerts(prev => prev.map(a => a._id === id ? { ...a, status } : a));
      toast.success('Status updated!');
      setEditStatus(null);
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteSOSAlertAPI(deleteTarget.id);
      addNotification({ category: 'sos', action: 'delete', title: '🗑️ SOS Alert Resolved / Removed', description: `SOS Alert record ID ${deleteTarget.id.slice(-6)} was deleted/cleared.`, performedBy: user?.name || 'Administrator' });
      setAlerts(prev => prev.filter(a => a._id !== deleteTarget.id));
      toast.success('SOS Alert deleted!');
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete alert');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (view === 'form') {
    return (
      <SOSForm
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
    <>
      <SOSList
        alerts={alerts}
        loading={loading}
        initialLoading={!initialLoadDone.current && loading}
        userRole={user?.role}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        totalPages={totalPages}
        search={search}
        onSearchChange={val => { setSearch(val); setCurrentPage(1); }}
        filterPriority={filterPriority}
        onFilterPriorityChange={val => { setFilterPriority(val); setCurrentPage(1); }}
        filterStatus={filterStatus}
        onFilterStatusChange={val => { setFilterStatus(val); setCurrentPage(1); }}
        sortBy={sortBy}
        onSortByChange={val => { setSortBy(val); setCurrentPage(1); }}
        sortOrder={sortOrder}
        onSortOrderChange={val => { setSortOrder(val); setCurrentPage(1); }}
        onResetFilters={handleResetFilters}
        editStatus={editStatus}
        setEditStatus={setEditStatus}
        onStatusChange={handleStatusChange}
        onOpenDispatchModal={(alert) => setDispatchTarget(alert)}
        onOpenTriageModal={(alert) => setTriageTarget(alert)}
        onPageChange={(page) => setCurrentPage(page)}
        onItemsPerPageChange={(size) => {
          setItemsPerPage(size);
          setCurrentPage(1);
        }}
        onOpenCreate={openCreate}
        onDeleteRequest={(target) => setDeleteTarget(target)}
        deleteTarget={deleteTarget}
        deleteLoading={deleteLoading}
        onConfirmDelete={confirmDelete}
        onCloseDeleteModal={() => setDeleteTarget(null)}
      />

      <DispatchModal
        isOpen={!!dispatchTarget}
        sosAlert={dispatchTarget}
        onClose={() => setDispatchTarget(null)}
        onDispatchSuccess={fetchData}
      />

      <AITriageModal
        isOpen={!!triageTarget}
        sosAlert={triageTarget}
        onClose={() => setTriageTarget(null)}
      />
    </>
  );
};

export default SOSPage;
