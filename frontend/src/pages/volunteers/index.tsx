import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { getVolunteersAPI, createVolunteerAPI, updateVolunteerAPI, deleteVolunteerAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import VolunteersList from './VolunteersList';
import VolunteersForm from './VolunteersForm';

export const VolunteersPage: React.FC<{ initialView?: 'list' | 'form' }> = () => {
  const { user, refreshUser } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();

  const isAddRoute = location.pathname.endsWith('/add');
  const isEditRoute = location.pathname.includes('/edit/');
  const view = isAddRoute || isEditRoute ? 'form' : 'list';

  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [form, setForm] = useState({ skills: [] as string[], isAvailable: true, experience: '' });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchData = async () => {
    setLoading(true);
    try {
      const r = await getVolunteersAPI();
      const list = r.data.volunteers || [];
      setVolunteers(list);

      if (isEditRoute && id) {
        const v = list.find((item: any) => item._id === id);
        if (v) {
          setEditing(v);
          setForm({ skills: v.skills || [], isAvailable: v.isAvailable !== false, experience: v.experience || '' });
        }
      } else if (isAddRoute) {
        setEditing(null);
        setForm({ skills: [], isAvailable: true, experience: '' });
      } else {
        setEditing(null);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id]);

  const totalPages = Math.ceil(volunteers.length / itemsPerPage);

  const toggleSkill = (skill: string) => {
    setForm(p => ({
      ...p,
      skills: p.skills.includes(skill) ? p.skills.filter(s => s !== skill) : [...p.skills, skill]
    }));
  };

  const openCreate = () => {
    navigate('/volunteers/add');
  };

  const openEdit = (v: any) => {
    navigate(`/volunteers/edit/${v._id}`);
  };

  const closeForm = () => {
    navigate('/volunteers', { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const editId = id || editing?._id;
      if (editId) {
        await updateVolunteerAPI(editId, form);
        addNotification({ category: 'volunteer', action: 'edit', title: '✏️ Volunteer Profile Updated', description: `Volunteer record updated. Availability: ${form.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}.`, performedBy: user?.name || 'Administrator' });
        toast.success('Volunteer updated!');
      } else {
        await createVolunteerAPI(form);
        addNotification({ category: 'volunteer', action: 'add', title: '🤝 New Volunteer Registered', description: `"${user?.name || 'Volunteer'}" has registered as a volunteer. Availability: ${form.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}.`, performedBy: user?.name || 'Administrator' });
        toast.success('Registered as volunteer!');
      }
      await refreshUser();
      navigate('/volunteers', { replace: true });
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
      await deleteVolunteerAPI(deleteTarget.id);
      addNotification({ category: 'volunteer', action: 'delete', title: '🗑️ Volunteer Removed', description: 'A volunteer has been removed from the active roster.', performedBy: user?.name || 'Administrator' });
      setVolunteers(prev => prev.filter(v => v._id !== deleteTarget.id));
      toast.success('Volunteer deleted!');
      setDeleteTarget(null);
      await refreshUser();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete volunteer');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (view === 'form') {
    return (
      <VolunteersForm
        editing={id || editing}
        form={form}
        setForm={setForm}
        toggleSkill={toggleSkill}
        onSubmit={handleSubmit}
        onCancel={closeForm}
        submitting={submitting}
        loading={loading}
      />
    );
  }

  return (
    <VolunteersList
      volunteers={volunteers}
      loading={loading}
      userRole={user?.role}
      currentPage={currentPage}
      itemsPerPage={itemsPerPage}
      totalPages={totalPages}
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

export default VolunteersPage;
