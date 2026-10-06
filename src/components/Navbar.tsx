/**
 * AC — Modern Aurora Minimal Header
 * Minimalist typography: AC | VIỆT PHỤC ĐƯƠNG ĐẠI
 * Clean right side with no clutter
 */

import React from 'react';
import { Sparkles, RotateCcw } from 'lucide-react';

interface NavbarProps {
  isEvaluating?: boolean;
  hasActiveSession?: boolean;
  onResetSession?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isEvaluating,
  hasActiveSession,
  onResetSession
}) => {
  return (
    <header className="sticky top-0 z-50 w-full glass-nav transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand identity: AC | VIỆT PHỤC ĐƯƠNG ĐẠI */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <span className="font-bold text-stone-900 tracking-tight text-base sm:text-lg">
            AC
          </span>
          <span className="text-stone-300 font-light">|</span>
          <span className="text-xs sm:text-sm font-semibold tracking-wider text-stone-700 uppercase">
            Việt Phục Đương Đại
          </span>
        </div>

        {/* Right side: Clean space, subtle evaluating pill if active, Reset button if active session */}
        <div className="flex items-center gap-3">
          {isEvaluating && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50/90 text-amber-800 border border-amber-200 animate-pulse">
              <Sparkles className="w-3 h-3 animate-spin text-amber-600" />
              <span>Đang kiểm định...</span>
            </span>
          )}

          {hasActiveSession && onResetSession && (
            <button
              type="button"
              onClick={() => {
                console.log('[SessionReset] BUTTON_CLICKED');
                onResetSession();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 px-3 py-1.5 rounded-full bg-stone-100/60 hover:bg-stone-100 border border-stone-200/60 transition-colors cursor-pointer"
              title="Bắt đầu lại bản phối mới"
            >
              <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
              <span className="hidden sm:inline">Bắt đầu lại</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
