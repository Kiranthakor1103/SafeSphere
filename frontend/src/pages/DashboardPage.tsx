import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStatsAPI, createVolunteerAPI, unregisterVolunteerAPI } from '../services/api';
import { Zap, Radio, Home, Users, UserCheck, Package, AlertTriangle, TrendingUp, HeartHandshake } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { can } from '../config/permissions';
import { Loader } from '../components/ui';
import EmergencyMap from '../components/EmergencyMap';
import DispatchModal from '../components/DispatchModal';
import NotificationBell from '../components/NotificationBell';
import toast from 'react-hot-toast';

const PIE_COLORS = ['#426dc4','#258da1','#7657b5','#178b72','#af8618','#bc7532','#c44b5a','#657d9f'];

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dispatchTarget, setDispatchTarget] = useState<any | null>(null);
  const { user, refreshUser } = useAuth();
  const { socket, isConnected } = useSocket();
  const [toggling, setToggling] = useState(false);

  const isVolunteer = user?.role === 'volunteer';
  const showToggle = user?.role === 'citizen' || user?.role === 'volunteer';

  const handleToggleVolunteer = async () => {
    if (toggling) return;
    setToggling(true);
    try {
      if (isVolunteer) {
        await unregisterVolunteerAPI();
        toast.success('Opted out of volunteering.');
      } else {
        await createVolunteerAPI({ skills: [], availability: 'available' });
        toast.success('Successfully registered as a volunteer!');
      }
      await refreshUser();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update volunteer status.');
    } finally {
      setToggling(false);
    }
  };

  const fetchDashboardStats = () => {
    getDashboardStatsAPI()
      .then(res => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchDashboardStats();
    };

    socket.on('stats:updated', handleUpdate);
    socket.on('sos:created', handleUpdate);
    socket.on('sos:updated', handleUpdate);
    socket.on('disaster:created', handleUpdate);
    socket.on('disaster:updated', handleUpdate);

    return () => {
      socket.off('stats:updated', handleUpdate);
      socket.off('sos:created', handleUpdate);
      socket.off('sos:updated', handleUpdate);
      socket.off('disaster:created', handleUpdate);
      socket.off('disaster:updated', handleUpdate);
    };
  }, [socket]);

  if (loading) return <Loader variant="page" text="Loading command dashboard..." subtext="Aggregating live situation analytics..." />;

  const s = stats?.stats;
  const statCards = s ? [
    { module: 'disasters' as const, label: 'Active Disasters', value: s.disasters.active, icon: Zap, color: '#ef4444', bg: 'rgba(239,68,68,0.15)', extra: `${s.disasters.critical} critical` },
    { module: 'sos' as const, label: 'Pending SOS', value: s.sos.pending, icon: Radio, color: '#f97316', bg: 'rgba(249,115,22,0.15)', extra: `${s.sos.resolved} resolved` },
    { module: 'shelters' as const, label: 'Open Shelters', value: s.shelters.open, icon: Home, color: '#22c55e', bg: 'rgba(34,197,94,0.15)', extra: `${s.shelters.total} total` },
    { module: 'missing-persons' as const, label: 'Missing Persons', value: s.missingPersons.missing, icon: AlertTriangle, color: '#eab308', bg: 'rgba(234,179,8,0.15)', extra: `${s.missingPersons.found} found` },
    { module: 'volunteers' as const, label: 'Volunteers Ready', value: s.volunteers.available, icon: Users, color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', extra: `${s.volunteers.total} registered` },
    { module: 'rescue-teams' as const, label: 'Teams Deployed', value: s.rescueTeams.deployed, icon: UserCheck, color: '#a855f7', bg: 'rgba(168,85,247,0.15)', extra: `${s.rescueTeams.total} total` },
    { module: 'resources' as const, label: 'Resources', value: s.resources.total, icon: Package, color: '#ec4899', bg: 'rgba(236,72,153,0.15)', extra: 'inventory items' },
  ].filter(card => can(user?.role, `${card.module}:view`)) : [];

  const disasterChartData = stats?.charts?.disastersByType?.map((d: any) => ({ name: d._id, count: d.count })) || [];
  const sosChartData = stats?.charts?.sosByPriority?.map((d: any) => ({ name: d._id, value: d.count })) || [];

  const getCardSpan = (index: number, total: number) => {
    if (total === 7) return index < 4 ? 'span 3' : 'span 4';
    if (total === 6) return 'span 4';
    if (total === 5) return index < 3 ? 'span 4' : 'span 6';
    if (total === 4) return 'span 3';
    if (total === 3) return 'span 4';
    if (total === 2) return 'span 6';
    return 'span 12';
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 Command Dashboard</h1>
          <div className="page-subtitle">Welcome back, {user?.name} · Live situation overview</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <NotificationBell />
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {showToggle && (
        <div className="volunteer-dashboard-banner animate-fade-in">
          <div className="volunteer-banner-content">
            <div className="volunteer-banner-icon-box">
              <HeartHandshake size={24} />
            </div>
            <div>
              <h3 className="volunteer-banner-title">
                {isVolunteer ? "🎉 You are a Registered Volunteer!" : "🙋‍♂️ Join the Disaster Response Team"}
              </h3>
              <p className="volunteer-banner-text">
                {isVolunteer 
                  ? "Thank you for volunteering! You can now view active disasters, receive team assignments, and manage your availability from the Volunteers menu."
                  : "Help your community during emergencies. Enable volunteer mode to register, receive notifications, and be assigned to relief efforts."
                }
              </p>
            </div>
          </div>
          <div className="volunteer-toggle-card" style={{ marginBottom: 0, minWidth: 200, background: 'var(--bg-card)' }}>
            <span className="volunteer-toggle-label">
              <HeartHandshake size={16} className="volunteer-toggle-icon" />
              Volunteer Mode
            </span>
            <label className="premium-switch" title={isVolunteer ? "Deactivate Volunteer Mode" : "Activate Volunteer Mode"}>
              <input 
                type="checkbox" 
                checked={isVolunteer} 
                onChange={handleToggleVolunteer} 
                disabled={toggling}
              />
              <span className="premium-switch-slider"></span>
            </label>
          </div>
        </div>
      )}

      <div className="dashboard-stats-grid mb-4">
        {statCards.map(({ label, value, icon: Icon, color, bg, extra }, index) => (
          <div 
            className="stat-card" 
            key={label}
            style={{ '--col-span': getCardSpan(index, statCards.length) } as React.CSSProperties}
          >
            <div className="stat-card-icon" style={{ background: bg }}>
              <Icon size={20} color={color} />
            </div>
            <div className="stat-card-value" style={{ color }}>{value ?? '—'}</div>
            <div className="stat-card-label">{label}</div>
            <div className="stat-card-sub">{extra}</div>
          </div>
        ))}
      </div>

      {/* Live Interactive GIS Emergency Map */}
      <div className="mb-4">
        <EmergencyMap height="420px" onDispatchTeam={(alert) => setDispatchTarget(alert)} />
      </div>

      <DispatchModal
        isOpen={!!dispatchTarget}
        sosAlert={dispatchTarget}
        onClose={() => setDispatchTarget(null)}
        onDispatchSuccess={fetchDashboardStats}
      />

      {(can(user?.role, 'disasters:view') || can(user?.role, 'sos:view')) && <div className="grid-2 mb-4">
        {can(user?.role, 'disasters:view') && <div className="card">
          <div className="flex items-center gap-2 mb-4" style={{ fontWeight: 600 }}>
            <TrendingUp size={18} color="var(--accent-blue)" />
            Disasters by Type
          </div>
          {disasterChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={disasterChartData}>
                <XAxis dataKey="name" tick={{ fill: '#8fa3c7', fontSize: 12 }} />
                <YAxis tick={{ fill: '#8fa3c7', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#dce8f7', border: '1px solid #9eb6d5', borderRadius: 8, color: '#253858' }} />
                <Bar dataKey="count" fill="#426dc4" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>No disaster data yet</div>}
        </div>}

        {can(user?.role, 'sos:view') && <div className="card">
          <div className="flex items-center gap-2 mb-4" style={{ fontWeight: 600 }}>
            <Radio size={18} color="var(--accent-orange)" />
            SOS by Priority
          </div>
          {sosChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart margin={{ top: 24, right: 40, bottom: 24, left: 40 }}>
                <Pie data={sosChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} label={({ name, value }) => `${name}: ${value}`}>
                  {sosChartData.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#dce8f7', border: '1px solid #9eb6d5', borderRadius: 8, color: '#253858' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>No SOS data yet</div>}
        </div>}
      </div>}

      {(can(user?.role, 'sos:view') || can(user?.role, 'disasters:view')) && <div className="grid-2">
        {can(user?.role, 'sos:view') &&
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 16 }}>🆘 Recent SOS Alerts</div>
          {stats?.recentSOS?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {stats.recentSOS.map((s: any) => (
                <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-primary)', borderRadius: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{s.userId?.name || 'Unknown'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.message?.slice(0, 40)}...</div>
                  </div>
                  <span className={`badge badge-${s.priority === 'critical' ? 'red' : s.priority === 'high' ? 'orange' : 'yellow'}`}>
                    {s.priority}
                  </span>
                </div>
              ))}
            </div>
          ) : <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No recent SOS alerts</div>}
        </div>}

        {can(user?.role, 'disasters:view') && <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 16 }}>⚡ Recent Disasters</div>
          {stats?.recentDisasters?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {stats.recentDisasters.map((d: any) => (
                <div key={d._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-primary)', borderRadius: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{d.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.type} · {d.location?.address?.slice(0, 30)}</div>
                  </div>
                  <span className={`badge badge-${d.severity === 'critical' ? 'red' : d.severity === 'high' ? 'orange' : 'yellow'}`}>
                    {d.severity}
                  </span>
                </div>
              ))}
            </div>
          ) : <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No recent disasters</div>}
        </div>}
      </div>}
    </div>
  );
};

export default DashboardPage;
