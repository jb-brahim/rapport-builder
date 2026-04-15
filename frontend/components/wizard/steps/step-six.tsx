'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, GripVertical, Layers, Save, ChevronDown, ChevronRight, Hash, Type, AlignLeft, ImagePlus, Check, PanelLeftClose, PanelLeft, Table as TableIcon, Palette } from 'lucide-react';
import { GrammarChecker } from '@/components/grammar-checker';
import { useTranslation } from '@/app/context/language-context';
import { cn } from '@/lib/utils';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

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
const A4_WIDTH = 794; // 210mm at 96dpi
const A4_HEIGHT = 1123; // 297mm at 96dpi
const A4_MARGIN = 80;

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

const ESTIMATE_PX_PER_LINE = 26;
const ESTIMATE_CHARS_PER_LINE = 75;

const estimateContentHeight = (content: any, type: string) => {
  if (type === 'image') return 480; 
  if (type === 'heading') return 100;
  if (type === 'table') return 300; 
  if (type === 'raw') return 160; // For chapter headers
  
  if (typeof content !== 'string') return 50;
  
  const textOnly = content.replace(/<[^>]*>/g, '');
  const lines = Math.max(1, Math.ceil(textOnly.length / ESTIMATE_CHARS_PER_LINE));
  return lines * ESTIMATE_PX_PER_LINE + 30; 
};



