'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/app/context/auth-context';
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
  BarChart3,
  ListChecks,
  LayoutGrid,
  ClipboardList,
  AlertCircle
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
const reflowElements = (elements: any[], targetId: string, estimateHeightFn: (c: string, t: any) => number) => {
  // 1. Sort elements by their logical vertical order (page then y)
  const sorted = [...elements].sort((a, b) => {
    const ay = (a.page - 1) * 10000 + a.y;
    const by = (b.page - 1) * 10000 + b.y;
    return ay - by;
  });

  const targetIdx = sorted.findIndex(el => el.id === targetId);
  if (targetIdx === -1) return sorted;

  // The reflow starts from the element AFTER the one that was moved/resized
  let currentAbsoluteY = getAbsoluteY(sorted[targetIdx].page, sorted[targetIdx].y) + 
                         estimateHeightFn(sorted[targetIdx].content, sorted[targetIdx].type) + 
                         STANDARD_GAP;

  const newElements = [...sorted];

  for (let i = targetIdx + 1; i < newElements.length; i++) {
    const el = newElements[i];
    const height = estimateHeightFn(el.content, el.type);
    const pos = getLocalPos(currentAbsoluteY);

    // If it overflows the "Red Zone", bump it to the next page
    if (pos.y + height > MARGIN_BOTTOM) {
      const bumpedY = getAbsoluteY(pos.page + 1, MARGIN_TOP);
      const bumpedPos = getLocalPos(bumpedY);
      newElements[i] = { ...el, page: bumpedPos.page, y: bumpedPos.y };
      currentAbsoluteY = bumpedY + height + STANDARD_GAP;
    } else {
      newElements[i] = { ...el, page: pos.page, y: pos.y };
      currentAbsoluteY += height + STANDARD_GAP;
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
  if (type === 'image') return 600; // Increased to 600 to prevent caption overlap
  if (type === 'heading') return 120;
  if (type === 'table') {
    try {
      const data = JSON.parse(content);
      return (data.length * 80) + 200; // Significant increase for spacing
    } catch (e) {
      return 350;
    }
  }

  // Estimate height for text based on char count
  const charsPerLine = 85;
  const pixelsPerLine = 26;
  const textOnly = content.replace(/<[^>]*>/g, '');
  const paragraphs = textOnly.split('\n');
  let totalLines = 0;
  paragraphs.forEach(p => {
    totalLines += Math.max(1, Math.ceil(p.length / charsPerLine));
  });
  return totalLines * pixelsPerLine + 60;
};

// Simplified Roman Numerals for headings
const rom = (n: number) => {
  const map: any = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X' };
  return map[n] || n.toString();
};

const getChapterSegments = (chapter: any, chapIdx: number, counters: { fig: number; tbl: number }): any[] => {
  const segments: any[] = [];
  const styles = {
    l1: 'font-size: 14pt; font-weight: 900; color: #DC2626; display: block; margin-bottom: 8px; margin-top: 16px;',
    l2: 'font-size: 12pt; font-weight: 900; color: #16A34A; display: block; margin-bottom: 4px; margin-top: 12px; margin-left: 20px;',
    l3: 'font-size: 12pt; font-weight: 900; color: #000000; display: block; margin-bottom: 4px; margin-top: 8px; margin-left: 40px;',
    text: 'font-size: 12pt; font-weight: normal; color: #000000; display: block; margin-bottom: 8px;'
  };

  // 1. Title Heading
  segments.push({
    id: `chap-${chapIdx}-label`,
    type: 'heading',
    content: `CHAPITRE ${chapIdx + 1}: ${chapter.title?.toUpperCase() || ''}`
  });

  // 2. Introduction
  if (chapter.introduction) {
    segments.push({
      id: `chap-${chapIdx}-intro-txt`,
      type: 'text',
      content: `<div style="${styles.text}">${chapter.introduction}</div>`
    });
  }

  // 3. Intro Images & Tables
  if (chapter.images) {
    chapter.images.forEach((img: any, i: number) => {
      counters.fig++;
      segments.push({
        id: `chap-${chapIdx}-intro-img-${i}`,
        type: 'image',
        content: img.src,
        caption: `Figure ${counters.fig}: ${img.caption || ''}`
      });
    });
  }
  if (chapter.tables) {
    chapter.tables.forEach((tbl: any, i: number) => {
      counters.tbl++;
      segments.push({
        id: `chap-${chapIdx}-intro-tbl-${i}`,
        type: 'table',
        content: JSON.stringify([tbl.headers, ...tbl.rows]),
        caption: `Tableau ${counters.tbl}: ${tbl.caption || ''}`
      });
    });
  }

  // 4. Recursive Sections
  if (chapter.sections) {
    chapter.sections.forEach((s: any, sIdx: number) => {
      // Level 1
      segments.push({
        id: `chap-${chapIdx}-s-${sIdx}-label`,
        type: 'text',
        content: `<div style="${styles.l1}">${rom(sIdx + 1)}. ${s.title?.toUpperCase() || ''}</div>`
      });
      if (s.content) {
        segments.push({
          id: `chap-${chapIdx}-s-${sIdx}-txt`,
          type: 'text',
          content: `<div style="${styles.text}">${s.content}</div>`
        });
      }
      if (s.images) {
        s.images.forEach((img: any, i: number) => {
          counters.fig++;
          segments.push({
            id: `chap-${chapIdx}-s-${sIdx}-img-${i}`,
            type: 'image',
            content: img.src,
            caption: `Figure ${counters.fig}: ${img.caption || ''}`
          });
        });
      }
      if (s.tables) {
        s.tables.forEach((tbl: any, i: number) => {
          counters.tbl++;
          segments.push({
            id: `chap-${chapIdx}-s-${sIdx}-tbl-${i}`,
            type: 'table',
            content: JSON.stringify([tbl.headers, ...tbl.rows]),
            caption: `Tableau ${counters.tbl}: ${tbl.caption || ''}`
          });
        });
      }

      // Level 2
      if (s.subsections) {
        s.subsections.forEach((ss: any, ssIdx: number) => {
          segments.push({
            id: `chap-${chapIdx}-s-${sIdx}-ss-${ssIdx}-label`,
            type: 'text',
            content: `<div style="${styles.l2}">${ssIdx + 1}. ${ss.title || ''}</div>`
          });
          if (ss.content) {
            segments.push({
              id: `chap-${chapIdx}-s-${sIdx}-ss-${ssIdx}-txt`,
              type: 'text',
              content: `<div style="${styles.text}; margin-left: 20px;">${ss.content}</div>`
            });
          }
          if (ss.images) {
            ss.images.forEach((img: any, i: number) => {
              counters.fig++;
              segments.push({
                id: `chap-${chapIdx}-s-${sIdx}-ss-${ssIdx}-img-${i}`,
                type: 'image',
                content: img.src,
                caption: `Figure ${counters.fig}: ${img.caption || ''}`
              });
            });
          }
          if (ss.tables) {
            ss.tables.forEach((tbl: any, i: number) => {
              counters.tbl++;
              segments.push({
                id: `chap-${chapIdx}-s-${sIdx}-ss-${ssIdx}-tbl-${i}`,
                type: 'table',
                content: JSON.stringify([tbl.headers, ...tbl.rows]),
                caption: `Tableau ${counters.tbl}: ${tbl.caption || ''}`
              });
            });
          }

          // Level 3
          if (ss.subsections) {
            ss.subsections.forEach((sss: any, sIdx3: number) => {
              segments.push({
                id: `chap-${chapIdx}-s-${sIdx}-ss-${ssIdx}-sss-${sIdx3}-label`,
                type: 'text',
                content: `<div style="${styles.l3}">${String.fromCharCode(97 + sIdx3)}) ${sss.title || ''}</div>`
              });
              if (sss.content) {
                segments.push({
                  id: `chap-${chapIdx}-s-${sIdx}-ss-${ssIdx}-sss-${sIdx3}-txt`,
                  type: 'text',
                  content: `<div style="${styles.text}; margin-left: 40px;">${sss.content}</div>`
                });
              }
              if (sss.images) {
                sss.images.forEach((img: any, i: number) => {
                  counters.fig++;
                  segments.push({
                    id: `chap-${chapIdx}-s-${sIdx}-ss-${ssIdx}-sss-${sIdx3}-img-${i}`,
                    type: 'image',
                    content: img.src,
                    caption: `Figure ${counters.fig}: ${img.caption || ''}`
                  });
                });
              }
              if (sss.tables) {
                sss.tables.forEach((tbl: any, i: number) => {
                  counters.tbl++;
                  segments.push({
                    id: `chap-${chapIdx}-s-${sIdx}-ss-${ssIdx}-sss-${sIdx3}-tbl-${i}`,
                    type: 'table',
                    content: JSON.stringify([tbl.headers, ...tbl.rows]),
                    caption: `Tableau ${counters.tbl}: ${tbl.caption || ''}`
                  });
                });
              }
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

// --- Main Page Component ---
export default function VisualEditor() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const rapportId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [elements, setElements] = useState<EditorElement[]>([]);
  const [numPages, setNumPages] = useState(3);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.55);
  const [activePage, setActivePage] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error' | 'loading-pdf' | 'loading-docx'>('idle');
  const [introStartPage, setIntroStartPage] = useState(1);
  const [history, setHistory] = useState<EditorElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isInternalChange = useRef(false);

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

      const MARGIN_TOP = 80;
      const MARGIN_BOTTOM = 1060; 
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
              color: seg.type === 'heading' ? '#DC2626' : '#000000',
              fontFamily: '"Computer Modern Serif", serif',
              fontWeight: seg.type === 'heading' ? '900' : 'normal',
              textAlign: seg.type === 'heading' ? 'center' : 'justify'
            });
            curY += height + 40;
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
              color: '#000000',
              fontWeight: 'normal'
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
              color: '#000000',
              fontWeight: 'normal'
            });
            curY += height + 40;
          }
        };

        segments.forEach(seg => processSegment(seg));
        return results;
      };

      // --- PAGE 1: TITLE (Red Zone Safe) ---
      mergedElements.push(
        { id: 'project-label', page: 1, type: 'heading', content: 'RAPPORT DE PROJET', x: MARGIN_LEFT, y: 150, width: CONTENT_WIDTH, height: 'auto', fontSize: 16, color: '#FF7F3F', fontFamily: 'serif', fontWeight: '900', textAlign: 'center' },
        { id: 'title', page: 1, type: 'heading', content: (answers.projectTitle || 'TITRE DE VOTRE RAPPORT').toUpperCase(), x: MARGIN_LEFT, y: 300, width: CONTENT_WIDTH, height: 'auto', fontSize: 40, color: '#250136', fontFamily: 'serif', fontWeight: '900', textAlign: 'center' },
        { id: 'students', page: 1, type: 'text', content: answers.studentNames || 'Noms des Étudiants', x: MARGIN_LEFT, y: 600, width: CONTENT_WIDTH, height: 'auto', fontSize: 22, color: '#250136', fontFamily: 'serif', fontWeight: '700', textAlign: 'center' },
        { id: 'univ', page: 1, type: 'text', content: `${answers.university || 'Université'} - ${answers.company || 'Entreprise'}`, x: MARGIN_LEFT, y: 750, width: CONTENT_WIDTH, height: 'auto', fontSize: 16, color: '#64748B', fontFamily: 'serif', fontWeight: 'normal', textAlign: 'center' }
      );

      const globalCounters = { fig: 0, tbl: 0 };

      // --- PAGE 2+: FRONT MATTER (Red Zone Safe) ---
      curP = 2; curY = MARGIN_TOP;
      if (isBinome) {
        mergedElements.push(...addElements([{ id: 'ded-l-1', type: 'heading', content: `DÉDICACE - ${answers.studentName1 || 'Étudiant 1'}` }, { id: 'ded-c-1', type: 'text', content: answers.dedicace1 || answers.dedicace || '' }], false));
        mergedElements.push(...addElements([{ id: 'ded-l-2', type: 'heading', content: `DÉDICACE - ${answers.studentName2 || 'Étudiant 2'}` }, { id: 'ded-c-2', type: 'text', content: answers.dedicace2 || '' }], false));
      } else {
        mergedElements.push(...addElements([{ id: 'ded-l', type: 'heading', content: 'DÉDICACE' }, { id: 'ded-c', type: 'text', content: answers.dedicace || '' }], false));
      }
      mergedElements.push(...addElements([{ id: 'rem-l', type: 'heading', content: 'REMERCIEMENTS' }, { id: 'rem-c', type: 'text', content: answers.remerciements || '' }], false));

      // NEW: AUTOGEN TABLES PRE-BODY
      const autoPages = [];
      if (answers.resume) autoPages.push({ id: 'resume-l', type: 'heading', content: 'RÉSUMÉ' }, { id: 'resume-t', type: 'text', content: answers.resume.text || answers.resume });
      autoPages.push({ id: 'toc-l', type: 'heading', content: 'SOMMAIRE' }, { id: 'toc-hint', type: 'text', content: '<div style="color: #64748B; font-style: italic; text-align: center;">Généré automatiquement à l\'exportation</div>' });
      autoPages.push({ id: 'tof-l', type: 'heading', content: 'TABLE DES FIGURES' }, { id: 'tof-hint', type: 'text', content: '<div style="color: #64748B; font-style: italic; text-align: center;">Généré automatiquement à l\'exportation</div>' });
      autoPages.push({ id: 'tot-l', type: 'heading', content: 'TABLE DES TABLEAUX' }, { id: 'tot-hint', type: 'text', content: '<div style="color: #64748B; font-style: italic; text-align: center;">Généré automatiquement à l\'exportation</div>' });
      
      mergedElements.push(...addElements(autoPages, false));

      // --- PAGE X: INTRODUCTION ---
      const introSegments: any[] = [
        { id: 'intro-l', type: 'heading', content: 'INTRODUCTION GÉNÉRALE' },
        { id: 'intro-txt', type: 'text', content: [answers.introduction, answers.introContext, answers.introProblem, answers.introObjective].filter(Boolean).map(t => `<div style="text-align: justify;">${t}</div>`).join('\n\n') }
      ];
      mergedElements.push(...addElements(introSegments, true)); // Keep Intro on new page for professionalism
      
      const introEl = mergedElements.find(e => e.id === 'intro-l');
      if (introEl) setIntroStartPage(introEl.page);

      // --- PAGES X+: CHAPTERS (FLOWING MAGNETICALLY) ---
      if (data.chaptersConfig) {
        data.chaptersConfig.forEach((ch: any, i: number) => {
          const chSegments = getChapterSegments(ch, i, globalCounters);
          // Only force first chapter to new page, let others flow if space permits
          mergedElements.push(...addElements(chSegments, i === 0)); 
        });
      }

      // --- PAGE FINAL: CONCLUSION ---
      if (answers.conclusion) {
        mergedElements.push(...addElements([
          { id: 'conc-l', type: 'heading', content: 'CONCLUSION GÉNÉRALE' },
          { id: 'conc-txt', type: 'text', content: answers.conclusion }
        ], false));
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
      setNumPages(Math.max(curP, ...mergedElements.map(e => e.page)));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching rapport:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [rapportId]);

  // --- Handlers ---
  const updateElement = (id: string, updates: Partial<EditorElement>) => {
    const newElements = elements.map(el => el.id === id ? { ...el, ...updates } : el);
    
    // If we updated content/style, we need to reflow everything after this element
    const shouldReflow = updates.content !== undefined || 
                         updates.fontSize !== undefined || 
                         updates.fontFamily !== undefined || 
                         updates.fontWeight !== undefined;

    const finalElements = shouldReflow ? reflowElements(newElements, id, estimateHeight) : newElements;
    
    setElements(finalElements);
    saveToHistory(finalElements);
  };

  const deleteElement = (id: string) => {
    const newElements = elements.filter(el => el.id !== id);
    setElements(newElements);
    saveToHistory(newElements);
    setSelectedId(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      await apiClient(`/rapports/${rapportId}/autosave`, {
        data: { visualLayout: elements, numPages },
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

  const handleExport = async (type: 'pdf' | 'docx') => {
    try {
      if (type === 'pdf') setSaveStatus('loading-pdf');
      else setSaveStatus('loading-docx');

      // 1. Force a save before exporting to ensure backend has the latest generated pages
      const currentNumPages = Math.max(1, ...elements.map(e => e.page || 1));
      await apiClient(`/rapports/${rapportId}/autosave`, {
        data: { visualLayout: elements, numPages: currentNumPages },
        method: 'PATCH'
      });

      // 2. Begin Download
      const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${url}/export/${rapportId}/${type}`, {
        method: 'GET',
        headers: { 'Accept': type === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
        credentials: 'include' // crucial for auth cookies
      });

      if (!response.ok) throw new Error('Export failed');

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

  const selectedElement = useMemo(() =>
    elements.find(el => el.id === selectedId), [elements, selectedId]
  );

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  const ToolButton = ({ icon, label, active, onClick }: any) => (
    <button
      onClick={onClick}
      className={`p-3 rounded-xl transition-all ${active ? 'bg-slate-900 text-white shadow-lg' : 'hover:bg-slate-100 text-slate-500'}`}
      title={label}
    >
      {icon}
    </button>
  );

  return (
    <div className="h-screen flex flex-col bg-[#F3F4F6] text-slate-900 overflow-hidden font-sans">

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
        </div>

        <div className="flex items-center gap-3">
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
              onClick={() => handleExport('docx')}
              disabled={saveStatus === 'loading-docx'}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all font-bold text-sm"
              title="Export as Word Document"
            >
              {saveStatus === 'loading-docx' ? (
                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <LayoutGrid className="w-4 h-4 text-blue-600" />
              )}
              Word
            </button>

            <div className="w-px h-6 bg-slate-200 mx-2" />

            <button
              onClick={fetchData}
              title="Forcer Synchronisation des données"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all group"
            >
              <Zap className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
              <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">Sync</span>
              {elements.some(e => e.type === 'image' && !e.content) && (
                <AlertCircle className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
              )}
            </button>

            <div className="w-px h-6 bg-slate-200 mx-1" />

            {saveStatus === 'success' && <span className="text-[10px] font-bold text-green-500 animate-in fade-in slide-in-from-right-2 hidden lg:block">Saved!</span>}
            {saveStatus === 'error' && <span className="text-[10px] font-bold text-red-500 hidden lg:block">Failed</span>}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`flex items-center gap-2 bg-slate-900 text-white px-5 py-2 rounded-full text-sm font-bold transition-all shadow-md ${isSaving ? 'opacity-70 cursor-wait' : 'hover:bg-slate-800 active:scale-95'}`}
            >
              {isSaving ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              <span className="hidden sm:block">{isSaving ? 'Saving...' : 'Save Design'}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">

        {/* Left Sidebar */}
        <aside className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-6 gap-6 shrink-0 z-40 shadow-sm">
          <ToolButton icon={<Layout className="w-5 h-5" />} label="Layout" active />
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
            label="Text"
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
              label="Image"
            />
          </div>

          <ToolButton
            onClick={() => {
              const newId = `table-${Date.now()}`;
              const initialData = [
                ['Header 1', 'Header 2'],
                ['Data 1', 'Data 2'],
                ['Data 3', 'Data 4']
              ];
              const newElements: EditorElement[] = [...elements, {
                id: newId,
                page: activePage,
                type: 'table',
                content: JSON.stringify(initialData),
                x: 100, y: 100, width: 400, height: 'auto',
                fontSize: 14, color: '#333333',
                fontFamily: 'Inter', fontWeight: 'normal', textAlign: 'left',
                tableSettings: {
                  showHeaderRow: true,
                  showTotalRow: false,
                  stripeRows: true,
                  showFirstColumn: true,
                  showLastColumn: false,
                  stripeColumns: false,
                  themeColor: 'indigo'
                }
              }];
              setElements(newElements);
              saveToHistory(newElements);
              setSelectedId(newId);
            }}
            icon={<TableIcon className="w-5 h-5" />}
            label="Table"
          />
          <div className="mt-auto">
            <ToolButton icon={<Settings2 className="w-5 h-5" />} label="Config" />
          </div>
        </aside>

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
                </div>
              </div>
            ))}

            {/* Global Interaction Layer (Elements) - Overlays all pages */}
            <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none flex flex-col items-center">
              <div className="relative" style={{ width: '794px', height: `${numPages * (PAGE_HEIGHT + PAGE_GAP)}px` }}>
                {elements.map((el) => (
                  <Rnd
                    key={el.id}
                    size={{ width: el.width, height: el.height }}
                    position={{ 
                      x: el.x, 
                      y: getAbsoluteY(el.page, el.y) 
                    }}
                    onDragStop={(e, d) => {
                      const pos = getLocalPos(d.y);
                      const movedElements = elements.map(item => 
                        item.id === el.id ? { ...item, x: d.x, page: pos.page, y: pos.y } : item
                      );
                      const reflowed = reflowElements(movedElements, el.id, estimateHeight);
                      setElements(reflowed);
                      saveToHistory(reflowed);
                    }}
                    onResizeStop={(e, dir, ref, delta, pos) => {
                      const globalPos = getLocalPos(pos.y);
                      const movedElements = elements.map(item => 
                        item.id === el.id ? { 
                          ...item, 
                          width: ref.style.width, 
                          height: ref.style.height, 
                          page: globalPos.page, 
                          y: globalPos.y 
                        } : item
                      );
                      const reflowed = reflowElements(movedElements, el.id, estimateHeight);
                      setElements(reflowed);
                      saveToHistory(reflowed);
                    }}
                    onDragStart={() => {
                      setSelectedId(el.id);
                      setActivePage(el.page);
                    }}
                    bounds="parent" // Bound to the global doc relative height
                    scale={zoom}
                    className={`flex items-center group pointer-events-auto ${selectedId === el.id ? 'ring-2 ring-primary ring-offset-2 z-50' : 'z-10'}`}
                    enableResizing={selectedId === el.id}
                    disableDragging={selectedId !== el.id}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      setSelectedId(el.id);
                      setActivePage(el.page);
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
                        className={`w-full h-full outline-none p-0 border-2 ${selectedId === el.id ? 'border-primary border-dashed' : 'border-transparent group-hover:border-slate-200'}`}
                        style={{
                          fontSize: `${el.fontSize}px`,
                          color: el.color,
                          fontFamily: el.fontFamily,
                          fontWeight: el.fontWeight,
                          textAlign: el.textAlign,
                          whiteSpace: 'pre-wrap'
                        }}
                        dangerouslySetInnerHTML={{ __html: el.content }}
                      />
                    )}
                    
                    {selectedId === el.id && (
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
            <span className="font-bold text-sm uppercase tracking-widest">Add New Page</span>
          </button>
        </main>

        {/* Right Info Sidebar */}
        <aside className="hidden lg:flex w-[280px] bg-white border-l border-slate-200 flex-col shrink-0 p-6 z-40 overflow-y-auto">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
            <MousePointer2 className="w-4 h-4" /> Selection Info
          </h3>

            {selectedElement ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                   <div className="flex flex-col">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Internal ID</label>
                      <div className="bg-slate-50 px-2 py-1 rounded text-[10px] font-mono whitespace-nowrap overflow-hidden text-ellipsis border border-slate-100">{selectedElement.id}</div>
                   </div>
                   <button 
                     onClick={() => {
                        const newElements = elements.filter(el => el.id !== selectedId);
                        setElements(newElements);
                        saveToHistory(newElements);
                        setSelectedId(null);
                     }}
                     className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors border border-transparent hover:border-red-100"
                     title="Delete"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Position</label>
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                    <div className="bg-slate-50 p-2 rounded border border-slate-100 flex items-center justify-between">
                       <span className="text-slate-400">X</span>
                       <span>{Math.round(selectedElement.x)}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded border border-slate-100 flex items-center justify-between">
                       <span className="text-slate-400">Y</span>
                       <span>{Math.round(selectedElement.y)}</span>
                    </div>
                  </div>
                </div>

                {/* --- SIDEBAR TOOLBAR (Format Toolbox) --- */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Appearance & Typography</label>
                   
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
                           <button onClick={() => updateElement(selectedId!, { fontSize: Math.max(8, (selectedElement.fontSize || 0) - 2) })} className="px-3 py-2 hover:bg-slate-200 text-slate-500 transition-colors">-</button>
                           <input
                             type="number"
                             value={selectedElement.fontSize}
                             onChange={(e) => updateElement(selectedId!, { fontSize: parseInt(e.target.value) || 12 })}
                             className="w-full bg-transparent text-xs font-black text-center outline-none"
                           />
                           <button onClick={() => updateElement(selectedId!, { fontSize: (selectedElement.fontSize || 0) + 2 })} className="px-3 py-2 hover:bg-slate-200 text-slate-500 transition-colors">+</button>
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
                        <Settings2 className="w-3 h-3" /> Options de style
                      </label>
                      <div className="grid grid-cols-2 gap-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        {[
                          { id: 'showHeaderRow', label: "Ligne d'en-tête" },
                          { id: 'showFirstColumn', label: "Première colonne" },
                          { id: 'showTotalRow', label: "Ligne des totaux" },
                          { id: 'showLastColumn', label: "Dernière colonne" },
                          { id: 'stripeRows', label: "Lignes à bandes" },
                          { id: 'stripeColumns', label: "Colonnes à bandes" },
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
                        <Palette className="w-3 h-3" /> Styles de tableau
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
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Structure Controls</label>
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
                        >+ Add Row</button>
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
                        >- Remove Row</button>
                        <button
                          onClick={() => {
                            try {
                              const data = JSON.parse(selectedElement.content);
                              const newData = data.map((row: string[]) => [...row, 'New Col']);
                              updateElement(selectedId!, { content: JSON.stringify(newData) });
                            } catch (e) { }
                          }}
                          className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 p-2 rounded-lg transition-colors border border-slate-200"
                        >+ Add Col</button>
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
                        >- Remove Col</button>
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
                  <div className="space-y-3">
                     <textarea
                       id="sidebar-content-editor"
                       value={selectedElement.content}
                       onChange={(e) => updateElement(selectedId!, { content: e.target.value })}
                       className="w-full h-[400px] bg-white text-sm p-4 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all shadow-inner custom-scrollbar"
                       placeholder="Enter text content..."
                     />
                     <p className="text-[9px] text-slate-400 italic">Double-click any element on the canvas to focus this editor.</p>
                  </div>
                )}
                <button 
                  onClick={() => deleteElement(selectedId!)}
                  className="w-full mt-6 py-2 text-[10px] font-bold text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >Delete Element</button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40 grayscale">
               <MousePointer2 className="w-12 h-12 mb-4 text-slate-300" />
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select an element<br/>to start editing</p>
            </div>
          )}
        </aside>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #E1E4EB; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #C4C9D5; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #B3B7C4; }
      `}</style>
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
