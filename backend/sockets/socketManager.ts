import { Server, Socket } from 'socket.io';
import { ticketLockService } from '../services/ticketLockService';

export const setupSocketHandlers = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Expect auth from handshake (mocking auth)
    const agentId = socket.handshake.auth.agentId as string | undefined;
    const agentName = socket.handshake.auth.agentName as string | undefined;

    if (!agentId || !agentName) {
      console.warn(`Connection without auth, disconnecting: ${socket.id}`);
      socket.disconnect();
      return;
    }

    socket.on('join_dashboard', () => {
      // Send current locks to the newly connected client
      // Not perfect for scale, but good enough for demo
      // We would normally only send relevant locks, but this is a helpdesk
    });

    socket.on('lock_ticket', (data: { ticketId: string }) => {
      if (!data || !data.ticketId) return;
      
      const success = ticketLockService.acquireLock(data.ticketId, socket.id, agentId, agentName);
      
      if (success) {
        // Broadcast to EVERYONE (including sender) so their UI updates
        io.emit('ticket_locked', {
          ticketId: data.ticketId,
          agentId,
          agentName
        });
      }
    });

    socket.on('unlock_ticket', (data: { ticketId: string }) => {
      if (!data || !data.ticketId) return;

      const success = ticketLockService.releaseLock(data.ticketId, socket.id, agentId);
      
      if (success) {
        // Broadcast unlock
        io.emit('ticket_unlocked', {
          ticketId: data.ticketId
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      
      // 11. GHOST DISCONNECT — CRITICAL REQUIREMENT
      const releasedTicketIds = ticketLockService.releaseLocksOwnedBySocket(socket.id);
      
      releasedTicketIds.forEach(ticketId => {
        io.emit('ticket_unlocked', { ticketId });
      });
    });
  });
};
