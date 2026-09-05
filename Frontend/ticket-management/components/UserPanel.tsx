'use client';

import React, { useState, useMemo } from 'react';
import { Ticket, TicketPriority, TicketStatus, User } from '../lib/types';
import { ticketSocket } from '../lib/socket';
import { hasPermission } from '../lib/permissions';
import {
  User as UserIcon,
  Plus,
  Inbox,
  Send,
  CheckCircle2,
  Clock,
  RefreshCw,
  Flame,
  FileText,
  Sparkles,
  Edit3,
  Trash2,
  Layers,
  Shield,
  Lock,
} from 'lucide-react';

interface UserPanelProps {
  currentUser: User;
  tickets: Ticket[];
  onOpenCreateModal: () => void;
  onEditTicket: (ticket: Ticket) => void;
}

export const UserPanel: React.FC<UserPanelProps> = ({
  currentUser,
  tickets,
  onOpenCreateModal,
  onEditTicket,
}) => {
  const [activeTab, setActiveTab] = useState<'created' | 'assigned' | 'all'>('created');
  const [deletingTicketId, setDeletingTicketId] = useState<number | null>(null);

  // ── Permissions Checking ──────────────────────────────────────
  const canCreate = hasPermission(currentUser, 'ticket:create');
  const canEdit = hasPermission(currentUser, 'ticket:edit');
  const canDelete = hasPermission(currentUser, 'ticket:delete');
  const canChangeStatus = hasPermission(currentUser, 'ticket:change_status');
  const canViewAll = hasPermission(currentUser, 'ticket:view_all');

  // Filter user tickets
  const myCreatedTickets = useMemo(
    () => tickets.filter((t) => t.createdById === currentUser.id),
    [tickets, currentUser.id]
  );

  const myAssignedTickets = useMemo(
    () => tickets.filter((t) => t.assignedToId === currentUser.id),
    [tickets, currentUser.id]
  );

  // Stats
  const stats = useMemo(() => {
    const totalCreated = myCreatedTickets.length;
    const totalAssigned = myAssignedTickets.length;
    const pendingAssigned = myAssignedTickets.filter(
      (t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED'
    ).length;
    const completedAssigned = myAssignedTickets.filter(
      (t) => t.status === 'RESOLVED' || t.status === 'CLOSED'
    ).length;
    return { totalCreated, totalAssigned, pendingAssigned, completedAssigned, allTotal: tickets.length };
  }, [myCreatedTickets, myAssignedTickets, tickets]);

  const handleStatusChange = (id: number, newStatus: TicketStatus) => {
    if (!canChangeStatus) return;
    ticketSocket.update({ id, status: newStatus });
  };

  const handleDeleteTicket = (id: number) => {
    if (!canDelete) return;
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

  const activeTicketsList =
    activeTab === 'created'
      ? myCreatedTickets
      : activeTab === 'assigned'
      ? myAssignedTickets
      : tickets;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 text-xs font-semibold text-indigo-300">
              <UserIcon className="h-3.5 w-3.5 text-indigo-400" />
              USER DASHBOARD
            </span>

            {/* Active Role Badge */}
            <span className="flex h-6 items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 text-xs font-semibold text-violet-300">
              <Shield className="h-3 w-3 text-violet-400" />
              {currentUser.role}
            </span>

            {canDelete && (
              <span className="flex h-6 items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2 text-[11px] font-semibold text-rose-300">
                <Trash2 className="h-3 w-3 text-rose-400" />
                Delete Access
              </span>
            )}
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            My Workspace & Tasks
          </h1>
          <p className="text-sm text-slate-400">
            Submit issues, track tasks, and collaborate with real-time live sync.
          </p>
        </div>

        <div>
          {canCreate ? (
            <button
              onClick={onOpenCreateModal}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-500 hover:to-indigo-400 transition-all"
            >
              <Plus className="h-4 w-4" />
              Create Ticket
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-500">
              <Lock className="h-3.5 w-3.5" />
              Create Ticket Disabled
            </div>
          )}
        </div>
      </div>

      {/* Metrics Summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Created by Me</span>
            <Send className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{stats.totalCreated}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Assigned to Me</span>
            <Inbox className="h-4 w-4 text-blue-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-blue-400">{stats.totalAssigned}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Action</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-400">{stats.pendingAssigned}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-400">{stats.completedAssigned}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('created')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
            activeTab === 'created'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Send className="h-4 w-4" />
          Tickets I Created ({myCreatedTickets.length})
        </button>
        <button
          onClick={() => setActiveTab('assigned')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
            activeTab === 'assigned'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Inbox className="h-4 w-4" />
          Assigned to Me ({myAssignedTickets.length})
        </button>
        {canViewAll && (
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'all'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="h-4 w-4" />
            All Organization Tickets ({stats.allTotal})
          </button>
        )}
      </div>

      {/* Ticket List */}
      {activeTicketsList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 p-12 text-center">
          <FileText className="h-10 w-10 text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-slate-300">
            {activeTab === 'created'
              ? 'You have not created any tickets yet.'
              : activeTab === 'assigned'
              ? 'No tickets assigned to you.'
              : 'No tickets found in the organization.'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {activeTab === 'created' && canCreate
              ? 'Click "Create Ticket" above to raise an issue.'
              : 'Tickets will appear here in real time.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {activeTicketsList.map((ticket) => (
            <div
              key={ticket.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl hover:border-slate-700 transition-all shadow-lg"
            >
              <div>
                {/* Header tags */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-slate-500">#{ticket.id}</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${getPriorityBadge(
                        ticket.priority
                      )}`}
                    >
                      {ticket.priority}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${getStatusBadge(
                        ticket.status
                      )}`}
                    >
                      {ticket.status}
                    </span>
                  </div>
                </div>

                {/* Title & Desc */}
                <h3 className="mt-3 text-base font-bold text-white">{ticket.title}</h3>
                {ticket.description && (
                  <p className="mt-1 text-xs text-slate-400 line-clamp-2">{ticket.description}</p>
                )}
              </div>

              {/* Bottom Meta & Actions */}
              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div>
                  {activeTab === 'created' ? (
                    <span>
                      Assignee:{' '}
                      <strong className="text-slate-200">
                        {ticket.assignedTo?.name || 'Unassigned'}
                      </strong>
                    </span>
                  ) : (
                    <span>
                      Created by:{' '}
                      <strong className="text-slate-200">
                        {ticket.createdBy?.name || 'User'}
                      </strong>
                    </span>
                  )}
                </div>

                {/* Actions Bar */}
                <div className="flex items-center gap-2">
                  {/* Status Dropdown (only if canChangeStatus) */}
                  {canChangeStatus && (activeTab === 'assigned' || ticket.assignedToId === currentUser.id) && (
                    <div className="flex items-center gap-1.5">
                      <select
                        value={ticket.status}
                        onChange={(e) =>
                          handleStatusChange(ticket.id, e.target.value as TicketStatus)
                        }
                        className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-[11px] font-semibold text-slate-200 focus:border-indigo-500 focus:outline-none cursor-pointer"
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="IN_PROGRESS">IN PROGRESS</option>
                        <option value="RESOLVED">RESOLVED</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    </div>
                  )}

                  {/* Edit Ticket (only if canEdit) */}
                  {canEdit && (
                    <button
                      onClick={() => onEditTicket(ticket)}
                      className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs font-medium text-slate-300 hover:border-slate-700 hover:bg-slate-800 hover:text-white transition-colors"
                      title="Edit Ticket Details"
                    >
                      <Edit3 className="h-3.5 w-3.5 text-indigo-400" />
                      Edit
                    </button>
                  )}

                  {/* Delete Ticket (only if canDelete) */}
                  {canDelete && (
                    <button
                      onClick={() => handleDeleteTicket(ticket.id)}
                      className="flex items-center gap-1 rounded-lg border border-rose-500/20 bg-rose-500/10 px-2 py-1 text-xs font-medium text-rose-300 hover:bg-rose-500/20 hover:border-rose-500/40 transition-colors"
                      title="Delete Ticket"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
