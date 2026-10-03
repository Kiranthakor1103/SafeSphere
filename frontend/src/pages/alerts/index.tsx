import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { getAlertsAPI, createAlertAPI, updateAlertAPI, deleteAlertAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import AlertsList from './AlertsList';
import AlertsForm from './AlertsForm';

export const AlertsPage: React.FC<{ initialView?: 'list' | 'form' }> = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();

  const isAddRoute = location.pathname.endsWith('/add');
  const isEditRoute = location.pathname.includes('/edit/');
  const view = isAddRoute || isEditRoute ? 'form' : 'list';

  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'warning',
    targetCountry: 'Select Country',
    targetState: 'Select State',
    targetDistrict: 'Select District / Region',
    sendSMS: false
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchData = async () => {
    setLoading(true);
    try {
      const r = await getAlertsAPI();
      const list = r.data.alerts || [];
      setAlerts(list);

      if (isEditRoute && id) {
        const a = list.find((item: any) => item._id === id);
        if (a) {
          setEditing(a);
          setForm({
            title: a.title,
            message: a.message,
            type: a.type,
            targetCountry: a.targetCountry || 'Select Country',
            targetState: a.targetState || 'Select State',
            targetDistrict: a.targetDistrict || 'Select District / Region',
            sendSMS: !!a.sendSMS
          });
        }
      } else if (isAddRoute) {
        setEditing(null);
        setForm({
          title: '',
          message: '',
          type: 'warning',
          targetCountry: 'Select Country',
          targetState: 'Select State',
          targetDistrict: 'Select District / Region',
          sendSMS: false
        });
      } else {
        setEditing(null);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id, location.pathname]);

  const totalPages = Math.ceil(alerts.length / itemsPerPage);

  const openCreate = () => {
    navigate('/alerts/add');
  };

  const openEdit = (a: any) => {
    navigate(`/alerts/edit/${a._id}`);
  };

  const closeForm = () => {
    navigate('/alerts', { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const editId = id || editing?._id;
      if (editId) {
        await updateAlertAPI(editId, form);
        toast.success('Alert updated!');
      } else {
        await createAlertAPI(form);
        toast.success('Alert broadcasted!');
      }
      navigate('/alerts', { replace: true });
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
      await deleteAlertAPI(deleteTarget.id);
      setAlerts(prev => prev.filter(a => a._id !== deleteTarget.id));
      toast.success('Alert deleted!');
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete alert');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (view === 'form') {
    return (
      <AlertsForm
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
    <AlertsList
      alerts={alerts}
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

export default AlertsPage;
