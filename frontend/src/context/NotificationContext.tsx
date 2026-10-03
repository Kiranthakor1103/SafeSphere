import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { getDisastersAPI } from '../services/api';

export interface NotificationItem {
  id: string;
  category: 'sos' | 'disaster' | 'team' | 'shelter' | 'missing-person' | 'volunteer' | 'resource' | 'user';
  action: 'add' | 'edit' | 'delete' | 'dispatch' | 'broadcast';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  performedBy?: string;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  addNotification: (item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  toggleRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteSingleNotif: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  addNotification: () => {},
  markAsRead: () => {},
  toggleRead: () => {},
  markAllAsRead: () => {},
  deleteSingleNotif: () => {},
  clearAll: () => {},
});

const STORAGE_KEY = 'safesphere_notifications_history';
const DISMISSED_KEY = 'safesphere_notifications_dismissed';
const EXPLICITLY_READ_KEY = 'safesphere_notifications_explicitly_read_ids';

const getDismissedIds = (): string[] => {
  try {
    const saved = localStorage.getItem(DISMISSED_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const addDismissedId = (id: string) => {
  try {
    const ids = getDismissedIds();
    if (!ids.includes(id)) {
      ids.push(id);
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(ids));
    }
  } catch {}
};

const getExplicitlyReadIds = (): string[] => {
  try {
    const saved = localStorage.getItem(EXPLICITLY_READ_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const addExplicitlyReadId = (id: string) => {
  try {
    const ids = getExplicitlyReadIds();
    if (!ids.includes(id)) {
      ids.push(id);
      localStorage.setItem(EXPLICITLY_READ_KEY, JSON.stringify(ids));
    }
  } catch {}
};

const removeExplicitlyReadId = (id: string) => {
  try {
    const ids = getExplicitlyReadIds().filter((i) => i !== id);
    localStorage.setItem(EXPLICITLY_READ_KEY, JSON.stringify(ids));
  } catch {}
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).filter((item: any) => item.category !== 'alert') : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, 50)));
    } catch {}
  }, [notifications]);

  // Sync internal activity only. Broadcast Alerts use their own module.
  useEffect(() => {
    const fetchSystemData = async () => {
      const token = localStorage.getItem('dc_token');
      if (!token) return;

      try {
        const disastersRes = await getDisastersAPI().catch(() => ({ data: { disasters: [] } }));
        const disasterList = disastersRes.data.disasters || [];

        const clearedAtStr = localStorage.getItem('safesphere_notifications_cleared_at');
        const clearedAt = clearedAtStr ? new Date(clearedAtStr).getTime() : 0;
        const dismissedIds = getDismissedIds();
        const dismissedSet = new Set(dismissedIds);
        const explicitlyReadSet = new Set(getExplicitlyReadIds());

        const notifItems: NotificationItem[] = [];

        // Map disasters into Disaster activity tab
        disasterList.forEach((d: any) => {
          const notifId = 'disaster_' + d._id;
          const timestamp = d.createdAt || new Date().toISOString();
          const timeVal = new Date(timestamp).getTime();

          if (timeVal < clearedAt || dismissedSet.has(notifId)) {
            return;
          }

          const isRead = explicitlyReadSet.has(notifId);

          notifItems.push({
            id: notifId,
            category: 'disaster',
            action: 'add',
            title: `⚡ Disaster Incident: ${d.title} (${d.type?.toUpperCase() || 'DISASTER'})`,
            description: `Location: ${d.location?.address || d.affectedArea || 'Affected Zone'}. Status: ${d.status?.toUpperCase() || 'ACTIVE'}. Severity: ${d.severity?.toUpperCase() || 'MEDIUM'}.`,
            timestamp,
            read: isRead,
            performedBy: d.reportedBy?.name || 'System',
          });
        });

        setNotifications((prev) => {
          const mergedMap = new Map<string, NotificationItem>();
          notifItems.forEach((item) => {
            mergedMap.set(item.id, item);
          });
          prev.forEach((prevItem) => {
            if (!mergedMap.has(prevItem.id)) {
              mergedMap.set(prevItem.id, {
                ...prevItem,
                read: explicitlyReadSet.has(prevItem.id) || prevItem.read,
              });
            } else {
              const fetched = mergedMap.get(prevItem.id)!;
              mergedMap.set(prevItem.id, {
                ...fetched,
                read: explicitlyReadSet.has(prevItem.id),
              });
            }
          });
          const merged = Array.from(mergedMap.values());
          merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          return merged.slice(0, 50);
        });
      } catch (err) {}
    };
    fetchSystemData();
  }, []);

  const addNotification = (item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: NotificationItem = {
      ...item,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      timestamp: new Date().toISOString(),
      read: false,
    };

    setNotifications((prev) => {
      // Avoid duplicate notification if same title arrived within 2s
      const isDup = prev.some(
        (n) => n.title === item.title && Math.abs(new Date().getTime() - new Date(n.timestamp).getTime()) < 2000
      );
      if (isDup) return prev;
      return [newNotif, ...prev.slice(0, 49)];
    });
  };

  useEffect(() => {
    if (!socket) return;

    // SOS Alerts
    const handleSOSCreated = (sos: any) => {
      addNotification({
        category: 'sos',
        action: 'add',
        title: `🚨 SOS Distress Broadcasted (${sos.type?.toUpperCase() || 'EMERGENCY'})`,
        description: `${sos.message || 'Help requested'} at ${sos.location?.address || 'Field Location'}. People count: ${sos.numberOfPeople || 1}.`,
        performedBy: sos.performedBy?.name || sos.userId?.name || 'Citizen',
      });
    };

    const handleSOSUpdated = (sos: any) => {
      addNotification({
        category: 'sos',
        action: 'edit',
        title: `📝 SOS Alert Updated`,
        description: `SOS Alert for ${sos.type?.toUpperCase() || 'Emergency'} updated to status: ${sos.status?.toUpperCase()}.`,
        performedBy: sos.performedBy?.name || 'Dispatcher',
      });
    };

    const handleSOSDeleted = (data: any) => {
      addNotification({
        category: 'sos',
        action: 'delete',
        title: `🗑️ SOS Alert Resolved / Removed`,
        description: `SOS Alert record ID ${data._id?.slice(-6) || ''} was deleted/cleared.`,
        performedBy: data.performedBy?.name || 'System',
      });
    };

    // Disasters
    const handleDisasterCreated = (d: any) => {
      addNotification({
        category: 'disaster',
        action: 'add',
        title: `⚡ New Disaster Reported (${d.type?.toUpperCase() || 'DISASTER'})`,
        description: `"${d.title}" declared in ${d.location?.address || d.affectedArea || 'Zone'}. Severity: ${d.severity?.toUpperCase()}.`,
        performedBy: d.performedBy?.name || d.reportedBy?.name || 'System',
      });
    };

    const handleDisasterUpdated = (d: any) => {
      addNotification({
        category: 'disaster',
        action: 'edit',
        title: `✏️ Disaster Information Updated`,
        description: `Disaster record "${d.title}" details modified. Status: ${d.status?.toUpperCase()}.`,
        performedBy: d.performedBy?.name || d.reportedBy?.name || 'System',
      });
    };

    const handleDisasterDeleted = (data: any) => {
      addNotification({
        category: 'disaster',
        action: 'delete',
        title: `🗑️ Disaster Record Removed`,
        description: `Disaster incident record "${data.title || 'Disaster'}" was deleted from live situation overview.`,
        performedBy: data.performedBy?.name || 'System',
      });
    };

    // Rescue Teams
    const handleTeamCreated = (team: any) => {
      addNotification({
        category: 'team',
        action: 'add',
        title: `🚒 Rescue Team Unit Assembled`,
        description: `New team "${team.name}" added with vehicle (${team.vehicleType || 'Unit'}). Status: ${team.status?.toUpperCase()}.`,
        performedBy: team.performedBy?.name || 'System',
      });
    };

    const handleTeamUpdated = (team: any) => {
      addNotification({
        category: 'team',
        action: 'edit',
        title: `✏️ Rescue Team Status Updated`,
        description: `Team "${team.name}" profile or status updated to ${team.status?.toUpperCase()}.`,
        performedBy: team.performedBy?.name || 'System',
      });
    };

    const handleTeamDispatched = (data: any) => {
      addNotification({
        category: 'team',
        action: 'dispatch',
        title: `🚨 RESCUE TEAM DISPATCHED`,
        description: `Team "${data.teamName}" deployed to ${data.sosType?.toUpperCase() || 'Emergency'} site (${data.location || 'Field Location'}).`,
        performedBy: data.performedBy?.name || 'Dispatcher',
      });
    };

    const handleTeamDeleted = (data: any) => {
      addNotification({
        category: 'team',
        action: 'delete',
        title: `🗑️ Rescue Team Removed`,
        description: `Rescue unit "${data.name || 'Team'}" removed from active roster.`,
        performedBy: data.performedBy?.name || 'System',
      });
    };

    // Shelters
    const handleShelterCreated = (s: any) => {
      addNotification({
        category: 'shelter',
        action: 'add',
        title: `🏠 New Relief Shelter Registered`,
        description: `Shelter "${s.name}" opened. Capacity: ${s.capacity} people at ${s.location?.address || 'Site'}.`,
        performedBy: s.performedBy?.name || 'System',
      });
    };

    const handleShelterUpdated = (s: any) => {
      addNotification({
        category: 'shelter',
        action: 'edit',
        title: `✏️ Shelter Details Updated`,
        description: `Shelter "${s.name}" occupancy or status updated to ${s.status?.toUpperCase()}.`,
        performedBy: s.performedBy?.name || 'System',
      });
    };

    const handleShelterDeleted = (data: any) => {
      addNotification({
        category: 'shelter',
        action: 'delete',
        title: `🗑️ Shelter Record Removed`,
        description: `Relief shelter "${data.name || ''}" removed from registry.`,
        performedBy: data.performedBy?.name || 'System',
      });
    };

    const handleUserCreated = (user: any) => {
      addNotification({
        category: 'user', action: 'add', title: '👤 New User Registered',
        description: `${user.name || 'A new user'} joined as ${String(user.role || 'citizen').replace(/_/g, ' ')}.`,
        performedBy: user.performedBy?.name || user.name || 'System',
      });
    };

    const handleUserUpdated = (user: any) => {
      addNotification({
        category: 'user', action: 'edit', title: '✏️ User Account Updated',
        description: `User account for ${user.name || user.email || 'a user'} was updated.`,
        performedBy: user.performedBy?.name || 'System',
      });
    };

    const handleUserDeleted = (user: any) => {
      addNotification({
        category: 'user', action: 'delete', title: '🗑️ User Account Deleted',
        description: `User account for ${user.name || user.email || 'a user'} was deleted.`,
        performedBy: user.performedBy?.name || 'System',
      });
    };

    // Missing Persons
    const handleMissingCreated = (p: any) => {
      addNotification({
        category: 'missing-person',
        action: 'add',
        title: `🔍 Missing Person Report Filed`,
        description: `"${p.name || 'Unknown'}" reported missing. Age: ${p.age || 'N/A'}, Gender: ${p.gender || 'N/A'}. Last seen: ${p.lastSeenLocation?.address || 'Unknown location'}.`,
        performedBy: p.performedBy?.name || p.reportedBy?.name || 'System',
      });
    };

    const handleMissingUpdated = (p: any) => {
      addNotification({
        category: 'missing-person',
        action: 'edit',
        title: `✏️ Missing Person Record Updated`,
        description: `Record for "${p.name || 'Unknown'}" updated. Status: ${p.status?.toUpperCase() || 'MISSING'}.`,
        performedBy: p.performedBy?.name || p.reportedBy?.name || 'System',
      });
    };

    const handleMissingDeleted = (data: any) => {
      addNotification({
        category: 'missing-person',
        action: 'delete',
        title: `🗑️ Missing Person Record Removed`,
        description: `Missing person record "${data.name || ''}" has been removed from the registry.`,
        performedBy: data.performedBy?.name || 'System',
      });
    };

    // Volunteers
    const handleVolunteerCreated = (v: any) => {
      addNotification({
        category: 'volunteer',
        action: 'add',
        title: `🤝 New Volunteer Registered`,
        description: `"${v.userName || 'Volunteer'}" has registered as a volunteer. Availability: ${v.availability?.toUpperCase() || 'AVAILABLE'}.`,
        performedBy: v.performedBy?.name || v.userId?.name || 'System',
      });
    };

    const handleVolunteerUpdated = (v: any) => {
      addNotification({
        category: 'volunteer',
        action: 'edit',
        title: `✏️ Volunteer Profile Updated`,
        description: `Volunteer record updated. Availability: ${v.availability?.toUpperCase() || 'N/A'}.`,
        performedBy: v.performedBy?.name || v.userId?.name || 'System',
      });
    };

    const handleVolunteerDeleted = (data: any) => {
      addNotification({
        category: 'volunteer',
        action: 'delete',
        title: `🗑️ Volunteer Removed`,
        description: `A volunteer has been removed from the active roster.`,
        performedBy: data.performedBy?.name || 'System',
      });
    };

    // Resources
    const handleResourceCreated = (r: any) => {
      addNotification({
        category: 'resource',
        action: 'add',
        title: `📦 New Resource Added`,
        description: `"${r.name || 'Resource'}" (${r.type?.toUpperCase() || 'SUPPLY'}) added. Quantity: ${r.quantity || 'N/A'}.`,
        performedBy: r.performedBy?.name || 'System',
      });
    };

    const handleResourceUpdated = (r: any) => {
      addNotification({
        category: 'resource',
        action: 'edit',
        title: `✏️ Resource Record Updated`,
        description: `Resource "${r.name || ''}" updated. Status: ${r.status?.toUpperCase() || 'AVAILABLE'}.`,
        performedBy: r.performedBy?.name || 'System',
      });
    };

    const handleResourceDeleted = (data: any) => {
      addNotification({
        category: 'resource',
        action: 'delete',
        title: `🗑️ Resource Removed`,
        description: `Resource "${data.name || ''}" removed from inventory.`,
        performedBy: data.performedBy?.name || 'System',
      });
    };

    socket.on('sos:created', handleSOSCreated);
    socket.on('sos:updated', handleSOSUpdated);
    socket.on('sos:deleted', handleSOSDeleted);

    socket.on('disaster:created', handleDisasterCreated);
    socket.on('disaster:updated', handleDisasterUpdated);
    socket.on('disaster:deleted', handleDisasterDeleted);

    socket.on('team:created', handleTeamCreated);
    socket.on('team:updated', handleTeamUpdated);
    socket.on('team:dispatched', handleTeamDispatched);
    socket.on('team:deleted', handleTeamDeleted);

    socket.on('shelter:created', handleShelterCreated);
    socket.on('shelter:updated', handleShelterUpdated);
    socket.on('shelter:deleted', handleShelterDeleted);

    socket.on('user:created', handleUserCreated);
    socket.on('user:updated', handleUserUpdated);
    socket.on('user:deleted', handleUserDeleted);

    socket.on('missingPerson:created', handleMissingCreated);
    socket.on('missingPerson:updated', handleMissingUpdated);
    socket.on('missingPerson:deleted', handleMissingDeleted);

    socket.on('volunteer:created', handleVolunteerCreated);
    socket.on('volunteer:updated', handleVolunteerUpdated);
    socket.on('volunteer:deleted', handleVolunteerDeleted);

    socket.on('resource:created', handleResourceCreated);
    socket.on('resource:updated', handleResourceUpdated);
    socket.on('resource:deleted', handleResourceDeleted);

    return () => {
      socket.off('sos:created', handleSOSCreated);
      socket.off('sos:updated', handleSOSUpdated);
      socket.off('sos:deleted', handleSOSDeleted);

      socket.off('disaster:created', handleDisasterCreated);
      socket.off('disaster:updated', handleDisasterUpdated);
      socket.off('disaster:deleted', handleDisasterDeleted);

      socket.off('team:created', handleTeamCreated);
      socket.off('team:updated', handleTeamUpdated);
      socket.off('team:dispatched', handleTeamDispatched);
      socket.off('team:deleted', handleTeamDeleted);

      socket.off('shelter:created', handleShelterCreated);
      socket.off('shelter:updated', handleShelterUpdated);
      socket.off('shelter:deleted', handleShelterDeleted);

      socket.off('user:created', handleUserCreated);
      socket.off('user:updated', handleUserUpdated);
      socket.off('user:deleted', handleUserDeleted);

      socket.off('missingPerson:created', handleMissingCreated);
      socket.off('missingPerson:updated', handleMissingUpdated);
      socket.off('missingPerson:deleted', handleMissingDeleted);

      socket.off('volunteer:created', handleVolunteerCreated);
      socket.off('volunteer:updated', handleVolunteerUpdated);
      socket.off('volunteer:deleted', handleVolunteerDeleted);

      socket.off('resource:created', handleResourceCreated);
      socket.off('resource:updated', handleResourceUpdated);
      socket.off('resource:deleted', handleResourceDeleted);
    };
  }, [socket]);

  const markAsRead = (id: string) => {
    addExplicitlyReadId(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const toggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          if (n.read) {
            removeExplicitlyReadId(id);
          } else {
            addExplicitlyReadId(id);
          }
          return { ...n, read: !n.read };
        }
        return n;
      })
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => {
      prev.forEach((n) => addExplicitlyReadId(n.id));
      return prev.map((n) => ({ ...n, read: true }));
    });
  };

  const deleteSingleNotif = (id: string) => {
    addDismissedId(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    try {
      localStorage.setItem('safesphere_notifications_cleared_at', new Date().toISOString());
      localStorage.removeItem(DISMISSED_KEY);
      localStorage.removeItem(EXPLICITLY_READ_KEY);
    } catch {}
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        toggleRead,
        markAllAsRead,
        deleteSingleNotif,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
export default NotificationContext;
