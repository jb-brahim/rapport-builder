'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, GripVertical, Layers, Save, ChevronDown, ChevronRight, Hash, Type, AlignLeft, ImagePlus, Check, PanelLeftClose, PanelLeft } from 'lucide-react';
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

const INDEXING_PRESETS = {
  academic: { l1: (i: number) => toRoman(i + 1) + '.', l2: (i: number) => (i + 1) + '.', l3: (i: number) => String.fromCharCode(97 + i) + '.' },
  numeric: { l1: (i: number) => (i + 1), l2: (i: number, p: string) => p + '.' + (i + 1), l3: (i: number, p: string) => p + '.' + (i + 1) },
  bullets: { l1: () => '●', l2: () => '○', l3: () => '■' },
  arrows: { l1: () => '➔', l2: () => '➤', l3: () => '■' },
  stars: { l1: () => '★', l2: () => '✧', l3: () => '❖' },
  modern: { l1: () => '➢', l2: () => '○', l3: () => '▪' },
};

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
  const [isOpen, setIsOpen] = useState(false);

  const addTable = () => {
    const newTbl: TableData = {
      headers: ['Col 1', 'Col 2', 'Col 3'],
      rows: [['Cell', 'Cell', 'Cell'], ['Cell', 'Cell', 'Cell']],
      caption: ''
    };
    onUpdate([...tables, newTbl]);
    setIsOpen(true);
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
    <div className="space-y-4 pt-4 border-t border-[#250136]/5">
      <div className="flex items-center justify-between">
         <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#250136]/50 ml-1 hover:text-primary transition-colors outline-none cursor-pointer">
           {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
           <Layers className="w-3 h-3" /> Tableaux de Données <span className="opacity-50">({tables.length})</span>
         </button>
         
         {isOpen && (
           <Button 
             onClick={addTable}
             variant="ghost" 
             size="sm" 
             className="h-7 text-[9px] font-bold gap-1.5 border border-dashed rounded-lg hover:border-emerald-400 hover:text-emerald-500"
           >
             <Plus className="w-3 h-3" /> AJOUTER TABLEAU
           </Button>
         )}
      </div>

      {isOpen && tables.map((tbl, tIdx) => (
        <div key={tIdx} className="bg-slate-50/50 border border-black/5 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Tableau {tIdx + 1}</span>
                 <code className="text-[8px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-bold border border-emerald-100">[TABLEAU {tIdx + 1}]</code>
              </div>
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
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-4 pt-4 border-t border-[#250136]/5">
      <div className="flex items-center justify-between">
         <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#250136]/50 ml-1 hover:text-primary transition-colors outline-none cursor-pointer">
           {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
           <ImagePlus className="w-3 h-3" /> Illustrations & Figures <span className="opacity-50">({images.length})</span>
         </button>
         
         {isOpen && (
           <div className="relative">
              <input 
                type="file" 
                accept="image/*" 
                className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                onChange={(e) => {
                  handleImageUpload(e, images, onUpdate);
                  setIsOpen(true);
                }}
              />
              <Button variant="ghost" size="sm" className="h-7 text-[9px] font-bold gap-1.5 border border-dashed rounded-lg hover:border-blue-400 hover:text-blue-500">
                <Plus className="w-3 h-3" /> AJOUTER FIGURE
              </Button>
           </div>
         )}
      </div>

      {isOpen && images.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {images.map((img, i) => (
            <div key={i} className="group relative bg-white border border-black/5 rounded-2xl p-3 shadow-sm hover:shadow-md transition-all">
              <div className="group relative rounded-xl border-2 border-dashed border-slate-200 overflow-hidden bg-slate-50 aspect-video flex flex-col justify-between">
                <div className="absolute top-2 left-2 z-10">
                   <code className="text-[8px] bg-white/90 backdrop-blur-sm text-blue-600 px-1.5 py-0.5 rounded shadow-sm font-bold border border-blue-100">[FIGURE {i + 1}]</code>
                </div>
                <img src={img.src} alt="img" className="w-full h-full object-cover absolute inset-0 opacity-40 group-hover:opacity-100 transition-opacity" />
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

const RenderSmartContent = ({ content, images = [], tables = [], sectionIndex }: { content: string, images?: any[], tables?: any[], sectionIndex: number }) => {
  if (!content && !images.length && !tables.length) return null;

  const usedFigures = new Set<number>();
  const usedTables = new Set<number>();

  const parts = content.split(/(\[FIGURE \d+\]|\[TABLEAU \d+\])/i);

  const renderImage = (img: any, idx: number, key: string) => (
    <div key={key} className="my-10 flex flex-col items-center w-full clear-both">
       <img src={img.src} className="max-w-[85%] border border-slate-200" />
       <p className="text-center text-[9px] mt-4 text-slate-400 font-serif">Figure {sectionIndex+1}.{idx+1} — {img.caption}</p>
    </div>
  );

  const renderTable = (tbl: any, idx: number, key: string) => (
    <div key={key} className="my-10 w-full flex flex-col items-center clear-both overflow-x-auto">
       <table className="w-[90%] text-[10px] border-collapse bg-white shadow-sm border border-slate-200">
         <thead>
           <tr className="bg-slate-50">
             {tbl.headers.map((h: string, i: number) => <th key={i} className="border border-slate-200 p-2 text-center text-slate-700 font-bold">{h}</th>)}
           </tr>
         </thead>
         <tbody>
           {tbl.rows.map((row: string[], r: number) => (
             <tr key={r}>
               {row.map((cell: string, c: number) => <td key={c} className="border border-slate-200 p-2 text-center text-slate-600">{cell}</td>)}
             </tr>
           ))}
         </tbody>
       </table>
       <p className="text-center text-[9px] mt-4 text-slate-400 font-serif">Tableau {sectionIndex+1}.{idx+1} — {tbl.caption}</p>
    </div>
  );

  const blockElements = parts.map((part, i) => {
    const figMatch = part.match(/\[FIGURE (\d+)\]/i);
    if (figMatch) {
       const idx = parseInt(figMatch[1]) - 1;
       usedFigures.add(idx);
       if (images[idx]) return renderImage(images[idx], idx, `fig-${i}`);
       return <span key={i} className="text-red-400 font-bold bg-red-50/50 px-1 rounded mx-1">{part} (Introuvable)</span>;
    }

    const tabMatch = part.match(/\[TABLEAU (\d+)\]/i);
    if (tabMatch) {
       const idx = parseInt(tabMatch[1]) - 1;
       usedTables.add(idx);
       if (tables[idx]) return renderTable(tables[idx], idx, `tab-${i}`);
       return <span key={i} className="text-red-400 font-bold bg-red-50/50 px-1 rounded mx-1">{part} (Introuvable)</span>;
    }

    return <span key={i} className="whitespace-pre-wrap">{part}</span>;
  });

  const unusedImages = images.map((img, i) => !usedFigures.has(i) ? renderImage(img, i, `ufig-${i}`) : null);
  const unusedTables = tables.map((tbl, i) => !usedTables.has(i) ? renderTable(tbl, i, `utab-${i}`) : null);

  return (
    <div className="w-full text-slate-600 block">
      {blockElements}
      {unusedImages}
      {unusedTables}
    </div>
  );
};

export default function StepSix({ rapportId, chaptersConfig, setChaptersConfig, apiClient, formData }: StepSixProps) {
  const { t, language } = useTranslation();
  const [isSaving, setIsSaving] = useState<number | null>(null);
  const [savedIdx, setSavedIdx] = useState<number | null>(null);
  const [indexingStyle, setIndexingStyle] = useState<keyof typeof INDEXING_PRESETS>('academic');
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const [activeItem, setActiveItem] = useState<{
    type: 'chapter-intro' | 'chapter-conclusion' | 'section' | 'subsection' | 'sub-subsection';
    cIdx: number;
    sIdx?: number;
    ssIdx?: number;
    sssIdx?: number;
  }>({ type: 'chapter-intro', cIdx: 0 });

  const getPrefix = (level: 1 | 2 | 3, index: number, pIndex?: number, ppIndex?: number) => {
    const style = INDEXING_PRESETS[indexingStyle];
    if (level === 1) return style.l1(index);
    if (level === 2) {
      const parentPrefix = indexingStyle === 'numeric' ? (pIndex! + 1).toString() : '';
      return (style as any).l2(index, parentPrefix);
    }
    if (level === 3) {
      const parentPrefix = indexingStyle === 'numeric' ? (pIndex! + 1) + '.' + (ppIndex! + 1) : '';
      return (style as any).l3(index, parentPrefix);
    }
    return '';
  };

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
    <div className="flex w-full h-[780px] bg-white border border-[#250136]/10 rounded-[2rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(37,1,54,0.1)] transition-all duration-700">
      
      {/* 1. Outline Pane (Left) */}
      <div className={cn(
        "border-r border-[#250136]/5 bg-slate-50/50 flex flex-col shrink-0 transition-all duration-300",
        isSidebarOpen ? "w-[300px]" : "w-14"
      )}>
        
        {/* Outline Header */}
        <div className={cn("h-[60px] flex items-center border-b border-[#250136]/5 bg-white/40 backdrop-blur-md shrink-0 relative", isSidebarOpen ? "justify-between px-5" : "justify-center")}>
          {isSidebarOpen && <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#250136]/40">Structure</span>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-[#250136] transition-colors">
            {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </button>

          {showStyleMenu && (
            <div className="absolute top-[50px] left-[70px] w-[260px] z-50 bg-white/95 backdrop-blur-xl border border-[#250136]/10 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-2xl p-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Hierarchy Presets</span>
                <button onClick={() => setShowStyleMenu(false)} className="text-slate-300 hover:text-red-400 transition-colors">×</button>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'academic', label: 'Academic', desc: 'I. / 1. / a.' },
                  { id: 'numeric', label: 'Technical', desc: '1 / 1.1 / 1.1.1' },
                  { id: 'bullets', label: 'Classic Bullets', desc: '● / ○ / ■' },
                  { id: 'arrows', label: 'Directional', desc: '➔ / ➤ / ■' },
                  { id: 'stars', label: 'Geometric', desc: '★ / ✧ / ❖' },
                  { id: 'modern', label: 'Minimalist', desc: '➢ / ○ / ▪' },
                ].map((s) => (
                  <button 
                    key={s.id}
                    onClick={() => { setIndexingStyle(s.id as any); setShowStyleMenu(false); }}
                    className={cn(
                      "group flex items-center justify-between p-2.5 rounded-xl border transition-all duration-300 w-full",
                      indexingStyle === s.id ? "border-primary bg-primary/5 shadow-inner" : "border-slate-100 hover:border-primary/30 hover:bg-slate-50"
                    )}
                  >
                    <span className={cn("text-[10px] font-black uppercase tracking-tighter transition-colors", indexingStyle === s.id ? "text-primary" : "text-slate-400 group-hover:text-slate-600")}>{s.label}</span>
                    <span className="text-[9px] font-medium text-slate-300">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Level Icons Toolbar */}
          <div className="w-14 border-r border-[#250136]/5 flex flex-col items-center py-6 gap-4 bg-white/20 relative">
             <button onClick={() => setShowStyleMenu(!showStyleMenu)} className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-all mb-4 outline-none", showStyleMenu ? "bg-primary text-white shadow-md" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600")} title="Style Settings">
               <Layers className="w-4 h-4" />
             </button>
             
             <div className="w-6 h-[1px] bg-[#250136]/5 mb-2" />

             <button onClick={addChapter} className="w-8 h-8 rounded-xl bg-[#250136] text-white flex items-center justify-center font-black text-xs hover:scale-110 transition-transform shadow-lg shadow-[#250136]/20" title="Add Chapter">CH</button>
             <button onClick={() => {
               const newSections = [...(activeChapter?.sections || []), { title: '', content: '', subsections: [] }];
               updateChapter(activeItem.cIdx, 'sections', newSections);
             }} className="w-8 h-8 rounded-full border-2 border-primary/20 text-primary flex items-center justify-center font-black text-[11px] hover:bg-primary hover:text-white transition-all" title="Add Section">Ⅰ</button>
             <button onClick={() => {
               if (activeItem.type === 'section') {
                 const newSections = [...activeChapter.sections];
                 if (!newSections[activeItem.sIdx!].subsections) newSections[activeItem.sIdx!].subsections = [];
                 newSections[activeItem.sIdx!].subsections!.push({ title: '', content: '', subsections: [] });
                 updateChapter(activeItem.cIdx, 'sections', newSections);
               }
             }} className="w-8 h-8 rounded-lg border-2 border-emerald-100 text-emerald-600 flex items-center justify-center font-black text-[11px] hover:bg-emerald-500 hover:text-white transition-all" title="Add Subsection">1</button>
             <button onClick={() => {
               if (activeItem.type === 'subsection') {
                  const newSections = [...activeChapter.sections];
                  const ss = newSections[activeItem.sIdx!].subsections![activeItem.ssIdx!];
                  if (!ss.subsections) ss.subsections = [];
                  ss.subsections.push({ title: '', content: '' } as any);
                  updateChapter(activeItem.cIdx, 'sections', newSections);
               }
             }} className="w-8 h-8 rounded-lg border-2 border-blue-100 text-blue-600 flex items-center justify-center font-black text-[11px] hover:bg-blue-500 hover:text-white transition-all" title="Add Sub-subsection">a</button>
          </div>

          {/* Tree Navigation */}
          {isSidebarOpen && (
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
            <div className="space-y-2">
              {chaptersConfig.map((ch, cIdx) => (
                <div key={cIdx} className="space-y-0.5">
                  <div 
                    onClick={() => setActiveItem({ type: 'chapter-intro', cIdx })}
                    className={cn(
                      "flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer transition-all",
                      activeItem.cIdx === cIdx && activeItem.type === 'chapter-intro' ? "bg-white shadow-sm ring-1 ring-[#250136]/5" : "hover:bg-white/40"
                    )}
                  >
                    <div className="w-4 h-4 rounded-md bg-[#250136] text-white flex items-center justify-center text-[8px] font-black">{cIdx + 1}</div>
                    <span className={cn("text-[11px] font-bold truncate", activeItem.cIdx === cIdx && activeItem.type === 'chapter-intro' ? "text-primary" : "text-[#250136]/60")}>
                      {ch.title || `Chapter ${cIdx + 1}`}
                    </span>
                  </div>

                  <div className="ml-2 pl-2 border-l border-[#250136]/10 space-y-0.5">
                    {ch.sections.map((sec, sIdx) => (
                      <div key={sIdx} className="space-y-0.5">
                        <div 
                          onClick={() => setActiveItem({ type: 'section', cIdx, sIdx })}
                          className={cn(
                            "flex items-center gap-2 px-2.5 py-1 rounded-lg cursor-pointer transition-all text-[10px] font-bold",
                            activeItem.cIdx === cIdx && activeItem.type === 'section' && activeItem.sIdx === sIdx ? "text-primary bg-white shadow-sm" : "text-slate-500 hover:text-[#250136]"
                          )}
                        >
                          <span className="opacity-40">{getPrefix(1, sIdx)}</span> <span className="truncate">{sec.title || "Section..."}</span>
                        </div>
                        
                        {sec.subsections?.map((ss, ssIdx) => (
                          <div key={ssIdx} className="space-y-0.5">
                            <div 
                              onClick={() => setActiveItem({ type: 'subsection', cIdx, sIdx, ssIdx })}
                              className={cn(
                                "ml-3 px-2 py-[3px] rounded-md cursor-pointer transition-all text-[10px] font-medium border-l border-transparent flex items-center",
                                activeItem.cIdx === cIdx && activeItem.type === 'subsection' && activeItem.ssIdx === ssIdx ? "text-emerald-600 bg-white shadow-sm" : "text-slate-400 hover:text-emerald-500"
                              )}
                            >
                              <span className="opacity-40 mr-1.5">{getPrefix(2, ssIdx, sIdx)}</span> <span className="truncate">{ss.title || "Subsection..."}</span>
                            </div>
                            
                            {ss.subsections?.map((sss, sssIdx) => (
                              <div 
                                key={sssIdx}
                                onClick={() => setActiveItem({ type: 'sub-subsection', cIdx, sIdx, ssIdx, sssIdx })}
                                className={cn(
                                  "ml-5 px-2 py-[2px] rounded-md cursor-pointer transition-all text-[9px] font-medium opacity-70 flex items-center",
                                  activeItem.cIdx === cIdx && activeItem.type === 'sub-subsection' && activeItem.sssIdx === sssIdx ? "text-blue-600 bg-white shadow-sm opacity-100" : "text-slate-400 hover:text-blue-500 hover:opacity-100"
                                )}
                              >
                                <span className="opacity-40 mr-1.5">{getPrefix(3, sssIdx, ssIdx, sIdx)}</span> <span className="truncate">{sss.title || "Detail..."}</span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}
        </div>
      </div>

      {/* 2. Editor Pane (Center) */}
      <div className="flex-1 bg-white shadow-[inset_0_0_80px_rgba(0,0,0,0.01)] flex flex-col">
        <div className="p-16 max-w-3xl mx-auto w-full flex-1 overflow-y-auto custom-scrollbar space-y-10">
          <div className="space-y-2">
             <span className="text-[11px] font-black text-primary uppercase tracking-[0.3em]">{activeItem.type.replace('-', ' ')}</span>
             <input 
               value={title}
               onChange={e => updateActiveContent({ title: e.target.value })}
               placeholder="Write heading..."
               className="w-full text-5xl font-black text-[#250136] outline-none placeholder:text-slate-100 selection:bg-primary/10 transition-all"
             />
          </div>

          <div className="space-y-8">
             <Textarea 
               value={content}
               onChange={e => e.target.value.length <= MAX_CHARS && updateActiveContent({ content: e.target.value })}
               placeholder="Write your content here..."
               className="w-full min-h-[120px] bg-slate-50 border border-slate-200/60 rounded-xl text-sm leading-[1.8] focus-visible:ring-1 focus-visible:ring-primary/20 p-5 resize-y font-medium text-slate-600 selection:bg-primary/10 shadow-inner break-words"
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
        
        <div className="h-12 border-t border-[#250136]/5 flex items-center justify-between px-10 text-[10px] font-black text-slate-300 tracking-[0.2em] bg-white/50 backdrop-blur-sm">
           <div className="flex items-center gap-4">
             <span>{content.length} / {MAX_CHARS} CHARS</span>
             <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
             <span>{content.split(/\s+/).filter(Boolean).length} WORDS</span>
           </div>
           
           <div className="flex items-center gap-6">
             <span className="text-primary/40 italic">AUTO-SYNC ENABLED</span>
             <Button 
               onClick={() => saveChapter(activeItem.cIdx)}
               disabled={isSaving === activeItem.cIdx}
               className={cn(
                 "h-8 px-5 rounded-full text-[10px] font-black transition-all",
                 savedIdx === activeItem.cIdx ? "bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20" : "bg-[#250136] hover:bg-primary shadow-lg shadow-[#250136]/20"
               )}
             >
               {isSaving === activeItem.cIdx ? "SAVING..." : savedIdx === activeItem.cIdx ? "SAVED!" : "SAVE MANUALLY"}
             </Button>
           </div>
        </div>
      </div>

      {/* 3. Preview Pane (Right) - Visual PDF Viewer */}
      <div className={cn(
        "shrink-0 bg-[#e2e4e9] overflow-y-auto custom-scrollbar p-8 transition-all duration-300",
        isSidebarOpen ? "w-[420px]" : "w-[600px]"
      )}>
         <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">Visual Preview</span>
         </div>

         <div className="bg-white w-full aspect-[1/1.414] mx-auto p-10 shadow-md border border-slate-300 font-serif text-slate-800 relative z-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
            
            <h2 className="text-[13px] font-bold text-red-600 uppercase text-center mb-20 tracking-wider">
              {activeChapter?.title ? `CHAPITRE ${activeItem.cIdx + 1}: ${activeChapter.title}` : `CHAPITRE ${activeItem.cIdx + 1}:`}
            </h2>
            
            <div className="text-[10px] leading-[2.5] space-y-10 text-justify">
               {activeChapter?.introduction && (
                 <p className="text-slate-600 mb-12">{activeChapter.introduction}</p>
               )}
               
               {activeChapter?.sections.map((s, si) => (
                 <div key={si} className="space-y-6 mt-16">
                    <h3 className="font-bold text-red-600 text-[11px] uppercase tracking-wide flex gap-2">
                      <span>{getPrefix(1, si)}</span> 
                      <span>{s.title}</span>
                    </h3>
                    
                    <RenderSmartContent content={s.content} images={s.images} tables={s.tables} sectionIndex={si} />

                    {s.subsections?.map((ss, ssi) => (
                      <div key={ssi} className="pl-6 space-y-6 mt-10">
                        <h4 className="font-bold text-emerald-600 text-[10px] flex gap-2">
                          <span>{getPrefix(2, ssi, si)}</span> {ss.title}
                        </h4>
                        
                        <RenderSmartContent content={ss.content} images={ss.images} tables={ss.tables} sectionIndex={si} />

                        {ss.subsections?.map((sss, sssi) => (
                          <div key={sssi} className="pl-6 space-y-4 mt-8">
                            <h5 className="font-bold text-black text-[10px] flex gap-2">
                              <span>{getPrefix(3, sssi, ssi, si)}</span> {sss.title}
                            </h5>
                            <RenderSmartContent content={sss.content} images={sss.images} tables={sss.tables} sectionIndex={si} />
                          </div>
                        ))}
                      </div>
                    ))}
                 </div>
               ))}
               
               {activeChapter?.conclusion && (
                 <div className="pt-12 mt-16 text-center">
                    <p className="text-slate-600 italic">{activeChapter.conclusion}</p>
                 </div>
               )}
            </div>
            
            {/* Mock Page Number at bottom */}
            <div className="absolute bottom-10 left-0 right-0 text-center text-[8px] font-bold text-slate-400 font-sans">
              {activeItem.cIdx + 2}
            </div>
         </div>
      </div>

    </div>
  );
}
