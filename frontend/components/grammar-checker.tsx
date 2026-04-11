'use client';

import { useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck, X, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';

// ────────────────────────────────────────────────────────────────
// LanguageTool Types
// ────────────────────────────────────────────────────────────────
interface LTMatch {
  message: string;
  shortMessage: string;
  replacements: { value: string }[];
  offset: number;
  length: number;
  context: { text: string; offset: number; length: number };
  rule: { id: string; description: string; issueType: string; category: { id: string; name: string } };
}

interface GrammarIssue {
  message: string;
  shortMessage: string;
  context: string;
  errorText: string;
  offset: number;
  length: number;
  suggestions: string[];
  category: string;
  issueType: string;
}

// ────────────────────────────────────────────────────────────────
// LanguageTool free public API call
// ────────────────────────────────────────────────────────────────
async function checkGrammar(text: string, language: string): Promise<GrammarIssue[]> {
  const ltLang = language === 'fr' ? 'fr' : 'en-US';
  const params = new URLSearchParams({ text, language: ltLang });
  const res = await fetch('https://api.languagetool.org/v2/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!res.ok) throw new Error('LanguageTool API error');
  const data = await res.json();
  return (data.matches as LTMatch[]).map((m) => ({
    message: m.message,
    shortMessage: m.shortMessage || m.rule.description,
    context: m.context.text,
    errorText: m.context.text.substring(m.context.offset, m.context.offset + m.context.length),
    offset: m.offset,
    length: m.length,
    suggestions: m.replacements.slice(0, 4).map((r) => r.value),
    category: m.rule.category.name,
    issueType: m.rule.issueType,
  }));
}

// ────────────────────────────────────────────────────────────────
// Category color helpers
// ────────────────────────────────────────────────────────────────
function getIssueColor(issueType: string) {
  switch (issueType) {
    case 'misspelling': return { badge: 'bg-red-100 text-red-700', dot: 'bg-red-400', border: 'border-red-200' };
    case 'grammar':     return { badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400', border: 'border-amber-200' };
    case 'style':       return { badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-400', border: 'border-blue-200' };
    default:            return { badge: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400', border: 'border-slate-200' };
  }
}

// ────────────────────────────────────────────────────────────────
// Props
// ────────────────────────────────────────────────────────────────
interface GrammarCheckerProps {
  text: string;
  language: string;
  onApply: (newText: string) => void;
}

// ────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────
export function GrammarChecker({ text, language, onApply }: GrammarCheckerProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [issues, setIssues] = useState<GrammarIssue[]>([]);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const runCheck = useCallback(async () => {
    if (!text.trim() || text.trim().length < 10) return;
    setStatus('loading');
    setIssues([]);
    setExpandedIdx(null);
    try {
      const found = await checkGrammar(text, language);
      setIssues(found);
      setStatus('done');
    } catch (e: any) {
      setErrorMsg(e.message || 'Check failed');
      setStatus('error');
    }
  }, [text, language]);

  // Apply a single fix: replace text at offset
  const applySuggestion = (issue: GrammarIssue, suggestion: string) => {
    const before = text.slice(0, issue.offset);
    const after = text.slice(issue.offset + issue.length);
    const newText = before + suggestion + after;
    onApply(newText);
    // Re-run check on updated text
    setIssues([]);
    setStatus('idle');
  };

  const dismiss = () => { setStatus('idle'); setIssues([]); };

  const isLong = text.trim().length < 10;

  // ── Idle / trigger button
  if (status === 'idle') {
    return (
      <button
        onClick={runCheck}
        disabled={isLong}
        title={isLong ? 'Write some text first' : 'AI-Powered Spelling & Grammar Check'}
        className="inline-flex items-center gap-2 group"
      >
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#250136]/5 hover:bg-primary/10 border border-[#250136]/10 hover:border-primary/30 transition-all duration-300 shadow-sm">
          <ShieldCheck className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black text-[#250136] tracking-wide">
            {language === 'fr' ? 'IA — VÉRIFIER LA GRAMMAIRE' : 'AI — CHECK GRAMMAR'}
          </span>
        </div>
        {!isLong && (
          <span className="text-[10px] font-bold text-primary/40 group-hover:text-primary transition-colors italic">
            Free Assistant
          </span>
        )}
      </button>
    );
  }

  // ── Loading
  if (status === 'loading') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary animate-pulse">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        {language === 'fr' ? 'Analyse en cours...' : 'Checking...'}
      </span>
    );
  }

  // ── Error
  if (status === 'error') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-red-500 cursor-pointer" onClick={dismiss}>
        <AlertCircle className="w-3.5 h-3.5" />
        {language === 'fr' ? 'Erreur réseau — réessayer' : 'Network error — retry'}
      </span>
    );
  }

  // ── Done: no issues
  if (status === 'done' && issues.length === 0) {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 cursor-pointer"
        onClick={dismiss}
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        {language === 'fr' ? 'Aucune erreur détectée ✓' : 'No issues found ✓'}
      </span>
    );
  }

  // ── Done: show issues panel
  return (
    <div className="mt-3 rounded-2xl border border-black/[0.07] bg-white shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-slate-50  border-b border-black/5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span className="text-xs font-black text-[#250136]">
            {issues.length} {language === 'fr'
              ? `problème${issues.length > 1 ? 's' : ''} détecté${issues.length > 1 ? 's' : ''}`
              : `issue${issues.length > 1 ? 's' : ''} found`}
          </span>
          <span className="text-[10px] text-[#250136]/30 font-bold">
            — via LanguageTool
          </span>
        </div>
        <button onClick={dismiss} className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors text-[#250136]/40 hover:text-[#250136]">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Issues List */}
      <div className="divide-y divide-black/5 max-h-[320px] overflow-y-auto">
        {issues.map((issue, idx) => {
          const colors = getIssueColor(issue.issueType);
          const isExpanded = expandedIdx === idx;
          return (
            <div key={idx} className="px-5 py-3 hover:bg-slate-50/80 transition-colors">
              {/* Issue Row */}
              <button
                className="w-full flex items-start gap-3 text-left"
                onClick={() => setExpandedIdx(isExpanded ? null : idx)}
              >
                <div className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${colors.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-xs text-[#250136] truncate">
                      &ldquo;{issue.errorText}&rdquo;
                    </span>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${colors.badge}`}>
                      {issue.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#250136]/50 font-medium mt-0.5 leading-tight">
                    {issue.shortMessage || issue.message}
                  </p>
                </div>
                {isExpanded
                  ? <ChevronUp className="w-3.5 h-3.5 text-[#250136]/30 shrink-0 mt-0.5" />
                  : <ChevronDown className="w-3.5 h-3.5 text-[#250136]/30 shrink-0 mt-0.5" />}
              </button>

              {/* Expanded: suggestions */}
              {isExpanded && issue.suggestions.length > 0 && (
                <div className="mt-3 ml-4.5 flex flex-wrap gap-2 animate-in fade-in duration-200">
                  {issue.suggestions.map((s, si) => (
                    <button
                      key={si}
                      onClick={() => applySuggestion(issue, s)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary/5 hover:bg-primary text-primary hover:text-white border border-primary/20 hover:border-primary text-[11px] font-black transition-all"
                    >
                      <ArrowRight className="w-3 h-3" />
                      {s}
                    </button>
                  ))}
                </div>
              )}
              {isExpanded && issue.suggestions.length === 0 && (
                <p className="mt-2 ml-4.5 text-[11px] text-[#250136]/40 font-medium animate-in fade-in duration-200">
                  {language === 'fr' ? 'Aucune suggestion disponible.' : 'No replacements available.'}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
