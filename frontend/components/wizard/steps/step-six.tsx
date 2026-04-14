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
  
  const [activeItem, setActiveItem] = useState<{
    type: 'chapter-intro' | 'chapter-conclusion' | 'section' | 'subsection' | 'sub-subsection';
    cIdx: number;
    sIdx?: number;
    ssIdx?: number;
    sssIdx?: number;
  }>({ type: 'chapter-intro', cIdx: 0 });

  const [searchQuery, setSearchQuery] = useState('');

  const activeChapter = chaptersConfig[activeItem.cIdx];

  const getActiveContent = () => {
    if (!activeChapter) return { title: '', content: '' };
    
    switch (activeItem.type) {
      case 'chapter-intro':
        return { title: activeChapter.title || 'Introduction', content: activeChapter.introduction || '' };
      case 'chapter-conclusion':
        return { title: 'Conclusion', content: activeChapter.conclusion || '' };
      case 'section':
        if (activeItem.sIdx === undefined) return { title: '', content: '' };
        const s = activeChapter.sections[activeItem.sIdx];
        return { title: s?.title || '', content: s?.content || '', images: s?.images, tables: s?.tables };
      case 'subsection':
        if (activeItem.sIdx === undefined || activeItem.ssIdx === undefined) return { title: '', content: '' };
        const ss = activeChapter.sections[activeItem.sIdx].subsections?.[activeItem.ssIdx];
        return { title: ss?.title || '', content: ss?.content || '', images: ss?.images, tables: ss?.tables };
      case 'sub-subsection':
        if (activeItem.sIdx === undefined || activeItem.ssIdx === undefined || activeItem.sssIdx === undefined) return { title: '', content: '' };
        const sss = activeChapter.sections[activeItem.sIdx].subsections?.[activeItem.ssIdx].subsections?.[activeItem.sssIdx];
        return { title: sss?.title || '', content: sss?.content || '', images: sss?.images, tables: sss?.tables };
      default:
        return { title: '', content: '' };
    }
  };

  const updateActiveContent = (updates: { title?: string, content?: string, images?: any[], tables?: any[] }) => {
    const updated = [...chaptersConfig];
    const ch = updated[activeItem.cIdx];
    
    if (activeItem.type === 'chapter-intro') {
      if (updates.title !== undefined) ch.title = updates.title;
      if (updates.content !== undefined) ch.introduction = updates.content;
    } else if (activeItem.type === 'chapter-conclusion') {
      if (updates.content !== undefined) ch.conclusion = updates.content;
    } else if (activeItem.type === 'section') {
      const s = ch.sections[activeItem.sIdx!];
      if (updates.title !== undefined) s.title = updates.title;
      if (updates.content !== undefined) s.content = updates.content;
      if (updates.images !== undefined) s.images = updates.images;
      if (updates.tables !== undefined) s.tables = updates.tables;
    } else if (activeItem.type === 'subsection') {
      const ss = ch.sections[activeItem.sIdx!].subsections![activeItem.ssIdx!];
      if (updates.title !== undefined) ss.title = updates.title;
      if (updates.content !== undefined) ss.content = updates.content;
      if (updates.images !== undefined) ss.images = updates.images;
      if (updates.tables !== undefined) ss.tables = updates.tables;
    } else if (activeItem.type === 'sub-subsection') {
      const sss = ch.sections[activeItem.sIdx!].subsections![activeItem.ssIdx!].subsections![activeItem.sssIdx!];
      if (updates.title !== undefined) sss.title = updates.title;
      if (updates.content !== undefined) sss.content = updates.content;
      if (updates.images !== undefined) sss.images = updates.images;
      if (updates.tables !== undefined) sss.tables = updates.tables;
    }
    
    setChaptersConfig(updated);
  };

  const addChapter = () => {
    setChaptersConfig([...chaptersConfig, { title: '', introduction: '', sections: [], conclusion: '' }]);
    setActiveItem({ type: 'chapter-intro', cIdx: chaptersConfig.length });
  };

  const updateChapter = (index: number, field: keyof Chapter, value: any) => {
    const updated = [...chaptersConfig];
    updated[index] = { ...updated[index], [field]: value };
    setChaptersConfig(updated);
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

  const { title, content, images, tables } = getActiveContent();

  return (
    <div className="flex flex-col h-[750px] -mx-8 -my-8 bg-[#FDFCFB] border border-[#250136]/5 rounded-3xl overflow-hidden shadow-2xl">
      {/* 1. SaaS Header */}
      <div className="h-14 border-b border-[#250136]/5 bg-white flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-6 flex-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#250136] flex items-center justify-center text-white font-black text-[10px]">6</div>
            <span className="font-bold text-[#250136] text-[11px] uppercase tracking-wider">{t('wizard.step6')}</span>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            {[1, 2, 3, 4, 5, 6, 7].map(step => (
              <div 
                key={step} 
                className={cn(
                  "h-1 rounded-full transition-all duration-500",
                  step === 6 ? "w-6 bg-primary" : step < 6 ? "w-2 bg-primary/30" : "w-2 bg-[#250136]/5"
                )}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            onClick={() => saveChapter(activeItem.cIdx)}
            disabled={isSaving === activeItem.cIdx}
            className={cn(
              "h-9 rounded-full px-5 font-bold gap-2 transition-all text-[10px]",
              savedIdx === activeItem.cIdx ? "bg-emerald-500 text-white" : "bg-[#250136] text-white hover:bg-primary"
            )}
          >
            {isSaving === activeItem.cIdx ? <div className="w-3 h-3 border-2 border-white/30 border-t-white animate-spin rounded-full" /> : <Save className="w-3.5 h-3.5" />}
            {savedIdx === activeItem.cIdx ? "SUCCÈS" : "ENREGISTRER"}
          </Button>
        </div>
      </div>

      {/* 2. Main 3-Pane Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT: Outline/Tree */}
        <div className="w-[280px] border-r border-[#250136]/5 bg-slate-50/50 flex flex-col">
          <div className="p-4 border-b border-[#250136]/5">
            <input 
              placeholder="Chercher une section..." 
              className="w-full bg-white border border-[#250136]/10 rounded-xl px-3 py-2 text-[10px] font-bold outline-none focus:ring-2 focus:ring-primary/20"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Toolbar Icons */}
            <div className="w-12 border-r border-[#250136]/5 flex flex-col items-center py-6 gap-5 bg-white/20">
               <button onClick={addChapter} className="w-7 h-7 rounded-lg bg-[#250136] text-white flex items-center justify-center font-black text-[9px] hover:scale-110 transition-transform shadow-md">CH</button>
               <button onClick={() => {
                 const newSections = [...(activeChapter?.sections || []), { title: '', content: '', subsections: [] }];
                 updateChapter(activeItem.cIdx, 'sections', newSections);
               }} className="w-7 h-7 rounded-full border-2 border-primary/20 text-primary flex items-center justify-center font-black text-[10px] hover:bg-primary hover:text-white transition-all">I</button>
               <button onClick={() => {
                 if (activeItem.type === 'section') {
                   const newSections = [...activeChapter.sections];
                   if (!newSections[activeItem.sIdx!].subsections) newSections[activeItem.sIdx!].subsections = [];
                   newSections[activeItem.sIdx!].subsections!.push({ title: '', content: '', subsections: [] });
                   updateChapter(activeItem.cIdx, 'sections', newSections);
                 }
               }} className="w-7 h-7 rounded-lg border-2 border-emerald-200 text-emerald-600 flex items-center justify-center font-black text-[10px] hover:bg-emerald-500 hover:text-white transition-all">1</button>
               <button onClick={() => {
                 if (activeItem.type === 'subsection') {
                    const newSections = [...activeChapter.sections];
                    const ss = newSections[activeItem.sIdx!].subsections![activeItem.ssIdx!];
                    if (!ss.subsections) ss.subsections = [];
                    ss.subsections.push({ title: '', content: '' });
                    updateChapter(activeItem.cIdx, 'sections', newSections);
                 }
               }} className="w-7 h-7 rounded-lg border-2 border-blue-200 text-blue-600 flex items-center justify-center font-black text-[10px] hover:bg-blue-500 hover:text-white transition-all">a</button>
            </div>

            {/* Tree */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#250136]/20 mb-3 block px-1">Navigation</span>
              <div className="space-y-4">
                {chaptersConfig.map((ch, cIdx) => (
                  <div key={cIdx} className="space-y-1">
                    <div 
                      onClick={() => setActiveItem({ type: 'chapter-intro', cIdx })}
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all",
                        activeItem.cIdx === cIdx && activeItem.type === 'chapter-intro' ? "bg-white shadow-sm ring-1 ring-[#250136]/5" : "hover:bg-white/40"
                      )}
                    >
                      <div className="w-4 h-4 rounded-md bg-[#250136] text-white flex items-center justify-center text-[8px] font-black">{cIdx + 1}</div>
                      <span className={cn("text-[11px] font-bold truncate", activeItem.cIdx === cIdx && activeItem.type === 'chapter-intro' ? "text-primary" : "text-[#250136]/60")}>
                        {ch.title || `Chap ${cIdx + 1}`}
                      </span>
                    </div>

                    <div className="ml-3 pl-2 border-l border-[#250136]/5 space-y-1">
                      {ch.sections.map((sec, sIdx) => (
                        <div key={sIdx} className="space-y-1">
                          <div 
                            onClick={() => setActiveItem({ type: 'section', cIdx, sIdx })}
                            className={cn(
                              "flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer transition-all text-[10px] font-bold",
                              activeItem.cIdx === cIdx && activeItem.type === 'section' && activeItem.sIdx === sIdx ? "text-primary bg-white shadow-sm" : "text-slate-400 hover:text-[#250136]"
                            )}
                          >
                            <span className="opacity-30">Ⅰ.</span> {sec.title || "Section..."}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CENTER: Editor */}
        <div className="flex-1 bg-white shadow-[inset_0_0_50px_rgba(0,0,0,0.02)] flex flex-col">
          <div className="p-10 max-w-2xl mx-auto w-full flex-1 overflow-y-auto custom-scrollbar space-y-8">
            <div className="space-y-1">
               <span className="text-[10px] font-black text-primary uppercase tracking-widest">{activeItem.type.replace('-', ' ')}</span>
               <input 
                 value={title}
                 onChange={e => updateActiveContent({ title: e.target.value })}
                 placeholder="Titre de l'élément..."
                 className="w-full text-4xl font-black text-[#250136] outline-none placeholder:text-slate-100"
               />
            </div>

            <div className="space-y-4">
               <Textarea 
                 value={content}
                 onChange={e => e.target.value.length <= MAX_CHARS && updateActiveContent({ content: e.target.value })}
                 placeholder="Commencez à rédiger..."
                 className="min-h-[400px] text-lg leading-relaxed border-none shadow-none focus-visible:ring-0 p-0 resize-none font-medium text-slate-700 pb-10"
               />

               <ImageManager 
                 images={images} 
                 onUpdate={imgs => updateActiveContent({ images: imgs })}
               />
               <TableManager 
                 tables={tables}
                 onUpdate={tbls => updateActiveContent({ tables: tbls })}
               />
            </div>
          </div>
          
          <div className="h-10 border-t border-slate-50 flex items-center justify-between px-8 text-[9px] font-black text-slate-300 tracking-widest bg-white">
             <span>{content.length} / {MAX_CHARS} CARACTÈRES</span>
             <span className="text-primary/40 italic">BROUILLON AUTOMATIQUE</span>
          </div>
        </div>

        {/* RIGHT: Live Preview */}
        <div className="w-[380px] border-l border-[#250136]/5 bg-[#fcfbf9] overflow-y-auto custom-scrollbar p-10">
           <div className="flex items-center justify-between mb-8">
              <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Live Preview</span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 rounded-full border border-emerald-100">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-black text-emerald-600 uppercase">Synchronisé</span>
              </div>
           </div>

           <div className="bg-white p-8 rounded-2xl shadow-xl shadow-[#250136]/5 border border-white space-y-6">
              <h2 className="text-xl font-black text-[#250136] border-b-2 border-[#250136]/5 pb-4">
                {activeChapter?.title || "Chapitre sans titre"}
              </h2>
              <div className="text-xs leading-relaxed text-slate-600 space-y-4 text-justify">
                 <p className="font-medium bg-slate-50 p-3 rounded-lg border-l-4 border-primary text-[11px] italic mb-6">{activeChapter?.introduction}</p>
                 
                 {activeChapter?.sections.map((s, si) => (
                   <div key={si} className="space-y-3">
                      <h3 className="font-black text-[#250136] text-[13px] mt-8 flex gap-2">
                        <span className="text-primary">{toRoman(si + 1)}.</span> {s.title}
                      </h3>
                      <p className="whitespace-pre-wrap">{s.content}</p>
                      
                      {s.images?.map((img, imi) => (
                        <div key={imi} className="my-6">
                           <img src={img.src} className="w-full rounded-xl shadow-xl border border-slate-100" />
                           <p className="text-center text-[9px] mt-2 italic text-slate-400">Fig {si+1}.{imi+1} — {img.caption}</p>
                        </div>
                      ))}

                      {s.subsections?.map((ss, ssi) => (
                        <div key={ssi} className="pl-5 border-l-2 border-slate-100 space-y-3 mt-4">
                          <h4 className="font-bold text-[#250136] text-[11px] flex gap-2">
                            <span className="text-emerald-500">{ssi + 1}.</span> {ss.title}
                          </h4>
                          <p className="text-slate-500 whitespace-pre-wrap">{ss.content}</p>

                          {ss.subsections?.map((sss, sssi) => (
                            <div key={sssi} className="pl-4 border-l border-slate-50 space-y-2 mt-2">
                              <h5 className="font-bold text-[#250136] text-[10px] flex gap-2 italic">
                                <span className="text-blue-400">{String.fromCharCode(97 + sssi)}.</span> {sss.title}
                              </h5>
                              <p className="text-slate-400 text-[11px]">{sss.content}</p>
                            </div>
                          ))}
                        </div>
                      ))}
                   </div>
                 ))}
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}


