'use client';

import React, { useState, useMemo } from 'react';
import { Ticket, TicketPriority, TicketStatus, User } from '../lib/types';
import { ticketSocket } from '../lib/socket';
import {
  Shield,
  Plus,
  Search,
  Filter,
  Users,
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  Flame,
  Trash2,
  RefreshCw,
  UserCheck,
  Tag,
  ArrowUpDown,
  FileText
} from 'lucide-react';

interface AdminPanelProps {
  currentUser: User;
  tickets: Ticket[];
  users: User[];
  onOpenCreateModal: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentUser,
  tickets,
  users,
  onOpenCreateModal,
}) => {
  const [activeTab, setActiveTab] = useState<'tickets' | 'users'>('tickets');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [deletingTicketId, setDeletingTicketId] = useState<number | null>(null);

  // Computed Metrics
  const metrics = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((t) => t.status === 'OPEN').length;
    const inProgress = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
    const resolved = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
    const urgent = tickets.filter((t) => t.priority === 'URGENT').length;
    return { total, open, inProgress, resolved, urgent };
  }, [tickets]);

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesSearch =
        ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.createdBy?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.assignedTo?.name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || ticket.status === statusFilter;
      const matchesPriority = priorityFilter === 'ALL' || ticket.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tickets, searchQuery, statusFilter, priorityFilter]);

  const handleStatusChange = (id: number, newStatus: TicketStatus) => {
    ticketSocket.update({ id, status: newStatus });
  };

  const handlePriorityChange = (id: number, newPriority: TicketPriority) => {
    ticketSocket.update({ id, priority: newPriority });
  };

  const handleAssigneeChange = (id: number, assigneeIdStr: string) => {
    const assignedToId = assigneeIdStr ? Number(assigneeIdStr) : null;
    ticketSocket.update({ id, assignedToId });
  };

  const handleDeleteConfirm = (id: number) => {
    ticketSocket.delete(id);
    setDeletingTicketId(null);
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'IN_PROGRESS':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'RESOLVED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'CLOSED':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const getPriorityBadge = (priority: TicketPriority) => {
    switch (priority) {
      case 'LOW':
        return 'text-slate-400 bg-slate-800/80 border-slate-700';
      case 'MEDIUM':
        return 'text-sky-400 bg-sky-500/10 border-sky-500/30';
      case 'HIGH':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'URGENT':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30 animate-pulse';
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner & Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 text-xs font-semibold text-amber-300">
              <Shield className="h-3.5 w-3.5 text-amber-400" />
              ADMIN CONTROL CENTER
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            System Ticket Overview
          </h1>
          <p className="text-sm text-slate-400">
            Monitor, assign, and manage all organization tickets in real time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-500 hover:to-indigo-400 transition-all"
          >
            <Plus className="h-4 w-4" />
            New Ticket
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total</span>
            <Layers className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{metrics.total}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Open</span>
            <Clock className="h-4 w-4 text-blue-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-blue-400">{metrics.open}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">In Progress</span>
            <RefreshCw className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-400">{metrics.inProgress}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Resolved</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-400">{metrics.resolved}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xl col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Urgent</span>
            <Flame className="h-4 w-4 text-rose-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-rose-400">{metrics.urgent}</p>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('tickets')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
            activeTab === 'tickets'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="h-4 w-4" />
          All Tickets ({tickets.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
            activeTab === 'users'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="h-4 w-4" />
          Team Members ({users.length})
        </button>
      </div>

      {/* Tab: Tickets View */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          {/* Filters & Search Toolbar */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by title, description, or user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900/80 pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Filter Dropdowns & Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter */}
              <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800">
                {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                      statusFilter === st
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {st === 'IN_PROGRESS' ? 'IN PROGRESS' : st}
                  </button>
                ))}
              </div>

              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 focus:border-indigo-500 focus:outline-none"
              >
                <option value="ALL">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          {/* Ticket Table / Cards */}
          {filteredTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 p-12 text-center">
              <FileText className="h-10 w-10 text-slate-600 mb-3" />
              <h3 className="text-base font-semibold text-slate-300">No tickets found</h3>
              <p className="text-xs text-slate-500 mt-1">Try adjusting your search query or filters.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl backdrop-blur-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase font-semibold text-slate-400 tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Ticket</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Priority</th>
                      <th className="px-6 py-4">Assignee</th>
                      <th className="px-6 py-4">Creator</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredTickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-slate-800/30 transition-colors">
                        {/* Title & Description */}
                        <td className="px-6 py-4 max-w-xs sm:max-w-sm">
                          <div className="font-semibold text-white truncate">{ticket.title}</div>
                          {ticket.description && (
                            <p className="text-xs text-slate-400 truncate mt-0.5">{ticket.description}</p>
                          )}
                          <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                            #{ticket.id} • {new Date(ticket.createdAt).toLocaleDateString()}
                          </span>
                        </td>

                        {/* Status Dropdown */}
                        <td className="px-6 py-4">
                          <select
                            value={ticket.status}
                            onChange={(e) => handleStatusChange(ticket.id, e.target.value as TicketStatus)}
                            className={`rounded-lg border px-2.5 py-1 text-xs font-semibold bg-slate-950 focus:outline-none cursor-pointer ${getStatusBadge(
                              ticket.status
                            )}`}
                          >
                            <option value="OPEN">OPEN</option>
                            <option value="IN_PROGRESS">IN PROGRESS</option>
                            <option value="RESOLVED">RESOLVED</option>
                            <option value="CLOSED">CLOSED</option>
                          </select>
                        </td>

                        {/* Priority Dropdown */}
                        <td className="px-6 py-4">
                          <select
                            value={ticket.priority}
                            onChange={(e) => handlePriorityChange(ticket.id, e.target.value as TicketPriority)}
                            className={`rounded-lg border px-2.5 py-1 text-xs font-semibold bg-slate-950 focus:outline-none cursor-pointer ${getPriorityBadge(
                              ticket.priority
                            )}`}
                          >
                            <option value="LOW">🟢 Low</option>
                            <option value="MEDIUM">🟡 Medium</option>
                            <option value="HIGH">🟠 High</option>
                            <option value="URGENT">🔴 Urgent</option>
                          </select>
                        </td>

                        {/* Assignee Dropdown */}
                        <td className="px-6 py-4">
                          <select
                            value={ticket.assignedToId || ''}
                            onChange={(e) => handleAssigneeChange(ticket.id, e.target.value)}
                            className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs font-medium text-slate-200 focus:border-indigo-500 focus:outline-none cursor-pointer max-w-[140px] truncate"
                          >
                            <option value="">Unassigned</option>
                            {users.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Creator */}
                        <td className="px-6 py-4 text-xs text-slate-300">
                          <div className="font-medium text-slate-200">{ticket.createdBy?.name || 'User'}</div>
                          <div className="text-[10px] text-slate-500">{ticket.createdBy?.email}</div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setDeletingTicketId(ticket.id)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                            title="Delete Ticket"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Users View */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((u) => {
            const userCreatedCount = tickets.filter((t) => t.createdById === u.id).length;
            const userAssignedCount = tickets.filter((t) => t.assignedToId === u.id).length;

            return (
              <div
                key={u.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl hover:border-slate-700 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-white font-bold border border-slate-700">
                      {u.name ? u.name[0].toUpperCase() : 'U'}
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                        u.role === 'ADMIN'
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                          : 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300'
                      }`}
                    >
                      {u.role === 'ADMIN' && <Shield className="h-3 w-3 text-amber-400" />}
                      {u.role}
                    </span>
                  </div>

                  <h3 className="mt-3 text-base font-bold text-white">{u.name}</h3>
                  <p className="text-xs text-slate-400">{u.email}</p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-800/80 pt-3 text-xs text-slate-400">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-500 block">Created</span>
                    <span className="font-bold text-white">{userCreatedCount} Tickets</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-500 block">Assigned</span>
                    <span className="font-bold text-white">{userAssignedCount} Tickets</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTicketId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-4">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white">Delete Ticket #{deletingTicketId}?</h3>
            <p className="mt-1.5 text-xs text-slate-400">
              This will permanently delete the ticket from the database and broadcast the removal to all users.
            </p>
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setDeletingTicketId(null)}
                className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteConfirm(deletingTicketId)}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 shadow-lg shadow-rose-600/25 transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
