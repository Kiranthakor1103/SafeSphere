import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L, { type LatLngLiteral } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  getSOSAlertsAPI, getSheltersAPI, getRescueTeamsAPI, getDisastersAPI 
} from '../services/api';
import { useSocket } from '../context/SocketContext';
import { 
  AlertTriangle, Home, Shield, Flame, Layers, RefreshCw, Radio, Phone, Users, MapPin, Send
} from 'lucide-react';
import { CustomButton, Loader } from './ui';

const DEFAULT_CENTER: LatLngLiteral = { lat: 19.0760, lng: 72.8777 }; // Default: Mumbai center

// Custom Leaflet Icons using DivIcon & SVG
const createMarkerIcon = (color: string, iconType: 'sos' | 'shelter' | 'team' | 'disaster') => {
  let svgContent = '';
  if (iconType === 'sos') {
    svgContent = `<path d="M12 2L2 22h20L12 2zm0 14v2.01M12 9v5" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`;
  } else if (iconType === 'shelter') {
    svgContent = `<path d="M3 21h18M3 10l9-7 9 7v11H3V10z" stroke="#fff" stroke-width="2" fill="none"/>`;
  } else if (iconType === 'team') {
    svgContent = `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#fff" stroke-width="2" fill="none"/>`;
  } else {
    svgContent = `<circle cx="12" cy="12" r="8" fill="#fff"/>`;
  }

  return L.divIcon({
    className: 'custom-emergency-pin',
    html: `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background-color: ${color}; opacity: 0.25; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: relative; width: 28px; height: 28px; border-radius: 50%; background-color: ${color}; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2px solid #ffffff;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">${svgContent}</svg>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

const sosIcon = createMarkerIcon('#ef4444', 'sos');
const shelterIcon = createMarkerIcon('#10b981', 'shelter');
const teamIcon = createMarkerIcon('#3b82f6', 'team');
const disasterIcon = createMarkerIcon('#f59e0b', 'disaster');

// Auto-resizes Leaflet map when rendered inside tabs
const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

interface EmergencyMapProps {
  onDispatchTeam?: (sosAlert: any) => void;
  height?: string;
}

export const EmergencyMap: React.FC<EmergencyMapProps> = ({ onDispatchTeam, height = '500px' }) => {
  const { socket } = useSocket();

  const [sosList, setSosList] = useState<any[]>([]);
  const [shelterList, setShelterList] = useState<any[]>([]);
  const [teamList, setTeamList] = useState<any[]>([]);
  const [disasterList, setDisasterList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Layer Visibility Controls
  const [showSOS, setShowSOS] = useState(true);
  const [showShelters, setShowShelters] = useState(true);
  const [showTeams, setShowTeams] = useState(true);
  const [showDisasters, setShowDisasters] = useState(true);

  const fetchMapData = useCallback(async () => {
    setLoading(true);
    try {
      const [sosRes, shelterRes, teamRes, disasterRes] = await Promise.all([
        getSOSAlertsAPI({ limit: 100 }),
        getSheltersAPI({ limit: 100 }),
        getRescueTeamsAPI({ limit: 100 }),
        getDisastersAPI({ limit: 50 }),
      ]);

      setSosList(sosRes.data.alerts || []);
      setShelterList(shelterRes.data.shelters || []);
      setTeamList(teamRes.data.teams || []);
      setDisasterList(disasterRes.data.disasters || []);
    } catch (err) {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMapData();
  }, [fetchMapData]);

  // Real-time Socket.IO live marker updates
  useEffect(() => {
    if (!socket) return;

    const handleRefresh = () => {
      fetchMapData();
    };

    socket.on('sos:created', handleRefresh);
    socket.on('sos:updated', handleRefresh);
    socket.on('sos:deleted', handleRefresh);
    socket.on('disaster:created', handleRefresh);
    socket.on('disaster:updated', handleRefresh);
    socket.on('stats:updated', handleRefresh);

    return () => {
      socket.off('sos:created', handleRefresh);
      socket.off('sos:updated', handleRefresh);
      socket.off('sos:deleted', handleRefresh);
      socket.off('disaster:created', handleRefresh);
      socket.off('disaster:updated', handleRefresh);
      socket.off('stats:updated', handleRefresh);
    };
  }, [socket, fetchMapData]);

  // Calculate center from active assets if available
  const mapCenter = useMemo(() => {
    const validSos = sosList.find(s => s.location?.lat && s.location?.lng);
    if (validSos) {
      return { lat: Number(validSos.location.lat), lng: Number(validSos.location.lng) };
    }
    const validShelter = shelterList.find(s => s.location?.lat && s.location?.lng);
    if (validShelter) {
      return { lat: Number(validShelter.location.lat), lng: Number(validShelter.location.lng) };
    }
    return DEFAULT_CENTER;
  }, [sosList, shelterList]);

  return (
    <div style={{ position: 'relative', width: '100%', height, borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)' }}>
      {/* Top Map Layer Control Toolbar */}
      <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 1000, display: 'flex', gap: 8, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', padding: '6px 12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '12px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginRight: 6, fontWeight: 600 }}>
          <Radio size={14} style={{ color: '#10b981', animation: 'pulse 1.5s infinite' }} />
          <span>Live Operations GIS</span>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
          <input type="checkbox" checked={showSOS} onChange={e => setShowSOS(e.target.checked)} />
          <span style={{ color: '#ef4444' }}>SOS ({sosList.length})</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
          <input type="checkbox" checked={showShelters} onChange={e => setShowShelters(e.target.checked)} />
          <span style={{ color: '#10b981' }}>Shelters ({shelterList.length})</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
          <input type="checkbox" checked={showTeams} onChange={e => setShowTeams(e.target.checked)} />
          <span style={{ color: '#3b82f6' }}>Teams ({teamList.length})</span>
        </label>

        <button 
          onClick={() => fetchMapData()} 
          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', marginLeft: 6 }}
          title="Refresh Live GIS Layers"
        >
          <RefreshCw size={13} className={loading ? 'spinner-icon' : ''} />
        </button>
      </div>

      <MapContainer center={mapCenter} zoom={11} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
        <MapResizer />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap &copy; CARTO SafeSphere Live GIS"
        />

        {/* Render Active Disasters */}
        {showDisasters && disasterList.map(disaster => {
          if (!disaster.location?.lat || !disaster.location?.lng) return null;
          const pos: LatLngLiteral = { lat: Number(disaster.location.lat), lng: Number(disaster.location.lng) };
          const radiusMeters = (disaster.affectedRadiusKm || 10) * 1000;

          return (
            <React.Fragment key={`disaster-${disaster._id}`}>
              <Circle center={pos} radius={radiusMeters} pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.15, weight: 2 }} />
              <Marker position={pos} icon={disasterIcon}>
                <Popup>
                  <div style={{ minWidth: '180px' }}>
                    <h4 style={{ margin: '0 0 4px 0', color: '#f59e0b', fontSize: '14px' }}>🔥 {disaster.title}</h4>
                    <p style={{ margin: '0 0 4px 0', fontSize: '12px' }}>Type: <strong>{disaster.type}</strong></p>
                    <p style={{ margin: '0', fontSize: '12px' }}>Severity: <span className="badge badge-yellow">{disaster.severity}</span></p>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}

        {/* Render SOS Emergency Alert Markers */}
        {showSOS && sosList.map(sos => {
          if (!sos.location?.lat || !sos.location?.lng) return null;
          const pos: LatLngLiteral = { lat: Number(sos.location.lat), lng: Number(sos.location.lng) };
          return (
            <Marker key={`sos-${sos._id}`} position={pos} icon={sosIcon}>
              <Popup>
                <div style={{ minWidth: '220px', padding: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AlertTriangle size={14} /> SOS ALERT
                    </span>
                    <span className="badge badge-red">{sos.priority?.toUpperCase()}</span>
                  </div>
                  <p style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: 600 }}>{sos.message}</p>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: 8 }}>
                    <div><strong>Type:</strong> {sos.type}</div>
                    <div><strong>People:</strong> {sos.numberOfPeople || 1} Person(s)</div>
                    <div><strong>Phone:</strong> {sos.contactPhone}</div>
                  </div>
                  {onDispatchTeam && sos.status === 'pending' && (
                    <CustomButton 
                      variant="danger" 
                      size="sm" 
                      style={{ width: '100%', gap: 6, fontSize: '12px' }}
                      onClick={() => onDispatchTeam(sos)}
                    >
                      <Send size={12} /> Dispatch Rescue Team
                    </CustomButton>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Render Emergency Shelters */}
        {showShelters && shelterList.map(shelter => {
          if (!shelter.location?.lat || !shelter.location?.lng) return null;
          const pos: LatLngLiteral = { lat: Number(shelter.location.lat), lng: Number(shelter.location.lng) };
          return (
            <Marker key={`shelter-${shelter._id}`} position={pos} icon={shelterIcon}>
              <Popup>
                <div style={{ minWidth: '200px' }}>
                  <h4 style={{ margin: '0 0 4px 0', color: '#10b981', fontSize: '14px' }}>🏠 {shelter.name}</h4>
                  <div style={{ fontSize: '12px', marginBottom: 4 }}>
                    Occupancy: <strong>{shelter.currentOccupancy || 0} / {shelter.capacity}</strong>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {shelter.contactPhone && <div><Phone size={11} style={{ display: 'inline', marginRight: 2 }} /> {shelter.contactPhone}</div>}
                    <div>Status: <span className="badge badge-green">{shelter.status}</span></div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Render Rescue Teams */}
        {showTeams && teamList.map(team => {
          if (!team.location?.lat || !team.location?.lng) return null;
          const pos: LatLngLiteral = { lat: Number(team.location.lat), lng: Number(team.location.lng) };
          return (
            <Marker key={`team-${team._id}`} position={pos} icon={teamIcon}>
              <Popup>
                <div style={{ minWidth: '180px' }}>
                  <h4 style={{ margin: '0 0 4px 0', color: '#3b82f6', fontSize: '14px' }}>🛡️ {team.name}</h4>
                  <div style={{ fontSize: '12px' }}>
                    <div>Vehicle: <strong>{team.vehicleType || 'Unit'}</strong></div>
                    <div>Status: <span className={`badge ${team.status === 'available' ? 'badge-green' : 'badge-yellow'}`}>{team.status}</span></div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default EmergencyMap;
