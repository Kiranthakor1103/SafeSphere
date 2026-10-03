import React, { useState, useEffect, useCallback } from 'react';
import { getSOSAlertsAPI, dispatchTeamAPI } from '../services/api';
import { Radio, Send, MapPin, Users, Phone, X, AlertTriangle, Loader2 } from 'lucide-react';
import { CustomButton } from './ui';
import toast from 'react-hot-toast';

interface DispatchSOSModalProps {
  isOpen: boolean;
  team: any | null;
  onClose: () => void;
  onDispatchSuccess: () => void;
}

export const DispatchSOSModal: React.FC<DispatchSOSModalProps> = ({
  isOpen,
  team,
  onClose,
  onDispatchSuccess,
}) => {
  const [sosAlerts, setSosAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);

  const fetchPendingSOS = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSOSAlertsAPI({ status: 'pending' });
      setSosAlerts(res.data.alerts || []);
    } catch (err) {
      toast.error('Failed to load pending SOS alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && team) {
      fetchPendingSOS();
    }
  }, [isOpen, team, fetchPendingSOS]);

  if (!isOpen || !team) return null;

  const handleDispatch = async (sosId: string, alertMessage: string) => {
    setDispatchingId(sosId);
    try {
      await dispatchTeamAPI(sosId, team._id);
      toast.success(`Rescue team "${team.name}" dispatched to SOS alert!`);
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
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', width: '100%', maxWidth: '540px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)' }}>
        
        {/* Modal Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '8px', borderRadius: '10px' }}>
              <Send size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Dispatch Unit: {team.name}</h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Vehicle: {team.vehicleType || 'Unit'} · Members: {team.membersCount || team.capacity || 1}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* SOS List Header */}
        <div style={{ padding: '12px 20px', background: 'rgba(59,130,246,0.08)', borderBottom: '1px solid var(--border-color)', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Select a pending SOS distress alert to deploy this rescue unit:
        </div>

        {/* Pending SOS Alerts List */}
        <div style={{ padding: '16px 20px', maxHeight: '340px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '30px', textAlign: 'center' }}>
              <Loader2 size={24} className="spinner-icon mb-2" style={{ color: 'var(--accent-blue)' }} />
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading active SOS distress signals...</div>
            </div>
          ) : sosAlerts.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No pending SOS distress alerts available right now.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {sosAlerts.map((sos) => (
                <div 
                  key={sos._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Radio size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{sos.type?.toUpperCase()} Emergency</span>
                        <span className={`badge badge-${sos.priority === 'critical' ? 'red' : sos.priority === 'high' ? 'orange' : 'yellow'}`} style={{ fontSize: 10 }}>
                          {sos.priority}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 2 }}>
                        {sos.message?.slice(0, 45)}...
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', gap: 10, marginTop: 2 }}>
                        <span><MapPin size={11} style={{ display: 'inline', marginRight: 2 }} /> {sos.location?.address || 'Field Location'}</span>
                        <span><Users size={11} style={{ display: 'inline', marginRight: 2 }} /> {sos.numberOfPeople || 1} people</span>
                      </div>
                    </div>
                  </div>

                  <CustomButton
                    variant="danger"
                    size="sm"
                    disabled={dispatchingId === sos._id}
                    onClick={() => handleDispatch(sos._id, sos.message)}
                    style={{ gap: 6, flexShrink: 0 }}
                  >
                    {dispatchingId === sos._id ? <Loader2 size={13} className="spinner-icon" /> : <Send size={13} />}
                    Dispatch Here
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

export default DispatchSOSModal;
