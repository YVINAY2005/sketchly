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
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            The word was:
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-600 tracking-wide uppercase font-mono">
            {result.word}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Drawn by <span className="font-bold text-slate-800">{result.drawerName}</span>
          </p>
        </div>

        {/* Scores summary table */}
        <div className="text-left">
          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
            Points this round
          </h4>

          <div className="max-h-48 overflow-y-auto space-y-1.5 p-1">
            {result.scores.map((s) => (
              <div
                key={s.playerId}
                className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 text-xs"
              >
                <div className="flex items-center gap-2">
                  {s.guessed ? (
                    <Badge variant="success" size="sm">
                      <Check className="w-3 h-3" /> Guessed
                    </Badge>
                  ) : s.isDrawer ? (
                    <Badge variant="brand" size="sm">
                      Drawer
                    </Badge>
                  ) : (
                    <span className="text-slate-400 text-xs pl-2">—</span>
                  )}
                  <span className="font-bold text-slate-900">{s.name}</span>
                </div>

                <div className="flex items-center gap-2 font-mono">
                  {s.roundScore > 0 ? (
                    <span className="font-bold text-emerald-600">+{s.roundScore}</span>
                  ) : (
                    <span className="text-slate-400">+0</span>
                  )}
                  <span className="font-extrabold text-slate-800 w-12 text-right">
                    {s.score} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next Drawer notice */}
        {result.nextDrawerName && (
          <div className="pt-2 flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
            <span>Next drawer:</span>
            <span className="font-bold text-slate-800">{result.nextDrawerName}</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </div>
        )}
      </div>
    </Modal>
  );
};
