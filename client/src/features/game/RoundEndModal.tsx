import React from 'react';
import { RoundResult } from '../../types';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { Check, ArrowRight } from 'lucide-react';

export interface RoundEndModalProps {
  isOpen: boolean;
  result: RoundResult | null;
}

export const RoundEndModal: React.FC<RoundEndModalProps> = ({ isOpen, result }) => {
  if (!isOpen || !result) return null;

  return (
    <Modal isOpen={isOpen} showCloseButton={false} maxWidth="md" title="Round Finished!">
      <div className="space-y-4 text-center">
        {/* Word Reveal */}
        <div className="p-4 bg-amber-100 rounded-2xl border-3 border-slate-900 shadow-tactile-sm">
          <p className="text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
            THE SECRET WORD WAS:
          </p>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-wider uppercase font-mono">
            {result.word}
          </h2>
          <p className="text-xs font-bold text-slate-600 mt-1">
            Drawn by <span className="font-black text-slate-950">{result.drawerName}</span>
          </p>
        </div>

        {/* Scores summary table */}
        <div className="text-left">
          <h4 className="text-xs font-black text-slate-950 uppercase tracking-wider mb-2">
            Points this round
          </h4>

          <div className="max-h-48 overflow-y-auto space-y-1.5 p-1">
            {result.scores.map((s) => (
              <div
                key={s.playerId}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white border-2 border-slate-900 shadow-tactile-sm text-xs"
              >
                <div className="flex items-center gap-2">
                  {s.guessed ? (
                    <Badge variant="success" size="sm">
                      <Check className="w-3 h-3 stroke-[3]" /> Guessed
                    </Badge>
                  ) : s.isDrawer ? (
                    <Badge variant="brand" size="sm">
                      Drawer 🎨
                    </Badge>
                  ) : (
                    <span className="text-slate-400 text-xs pl-2 font-bold">—</span>
                  )}
                  <span className="font-black text-slate-950">{s.name}</span>
                </div>

                <div className="flex items-center gap-2 font-mono">
                  {s.roundScore > 0 ? (
                    <span className="font-black text-emerald-700">+{s.roundScore}</span>
                  ) : (
                    <span className="text-slate-400 font-bold">+0</span>
                  )}
                  <span className="font-black text-slate-950 w-14 text-right bg-amber-50 px-1.5 py-0.5 rounded border border-slate-900/40">
                    {s.score} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next Drawer notice */}
        {result.nextDrawerName && (
          <div className="pt-2 flex items-center justify-center gap-1.5 text-xs text-slate-700 font-black">
            <span>Next drawer:</span>
            <span className="font-black text-slate-950 bg-amber-200 border border-slate-900 px-2 py-0.5 rounded-md">{result.nextDrawerName}</span>
            <ArrowRight className="w-4 h-4 text-slate-900 stroke-[3]" />
          </div>
        )}
      </div>
    </Modal>
  );
};
