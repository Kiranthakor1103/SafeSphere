import React, { useEffect, useState } from 'react';
import { Pencil, Search, ShieldCheck, Trash2, UserCog } from 'lucide-react';
import toast from 'react-hot-toast';
import { DeleteConfirmModal, CustomButton, Loader, Pagination } from '../components/ui';
import { deleteUserAPI, getUsersAPI, updateUserAPI } from '../services/api';
import { formatRoleLabel } from '../config/permissions';
import { useNotifications } from '../context/NotificationContext';
import type { UserDTO } from '../types/api';

const assignableRoles = ['district_admin', 'shelter_manager', 'rescue_team', 'volunteer', 'citizen', 'ngo'];

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [editing, setEditing] = useState<UserDTO | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<UserDTO | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { addNotification } = useNotifications();

  const loadUsers = async (page = currentPage) => {
    setLoading(true);
    try {
      const { data } = await getUsersAPI({ page, limit: itemsPerPage, search: search || undefined });
      setUsers((data.users || []).filter((user: UserDTO) => !['super_admin', 'admin'].includes(user.role)));
      setTotalUsers(data.total || 0);
    } catch (error: any) { toast.error(error.response?.data?.message || 'Unable to load users.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadUsers(); }, [currentPage, itemsPerPage]);

  const handleSearch = () => {
    if (currentPage === 1) loadUsers(1);
    else setCurrentPage(1);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing || !editing._id) return;
    setSaving(true);
    try {
      await updateUserAPI(editing._id, { name: editing.name, phone: editing.phone || '', country: editing.country || '', state: editing.state || '', district: editing.district || '', role: editing.role, isActive: editing.isActive });
      addNotification({ category: 'user', action: 'edit', title: '✏️ User Account Updated', description: `User account for ${editing.name || editing.email} was updated.`, performedBy: 'Super Admin' });
      toast.success('User updated successfully.'); setEditing(null); loadUsers();
    } catch (error: any) { toast.error(error.response?.data?.message || 'Unable to update user.'); }
    finally { setSaving(false); }
  };
  const handleDelete = async () => {
    if (!deleting?._id) return;
    setDeleteLoading(true);
    try { await deleteUserAPI(deleting._id); addNotification({ category: 'user', action: 'delete', title: '🗑️ User Account Deleted', description: `User account for ${deleting.name || deleting.email} was deleted.`, performedBy: 'Super Admin' }); toast.success('User deleted successfully.'); setDeleting(null); loadUsers(); }
    catch (error: any) { toast.error(error.response?.data?.message || 'Unable to delete user.'); }
    finally { setDeleteLoading(false); }
  };

  return <div className="page">
    <div className="page-header"><div><h1 className="page-title"><UserCog size={22} style={{ display: 'inline', marginRight: 8, color: '#a855f7' }} />Users</h1><div className="page-subtitle">Manage non–Super Admin accounts, their roles, access, and districts.</div></div></div>
    <div className="filter-card" style={{ display: 'flex', gap: 10 }}><div style={{ position: 'relative', flex: 1 }}><Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} /><input className="form-input" style={{ paddingLeft: 36 }} placeholder="Search name, email, or district..." value={search} onChange={event => setSearch(event.target.value)} onKeyDown={event => event.key === 'Enter' && handleSearch()} /></div><CustomButton variant="secondary" onClick={handleSearch}>Search</CustomButton></div>
    <div className="table-container"><div className="table-wrapper"><table className="table"><thead><tr><th>User</th><th>Role</th><th>District</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead><tbody>
      {loading ? <tr><td colSpan={5} style={{ padding: 0 }}><Loader variant="page" text="Loading users..." /></td></tr> : users.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No manageable users found.</td></tr> : users.map(user => <tr key={user._id || user.id}><td><div style={{ fontWeight: 700 }}>{user.name}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user.email}</div></td><td><span className="badge badge-purple">{formatRoleLabel(user.role)}</span></td><td>{[user.district, user.state].filter(Boolean).join(', ') || '—'}</td><td><span className={`badge badge-${user.isActive === false ? 'red' : 'green'}`}>{user.isActive === false ? 'Disabled' : 'Active'}</span></td><td style={{ textAlign: 'right' }}><div style={{ display: 'inline-flex', gap: 8 }}><CustomButton size="sm" variant="secondary" icon={<Pencil size={13} />} onClick={() => setEditing({ ...user })}>Edit</CustomButton><CustomButton size="sm" variant="danger" icon={<Trash2 size={13} />} onClick={() => setDeleting(user)}>Delete</CustomButton></div></td></tr>)}
    </tbody></table></div></div>
    <Pagination currentPage={currentPage} totalPages={Math.max(1, Math.ceil(totalUsers / itemsPerPage))} totalItems={totalUsers} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} onItemsPerPageChange={(size) => { setItemsPerPage(size); setCurrentPage(1); }} />
    {editing && <div className="modal-overlay" role="dialog" aria-modal="true"><form className="modal" onSubmit={handleSave} style={{ maxWidth: 620 }}><div className="modal-header"><div><h2 className="modal-title"><ShieldCheck size={20} /> Manage User</h2><p className="modal-subtitle">Super Admin role is intentionally unavailable.</p></div></div><div className="modal-body"><div className="form-grid">
      <div className="form-group"><label className="form-label">Name</label><input required className="form-input" value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} /></div><div className="form-group"><label className="form-label">Email</label><input disabled className="form-input" value={editing.email} /></div>
      <div className="form-group"><label className="form-label">Role</label><select className="form-input" value={editing.role} onChange={e => setEditing({ ...editing, role: e.target.value })}>{assignableRoles.map(role => <option key={role} value={role}>{formatRoleLabel(role)}</option>)}</select></div><div className="form-group"><label className="form-label">Account status</label><select className="form-input" value={String(editing.isActive !== false)} onChange={e => setEditing({ ...editing, isActive: e.target.value === 'true' })}><option value="true">Active</option><option value="false">Disabled</option></select></div>
      <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={editing.phone || ''} onChange={e => setEditing({ ...editing, phone: e.target.value })} /></div><div className="form-group"><label className="form-label">District</label><input className="form-input" value={editing.district || ''} onChange={e => setEditing({ ...editing, district: e.target.value })} /></div>
      <div className="form-group"><label className="form-label">State</label><input className="form-input" value={editing.state || ''} onChange={e => setEditing({ ...editing, state: e.target.value })} /></div><div className="form-group"><label className="form-label">Country</label><input className="form-input" value={editing.country || ''} onChange={e => setEditing({ ...editing, country: e.target.value })} /></div>
    </div></div><div className="modal-footer"><CustomButton type="button" variant="secondary" onClick={() => setEditing(null)}>Cancel</CustomButton><CustomButton type="submit" loading={saving}>Save changes</CustomButton></div></form></div>}
    <DeleteConfirmModal isOpen={!!deleting} title="Delete user" message={`Delete ${deleting?.name || 'this user'}? This action cannot be undone.`} onConfirm={handleDelete} onClose={() => setDeleting(null)} loading={deleteLoading} />
  </div>;
};
export default UsersPage;