const RenderSegment = ({ segment, sectionIndex }: { segment: any, sectionIndex: number }) => {
   const { type, content, images, tables, caption } = segment;

   if (type === 'image') {
     return (
        <div className="my-10 flex flex-col items-center w-full clear-both group">
           <div className="relative border-[0.5px] border-slate-300 shadow-sm overflow-hidden bg-slate-50">
             <img src={content} className="max-w-full" style={{ maxHeight: '400px' }} />
           </div>
           {caption && (
             <p className="text-center text-[10px] mt-4 text-slate-500 font-serif italic font-medium tracking-tight">
               {caption}
             </p>
           )}
        </div>
     );
   }

   if (type === 'table') {
     let tbl = { headers: [], rows: [], caption: "" };
     try {
       const [h, ...r] = JSON.parse(content);
       tbl = { headers: h, rows: r, caption: caption || "" };
     } catch(e) {}

     return (
        <div className="my-10 w-full flex flex-col items-center clear-both group">
           <div className="w-[95%] border-[0.5px] border-slate-300 shadow-sm bg-white overflow-hidden">
             <table className="w-full text-[10px] border-collapse">
               <thead>
                 <tr className="bg-slate-50 border-b border-slate-200">
                   {tbl.headers.map((h: string, i: number) => (
                     <th key={i} className="border-r border-slate-200 p-2 text-center text-slate-800 font-bold last:border-0">{h}</th>
                   ))}
                 </tr>
               </thead>
               <tbody>
                 {tbl.rows.map((row: string[], r: number) => (
                   <tr key={r} className="border-b border-slate-100 last:border-0">
                     {row.map((cell: string, c: number) => (
                       <td key={c} className="border-r border-slate-100 p-2 text-center text-slate-600 last:border-0">{cell}</td>
                     ))}
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
           {tbl.caption && (
             <p className="text-center text-[10px] mt-4 text-slate-500 font-serif italic font-medium tracking-tight">
               {tbl.caption}
             </p>
           )}
        </div>
     );
   }

   if (type === 'heading') {
      const isConclusion = content?.toLowerCase().includes('conclusion');
      return (
        <h3 className={cn(
          "font-rapport font-black uppercase mb-6 flex gap-3", 
          isConclusion ? "text-slate-900" : (segment.level === 1 ? "text-[#DC2626]" : "text-emerald-600"),
          segment.level === 1 ? "text-[13pt] mt-12" : "text-[12pt] mt-8"
        )}>
           {content}
        </h3>
      );
   }

   return (
      <div className="whitespace-pre-wrap leading-[2.2] font-rapport text-[11pt] text-slate-800 mb-6">
        {content}
      </div>
   );
};

const paginateChapter = (chapter: Chapter, chapIdx: number) => {
  const MAX_Y = A4_HEIGHT - (A4_MARGIN * 2);
  const pages: any[][] = [[]];
  let curY = 0;

  const pushToPage = (seg: any) => {
    const h = estimateContentHeight(seg.content || '', seg.type);
    if (curY + h > MAX_Y && pages[pages.length-1].length > 0) {
      pages.push([]);
      curY = 0;
    }
    pages[pages.length - 1].push(seg);
    curY += h;
  };

  const parseAndPush = (content: string, images: any[] = [], tables: any[] = [], sectionPrefix: string) => {
    if (!content) return;
    const parts = content.split(/(\[FIGURE \d+\]|\[TABLEAU \d+\])/i);
    parts.forEach((part) => {
      const figMatch = part.match(/\[FIGURE (\d+)\]/i);
      if (figMatch) {
        const idx = parseInt(figMatch[1]) - 1;
        if (images[idx]) {
          pushToPage({ type: 'image', content: images[idx].src, caption: `Figure ${sectionPrefix}.${idx+1} — ${images[idx].caption || "Sans titre"}` });
        } else {
          pushToPage({ type: 'text', content: <span className="text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded text-[10px]">{part} (Réf. Invalide)</span> });
        }
        return;
      }
      const tabMatch = part.match(/\[TABLEAU (\d+)\]/i);
      if (tabMatch) {
        const idx = parseInt(tabMatch[1]) - 1;
        if (tables[idx]) {
          pushToPage({ type: 'table', content: JSON.stringify([tables[idx].headers, ...tables[idx].rows]), caption: `Tableau ${sectionPrefix}.${idx+1} — ${tables[idx].caption || "Sans titre"}` });
        } else {
          pushToPage({ type: 'text', content: <span className="text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded text-[10px]">{part} (Réf. Invalide)</span> });
        }
        return;
      }
      if (part.trim()) pushToPage({ type: 'text', content: part });
    });
  };

  // Chapter Header
  pushToPage({ 
    type: 'raw', 
    id: `ch-${chapIdx}-header`,
    content: (
      <div className="flex flex-col items-center mb-16">
        <h2 className="text-[16pt] font-black text-[#DC2626] uppercase text-center tracking-tight leading-tight">
          {chapter.title ? `CHAPITRE ${chapIdx + 1}: ${chapter.title}` : `CHAPITRE ${chapIdx + 1}`}
        </h2>
        <div className="w-16 h-1.5 bg-[#DC2626] mt-6 rounded-full opacity-10" />
      </div>
    )
  });

  // Introduction
  parseAndPush(chapter.introduction, chapter.images, chapter.tables, `${chapIdx + 1}.0`);

  // Sections
  chapter.sections.forEach((s, si) => {
    const sPrefix = `${si + 1}`;
    pushToPage({ type: 'heading', level: 1, content: `I. ${s.title}`, id: `preview-editor-${chapIdx}-${si}` });
    parseAndPush(s.content, s.images, s.tables, sPrefix);

    s.subsections?.forEach((ss, ssi) => {
      const ssPrefix = `${sPrefix}.${ssi + 1}`;
      pushToPage({ type: 'heading', level: 2, content: `${ssi + 1}. ${ss.title}`, id: `preview-editor-${chapIdx}-${si}-${ssi}` });
      parseAndPush(ss.content, ss.images, ss.tables, ssPrefix);

      ss.subsections?.forEach((sss, sssi) => {
        pushToPage({ type: 'heading', level: 2, content: `${String.fromCharCode(97 + sssi)}) ${sss.title}`, id: `preview-editor-${chapIdx}-${si}-${ssi}-${sssi}` });
        parseAndPush(sss.content, sss.images, sss.tables, `${ssPrefix}.${sssi + 1}`);
      });
    });
  });

  // Conclusion
  if (chapter.conclusion) {
     pushToPage({ type: 'raw', content: <div className="mt-16 pt-12 border-t border-slate-100 flex flex-col items-center"><div className="w-10 h-0.5 bg-slate-200 mb-8" /></div> });
     parseAndPush(chapter.conclusion, chapter.images, chapter.tables, `${chapIdx + 1}.C`);
  }

  return pages;
};


const AutoResizeTextarea = ({ value, onChange, onBlur, placeholder, className }: any) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = ref.current.scrollHeight + "px";
    }
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      className={className}
      rows={1}
    />
  );
};

