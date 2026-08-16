'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSocket } from '../hooks/useSocket';
import { TicketCard, Ticket } from '../components/tickets/TicketCard';
import { TicketEditModal } from '../components/tickets/TicketEditModal';
import { TicketCreateModal } from '../components/tickets/TicketCreateModal';
import { UserProfileMenu } from '../components/layout/UserProfileMenu';
import { toast } from 'sonner';
import { Ticket as TicketIcon, Plus, LayoutDashboard, Activity, Users, Search, Filter, Hash, CheckCircle, Wifi, WifiOff } from 'lucide-react';

// Mock Auth
const AGENTS = [
  { id: 'user_101', name: 'Agent Ayush', avatar: 'A' },
  { id: 'user_202', name: 'Agent Sarah', avatar: 'S' },
  { id: 'user_303', name: 'Agent Priya', avatar: 'P' },
];

interface ActivityLog {
  id: string;
  timestamp: Date;
  message: string;
  agentName: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function Dashboard() {
  const [currentAgent, setCurrentAgent] = useState(AGENTS[0]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Workspace State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  
  // Modal State
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Activity Feed
  const [activityFeed, setActivityFeed] = useState<ActivityLog[]>([]);

  const { socket, isConnected, isReconnecting } = useSocket({
    agentId: currentAgent.id,
    agentName: currentAgent.name,
  });

  const logActivity = (message: string, agentName: string) => {
    setActivityFeed(prev => [{ id: Math.random().toString(), timestamp: new Date(), message, agentName }, ...prev].slice(0, 50));
  };

  useEffect(() => {
    const savedAgentId = localStorage.getItem('rapidops_active_agent');
    if (savedAgentId) {
      const agent = AGENTS.find(a => a.id === savedAgentId);
      if (agent) setCurrentAgent(agent);
    }
  }, []);

  const handleAgentSwitch = (id: string) => {
    const agent = AGENTS.find(a => a.id === id);
    if (agent) {
      setCurrentAgent(agent);
      localStorage.setItem('rapidops_active_agent', agent.id);
    }
  };

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await fetch(`${API_URL}/api/tickets`);
        const data = await res.json();
        if (data.success) {
          setTickets(data.data);
        }
      } catch (error) {
        toast.error('Failed to load tickets');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTickets();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleTicketLocked = ({ ticketId, agentId, agentName }: { ticketId: string, agentId: string, agentName: string }) => {
      setTickets(prev => prev.map(t => t._id === ticketId ? { ...t, lock: { agentId, agentName } } : t));
      if (agentId !== currentAgent.id) {
        logActivity(`locked Ticket #${ticketId.slice(-4)}`, agentName);
        toast(`Ticket #${ticketId.slice(-4)} is being edited by ${agentName}`);
      }
    };

    const handleTicketUnlocked = ({ ticketId }: { ticketId: string }) => {
      setTickets(prev => prev.map(t => {
        if (t._id === ticketId && t.lock) {
          if (t.lock.agentId !== currentAgent.id) {
            logActivity(`finished with Ticket #${ticketId.slice(-4)}`, t.lock.agentName);
          }
          return { ...t, lock: null };
        }
        return t;
      }));
    };

    const handleTicketCreated = (newTicket: Ticket) => {
      setTickets(prev => {
        if (prev.some(t => t._id === newTicket._id)) return prev;
        return [newTicket, ...prev];
      });
      // Find the agent name if possible, or fallback
      const creatorName = AGENTS.find(a => a.id === newTicket.createdBy)?.name || 'An agent';
      if (newTicket.createdBy !== currentAgent.id) {
        toast.info('A new ticket was created');
        logActivity(`created a new ticket`, creatorName);
      }
    };

    socket.on('ticket_locked', handleTicketLocked);
    socket.on('ticket_unlocked', handleTicketUnlocked);
    socket.on('ticket_created', handleTicketCreated);

    return () => {
      socket.off('ticket_locked', handleTicketLocked);
      socket.off('ticket_unlocked', handleTicketUnlocked);
      socket.off('ticket_created', handleTicketCreated);
    };
  }, [socket, currentAgent.id]);

  const handleLockAndEdit = (ticketId: string) => {
    if (socket && isConnected) {
      socket.emit('lock_ticket', { ticketId });
      setTickets(prev => prev.map(t => t._id === ticketId ? { ...t, lock: { agentId: currentAgent.id, agentName: currentAgent.name } } : t));
      setEditingTicketId(ticketId);
      logActivity(`locked Ticket #${ticketId.slice(-4)}`, currentAgent.name);
    } else {
      toast.error('Cannot edit ticket: No connection');
    }
  };

  const handleUnlock = (ticketId: string) => {
    if (socket && isConnected) {
      socket.emit('unlock_ticket', { ticketId });
      setTickets(prev => prev.map(t => t._id === ticketId ? { ...t, lock: null } : t));
      logActivity(`finished with Ticket #${ticketId.slice(-4)}`, currentAgent.name);
    }
  };

