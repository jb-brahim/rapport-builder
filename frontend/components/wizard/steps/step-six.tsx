'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, GripVertical, Layers, Save, ChevronDown, ChevronRight, Hash, Type, AlignLeft, ImagePlus, Check } from 'lucide-react';
import { GrammarChecker } from '@/components/grammar-checker';
import { useTranslation } from '@/app/context/language-context';
import { cn } from '@/lib/utils';

interface TableData {
  headers: string[];
  rows: string[][];
  caption: string;
}

interface Section {
  title: string;
  content: string;
  subsections?: Section[];
  images?: { src: string, caption: string }[];
  tables?: TableData[];
}

interface Chapter {
  title: string;
  introduction: string;
  sections: Section[];
  conclusion: string;
  images?: { src: string, caption: string }[];
  tables?: TableData[];
}

interface StepSixProps {
  rapportId: string;
  chaptersConfig: Chapter[];
  setChaptersConfig: (val: Chapter[]) => void;
  apiClient: any;
  formData: any;
}

const MAX_CHARS = 3500;

const toRoman = (num: number) => {
  if (num <= 0) return '';
  const roman: [string, number][] = [
    ['M', 1000], ['CM', 900], ['D', 500], ['CD', 400], ['C', 100], 
    ['XC', 90], ['L', 50], ['XL', 40], ['X', 10], ['IX', 9], 
    ['V', 5], ['IV', 4], ['I', 1]
  ];
  let result = '';
  let n = num;
  for (const [str, val] of roman) {
    while (n >= val) {
      result += str;
      n -= val;
    }
  }
  return result;
};

const compressImage = (base64: string, maxWidth = 1200, maxHeight = 1200): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
  });
};

const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, currentImages: { src: string, caption: string }[] = [], onUpdate: (newImgs: { src: string, caption: string }[]) => void) => {
  const file = e.target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = async (re) => {
      const originalBase64 = re.target?.result as string;
      const compressed = await compressImage(originalBase64);
      const newImgs = [...currentImages, { src: compressed, caption: '' }];
      onUpdate(newImgs);
    };
    reader.readAsDataURL(file);
  }
};

