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
import { Sparkles, Bell } from 'lucide-react';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Show temporary toast notification on live updates
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
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

  // 2. Fetch Users on mount or auth
  useEffect(() => {
    if (currentUser) {
      fetchAllUsers()
        .then((data) => setUsers(data))
        .catch((err) => console.error('Failed to fetch team users:', err));
    }
  }, [currentUser]);

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
      showToast(`🎫 New Ticket #${newTicket.id} created: "${newTicket.title}"`);
    }

    function onTicketUpdated(updatedTicket: Ticket) {
      setTickets((prev) =>
        prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t))
      );
      showToast(`⚡ Ticket #${updatedTicket.id} updated (Status: ${updatedTicket.status})`);
    }

    function onTicketDeleted({ id }: { id: number }) {
      setTickets((prev) => prev.filter((t) => t.id !== id));
      showToast(`🗑️ Ticket #${id} was deleted`);
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
  };

  // Handle Logout
  const handleLogout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('ticket_user');
    localStorage.removeItem('ticket_token');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        user={currentUser}
        isConnected={isConnected}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {!currentUser ? (
          <AuthModal onSuccess={handleAuthSuccess} />
        ) : currentUser.role === 'ADMIN' ? (
          <AdminPanel
            currentUser={currentUser}
            tickets={tickets}
            users={users}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
          />
        ) : (
          <UserPanel
            currentUser={currentUser}
            tickets={tickets}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
          />
        )}
      </main>

      {/* Create Ticket Modal Overlay */}
      {currentUser && (
        <CreateTicketModal
          currentUser={currentUser}
          users={users}
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}

      {/* Live Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/95 px-4 py-3 text-sm text-white shadow-2xl backdrop-blur-xl animate-fadeIn border-l-4 border-l-indigo-500">
          <Bell className="h-4 w-4 text-indigo-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
