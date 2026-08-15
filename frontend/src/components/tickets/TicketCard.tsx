'use client';

import { Lock, Unlock, Clock, AlertCircle } from 'lucide-react';

export interface Ticket {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdBy: string;
  lock?: {
    agentId: string;
    agentName: string;
  } | null;
}

interface TicketCardProps {
  ticket: Ticket;
  currentAgentId: string;
  onLock: (ticketId: string) => void;
  onUnlock: (ticketId: string) => void;
}

export const TicketCard = ({ ticket, currentAgentId, onLock, onUnlock }: TicketCardProps) => {
  const isLocked = !!ticket.lock;
  const isLockedByMe = isLocked && ticket.lock?.agentId === currentAgentId;
  const isLockedByOther = isLocked && !isLockedByMe;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
      case 'HIGH': return 'text-orange-700 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400';
      case 'MEDIUM': return 'text-blue-700 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
      case 'LOW': return 'text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      default: return 'text-gray-700 bg-gray-100 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  return (
    <div className={`group relative p-6 rounded-2xl border bg-white dark:bg-[#111827] transition-all duration-300 ${
      isLockedByOther 
        ? 'opacity-80 border-slate-200 dark:border-slate-800 shadow-sm pointer-events-none' 
        : 'hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 hover:border-indigo-200 dark:hover:border-indigo-800/50 border-slate-200/60 dark:border-slate-800/80 shadow-md shadow-slate-200/40 dark:shadow-none'
    }`}>
      
      {/* Lock Overlay for others */}
      {isLockedByOther && (
        <div className="absolute inset-0 bg-white/60 dark:bg-[#0B0F19]/60 rounded-2xl flex items-center justify-center backdrop-blur-[2px] z-10 pointer-events-none transition-all">
          <div className="flex flex-col items-center gap-3 bg-white/95 dark:bg-slate-900/95 p-4 rounded-xl shadow-lg border border-red-100 dark:border-red-900/30 pointer-events-auto max-w-[80%] text-center">
            <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <Lock className="w-5 h-5 text-red-500 dark:text-red-400" />
            </div>
            <div>
              <span className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                Locked by {ticket.lock?.agentName}
              </span>
              <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Editing is temporarily unavailable.
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <h3 className="font-bold text-slate-900 dark:text-slate-50 text-lg leading-tight line-clamp-1 pr-3">
          {ticket.title}
        </h3>
        <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full tracking-wider ${getPriorityColor(ticket.priority)}`}>
          {ticket.priority}
        </span>
      </div>
      
      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-6 h-10 leading-relaxed">
        {ticket.description}
      </p>
      
      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md">
            {ticket.status}
          </span>
        </div>
        
        {!isLockedByOther ? (
          <button 
            onClick={() => onLock(ticket._id)}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-sm hover:shadow-md"
          >
            Edit Ticket
          </button>
        ) : (
          <button 
            disabled
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg bg-[var(--surface-hover)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--border)]"
          >
            Locked
          </button>
        )}
      </div>
    </div>
  );
};
