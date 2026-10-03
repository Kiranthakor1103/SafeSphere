import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, X, ShieldAlert, AlertTriangle, Users, MapPin, CheckCircle, Flame, HeartPulse, LifeBuoy, ArrowRight, Loader2 } from 'lucide-react';
import { triageSOSAPI, recommendShelterAPI } from '../services/api';
import toast from 'react-hot-toast';

interface AITriageModalProps {
  isOpen: boolean;
  sosAlert: any | null;
  onClose: () => void;
}

export const AITriageModal: React.FC<AITriageModalProps> = ({ isOpen, sosAlert, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [triage, setTriage] = useState<any | null>(null);
  const [shelterInfo, setShelterInfo] = useState<any | null>(null);

  useEffect(() => {
    if (isOpen && sosAlert) {
      fetchTriageAnalysis();
    } else {
      setTriage(null);
      setShelterInfo(null);
    }
  }, [isOpen, sosAlert]);

  const fetchTriageAnalysis = async () => {
    if (!sosAlert) return;
    setLoading(true);
    try {
      const [triageRes, shelterRes] = await Promise.all([
        triageSOSAPI(sosAlert),
        recommendShelterAPI({ district: sosAlert.district, state: sosAlert.state, numberOfPeople: sosAlert.numberOfPeople })
      ]);
      setTriage(triageRes.data.triage);
      if (shelterRes.data.recommendedShelter) {
        setShelterInfo(shelterRes.data.recommendedShelter);
      }
    } catch (err: any) {
      toast.error('Failed to generate AI Triage insights');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !sosAlert) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return { bg: '#ef4444', text: '#ffffff', border: '#b91c1c' };
      case 'high': return { bg: '#f97316', text: '#ffffff', border: '#c2410c' };
      case 'medium': return { bg: '#eab308', text: '#000000', border: '#a16207' };
      default: return { bg: '#3b82f6', text: '#ffffff', border: '#1d4ed8' };
    }
  };

  const priorityColors = getPriorityColor(triage?.priority || sosAlert.priority);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '16px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '620px',
        backgroundColor: '#0f172a',
        color: '#f8fafc',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(37, 99, 235, 0.5)'
            }}>
              <Bot size={24} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                AI Emergency Triage Insights
                <Sparkles size={16} color="#fbbf24" />
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                Automated Risk Scoring & Rescue Unit Recommendation
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <Loader2 size={36} color="#3b82f6" className="animate-spin" />
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#93c5fd' }}>Running AI Triage Analysis...</div>
              <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Evaluating hazard description, victim count & location risk parameters</div>
            </div>
          ) : triage ? (
            <>
              {/* Triage Overview Card */}
              <div style={{
                padding: '18px',
                borderRadius: '14px',
                backgroundColor: '#1e293b',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px'
              }}>
                <div>
                  <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', fontWeight: 600 }}>
                    Victim Incident Overview
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '4px', color: '#ffffff' }}>
                    {sosAlert.type?.toUpperCase()} SOS ALERT
                  </div>
                  <div style={{ fontSize: '0.84rem', color: '#cbd5e1', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Users size={14} color="#60a5fa" /> {sosAlert.numberOfPeople} Affected
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={14} color="#f472b6" /> {sosAlert.district}, {sosAlert.state}
                    </span>
                  </div>
                </div>

                {/* Score Badge */}
                <div style={{
                  padding: '12px 18px',
                  borderRadius: '12px',
                  backgroundColor: priorityColors.bg,
                  color: priorityColors.text,
                  textAlign: 'center',
                  minWidth: '100px',
                  boxShadow: `0 4px 14px ${priorityColors.bg}66`
                }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, lineHeight: 1 }}>
                    {triage.score}<span style={{ fontSize: '0.85rem' }}>/100</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', marginTop: '4px', letterSpacing: '0.5px' }}>
                    {triage.priority}
                  </div>
                </div>
              </div>

              {/* Triage Summary */}
              <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: 'rgba(37, 99, 235, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)', color: '#bfdbfe', fontSize: '0.9rem', lineHeight: '1.45' }}>
                💡 <strong>AI Summary</strong>: {triage.summary}
              </div>

              {/* Identified Hazards */}
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={16} color="#ef4444" /> Identified Hazards & Threats
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {triage.identifiedHazards?.map((hazard: string, i: number) => (
                    <span key={i} style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      color: '#fca5a5',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                    }}>
                      ⚠️ {hazard}
                    </span>
                  ))}
                </div>
              </div>

              {/* Recommended Dispatch Units */}
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <LifeBuoy size={16} color="#3b82f6" /> Recommended Response Units
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {triage.recommendedUnits?.map((unit: string, i: number) => (
                    <span key={i} style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(59, 130, 246, 0.15)',
                      color: '#93c5fd',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <CheckCircle size={14} color="#60a5fa" /> {unit}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actionable Rescue Steps */}
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '10px' }}>
                  📋 Tactical Emergency Action Steps
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {triage.immediateActions?.map((action: string, i: number) => (
                    <div key={i} style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      backgroundColor: '#1e293b',
                      fontSize: '0.85rem',
                      color: '#e2e8f0',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px'
                    }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: '#334155',
                        color: '#38bdf8',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '1px'
                      }}>
                        {i + 1}
                      </div>
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shelter Recommendation Match */}
              {shelterInfo && (
                <div style={{
                  padding: '14px 18px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#34d399', fontWeight: 700 }}>
                      Recommended Relief Shelter Match
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', marginTop: '2px' }}>
                      🏠 {shelterInfo.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                      Space Available: {shelterInfo.availableSpace} seats | Location: {shelterInfo.district || 'Nearby'}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>
              No triage information generated.
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          backgroundColor: '#1e293b',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.88rem'
            }}
          >
            Close Triage Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default AITriageModal;