  const closeEditModal = () => {
    if (editingTicketId) {
      handleUnlock(editingTicketId);
      setEditingTicketId(null);
    }
  };

  const saveTicket = async (ticketId: string, data: Partial<Ticket>) => {
    try {
      const res = await fetch(`${API_URL}/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-agent-id': currentAgent.id },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (json.success) {
        setTickets(prev => prev.map(t => t._id === ticketId ? { ...json.data, lock: null } : t));
        toast.success('Ticket updated successfully');
        logActivity(`Updated Ticket #${ticketId.slice(-4)}`, currentAgent.name);
      } else {
        toast.error(json.error.message || 'Failed to update ticket');
      }
    } catch {
      toast.error('Network error while saving');
    }
  };

  const handleCreateTicket = async (data: any) => {
    try {
      const res = await fetch(`${API_URL}/api/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-agent-id': currentAgent.id },
        body: JSON.stringify(data)
      });
      const resData = await res.json();
      if (resData.success) {
        setTickets(prev => [resData.data, ...prev]);
        toast.success('New ticket created');
        logActivity(`Created new ticket`, currentAgent.name);
      } else {
        toast.error(resData.error?.message || 'Failed to create ticket');
      }
    } catch {
      toast.error('Network error while creating ticket');
    }
  };

  // Derived State
  const activeTicketCount = tickets.length;
  const openTicketCount = tickets.filter(t => t.status === 'OPEN').length;
  const lockedTicketCount = tickets.filter(t => t.lock).length;
  const criticalTicketCount = tickets.filter(t => t.priority === 'URGENT').length;
  
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t._id.includes(searchQuery);
      const matchesFilter = filterStatus === 'ALL' || 
                            (filterStatus === 'LOCKED' && t.lock) || 
                            (filterStatus === 'OPEN' && t.status === 'OPEN') ||
                            (filterStatus === 'URGENT' && t.priority === 'URGENT');
      return matchesSearch && matchesFilter;
    });
  }, [tickets, searchQuery, filterStatus]);

  const editingTicket = useMemo(() => tickets.find(t => t._id === editingTicketId) || null, [tickets, editingTicketId]);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] font-sans selection:bg-indigo-500/30 flex flex-col">
      
      {/* Sleek Top Navigation */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[var(--surface)]/80 border-b border-[var(--border)] shadow-sm">
        <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center shadow-md shadow-indigo-500/10 border border-[var(--border)] bg-white">
              <img src="/logo.jpg" alt="RapidOps Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-[var(--text-primary)] leading-tight">RapidOps Live</h1>
              <p className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Real-Time Support</p>
            </div>
            
            <div className="h-6 w-px bg-[var(--border)] mx-2" />
            
            {/* Connection Indicator */}
            <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold border ${
              isConnected ? 'bg-[var(--success-bg)] text-[var(--success-text)] border-[var(--success-text)]/20' :
              isReconnecting ? 'bg-[var(--warning-bg)] text-[var(--warning-text)] border-[var(--warning-text)]/20' :
              'bg-[var(--danger-bg)] text-[var(--danger-text)] border-[var(--danger-text)]/20'
            }`}>
              {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              {isConnected ? 'LIVE' : isReconnecting ? 'RECONNECTING' : 'OFFLINE'}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <UserProfileMenu 
              currentAgent={currentAgent}
              availableAgents={AGENTS}
              onSwitchAgent={handleAgentSwitch}
              isConnected={isConnected}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1440px] w-full mx-auto p-6 flex gap-6 overflow-hidden">
        
        {/* Left Column: Main Dashboard */}
        <div className="flex-1 flex flex-col min-w-0 space-y-6">
          
          {/* Operations Overview */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] shadow-sm">
              <div className="flex items-center gap-2 text-[var(--text-muted)] mb-2">
                <Hash className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Active Tickets</span>
              </div>
              <p className="text-2xl font-bold">{activeTicketCount}</p>
            </div>
            <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] shadow-sm">
              <div className="flex items-center gap-2 text-[var(--text-muted)] mb-2">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Open</span>
              </div>
              <p className="text-2xl font-bold">{openTicketCount}</p>
            </div>
            <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] shadow-sm">
              <div className="flex items-center gap-2 text-[var(--text-muted)] mb-2">
                <Users className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Locked</span>
              </div>
              <p className="text-2xl font-bold">{lockedTicketCount}</p>
            </div>
            <div className="bg-red-50/50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/30 shadow-sm">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
                <Activity className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Urgent</span>
              </div>
              <p className="text-2xl font-bold text-red-700 dark:text-red-400">{criticalTicketCount}</p>
            </div>
          </div>

