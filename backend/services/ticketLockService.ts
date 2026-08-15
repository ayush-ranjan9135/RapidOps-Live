export interface LockData {
  socketId: string;
  agentId: string;
  agentName: string;
  lockedAt: Date;
}

class TicketLockService {
  // ticketId -> LockData
  private locks: Map<string, LockData> = new Map();

  /**
   * Attempt to lock a ticket.
   * Returns true if successful, false if already locked by someone else.
   */
  acquireLock(ticketId: string, socketId: string, agentId: string, agentName: string): boolean {
    const existingLock = this.locks.get(ticketId);

    // If locked by someone else, fail
    if (existingLock && existingLock.agentId !== agentId) {
      return false;
    }

    // If we already have it or it's free, grant/refresh lock
    this.locks.set(ticketId, {
      socketId,
      agentId,
      agentName,
      lockedAt: new Date(),
    });

    return true;
  }

  /**
   * Release a specific ticket's lock if owned by the given socket/agent.
   */
  releaseLock(ticketId: string, socketId: string, agentId: string): boolean {
    const existingLock = this.locks.get(ticketId);
    
    // Only allow release if the requester actually owns it
    if (existingLock && existingLock.socketId === socketId && existingLock.agentId === agentId) {
      this.locks.delete(ticketId);
      return true;
    }
    return false;
  }

  /**
   * Check if a ticket is currently locked.
   */
  getLock(ticketId: string): LockData | undefined {
    return this.locks.get(ticketId);
  }

  /**
   * Release all locks held by a specific socket ID (for disconnects).
   * Returns the list of ticket IDs that were unlocked.
   */
  releaseLocksOwnedBySocket(socketId: string): string[] {
    const releasedTicketIds: string[] = [];
    
    for (const [ticketId, lockData] of this.locks.entries()) {
      if (lockData.socketId === socketId) {
        this.locks.delete(ticketId);
        releasedTicketIds.push(ticketId);
      }
    }
    
    return releasedTicketIds;
  }
}

export const ticketLockService = new TicketLockService();
