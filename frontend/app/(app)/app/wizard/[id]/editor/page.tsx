'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/app/context/auth-context';
import { useTranslation } from '@/app/context/language-context';
import {
  ChevronLeft,
  Type,
  Palette,
  Layout,
  Layers,
  Plus,
  Settings2,
  Undo2,
  Redo2,
  ImagePlus,
  Trash2,
  Save,
  MousePointer2,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Table as TableIcon,
  CheckCircle,
  Zap,
  ListChecks,
  LayoutGrid,
  ClipboardList,
  AlertCircle,
  Sparkles,
  Wand2,
  Loader2,
  Bookmark,
  BookOpen,
  Quote,
  X
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Rnd } from 'react-rnd';
import { cn } from '@/lib/utils';

// --- Layout Constants ---
const MARGIN_TOP = 80;
const MARGIN_BOTTOM = 1060;
const MARGIN_LEFT = 80;
const CONTENT_WIDTH = 640;
const PAGE_HEIGHT = 1123;
const PAGE_GAP = 48; // Tailwind gap-12 = 3rem = 48px
const STANDARD_GAP = 40; // Spacing between elements during reflow

// Helper: Convert local page/y to global absolute Y
const getAbsoluteY = (page: number, y: number) => {
  return (page - 1) * (PAGE_HEIGHT + PAGE_GAP) + y;
};

// Helper: Convert global absolute Y back to page/y
const getLocalPos = (absoluteY: number) => {
  const totalPageHeight = PAGE_HEIGHT + PAGE_GAP;
  const page = Math.max(1, Math.floor(absoluteY / totalPageHeight) + 1);
  const y = absoluteY % totalPageHeight;
  return { 
    page, 
    y: Math.max(0, Math.min(y, PAGE_HEIGHT)) 
  };
};

// --- Reflow Engine ---
const applyRelativeShift = (elements: EditorElement[], targetId: string, dy: number, estimateHeightFn: (c: string, t: any) => number) => {
  if (dy === 0) return elements;

  const target = elements.find(el => el.id === targetId);
  if (!target) return elements;

  const lockedPrefixes = ['ded-', 'rem-', 'resume-', 'toc-', 'tof-', 'tot-'];
  const isLocked = lockedPrefixes.some(prefix => target.id.startsWith(prefix));

  const sorted = [...elements].sort((a, b) => {
    const ay = (a.page - 1) * 10000 + a.y;
    const by = (b.page - 1) * 10000 + b.y;
    return ay - by;
  });

  const targetIdx = sorted.findIndex(el => el.id === targetId);
  if (targetIdx === -1) return elements;

  const newElements = [...sorted];
  let cumulativeDy = dy;

  for (let i = targetIdx + 1; i < newElements.length; i++) {
    const el = newElements[i];

    if (isLocked) {
      // For locked sections, ONLY shift elements on the same page as the target
      if (el.page === target.page) {
        let newY = el.y + cumulativeDy;
        // Simple boundary safety within the same page
        newY = Math.max(MARGIN_TOP, Math.min(newY, MARGIN_BOTTOM));
        newElements[i] = { ...el, y: newY };
      }
      // Do not allow shift to cascade to other pages
      continue;
    }

    // FULL CASCADE LOGIC (For Chapters, Intro, Conclusion)
    const oldAbsY = getAbsoluteY(el.page, el.y);
    let newAbsY = oldAbsY + cumulativeDy;
    let pos = getLocalPos(newAbsY);

    const height = estimateHeightFn(el.content, el.type);

    // Overflow check: Bump to next page if bottom margin hit
    if (pos.y + height > MARGIN_BOTTOM) {
      const nextPageAbsY = getAbsoluteY(pos.page + 1, MARGIN_TOP);
      const addedShift = nextPageAbsY - newAbsY;
      cumulativeDy += addedShift;
      const bumpedPos = getLocalPos(nextPageAbsY);
      newElements[i] = { ...el, page: bumpedPos.page, y: bumpedPos.y };
    } 
    // Underflow check: Pull back to previous page
    else if (cumulativeDy < 0 && pos.y < MARGIN_TOP) {
       newElements[i] = { ...el, page: pos.page, y: Math.max(MARGIN_TOP, pos.y) };
    }
    else {
      newElements[i] = { ...el, page: pos.page, y: pos.y };
    }
  }

  return newElements;
};

// --- Types ---
interface EditorElement {
  id: string;
  page: number;
  type: 'text' | 'image' | 'heading' | 'table';
  content: string;
  x: number;
  y: number;
  width: number | string;
  height: number | string;
  fontSize: number;
  color: string;
  fontFamily: string;
  fontWeight: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  caption?: string;
  tableSettings?: {
    showHeaderRow: boolean;
    showTotalRow: boolean;
    stripeRows: boolean;
    showFirstColumn: boolean;
    showLastColumn: boolean;
    stripeColumns: boolean;
    themeColor: string; // 'none' | 'slate' | 'blue' | 'indigo' | 'emerald' | 'amber' | 'rose'
  }
  chartType?: 'mermaid';
}

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

const formatChapterContent = (chapter: any) => {
  const styles = {
    l1: 'font-size: 14pt; font-weight: 900; color: #DC2626; display: block; margin-bottom: 8px; margin-top: 16px;',
    l2: 'font-size: 12pt; font-weight: 900; color: #16A34A; display: block; margin-bottom: 4px; margin-top: 12px; margin-left: 20px;',
    l3: 'font-size: 12pt; font-weight: 900; color: #000000; display: block; margin-bottom: 4px; margin-top: 8px; margin-left: 40px;',
    text: 'font-size: 12pt; font-weight: normal; color: #000000; display: block; margin-bottom: 8px;',
    subText: 'font-size: 12pt; font-weight: normal; color: #000000; display: block; margin-bottom: 8px; margin-left: 20px;',
    subSubText: 'font-size: 12pt; font-weight: normal; color: #000000; display: block; margin-bottom: 8px; margin-left: 40px;'
  };

  let html = '';

  if (chapter.introduction) {
    html += `<div style="${styles.text}">${chapter.introduction}</div>`;
  }

  if (chapter.sections && chapter.sections.length > 0) {
    chapter.sections.forEach((section: any, sIdx: number) => {
      html += `<div style="${styles.l1}">${toRoman(sIdx + 1)}. ${section.title?.toUpperCase()}</div>`;
      if (section.content) html += `<div style="${styles.text}">${section.content}</div>`;

      if (section.subsections && section.subsections.length > 0) {
        section.subsections.forEach((sub: any, ssIdx: number) => {
          html += `<div style="${styles.l2}">${ssIdx + 1}. ${sub.title}</div>`;
          if (sub.content) html += `<div style="${styles.subText}">${sub.content}</div>`;

          if (sub.subsections && sub.subsections.length > 0) {
            sub.subsections.forEach((sss: any, sssIdx: number) => {
              html += `<div style="${styles.l3}">${String.fromCharCode(97 + sssIdx)}. ${sss.title}</div>`;
              if (sss.content) html += `<div style="${styles.subSubText}">${sss.content}</div>`;
            });
          }
        });
      }
    });
  }

  if (chapter.conclusion) {
    html += `<div style="${styles.text}; margin-top: 16px;">${chapter.conclusion}</div>`;
  }

  return html;
};

const estimateHeight = (content: string, type: 'text' | 'heading' | 'image' | 'table') => {
  if (type === 'image') return 450; 
  if (type === 'heading') return 100;
  if (type === 'table') {
    try {
      const data = JSON.parse(content);
      return (data.length * 80) + 200; // Significant increase for spacing
    } catch (e) {
      return 350;
    }
  }

  const charsPerLine = 85;
  const pixelsPerLine = 26;
  const textOnly = content.replace(/<[^>]*>/g, '');
  const paragraphs = textOnly.split('\n');
  let totalLines = 0;
  paragraphs.forEach(p => {
    totalLines += Math.max(1, Math.ceil(p.length / charsPerLine));
  });
  return totalLines * pixelsPerLine + 7;
};

// Simplified Roman Numerals for headings
const rom = (n: number) => {
  const map: any = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X' };
  return map[n] || n.toString();
};

const parseSmartSegments = (
  content: string,
  images: any[] | undefined,
  tables: any[] | undefined,
  baseId: string,
  stylesText: string,
  counters: { fig: number; tbl: number }
) => {
  if (!content && !images?.length && !tables?.length) return [];
  
  const segs: any[] = [];
  const usedImages = new Set<number>();
  const usedTables = new Set<number>();

  const parts = content ? content.split(/(\[FIGURE \d+\]|\[TABLEAU \d+\])/i) : [];

  parts.forEach((part, i) => {
    const figMatch = part.match(/\[FIGURE (\d+)\]/i);
    if (figMatch) {
       const idx = parseInt(figMatch[1]) - 1;
       usedImages.add(idx);
       if (images && images[idx]) {
         counters.fig++;
         segs.push({
           id: `${baseId}-smart-img-${i}`,
           type: 'image',
           content: images[idx].src,
           caption: `Figure ${counters.fig}: ${images[idx].caption || ''}`
         });
       } else {
         segs.push({ id: `${baseId}-smart-text-${i}`, type: 'text', content: `<div style="color:red; font-weight:bold;">${part} (Introuvable)</div>` });
       }
       return;
    }

    const tabMatch = part.match(/\[TABLEAU (\d+)\]/i);
    if (tabMatch) {
       const idx = parseInt(tabMatch[1]) - 1;
       usedTables.add(idx);
       if (tables && tables[idx]) {
         counters.tbl++;
         segs.push({
           id: `${baseId}-smart-tbl-${i}`,
           type: 'table',
           content: JSON.stringify([tables[idx].headers, ...tables[idx].rows]),
           caption: `Tableau ${counters.tbl}: ${tables[idx].caption || ''}`
         });
       } else {
         segs.push({ id: `${baseId}-smart-text-${i}`, type: 'text', content: `<div style="color:red; font-weight:bold;">${part} (Introuvable)</div>` });
       }
       return;
    }

    if (part.trim().length > 0) {
      segs.push({
        id: `${baseId}-smart-text-${i}`,
        type: 'text',
        content: `<div style="${stylesText}">${part.replace(/\n/g, '<br/>')}</div>`
      });
    }
  });

  if (images) {
    images.forEach((img, idx) => {
      if (!usedImages.has(idx)) {
        counters.fig++;
        segs.push({ id: `${baseId}-unused-img-${idx}`, type: 'image', content: img.src, caption: `Figure ${counters.fig}: ${img.caption || ''}` });
      }
    });
  }

  if (tables) {
    tables.forEach((tbl, idx) => {
      if (!usedTables.has(idx)) {
        counters.tbl++;
        segs.push({ id: `${baseId}-unused-tbl-${idx}`, type: 'table', content: JSON.stringify([tbl.headers, ...tbl.rows]), caption: `Tableau ${counters.tbl}: ${tbl.caption || ''}` });
      }
    });
  }
  return segs;
};

