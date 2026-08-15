'use client';

import { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';

interface TicketCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: any) => Promise<void>;
}

export const TicketCreateModal = ({ isOpen, onClose, onCreate }: TicketCreateModalProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'OPEN',
    priority: 'MEDIUM',
  });
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onCreate(formData);
      setFormData({ title: '', description: '', status: 'OPEN', priority: 'MEDIUM' });
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
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Create New Ticket</h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-wider">Fill in ticket details</p>
          </div>
          <button 
            onClick={onClose}
            disabled={isSaving}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto">
          <form id="create-ticket-form" onSubmit={handleSubmit} className="space-y-5">
            <fieldset disabled={isSaving} className="space-y-5">
              
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Help Request #1024"
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
                  placeholder="Describe the issue..."
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
                    <option value="OPEN" className="bg-[var(--surface)] text-[var(--text-primary)]">Open</option>
                    <option value="IN_PROGRESS" className="bg-[var(--surface)] text-[var(--text-primary)]">In Progress</option>
                    <option value="RESOLVED" className="bg-[var(--surface)] text-[var(--text-primary)]">Resolved</option>
                    <option value="CLOSED" className="bg-[var(--surface)] text-[var(--text-primary)]">Closed</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Priority</label>
                  <select 
                    value={formData.priority}
                    onChange={e => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-[#0B0F19] border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/50 transition-shadow disabled:opacity-60"
                  >
                    <option value="LOW" className="bg-[var(--surface)] text-[var(--text-primary)]">Low</option>
                    <option value="MEDIUM" className="bg-[var(--surface)] text-[var(--text-primary)]">Medium</option>
                    <option value="HIGH" className="bg-[var(--surface)] text-[var(--text-primary)]">High</option>
                    <option value="URGENT" className="bg-[var(--surface)] text-[var(--text-primary)]">Urgent</option>
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
            form="create-ticket-form"
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 rounded-lg transition-colors shadow-sm disabled:shadow-none"
          >
            {isSaving ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            Create Ticket
          </button>
        </div>

      </div>
    </div>
  );
};