const TableManager = ({ tables = [], onUpdate }: { tables?: TableData[], onUpdate: (tbls: TableData[]) => void }) => {
  const addTable = () => {
    const newTbl: TableData = {
      headers: ['Col 1', 'Col 2', 'Col 3'],
      rows: [['Cell', 'Cell', 'Cell'], ['Cell', 'Cell', 'Cell']],
      caption: ''
    };
    onUpdate([...tables, newTbl]);
  };

  const updateTable = (idx: number, updates: Partial<TableData>) => {
    const updated = [...tables];
    updated[idx] = { ...updated[idx], ...updates };
    onUpdate(updated);
  };

  const addRow = (tIdx: number) => {
    const updated = [...tables];
    const colCount = updated[tIdx].headers.length;
    updated[tIdx].rows.push(Array(colCount).fill('Cell'));
    onUpdate(updated);
  };

  const removeRow = (tIdx: number, rIdx: number) => {
    const updated = [...tables];
    updated[tIdx].rows = updated[tIdx].rows.filter((_, i) => i !== rIdx);
    onUpdate(updated);
  };

  const addCol = (tIdx: number) => {
    const updated = [...tables];
    updated[tIdx].headers.push(`Col ${updated[tIdx].headers.length + 1}`);
    updated[tIdx].rows = updated[tIdx].rows.map(row => [...row, 'Cell']);
    onUpdate(updated);
  };

  const removeCol = (tIdx: number, cIdx: number) => {
    const updated = [...tables];
    if (updated[tIdx].headers.length > 1) {
      updated[tIdx].headers = updated[tIdx].headers.filter((_, i) => i !== cIdx);
      updated[tIdx].rows = updated[tIdx].rows.map(row => row.filter((_, i) => i !== cIdx));
      onUpdate(updated);
    }
  };

  return (
    <div className="space-y-4 pt-4 border-t border-black/[0.03]">
      <div className="flex items-center justify-between">
         <label className="text-[10px] font-black uppercase tracking-widest text-[#250136]/50 ml-1 flex items-center gap-2">
           <Layers className="w-3 h-3" /> Tableaux de Données
         </label>
         <Button 
           onClick={addTable}
           variant="ghost" 
           size="sm" 
           className="h-7 text-[9px] font-bold gap-1.5 border border-dashed rounded-lg hover:border-emerald-400 hover:text-emerald-500"
         >
           <Plus className="w-3 h-3" /> AJOUTER TABLEAU
         </Button>
      </div>

      {tables.map((tbl, tIdx) => (
        <div key={tIdx} className="bg-slate-50/50 border border-black/5 rounded-2xl p-4 space-y-4">
           <div className="flex items-center justify-between">
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Tableau {tIdx + 1}</span>
              <Button 
                onClick={() => onUpdate(tables.filter((_, i) => i !== tIdx))}
                variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-400 hover:text-red-500 hover:bg-red-50"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
           </div>

           <div className="overflow-x-auto rounded-xl border border-black/5 bg-white shadow-sm">
              <table className="w-full text-[10px] border-collapse">
                 <thead>
                    <tr className="bg-slate-50 border-b border-black/5">
                       {tbl.headers.map((header, hIdx) => (
                          <th key={hIdx} className="p-2 border-r border-black/5 last:border-0">
                             <div className="flex flex-col gap-1">
                                <input 
                                   value={header} 
                                   onChange={(e) => {
                                      const newHeaders = [...tbl.headers];
                                      newHeaders[hIdx] = e.target.value;
                                      updateTable(tIdx, { headers: newHeaders });
                                   }}
                                   className="w-full bg-transparent font-bold text-center outline-none focus:text-blue-500"
                                />
                                <button 
                                  onClick={() => removeCol(tIdx, hIdx)}
                                  className="text-[8px] text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                                >retirer</button>
                             </div>
                          </th>
                       ))}
                       <th className="w-8 p-1">
                          <button onClick={() => addCol(tIdx)} className="w-6 h-6 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center">+</button>
                       </th>
                    </tr>
                 </thead>
                 <tbody>
                    {tbl.rows.map((row, rIdx) => (
                       <tr key={rIdx} className="border-b border-black/[0.03] last:border-0 hover:bg-slate-50/50 transition-colors">
                          {row.map((cell, cIdx) => (
                             <td key={cIdx} className="p-2 border-r border-black/[0.03] last:border-0">
                                <input 
                                   value={cell} 
                                   onChange={(e) => {
                                      const newRows = [...tbl.rows];
                                      newRows[rIdx][cIdx] = e.target.value;
                                      updateTable(tIdx, { rows: newRows });
                                   }}
                                   className="w-full bg-transparent outline-none focus:text-blue-500"
                                />
                             </td>
                          ))}
                          <td className="p-1">
                             <button onClick={() => removeRow(tIdx, rIdx)} className="w-6 h-6 rounded bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center">×</button>
                          </td>
                       </tr>
                    ))}
                    <tr>
                       <td colSpan={tbl.headers.length + 1} className="p-1">
                          <button onClick={() => addRow(tIdx)} className="w-full py-1 text-[8px] font-bold text-slate-400 hover:bg-slate-50 rounded transition-colors uppercase tracking-widest">+ Ajouter une ligne</button>
                       </td>
                    </tr>
                 </tbody>
              </table>
           </div>

           <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Légende du tableau</label>
              <Input 
                value={tbl.caption}
                onChange={(e) => updateTable(tIdx, { caption: e.target.value })}
                placeholder="ex: Tableau 1 : Comparaison des frameworks..."
                className="h-9 text-[10px] font-medium rounded-xl border-black/5"
              />
           </div>
        </div>
      ))}
    </div>
  );
};