const getChapterSegments = (chapter: any, chapIdx: number, counters: { fig: number; tbl: number }): any[] => {
  const segments: any[] = [];
  const styles = {
    chapter: 'font-size: 16pt; font-weight: 900; color: #DC2626; display: block; margin-bottom: 16px; text-align: center; text-transform: uppercase;',
    l1: 'font-size: 14pt; font-weight: 900; color: #DC2626; display: block; margin-bottom: 10px;',
    l2: 'font-size: 12pt; font-weight: 900; color: #16A34A; display: block; margin-bottom: 8px; margin-left: 20px;',
    l3: 'font-size: 12pt; font-weight: 900; color: #000000; display: block; margin-bottom: 6px; margin-left: 40px;',
    text: 'font-size: 11pt; font-weight: normal; color: #000000; display: block; margin-bottom: 6px; line-height: 1.7;'
  };

  segments.push({
    id: `chap-${chapIdx}-label`,
    type: 'text',
    content: `<div style="${styles.chapter}">CHAPITRE ${chapIdx + 1}: ${chapter.title?.toUpperCase() || ''}</div>`
  });

  segments.push(...parseSmartSegments(chapter.introduction || '', chapter.images, chapter.tables, `chap-${chapIdx}-intro`, styles.text, counters));

  if (chapter.sections) {
    chapter.sections.forEach((s: any, sIdx: number) => {
      segments.push({
        id: `chap-${chapIdx}-s-${sIdx}-label`,
        type: 'text',
        content: `<div style="${styles.l1}">${rom(sIdx + 1)}. ${s.title?.toUpperCase() || ''}</div>`
      });
      
      segments.push(...parseSmartSegments(s.content || '', s.images, s.tables, `chap-${chapIdx}-s-${sIdx}`, styles.text, counters));

      if (s.subsections) {
        s.subsections.forEach((ss: any, ssIdx: number) => {
          segments.push({
            id: `chap-${chapIdx}-s-${sIdx}-ss-${ssIdx}-label`,
            type: 'text',
            content: `<div style="${styles.l2}">${ssIdx + 1}. ${ss.title || ''}</div>`
          });
          
          segments.push(...parseSmartSegments(ss.content || '', ss.images, ss.tables, `chap-${chapIdx}-s-${sIdx}-ss-${ssIdx}`, `${styles.text} margin-left: 20px;`, counters));

          if (ss.subsections) {
            ss.subsections.forEach((sss: any, sIdx3: number) => {
              segments.push({
                id: `chap-${chapIdx}-s-${sIdx}-ss-${ssIdx}-sss-${sIdx3}-label`,
                type: 'text',
                content: `<div style="${styles.l3}">${String.fromCharCode(97 + sIdx3)}) ${sss.title || ''}</div>`
              });
              
              segments.push(...parseSmartSegments(sss.content || '', sss.images, sss.tables, `chap-${chapIdx}-s-${sIdx}-ss-${ssIdx}-sss-${sIdx3}`, `${styles.text} margin-left: 40px;`, counters));
            });
          }
        });
      }
    });
  }

  // 5. Conclusion
  if (chapter.conclusion) {
    segments.push({
      id: `chap-${chapIdx}-conc-txt`,
      type: 'text',
      content: `<div style="${styles.text}; margin-top: 20px;">${chapter.conclusion}</div>`
    });
  }

  return segments;
};

// ===== WIZARD-IDENTICAL CHAPTER RENDERER =====
const CHAP_A4_HEIGHT = 1123;
const CHAP_A4_MARGIN = 80;
const CHAP_PX_PER_LINE = 26;
const CHAP_CHARS_PER_LINE = 75;

const estimateChapterSegmentHeight = (content: any, type: string): number => {
  if (type === 'image') return 410;
  if (type === 'heading') return 50;
  if (type === 'table') return 300;
  if (type === 'raw') return 100;
  if (typeof content !== 'string') return 50;
  const textOnly = content.replace(/<[^>]*>/g, '');
  const lines = Math.max(1, Math.ceil(textOnly.length / CHAP_CHARS_PER_LINE));
  return lines * CHAP_PX_PER_LINE + 7;
};

const paginateChapterForEditor = (chapter: any, chapIdx: number): any[][] => {
  const MAX_Y = CHAP_A4_HEIGHT - (CHAP_A4_MARGIN * 1.4);
  const pages: any[][] = [[]];
  let curY = 0;

  const pushToPage = (seg: any) => {
    const h = estimateChapterSegmentHeight(seg.content || '', seg.type);
    if (curY + h > MAX_Y && pages[pages.length - 1].length > 0) {
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
        if (images[idx]) pushToPage({ type: 'image', content: images[idx].src, caption: `Figure ${sectionPrefix}.${idx+1} — ${images[idx].caption || 'Sans titre'}` });
        return;
      }
      const tabMatch = part.match(/\[TABLEAU (\d+)\]/i);
      if (tabMatch) {
        const idx = parseInt(tabMatch[1]) - 1;
        if (tables[idx]) pushToPage({ type: 'table', content: JSON.stringify([tables[idx].headers, ...tables[idx].rows]), caption: `Tableau ${sectionPrefix}.${idx+1} — ${tables[idx].caption || 'Sans titre'}` });
        return;
      }
      if (part.trim()) {
        const h = estimateChapterSegmentHeight(part, 'text');
        if (curY + h > MAX_Y && part.length > 200) {
          const availableH = MAX_Y - curY;
          const linesPossible = Math.floor((availableH - 7) / CHAP_PX_PER_LINE);
          if (linesPossible > 3) {
            const charLimit = linesPossible * CHAP_CHARS_PER_LINE;
            let splitIdx = charLimit;
            const lastSpace = part.lastIndexOf(' ', charLimit);
            if (lastSpace > charLimit * 0.8) splitIdx = lastSpace;
            const part1 = part.substring(0, splitIdx);
            const part2 = part.substring(splitIdx).trim();
            pushToPage({ type: 'text', content: part1 });
            if (part2) parseAndPush(part2, images, tables, sectionPrefix);
            return;
          }
        }
        pushToPage({ type: 'text', content: part });
      }
    });
  };

  // Chapter Header (raw JSX — identical to wizard)
  pushToPage({
    type: 'raw',
    id: `ch-${chapIdx}-header`,
    content: (
      <div className="flex flex-col items-center mb-8">
        <h2 className="text-[16pt] font-black text-[#DC2626] uppercase text-center tracking-tight leading-tight">
          {chapter.title ? `CHAPITRE ${chapIdx + 1}: ${chapter.title}` : `CHAPITRE ${chapIdx + 1}`}
        </h2>
        <div className="w-16 h-1 bg-[#DC2626] mt-4 rounded-full opacity-10" />
      </div>
    )
  });

  parseAndPush(chapter.introduction, chapter.images || [], chapter.tables || [], `${chapIdx + 1}.0`);

  if (chapter.sections) {
    chapter.sections.forEach((s: any, si: number) => {
      const roms: string[] = ['I','II','III','IV','V','VI','VII','VIII','IX','X'];
      pushToPage({ type: 'heading', level: 1, content: `${roms[si] || (si+1)}. ${s.title}`, id: `ed-ch-${chapIdx}-${si}` });
      parseAndPush(s.content, s.images || [], s.tables || [], `${si + 1}`);
      s.subsections?.forEach((ss: any, ssi: number) => {
        pushToPage({ type: 'heading', level: 2, content: `${ssi + 1}. ${ss.title}`, id: `ed-ch-${chapIdx}-${si}-${ssi}` });
        parseAndPush(ss.content, ss.images || [], ss.tables || [], `${si + 1}.${ssi + 1}`);
        ss.subsections?.forEach((sss: any, sssi: number) => {
          pushToPage({ type: 'heading', level: 2, content: `${String.fromCharCode(97 + sssi)}) ${sss.title}`, id: `ed-ch-${chapIdx}-${si}-${ssi}-${sssi}` });
          parseAndPush(sss.content, sss.images || [], sss.tables || [], `${si + 1}.${ssi + 1}.${sssi + 1}`);
        });
      });
    });
  }

  if (chapter.conclusion) {
    pushToPage({ type: 'raw', content: <div className="mt-16 pt-12 border-t border-slate-100 flex flex-col items-center"><div className="w-10 h-0.5 bg-slate-200 mb-8" /></div> });
    parseAndPush(chapter.conclusion, chapter.images || [], chapter.tables || [], `${chapIdx + 1}.C`);
  }

  return pages;
};

