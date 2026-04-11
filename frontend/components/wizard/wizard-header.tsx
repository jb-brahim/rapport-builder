'use client';

import { useEffect, useState, RefObject } from 'react';
import { Check, Cloud } from 'lucide-react';

interface WizardHeaderProps {
  indicatorRef?: RefObject<HTMLDivElement | null>;
}

export default function WizardHeader({ indicatorRef }: WizardHeaderProps) {
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
  );
}