const ImageManager = ({ images = [], onUpdate }: { images?: { src: string, caption: string }[], onUpdate: (imgs: { src: string, caption: string }[]) => void }) => {
  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
         <label className="text-[10px] font-black uppercase tracking-widest text-[#250136]/50 ml-1 flex items-center gap-2">
           <ImagePlus className="w-3 h-3" /> Illustrations & Figures
         </label>
         <div className="relative">
            <input 
              type="file" 
              accept="image/*" 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              onChange={(e) => handleImageUpload(e, images, onUpdate)}
            />
            <Button variant="ghost" size="sm" className="h-7 text-[9px] font-bold gap-1.5 border border-dashed rounded-lg hover:border-blue-400 hover:text-blue-500">
              <Plus className="w-3 h-3" /> AJOUTER FIGURE
            </Button>
         </div>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {images.map((img, i) => (
            <div key={i} className="group relative bg-white border border-black/5 rounded-2xl p-3 shadow-sm hover:shadow-md transition-all">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-50 border border-black/5 mb-3">
                 <img src={img.src} className="w-full h-full object-contain" />
                 <button 
                   onClick={() => onUpdate(images.filter((_, idx) => idx !== i))}
                   className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                 >
                   <Trash2 className="w-3.5 h-3.5" />
                 </button>
              </div>
              <div className="space-y-1">
                 <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Figure {i + 1}</p>
                 <Input 
                   value={img.caption}
                   onChange={(e) => {
                     const updated = [...images];
                     updated[i] = { ...updated[i], caption: e.target.value };
                     onUpdate(updated);
                   }}
                   placeholder="Titre de la figure..."
                   className="h-8 text-[10px] font-medium rounded-lg border-black/5"
                 />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function StepSix({ rapportId, chaptersConfig, setChaptersConfig, apiClient, formData }: StepSixProps) {
  const { t, language } = useTranslation();
  const [isSaving, setIsSaving] = useState<number | null>(null);
  const [savedIdx, setSavedIdx] = useState<number | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Record<number, boolean>>({ 0: true });
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const addChapter = () => {
    setChaptersConfig([...chaptersConfig, { title: '', introduction: '', sections: [], conclusion: '' }]);
    setExpandedChapters({ ...expandedChapters, [chaptersConfig.length]: true });
  };

  const updateChapter = (index: number, field: keyof Chapter, value: any) => {
    const updated = [...chaptersConfig];
    updated[index] = { ...updated[index], [field]: value };
    setChaptersConfig(updated);
  };

  const removeChapter = async (index: number) => {
    try {
      if (rapportId !== 'new') {
        await apiClient(`/wizard/${rapportId}/chapter/${index}`, { method: 'DELETE' });
      }
      const updated = chaptersConfig.filter((_, i) => i !== index);
      setChaptersConfig(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const saveChapter = async (index: number) => {
    setIsSaving(index);
    try {
      await apiClient(`/wizard/${rapportId}/chapter`, {
        method: 'POST',
        data: { index, ...chaptersConfig[index] }
      });
      setSavedIdx(index);
      setTimeout(() => setSavedIdx(null), 3000);
    } catch (e) {
      console.error(e);
      alert("Erreur lors de l'enregistrement. L'image est peut-être trop volumineuse.");
    } finally {
      setIsSaving(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-sm font-medium text-foreground/60 mb-2">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          {t('wizard.stepLabel')} 6 — {t('wizard.step6')}
        </div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#250136]">
          {t('step6.title')}
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto text-sm leading-relaxed">
          Structurez le contenu de vos chapitres avec des sections hiérarchisées (Ⅰ, 1, a).
        </p>
      </div>

      <div className="space-y-6">
        {chaptersConfig.map((chapter, idx) => (
          <div key={idx} className="border border-black/[0.06] bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all">
            {/* Chapter Header Flashy */}
            <div 
              className={cn(
                "p-6 flex justify-between items-center cursor-pointer transition-colors",
                expandedChapters[idx] ? "bg-slate-50/80" : "bg-white hover:bg-slate-50/50"
              )}
              onClick={() => setExpandedChapters({ ...expandedChapters, [idx]: !expandedChapters[idx] })}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-[#250136] text-white flex items-center justify-center font-black text-lg shadow-lg shadow-[#250136]/20">
                  {idx + 1}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#250136] flex items-center gap-2">
                    {chapter.title || `${t('step6.chapter')} ${idx + 1}`}
                  </h3>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-foreground/30">
                    {chapter.sections.length} Sections • {expandedChapters[idx] ? 'Réduire' : 'Développer'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                <Button
                  size="sm"
                  onClick={() => saveChapter(idx)}
                  disabled={isSaving === idx}
                  className={cn(
                    "rounded-full px-4 text-xs font-bold gap-1.5 transition-all duration-300 shadow-sm border",
                    savedIdx === idx 
                      ? "bg-emerald-500 border-emerald-600 text-white hover:bg-emerald-600 opacity-100" 
                      : "bg-white border-black/10 hover:bg-black/5 text-[#250136]/70"
                  )}
                >
                  {isSaving === idx ? (
                    <div className="w-3 h-3 border-2 border-slate-300 border-t-slate-800 animate-spin rounded-full mr-1.5" />
                  ) : savedIdx === idx ? (
                    <Check className="w-4 h-4 text-white animate-in zoom-in duration-300" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  {isSaving === idx ? t('common.submitting') : savedIdx === idx ? "Enregistré avec succès !" : t('step6.saveChapter')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeChapter(idx)}
                  className="rounded-full w-9 h-9 p-0 text-red-400 hover:text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <div className="w-10 h-10 flex items-center justify-center text-foreground/20">
                  {expandedChapters[idx] ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </div>
              </div>
            </div>

            {expandedChapters[idx] && (
              <div className="p-8 space-y-8 animate-in slide-in-from-top-2 duration-300">
                {/* Title and Intro */}
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#250136]/40 ml-1 flex items-center gap-2">
                      <Type className="w-3 h-3" /> {t('step6.chapterTitle')}
                    </label>
                    <Input
                      value={chapter.title || ''}
                      onChange={(e) => updateChapter(idx, 'title', e.target.value)}
                      placeholder="ex: État de l'art du Deep Learning"
                      className="rounded-2xl border-black/[0.08] h-12 font-bold text-[#250136] bg-white shadow-sm focus:ring-4 focus:ring-blue-500/5 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#250136]/40 ml-1 flex items-center gap-2">
                       <AlignLeft className="w-3 h-3" /> {t('step6.chapterIntro')}
                    </label>
                    <div className="space-y-1">
                      <Textarea
                        value={chapter.introduction || ''}
                        onChange={(e) => {
                          if (e.target.value.length <= MAX_CHARS) {
                            updateChapter(idx, 'introduction', e.target.value);
                          }
                        }}
                        placeholder="Introduisez brièvement l'objectif de ce chapitre..."
                        rows={3}
                        className={cn(
                          "rounded-2xl border-black/[0.08] text-sm resize-none bg-white shadow-sm focus:ring-4 transition-all",
                          (chapter.introduction?.length || 0) > MAX_CHARS * 0.9 ? "border-amber-400 ring-amber-50" : "focus:ring-blue-500/5"
                        )}
                      />
                      <div className="flex justify-between items-center px-1">
                        <span className={cn(
                          "text-[9px] font-bold uppercase",
                          (chapter.introduction?.length || 0) >= MAX_CHARS ? "text-red-500 animate-pulse" : "text-slate-400"
                        )}>
                          {chapter.introduction?.length || 0} / {MAX_CHARS} CARACTÈRES
                        </span>
                        {(chapter.introduction?.length || 0) >= MAX_CHARS && (
                          <span className="text-[9px] font-black text-red-500 uppercase tracking-tighter">
                            ⚠️ Limite atteinte - Ajoutez une nouvelle section
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <ImageManager 
                    images={chapter.images} 
                    onUpdate={(imgs) => updateChapter(idx, 'images', imgs)} 
                  />
                  <TableManager 
                    tables={chapter.tables}
                    onUpdate={(tbls) => updateChapter(idx, 'tables', tbls)}
                  />
                </div>

                <div className="h-px bg-black/[0.05]" />

                {/* Sections Hierarchy */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-2">
                     <h4 className="text-xs font-black uppercase tracking-widest text-[#250136]">Contenu du Chapitre</h4>
                     <Button 
                       onClick={() => {
                         const sIdx = chapter.sections?.length || 0;
                         const sectionId = `ch-${idx}-s-${sIdx}`;
                         const newSections = [...(chapter.sections || []), { title: '', content: '', subsections: [] }];
                         updateChapter(idx, 'sections', newSections);
                         setExpandedSections(prev => ({ ...prev, [sectionId]: true }));
                       }}
                       variant="outline" 
                       size="sm" 
                       className="rounded-xl border-dashed border-2 text-[10px] font-bold gap-2 px-4 hover:bg-blue-50 hover:border-blue-200 transition-all"
                     >
                       <Plus className="w-3 h-3" /> AJOUTER SECTION (Ⅰ)
                     </Button>
                  </div>

                  <div className="space-y-6">
                    {chapter.sections?.map((section, sIdx) => {
                      const sectionId = `ch-${idx}-s-${sIdx}`;
                      const isExpanded = expandedSections[sectionId];
                      return (
                        <div key={sIdx} className="group relative bg-slate-50/50 rounded-[2rem] p-6 border border-black/[0.03] hover:border-blue-500/20 transition-all">
                          {/* Level 1 Section Header */}
                          <div className="flex items-center gap-4 cursor-pointer" onClick={() => toggleSection(sectionId)}>
                             <div className="w-8 h-8 rounded-lg bg-white border border-black/5 shadow-sm flex items-center justify-center font-bold text-[#250136] text-xs shrink-0">
                               {toRoman(sIdx + 1)}
                             </div>
                             <div className="flex-1">
                                <h5 className={cn("text-sm font-bold transition-colors", section.title ? "text-[#250136]" : "text-foreground/30 italic")}>
                                  {section.title || "Titre de la Section..."}
                                </h5>
                                <p className="text-[9px] font-bold uppercase tracking-wider text-foreground/20">
                                  {section.subsections?.length || 0} Sous-sections • {isExpanded ? 'Réduire' : 'Développer'}
                                </p>
                             </div>
                             <div className="flex items-center gap-2">
                               <Button 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   const newSections = chapter.sections.filter((_, i) => i !== sIdx);
                                   updateChapter(idx, 'sections', newSections);
                                 }}
                                 variant="ghost" size="sm" className="text-red-400 hover:text-red-500"
                               >
                                 <Trash2 className="w-4 h-4" />
                               </Button>
                               <div className="text-foreground/20">
                                 {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                               </div>
                             </div>
                          </div>

                          {isExpanded && (
                            <div className="mt-6 space-y-6 animate-in slide-in-from-top-1 duration-200">
                              <div className="space-y-4">
                                <div className="space-y-1.5">
                                  <label className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#250136]/30 ml-1">Titre de la Division</label>
                                  <Input 
                                    placeholder="ex: Concepts de base..."
                                    value={section.title}
                                    onChange={(e) => {
                                      const newSections = [...chapter.sections];
                                      newSections[sIdx].title = e.target.value;
                                      updateChapter(idx, 'sections', newSections);
                                    }}
                                    className="rounded-xl border-black/10 font-bold text-sm bg-white h-11"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#250136]/30 ml-1">Contenu Détailé</label>
                                  <div className="space-y-1">
                                    <Textarea 
                                      placeholder="Rédigez le contenu de cette section ici..."
                                      value={section.content}
                                      onChange={(e) => {
                                        if (e.target.value.length <= MAX_CHARS) {
                                          const newSections = [...chapter.sections];
                                          newSections[sIdx].content = e.target.value;
                                          updateChapter(idx, 'sections', newSections);
                                        }
                                      }}
                                      className={cn(
                                        "rounded-xl border-black/10 text-xs min-h-[80px] bg-white resize-none",
                                        (section.content?.length || 0) > MAX_CHARS * 0.9 ? "border-amber-400" : ""
                                      )}
                                    />
                                    <div className="flex justify-between items-center px-1">
                                      <span className={cn(
                                        "text-[8px] font-bold uppercase",
                                        (section.content?.length || 0) >= MAX_CHARS ? "text-red-500" : "text-slate-400"
                                      )}>
                                        {section.content?.length || 0} / {MAX_CHARS}
                                      </span>
                                      {(section.content?.length || 0) >= MAX_CHARS && (
                                        <span className="text-[8px] font-black text-red-500 uppercase">⚠️ Limite atteinte</span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <ImageManager 
                                  images={section.images} 
                                  onUpdate={(imgs) => {
                                    const newSections = [...chapter.sections];
                                    newSections[sIdx].images = imgs;
                                    updateChapter(idx, 'sections', newSections);
                                  }} 
                                />
                                <TableManager 
                                  tables={section.tables}
                                  onUpdate={(tbls) => {
                                    const newSections = [...chapter.sections];
                                    newSections[sIdx].tables = tbls;
                                    updateChapter(idx, 'sections', newSections);
                                  }}
                                />
                              </div>

                              {/* Nested Level 2 Subsections (1, 2, 3) */}
                              <div className="pl-12 space-y-4 border-l-2 border-dashed border-slate-200">
                                <div className="flex items-center justify-between mb-2">
                                   <label className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">Sous-divisions</label>
                                   <button 
                                      onClick={() => {
                                        const ssIdx = section.subsections?.length || 0;
                                        const subId = `${sectionId}-ss-${ssIdx}`;
                                        const newSections = [...chapter.sections];
                                        if (!newSections[sIdx].subsections) newSections[sIdx].subsections = [];
                                        newSections[sIdx].subsections?.push({ title: '', content: '', subsections: [] });
                                        updateChapter(idx, 'sections', newSections);
                                        setExpandedSections(prev => ({ ...prev, [subId]: true }));
                                      }}
                                      className="text-[10px] font-bold text-blue-500 hover:text-blue-600 transition-colors flex items-center gap-2"
                                    >
                                      <Plus className="w-3.5 h-3.5" /> AJOUTER NIVEAU 2 (1, 2, 3)
                                    </button>
                                </div>

                                {section.subsections?.map((sub, ssIdx) => {
                                  const subId = `${sectionId}-ss-${ssIdx}`;
                                  const isSubExpanded = expandedSections[subId];
                                  return (
                                    <div key={ssIdx} className="group/sub bg-white/40 p-4 rounded-2xl border border-black/[0.02]">
                                      <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggleSection(subId)}>
                                        <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-[10px] shrink-0">
                                          {ssIdx + 1}
                                        </div>
                                        <div className="flex-1">
                                           <h6 className={cn("text-xs font-bold", sub.title ? "text-[#250136]" : "text-foreground/30")}>
                                              {sub.title || "Titre Sous-section..."}
                                           </h6>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const newSections = [...chapter.sections];
                                              newSections[sIdx].subsections = newSections[sIdx].subsections?.filter((_, i) => i !== ssIdx);
                                              updateChapter(idx, 'sections', newSections);
                                            }}
                                            variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-300 hover:text-red-500"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </Button>
                                          {isSubExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                        </div>
                                      </div>

                                      {isSubExpanded && (
                                        <div className="mt-4 space-y-4 animate-in slide-in-from-top-1 duration-150">
                                           <div className="space-y-3">
                                              <Input 
                                                placeholder="Titre Sous-section..."
                                                value={sub.title}
                                                onChange={(e) => {
                                                  const newSections = [...chapter.sections];
                                                  newSections[sIdx].subsections![ssIdx].title = e.target.value;
                                                  updateChapter(idx, 'sections', newSections);
                                                }}
                                                className="rounded-lg border-black/5 font-semibold text-xs h-9 bg-white"
                                              />
                                              <div className="space-y-1">
                                                <Textarea 
                                                  placeholder="Texte Sous-section..."
                                                  value={sub.content}
                                                  onChange={(e) => {
                                                    if (e.target.value.length <= MAX_CHARS) {
                                                      const newSections = [...chapter.sections];
                                                      newSections[sIdx].subsections![ssIdx].content = e.target.value;
                                                      updateChapter(idx, 'sections', newSections);
                                                    }
                                                  }}
                                                  className={cn(
                                                    "rounded-lg border-black/5 text-[10px] min-h-[60px] bg-white resize-none",
                                                    (sub.content?.length || 0) > MAX_CHARS * 0.9 ? "border-amber-400" : ""
                                                  )}
                                                />
                                                <div className="flex justify-between items-center px-1">
                                                  <span className={cn(
                                                    "text-[8px] font-bold uppercase",
                                                    (sub.content?.length || 0) >= MAX_CHARS ? "text-red-500" : "text-slate-400"
                                                  )}>
                                                    {sub.content?.length || 0} / {MAX_CHARS}
                                                  </span>
                                                </div>
                                              </div>
                                           </div>

                                           <ImageManager 
                                              images={sub.images} 
                                              onUpdate={(imgs) => {
                                                const newSections = [...chapter.sections];
                                                newSections[sIdx].subsections![ssIdx].images = imgs;
                                                updateChapter(idx, 'sections', newSections);
                                              }} 
                                            />
                                            <TableManager 
                                              tables={sub.tables}
                                              onUpdate={(tbls) => {
                                                const newSections = [...chapter.sections];
                                                newSections[sIdx].subsections![ssIdx].tables = tbls;
                                                updateChapter(idx, 'sections', newSections);
                                              }}
                                            />

                                           {/* Nested Level 3 Sub-subsections (a, b, c) */}
                                           <div className="pl-10 space-y-3 pt-2 border-l-2 border-slate-100">
                                              <div className="flex items-center justify-between">
                                                <span className="text-[9px] font-black text-slate-300 uppercase">Détails de sous-section</span>
                                                <button 
                                                  onClick={() => {
                                                    const newSections = [...chapter.sections];
                                                    if (!newSections[sIdx].subsections![ssIdx].subsections) newSections[sIdx].subsections![ssIdx].subsections = [];
                                                    newSections[sIdx].subsections![ssIdx].subsections?.push({ title: '', content: '' });
                                                    updateChapter(idx, 'sections', newSections);
                                                  }}
                                                  className="text-[9px] font-bold text-blue-400 hover:text-blue-500 transition-colors flex items-center gap-1.5"
                                                >
                                                  <Plus className="w-3 h-3" /> AJOUTER NIVEAU 3 (a, b, c)
                                                </button>
                                              </div>

                                              {sub.subsections?.map((sss, sssIdx) => (
                                                <div key={sssIdx} className="bg-slate-50/50 p-3 rounded-xl border border-black/[0.02] space-y-2">
                                                  <div className="flex items-center gap-3">
                                                    <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center font-bold text-slate-400 text-[9px] shrink-0 border border-black/5">
                                                      {String.fromCharCode(97 + sssIdx)}
                                                    </div>
                                                    <Input 
                                                      placeholder="Titre division 'a'..."
                                                      value={sss.title}
                                                      onChange={(e) => {
                                                        const newSections = [...chapter.sections];
                                                        newSections[sIdx].subsections![ssIdx].subsections![sssIdx].title = e.target.value;
                                                        updateChapter(idx, 'sections', newSections);
                                                      }}
                                                      className="rounded-lg border-black/5 text-[10px] h-8 bg-white"
                                                    />
                                                    <Button 
                                                      onClick={() => {
                                                        const newSections = [...chapter.sections];
                                                        newSections[sIdx].subsections![ssIdx].subsections = newSections[sIdx].subsections![ssIdx].subsections?.filter((_, i) => i !== sssIdx);
                                                        updateChapter(idx, 'sections', newSections);
                                                      }}
                                                      variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-300 hover:text-red-500"
                                                    >
                                                      <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                  </div>
                                                  <div className="space-y-1">
                                                    <Textarea 
                                                      placeholder="Rédigez ici..."
                                                      value={sss.content}
                                                      onChange={(e) => {
                                                        if (e.target.value.length <= MAX_CHARS) {
                                                          const newSections = [...chapter.sections];
                                                          newSections[sIdx].subsections![ssIdx].subsections![sssIdx].content = e.target.value;
                                                          updateChapter(idx, 'sections', newSections);
                                                        }
                                                      }}
                                                      className={cn(
                                                        "rounded-lg border-black/5 text-[10px] min-h-[50px] bg-white resize-none",
                                                        (sss.content?.length || 0) > MAX_CHARS * 0.9 ? "border-amber-400" : ""
                                                      )}
                                                    />
                                                    <div className="text-[7px] font-bold text-slate-400 text-right">
                                                      {sss.content?.length || 0} / {MAX_CHARS}
                                                    </div>
                                                  </div>
                                                  <ImageManager 
                                                    images={sss.images} 
                                                    onUpdate={(imgs) => {
                                                      const newSections = [...chapter.sections];
                                                      newSections[sIdx].subsections![ssIdx].subsections![sssIdx].images = imgs;
                                                      updateChapter(idx, 'sections', newSections);
                                                    }} 
                                                  />
                                                  <TableManager 
                                                    tables={sss.tables}
                                                    onUpdate={(tbls) => {
                                                      const newSections = [...chapter.sections];
                                                      newSections[sIdx].subsections![ssIdx].subsections![sssIdx].tables = tbls;
                                                      updateChapter(idx, 'sections', newSections);
                                                    }}
                                                  />
                                                </div>
                                              ))}
                                           </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="h-px bg-black/[0.05]" />

                {/* Conclusion */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#250136]/40 ml-1 flex items-center gap-2">
                    <AlignLeft className="w-3 h-3" /> {t('step6.chapterConclusion')}
                  </label>
                  <div className="space-y-1">
                    <Textarea
                      value={chapter.conclusion || ''}
                      onChange={(e) => {
                        if (e.target.value.length <= MAX_CHARS) {
                          updateChapter(idx, 'conclusion', e.target.value);
                        }
                      }}
                      placeholder="Synthétisez les points clés de ce chapitre..."
                      rows={4}
                      className={cn(
                        "rounded-2xl border-black/[0.08] text-sm resize-none bg-white shadow-sm focus:ring-4 transition-all",
                        (chapter.conclusion?.length || 0) > MAX_CHARS * 0.9 ? "border-amber-400 ring-amber-50" : "focus:ring-blue-500/5"
                      )}
                    />
                    <div className="flex justify-between items-center px-1">
                      <span className={cn(
                        "text-[9px] font-bold uppercase",
                        (chapter.conclusion?.length || 0) >= MAX_CHARS ? "text-red-500" : "text-slate-400"
                      )}>
                        {chapter.conclusion?.length || 0} / {MAX_CHARS} CARACTÈRES
                      </span>
                    </div>
                  </div>
                </div>

                {/* Grammar Checker */}
                <GrammarChecker
                  text={[chapter.title, chapter.introduction, chapter.conclusion].filter(Boolean).join('\n\n')}
                  language={formData.language || language}
                  onApply={(newText: string) => {
                    const parts = newText.split(/\n\n/);
                    if (parts.length >= 1) updateChapter(idx, 'title', parts[0]);
                    if (parts.length >= 2) updateChapter(idx, 'introduction', parts.slice(1, -1).join('\n\n'));
                    if (parts.length >= 2) updateChapter(idx, 'conclusion', parts[parts.length - 1]);
                  }}
                />
              </div>
            )}
          </div>
        ))}

        <Button
          onClick={addChapter}
          variant="outline"
          className="w-full justify-center gap-3 border-dashed border-2 py-10 rounded-[2.5rem] border-black/5 hover:border-blue-500/20 hover:bg-blue-50/50 transition-all text-sm font-bold text-foreground/30 hover:text-[#250136] group"
        >
          <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus className="w-6 h-6" />
          </div>
          {t('step6.addChapter')}
        </Button>
      </div>
    </div>
  );
}

