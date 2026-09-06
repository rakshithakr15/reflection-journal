import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { BookOpen, Sparkles, Shield, Lock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface AuthLandingProps {
  onAuthSuccess?: () => void;
}

export const AuthLanding: React.FC<AuthLandingProps> = ({ onAuthSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      onAuthSuccess?.();
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setAuthError('Sign-in window was closed before completion. Please try again.');
      } else if (err.code === 'auth/popup-blocked') {
        setAuthError('Popup was blocked by your browser. Please allow popups for this site and try again.');
      } else {
        setAuthError(err.message || 'Unable to authenticate. Please check your connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="auth-landing-page" className="min-h-screen bg-[#F9F7F2] flex flex-col justify-between text-[#3A3A38]">
      {/* Top Banner */}
      <header className="w-full border-b border-[#E6E1D3] bg-[#F9F7F2]/95 py-4 px-6 sm:px-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7D8471] text-white shadow-xs">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-semibold text-[#3A3A38] tracking-tight">Reflection Journal</span>
              <span className="hidden sm:inline text-xs text-[#9A9A95] ml-2 border-l border-[#E6E1D3] pl-2">
                Private AI Companion
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-[#5A5A58] bg-[#F0EDE5] border border-[#E6E1D3] px-3 py-1.5 rounded-full">
            <Shield className="h-3.5 w-3.5 text-[#7D8471]" />
            <span>Encrypted Firestore</span>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 sm:py-16 flex flex-col items-center text-center justify-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#E6E1D3] bg-[#F0EDE5] px-3.5 py-1.5 text-xs font-medium text-[#5A5A58] mb-6">
          <Sparkles className="h-3.5 w-3.5 text-[#7D8471]" />
          <span>Powered by Gemini 3.6 Flash & Firebase Authentication</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#3A3A38] max-w-2xl leading-tight">
          A tranquil space for thoughtful reflections and dialogue.
        </h1>

        <p className="mt-4 text-base sm:text-lg text-[#5A5A58] max-w-xl leading-relaxed">
          Write freely, uncover insights, and converse with Gemini. Your entries are cryptographically bound to your identity in isolated Firestore storage.
        </p>

        {/* Error Notification */}
        {authError && (
          <div
            id="auth-error-box"
            className="mt-6 w-full max-w-md rounded-xl border border-[#E8C5C2] bg-[#FAF0EF] p-4 text-left text-sm text-[#8A3A36] flex items-start gap-3 shadow-xs"
          >
            <AlertCircle className="h-5 w-5 text-[#C85A54] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Sign-In Notice</p>
              <p className="mt-0.5 text-xs text-[#8A3A36]">{authError}</p>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            id="google-signin-btn"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-3 rounded-xl bg-[#7D8471] px-7 py-3.5 text-sm font-semibold text-white shadow-xs hover:bg-[#6D7462] active:bg-[#5E6454] focus:outline-none focus:ring-2 focus:ring-[#7D8471] focus:ring-offset-2 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Authenticating with Google...</span>
              </>
            ) : (
              <>
                {/* Clean Google Icon */}
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.39 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.27 2.61 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Sign In with Google</span>
                <ArrowRight className="h-4 w-4 ml-1 text-white/80" />
              </>
            )}
          </button>
          <p className="text-xs text-[#9A9A95]">
            Federated authentication. No passwords stored in application code.
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl text-left">
          <div className="rounded-2xl border border-[#E6E1D3] bg-[#F0EDE5]/60 hover:bg-[#F0EDE5] p-5 shadow-xs transition">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E3E8DF] text-[#4A5844] mb-3 border border-[#D1DBCB]">
              <Sparkles className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-semibold text-[#3A3A38]">Multi-Turn Reflections</h2>
            <p className="mt-1 text-xs text-[#5A5A58] leading-relaxed">
              Explore your thoughts with Gemini 3.6 Flash through thoughtful questions, digests, and creative brainstorming.
            </p>
          </div>

          <div className="rounded-2xl border border-[#E6E1D3] bg-[#F0EDE5]/60 hover:bg-[#F0EDE5] p-5 shadow-xs transition">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EAE6D8] text-[#5A5A58] mb-3 border border-[#DCD6C5]">
              <Lock className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-semibold text-[#3A3A38]">User Data Isolation</h2>
            <p className="mt-1 text-xs text-[#5A5A58] leading-relaxed">
              Owner-bound Firestore security rules enforce that your entries can only be queried and read by your authenticated UID.
            </p>
          </div>

          <div className="rounded-2xl border border-[#E6E1D3] bg-[#F0EDE5]/60 hover:bg-[#F0EDE5] p-5 shadow-xs transition">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EBE5DA] text-[#6E5D4F] mb-3 border border-[#DDD3C3]">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-semibold text-[#3A3A38]">Full Session History</h2>
            <p className="mt-1 text-xs text-[#5A5A58] leading-relaxed">
              Revisit past conversations, search by topic, and track how your perspectives evolve over time.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[#E6E1D3] bg-[#F9F7F2] py-4 px-6 text-center text-xs text-[#9A9A95]">
        Reflection Journal • Google Cloud Run & Firebase Firestore Protected
      </footer>
    </div>
  );
};
