'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  GripVertical, 
  Plus, 
  Trash2, 
  Pencil, 
  Check, 
  X, 
  BookOpen, 
  Sparkles, 
  RotateCcw,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useTranslation } from '@/app/context/language-context';

interface TocItem {
  id: string;
  title: string;
  page: string;
  type: 'front' | 'section' | 'chapter';
  locked?: boolean;
  sections?: { title: string; page: string }[];
}

interface StepFourProps {
  rapportId: string;
  apiClient: any;
  formData: any;
  onUpdateField: (field: string, value: any) => void;
}

export default function StepFour({ rapportId, apiClient, formData, onUpdateField }: StepFourProps) {
  const { t, language } = useTranslation();
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editPage, setEditPage] = useState('');
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [collapsedChapters, setCollapsedChapters] = useState<Set<string>>(new Set());
  const dragRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchToc = async () => {
      try {
        if (formData._customToc && formData._customToc.length > 0) {
          setTocItems(formData._customToc);
          setIsLoading(false);
          return;
        }

        const data = await apiClient(`/wizard/${rapportId}/toc`);
        const rawToc: TocItem[] = (data.toc || []).map((item: any, idx: number) => ({
          ...item,
          id: `toc-${idx}-${Date.now()}`,
          locked: item.type === 'front',
        }));
        setTocItems(rawToc);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchToc();
  }, [rapportId, apiClient, formData._customToc]);

  const saveToc = useCallback((items: TocItem[]) => {
    setTocItems(items);
    onUpdateField('_customToc', items);
  }, [onUpdateField]);

  const startEdit = (item: TocItem) => {
    setEditingId(item.id);
    setEditValue(item.title);
    setEditPage(item.page);
  };

  const confirmEdit = () => {
    if (!editingId) return;
    const updated = tocItems.map(item => 
      item.id === editingId 
        ? { ...item, title: editValue.trim() || item.title, page: editPage.trim() || item.page }
        : item
    );
    saveToc(updated);
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
    setEditPage('');
  };

  const addItem = (afterIdx: number) => {
    const newItem: TocItem = {
      id: `toc-new-${Date.now()}`,
      title: t('step4.newSection'),
      page: '—',
      type: 'section',
      locked: false,
    };
    const updated = [...tocItems];
    updated.splice(afterIdx + 1, 0, newItem);
    saveToc(updated);
    setTimeout(() => startEdit(newItem), 50);
  };

  const deleteItem = (id: string) => {
    saveToc(tocItems.filter(item => item.id !== id));
  };

  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };

  const handleDrop = (idx: number) => {
    if (draggedIdx === null || draggedIdx === idx) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }
    const updated = [...tocItems];
    const [moved] = updated.splice(draggedIdx, 1);
    updated.splice(idx, 0, moved);
    saveToc(updated);
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const resetToGenerated = async () => {
    setIsLoading(true);
    try {
      onUpdateField('_customToc', null);
      const data = await apiClient(`/wizard/${rapportId}/toc`);
      const rawToc: TocItem[] = (data.toc || []).map((item: any, idx: number) => ({
        ...item,
        id: `toc-${idx}-${Date.now()}`,
        locked: item.type === 'front',
      }));
      setTocItems(rawToc);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChapter = (id: string) => {
    setCollapsedChapters(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 animate-in fade-in">
        <div className="w-10 h-10 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
        <span className="text-sm text-foreground/50 font-medium">Generating Table of Contents...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-sm font-medium text-foreground/60 mb-2">
          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
          {t('step4.stepLabel')}
        </div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#250136]">
          {t('step4.title')}
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto text-sm leading-relaxed">
          {t('step4.description')}
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-foreground/40">
          <span className="bg-black/5 px-2 py-1 rounded-md font-bold">{tocItems.length} {t('step4.entries')}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={resetToGenerated}
            className="text-xs gap-1.5 text-foreground/50 hover:text-foreground"
          >
            <RotateCcw className="w-3 h-3" />
            {t('step4.reset')}
          </Button>
          <Button
            size="sm"
            onClick={() => addItem(tocItems.length - 1)}
            className="text-xs gap-1.5 rounded-full bg-[#250136] hover:bg-[#3a0a4f] text-white shadow-lg"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('step4.add')}
          </Button>
        </div>
      </div>

      {/* TOC List */}
      <div ref={dragRef} className="rounded-2xl border border-black/[0.06] bg-white shadow-sm overflow-hidden">
        {tocItems.map((item, idx) => {
          const isEditing = editingId === item.id;
          const isDragOver = dragOverIdx === idx;
          const isDragged = draggedIdx === idx;
          const isChapter = item.type === 'chapter';
          const isCollapsed = collapsedChapters.has(item.id);

          return (
            <div key={item.id}>
              <div
                draggable={!isEditing}
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={() => handleDrop(idx)}
                onDragEnd={handleDragEnd}
                className={`
                  group flex items-center gap-3 px-4 py-3 transition-all duration-200
                  ${isDragOver ? 'border-t-2 border-primary bg-primary/5' : 'border-t border-black/[0.04]'}
                  ${isDragged ? 'opacity-30 scale-[0.98]' : ''}
                  ${isChapter ? 'bg-gradient-to-r from-indigo-50/50 to-transparent' : ''}
                  ${item.type === 'front' ? 'bg-gradient-to-r from-amber-50/30 to-transparent' : ''}
                  ${idx === 0 ? 'border-t-0' : ''}
                  hover:bg-slate-50/80
                `}
              >
                {/* Drag Handle */}
                <div className="cursor-grab active:cursor-grabbing text-foreground/20 hover:text-foreground/50 transition-colors shrink-0">
                  <GripVertical className="w-4 h-4" />
                </div>

                {/* Chapter collapse toggle */}
                {isChapter && item.sections && item.sections.length > 0 ? (
                  <button
                    onClick={() => toggleChapter(item.id)}
                    className="shrink-0 text-foreground/30 hover:text-foreground/60 transition-colors"
                  >
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                ) : (
                  <div className="w-4 shrink-0" />
                )}

                {/* Type Badge */}
                <div className={`shrink-0 text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${
                  item.type === 'front' ? 'bg-amber-100 text-amber-600' :
                  item.type === 'chapter' ? 'bg-indigo-100 text-indigo-600' :
                  'bg-slate-100 text-slate-500'
                }`}>
                  {item.type === 'front' ? t('step4.front') : item.type === 'chapter' ? t('step4.chapterShort') : t('step4.sectionShort')}
                </div>

                {/* Title & Page */}
                {isEditing ? (
                  <div className="flex-1 flex items-center gap-2">
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="h-8 text-sm flex-1"
                      autoFocus
                      spellCheck="true"
                      lang={language}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') confirmEdit();
                        if (e.key === 'Escape') cancelEdit();
                      }}
                    />
                    <Input
                      value={editPage}
                      onChange={(e) => setEditPage(e.target.value)}
                      className="h-8 text-sm w-16 text-center"
                      placeholder={t('step4.page')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') confirmEdit();
                        if (e.key === 'Escape') cancelEdit();
                      }}
                    />
                    <button onClick={confirmEdit} className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={cancelEdit} className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className={`flex-1 text-sm truncate ${
                      isChapter ? 'font-bold text-[#250136]' : 
                      item.type === 'front' ? 'font-medium text-foreground/70' :
                      'text-foreground/60'
                    }`}>
                      {item.title}
                    </span>
                    
                    {/* Dotted line */}
                    <div className="flex-1 border-b border-dotted border-foreground/10 mx-2 min-w-8" />

                    {/* Page number */}
                    <span className={`text-sm font-mono shrink-0 ${
                      isChapter ? 'font-bold text-[#250136]' : 'text-foreground/40'
                    }`}>
                      {item.page}
                    </span>

                    {/* Actions (visible on hover) */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                      <button
                        onClick={() => startEdit(item)}
                        className="p-1.5 text-foreground/30 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                        title="Modifier"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => addItem(idx)}
                        className="p-1.5 text-foreground/30 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        title="Ajouter après"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      {!item.locked && (
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="p-1.5 text-foreground/30 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Sub-sections for chapters */}
              {isChapter && item.sections && item.sections.length > 0 && !isCollapsed && (
                <div className="bg-indigo-50/20">
                  {item.sections.map((sec, si) => (
                    <div key={si} className="flex items-center gap-3 px-4 py-2 pl-16 border-t border-black/[0.02] text-xs text-foreground/40">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 shrink-0" />
                      <span className="flex-1 truncate">{sec.title}</span>
                      <div className="flex-1 border-b border-dotted border-foreground/5 mx-2 min-w-4" />
                      <span className="font-mono">{sec.page}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="flex items-center justify-center gap-2 text-xs text-foreground/30">
        <Sparkles className="w-3 h-3" />
        <span>{t('step4.footerHint')}</span>
      </div>
    </div>
  );
}
