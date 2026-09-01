import { io, Socket } from 'socket.io-client';
import { TicketPriority, TicketStatus } from './types';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
});

export const ticketSocket = {
  fetchAll: () => {
    socket.emit('ticket:fetch_all');
  },

  fetchOne: (id: number) => {
    socket.emit('ticket:fetch_one', { id });
  },

  create: (payload: {
    title: string;
    description: string;
    createdById: number;
    assignedToId?: number | null;
    priority?: TicketPriority;
    status?: TicketStatus;
  }) => {
    socket.emit('ticket:create', payload);
  },

  update: (payload: {
    id: number;
    title?: string;
    description?: string;
    status?: TicketStatus;
    priority?: TicketPriority;
    assignedToId?: number | null;
  }) => {
    socket.emit('ticket:update', payload);
  },

  delete: (id: number) => {
    socket.emit('ticket:delete', { id });
  },
};
