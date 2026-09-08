'use client';

import React, { useState, useEffect } from 'react';
import { Ticket, TicketPriority, TicketStatus, User } from '../lib/types';
import { ticketSocket } from '../lib/socket';
import { X, Edit3, Sparkles, AlertTriangle } from 'lucide-react';

interface EditTicketModalProps {
  currentUser: User;
  ticket: Ticket | null;
  users?: User[];
  isOpen: boolean;
  onClose: () => void;
}

export const EditTicketModal: React.FC<EditTicketModalProps> = ({
  currentUser,
  ticket,
  users = [],
  isOpen,
  onClose,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM');
  const [status, setStatus] = useState<TicketStatus>('OPEN');
  const [assignedToId, setAssignedToId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ticket) {
      setTitle(ticket.title || '');
      setDescription(ticket.description || '');
      setPriority(ticket.priority || 'MEDIUM');
      setStatus(ticket.status || 'OPEN');
      setAssignedToId(ticket.assignedToId ? String(ticket.assignedToId) : '');
      setError(null);
    }
  }, [ticket]);

  if (!isOpen || !ticket) return null;

  const isAdmin = currentUser.role === 'ADMIN';
  const isCreator = currentUser.id === ticket.createdById;
  const isAssignee = currentUser.id === ticket.assignedToId;

  // Field edit permissions
  const canEditDetails = isAdmin || isCreator;
  const canEditStatus = isAdmin || isAssignee;
  const canEditAssignee = isAdmin;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canEditDetails && !title.trim()) {
      setError('Please provide a ticket title');
      return;
    }

    setLoading(true);
    setError(null);

    // Prepare update payload
    const payload: {
      id: number;
      title?: string;
      description?: string;
      priority?: TicketPriority;
      status?: TicketStatus;
      assignedToId?: number | null;
    } = {
      id: ticket.id,
    };

    if (canEditDetails) {
      payload.title = title.trim();
      payload.description = description.trim();
      payload.priority = priority;
    }

    if (canEditStatus) {
      payload.status = status;
    }

    if (canEditAssignee) {
      payload.assignedToId = assignedToId ? Number(assignedToId) : null;
    }

    // Emit real-time WebSocket ticket update event
    ticketSocket.update(payload);

    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Edit Ticket #{ticket.id}</h3>
                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
                  {isAdmin ? 'ADMIN EDIT' : isCreator ? 'CREATOR EDIT' : 'ASSIGNEE EDIT'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Changes will sync in real time across all active user sessions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Title {canEditDetails && <span className="text-rose-400">*</span>}
            </label>
            <input
              type="text"
              required={canEditDetails}
              disabled={!canEditDetails}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              disabled={!canEditDetails}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                disabled={!canEditStatus}
                value={status}
                onChange={(e) => setStatus(e.target.value as TicketStatus)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="OPEN">🔵 Open</option>
                <option value="IN_PROGRESS">🟡 In Progress</option>
                <option value="RESOLVED">🟢 Resolved</option>
                <option value="CLOSED">⚪ Closed</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <select
                disabled={!canEditDetails}
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="LOW">🟢 Low</option>
                <option value="MEDIUM">🟡 Medium</option>
                <option value="HIGH">🟠 High</option>
                <option value="URGENT">🔴 Urgent</option>
              </select>
            </div>
          </div>

          {/* Assignee (Admin only) */}
          {isAdmin && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Assignee
              </label>
              <select
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Read-only info if user cannot reassign */}
          {!isAdmin && (
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3 text-xs text-slate-400 flex items-center justify-between">
              <span>
                Assignee: <strong className="text-slate-200">{ticket.assignedTo?.name || 'Unassigned'}</strong>
              </span>
              <span>
                Creator: <strong className="text-slate-200">{ticket.createdBy?.name || 'User'}</strong>
              </span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-linear-to-r from-indigo-600 to-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-500 hover:to-indigo-400 transition-all disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              Update Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
