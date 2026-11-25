import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full py-6 text-center text-xs text-slate-500 border-t border-slate-200/60 mt-auto bg-surface-ground">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Server authoritative • Real-time WebSockets</span>
        </div>
        <p className="font-medium text-slate-600">
          Sketchly — Multiplayer Drawing & Guessing
        </p>
      </div>
    </footer>
  );
};