          {/* Ticket Workspace Toolbar */}
          <div className="flex items-center justify-between bg-[var(--surface)] p-3 rounded-xl border border-[var(--border)] shadow-sm">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input 
                  type="text" 
                  placeholder="Search tickets..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[var(--background)] border border-[var(--border-strong)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 transition-shadow"
                />
              </div>
              <div className="flex items-center gap-2 bg-[var(--background)] px-3 py-2 rounded-lg border border-[var(--border-strong)]">
                <Filter className="w-4 h-4 text-[var(--text-muted)]" />
                <select 
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="text-sm font-medium bg-transparent outline-none text-[var(--text-primary)]"
                >
                  <option value="ALL" className="bg-[var(--surface)] text-[var(--text-primary)]">All Tickets</option>
                  <option value="OPEN" className="bg-[var(--surface)] text-[var(--text-primary)]">Open Only</option>
                  <option value="LOCKED" className="bg-[var(--surface)] text-[var(--text-primary)]">Currently Locked</option>
                  <option value="URGENT" className="bg-[var(--surface)] text-[var(--text-primary)]">Urgent Only</option>
                </select>
              </div>
            </div>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg text-sm font-semibold shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              New Ticket
            </button>
          </div>

          {/* Ticket Grid */}
          <div className="flex-1 overflow-y-auto min-h-0 pb-6 pr-2 -mr-2">
            {isLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-[200px] rounded-2xl bg-[var(--surface)] border border-[var(--border)] animate-pulse" />
                ))}
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="w-full py-20 flex flex-col items-center justify-center bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm">
                <div className="w-16 h-16 bg-[var(--background)] rounded-full flex items-center justify-center mb-4 text-[var(--text-muted)]">
                  <TicketIcon className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold">No tickets found</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-2">Try adjusting your filters or create a new ticket.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredTickets.map(ticket => (
                  <TicketCard 
                    key={ticket._id} 
                    ticket={ticket} 
                    currentAgentId={currentAgent.id}
                    onLock={handleLockAndEdit}
                    onUnlock={handleUnlock} // Still passed but edit flow is modal now
                  />
                ))}

                {/* Creative Filler: System Performance Widget */}
                {filteredTickets.length > 0 && filteredTickets.length < 6 && (
                  <div className="col-span-full mt-6 p-8 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-blue-500/5 border border-indigo-500/10 flex flex-col sm:flex-row items-center justify-between relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute left-0 bottom-0 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
                    
                    <div className="relative z-10 mb-6 sm:mb-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
                        <h3 className="text-lg font-bold text-[var(--text-primary)]">System Performance Optimal</h3>
                      </div>
                      <p className="text-sm text-[var(--text-secondary)] max-w-md leading-relaxed">
                        All routing nodes are fully operational. Response times are well within the 5-minute SLA target. Outstanding queue management!
                      </p>
                    </div>

                    <div className="relative z-10 flex items-center gap-6 bg-[var(--surface)]/50 backdrop-blur-md px-6 py-4 rounded-xl border border-[var(--border)] shadow-sm">
                      <div className="text-center">
                        <p className="text-2xl font-black text-[var(--text-primary)]">98.4%</p>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-[var(--text-muted)] mt-1">SLA Met Today</p>
                      </div>
                      <div className="w-px h-10 bg-[var(--border-strong)] opacity-50" />
                      <div className="text-center">
                        <p className="text-2xl font-black text-[var(--text-primary)]">1.2<span className="text-lg font-bold text-[var(--text-muted)]">m</span></p>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-[var(--text-muted)] mt-1">Avg Response</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Activity & Agents */}
        <div className="w-72 hidden md:flex flex-col gap-6">
          <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-sm flex flex-col h-1/3">
            <div className="px-4 py-3 border-b border-[var(--border)] flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider">Agents Online</h3>
              <span className="w-2 h-2 rounded-full bg-[var(--success-text)] animate-pulse" />
            </div>
            <div className="p-4 space-y-3 overflow-y-auto">
              {AGENTS.map(agent => (
                <div key={agent.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--surface-hover)] border border-[var(--border)] flex items-center justify-center text-xs font-bold">
                    {agent.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{agent.name}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Active now</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-sm flex flex-col flex-1 min-h-0">
            <div className="px-4 py-3 border-b border-[var(--border)] flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider">Live Activity</h3>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto">
              {activityFeed.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] text-center py-4">No recent activity.</p>
              ) : (
                activityFeed.map(log => (
                  <div key={log.id} className="flex gap-3 text-sm animate-in slide-in-from-left-2 fade-in duration-300">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-[var(--accent)] shrink-0" />
                    <div>
                      <p className="text-[var(--text-primary)]"><span className="font-semibold">{log.agentName}</span> {log.message.toLowerCase()}</p>
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Just now</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </main>

      {/* The Edit Modal */}
      <TicketEditModal 
        ticket={editingTicket}
        isOpen={!!editingTicketId}
        onClose={closeEditModal}
        onSave={saveTicket}
        isLockedByOther={editingTicket ? !!editingTicket.lock && editingTicket.lock.agentId !== currentAgent.id : false}
        lockedByAgentName={editingTicket?.lock?.agentName}
      />

      {/* The Create Modal */}
      <TicketCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateTicket}
      />
    </div>
  );
}