const TableBlock = ({ tbl, tIdx, onUpdateTable, onDeleteTable }: any) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateHeaders = (hIdx: number, val: string) => {
    const newHeaders = [...tbl.headers];
    newHeaders[hIdx] = val;
    onUpdateTable({ ...tbl, headers: newHeaders });
  };

  const updateCell = (rIdx: number, cIdx: number, val: string) => {
    const newRows = [...tbl.rows];
    newRows[rIdx] = [...newRows[rIdx]];
    newRows[rIdx][cIdx] = val;
    onUpdateTable({ ...tbl, rows: newRows });
  };

  const addRow = () => {
    onUpdateTable({ ...tbl, rows: [...tbl.rows, Array(tbl.headers.length).fill('Cell')] });
  };

  const removeRow = (rIdx: number) => {
    onUpdateTable({ ...tbl, rows: tbl.rows.filter((_: any, i: number) => i !== rIdx) });
  };

  const addCol = () => {
    const newHeaders = [...tbl.headers, `Col ${tbl.headers.length + 1}`];
    const newRows = tbl.rows.map((row: any) => [...row, 'Cell']);
    onUpdateTable({ ...tbl, headers: newHeaders, rows: newRows });
  };

  const removeCol = (cIdx: number) => {
    if (tbl.headers.length <= 1) return;
    const newHeaders = tbl.headers.filter((_: any, i: number) => i !== cIdx);
    const newRows = tbl.rows.map((row: any) => row.filter((_: any, i: number) => i !== cIdx));
    onUpdateTable({ ...tbl, headers: newHeaders, rows: newRows });
  };

  return (
    <div className="bg-emerald-50/80 border border-emerald-100 rounded-xl mx-2 my-1 shadow-sm transition-all overflow-hidden flex flex-col group relative">
      <div 
         className="flex items-center justify-between p-2.5 hover:bg-emerald-50 cursor-pointer focus:outline-none"
         onClick={(e) => {
           if ((e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'BUTTON' && !(e.target as HTMLElement).closest('button')) {
              setIsExpanded(!isExpanded);
           }
         }}
      >
        <div className="flex items-center gap-4">
           <div className={cn("w-12 h-12 rounded-[5px] bg-white border flex flex-shrink-0 items-center justify-center shadow-xs transition-colors", isExpanded ? "border-emerald-400 text-emerald-600" : "border-emerald-200 text-emerald-500")}>
              <TableIcon className="w-5 h-5" />
           </div>
           <div>
             <div className="flex items-center gap-2">
               <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-tight">Tableau {tIdx + 1}</p>
               <span className="text-[8px] font-bold text-emerald-600/70 bg-emerald-100/50 px-1.5 py-0.5 rounded-md">{isExpanded ? 'Fermer' : 'Éditer contenu'}</span>
             </div>
             <input 
               value={tbl?.caption || ""}
               onChange={(e) => onUpdateTable({ ...tbl, caption: e.target.value })}
               placeholder="Titre du tableau..."
               className="text-[10px] font-bold text-emerald-500 bg-transparent border-0 outline-none placeholder:text-emerald-300 w-full min-w-[200px] p-0 focus:ring-0 leading-tight mt-0.5"
             />
           </div>
        </div>
        <button 
          onClick={() => onDeleteTable?.(tIdx)}
          className="w-7 h-7 flex items-center justify-center rounded-full text-red-500 hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100 absolute right-3"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {isExpanded && (
        <div className="p-3 border-t border-emerald-100/50 bg-white/50">
           <div className="overflow-x-auto rounded-xl border border-black/5 bg-white shadow-sm">
              <table className="w-full text-[10px] border-collapse">
                 <thead>
                    <tr className="bg-slate-50 border-b border-black/5">
                       {tbl.headers.map((header: string, hIdx: number) => (
                          <th key={hIdx} className="p-2 border-r border-black/5 last:border-0 group/th">
                             <div className="flex flex-col gap-1 relative">
                                <input 
                                   value={header} 
                                   onChange={(e) => updateHeaders(hIdx, e.target.value)}
                                   className="w-full bg-transparent font-bold text-center outline-none focus:text-blue-500"
                                />
                                <button 
                                  onClick={() => removeCol(hIdx)}
                                  className="w-4 h-4 flex items-center justify-center text-[10px] text-red-400 hover:bg-red-50 opacity-0 group-hover/th:opacity-100 absolute -top-1 -right-1 bg-white rounded-full shadow-sm font-black"
                                >
                                  ×
                                </button>
                             </div>
                          </th>
                       ))}
                       <th className="w-8 p-1">
                          <button onClick={addCol} className="w-6 h-6 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center font-bold">+</button>
                       </th>
                    </tr>
                 </thead>
                 <tbody>
                    {tbl.rows.map((row: string[], rIdx: number) => (
                       <tr key={rIdx} className="border-b border-black/[0.03] last:border-0 hover:bg-slate-50/50 transition-colors group/tr">
                          {row.map((cell: string, cIdx: number) => (
                             <td key={cIdx} className="p-2 border-r border-black/[0.03] last:border-0">
                                <input 
                                   value={cell} 
                                   onChange={(e) => updateCell(rIdx, cIdx, e.target.value)}
                                   className="w-full bg-transparent outline-none focus:text-blue-500 text-center"
                                />
                             </td>
                          ))}
                          <td className="p-1">
                             <button onClick={() => removeRow(rIdx)} className="w-6 h-6 rounded bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center opacity-0 group-hover/tr:opacity-100 transition-opacity">×</button>
                          </td>
                       </tr>
                    ))}
                    <tr>
                       <td colSpan={tbl.headers.length + 1} className="p-1">
                          <button onClick={addRow} className="w-full py-1 text-[8px] font-bold text-slate-400 hover:bg-slate-50 rounded transition-colors uppercase tracking-widest">+ Ajouter une ligne</button>
                       </td>
                    </tr>
                 </tbody>
              </table>
           </div>
        </div>
      )}
    </div>
  );
};