// Render segment exactly like the wizard's RenderSegment component
const EditorChapterSegment = ({ segment, idx }: { segment: any, idx: number }) => {
  const { type, content, level, caption } = segment;

  if (type === 'raw') return <div key={idx}>{content}</div>;

  if (type === 'image') {
    return (
      <div className="my-10 flex flex-col items-center w-full clear-both">
        <div className="relative border-[0.5px] border-slate-300 shadow-sm overflow-hidden bg-slate-50">
          <img src={content} className="max-w-full" style={{ maxHeight: '400px' }} />
        </div>
        {caption && <p className="text-center text-[10px] mt-4 text-slate-500 font-serif italic">{caption}</p>}
      </div>
    );
  }

  if (type === 'table') {
    let tbl: any = { headers: [], rows: [], caption: '' };
    try { const [h, ...r] = JSON.parse(content); tbl = { headers: h, rows: r, caption: caption || '' }; } catch(e) {}
    return (
      <div className="my-10 w-full flex flex-col items-center clear-both">
        <div className="w-[95%] border-[0.5px] border-slate-300 shadow-sm bg-white overflow-hidden">
          <table className="w-full text-[10px] border-collapse">
            <thead><tr className="bg-slate-50 border-b border-slate-200">{tbl.headers.map((h: string, i: number) => <th key={i} className="border-r border-slate-200 p-2 text-center text-slate-800 font-bold last:border-0">{h}</th>)}</tr></thead>
            <tbody>{tbl.rows.map((row: string[], r: number) => <tr key={r} className="border-b border-slate-100 last:border-0">{row.map((cell: string, c: number) => <td key={c} className="border-r border-slate-100 p-2 text-center text-slate-600 last:border-0">{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>
        {tbl.caption && <p className="text-center text-[10px] mt-4 text-slate-500 font-serif italic">{tbl.caption}</p>}
      </div>
    );
  }

  if (type === 'heading') {
    const isConclusion = content?.toLowerCase().includes('conclusion');
    return (
      <h3 className={cn(
        'font-rapport font-black uppercase mb-3 flex gap-3',
        isConclusion ? 'text-slate-900' : (level === 1 ? 'text-[#DC2626]' : 'text-emerald-600'),
        level === 1 ? 'text-[13pt] mt-8' : 'text-[12pt] mt-5'
      )}>
        {content}
      </h3>
    );
  }

  return (
    <div className="whitespace-pre-wrap leading-[1.7] font-rapport text-[11pt] text-slate-800 mb-4">
      {content}
    </div>
  );
};


// --- Main Page Component ---
const generateAutomatedTableHTML = (elements: EditorElement[], introStartPage: number) => {
  const tocEntries: any[] = [];
  const tofEntries: any[] = [];
  const totEntries: any[] = [];

  const sortedElements = [...elements].sort((a, b) => {
    const ay = (a.page - 1) * 1123 + a.y;
    const by = (b.page - 1) * 1123 + b.y;
    return ay - by;
  });

  sortedElements.forEach((el) => {
    const pageStr = el.page < introStartPage 
      ? toRoman(el.page - 1).toLowerCase() 
      : (el.page - introStartPage + 1).toString();

    // TOC Identification (Sections & Chapters)
    const skipList = ['toc-l', 'tof-l', 'tot-l', 'ministry', 'univ-header', 'pfe-label', 'main-title', 'academic-year', 'presented-by-label', 'supervised-by-label', 'team-names', 'supervisor-name'];
    
    // CRITICAL: Ignore everything on Page 1 (Cover Page)
    if (el.page === 1) return;

    if ((el.type === 'heading' || el.id.includes('-label')) && !skipList.includes(el.id)) {
      const title = el.content.replace(/<[^>]*>/g, '').trim();
      if (title && title.length > 2) {
        tocEntries.push({ 
          title, 
          page: pageStr, 
          isChapter: el.id.startsWith('chap-') && !el.id.includes('-s-') 
        });
      }
    }

    // TOF/TOT Identification (Captions)
    if (el.caption) {
      if (el.type === 'image' || el.caption.toLowerCase().includes('figure')) {
        tofEntries.push({ title: el.caption, page: pageStr });
      } else if (el.type === 'table' || el.caption.toLowerCase().includes('tableau')) {
        totEntries.push({ title: el.caption, page: pageStr });
      }
    }
  });

  const formatList = (items: any[]) => {
    if (items.length === 0) return `<div style="color: #94a3b8; font-style: italic; font-size: 14px; margin-top: 24px; text-align: center; width: 100%;">Aucune entrée détectée pour le moment.</div>`;
    
    return `<table style="width: 100%; border-collapse: collapse; margin-top: 16px;">` + 
      items.map(item => {
        // Intelligent Padding based on the title pattern (Matches Backend Logic)
        let paddingLeft = "0px";
        let fontWeight = item.isChapter ? "900" : "500";
        
        if (item.title.match(/^[IVX]+\.\s/)) paddingLeft = "25px";
        else if (item.title.match(/^\d+\.\s/)) paddingLeft = "50px";
        else if (item.title.match(/^[a-z]\)\s/)) paddingLeft = "75px";

        // Front matter (Dédicace, etc.) should be bold and left-aligned with no padding
        const frontMatter = ["DÉDICACE", "REMERCIEMENTS", "RÉSUMÉ", "ABSTRACT", "INTRODUCTION GÉNÉRALE", "CONCLUSION GÉNÉRALE"];
        if (frontMatter.includes(item.title.toUpperCase())) {
          paddingLeft = "0px";
          fontWeight = "900";
        }

        return `
        <tr style="line-height: 1.1;">
          <td style="padding: 4px 0 4px ${paddingLeft}; text-align: left !important; font-size: 11pt; color: #334155; font-family: 'Computer Modern Serif', serif; font-weight: ${fontWeight}; white-space: nowrap;">
            ${item.title}
          </td>
          <td style="width: 100%; padding: 0 8px; border-bottom: 1.5px dotted #cbd5e1; position: relative; top: -6px;"></td>
          <td style="padding: 4px 0; text-align: right; font-family: monospace; font-size: 10pt; color: #64748B; font-weight: bold; white-space: nowrap;">
            ${item.page}
          </td>
        </tr>`;
      }).join('') + 
    `</table>`;
  };

  return {
    tocContent: formatList(tocEntries),
    tofContent: formatList(tofEntries),
    totContent: formatList(totEntries)
  };
};

export default function VisualEditor() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const rapportId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [elements, setElements] = useState<EditorElement[]>([]);
  const [numPages, setNumPages] = useState(3);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [zoom, setZoom] = useState(0.55);
  const [activePage, setActivePage] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error' | 'loading-pdf'>('idle');
  const [introStartPage, setIntroStartPage] = useState(1);
  const [chapterFlowPages, setChapterFlowPages] = useState<Map<number, any[]>>(new Map());
  const [isAiLoading, setIsAiLoading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [history, setHistory] = useState<EditorElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isInternalChange = useRef(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [supervisorId, setSupervisorId] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [citations, setCitations] = useState<any[]>([]);
  const [isCitationModalOpen, setIsCitationModalOpen] = useState(false);
  const [newCitation, setNewCitation] = useState({ type: 'article', format: 'APA', authors: [''], title: '', year: '', journal: '', publisher: '' });
  const [activePartners, setActivePartners] = useState<any[]>([]);

  const saveToHistory = (newElements: EditorElement[]) => {
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newElements)));

    // Limit history size to 50
    if (newHistory.length > 50) newHistory.shift();

    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const autoContent = useMemo(() => 
    generateAutomatedTableHTML(elements, introStartPage),
    [elements, introStartPage]
  );

  // chapterFlowPages is now set in fetchData — no useMemo needed.
  // chapter elements are no longer in the Rnd overlay, so chapterElementIds is empty.
  const chapterElementIds = useMemo(() => new Set<string>(), []);

  const undo = () => {
    if (historyIndex > 0) {
      isInternalChange.current = true;
      const prevElements = JSON.parse(JSON.stringify(history[historyIndex - 1]));
      setElements(prevElements);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      isInternalChange.current = true;
      const nextElements = JSON.parse(JSON.stringify(history[historyIndex + 1]));
      setElements(nextElements);
      setHistoryIndex(historyIndex + 1);
    }
  };

  // --- Fetch Data ---
  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('Fetching report data for:', rapportId);
      const data = await apiClient(`/rapports/${rapportId}`);
      const answers = data.wizardAnswers || {};
      const isBinome = answers.isBinome === true || answers.isBinome === 'true';

      let mergedElements: EditorElement[] = [];
      let curP = 1;
      let curY = 100;

      const MARGIN_TOP = 60;
      const MARGIN_BOTTOM = 1011; // Matches wizard's MAX_Y = A4_HEIGHT - (A4_MARGIN * 1.4)
      const MARGIN_LEFT = 80;
      const CONTENT_WIDTH = 640;
      const PX_PER_LINE = 26;
      const CHARS_PER_LINE = 85;

      // HELPER: Auto-Position with "Red Zone" Smart Packing
      const addElements = (segments: any[], forceNewPage = false) => {
        if (forceNewPage && curY > MARGIN_TOP) {
          curP++;
          curY = MARGIN_TOP;
        }

        const results: EditorElement[] = [];

        const processSegment = (seg: any) => {
          const rawContent = seg.content.replace(/<div[^>]*>|<\/div>/g, '').trim();
          const styleMatch = seg.content.match(/style="([^"]*)"/);
          const style = styleMatch ? styleMatch[1] : '';
          
          const height = estimateHeight(seg.content, seg.type);

          // If it's NOT text (Heading, Image, Table) and it doesn't fit, move to next page
          if (seg.type !== 'text') {
            if (curY + height > MARGIN_BOTTOM) {
              curP++;
              curY = MARGIN_TOP;
            }

            results.push({
              id: seg.id,
              page: curP,
              type: seg.type,
              content: seg.content,
              caption: seg.caption,
              x: seg.type === 'heading' ? MARGIN_LEFT : MARGIN_LEFT,
              y: curY,
              width: CONTENT_WIDTH,
              height: seg.type === 'image' ? 400 : 'auto',
              fontSize: seg.type === 'heading' ? 22 : 16,
              color: seg.type === 'heading' ? '#DC2626' : (seg.isPlaceholder ? '#250136' : '#000000'),
              fontFamily: '"Computer Modern Serif", serif',
              fontWeight: seg.type === 'heading' ? '900' : 'normal',
              textAlign: seg.type === 'heading' ? 'center' : 'justify'
            });
            curY += height + 10;
            return;
          }

          // IF TEXT: Implement Smart Packing Splitting
          const availableH = MARGIN_BOTTOM - curY;
          const maxLinesOnCurrentPage = Math.floor(availableH / PX_PER_LINE);

          // If we have very little space (less than 3 lines), just jump to next page
          if (maxLinesOnCurrentPage < 3) {
            curP++;
            curY = MARGIN_TOP;
            processSegment(seg);
            return;
          }

          const contentParagraphs = rawContent.split('\n');
          let currentLines = 0;
          let splitIdxInsidePara = -1;
          let splitParaIdx = -1;

          for (let i = 0; i < contentParagraphs.length; i++) {
            const p = contentParagraphs[i];
            const pLines = Math.max(1, Math.ceil(p.length / CHARS_PER_LINE));
            if (currentLines + pLines > maxLinesOnCurrentPage) {
              splitParaIdx = i;
              const linesAvailable = maxLinesOnCurrentPage - currentLines;
              if (linesAvailable > 0) {
                splitIdxInsidePara = linesAvailable * CHARS_PER_LINE;
                let spaceIdx = p.lastIndexOf(' ', splitIdxInsidePara);
                if (spaceIdx > splitIdxInsidePara * 0.7) splitIdxInsidePara = spaceIdx;
              } else {
                splitIdxInsidePara = 0;
              }
              break;
            }
            currentLines += pLines;
          }

          if (splitParaIdx !== -1) {
            const firstPartParas = contentParagraphs.slice(0, splitParaIdx);
            const remainderParas = contentParagraphs.slice(splitParaIdx + 1);
            let firstPart = firstPartParas.join('\n');
            let remainder = remainderParas.join('\n');

            const pToSplit = contentParagraphs[splitParaIdx];
            if (splitIdxInsidePara > 0) {
              firstPart += (firstPart ? '\n' : '') + pToSplit.substring(0, splitIdxInsidePara).trim();
              remainder = pToSplit.substring(splitIdxInsidePara).trim() + (remainder ? '\n' + remainder : '');
            } else {
              remainder = pToSplit + (remainder ? '\n' + remainder : '');
            }

            results.push({
              id: `${seg.id}-part-${curP}`,
              page: curP,
              type: 'text',
              content: `<div style="${style}">${firstPart}</div>`,
              x: MARGIN_LEFT,
              y: curY,
              width: CONTENT_WIDTH,
              height: 'auto',
              fontSize: 16,
              fontFamily: '"Computer Modern Serif", serif',
              textAlign: 'justify',
              color: seg.isPlaceholder ? '#250136' : '#000000',
              fontWeight: seg.isPlaceholder ? '900' : 'normal'
            });

            curP++;
            curY = MARGIN_TOP;
            if (remainder.length > 0) {
              processSegment({ ...seg, id: `${seg.id}-cont`, content: `<div style="${style}">${remainder}</div>` });
            }
          } else {
            // It fits!
            results.push({
              id: seg.id,
              page: curP,
              type: 'text',
              content: seg.content,
              x: MARGIN_LEFT,
              y: curY,
              width: CONTENT_WIDTH,
              height: 'auto',
              fontSize: 16,
              fontFamily: '"Computer Modern Serif", serif',
              textAlign: 'justify',
              color: seg.isPlaceholder ? '#250136' : '#000000',
              fontWeight: seg.isPlaceholder ? '900' : 'normal'
            });
            curY += height + 40;
          }
        };

        segments.forEach(seg => processSegment(seg));
        return results;
      };

      // --- PAGE 1: TITLE (Premium PFE Graduation Layout) ---
      curP = 1; curY = 60; // Start at the very top for official headers
      
      const pfeHeader = [
        { id: 'ministry', type: 'text' as const, content: answers.ministry || t('editor.sections.ministry'), fontSize: 9, color: '#64748B', fontWeight: 'bold', fontFamily: 'serif', textAlign: 'left' as const, height: 'auto' },
        { id: 'univ-header', type: 'text' as const, content: (answers.university || t('step1.universityPlaceholder')).toUpperCase(), fontSize: 13, color: '#334155', fontWeight: '900', fontFamily: 'serif', textAlign: 'left' as const, height: 'auto' },
        { id: 'dept-header', type: 'text' as const, content: answers.department || t('step1.departmentPlaceholder'), fontSize: 11, color: '#475569', fontWeight: '700', fontFamily: 'serif', textAlign: 'left' as const, height: 'auto' },
      ];
      
      // Decorative Seal Placeholder (Styled Circle)
      const logoSeal: EditorElement = { id: 'logo-main', type: 'text', page: 1, content: `<div style="width: 80px; height: 80px; background: linear-gradient(135deg, #250136 0%, #3a0a4f 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 10px; border: 4px double rgba(255,255,255,0.2); box-shadow: 0 4px 12px rgba(37, 1, 54, 0.2);">LOGO</div>`, x: 580, y: 60, width: 90, height: 90, fontSize: 10, color: '#FFFFFF', fontFamily: 'serif', fontWeight: 'normal', textAlign: 'center' };
      
      // Subtle Divider
      const headerDivider: EditorElement = { id: 'header-divider', page: 1, type: 'text', content: `<div style="height: 2px; background: #250136; opacity: 0.1; width: 100%;"></div>`, x: 80, y: 160, width: 640, height: 2, fontSize: 10, color: '#000000', fontFamily: 'serif', fontWeight: 'normal', textAlign: 'left' };

      const pfeTitleMain = [
        { id: 'pfe-label', type: 'heading' as const, content: t('editor.sections.pfeLabel'), fontSize: 18, color: '#FF7F3F', fontWeight: '900', textAlign: 'center' as const, fontFamily: 'serif', height: 'auto' },
        { id: 'main-title', type: 'heading' as const, content: (answers.projectTitle || t('step1.projectTitlePlaceholder')).toUpperCase(), fontSize: 44, color: '#250136', fontWeight: '900', textAlign: 'center' as const, fontFamily: 'serif', height: 'auto' },
        { id: 'degree-label', type: 'text' as const, content: answers.degree || t('step1.degreePlaceholder'), fontSize: 16, color: '#64748B', fontWeight: 'normal', textAlign: 'center' as const, italic: true, fontFamily: 'serif', height: 'auto' },
      ];

      const pfeTeam: EditorElement[] = [
        { id: 'presented-by-label', page: 1, type: 'text', content: t('editor.sections.presentedBy'), x: 80, y: 750, width: 300, height: 'auto', fontSize: 11, color: '#FF7F3F', fontWeight: 'bold', fontFamily: 'serif', textAlign: 'left' },
        { id: 'team-names', page: 1, type: 'text', content: answers.studentNames || (isBinome ? `${answers.studentName1} & ${answers.studentName2}` : answers.studentName1) || t('step1.studentNamesPlaceholder'), x: 80, y: 775, width: 300, height: 'auto', fontSize: 17, color: '#250136', fontWeight: '900', fontFamily: 'serif', textAlign: 'left' },
        { id: 'supervised-by-label', page: 1, type: 'text', content: t('editor.sections.supervisedBy'), x: 450, y: 750, width: 300, height: 'auto', fontSize: 11, color: '#FF7F3F', fontWeight: 'bold', fontFamily: 'serif', textAlign: 'left' },
        { id: 'supervisor-name', page: 1, type: 'text', content: answers.supervisor || t('step1.supervisorPlaceholder'), x: 450, y: 775, width: 300, height: 'auto', fontSize: 17, color: '#250136', fontWeight: '900', fontFamily: 'serif', textAlign: 'left' },
      ];

      const pfeFooter = [
        { id: 'academic-year', type: 'text' as const, content: `${t('editor.sections.academicYearLabel')} ${answers.academicYear || t('step1.academicYearPlaceholder')}`, fontSize: 14, color: '#334155', fontWeight: '700', textAlign: 'center' as const, fontFamily: 'serif', height: 'auto' }
      ];

      // Sequential Packing
      mergedElements.push(...addElements(pfeHeader)); // Institution Stack
      mergedElements.push(logoSeal, headerDivider); // Decorative elements
      
      curY = 380; // Optimal mid-positioning
      mergedElements.push(...addElements(pfeTitleMain));
      
      // Manual multi-column team placement
      mergedElements.push(...pfeTeam);
      
      curY = 900; // Final footer - Moved higher to ensure it never bumps to Page 2
      mergedElements.push(...addElements(pfeFooter));

      const globalCounters = { fig: 0, tbl: 0 };

      // --- PAGE 2+: FRONT MATTER (Each on their own page) ---
      curP = 2; curY = MARGIN_TOP;
      if (isBinome) {
        // Dedication 1
        const d1 = answers.dedicace1 || answers.dedicace || '';
        mergedElements.push(...addElements([
           { id: 'ded-l-1', type: 'heading', content: `${t('editor.sections.dedication')} - ${answers.studentName1 || t('dashboard.modal.projectNamePlaceholder')}` }, 
           { id: 'ded-c-1', type: 'text', content: d1 || t('editor.placeholderContent'), isPlaceholder: !d1 }
        ], true));

        // Dedication 2
        const d2 = answers.dedicace2 || '';
        mergedElements.push(...addElements([
           { id: 'ded-l-2', type: 'heading', content: `${t('editor.sections.dedication')} - ${answers.studentName2 || t('dashboard.modal.projectNamePlaceholder')}` }, 
           { id: 'ded-c-2', type: 'text', content: d2 || t('editor.placeholderContent'), isPlaceholder: !d2 }
        ], true));
      } else {
        // Solo Dedication
        const d = answers.dedicace1 || answers.dedicace || '';
        mergedElements.push(...addElements([
           { id: 'ded-l', type: 'heading', content: t('editor.sections.dedication') }, 
           { id: 'ded-c', type: 'text', content: d || t('editor.placeholderContent'), isPlaceholder: !d }
        ], true));
      }

      // Acknowledgments
      const r = answers.remerciements || '';
      mergedElements.push(...addElements([
         { id: 'rem-l', type: 'heading', content: t('editor.sections.acknowledgments') }, 
         { id: 'rem-c', type: 'text', content: r || t('editor.placeholderContent'), isPlaceholder: !r }
      ], true));

      // Tables of Content (Always its own page)
      mergedElements.push(...addElements([{ id: 'toc-l', type: 'heading', content: t('editor.sections.toc') }], true));
      
      // --- PAGE X: INTRODUCTION ---
      const introSegments: any[] = [
        { id: 'intro-l', type: 'heading', content: t('editor.sections.intro') },
        { id: 'intro-txt', type: 'text', content: [answers.introduction, answers.introContext, answers.introProblem, answers.introObjective].filter(Boolean).map(t => `<div style="text-align: justify;">${t}</div>`).join('\n\n') }
      ];
      mergedElements.push(...addElements(introSegments, true)); 
      
      const introEl = mergedElements.find(e => e.id === 'intro-l');
      if (introEl) setIntroStartPage(introEl.page);

      // --- PAGES X+: CHAPTERS (using wizard's identical flow pagination) ---
      const newChapterFlowPages = new Map<number, any[]>();
      if (data.chaptersConfig) {
        data.chaptersConfig.forEach((ch: any, i: number) => {
          // Force each chapter onto a fresh page
          if (curY > MARGIN_TOP) { curP++; curY = MARGIN_TOP; }
          const chPages = paginateChapterForEditor(ch, i);
          chPages.forEach((pageSegs, pIdx) => {
            newChapterFlowPages.set(curP + pIdx, pageSegs);
          });
          curP += chPages.length;
          curY = MARGIN_TOP;
        });
      }

      // --- PAGE FINAL: CONCLUSION ---
      if (answers.conclusion) {
        mergedElements.push(...addElements([
          { id: 'conc-l', type: 'heading', content: t('editor.sections.conclusion') },
          { id: 'conc-txt', type: 'text', content: answers.conclusion }
        ], true));
      }

      // Merge user positions if they already EXISTED in visualLayout
      if (data.visualLayout && data.visualLayout.length > 0) {
        console.log('Merging user positions into new structured layout...');
        data.visualLayout.forEach((oldEl: EditorElement) => {
          const match = mergedElements.find(newEl => newEl.id === oldEl.id);
          if (match) {
            // If user manually moved it, preserve that move? 
            // Actually, user is currently frustrated by overlap, so let's only preserve if it's NOT a standard ID
            if (!oldEl.id.startsWith('chap-') && !oldEl.id.includes('-txt') && !oldEl.id.includes('-l')) {
              match.x = oldEl.x;
              match.y = oldEl.y;
              match.page = oldEl.page;
              match.width = oldEl.width;
              match.height = oldEl.height;
            }
          }
        });
      }

      setElements(mergedElements);
      setHistory([JSON.parse(JSON.stringify(mergedElements))]);
      setHistoryIndex(0);
      setChapterFlowPages(newChapterFlowPages);
      const maxChapterPage = newChapterFlowPages.size > 0 ? Math.max(...newChapterFlowPages.keys()) : 0;
      setNumPages(Math.max(curP, ...mergedElements.map(e => e.page), maxChapterPage));
      setSupervisorId(data.supervisorId || null);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching rapport:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const fetchSupervisors = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/auth/supervisors`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setSupervisors(data);
        }
      } catch (e) { console.error('Failed to fetch supervisors', e); }
    };

    const fetchComments = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/comments/${rapportId}`, {
          credentials: 'include'
        });
        if (response.ok) {
           const data = await response.json();
           setComments(data);
        }
      } catch (e) { console.error('Failed to fetch comments', e); }
    };

    const fetchCitations = async () => {
       try {
         const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/citations/${rapportId}`, {
           credentials: 'include'
         });
         if (response.ok) {
            const data = await response.json();
            setCitations(data);
         }
       } catch (e) { console.error('Failed to fetch citations', e); }
    };

    fetchSupervisors();
    fetchComments();
    fetchCitations();

    // Heartbeat for presence
    const heartbeat = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/rapports/${rapportId}/heartbeat`, {
          method: 'POST',
          credentials: 'include'
        });
        if (response.ok) {
          const others = await response.json();
          setActivePartners(others);
        }
      } catch (e) { console.error('Heartbeat failed', e); }
    };

    heartbeat();
    const interval = setInterval(heartbeat, 30000); // 30s
    return () => clearInterval(interval);
  }, [rapportId]);

  // --- Handlers ---
  const updateElement = (id: string, updates: Partial<EditorElement>) => {
    const newElements = elements.map(el => (el.id === id ? { ...el, ...updates } : el));
    setElements(newElements);
    saveToHistory(newElements);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (re) => {
        const logoData = re.target?.result as string;
        const newElements = elements.map(el => 
          el.id === 'logo-main' ? { ...el, type: 'image' as const, content: logoData } : el
        );
        setElements(newElements);
        saveToHistory(newElements);
      };
      reader.readAsDataURL(file);
    }
  };

  const deleteElement = (id: string) => {
    const newElements = elements.filter(el => el.id !== id);
    setElements(newElements);
    saveToHistory(newElements);
    setSelectedId(null);
  };

  const handleSave = async () => {
    // If currently editing, save that first
    if (editingId) {
      const el = elements.find(item => item.id === editingId);
      if (el) {
        const styleMatch = el.content.match(/style="([^"]*)"/);
        const style = styleMatch ? styleMatch[1] : '';
        const wrapped = `<div style="${style}">${editingContent}</div>`;
        updateElement(editingId, { content: wrapped });
      }
      setEditingId(null);
    }

    setIsSaving(true);
    setSaveStatus('idle');
    try {
      await apiClient(`/rapports/${rapportId}/autosave`, {
        data: { visualLayout: elements, numPages, supervisorId },
        method: 'PATCH'
      });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Save failed:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async (type: 'pdf') => {
    try {
      setSaveStatus('loading-pdf');

      // 1. Force a save before exporting to ensure backend has the latest generated pages
      const currentNumPages = Math.max(1, ...elements.map(e => e.page || 1));
      await apiClient(`/rapports/${rapportId}/autosave`, {
        data: { visualLayout: elements, numPages: currentNumPages },
        method: 'PATCH'
      });

      // 2. Begin Download
      const url = '/api';
      const response = await fetch(`${url}/export/${rapportId}/${type}`, {
        method: 'GET',
        headers: { 'Accept': 'application/pdf' },
        credentials: 'include' // crucial for auth cookies
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Backend Export Error:", errText);
        throw new Error('Export failed: ' + errText);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `rapport_${rapportId}.${type}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error(`${type} Export Error:`, error);
      setSaveStatus('error');
    }
  };

  const handleAiStructure = async () => {
    setIsAiLoading(true);
    try {
      const response = await apiClient('/ai/suggest-structure', {
        method: 'POST',
        data: {
          projectTitle: elements.find(e => e.id === 'main-title')?.content || 'Mon Projet PFE',
          language: language
        }
      });

      if (response.structure) {
        // Here we could automatically add the chapters or show a modal.
        // For now, let's just log it or alert.
        // Better: Let's add a popup or just notify the user.
        alert("Structure suggérée par l'IA :\n" + response.structure.map((s: any) => `- ${s.title}`).join('\n'));
      }
    } catch (error) {
      console.error('AI Structure failed:', error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAiRefine = async () => {
    if (!selectedId || !selectedElement || selectedElement.type !== 'text') return;
    
    setIsAiLoading(true);
    try {
      const plainText = selectedElement.content.replace(/<[^>]*>/g, '').trim();
      const response = await apiClient('/ai/expand-text', {
        method: 'POST',
        data: {
          shortText: plainText,
          language: language,
          context: 'Section focusing on academic PFE report'
        }
      });

      if (response.text) {
        const styleMatch = selectedElement.content.match(/style="([^"]*)"/);
        const style = styleMatch ? styleMatch[1] : '';
        const wrapped = `<div style="${style}">${response.text}</div>`;
        updateElement(selectedId, { content: wrapped });
      }
    } catch (error) {
      console.error('AI Refine failed:', error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const selectedElement = useMemo(() =>
    elements.find(el => el.id === selectedId), [elements, selectedId]
  );

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-[#F3F4F6] text-slate-900 overflow-hidden font-sans">

      {/* Hidden Logo Input */}
      <input
        type="file"
        ref={logoInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleLogoChange}
      />
      {/* Top Navbar */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="h-8 w-px bg-slate-200 mx-1" />
          <h1 className="font-bold text-lg tracking-tight">Visual Editor <span className="text-slate-400 font-normal ml-2">PFE Rapport</span></h1>
          
          {/* Active Partners Presence */}
          {activePartners.length > 0 && (
            <div className="flex -space-x-2 ml-6 animate-in fade-in slide-in-from-left-2 duration-700">
               {activePartners.map((partner, i) => (
                 <div key={i} className="group relative">
                    <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-slate-100 shadow-sm transition-transform hover:-translate-y-1">
                       <img 
                          src={partner.userId.profile?.photoUrl || `https://ui-avatars.com/api/?name=${partner.userId.profile?.name || 'User'}&background=random`} 
                          alt="Partner" 
                          className="w-full h-full object-cover"
                       />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
                    
                    {/* Tooltip */}
                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100] whitespace-nowrap">
                       {partner.userId.profile?.name || 'Membre du binôme'} est en ligne
                    </div>
                 </div>
               ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsZenMode(!isZenMode)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest border shadow-sm",
              isZenMode 
                ? "bg-slate-900 text-white border-slate-900" 
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            )}
            title="Toggle Zen Mode"
          >
            {isZenMode ? <Plus className="w-3.5 h-3.5 rotate-45" /> : <Sparkles className="w-3.5 h-3.5" />}
            {isZenMode ? "Quitter Zen" : "Zen Mode"}
          </button>
          
          {!isZenMode && (
            <div className="flex items-center gap-3 animate-in fade-in duration-300">
          <div className="hidden sm:flex items-center gap-1 mr-4">
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className={`p-2 rounded-lg transition-colors ${historyIndex > 0 ? 'hover:bg-slate-100 text-slate-600' : 'text-slate-200 cursor-not-allowed'}`}
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className={`p-4 rounded-lg transition-colors ${historyIndex < history.length - 1 ? 'hover:bg-slate-100 text-slate-600' : 'text-slate-200 cursor-not-allowed'}`}
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
             <button
               onClick={handleAiStructure}
               disabled={isAiLoading}
               className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all font-bold text-xs border border-indigo-100 shadow-sm"
               title="Suggérer une Structure"
             >
               {isAiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
               <span className="hidden md:inline">Assistant IA</span>
             </button>
             
             <div className="h-8 w-px bg-slate-200 mx-1" />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('pdf')}
              disabled={saveStatus === 'loading-pdf'}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all font-bold text-sm"
              title="Export as PDF"
            >
              {saveStatus === 'loading-pdf' ? (
                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <ClipboardList className="w-4 h-4 text-red-500" />
              )}
              PDF
            </button>

            <button
              onClick={() => router.push(`/app/wizard/${rapportId}`)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#250136] text-white hover:bg-[#250136]/90 transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[#250136]/10"
              title={t('editor.wizard')}
            >
              <ListChecks className="w-4 h-4" />
              {t('editor.wizard')}
            </button>

            <div className="w-px h-6 bg-slate-200 mx-2" />

            <button
              onClick={fetchData}
              title="Forcer Synchronisation des données"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all group"
            >
              <Zap className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
              <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">{t('common.syncing')}</span>
              {elements.some(e => e.type === 'image' && !e.content) && (
                <AlertCircle className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
              )}
            </button>

            <div className="w-px h-6 bg-slate-200 mx-1" />

            {saveStatus === 'success' && <span className="text-[10px] font-bold text-green-500 animate-in fade-in slide-in-from-right-2 hidden lg:block">{t('common.save')}!</span>}
            {saveStatus === 'error' && <span className="text-[10px] font-bold text-red-500 hidden lg:block">Failed</span>}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`flex items-center gap-2 bg-slate-900 text-white px-5 py-2 rounded-full text-sm font-bold transition-all shadow-md ${isSaving ? 'opacity-70 cursor-wait' : 'hover:bg-slate-800 active:scale-95'}`}
            >
              {isSaving ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              <span className="hidden sm:block">{isSaving ? t('common.loading') : t('editor.save')}</span>
            </button>
          </div>
          </div>
          )}
        </div>
      </header>


      <div className="flex-1 flex overflow-hidden">

        {/* Left Sidebar */}
        {!isZenMode && (
          <aside className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-6 gap-6 shrink-0 z-40 shadow-sm animate-in slide-in-from-left-4 duration-500">
          <ToolButton icon={<Layout className="w-5 h-5" />} label={t('dashboard.modal.subtitle')} active />
          

          <ToolButton 
            icon={<Bookmark className="w-5 h-5" />} 
            label="Citations" 
            onClick={() => setIsCitationModalOpen(true)} 
          />

          <ToolButton
            onClick={() => {
              const newId = `text-${Date.now()}`;
              const newElements: EditorElement[] = [...elements, {
                id: newId,
                page: activePage,
                type: 'text',
                content: 'Add your text here...',
                x: 100, y: 100, width: 250, height: 'auto',
                fontSize: 18, color: '#333333',
                fontFamily: 'Inter', fontWeight: 'normal', textAlign: 'left'
              }];
              setElements(newElements);
              saveToHistory(newElements);
              setSelectedId(newId);
            }}
            icon={<Type className="w-5 h-5" />}
            label={t('step1.title').split(' ')[0]}
          />

          <div className="relative">
            <input
              type="file"
              id="image-upload"
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (re) => {
                    const newId = `img-${Date.now()}`;
                    const newElements: EditorElement[] = [...elements, {
                      id: newId,
                      page: activePage,
                      type: 'image',
                      content: re.target?.result as string,
                      x: 100, y: 100, width: 200, height: 200,
                      fontSize: 0, color: '', fontFamily: '', fontWeight: '', textAlign: 'left'
                    }];
                    setElements(newElements);
                    saveToHistory(newElements);
                    setSelectedId(newId);
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
            <ToolButton
              onClick={() => document.getElementById('image-upload')?.click()}
              icon={<ImagePlus className="w-5 h-5" />}
              label={t('dashboard.modal.title').split(' ')[0]}
            />
          </div>

          <ToolButton
            onClick={() => {
               // ... table creation logic remains internal ...
            }}
            icon={<TableIcon className="w-5 h-5" />}
            label={t('editor.sections.tot').split(' ')[2]}
          />
          <div className="mt-auto">
            <ToolButton icon={<Settings2 className="w-5 h-5" />} label={t('sidebar.settings')} />
          </div>
        </aside>
        )}

        {/* Main Workspace (Multi-Page Canvas) */}
        <main className="flex-1 relative overflow-auto p-12 bg-[#E1E4EB] custom-scrollbar flex flex-col items-center gap-12">

          <div className="fixed bottom-8 right-8 bg-white border border-slate-200 rounded-full shadow-xl flex items-center p-1 gap-2 z-50">
            <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-full">-</button>
            <span className="text-[10px] font-bold w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-full">+</button>
          </div>

          {/* Scalable Document Workspace */}
          <div 
            className="relative flex flex-col items-center gap-12 origin-top transition-transform duration-200"
            style={{ transform: `scale(${zoom})`, width: '100%' }}
          >
            {/* Visual Page Shadows - These sit behind the content */}
            {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
              <div key={pageNum} className="relative group">
                {/* Page Left Tab */}
                <div className="absolute -left-20 top-0 text-[10px] font-black text-slate-400 p-2 border-r border-slate-300 h-full flex flex-col items-center gap-2 pointer-events-none">
                  <span>PAGE</span>
                  <span className="text-2xl text-slate-500">{pageNum}</span>
                  <div className={`w-1 flex-1 rounded-full ${activePage === pageNum ? 'bg-primary' : 'bg-slate-200'}`} />
                </div>

                {/* Page Background Layer */}
                <div
                  className={`bg-white shadow-2xl relative border-2 overflow-hidden transition-all ${activePage === pageNum ? 'border-primary ring-4 ring-primary/5' : 'border-transparent shadow-md hover:border-slate-300'}`}
                  style={{ width: '794px', height: '1123px' }}
                  onClick={() => {
                    setSelectedId(null);
                    setActivePage(pageNum);
                  }}
                >
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                  
                  {/* Page No. - Visual Decoration Only */}
                  {pageNum > 1 && (
                    <div 
                      className="absolute bottom-10 left-0 right-0 flex justify-center pointer-events-none"
                      style={{ fontFamily: '"Computer Modern Serif", serif', fontSize: '10pt', color: '#64748B' }}
                    >
                      <span className="px-4 py-1 border-t border-slate-100 min-w-[30px] text-center font-bold">
                        {pageNum < introStartPage 
                          ? toRoman(pageNum - 1).toLowerCase() 
                          : (pageNum - introStartPage + 1)}
                      </span>
                    </div>
                  )}

                  {/* Chapter Flow Content — rendered with wizard-identical logic */}
                  {chapterFlowPages.has(pageNum) && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '60px',
                        left: '80px',
                        right: '80px',
                        bottom: '60px',
                        overflow: 'hidden',
                        fontFamily: '"Computer Modern Serif", serif',
                      }}
                    >
                      {chapterFlowPages.get(pageNum)!.map((seg, idx) => (
                        <EditorChapterSegment key={idx} segment={seg} idx={idx} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Global Interaction Layer (Elements) - Overlays all pages */}
            <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none flex flex-col items-center">
              <div className="relative" style={{ width: '794px', height: `${numPages * (PAGE_HEIGHT + PAGE_GAP)}px` }}>
                {elements.filter(el => !chapterElementIds.has(el.id)).map((el) => (
                  <Rnd
                    key={el.id}
                    size={{ width: el.width, height: el.height }}
                    position={{ 
                      x: el.x, 
                      y: getAbsoluteY(el.page, el.y) 
                    }}
                    onDragStop={(e, d) => {
                      const pos = getLocalPos(d.y);
                      const oldAbsY = getAbsoluteY(el.page, el.y);
                      const newAbsY = getAbsoluteY(pos.page, pos.y);
                      const dy = newAbsY - oldAbsY;

                      const movedElements = elements.map(item => 
                        item.id === el.id ? { ...item, x: d.x, page: pos.page, y: pos.y } : item
                      );
                      const shifted = applyRelativeShift(movedElements, el.id, dy, estimateHeight);
                      setElements(shifted);
                      saveToHistory(shifted);
                    }}
                    onResizeStop={(e, dir, ref, delta, pos) => {
                      const globalPos = getLocalPos(pos.y);
                      const newH = parseInt(ref.style.height);
                      const oldH = typeof el.height === 'number' ? el.height : estimateHeight(el.content, el.type);
                      const dy = newH - oldH;

                      const resizedElements = elements.map(item => 
                        item.id === el.id ? { 
                          ...item, 
                          width: ref.style.width, 
                          height: ref.style.height, 
                          page: globalPos.page, 
                          y: globalPos.y 
                        } : item
                      );
                      const shifted = applyRelativeShift(resizedElements, el.id, dy, estimateHeight);
                      setElements(shifted);
                      saveToHistory(shifted);
                    }}
                    onDragStart={() => {
                      setSelectedId(el.id);
                      setActivePage(el.page);
                    }}
                    bounds="parent" // Bound to the global doc relative height
                    scale={zoom}
                    className={`flex items-center group pointer-events-auto ${selectedId === el.id ? 'ring-2 ring-primary ring-offset-2 z-50' : 'z-10'} ${el.id === 'logo-main' ? 'cursor-pointer hover:ring-2 hover:ring-primary' : ''}`}
                    enableResizing={selectedId === el.id && editingId !== el.id}
                    disableDragging={selectedId !== el.id || editingId === el.id}
                    onDoubleClick={() => {
                      if (el.id === 'logo-main') return; // Handled by click
                      if (el.type === 'image' || el.type === 'table') return;
                      const raw = el.content.replace(/<div[^>]*>|<\/div>/g, '').trim();
                      setEditingContent(raw);
                      setEditingId(el.id);
                    }}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      setSelectedId(el.id);
                      setActivePage(el.page);
                      if (el.id === 'logo-main') {
                        logoInputRef.current?.click();
                      }
                    }}
                  >
                    {el.type === 'image' ? (
                      <div className="flex flex-col items-center w-full h-full relative group/img z-10" style={{ minHeight: '100px' }}>
                        {el.content ? (
                          <img src={el.content} className="w-full h-full object-contain pointer-events-none border border-emerald-500/10 rounded-lg" />
                        ) : (
                          <div className="flex flex-col items-center justify-center w-full h-full bg-slate-100 rounded-xl border-2 border-dashed border-slate-300">
                            <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
                            <span className="text-[10px] text-slate-400">Image vide ou corrompue</span>
                          </div>
                        )}
                        {el.caption && (
                          <div className="mt-2 text-[10px] font-bold text-slate-500 italic text-center w-full bg-white/80 py-1 rounded backdrop-blur-sm">
                            {el.caption}
                          </div>
                        )}
                      </div>
                    ) : el.type === 'table' ? (
                      <div className="flex flex-col w-full h-full gap-2">
                        {el.caption && (
                          <div className="text-[10px] font-bold text-slate-500 italic text-center w-full bg-white/80 py-1 rounded backdrop-blur-sm">
                            {el.caption}
                          </div>
                        )}
                        <div className="w-full h-full outline-none bg-white shadow-xl rounded-xl overflow-hidden border border-slate-200">
                          <Table className="border-collapse w-full h-full">
                          <TableBody>
                            {(() => {
                              try {
                                const data = JSON.parse(el.content);
                                const themes: Record<string, { header: string, stripe: string, highlight: string }> = {
                                  slate: { header: '#0f172a', stripe: '#f1f5f9', highlight: '#e2e8f0' },
                                  blue: { header: '#1d4ed8', stripe: '#eff6ff', highlight: '#dbeafe' },
                                  indigo: { header: '#250136', stripe: '#eef2ff', highlight: '#e0e7ff' },
                                  emerald: { header: '#047857', stripe: '#ecfdf5', highlight: '#d1fae5' },
                                  amber: { header: '#ea580c', stripe: '#fff7ed', highlight: '#ffedd5' },
                                  rose: { header: '#be123c', stripe: '#fff1f2', highlight: '#ffe4e6' }
                                };
                                const theme = themes[el.tableSettings?.themeColor || 'indigo'] || themes.slate;

                                return data.map((row: string[], ridx: number) => (
                                  <TableRow key={ridx} style={{ borderBottom: '2px solid #e2e8f0', backgroundColor: ridx === 0 ? theme.header : '#ffffff' }}>
                                    {row.map((cell: string, cidx: number) => (
                                      <TableCell key={cidx} style={{ 
                                        fontSize: `${el.fontSize}px`, 
                                        fontFamily: el.fontFamily, 
                                        textAlign: el.textAlign, 
                                        padding: '20px', 
                                        color: ridx === 0 ? '#ffffff' : '#000000' 
                                      }}>
                                        {cell}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                ));
                              } catch (e) {
                                return <TableRow><TableCell className="p-10 text-red-500 font-bold">Invalid table data structure</TableCell></TableRow>;
                              }
                            })()}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                    ) : (
                      <div
                        className={`w-full h-full outline-none p-0 border-2 bg-white ${selectedId === el.id ? 'border-primary border-dashed' : 'border-transparent group-hover:border-slate-200'}`}
                        style={{
                          fontSize: `${el.fontSize}px`,
                          color: el.color,
                          fontFamily: el.fontFamily,
                          fontWeight: el.fontWeight,
                          textAlign: el.textAlign,
                          whiteSpace: 'pre-wrap',
                          lineHeight: 1.7
                        }}
                        dangerouslySetInnerHTML={{ 
                          __html: el.id === 'toc-l' ? el.content + autoContent.tocContent :
                                 el.id === 'tof-l' ? el.content + autoContent.tofContent :
                                 el.id === 'tot-l' ? el.content + autoContent.totContent :
                                 el.content 
                        }}
                      />
                    )}

                    {editingId === el.id && (
                      <textarea
                        autoFocus
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        onBlur={() => {
                          const styleMatch = el.content.match(/style="([^"]*)"/);
                          const style = styleMatch ? styleMatch[1] : '';
                          const wrapped = `<div style="${style}">${editingContent}</div>`;
                          updateElement(el.id, { content: wrapped });
                          setEditingId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            e.currentTarget.blur();
                          }
                          if (e.key === 'Escape') {
                            setEditingId(null);
                          }
                        }}
                        className="absolute inset-0 w-full h-full bg-white z-[60] outline-none p-0 resize-none overflow-hidden ring-4 ring-primary/20 shadow-2xl"
                        style={{
                          fontSize: `${el.fontSize}px`,
                          color: el.color,
                          fontFamily: el.fontFamily,
                          fontWeight: el.fontWeight,
                          textAlign: el.textAlign,
                          lineHeight: 1.7
                        }}
                      />
                    )}
                    
                    {selectedId === el.id && editingId !== el.id && (
                      <>
                        <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-white border-2 border-primary rounded-full z-50"></div>
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white border-2 border-primary rounded-full z-50"></div>
                        <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-white border-2 border-primary rounded-full z-50"></div>
                        <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-white border-2 border-primary rounded-full z-50"></div>
                      </>
                    )}
                  </Rnd>
                ))}
              </div>
            </div>
          </div>

          {/* Add Page Button */}
          <button
            onClick={() => setNumPages(prev => prev + 1)}
            className="w-[794px] h-[150px] border-4 border-dashed border-slate-300 rounded-[2rem] flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all duration-500 group shadow-sm hover:shadow-xl shrink-0"
          >
            <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-all duration-300">
              <Plus className="w-6 h-6" />
            </div>
            <span className="font-bold text-sm uppercase tracking-widest">{t('editor.addNewPage')}</span>
          </button>
        </main>

        {/* Right Info Sidebar */}
        {!isZenMode && (
          <aside className="hidden lg:flex w-[280px] bg-white border-l border-slate-200 flex-col shrink-0 p-6 z-40 overflow-y-auto animate-in slide-in-from-right-4 duration-500">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
            <MousePointer2 className="w-4 h-4" /> {t('editor.selectionInfo')}
          </h3>

            {selectedElement ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('editor.manageElement')}</span>
                   <button 
                     onClick={() => {
                        const newElements = elements.filter(el => el.id !== selectedId);
                        setElements(newElements);
                        saveToHistory(newElements);
                        setSelectedId(null);
                     }}
                     className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-500 rounded-lg transition-colors border border-red-100 hover:bg-red-500 hover:text-white group"
                     title={t('editor.deleteElement')}
                   >
                     <Trash2 className="w-3.5 h-3.5" />
                     <span className="text-[10px] font-bold uppercase tracking-tight">{t('editor.supprimer')}</span>
                   </button>
                </div>

                {/* --- SIDEBAR TOOLBAR (Format Toolbox) --- */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">{t('editor.appearance')}</label>
                   
                   <div className="space-y-3 p-1">
                      {/* Font Family */}
                      <div className="relative">
                        <select
                          value={selectedElement.fontFamily}
                          onChange={(e) => updateElement(selectedId!, { fontFamily: e.target.value })}
                          className="w-full bg-slate-50 text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 outline-none appearance-none hover:border-primary/30 transition-all"
                        >
                          <optgroup label="Serif">
                            <option value='"Computer Modern Serif", serif'>Modern Roman (Standard)</option>
                            <option value="serif">Classic Serif</option>
                            <option value="'Playfair Display', serif">Playfair Display</option>
                          </optgroup>
                          <optgroup label="Sans Serif">
                            <option value="'Inter', sans-serif">Inter (Modern)</option>
                            <option value="'Montserrat', sans-serif">Montserrat</option>
                            <option value="'Outfit', sans-serif">Outfit</option>
                          </optgroup>
                        </select>
                        <Type className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>

                      {/* Row 2: Size & Color & Bold */}
                      <div className="flex items-center gap-2">
                         <div className="flex-1 flex items-center bg-slate-50 rounded-xl border border-slate-200 overflow-hidden group">
                           <button onClick={() => updateElement(selectedId!, { fontSize: Math.max(8, (selectedElement.fontSize || 0) - 2) })} className="px-3 py-2 hover:bg-slate-200 text-slate-600 font-bold transition-colors border-r border-slate-100">-</button>
                           <input
                             type="number"
                             value={selectedElement.fontSize}
                             onChange={(e) => updateElement(selectedId!, { fontSize: parseInt(e.target.value) || 12 })}
                             className="w-full bg-white/50 text-[13px] font-black text-slate-900 text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                           />
                           <button onClick={() => updateElement(selectedId!, { fontSize: (selectedElement.fontSize || 0) + 2 })} className="px-3 py-2 hover:bg-slate-200 text-slate-600 font-bold transition-colors border-l border-slate-100">+</button>
                         </div>

                         <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 hover:border-primary/30 transition-all cursor-pointer relative overflow-hidden">
                            <input
                              type="color"
                              value={selectedElement.color}
                              onChange={(e) => updateElement(selectedId!, { color: e.target.value })}
                              className="w-6 h-6 rounded-md border-0 cursor-pointer p-0 bg-transparent"
                            />
                            <Palette className="w-3.5 h-3.5 text-slate-400" />
                         </div>

                         <button
                           onClick={() => updateElement(selectedId!, { fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold' })}
                           className={`p-2.5 rounded-xl font-black text-xs min-w-[36px] transition-all border ${selectedElement.fontWeight === 'bold' ? 'bg-primary text-white border-primary shadow-lg' : 'bg-white text-slate-400 border-slate-200 hover:border-primary/30'}`}
                         >B</button>
                      </div>

                      {/* Row 2.5: AI Boost */}
                      {selectedElement.type === 'text' && (
                        <button
                          onClick={handleAiRefine}
                          disabled={isAiLoading}
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
                        >
                          {isAiLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>{t('editor.aiThinking') || 'AI Thinking...'}</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              <span>{t('editor.aiBoost') || 'Boost with AI'}</span>
                            </>
                          )}
                        </button>
                      )}

                      {/* Row 3: Alignment */}
                      <div className="flex items-center p-1 bg-slate-50 rounded-xl border border-slate-200">
                        {(['left', 'center', 'right', 'justify'] as const).map(align => (
                          <button
                            key={align}
                            onClick={() => updateElement(selectedId!, { textAlign: align })}
                            className={`flex-1 flex justify-center py-2 rounded-lg transition-all ${selectedElement.textAlign === align ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                          >
                            {align === 'left' && <AlignLeft className="w-4 h-4" />}
                            {align === 'center' && <AlignCenter className="w-4 h-4" />}
                            {align === 'right' && <AlignRight className="w-4 h-4" />}
                            {align === 'justify' && <div className="text-[9px] font-black">JUST</div>}
                          </button>
                        ))}
                      </div>
                   </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Content Editor</label>
                  {selectedElement.type === 'table' ? (
                    <div className="space-y-6">
                      {/* ... table settings ... */}
                    {/* 1. Options de style de tableau (Matches Word Image) */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Settings2 className="w-3 h-3" /> {t('editor.tableOptions')}
                      </label>
                      <div className="grid grid-cols-2 gap-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        {[
                          { id: 'showHeaderRow', label: t('editor.options.headerRow') },
                          { id: 'showFirstColumn', label: t('editor.options.firstColumn') },
                          { id: 'showTotalRow', label: t('editor.options.totalRow') },
                          { id: 'showLastColumn', label: t('editor.options.lastColumn') },
                          { id: 'stripeRows', label: t('editor.options.stripeRows') },
                          { id: 'stripeColumns', label: t('editor.options.stripeColumns') },
                        ].map(opt => (
                          <label key={opt.id} className="flex items-center gap-2 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={!!(selectedElement.tableSettings as any)?.[opt.id]}
                              onChange={(e) => {
                                const settings = selectedElement.tableSettings || {
                                  showHeaderRow: true, showTotalRow: false, stripeRows: true,
                                  showFirstColumn: true, showLastColumn: false, stripeColumns: false,
                                  themeColor: 'indigo'
                                };
                                updateElement(selectedId!, {
                                  tableSettings: { ...settings, [opt.id]: e.target.checked }
                                });
                              }}
                              className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                            />
                            <span className="text-[10px] font-medium text-slate-600 group-hover:text-primary transition-colors">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* 2. Styles de tableau (Color Gallery Matches Word Image) */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Palette className="w-3 h-3" /> {t('editor.tableStyles')}
                      </label>
                      <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar">
                        {[
                          { id: 'slate', hex: '#0f172a' },
                          { id: 'blue', hex: '#1d4ed8' },
                          { id: 'amber', hex: '#ea580c' },
                          { id: 'emerald', hex: '#047857' },
                          { id: 'indigo', hex: '#250136' },
                          { id: 'rose', hex: '#be123c' },
                        ].map(theme => (
                          <button
                            key={theme.id}
                            onClick={() => {
                              const settings = selectedElement.tableSettings || {
                                showHeaderRow: true, showTotalRow: false, stripeRows: true,
                                showFirstColumn: true, showLastColumn: false, stripeColumns: false,
                                themeColor: 'indigo'
                              };
                              updateElement(selectedId!, { tableSettings: { ...settings, themeColor: theme.id } });
                            }}
                            className={`shrink-0 w-12 h-10 rounded-lg border-2 transition-all p-1 ${selectedElement.tableSettings?.themeColor === theme.id ? 'border-primary ring-2 ring-primary/20 scale-105' : 'border-slate-200 hover:border-slate-300'}`}
                          >
                            <div className="w-full h-full rounded shadow-inner flex flex-col gap-0.5 overflow-hidden">
                              <div style={{ backgroundColor: theme.hex, height: '33%', width: '100%' }} />
                              <div className="flex-1 flex flex-col gap-0.5 p-0.5 bg-white">
                                <div className="h-0.5 w-full bg-slate-100" />
                                <div className="h-0.5 w-full bg-slate-50" />
                                <div className="h-0.5 w-full bg-slate-100" />
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 3. Add / Remove Control Buttons */}
                    <div className="space-y-4 pt-2 border-t border-slate-100">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">{t('editor.structureControls')}</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            try {
                              const data = JSON.parse(selectedElement.content);
                              const newRow = Array(data[0].length).fill('New Cell');
                              updateElement(selectedId!, { content: JSON.stringify([...data, newRow]) });
                            } catch (e) { }
                          }}
                          className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 p-2 rounded-lg transition-colors border border-slate-200"
                        >{t('editor.addRow')}</button>
                        <button
                          onClick={() => {
                            try {
                              const data = JSON.parse(selectedElement.content);
                              if (data.length > 1) {
                                updateElement(selectedId!, { content: JSON.stringify(data.slice(0, -1)) });
                              }
                            } catch (e) { }
                          }}
                          className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 p-2 rounded-lg transition-colors border border-slate-200 text-red-500"
                        >{t('editor.removeRow')}</button>
                        <button
                          onClick={() => {
                            try {
                              const data = JSON.parse(selectedElement.content);
                              const newData = data.map((row: string[]) => [...row, t('editor.placeholderContent')]);
                              updateElement(selectedId!, { content: JSON.stringify(newData) });
                            } catch (e) { }
                          }}
                          className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 p-2 rounded-lg transition-colors border border-slate-200"
                        >{t('editor.addCol')}</button>
                        <button
                          onClick={() => {
                            try {
                              const data = JSON.parse(selectedElement.content);
                              if (data[0].length > 1) {
                                const newData = data.map((row: string[]) => row.slice(0, -1));
                                updateElement(selectedId!, { content: JSON.stringify(newData) });
                              }
                            } catch (e) { }
                          }}
                          className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 p-2 rounded-lg transition-colors border border-slate-200 text-red-500"
                        >{t('editor.removeCol')}</button>
                      </div>

                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {(() => {
                          try {
                            const data = JSON.parse(selectedElement.content);
                            return data.map((row: string[], ridx: number) => (
                              <div key={ridx} className="flex gap-2">
                                {row.map((cell: string, cidx: number) => (
                                  <input
                                    key={cidx}
                                    type="text"
                                    value={cell}
                                    onChange={(e) => {
                                      const newData = [...data];
                                      newData[ridx][cidx] = e.target.value;
                                      updateElement(selectedId!, { content: JSON.stringify(newData) });
                                    }}
                                    className="w-full bg-slate-50 text-[10px] p-2 rounded border border-slate-100 outline-none focus:border-primary/20"
                                  />
                                ))}
                              </div>
                            ));
                          } catch (e) { return null; }
                        })()}
                      </div>
                    </div>
                  </div>
                 ) : (
                   <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col items-center text-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm text-primary">
                        <Type className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-widest text-[#250136] mb-1">Édition Rapide</p>
                        <p className="text-[10px] font-medium text-slate-400">Double-cliquez directement sur le texte sur la page pour modifier le contenu.</p>
                      </div>
                   </div>
                 )}
                <button 
                  onClick={() => deleteElement(selectedId!)}
                  className="w-full mt-6 py-2 text-[10px] font-bold text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >Delete Element</button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col pt-4">
               {/* Sidebar Tabs */}
               <div className="flex gap-4 mb-8 px-2 border-b border-slate-100 pb-2">
                  <button 
                    onClick={() => setIsCommentsOpen(false)}
                    className={`text-[10px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all ${!isCommentsOpen ? 'border-primary text-primary' : 'border-transparent text-slate-400'}`}
                  >Settings</button>
                  <button 
                    onClick={() => setIsCommentsOpen(true)}
                    className={`text-[10px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all ${isCommentsOpen ? 'border-primary text-primary' : 'border-transparent text-slate-400'}`}
                  >Feedbacks ({comments.length})</button>
               </div>

               {isCommentsOpen ? (
                 <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
                    <div className="space-y-4">
                       {comments.map((comment, i) => (
                         <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                            <div className="flex items-center justify-between">
                               <span className="text-[9px] font-black text-primary uppercase">{comment.authorName}</span>
                               <span className="text-[8px] text-slate-400 font-bold">{new Date(comment.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-[11px] text-[#250136] font-medium leading-relaxed">{comment.text}</p>
                            
                            {comment.thread && comment.thread.length > 0 && (
                              <div className="mt-3 pl-3 border-l-2 border-slate-200 space-y-3">
                                 {comment.thread.map((reply: any, ri: number) => (
                                   <div key={ri} className="space-y-1">
                                      <p className="text-[8px] font-black text-slate-500 uppercase">{reply.authorName}</p>
                                      <p className="text-[10px] text-slate-600">{reply.text}</p>
                                   </div>
                                 ))}
                              </div>
                            )}

                             <div className="pt-2 flex gap-2">
                                <input 
                                  type="text" 
                                  placeholder="Répondre..." 
                                  className="flex-1 bg-white border border-slate-200 text-[10px] px-3 py-1.5 rounded-lg outline-none focus:border-primary/30"
                                  onKeyDown={async (e) => {
                                    if (e.key === 'Enter') {
                                      const text = (e.target as HTMLInputElement).value;
                                      if (!text) return;
                                      try {
                                        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/comments/${comment._id}/reply`, {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ text }),
                                          credentials: 'include'
                                        });
                                        if (res.ok) {
                                          const updated = await res.json();
                                          setComments(prev => prev.map(c => c._id === comment._id ? updated : c));
                                          (e.target as HTMLInputElement).value = '';
                                        }
                                      } catch (err) { console.error(err); }
                                    }
                                  }}
                                />
                             </div>
                         </div>
                       ))}
                    </div>

                    <div className="mt-auto pt-6 border-t border-slate-100">
                       <textarea 
                         value={newCommentText}
                         onChange={(e) => setNewCommentText(e.target.value)}
                         placeholder="Ajouter une note ou feedback..."
                         className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-[11px] outline-none focus:border-indigo-300 min-h-[100px] shadow-inner"
                       />
                       <button 
                         onClick={async () => {
                           if (!newCommentText) return;
                           try {
                             const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/comments`, {
                               method: 'POST',
                               headers: { 'Content-Type': 'application/json' },
                               body: JSON.stringify({ rapportId, sectionId: 'general', text: newCommentText }),
                               credentials: 'include'
                             });
                             if (res.ok) {
                               const created = await res.json();
                               setComments(prev => [created, ...prev]);
                               setNewCommentText('');
                             }
                           } catch (err) { console.error(err); }
                         }}
                         className="w-full mt-3 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                       >
                         Commenter
                       </button>
                    </div>
                 </div>
               ) : (
                 <div className="flex-1 flex flex-col gap-8">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Settings2 className="w-3 h-3" /> Encadrement & Suivi
                       </label>
                       
                       <div className="space-y-4 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner">
                          <p className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wide">Superviseur Assigné</p>
                          <select 
                            value={supervisorId || ''}
                            onChange={(e) => setSupervisorId(e.target.value)}
                            className="w-full bg-white border border-slate-200 p-4 rounded-2xl text-xs font-bold text-[#250136] outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                          >
                             <option value="">Aucun Superviseur</option>
                             {supervisors.map(s => (
                               <option key={s._id} value={s._id}>{s.profile?.name || s.email}</option>
                             ))}
                          </select>
                          <p className="text-[9px] text-slate-400 font-medium leading-relaxed italic">
                            Votre superviseur pourra voir ce rapport directement sur son tableau de bord et laisser des commentaires.
                          </p>
                       </div>
                    </div>

                    <div className="mt-8 space-y-4 opacity-50">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Layers className="w-3 h-3" /> Paramètres Document
                       </label>
                       <div className="bg-white p-6 rounded-[2rem] border border-slate-100 space-y-3">
                          <div className="flex justify-between items-center text-[10px] font-bold">
                             <span className="text-slate-500">Auto-Correction</span>
                             <div className="w-8 h-4 bg-emerald-500 rounded-full relative"><div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-sm" /></div>
                          </div>
                          <div className="flex justify-between items-center text-[10px] font-bold">
                             <span className="text-slate-500">Reflow Dynamique</span>
                             <div className="w-8 h-4 bg-primary rounded-full relative"><div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-sm" /></div>
                          </div>
                       </div>
                    </div>
                 </div>
               )}
            </div>
          )}
        </aside>
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #E1E4EB; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #C4C9D5; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #B3B7C4; }
      `}</style>


      {/* Citation Manager Modal */}
      {isCitationModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-[#250136]/60 backdrop-blur-md" onClick={() => setIsCitationModalOpen(false)} />
           <div className="w-full max-w-4xl h-[80vh] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden relative z-10 border border-white/20 animate-in zoom-in-95 duration-500 flex flex-col">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-20">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                     <Bookmark className="w-5 h-5" />
                   </div>
                   <div>
                     <h3 className="text-xl font-black text-[#250136] tracking-tight">Gestion des Citations</h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Formatage Académique Automatique</p>
                   </div>
                 </div>
                 <button onClick={() => setIsCitationModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                    <X className="w-5 h-5 text-slate-400" />
                 </button>
              </div>
              
              <div className="flex-1 flex overflow-hidden">
                 {/* Form Side */}
                 <div className="w-1/2 p-8 border-r border-slate-100 overflow-y-auto custom-scrollbar space-y-6">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type & Format</label>
                       <div className="flex gap-2">
                          <select 
                            value={newCitation.format}
                            onChange={(e) => setNewCitation({...newCitation, format: e.target.value})}
                            className="flex-1 bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs font-bold outline-none focus:border-amber-400"
                          >
                             <option value="APA">APA Style</option>
                             <option value="IEEE">IEEE Style</option>
                          </select>
                          <select 
                             value={newCitation.type}
                             onChange={(e) => setNewCitation({...newCitation, type: e.target.value})}
                             className="flex-1 bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs font-bold outline-none focus:border-amber-400"
                          >
                             <option value="article">Article</option>
                             <option value="book">Livre</option>
                             <option value="web">Site Web</option>
                          </select>
                       </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-50">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Détails de la Source</label>
                       <input 
                         type="text" 
                         placeholder="Titre de l'ouvrage / article"
                         value={newCitation.title}
                         onChange={(e) => setNewCitation({...newCitation, title: e.target.value})}
                         className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs font-medium outline-none focus:border-amber-400"
                       />
                       <input 
                         type="text" 
                         placeholder="Auteurs (séparés par des virgules)"
                         value={newCitation.authors.join(', ')}
                         onChange={(e) => setNewCitation({...newCitation, authors: e.target.value.split(',').map(s => s.trim())})}
                         className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs font-medium outline-none focus:border-amber-400"
                       />
                       <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Année"
                            value={newCitation.year}
                            onChange={(e) => setNewCitation({...newCitation, year: e.target.value})}
                            className="w-1/3 bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs font-medium outline-none focus:border-amber-400"
                          />
                          <input 
                            type="text" 
                            placeholder="Éditeur / Journal"
                            value={newCitation.publisher || newCitation.journal}
                            onChange={(e) => setNewCitation({...newCitation, publisher: e.target.value, journal: e.target.value})}
                            className="flex-1 bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs font-medium outline-none focus:border-amber-400"
                          />
                       </div>
                    </div>

                    <button 
                      onClick={async () => {
                         if (!newCitation.title) return;
                         try {
                           const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/citations`, {
                             method: 'POST',
                             headers: { 'Content-Type': 'application/json' },
                             body: JSON.stringify({ rapportId, ...newCitation }),
                             credentials: 'include'
                           });
                           if (res.ok) {
                             const created = await res.json();
                             setCitations(prev => [...prev, created]);
                             setNewCitation({ type: 'article', format: 'APA', authors: [''], title: '', year: '', journal: '', publisher: '' });
                           }
                         } catch (e) { console.error(e); }
                      }}
                      className="w-full py-4 bg-amber-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-amber-100 hover:bg-amber-600 transition-all active:scale-[0.98]"
                    >
                      Enregistrer la Citation
                    </button>
                 </div>

                 {/* List Side */}
                 <div className="w-1/2 p-8 bg-slate-50/50 overflow-y-auto custom-scrollbar">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-4 block">Références existantes ({citations.length})</label>
                    <div className="space-y-4">
                       {citations.length === 0 ? (
                         <div className="h-64 flex flex-col items-center justify-center text-slate-300 opacity-50">
                            <Quote className="w-12 h-12 mb-2" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">Aucune citation</p>
                         </div>
                       ) : (
                         citations.map((cite, i) => (
                           <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 group/cite relative overflow-hidden">
                              <div className="flex items-center justify-between relative z-10">
                                 <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">{cite.shortLabel}</span>
                                 <div className="flex gap-2">
                                    <button 
                                      onClick={() => {
                                         navigator.clipboard.writeText(cite.shortLabel);
                                         // notify user
                                      }}
                                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-amber-600 transition-colors"
                                      title="Copier le label"
                                    >
                                       <Plus className="w-3.5 h-3.5" />
                                    </button>
                                    <button 
                                      onClick={async () => {
                                         try {
                                           await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/citations/${cite._id}`, {
                                             method: 'DELETE',
                                             credentials: 'include'
                                           });
                                           setCitations(prev => prev.filter(c => c._id !== cite._id));
                                         } catch (e) { console.error(e); }
                                      }}
                                      className="p-1.5 hover:bg-red-50 rounded-lg text-slate-300 hover:text-red-500 transition-colors"
                                    >
                                       <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                 </div>
                              </div>
                              <p className="text-[11px] text-[#250136] font-medium leading-relaxed italic pr-4">{cite.fullReference}</p>
                           </div>
                         ))
                       )}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

function ToolButton({ icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 group transition-all">
      <div className={`p-3 rounded-2xl transition-all shadow-sm ${active ? 'bg-primary text-white scale-110' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-bold uppercase tracking-wider ${active ? 'text-primary' : 'text-slate-400'}`}>{label}</span>
    </button>
  );
}
