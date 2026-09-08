'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { User, Ticket } from '../lib/types';
import { socket, ticketSocket } from '../lib/socket';
import { fetchAllUsers } from '../lib/api';
import { Navbar } from '../components/Navbar';
import { AuthModal } from '../components/AuthModal';
import { AdminPanel } from '../components/AdminPanel';
import { UserPanel } from '../components/UserPanel';
import { CreateTicketModal } from '../components/CreateTicketModal';
import { EditTicketModal } from '../components/EditTicketModal';
import { UserManagementModal } from '../components/UserManagementModal';
import { RolePermissionModal } from '../components/RolePermissionModal';
import { hasPermission } from '../lib/permissions';
import { WorkspaceSidebar } from '../components/WorkspaceSidebar';
import { useAppContext } from '../lib/app-context';
import { initBrowserNotifications, showBrowserNotification } from '../lib/firebase';
import { Bell, Sparkles, X, CheckCircle2, AlertTriangle, Trash2, Info } from 'lucide-react';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ title: string; body?: string; type?: 'created' | 'updated' | 'deleted' | 'info' } | null>(null);
  const { workspaceView, setWorkspaceView } = useAppContext();

  // Show rich popup notification
  const showToast = useCallback((title: string, body?: string, type: 'created' | 'updated' | 'deleted' | 'info' = 'info') => {
    setToastMessage({ title, body, type });
    setTimeout(() => setToastMessage(null), 5000);
  }, []);

  // 1. Initialize Auth from localStorage
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('ticket_user');
      const savedToken = localStorage.getItem('ticket_token');
      if (savedUser && savedToken) {
        setCurrentUser(JSON.parse(savedUser));
        setToken(savedToken);
      }
    } catch (e) {
      console.error('Failed to load user session', e);
    }
  }, []);

  // 2. Fetch Users & Sync current user role/permissions
  const refreshUsersAndSyncCurrentUser = useCallback(() => {
    fetchAllUsers()
      .then((data) => {
        setUsers(data);
        if (currentUser) {
          const me = data.find((u) => u.id === currentUser.id);
          if (me) {
            setCurrentUser(me);
            localStorage.setItem('ticket_user', JSON.stringify(me));
          }
        }
      })
      .catch((err) => console.error('Failed to fetch team users:', err));
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      refreshUsersAndSyncCurrentUser();
      // Initialize browser push notifications (asks permission + shows welcome OS notification)
      initBrowserNotifications();
    }
  }, [token]);

  // 3. Setup Socket.IO Event Handlers
  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      // Automatically request latest tickets once connected
      ticketSocket.fetchAll();
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onTicketsAll(data: Ticket[]) {
      setTickets(data);
    }

    function onTicketCreated(newTicket: Ticket) {
      setTickets((prev) => {
        const exists = prev.some((t) => t.id === newTicket.id);
        if (exists) return prev;
        return [newTicket, ...prev];
      });

      showToast(`New Ticket #${newTicket.id}`, `"${newTicket.title}" — Priority: ${newTicket.priority}`, 'created');
      showBrowserNotification(`New Ticket #${newTicket.id}`, {
        body: `"${newTicket.title}" [Priority: ${newTicket.priority}]`,
      });
    }

    function onTicketUpdated(updatedTicket: Ticket) {
      setTickets((prev) =>
        prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t))
      );

      // Keep editing ticket in sync if modal is open
      setEditingTicket((current) => (current?.id === updatedTicket.id ? updatedTicket : current));

      showToast(`Ticket #${updatedTicket.id} Updated`, `"${updatedTicket.title}" is now ${updatedTicket.status}`, 'updated');
      showBrowserNotification(`Ticket #${updatedTicket.id} Updated`, {
        body: `"${updatedTicket.title}" is now ${updatedTicket.status} [${updatedTicket.priority}]`,
      });
    }

    function onTicketDeleted({ id }: { id: number }) {
      setTickets((prev) => prev.filter((t) => t.id !== id));
      setEditingTicket((current) => (current?.id === id ? null : current));
      showToast(`Ticket #${id} Deleted`, 'The ticket was permanently removed.', 'deleted');
      showBrowserNotification('Ticket Removed', {
        body: `Ticket #${id} was permanently deleted`,
      });
    }

    // Register socket listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('ticket:all', onTicketsAll);
    socket.on('ticket:created', onTicketCreated);
    socket.on('ticket:updated', onTicketUpdated);
    socket.on('ticket:deleted', onTicketDeleted);

    if (socket.connected) {
      setIsConnected(true);
      ticketSocket.fetchAll();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('ticket:all', onTicketsAll);
      socket.off('ticket:created', onTicketCreated);
      socket.off('ticket:updated', onTicketUpdated);
      socket.off('ticket:deleted', onTicketDeleted);
    };
  }, [showToast]);

  // Handle Auth Login/Signup Success
  const handleAuthSuccess = (user: User, userToken: string) => {
    setCurrentUser(user);
    setToken(userToken);
    localStorage.setItem('ticket_user', JSON.stringify(user));
    localStorage.setItem('ticket_token', userToken);
    ticketSocket.fetchAll();
    // Set up notifications on fresh login
    initBrowserNotifications();
  };

  // Handle Logout
  const handleLogout = () => {
    setCurrentUser(null);
    setToken(null);
    setEditingTicket(null);
    setIsEditModalOpen(false);
    localStorage.removeItem('ticket_user');
    localStorage.removeItem('ticket_token');
  };

  // Handle Open Edit Modal
  const handleOpenEditModal = (ticket: Ticket) => {
    setEditingTicket(ticket);
    setIsEditModalOpen(true);
  };

  const canManageUsers = hasPermission(currentUser, 'user:manage');
  const canManagePermissions = hasPermission(currentUser, 'role:manage');

  return (
    <div className="app-shell min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-zinc-400 selection:text-black md:flex">
      {!currentUser ? (
        <main className="flex min-h-screen flex-1 items-center justify-center p-4">
          <AuthModal onSuccess={handleAuthSuccess} />
        </main>
      ) : (
        <>
          <WorkspaceSidebar user={currentUser} onLogout={handleLogout} />
          <div className="min-w-0 flex-1">
            <Navbar user={currentUser} isConnected={isConnected} onLogout={handleLogout} />
            <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
              {workspaceView === 'tickets' && (currentUser.role === 'ADMIN' ? (
                <AdminPanel
                  currentUser={currentUser}
                  tickets={tickets}
                  users={users}
                  onOpenCreateModal={() => setIsCreateModalOpen(true)}
                  onEditTicket={handleOpenEditModal}
                  onManageUsers={() => setWorkspaceView('users')}
                  onManagePermissions={() => setWorkspaceView('roles')}
                />
              ) : (
                <UserPanel
                  currentUser={currentUser}
                  tickets={tickets}
                  onOpenCreateModal={() => setIsCreateModalOpen(true)}
                  onEditTicket={handleOpenEditModal}
                  onManageUsers={() => setWorkspaceView('users')}
                  onManagePermissions={() => setWorkspaceView('roles')}
                />
              ))}
              {workspaceView === 'users' && canManageUsers && (
                <UserManagementModal
                  isOpen
                  embedded
                  onClose={() => setWorkspaceView('tickets')}
                  currentUser={currentUser}
                  users={users}
                  tickets={tickets}
                  token={token || ''}
                  onUsersUpdated={refreshUsersAndSyncCurrentUser}
                />
              )}
              {workspaceView === 'roles' && canManagePermissions && (
                <RolePermissionModal
                  isOpen
                  embedded
                  onClose={() => setWorkspaceView('tickets')}
                  currentUser={currentUser}
                  users={users}
                  token={token || ''}
                  onUsersUpdated={refreshUsersAndSyncCurrentUser}
                />
              )}
            </main>
          </div>
        </>
      )}

      {/* Create Ticket Modal Overlay */}
      {currentUser && (
        <CreateTicketModal
          currentUser={currentUser}
          users={users}
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}

      {/* Edit Ticket Modal Overlay (Admin & User) */}
      {currentUser && editingTicket && (
        <EditTicketModal
          currentUser={currentUser}
          ticket={editingTicket}
          users={users}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingTicket(null);
          }}
        />
      )}

      {/* Rich Popup Notification */}
      {toastMessage && (
        <div
          key={toastMessage.title}
          className="fixed bottom-6 right-6 z-50 w-80 overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/95 shadow-2xl backdrop-blur-xl"
          style={{ animation: 'slideInRight 0.35s cubic-bezier(0.34,1.56,0.64,1)' }}
        >
          {/* Colour accent bar by type */}
          <div className={`h-0.5 w-full ${
            toastMessage.type === 'created' ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
            toastMessage.type === 'updated' ? 'bg-gradient-to-r from-indigo-500 to-blue-400' :
            toastMessage.type === 'deleted' ? 'bg-gradient-to-r from-rose-500 to-red-400' :
            'bg-gradient-to-r from-amber-500 to-yellow-400'
          }`} />

          <div className="flex items-start gap-3 p-4">
            {/* Icon */}
            <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
              toastMessage.type === 'created' ? 'bg-emerald-500/15 text-emerald-400' :
              toastMessage.type === 'updated' ? 'bg-indigo-500/15 text-indigo-400' :
              toastMessage.type === 'deleted' ? 'bg-rose-500/15 text-rose-400' :
              'bg-amber-500/15 text-amber-400'
            }`}>
              {toastMessage.type === 'created' && <CheckCircle2 className="h-4 w-4" />}
              {toastMessage.type === 'updated' && <Bell className="h-4 w-4" />}
              {toastMessage.type === 'deleted' && <Trash2 className="h-4 w-4" />}
              {(toastMessage.type === 'info' || !toastMessage.type) && <Info className="h-4 w-4" />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white leading-snug">{toastMessage.title}</p>
              {toastMessage.body && (
                <p className="mt-0.5 text-xs text-slate-400 leading-relaxed truncate">{toastMessage.body}</p>
              )}
            </div>

            {/* Close */}
            <button
              onClick={() => setToastMessage(null)}
              className="shrink-0 rounded-lg p-1 text-slate-500 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Auto-dismiss progress bar */}
          <div className={`h-0.5 ${
            toastMessage.type === 'created' ? 'bg-emerald-500/30' :
            toastMessage.type === 'updated' ? 'bg-indigo-500/30' :
            toastMessage.type === 'deleted' ? 'bg-rose-500/30' :
            'bg-amber-500/30'
          }`}>
            <div
              className={`h-full ${
                toastMessage.type === 'created' ? 'bg-emerald-500' :
                toastMessage.type === 'updated' ? 'bg-indigo-500' :
                toastMessage.type === 'deleted' ? 'bg-rose-500' :
                'bg-amber-500'
              }`}
              style={{ animation: 'shrinkWidth 5s linear forwards' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