const SmartBlockEditor = ({ content, images = [], tables = [], onUpdateContent, onUpdateImages, onUpdateTables, onDeleteImage, onDeleteTable, setLastCursor }: any) => {
  const parts = (content || '').split(/(\[FIGURE \d+\]|\[TABLEAU \d+\])/i);
  if (parts.length === 0) parts.push("");
  
  return (
    <div className="w-full bg-slate-50 border border-slate-200/60 rounded-xl p-3 shadow-inner min-h-[120px] flex flex-col overflow-hidden transition-all">
      {parts.map((part: string, i: number) => {
        const isFigure = part.toUpperCase().startsWith('[FIGURE ');
        const isTable = part.toUpperCase().startsWith('[TABLEAU ');

        if (isFigure) {
          const idxMatch = part.match(/\d+/);
          const fIdx = idxMatch ? parseInt(idxMatch[0]) - 1 : -1;
          const img = images[fIdx];
          
          return (
             <div key={i} contentEditable={false} className="group relative flex items-center justify-between bg-blue-50/80 border border-blue-100 p-2.5 rounded-xl mx-2 my-1 shadow-sm transition-all hover:bg-blue-50">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-[5px] bg-white border border-blue-200 overflow-hidden flex-shrink-0 shadow-xs relative">
                      {img ? <img src={img.src} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-200" />}
                   </div>
                   <div>
                     <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-tight">Figure {fIdx + 1}</p>
                     <input 
                       value={img?.caption || ""}
                       onChange={(e) => {
                          const newImgs = [...images];
                          if (newImgs[fIdx]) newImgs[fIdx] = { ...newImgs[fIdx], caption: e.target.value };
                          onUpdateImages?.(newImgs);
                       }}
                       placeholder="Titre de la figure..."
                       className="text-[10px] font-bold text-blue-500 bg-transparent border-0 outline-none placeholder:text-blue-300 w-full min-w-[200px] p-0 focus:ring-0 leading-tight"
                     />
                   </div>
                </div>
                <button 
                  onClick={() => onDeleteImage?.(fIdx)}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-red-500 hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100 absolute right-3"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
             </div>
          );
        }

        if (isTable) {
          const idxMatch = part.match(/\d+/);
          const tIdx = idxMatch ? parseInt(idxMatch[0]) - 1 : -1;
          const tbl = tables[tIdx];

           return (
             <TableBlock 
               key={i} 
               tbl={tbl} 
               tIdx={tIdx} 
               onUpdateTable={(newTbl: any) => {
                 const newTbls = [...tables];
                 newTbls[tIdx] = newTbl;
                 onUpdateTables?.(newTbls);
               }} 
               onDeleteTable={onDeleteTable} 
             />
           );
        }

        return (
          <AutoResizeTextarea 
            key={i}
            value={part}
            onChange={(e: any) => { const p = [...parts]; p[i] = e.target.value; onUpdateContent(p.join("")); }}
            onBlur={(e: any) => setLastCursor({ partIndex: i, start: e.target.selectionStart, end: e.target.selectionEnd })}
            placeholder={parts.length === 1 ? "Write your content here..." : ""}
            className={cn(
              "w-full bg-transparent border-0 outline-none text-[13px] leading-[1.8] font-medium text-slate-600 resize-none overflow-hidden focus-visible:ring-0 px-3 py-1 selection:bg-primary/10",
              part.length === 0 ? "min-h-[28px] my-0.5 rounded-md focus:bg-white/50" : "h-fit"
            )}
          />
        );
      })}
    </div>
  );
};

export default function StepSix({ rapportId, chaptersConfig, setChaptersConfig, apiClient, formData }: StepSixProps) {
  const router = useRouter();
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

  const [lastCursor, setLastCursor] = useState<{ partIndex: number, start: number, end: number } | null>(null);

  const deleteImage = (fIdx: number) => {
    const { content, images } = getActiveContent();
    const newImgs = [...(images || [])];
    newImgs.splice(fIdx, 1);
    
    const updatedContent = (content || '').replace(/\[FIGURE (\d+)\]/gi, (match, nr) => {
       const n = parseInt(nr) - 1;
       if (n > fIdx) return `[FIGURE ${n}]`;
       if (n === fIdx) return ``;
       return match;
    });
    
    updateActiveContent({ content: updatedContent, images: newImgs });
  };

  const deleteTable = (tIdx: number) => {
    const { content, tables } = getActiveContent();
    const newTbls = [...(tables || [])];
    newTbls.splice(tIdx, 1);
    
    const updatedContent = (content || '').replace(/\[TABLEAU (\d+)\]/gi, (match, nr) => {
       const n = parseInt(nr) - 1;
       if (n > tIdx) return `[TABLEAU ${n}]`;
       if (n === tIdx) return ``;
       return match;
    });
    
    updateActiveContent({ content: updatedContent, tables: newTbls });
  };

  const insertTagAtCursor = (tag: string, additionalUpdates?: any) => {
    const { content } = getActiveContent();
    const parts = (content || '').split(/(\[FIGURE \d+\]|\[TABLEAU \d+\])/i);
    
    if (lastCursor === null || lastCursor.partIndex >= parts.length) {
       updateActiveContent({ content: (content || '') + "\n\n" + tag.trim() + "\n\n", ...additionalUpdates });
       return;
    }

    const { partIndex, start, end } = lastCursor;
    const targetText = parts[partIndex];
    const newTargetText = targetText.substring(0, start) + "\n\n" + tag.trim() + "\n\n" + targetText.substring(end);
    
    parts[partIndex] = newTargetText;
    updateActiveContent({ content: parts.join(''), ...additionalUpdates });
    setLastCursor(null);
  };

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
    const defaultConclusion = language === 'fr' ? 'Conclusion' : 'Conclusion';
    setChaptersConfig([
      ...chaptersConfig, 
      { 
        title: '', 
        introduction: '', 
        sections: [
          { title: defaultConclusion, content: '', subsections: [] }
        ], 
        conclusion: '' 
      }
    ]);
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

  const [previewScale, setPreviewScale] = useState(1);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      if (!entries[0]) return;
      const { width } = entries[0].contentRect;
      const availableWidth = width - 96; // Account for p-12 padding
      if (availableWidth < A4_WIDTH) {
        setPreviewScale(availableWidth / A4_WIDTH);
      } else {
        setPreviewScale(1);
      }
    });

    if (previewContainerRef.current) observer.observe(previewContainerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handler = () => {
      if (activeItem.cIdx !== undefined) {
        saveChapter(activeItem.cIdx);
      }
    };
    window.addEventListener('manual-save-trigger', handler);
    return () => window.removeEventListener('manual-save-trigger', handler);
  }, [activeItem.cIdx, chaptersConfig]);

  useEffect(() => {
    let targetId = `preview-chapter-${activeItem.cIdx}`;
    if (activeItem.type === 'section') targetId = `preview-editor-${activeItem.cIdx}-${activeItem.sIdx}`;
    if (activeItem.type === 'subsection') targetId = `preview-editor-${activeItem.cIdx}-${activeItem.sIdx}-${activeItem.ssIdx}`;
    if (activeItem.type === 'sub-subsection') targetId = `preview-editor-${activeItem.cIdx}-${activeItem.sIdx}-${activeItem.ssIdx}-${activeItem.sssIdx}`;

    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeItem.type, activeItem.cIdx, activeItem.sIdx, activeItem.ssIdx, activeItem.sssIdx]);

  const { title, content, images, tables } = getActiveContent();

  return (
    <div className="flex w-full h-[780px] bg-white border border-[#250136]/10 rounded-[2rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(37,1,54,0.1)] transition-all duration-700">
      <ResizablePanelGroup direction="horizontal" className="w-full h-full">
      
      {/* 1. Outline Pane (Left) */}
      <ResizablePanel
        defaultSize={20}
        minSize={4}
        maxSize={40}
        className={cn(
          "bg-slate-50/50 flex flex-col",
          !isSidebarOpen && "!flex-[0_0_56px] !max-w-[56px] !min-w-[56px]"
        )}
      >
        
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
             <button 
               onClick={() => router.push(`/app/wizard/${rapportId}/editor`)}
               className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center transition-all mb-4 hover:scale-110 shadow-lg shadow-primary/20 group" 
               title={t('common.openEditor')}
             >
               <Palette className="w-5 h-5" />
             </button>

             <button onClick={() => setShowStyleMenu(!showStyleMenu)} className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-all mb-2 outline-none", showStyleMenu ? "bg-slate-200 text-slate-600" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600")} title={t('settings.tabs.preferences')}>
               <Layers className="w-4 h-4" />
             </button>
             
             <div className="w-6 h-[1px] bg-[#250136]/5 mb-2" />

             <button onClick={addChapter} className="w-8 h-8 rounded-xl bg-[#250136] text-white flex items-center justify-center font-black text-xs hover:scale-110 transition-transform shadow-lg shadow-[#250136]/20" title={t('step6.addChapter')}>CH</button>
             <button onClick={() => {
               const currentSections = [...(activeChapter?.sections || [])];
               const lastSection = currentSections[currentSections.length - 1];
               const hasConclusion = lastSection?.title?.toLowerCase().includes('conclusion');
               
               if (hasConclusion) {
                 // Insert before the last item (Conclusion)
                 currentSections.splice(currentSections.length - 1, 0, { title: '', content: '', subsections: [] });
               } else {
                 currentSections.push({ title: '', content: '', subsections: [] });
               }
               updateChapter(activeItem.cIdx, 'sections', currentSections);
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

             <div className="w-6 h-[1px] bg-[#250136]/5 my-2" />
             
             <button onClick={() => {
                const newTbl = {
                  headers: ['Col 1', 'Col 2', 'Col 3'],
                  rows: [['Cell', 'Cell', 'Cell'], ['Cell', 'Cell', 'Cell']],
                  caption: ''
                };
                const newTables = [...(tables || []), newTbl];
                insertTagAtCursor(`[TABLEAU ${newTables.length}]`, { tables: newTables });
             }} className="w-8 h-8 rounded-lg border-2 border-purple-100 text-purple-600 flex items-center justify-center hover:bg-purple-500 hover:text-white transition-all" title="Add Table">
               <TableIcon className="w-4 h-4" />
             </button>
             
             <div className="relative w-8 h-8 overflow-hidden rounded-lg border-2 border-orange-100 text-orange-600 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all">
               <input 
                 type="file" 
                 title="Add Image"
                 accept="image/*" 
                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                 onChange={(e) => handleImageUpload(e, images || [], (newImgs) => insertTagAtCursor(`[FIGURE ${newImgs.length}]`, { images: newImgs }))}
               />
               <ImagePlus className="w-4 h-4" />
             </div>
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
                            activeItem.cIdx === cIdx && activeItem.type === 'section' && activeItem.sIdx === sIdx 
                              ? (sec.title?.toLowerCase().includes('conclusion') ? "text-slate-900 bg-white shadow-sm" : "text-primary bg-white shadow-sm")
                              : (sec.title?.toLowerCase().includes('conclusion') ? "text-slate-900/60 hover:text-slate-900" : "text-slate-500 hover:text-[#250136]")
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
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* 2. Editor Pane (Center) */}
      <ResizablePanel defaultSize={45} minSize={20} className="bg-white shadow-[inset_0_0_80px_rgba(0,0,0,0.01)] flex flex-col">
        <div className="p-10 w-full flex-1 overflow-y-auto custom-scrollbar space-y-10">
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
             <SmartBlockEditor 
               content={content}
               images={images}
               tables={tables}
               onUpdateContent={(val: string) => val.length <= MAX_CHARS && updateActiveContent({ content: val })}
               onUpdateImages={(val: any) => updateActiveContent({ images: val })}
               onUpdateTables={(val: any) => updateActiveContent({ tables: val })}
               onDeleteImage={deleteImage}
               onDeleteTable={deleteTable}
               setLastCursor={setLastCursor}
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
           </div>
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* 3. Preview Pane (Right) - Visual PDF Viewer */}
      <ResizablePanel
        defaultSize={35}
        minSize={25}
        maxSize={60}
        className="bg-[#e2e4e9] flex flex-col"
      >
        <div ref={previewContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-slate-200/50 flex flex-col items-center">
            <div 
              className="flex flex-col items-center gap-10 origin-top transition-transform duration-300 py-12"
              style={{ 
                width: `${A4_WIDTH}px`,
                transform: `scale(${previewScale})`
              }}
            >
              {chaptersConfig.map((chapter, loopCIdx) => {
                const chapterPages = paginateChapter(chapter, loopCIdx);
                
                return (
                  <div 
                    key={loopCIdx} 
                    id={`preview-chapter-${loopCIdx}`}
                    className="w-full flex flex-col items-center gap-10"
                  >
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-[-20px]">
                      <Hash className="w-3 h-3" /> Chapitre {loopCIdx + 1}
                    </div>

                    {chapterPages.map((pageSegs, pIdx) => (
                      <div 
                        key={pIdx}
                        className={cn(
                          "bg-white shadow-2xl shadow-black/10 border border-slate-300 relative transition-all duration-700 flex flex-col overflow-hidden w-full",
                          activeItem.cIdx === loopCIdx ? "ring-2 ring-primary/40 ring-offset-8 ring-offset-slate-200/50" : ""
                        )}
                        style={{ 
                          minHeight: `${A4_HEIGHT}px`,
                          padding: `${A4_MARGIN}px`,
                          backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.02) 1px, transparent 1px)', 
                          backgroundSize: '24px 24px' 
                        }}
                      >
                        <div className="flex-1 flex flex-col">
                           {pageSegs.map((seg, sIdx) => (
                             <div key={sIdx} id={seg.id}>
                               {seg.type === 'raw' ? seg.content : <RenderSegment segment={seg} sectionIndex={loopCIdx} />}
                             </div>
                           ))}
                        </div>

                        {pIdx === chapterPages.length - 1 && (
                          <div className="absolute inset-x-0 bottom-0 py-8 flex items-center justify-center opacity-30 pointer-events-none">
                             <span className="text-[10px] font-black font-rapport text-slate-400 uppercase tracking-widest">Fin du Chapitre {loopCIdx + 1}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
      </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
