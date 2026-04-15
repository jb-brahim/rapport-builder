import puppeteer from 'puppeteer';
import HTMLToDOCX from 'html-to-docx';
import Rapport from '../models/Rapport.js';

// Helper for Roman numerals
const toRoman = (num) => {
  if (num <= 0) return '';
  const roman = [
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

// Helper to generate automated tables (TOC, TOF, TOT)
const generateAutoTables = (elements, introStartPage) => {
  const toc = [];
  const tof = [];
  const tot = [];

  // Sort elements by page and Y position
  const sorted = [...elements].sort((a, b) => (a.page - b.page) || (a.y - b.y));

  for (const el of sorted) {
    const pageStr = el.page < introStartPage ? toRoman(el.page - 1).toLowerCase() : (el.page - introStartPage + 1);

    // CRITICAL: Ignore everything on Page 1 (Cover Page)
    if (el.page === 1) continue;

    // TOC Identification
    const isHeading = el.type === 'heading' || el.id?.includes('-label') || el.id?.includes('-l');
    if (isHeading) {
      // Skip the TOC/TOF/TOT labels themselves and things like Cover/Title
      const skipList = [
        'toc-l', 'tof-l', 'tot-l', 'ministry', 'univ-header', 'pfe-label', 
        'main-title', 'academic-year', 'presented-by-label', 'supervised-by-label',
        'team-names', 'supervisor-name', 'project-label'
      ];
      if (!skipList.includes(el.id)) {
        let title = (el.content || '').replace(/<[^>]*>/g, '').trim();
        // Handle specific labels that might have weird formatting
        if (el.id?.startsWith('chap-') && el.id?.endsWith('-label')) {
          // It's a chapter or section label
        }
        
        toc.push({ title, page: pageStr, id: el.id });
      }
    }

    // TOF/TOT Identification
    if (el.caption) {
      if (el.type === 'image' || el.caption.toLowerCase().includes('figure')) {
        tof.push({ title: el.caption, page: pageStr });
      } else if (el.type === 'table' || el.caption.toLowerCase().includes('tableau')) {
        tot.push({ title: el.caption, page: pageStr });
      }
    }
  }

  const formatList = (items) => {
    if (items.length === 0) return `<div style="color: #94a3b8; font-style: italic; font-size: 12px; margin-top: 20px;">Aucune entrée trouvée.</div>`;
    
    return `<table style="width: 100%; border-collapse: collapse; margin-top: 10px;">` + 
      items.map(item => `
        <tr style="line-height: 1.1;">
          <td style="padding: 4px 0; font-size: 11pt; color: #334155; font-family: 'Latin Modern Roman', serif; font-weight: ${item.id?.includes('chap-') && !item.id?.includes('-s-') ? '900' : '500'}; white-space: nowrap;">${item.title}</td>
          <td style="width: 100%; padding: 0 8px; border-bottom: 1.5px dotted #cbd5e1; position: relative; top: -6px;"></td>
          <td style="padding: 4px 0; text-align: right; font-family: monospace; font-size: 10pt; color: #64748B; font-weight: bold; white-space: nowrap;">${item.page}</td>
        </tr>
      `).join('') + 
    `</table>`;
  };

  return {
    tocHtml: formatList(toc),
    tofHtml: formatList(tof),
    totHtml: formatList(tot)
  };
};

// Generate exact replica HTML for Puppeteer
const createPdfHtml = (elements, numPages, introStartPage) => {
  const { tocHtml, tofHtml, totHtml } = generateAutoTables(elements, introStartPage);

  let html = `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Montserrat:wght@400;700;900&family=Outfit:wght@400;700;900&display=swap');
          /* Latin Modern Roman (Computer Modern Equivalent) */
          @import url('https://fonts.cdnfonts.com/css/latin-modern-roman');

          body { 
            margin: 0; 
            padding: 0; 
            background: #ffffff; 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact;
          }
          .page {
            width: 794px;
            height: 1123px;
            position: relative;
            page-break-after: always;
            background: #ffffff;
            overflow: hidden;
            box-sizing: border-box;
          }
          /* Apply the default serif fallback */
          div {
            font-family: inherit;
          }
        </style>
      </head>
      <body>
  `;

  for (let p = 1; p <= numPages; p++) {
    html += `<div class="page">\n`;
    
    const pageElements = elements.filter(e => e.page === p);
    for (const el of pageElements) {
      let contentHtml = el.content;
      
      // Inject Automated Tables
      if (el.id === 'toc-l') contentHtml += tocHtml;
      if (el.id === 'tof-l') contentHtml += tofHtml;
      if (el.id === 'tot-l') contentHtml += totHtml;
      
      const elWidth = el.width === 'auto' ? '640px' : (typeof el.width === 'number' ? el.width + 'px' : el.width);
      let elHeight = el.height === 'auto' ? 'auto' : (typeof el.height === 'number' ? el.height + 'px' : el.height);

      if (el.type === 'image') {
        const imgSrc = el.content || '';
        contentHtml = `<img src="${imgSrc}" style="width: 100%; height: 100%; object-fit: contain;" />`;
        if (el.caption) {
           contentHtml += `<div style="margin-top: 8px; font-size: 10px; font-weight: bold; color: #64748B; font-style: italic; text-align: center;">${el.caption}</div>`;
        }
      } else if (el.type === 'table') {
        try {
          const data = JSON.parse(el.content);
          const settings = el.tableSettings || { themeColor: 'indigo' };
          const themes = {
            slate: { header: '#0f172a', stripe: '#f1f5f9' },
            blue: { header: '#1d4ed8', stripe: '#eff6ff' },
            indigo: { header: '#250136', stripe: '#eef2ff' },
            emerald: { header: '#047857', stripe: '#ecfdf5' },
            amber: { header: '#ea580c', stripe: '#fff7ed' },
            rose: { header: '#be123c', stripe: '#fff1f2' }
          };
          const theme = themes[settings.themeColor] || themes.slate;

          const fontFamily = (el.fontFamily || "'Times New Roman', serif").replace(/"/g, "'");
          const fontSize = el.fontSize || 12;
          const textAlign = el.textAlign || 'left';

          let tblHtml = `<table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; font-family: ${fontFamily}; font-size: ${fontSize}px;"><tbody>`;
          
          data.forEach((row, ridx) => {
            const bg = ridx === 0 ? theme.header : '#ffffff';
            const fg = ridx === 0 ? '#ffffff' : '#000000';
            tblHtml += `<tr style="background-color: ${bg}; border-bottom: 2px solid #e2e8f0;">`;
            row.forEach((cell) => {
              tblHtml += `<td style="padding: 20px; color: ${fg}; border-right: 2px solid #e2e8f0; text-align: ${ridx === 0 ? 'center' : textAlign}; ${ridx === 0 ? 'font-weight: 900; text-transform: uppercase;' : ''}">${cell}</td>`;
            });
            tblHtml += `</tr>`;
          });
          tblHtml += `</tbody></table>`;
          if (el.caption) {
            tblHtml = `<div style="margin-bottom: 8px; font-size: 10px; font-weight: bold; color: #64748B; font-style: italic; text-align: center;">${el.caption}</div>` + tblHtml;
          }
          contentHtml = tblHtml;
        } catch (e) {
          contentHtml = `<div style="color: red;">Invalid Table Error</div>`;
        }
      }

      // Safe styling fallbacks
      const elFontSize = el.fontSize || 16;
      const elColor = el.color || '#000000';
      const elFontWeight = el.fontWeight || 'normal';
      const elTextAlign = el.textAlign || 'left';
      const rawFamily = el.fontFamily || "'Times New Roman', serif";
      let family = rawFamily.replace(/"/g, "'");
      if (family.includes('Computer Modern')) {
        family = "'Latin Modern Roman', serif";
      }

      html += `
        <div style="position: absolute; left: ${el.x || 0}px; top: ${el.y || 0}px; width: ${elWidth}; height: ${elHeight}; font-size: ${elFontSize}px; color: ${elColor}; font-family: ${family}; font-weight: ${elFontWeight}; text-align: ${elTextAlign}; white-space: pre-wrap; line-height: 1.5;">
          ${contentHtml}
        </div>
      `;
    }

    if (p > 1) {
       // Estimate intro start page. Since it's dynamic, default back to roughly 3 if not provided efficiently.
       const introPage = introStartPage || 4; // Typical: Title, Dedication, Remerciement
       const pageStr = p < introPage ? toRoman(p - 1).toLowerCase() : (p - introPage + 1);
       html += `
        <div style="position: absolute; bottom: 40px; left: 0; right: 0; text-align: center; font-family: 'Latin Modern Roman', serif; font-size: 10pt; color: #64748B; font-weight: bold;">
           <span style="padding: 4px 16px; border-top: 1px solid #e2e8f0;">${pageStr}</span>
        </div>
       `;
    }

    html += `</div>\n`;
  }

  html += `</body></html>`;
  return html;
};

// Generate semantic, flowing HTML for DOCX
const createDocxHtml = (elements) => {
  const sorted = [...elements].sort((a,b) => (a.page - b.page) || (a.y - b.y));
  let html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><style>body { font-family: 'Times New Roman', serif; line-height: 1.5; color: #000; }</style></head><body>`;
  
  let currentTitle = '';
  
  for(const el of sorted) {
    const elFontSize = el.fontSize || 16;
    const elColor = el.color || '#000';
    const elTextAlign = el.textAlign || 'left';

    if (el.type === 'heading') {
      const fontSize = Math.min(24, Math.max(14, elFontSize));
      html += `<h2 style="color: ${elColor}; text-align: ${elTextAlign}; font-size: ${fontSize}pt; font-weight: bold; margin-top: 24px; margin-bottom: 12px;">${(el.content || '').replace(/<[^>]*>?/gm, '')}</h2>`;
    } else if (el.type === 'text') {
      // Clean arbitrary absolutly div positioning
      const cleanContent = (el.content || '').replace(/font-size:\s*\d+pt;/g, `font-size: ${elFontSize}pt;`)
                                     .replace(/color:\s*#[a-zA-Z0-9]+;/g, `color: ${elColor};`);
      html += `<div style="text-align: ${elTextAlign}; margin-bottom: 12px;">${cleanContent}</div>`;
    } else if (el.type === 'image') {
       if (el.content) {
         html += `<div style="text-align: center; margin: 20px 0;">`;
         html += `<img src="${el.content}" style="width: 500px; max-width: 100%; height: auto;" />`;
         if (el.caption) html += `<p style="text-align: center; font-style: italic; color: #555; margin-top: 8px;">${el.caption}</p>`;
         html += `</div>`;
       }
    } else if (el.type === 'table') {
      try {
        const data = JSON.parse(el.content || '[]');
        let tblHtml = `<table style="width: 100%; border-collapse: collapse; margin: 20px 0; border: 1px solid #000;"><tbody>`;
        data.forEach((row, ridx) => {
          tblHtml += `<tr>`;
          row.forEach((cell) => {
            if (ridx === 0) {
              tblHtml += `<th style="border: 1px solid #000; padding: 8px; text-align: center; background-color: #f1f5f9;">${cell}</th>`;
            } else {
              tblHtml += `<td style="border: 1px solid #000; padding: 8px; text-align: ${elTextAlign};">${cell}</td>`;
            }
          });
          tblHtml += `</tr>`;
        });
        tblHtml += `</tbody></table>`;
        if (el.caption) {
          tblHtml = `<p style="text-align: center; font-style: italic; font-weight: bold; margin-bottom: 4px;">${el.caption}</p>` + tblHtml;
        }
        html += tblHtml;
      } catch(e) {}
    }
  }
  html += `</body></html>`;
  return html;
};

// @desc    Export a rapport to PDF
// @access  Private
const exportToPdf = async (req, res) => {
  let browser;
  try {
    console.log(`[Export] Starting PDF export for rapport: ${req.params.id}`);
    
    const rapportDoc = await Rapport.findById(req.params.id);
    if (!rapportDoc) return res.status(404).json({ message: 'Rapport not found' });
    
    // Lean data conversion
    const rapport = rapportDoc.toObject();
    const layout = rapport.visualLayout || [];
    console.log(`[Export] Data fetched. Elements: ${layout.length}`);
    
    // Safe page calculation to prevent stack errors on large reports
    const numPages = layout.length > 0 ? layout.reduce((max, e) => Math.max(max, e.page || 1), 1) : 1;

    // Estimate introStartPage based on visualLayout
    const introEl = layout.find(e => e.id === 'intro-l');
    const introStartPage = introEl ? introEl.page : 4;

    const htmlContent = createPdfHtml(layout, numPages, introStartPage);
    console.log(`[Export] HTML Template generated. Length: ${htmlContent.length}`);

    console.log(`[Export] Launching Puppeteer...`);
    browser = await puppeteer.launch({ 
      headless: 'shell', // Use the modern but lightweight engine
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox', 
        '--disable-dev-shm-usage', 
        '--font-render-hinting=none',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--single-process',
        '--no-zygote'
      ]
    });
    
    const page = await browser.newPage();
    console.log(`[Export] Page opened.`);

    // Setting viewport exactly matching our 794x1123 canvas
    await page.setViewport({ width: 794, height: 1123 });
    
    // Use 'load' + manual delay for better stability than 'networkidle0'
    console.log(`[Export] Setting content (60s timeout)...`);
    await page.setContent(htmlContent, { waitUntil: 'load', timeout: 60000 });
    
    // Manual wait to ensure web fonts and images settle
    await new Promise(r => setTimeout(r, 2000));
    console.log(`[Export] Page content loaded.`);

    // Print to PDF exactly the size of A4 without puppeteer margins
    console.log(`[Export] Generating PDF buffer...`);
    const pdfBuffer = await page.pdf({
      width: '794px',
      height: '1123px',
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
      pageRanges: '' 
    });

    console.log(`[Export] PDF generated successfully. Size: ${pdfBuffer.length} bytes`);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length,
      'Content-Disposition': `attachment; filename="rapport_${rapport._id}.pdf"`
    });

    res.send(pdfBuffer);
  } catch (error) {
    console.error('[Export] FAILED:', error);
    res.status(500).json({ message: `Export failed: ${error.message}` });
  } finally {
    if (browser) {
      await browser.close();
      console.log(`[Export] Browser closed.`);
    }
  }
};
;

// @desc    Export a rapport to DOCX
// @route   GET /api/export/:id/docx
// @access  Private
const exportToDocx = async (req, res) => {
  try {
    const rapport = await Rapport.findById(req.params.id);
    if (!rapport) return res.status(404).json({ message: 'Rapport not found' });

    const layout = rapport.visualLayout || [];
    const htmlContent = createDocxHtml(layout);

    const docxBuffer = await HTMLToDOCX(htmlContent, null, {
      table: { row: { cantSplit: true } },
      footer: true,
      pageNumber: true,
      orientation: 'portrait',
      margins: { top: 1440, right: 1440, bottom: 1440, left: 1440 } // 1 inch margins (1440 twips)
    });

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="rapport_${rapport._id}.docx"`
    });

    res.send(docxBuffer);
  } catch (error) {
    console.error('DOCX Export Error:', error);
    res.status(500).json({ message: error.message });
  }
};

export { exportToPdf, exportToDocx };

