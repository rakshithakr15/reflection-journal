import React from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  onDismiss: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onRetry, onDismiss }) => {
  return (
    <div
      id="error-banner"
      role="alert"
      className="mb-4 rounded-xl border border-[#E8C5C2] bg-[#FAF0EF] p-4 text-[#8A3A36] shadow-xs transition-all"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#C85A54]" />
        <div className="flex-1 text-sm font-medium leading-relaxed">
          <span>{message}</span>
        </div>
        <div className="flex items-center gap-2">
          {onRetry && (
            <button
              id="error-banner-retry-btn"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#C85A54] px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#B34E48] active:bg-[#9E413B] focus:outline-none focus:ring-2 focus:ring-[#C85A54] focus:ring-offset-1 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry Save
            </button>
          )}
          <button
            id="error-banner-dismiss-btn"
            onClick={onDismiss}
            aria-label="Dismiss error"
            className="rounded-lg p-1 text-[#C85A54] hover:bg-[#F5D8D6] focus:outline-none transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
