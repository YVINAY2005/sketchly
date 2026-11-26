import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full py-5 text-center text-xs text-slate-400 border-t-2 border-slate-900 mt-auto bg-[#070b18]/90 backdrop-blur-md font-bold">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-950 animate-pulse" />
          <span className="text-slate-300">Server Authoritative • 60fps Real-Time WebSockets</span>
        </div>
        <p className="font-black text-amber-400">
          Sketchly 🎨 The Real-Time Multiplayer Drawing Game
        </p>
      </div>
    </footer>
  );
};

