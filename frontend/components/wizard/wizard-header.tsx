'use client';

import { useEffect, useState, RefObject } from 'react';
import { Check, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WizardHeaderProps {
  indicatorRef?: RefObject<HTMLDivElement | null>;
  onManualSave?: () => void;
}

export default function WizardHeader({ indicatorRef, onManualSave }: WizardHeaderProps) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Watch the data-status attribute via MutationObserver — only THIS component re-renders
  useEffect(() => {
    const el = indicatorRef?.current;
    if (!el) return;

    const observer = new MutationObserver(() => {
      const val = el.getAttribute('data-status') as 'idle' | 'saving' | 'saved';
      if (val) setStatus(val);
    });

    observer.observe(el, { attributes: true, attributeFilter: ['data-status'] });
    return () => observer.disconnect();
  }, [indicatorRef]);

  return (
    <div className="flex justify-end w-full">
      <div className="flex items-center gap-3">
        {onManualSave && (
          <Button 
            onClick={onManualSave}
            disabled={status === 'saving'}
            className={cn(
              "h-9 px-6 rounded-full text-[10px] font-black transition-all",
              status === 'saved' ? "bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20" : "bg-[#250136] hover:bg-primary shadow-lg shadow-[#250136]/20"
            )}
          >
            {status === 'saving' ? "SAVING..." : status === 'saved' ? "SAVED!" : "SAVE MANUALLY"}
          </Button>
        )}
        <div
          ref={indicatorRef}
          data-status="idle"
          className="glass-panel px-4 py-2 flex items-center gap-2 backdrop-blur-md border-white/40 shadow-sm"
        >
          {status === 'saving' ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px] font-bold tracking-widest uppercase text-foreground/60">Saving...</span>
            </>
          ) : status === 'saved' ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-500">Saved</span>
            </>
          ) : (
            <>
              <Cloud className="w-3.5 h-3.5 text-foreground/40" />
              <span className="text-[10px] font-bold tracking-widest uppercase text-foreground/40">Cloud Sync Active</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
