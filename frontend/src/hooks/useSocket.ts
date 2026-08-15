'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface UseSocketProps {
  agentId: string;
  agentName: string;
}

export const useSocket = ({ agentId, agentName }: UseSocketProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);

  useEffect(() => {
    if (!agentId || !agentName) return;

    // Initialize socket connection
    const socket = io(SOCKET_URL, {
      auth: {
        agentId,
        agentName,
      },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    setSocketInstance(socket);

    socket.on('connect', () => {
      setIsConnected(true);
      setIsReconnecting(false);
      socket.emit('join_dashboard');
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        // the disconnection was initiated by the server, you need to reconnect manually
        socket.connect();
      }
      // else the socket will automatically try to reconnect
    });

    socket.io.on('reconnect_attempt', () => {
      setIsReconnecting(true);
    });

    socket.io.on('reconnect', () => {
      setIsConnected(true);
      setIsReconnecting(false);
    });

    socket.io.on('reconnect_failed', () => {
      setIsReconnecting(false);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      socket.removeAllListeners();
      setSocketInstance(null);
    };
  }, [agentId, agentName]);

  return { socket: socketInstance, isConnected, isReconnecting };
};
