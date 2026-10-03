import React, { useState, useEffect, useCallback } from 'react';
import { getNearestTeamsAPI, dispatchTeamAPI } from '../services/api';
import { Shield, Send, MapPin, Users, Phone, X, AlertTriangle, Loader2 } from 'lucide-react';
import { CustomButton } from './ui';
import toast from 'react-hot-toast';

interface DispatchModalProps {
  isOpen: boolean;
  sosAlert: any | null;
  onClose: () => void;
  onDispatchSuccess: () => void;
}

export const DispatchModal: React.FC<DispatchModalProps> = ({
  isOpen,
  sosAlert,
  onClose,
  onDispatchSuccess,
}) => {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);

  const fetchAvailableTeams = useCallback(async () => {
    if (!sosAlert?.location?.lat || !sosAlert?.location?.lng) return;
    setLoading(true);
    try {
      const lat = Number(sosAlert.location.lat);
      const lng = Number(sosAlert.location.lng);
      const res = await getNearestTeamsAPI(lat, lng, 50, 'available');
      setTeams(res.data.teams || []);
    } catch (err) {
      toast.error('Failed to load nearby rescue teams');
    } finally {
      setLoading(false);
    }
  }, [sosAlert]);

  useEffect(() => {
    if (isOpen && sosAlert) {
      fetchAvailableTeams();
    }
  }, [isOpen, sosAlert, fetchAvailableTeams]);

  if (!isOpen || !sosAlert) return null;

  const handleDispatch = async (teamId: string, teamName: string) => {
    setDispatchingId(teamId);
    try {
      await dispatchTeamAPI(sosAlert._id, teamId);
      toast.success(`Rescue team "${teamName}" dispatched!`);
      onDispatchSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to dispatch team');
    } finally {
      setDispatchingId(null);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', width: '100%', maxWidth: '520px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)' }}>
        
        {/* Modal Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '8px', borderRadius: '10px' }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Dispatch Rescue Team</h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Target SOS: {sosAlert.message?.slice(0, 35)}...
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* SOS Summary Card */}
        <div style={{ padding: '12px 20px', background: 'rgba(249,115,22,0.08)', borderBottom: '1px solid var(--border-color)', fontSize: '12px', display: 'flex', gap: 12, alignItems: 'center' }}>
          <MapPin size={16} style={{ color: '#f97316', flexShrink: 0 }} />
          <div>
            <strong>Location:</strong> {sosAlert.location?.address || `${sosAlert.location?.lat}, ${sosAlert.location?.lng}`}<br />
            <strong>Contact:</strong> {sosAlert.contactPhone || 'N/A'} · <strong>People:</strong> {sosAlert.numberOfPeople || 1}
          </div>
        </div>

        {/* Team List */}
        <div style={{ padding: '16px 20px', maxHeight: '340px', overflowY: 'auto' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Nearest Available Teams ({teams.length})
          </div>

          {loading ? (
            <div style={{ padding: '30px', textAlign: 'center' }}>
              <Loader2 size={24} className="spinner-icon mb-2" style={{ color: 'var(--accent-blue)' }} />
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Calculating spatial proximity...</div>
            </div>
          ) : teams.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No available rescue teams found within 50km radius.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {teams.map((team) => (
                <div 
                  key={team._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Shield size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{team.name}</span>
                        {team.distanceKm !== undefined && (
                          <span className="badge badge-blue" style={{ fontSize: 10, padding: '1px 6px' }}>
                            📍 {team.distanceKm} km
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: 10, marginTop: 2 }}>
                        <span><Users size={12} style={{ display: 'inline', marginRight: 2 }} /> {team.membersCount || 1} members</span>
                        <span><Phone size={12} style={{ display: 'inline', marginRight: 2 }} /> {team.contactPhone}</span>
                      </div>
                    </div>
                  </div>

                  <CustomButton
                    variant="primary"
                    size="sm"
                    disabled={dispatchingId === team._id}
                    onClick={() => handleDispatch(team._id, team.name)}
                    style={{ gap: 6 }}
                  >
                    {dispatchingId === team._id ? <Loader2 size={13} className="spinner-icon" /> : <Send size={13} />}
                    Dispatch
                  </CustomButton>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-color)', textAlign: 'right', background: 'var(--bg-primary)' }}>
          <CustomButton variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </CustomButton>
        </div>

      </div>
    </div>
  );
};

export default DispatchModal;
