'use client';

import React from 'react';
import { LayoutDashboard, Users, ShieldCheck, Sun, Moon, LogOut, Ticket, Menu, X, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { User } from '../lib/types';
import { hasPermission } from '../lib/permissions';
import { Theme, WorkspaceView, useAppContext } from '../lib/app-context';

interface WorkspaceSidebarProps {
  user: User;
  onLogout: () => void;
}

const navItems: { id: WorkspaceView; label: string; icon: React.ElementType; permission?: 'user:manage' | 'role:manage' }[] = [
  { id: 'tickets', label: 'Tickets', icon: LayoutDashboard },
  { id: 'users', label: 'User management', icon: Users, permission: 'user:manage' },
  { id: 'roles', label: 'Roles & permissions', icon: ShieldCheck, permission: 'role:manage' },
];

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({ user, onLogout }) => {
  const { theme, setTheme, workspaceView, setWorkspaceView } = useAppContext();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const visibleItems = navItems.filter((item) => !item.permission || hasPermission(user, item.permission));
  const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';

  return (
    <>
      <button
        type="button"
        className="mobile-sidebar-toggle fixed left-3 top-3 z-60 rounded-md p-2 shadow-lg"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isOpen}
        title={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
      >
        {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>
      {isOpen && <button type="button" className="mobile-sidebar-overlay fixed inset-0 z-40 bg-black/60" onClick={() => setIsOpen(false)} aria-label="Close navigation menu" />}
      <aside className={`workspace-sidebar flex w-full shrink-0 flex-col border-b md:min-h-screen md:w-64 md:border-b-0 md:border-r ${isOpen ? 'is-open' : ''} ${isCollapsed ? 'is-collapsed' : ''}`}>
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background">
          <Ticket className="h-4 w-4" />
        </div>
        <div className="sidebar-label">
          <p className="text-sm font-bold tracking-tight">Ticketify</p>
          <p className="text-[11px] text-muted-foreground">Workspace</p>
        </div>
        <button
          type="button"
          onClick={() => setIsCollapsed((collapsed) => !collapsed)}
          className="sidebar-collapse-toggle ml-auto rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:block md:flex-1 md:space-y-1 md:overflow-visible md:pb-0" aria-label="Workspace navigation">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = workspaceView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setWorkspaceView(item.id);
                setIsOpen(false);
              }}
              className={`sidebar-nav-item flex w-full min-w-max items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                isActive ? 'sidebar-nav-active bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/70 hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="sidebar-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <button
          type="button"
          onClick={() => setTheme(nextTheme)}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span className="sidebar-label">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          <span className="sidebar-label">Sign out</span>
        </button>
      </div>
      </aside>
      <nav className="mobile-bottom-nav" aria-label="Mobile workspace navigation">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = workspaceView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setWorkspaceView(item.id)}
              className={isActive ? 'mobile-bottom-nav-item active' : 'mobile-bottom-nav-item'}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
