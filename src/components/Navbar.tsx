import React from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { BookOpen, LogOut, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  user: FirebaseUser;
  onSignOut: () => void;
  isSaving?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onSignOut, isSaving }) => {
  return (
    <header
      id="app-navbar"
      className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#E6E1D3] bg-[#F9F7F2]/95 px-4 sm:px-6 backdrop-blur-sm"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7D8471] text-white shadow-xs">
          <BookOpen className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-[#3A3A38] tracking-tight">Reflection Journal</h1>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[#F0EDE5] px-2.5 py-0.5 text-xs font-medium text-[#5A5A58] border border-[#E6E1D3]">
              <ShieldCheck className="h-3 w-3 text-[#7D8471]" />
              Isolated Firestore
            </span>
          </div>
          <p className="text-xs text-[#9A9A95] hidden sm:block">Powered by Gemini 3.6 Flash & Firebase Auth</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {isSaving && (
          <div className="flex items-center gap-1.5 text-xs text-[#5A5A58]">
            <span className="h-2 w-2 animate-ping rounded-full bg-[#7D8471]"></span>
            <span>Syncing...</span>
          </div>
        )}

        <div className="flex items-center gap-2 rounded-xl border border-[#E6E1D3] bg-[#F0EDE5]/80 px-2.5 py-1.5">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'User Avatar'}
              referrerPolicy="no-referrer"
              className="h-7 w-7 rounded-full object-cover border border-[#E6E1D3]"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7D8471] text-xs font-semibold text-white">
              {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-[#3A3A38] leading-tight">
              {user.displayName || 'Journaler'}
            </p>
            <p className="text-[11px] text-[#9A9A95] leading-tight truncate max-w-[140px]">
              {user.email}
            </p>
          </div>
        </div>

        <button
          id="navbar-signout-btn"
          onClick={onSignOut}
          title="Sign Out"
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#E6E1D3] bg-white px-3 py-2 text-xs font-medium text-[#5A5A58] shadow-xs hover:bg-[#EAE6D8] hover:text-[#3A3A38] active:bg-[#E0DACB] transition focus:outline-none focus:ring-2 focus:ring-[#7D8471]"
        >
          <LogOut className="h-4 w-4 text-[#7D8471]" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
};
