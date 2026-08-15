'use client';

import { useState, useEffect } from 'react';
import { X, Lock, CheckCircle2 } from 'lucide-react';
import { Ticket } from './TicketCard'; // We'll export the Ticket interface from TicketCard

interface TicketEditModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (ticketId: string, data: Partial<Ticket>) => Promise<void>;
  isLockedByOther: boolean;
  lockedByAgentName?: string;
}

export const TicketEditModal = ({ ticket, isOpen, onClose, onSave, isLockedByOther, lockedByAgentName }: TicketEditModalProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: '',
    priority: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (ticket) {
      setFormData({
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
      });
    }
  }, [ticket]);

  if (!isOpen || !ticket) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedByOther) return;
    
    setIsSaving(true);
    try {
      await onSave(ticket._id, formData);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 dark:bg-[#0B0F19]/80 backdrop-blur-sm"
        onClick={() => !isSaving && onClose()}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#111827] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Edit Ticket</h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-wider">ID: {ticket._id}</p>
          </div>
          <button 
            onClick={onClose}
            disabled={isSaving}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lock Warning */}
        {isLockedByOther && (
          <div className="bg-red-50 dark:bg-red-900/20 px-6 py-3 border-b border-red-100 dark:border-red-900/30 flex items-center gap-3">
            <Lock className="w-4 h-4 text-red-600 dark:text-red-400" />
            <p className="text-sm font-semibold text-red-800 dark:text-red-300">
              Editing locked by {lockedByAgentName}
            </p>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 overflow-y-auto">
          <form id="edit-ticket-form" onSubmit={handleSubmit} className="space-y-5">
            <fieldset disabled={isLockedByOther || isSaving} className="space-y-5">
              
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Title</label>
                <input 
                  type="text" 
                  required
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-[#0B0F19] border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/50 focus:border-transparent transition-shadow disabled:opacity-60"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Description</label>
                <textarea 
                  required
                  rows={4}
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-[#0B0F19] border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/50 focus:border-transparent transition-shadow resize-none disabled:opacity-60"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Status</label>
                  <select 
                    value={formData.status}
                    onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-[#0B0F19] border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/50 transition-shadow disabled:opacity-60"
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Priority</label>
                  <select 
                    value={formData.priority}
                    onChange={e => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-[#0B0F19] border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/50 transition-shadow disabled:opacity-60"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Critical</option>
                  </select>
                </div>
              </div>
            </fieldset>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-[#0B0F19] border-t border-slate-100 dark:border-slate-800">
          <button 
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="edit-ticket-form"
            disabled={isLockedByOther || isSaving}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 rounded-lg transition-colors shadow-sm disabled:shadow-none"
          >
            {isSaving ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
};
