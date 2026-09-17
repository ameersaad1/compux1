import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextValue>({ socket: null, isConnected: false });

/**
 * One socket connection per signed-in session, authenticated via the same
 * httpOnly access-token cookie the REST API uses (see server ChatGateway).
 * Disconnects automatically when the user logs out.
 */
export function SocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) {
      setSocket(null);
      setIsConnected(false);
      return;
    }

    const instance = io(import.meta.env.VITE_SOCKET_URL ?? '/', { withCredentials: true });
    instance.on('connect', () => setIsConnected(true));
    instance.on('disconnect', () => setIsConnected(false));
    setSocket(instance);

    return () => {
      instance.disconnect();
    };
  }, [userId]);

  return <SocketContext.Provider value={{ socket, isConnected }}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}
