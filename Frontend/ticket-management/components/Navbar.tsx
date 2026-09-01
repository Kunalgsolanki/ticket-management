'use client';

import React from 'react';
import { User } from '../lib/types';
import { Ticket, Shield, User as UserIcon, LogOut, Radio } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  isConnected: boolean;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, isConnected, onLogout }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 shadow-lg shadow-indigo-500/25">
            <Ticket className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white sm:text-xl">
              Ticketi<span className="text-indigo-400">fy</span>
            </span>
            <span className="hidden ml-2 rounded-md bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-500/20 sm:inline-block">
              REAL-TIME
            </span>
          </div>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-4">
          
          {/* Live Socket Status Dot */}
          <div
            className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
              isConnected
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
            }`}
            title={isConnected ? 'Live WebSocket Active' : 'Connecting to WebSocket server...'}
          >
            <span className="relative flex h-2 w-2">
              {isConnected && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  isConnected ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              ></span>
            </span>
            <span className="hidden sm:inline">
              {isConnected ? 'Real-Time Sync' : 'Reconnecting...'}
            </span>
          </div>

          {user && (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
              {/* User Avatar & Details */}
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-200 border border-slate-700 text-sm font-semibold">
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div className="hidden flex-col md:flex">
                  <span className="text-sm font-medium text-slate-200 leading-none">
                    {user.name}
                  </span>
                  <span className="text-xs text-slate-400 mt-1">{user.email}</span>
                </div>
              </div>

              {/* Role Badge */}
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                  user.role === 'ADMIN'
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                    : 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300'
                }`}
              >
                {user.role === 'ADMIN' ? (
                  <>
                    <Shield className="h-3 w-3 text-amber-400" />
                    ADMIN
                  </>
                ) : (
                  <>
                    <UserIcon className="h-3 w-3 text-indigo-400" />
                    USER
                  </>
                )}
              </span>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
