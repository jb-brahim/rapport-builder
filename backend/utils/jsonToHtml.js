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

export const convertJsonToHtml = (content) => {
  if (!content || typeof content !== 'object') {
    return `<h1>Rapport vide ou en cours de génération...</h1>`;
  }

  const pageBreak = '<div style="page-break-after: always;"></div>';
  let html = '';

  // Data collection for Tables
  const figures = [];
  const tables = [];
  const sections = [];

  const scanChapter = (chapter, chapIdx) => {
    sections.push({ level: 1, title: `Chapitre ${chapIdx + 1} : ${chapter.title}`, id: `chap-${chapIdx}` });
    
    if (chapter.images) {
      chapter.images.forEach(img => figures.push({ caption: img.caption, id: `fig-${figures.length + 1}` }));
    }
    if (chapter.tables) {
      chapter.tables.forEach(tbl => tables.push({ caption: tbl.caption, id: `tbl-${tables.length + 1}` }));
    }

    if (chapter.sections) {
      chapter.sections.forEach((s, sIdx) => {
        sections.push({ level: 2, title: `${sIdx + 1}. ${s.title}`, id: `chap-${chapIdx}-sec-${sIdx}` });
        if (s.images) s.images.forEach(img => figures.push({ caption: img.caption, id: `fig-${figures.length + 1}` }));
        if (s.tables) s.tables.forEach(tbl => tables.push({ caption: tbl.caption, id: `tbl-${tables.length + 1}` }));

        if (s.subsections) {
          s.subsections.forEach((ss, ssIdx) => {
            sections.push({ level: 3, title: `${sIdx + 1}.${ssIdx + 1}. ${ss.title}`, id: `chap-${chapIdx}-sec-${sIdx}-ss-${ssIdx}` });
            if (ss.images) ss.images.forEach(img => figures.push({ caption: img.caption, id: `fig-${figures.length + 1}` }));
            if (ss.tables) ss.tables.forEach(tbl => tables.push({ caption: tbl.caption, id: `tbl-${tables.length + 1}` }));
          });
        }
      });
    }
  };

  if (content.chapters) {
    content.chapters.forEach((ch, i) => scanChapter(ch, i));
  }

  // Styles
  html += `
    <style>
      body { font-family: 'Times New Roman', serif; line-height: 1.6; color: #333; }
      h1, h2, h3 { color: #2c3e50; }
      .center { text-align: center; }
      .justify { text-align: justify; }
      .table-full { width: 100%; border-collapse: collapse; margin: 20px 0; }
      .table-full th, .table-full td { border: 1px solid #ddd; padding: 12px; text-align: left; }
      .table-full th { bg-color: #f8f9fa; font-weight: bold; }
      .caption { font-style: italic; font-size: 11pt; margin-top: 5px; margin-bottom: 20px; text-align: center; color: #666; }
      .figure-box { text-align: center; margin: 30px 0; }
      .figure-img { max-width: 80%; max-height: 400px; border: 1px solid #ebebeb; padding: 5px; border-radius: 4px; }
      .toc-item { margin-bottom: 8px; display: flex; justify-content: space-between; border-bottom: 1px dotted #ccc; }
      .toc-title { background: #fff; padding-right: 5px; }
      .toc-page { background: #fff; padding-left: 5px; }
      .roman-page { font-style: italic; color: #666; }
    </style>
  `;

  // 1. Cover Page
  if (content.coverPage) {
    const cp = content.coverPage;
    html += `
      <div class="center">
        <h3 style="margin-bottom: 5px;">${cp.republique || cp.header1 || 'REPUBLIQUE TUNISIENNE'}</h3>
        <h4 style="margin-top: 0;">${cp.ministere || cp.header2 || "MINISTERE DE L'ENSEIGNEMENT SUPERIEUR ET DE LA RECHERCHE SCIENTIFIQUE"}</h4>
        <br/><br/>
        <h2>${cp.university || ''}</h2>
        <h3>${cp.department || ''}</h3>
        <br/><br/>
        <h1 style="text-transform: uppercase; font-size: 28pt; margin: 40px 0;">RAPPORT DE PROJET DE FIN D'ETUDES</h1>
        <h3>Présenté en vue de l'obtention du</h3>
        <h2>${cp.degree || ''}</h2>
        <br/>
        <div style="border: 2px solid #2c3e50; padding: 30px; margin: 30px 0;">
          <h2 style="margin: 0;">Sujet : ${content.projectConfig?.title || 'Titre du projet non défini'}</h2>
        </div>
        <br/>
        <table style="width: 100%; text-align: left; font-size: 14pt; margin: 40px 0;">
          <tr>
            <td style="width: 50%;"><strong>Réalisé par :</strong><br/>${cp.studentName || ''}</td>
            <td style="width: 50%;"><strong>Organisme d'accueil :</strong><br/>${cp.company || ''}</td>
          </tr>
        </table>
        <p style="text-align: left; font-size: 14pt;"><strong>Encadré par :</strong> ${cp.supervisor || ''}</p>
        <br/><br/>
        <p style="font-size: 14pt; margin-top: 50px;"><strong>Année Universitaire ${cp.academicYear || '2023-2024'}</strong></p>
      </div>
      ${pageBreak}
    `;
  }

  // Front Matter Start (Roman Numerals)
  let romanPageCounter = 1;

  // 2. Dédicace
  if (content.dedicace || content.dedicace1) {
    html += `<h1 class="center">Dédicace</h1><br/>`;
    if (content.dedicace1) {
        html += `<h3 style="margin-bottom: 10px;">${content.studentName1 || 'Étudiant 1'}</h3>`;
        html += `<p class="justify" style="white-space: pre-wrap; font-size: 12pt; margin-bottom: 40px;">${content.dedicace1}</p>`;
        if (content.dedicace2) {
            html += `<h3 style="margin-bottom: 10px; border-top: 1px solid #eee; pt-20">${content.studentName2 || 'Étudiant 2'}</h3>`;
            html += `<p class="justify" style="white-space: pre-wrap; font-size: 12pt;">${content.dedicace2}</p>`;
        }
    } else {
        html += `<p class="justify" style="white-space: pre-wrap; font-size: 12pt;">${content.dedicace}</p>`;
    }
    html += pageBreak;
    romanPageCounter++;
  }

  // 3. Remerciements
  if (content.remerciements) {
    html += `<h1 class="center">Remerciements</h1><br/><p class="justify" style="white-space: pre-wrap; font-size: 12pt;">${content.remerciements}</p>${pageBreak}`;
    romanPageCounter++;
  }

  // 4. Résumé & Abstract
  if (content.resume) {
    html += `<h1 class="center">Résumé</h1><p class="justify" style="font-size: 12pt;">${content.resume.text || content.resume}</p>`;
    if (content.resume.keywords) {
      html += `<p><strong>Mots-clés :</strong> ${Array.isArray(content.resume.keywords) ? content.resume.keywords.join(', ') : content.resume.keywords}</p>`;
    }
    html += `<br/><br/>`;
  }
  if (content.abstract || content.englishAbstract) {
    const abs = content.abstract || content.englishAbstract;
    html += `<h1 class="center">Abstract</h1><p class="justify" style="font-size: 12pt;">${abs.text || abs}</p>`;
    if (abs.keywords) {
      html += `<p><strong>Keywords :</strong> ${Array.isArray(abs.keywords) ? abs.keywords.join(', ') : abs.keywords}</p>`;
    }
    html += pageBreak;
    romanPageCounter++;
  }

  // 5. Automatic Table of Contents (Sommaire)
  html += `<h1 class="center">Sommaire</h1><br/>`;
  sections.forEach(s => {
    const indent = (s.level - 1) * 30;
    html += `<div class="toc-item" style="margin-left: ${indent}px;">
      <span class="toc-title">${s.title}</span>
      <span class="toc-page">...</span>
    </div>`;
  });
  html += pageBreak;
  romanPageCounter++;

  // 6. Table of Figures
  if (figures.length > 0) {
    html += `<h1 class="center">Table des figures</h1><br/>`;
    figures.forEach((fig, i) => {
      html += `<div class="toc-item">
        <span class="toc-title">Figure ${i + 1} : ${fig.caption}</span>
        <span class="toc-page">...</span>
      </div>`;
    });
    html += pageBreak;
    romanPageCounter++;
  }

  // 7. Table of Tables
  if (tables.length > 0) {
    html += `<h1 class="center">Table des tableaux</h1><br/>`;
    tables.forEach((tbl, i) => {
      html += `<div class="toc-item">
        <span class="toc-title">Tableau ${i + 1} : ${tbl.caption}</span>
        <span class="toc-page">...</span>
      </div>`;
    });
    html += pageBreak;
    romanPageCounter++;
  }

  // 8. Abbreviations (Optional, usually after tables)
  if (content.abbreviations && content.abbreviations.length > 0) {
    html += `<h1 class="center">Liste des Abréviations</h1><br/>
    <table class="table-full">
      <thead><tr><th>Abréviation</th><th>Signification</th></tr></thead>
      <tbody>`;
    content.abbreviations.forEach(abbr => {
      html += `<tr><td><strong>${abbr.short || abbr.abbr}</strong></td><td>${abbr.long || abbr.definition}</td></tr>`;
    });
    html += `</tbody></table>${pageBreak}`;
    romanPageCounter++;
  }

  // Body Start (Arabic Numerals Reset)
  
  // 9. Introduction Générale
  if (content.introduction) {
    html += `<h1 class="center" id="introduction">Introduction Générale</h1><br/><p class="justify" style="white-space: pre-wrap; font-size: 12pt;">${content.introduction}</p>${pageBreak}`;
  }

  // 10. Chapters
  if (content.chapters && content.chapters.length > 0) {
    let figCounter = 0;
    let tblCounter = 0;

    content.chapters.forEach((chapter, chapIdx) => {
      html += `<h1 id="chap-${chapIdx}">Chapitre ${chapIdx + 1} : ${chapter.title}</h1>`;
      if (chapter.introduction) {
        html += `<p class="justify" style="white-space: pre-wrap; font-size: 12pt;">${chapter.introduction}</p>`;
      }
      
      const renderTables = (tbls) => {
        if (!tbls) return '';
        let tHtml = '';
        tbls.forEach(tbl => {
          tblCounter++;
          tHtml += `<div class="figure-box" id="tbl-${tblCounter}">
            <table class="table-full">
              <thead><tr>${tbl.headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
              <tbody>${tbl.rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
            </table>
            <div class="caption">Tableau ${tblCounter} : ${tbl.caption}</div>
          </div>`;
        });
        return tHtml;
      };

      const renderImages = (imgs) => {
        if (!imgs) return '';
        let iHtml = '';
        imgs.forEach(img => {
          figCounter++;
          iHtml += `<div class="figure-box" id="fig-${figCounter}">
            <img src="${img.src}" class="figure-img" />
            <div class="caption">Figure ${figCounter} : ${img.caption}</div>
          </div>`;
        });
        return iHtml;
      };

      html += renderImages(chapter.images);
      html += renderTables(chapter.tables);

      if (chapter.sections) {
        chapter.sections.forEach((section, sIdx) => {
          html += `<h2 id="chap-${chapIdx}-sec-${sIdx}">${chapIdx + 1}.${sIdx + 1}. ${section.title}</h2>`;
          if (section.content) {
            html += `<p class="justify" style="white-space: pre-wrap; font-size: 12pt;">${section.content}</p>`;
          }
          html += renderImages(section.images);
          html += renderTables(section.tables);

          if (section.subsections) {
            section.subsections.forEach((sub, ssIdx) => {
              html += `<h3 id="chap-${chapIdx}-sec-${sIdx}-ss-${ssIdx}">${chapIdx + 1}.${sIdx + 1}.${ssIdx + 1}. ${sub.title}</h3>`;
              if (sub.content) {
                html += `<p class="justify" style="white-space: pre-wrap; font-size: 12pt;">${sub.content}</p>`;
              }
              html += renderImages(sub.images);
              html += renderTables(sub.tables);
            });
          }
        });
      }
      if (chapter.conclusion) {
        html += `<h4 style="color: #666; margin-top: 30px;">Conclusion du chapitre</h4><p class="justify" style="white-space: pre-wrap; font-size: 12pt;">${chapter.conclusion}</p>`;
      }
      html += pageBreak;
    });
  }

  // 11. Conclusion Générale
  if (content.conclusion) {
    html += `<h1 class="center">Conclusion Générale</h1><br/><p class="justify" style="white-space: pre-wrap; font-size: 12pt;">${content.conclusion}</p>${pageBreak}`;
  }

  // 12. Bibliographie
  if (content.bibliographie && content.bibliographie.length > 0) {
    html += `<h1 class="center">Bibliographie</h1><br/><ul style="font-size: 12pt;">`;
    content.bibliographie.forEach(ref => {
      html += `<li style="margin-bottom: 12px;">${ref}</li>`;
    });
    html += `</ul>`;
  }

  return html;
};
