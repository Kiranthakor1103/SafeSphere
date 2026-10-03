import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { getRescueTeamsAPI, createRescueTeamAPI, updateRescueTeamAPI, deleteRescueTeamAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useSocket } from '../../context/SocketContext';
import RescueTeamsList from './RescueTeamsList';
import RescueTeamsForm from './RescueTeamsForm';
import DispatchSOSModal from '../../components/DispatchSOSModal';

export const RescueTeamsPage: React.FC<{ initialView?: 'list' | 'form' }> = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();

  const isAddRoute = location.pathname.endsWith('/add');
  const isEditRoute = location.pathname.includes('/edit/');
  const view = isAddRoute || isEditRoute ? 'form' : 'list';

  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const initialLoadDone = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [dispatchTargetTeam, setDispatchTargetTeam] = useState<any | null>(null);
  const [form, setForm] = useState({
    name: '',
    specialization: [] as string[],
    status: 'available',
    countryCode: '+91',
    contactPhone: '',
    vehicleType: '',
    capacity: 10,
    location: { address: '', lat: 0, lng: 0 }
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter & Search & Sorting State
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterVehicle, setFilterVehicle] = useState('all');
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
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterVehicle !== 'all') params.vehicleType = filterVehicle;

      const r = await getRescueTeamsAPI(params);
      const list = r.data.teams || [];
      setTeams(list);

      if (isEditRoute && id) {
        const team = list.find((item: any) => item._id === id);
        if (team) {
          setEditing(team);
          setForm({
            name: team.name || '',
            specialization: team.specialization || [],
            status: team.status || 'available',
            countryCode: team.countryCode || '+91',
            contactPhone: team.contactPhone || '',
            vehicleType: team.vehicleType || '',
            capacity: team.capacity || 10,
            location: team.location || { address: '', lat: 0, lng: 0 }
          });
        }
      } else if (isAddRoute) {
        setEditing(null);
        setForm({ name: '', specialization: [], status: 'available', countryCode: '+91', contactPhone: '', vehicleType: '', capacity: 10, location: { address: '', lat: 0, lng: 0 } });
      } else {
        setEditing(null);
      }
    } catch {}
    setLoading(false);
    initialLoadDone.current = true;
  }, [debouncedSearch, filterStatus, filterVehicle, sortBy, sortOrder, id, isEditRoute, isAddRoute]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!socket) return;
    const handleSocketEvent = () => {
      fetchData();
    };
    socket.on('team:created', handleSocketEvent);
    socket.on('team:updated', handleSocketEvent);
    socket.on('team:deleted', handleSocketEvent);
    socket.on('sos:updated', handleSocketEvent);

    return () => {
      socket.off('team:created', handleSocketEvent);
      socket.off('team:updated', handleSocketEvent);
      socket.off('team:deleted', handleSocketEvent);
      socket.off('sos:updated', handleSocketEvent);
    };
  }, [socket, fetchData]);

  const totalPages = Math.ceil(teams.length / itemsPerPage);

  const resetFilters = () => {
    setSearch('');
    setFilterStatus('all');
    setFilterVehicle('all');
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const toggleSpec = (spec: string) => {
    setForm(p => ({
      ...p,
      specialization: p.specialization.includes(spec)
        ? p.specialization.filter(s => s !== spec)
        : [...p.specialization, spec]
    }));
  };

  const openCreate = () => {
    navigate('/rescue-teams/add');
  };

  const openEdit = (team: any) => {
    navigate(`/rescue-teams/edit/${team._id}`);
  };

  const closeForm = () => {
    navigate('/rescue-teams', { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        capacity: Number(form.capacity),
        location: form.location.address ? {
          ...form.location,
          lat: Number(form.location.lat) || 0,
          lng: Number(form.location.lng) || 0,
        } : undefined
      };
      const editId = id || editing?._id;
      if (editId) {
        await updateRescueTeamAPI(editId, payload);
        addNotification({ category: 'team', action: 'edit', title: '✏️ Rescue Team Status Updated', description: `Team "${form.name}" profile or status updated to ${form.status?.toUpperCase()}.`, performedBy: user?.name || 'Administrator' });
        toast.success('Rescue team updated!');
      } else {
        await createRescueTeamAPI(payload);
        addNotification({ category: 'team', action: 'add', title: '🚒 Rescue Team Unit Assembled', description: `New team "${form.name}" added with vehicle (${form.vehicleType || 'Unit'}). Status: ${form.status?.toUpperCase()}.`, performedBy: user?.name || 'Administrator' });
        toast.success('Rescue team created!');
      }
      navigate('/rescue-teams', { replace: true });
    } catch (err: any) { 
      toast.error(err.response?.data?.message || 'Error saving team'); 
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await updateRescueTeamAPI(id, { status });
      const team = teams.find(item => item._id === id);
      addNotification({ category: 'team', action: 'edit', title: '✏️ Rescue Team Status Updated', description: `Team "${team?.name || 'Team'}" profile or status updated to ${status.toUpperCase()}.`, performedBy: user?.name || 'Administrator' });
      toast.success('Team status updated');
      fetchData();
    } catch (err: any) {
      toast.error('Failed to update status');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteRescueTeamAPI(deleteTarget.id);
      addNotification({ category: 'team', action: 'delete', title: '🗑️ Rescue Team Removed', description: `Rescue unit "${deleteTarget.name || 'Team'}" removed from active roster.`, performedBy: user?.name || 'Administrator' });
      setTeams(prev => prev.filter(t => t._id !== deleteTarget.id));
      toast.success('Rescue team deleted!');
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete team');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (view === 'form') {
    return (
      <RescueTeamsForm
        editing={id || editing}
        form={form}
        setForm={setForm}
        toggleSpec={toggleSpec}
        onSubmit={handleSubmit}
        onCancel={closeForm}
        submitting={submitting}
        loading={loading}
      />
    );
  }

  return (
    <>
      <RescueTeamsList
        teams={teams}
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
        filterStatus={filterStatus}
        onFilterStatusChange={(val) => { setFilterStatus(val); setCurrentPage(1); }}
        filterVehicle={filterVehicle}
        onFilterVehicleChange={(val) => { setFilterVehicle(val); setCurrentPage(1); }}
        sortBy={sortBy}
        onSortByChange={(val) => { setSortBy(val); setCurrentPage(1); }}
        sortOrder={sortOrder}
        onSortOrderChange={(val) => { setSortOrder(val); setCurrentPage(1); }}
        onResetFilters={resetFilters}
        onOpenCreate={openCreate}
        onOpenEdit={openEdit}
        onUpdateStatus={handleUpdateStatus}
        onOpenDispatchModal={(team) => setDispatchTargetTeam(team)}
        onDeleteRequest={(target) => setDeleteTarget(target)}
        deleteTarget={deleteTarget}
        deleteLoading={deleteLoading}
        onConfirmDelete={confirmDelete}
        onCloseDeleteModal={() => setDeleteTarget(null)}
      />

      <DispatchSOSModal
        isOpen={!!dispatchTargetTeam}
        team={dispatchTargetTeam}
        onClose={() => setDispatchTargetTeam(null)}
        onDispatchSuccess={fetchData}
      />
    </>
  );
};

export default RescueTeamsPage;
