'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Laptop, LogOut, Settings, User } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  avatar: string;
}

interface UserProfileMenuProps {
  currentAgent: Agent;
  availableAgents: Agent[];
  onSwitchAgent: (agentId: string) => void;
  isConnected: boolean;
}

export const UserProfileMenu = ({ currentAgent, availableAgents, onSwitchAgent, isConnected }: UserProfileMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 bg-[var(--surface-hover)] px-2 py-1.5 rounded-full border border-[var(--border)] hover:border-[var(--border-strong)] transition-all outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
      >
        <div className="relative">
          <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-bold">
            {currentAgent.avatar}
          </div>
          {isConnected && (
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-[var(--surface-hover)] rounded-full" />
          )}
        </div>
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right overflow-hidden">
          
          {/* Profile Header */}
          <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-hover)]/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-sm font-bold shrink-0">
                {currentAgent.avatar}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[var(--text-primary)] truncate">{currentAgent.name}</p>
                <p className="text-xs text-[var(--text-muted)] truncate">support.{currentAgent.avatar.toLowerCase()}@rapidops.com</p>
              </div>
            </div>
          </div>

          <div className="p-2">
            <div className="px-3 py-1.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Theme Preference
            </div>
            <div className="flex items-center gap-1 p-1 mb-2 bg-[var(--background)] rounded-lg border border-[var(--border)]">
              <button 
                onClick={() => setTheme('light')}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-colors ${theme === 'light' ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
              >
                <Sun className="w-3.5 h-3.5" /> Light
              </button>
              <button 
                onClick={() => setTheme('dark')}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-colors ${theme === 'dark' ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
              >
                <Moon className="w-3.5 h-3.5" /> Dark
              </button>
              <button 
                onClick={() => setTheme('system')}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-colors ${theme === 'system' ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
              >
                <Laptop className="w-3.5 h-3.5" /> Auto
              </button>
            </div>

            <div className="h-px bg-[var(--border)] my-2" />
            
            <div className="px-3 py-1.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Switch Agent (Dev Mode)
            </div>
            <div className="space-y-0.5">
              {availableAgents.map(agent => (
                <button
                  key={agent.id}
                  onClick={() => {
                    onSwitchAgent(agent.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${currentAgent.id === agent.id ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'}`}
                >
                  <User className="w-4 h-4 opacity-70" />
                  {agent.name}
                </button>
              ))}
            </div>

            <div className="h-px bg-[var(--border)] my-2" />

            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
