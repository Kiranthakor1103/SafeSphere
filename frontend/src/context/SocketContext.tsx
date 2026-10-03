import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to backend server URL
    const envApiUrl = (import.meta as any).env?.VITE_API_BASE_URL || (import.meta as any).env?.VITE_API_URL;
    const backendUrl = envApiUrl 
      ? envApiUrl.replace(/\/api\/?$/, '') 
      : `${window.location.protocol}//${window.location.hostname}:5000`;

    const socketInstance = io(backendUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    // Global listener for critical SOS alerts
    socketInstance.on('sos:created', (sosAlert: any) => {
      if (sosAlert?.priority === 'critical' || sosAlert?.priority === 'high') {
        toast.error(`🚨 EMERGENCY SOS ALERT: ${sosAlert.type?.toUpperCase() || 'CRITICAL'} - ${sosAlert.message || 'Help requested!'}`, {
          duration: 8000,
          position: 'top-right',
        });
      }
    });

    // Global listener for broadcast emergency alerts
    socketInstance.on('alert:broadcast', (emergencyAlert: any) => {
      toast(`⚠️ DISASTER WARNING: ${emergencyAlert.title || 'Emergency Broadcast'}`, {
        duration: 7000,
        position: 'top-center',
        icon: '📢',
        style: {
          background: '#1e293b',
          color: '#f8fafc',
          border: '1px solid #38bdf8',
        },
      });
    });

    // Global listener for team dispatch notifications
    socketInstance.on('team:dispatched', (data: any) => {
      toast(`🚒 RESCUE DISPATCH: Team "${data.teamName}" deployed to ${data.sosType?.toUpperCase() || 'Emergency'} site!`, {
        duration: 8000,
        position: 'top-right',
        icon: '🚨',
        style: {
          background: '#dc2626',
          color: '#ffffff',
          fontWeight: 700,
          borderRadius: '10px',
        },
      });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
export default SocketContext;
