import React, { useRef, useState } from 'react';
import { SituacioAprenentatge } from '../types';
import { 
  Document, 
  Packer, 
  Paragraph, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  TextRun, 
  AlignmentType,
  PageOrientation,
  HeadingLevel,
  VerticalAlign,
  PageBreak,
  ShadingType,
  BorderStyle
} from 'docx';
import saveAs from 'file-saver';

interface TableDisplayProps {
  data: SituacioAprenentatge;
  onEdit: (data: SituacioAprenentatge) => void;
}

// Logo oficial de la Generalitat de Catalunya - Departament d'Educació (Base64 SVG)
const LOGO_GEN_BASE64 = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDQwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGcgdHJhbnNmb3JtPSJzY2FsZSgwLjkpIj4KICAgIDxyZWN0IHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgZmlsbD0iI0UzMDYxMyIvPgogICAgPHJlY3QgeD0iNCIgeT0iNCIgd2lkdG09IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRkZGRkZGIi8+CiAgICA8cmVjdCB4PSI4IiB5PSI4IiB3aWR0aD0iNSIgaGVpZ2h0PSIzMiIgZmlsbD0iI0UzMDYxMyIvPgogICAgPHJlY3QgeD0iMTgiIHk9IjgiIHdpZHRoPSI1IiBoZWlnaHQ9IjMyIiBmaWxsPSIjRTMwNjEzIi8+CiAgICA8cmVjdCB4PSIyOCIgeT0iOCIgd2lkdG09IjUiIGhlaWdodD0iMzIiIGZpbGw9IiNFMzA2MTMiLz4KICAgIDxyZWN0IHg9IjM4IiB5PSI4IiB3aWR0aD0iMiIgaGVpZ2h0PSIzMiIgZmlsbD0iI0UzMDYxMyIvPgogIDwvZz4KICA8dGV4dCB4PSI1NSIgeT0iMzAiIGZpbGw9IiMzMzMiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyMiI+R2VuZXJhbGl0YXQgZGUgQ2F0YWx1bnlhPC90ZXh0PgogIDx0ZXh0IHg9IjU1IiB5PSI2NSIgZmlsbD0iIzAwMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI4IiBmb250LXdlaWdodD0iYm9sZCI+RGVwYXJ0YW1lbnQgZCdFZHVjYWNpw7M8L3RleHQ+Cjwvc3ZnPg==";

export const TableDisplay: React.FC<TableDisplayProps> = ({ data, onEdit }) => {
  const pdfRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);

  const formatCE = (text: string, index: number) => {
    const cleanText = text.replace(/^CE\.\d+\.\s*/i, '').trim();
    return `CE.${index + 1}. ${cleanText}`;
  };

  const handleDownloadPDF = async () => {
    if (!pdfRef.current) return;
    setIsExporting(true);
    const element = pdfRef.current;
    const titolNet = data.identificacio.titol.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    element.classList.add('is-exporting-pdf');

    const opt = {
      margin: 0,
      filename: `Situacio_Aprenentatge_${titolNet}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, windowWidth: 1122, scrollY: 0 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape', compress: true },
      pagebreak: { mode: 'css' }
    };

    try {
      // @ts-ignore
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("Error PDF:", error);
    } finally {
      element.classList.remove('is-exporting-pdf');
      setIsExporting(false);
    }
  };

  const handleDownloadDOCX = async () => {
    setIsExportingWord(true);
    const titolNet = data.identificacio.titol.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    // Fix: 'AlignmentType' refers to a value, but is being used as a type here. Using 'any' for simplicity with library type versions.
    const createCell = (text: string, options: { bold?: boolean, width?: number, isHeader?: boolean, align?: any } = {}) => {
      const { bold = false, width = 100, isHeader = false, align = AlignmentType.LEFT } = options;
      return new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: text || "", bold, size: 20, font: "Arial" })],
          spacing: { before: 120, after: 120 },
          alignment: align
        })],
        width: { size: width, type: WidthType.PERCENTAGE },
        verticalAlign: VerticalAlign.CENTER,
        shading: isHeader ? { fill: "F8FAFC" } : undefined,
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1 },
          bottom: { style: BorderStyle.SINGLE, size: 1 },
          left: { style: BorderStyle.SINGLE, size: 1 },
          right: { style: BorderStyle.SINGLE, size: 1 },
        }
      });
    };

    const doc = new Document({
      sections: [{
        properties: { page: { size: { orientation: PageOrientation.LANDSCAPE } } },
        children: [
          // Fix: 'bold', 'text', 'size', 'font' do not exist in type 'IParagraphOptions'. Use children with TextRun for proper styling.
          new Paragraph({ children: [new TextRun({ text: "Generalitat de Catalunya", bold: true, size: 28, font: "Arial" })] }),
          new Paragraph({ children: [new TextRun({ text: "Departament d’Educació", bold: true, size: 32, font: "Arial" })], spacing: { after: 600 } }),
          new Paragraph({ children: [new TextRun({ text: "SITUACIÓ D'APRENENTATGE", bold: true, size: 24, font: "Arial" })], heading: HeadingLevel.HEADING_1, alignment: AlignmentType.RIGHT, spacing: { after: 800 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [createCell("Títol", { bold: true, width: 25, isHeader: true }), createCell(data.identificacio.titol, { width: 75 })] }),
              new TableRow({ children: [createCell("Curs", { bold: true, width: 25, isHeader: true }), createCell(data.identificacio.curs, { width: 75 })] }),
              new TableRow({ children: [createCell("Àrea / Matèria", { bold: true, width: 25, isHeader: true }), createCell(data.identificacio.area_materia_ambit, { width: 75 })] }),
            ]
          }),
        ]
      }]
    });

    try {
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `SA_${titolNet}.docx`);
    } catch (err) { console.error(err); } finally { setIsExportingWord(false); }
  };

  return (
    <div className="bg-slate-200 p-0 md:p-8 print:p-0 min-h-screen">
      <style>{`
        .official-container { width: 297mm; margin: 0 auto; display: flex; flex-direction: column; align-items: center; }
        .official-page { 
          background: white; width: 297mm; height: 209.5mm; padding: 15mm; margin: 0;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1); position: relative; color: black; font-family: Arial, sans-serif;
          box-sizing: border-box; overflow: hidden; display: flex; flex-direction: column;
        }
        .official-page:not(:last-child) { page-break-after: always; }
        @media screen {
           .official-page { margin-bottom: 40px; }
           .is-exporting-pdf .official-page { margin-bottom: 0 !important; box-shadow: none; }
        }
        .official-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; table-layout: fixed; border: 1.5px solid black; }
        .official-table td { border: 1px solid black; padding: 12px 16px; vertical-align: middle; font-size: 13px; line-height: 1.5; word-wrap: break-word; }
        .label-cell { width: 25%; font-weight: bold; background: #f8fafc; color: #1e293b; }
        .official-logo { height: 60px; margin-bottom: 10px; }
        .official-title-big { font-size: 58px; font-weight: 900; text-align: right; margin-top: 20px; line-height: 1; letter-spacing: -3px; color: #000; }
        .section-header { font-weight: bold; font-size: 13px; margin-bottom: 8px; text-transform: uppercase; margin-top: 15px; border-bottom: 2px solid #000; padding-bottom: 4px; display: inline-block; }
        .box-content { border: 1.5px solid black; padding: 14px; min-height: 90px; font-size: 13px; margin-bottom: 15px; line-height: 1.6; }
        .page-num { position: absolute; bottom: 10mm; right: 15mm; font-size: 10px; font-weight: 800; color: #94a3b8; }
        .footnote-area { position: absolute; bottom: 15mm; left: 15mm; right: 15mm; font-size: 9px; line-height: 1.4; border-top: 1px solid #e2e8f0; padding-top: 10px; color: #64748b; }
      `}</style>
      
      <div ref={pdfRef} className="official-container">
        {/* PÀGINA 1: PORTADA AMB LOGO */}
        <div className="official-page">
          <div className="flex justify-between items-start">
             <img src={LOGO_GEN_BASE64} alt="Generalitat de Catalunya" className="official-logo" />
             <div className="text-right">
                <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Model Oficial</div>
                <div className="text-xs font-bold text-slate-400">Departament d'Educació</div>
             </div>
          </div>
          <div className="official-title-big">Situació d’aprenentatge<sup className="text-xl font-normal opacity-40">1</sup></div>
          <div className="mt-24">
            <table className="official-table">
              <tbody>
                <tr style={{ height: '65px' }}>
                  <td className="label-cell">Títol de la situació</td>
                  <td className="font-bold text-lg">{data.identificacio.titol}</td>
                </tr>
                <tr style={{ height: '65px' }}>
                  <td className="label-cell">Curs i nivell educatiu</td>
                  <td>{data.identificacio.curs}</td>
                </tr>
                <tr style={{ height: '65px' }}>
                  <td className="label-cell">Àrea, matèria o àmbit</td>
                  <td>{data.identificacio.area_materia_ambit}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="footnote-area italic">
            <p><sup>1</sup> Segons el Decret 175/2022 i el Decret 171/2022 d'ordenació dels ensenyaments de l'educació bàsica a Catalunya.</p>
          </div>
          <div className="page-num uppercase tracking-widest">Pàgina 1 / 5</div>
        </div>

        {/* PÀGINA 2: DESCRIPCIÓ */}
        <div className="official-page">
          <img src={LOGO_GEN_BASE64} alt="Gencat" className="h-10 opacity-30 absolute top-10 right-10" />
          <div className="section-header">1. Descripció de la Situació d'Aprenentatge</div>
          <div className="box-content h-40 overflow-hidden text-justify">{data.descripcio.context_repte}</div>
          <div className="section-header">2. Competències Específiques i Criteris d'Avaluació</div>
          <table className="official-table">
            <thead>
              <tr className="bg-slate-50 font-bold text-center text-[10px]">
                <td className="w-[70%] uppercase">COMPETÈNCIES ESPECÍFIQUES (LOMLOE CATALUNYA)</td>
                <td className="w-[30%] uppercase">ÀREA O MATÈRIA</td>
              </tr>
            </thead>
            <tbody>
              {data.concrecio_curricular.competencies_especifiques.map((c, i) => (
                <tr key={i}>
                  <td className="text-sm"><b>{formatCE(c.descripcio, i).split('.')[0]}.</b> {formatCE(c.descripcio, i).split('.').slice(1).join('.').trim()}</td>
                  <td className="text-center font-medium text-slate-500">{c.area_materia}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="page-num uppercase tracking-widest">Pàgina 2 / 5</div>
        </div>

        {/* PÀGINA 3: CONCRECIÓ */}
        <div className="official-page">
          <img src={LOGO_GEN_BASE64} alt="Gencat" className="h-10 opacity-30 absolute top-10 right-10" />
          <div className="flex border-2 border-black bg-slate-50 font-black text-[10px] uppercase text-center">
             <div className="flex-1 p-3 border-r-2 border-black">Objectius d'Aprenentatge</div>
             <div className="flex-1 p-3">Criteris d'Avaluació associats</div>
          </div>
          <div className="flex border-l-2 border-r-2 border-b-2 border-black flex-grow overflow-hidden">
             <div className="flex-1 p-5 border-r-2 border-black text-xs space-y-4 text-justify">
                {data.concrecio_curricular.objectius.map((o, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="w-5 h-5 bg-slate-900 text-white rounded flex items-center justify-center flex-shrink-0 font-bold text-[10px]">{i+1}</span>
                    <p>{o}</p>
                  </div>
                ))}
             </div>
             <div className="flex-1 p-5 text-xs space-y-4">
                {data.concrecio_curricular.criteris_avaluacio.map((cr, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 bg-red-600 rounded-full mt-1.5 flex-shrink-0"></div>
                    <p className="font-medium text-slate-700">{cr}</p>
                  </div>
                ))}
             </div>
          </div>
          <div className="section-header mt-6">3. Sabers (Continguts)</div>
          <table className="official-table">
            <tbody>
              {data.concrecio_curricular.sabers.map((s, i) => (
                <tr key={i} style={{ height: '35px' }}>
                  <td className="w-10 text-center font-bold bg-slate-50">{i+1}</td>
                  <td className="text-sm">{s.saber}</td>
                  <td className="w-1/4 text-center text-xs font-bold text-slate-400">{s.area_materia}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="page-num uppercase tracking-widest">Pàgina 3 / 5</div>
        </div>

        {/* PÀGINA 4: ACTIVITATS */}
        <div className="official-page">
          <img src={LOGO_GEN_BASE64} alt="Gencat" className="h-10 opacity-30 absolute top-10 right-10" />
          <div className="section-header">4. Desenvolupament de la Situació</div>
          <div className="box-content mb-6 text-xs italic text-slate-600">{data.desenvolupament.estrategies_metodologiques}</div>
          <div className="section-header">5. Seqüència Didàctica (Fases)</div>
          <table className="official-table">
            <thead>
              <tr className="bg-slate-100 font-black text-[10px] text-center uppercase">
                <td className="w-1/4">Fase de la SA</td>
                <td>Descripció de les activitats i tasques</td>
                <td className="w-24">Temps</td>
              </tr>
            </thead>
            <tbody>
              <tr><td className="font-black text-slate-400 text-xs uppercase">INICIAL</td><td className="text-sm">{data.desenvolupament.activitats.inicials.descripcio}</td><td className="text-center font-bold">{data.desenvolupament.activitats.inicials.temporitzacio}</td></tr>
              <tr><td className="font-black text-slate-400 text-xs uppercase">DESENVOLUPAMENT</td><td className="text-sm">{data.desenvolupament.activitats.desenvolupament.descripcio}</td><td className="text-center font-bold">{data.desenvolupament.activitats.desenvolupament.temporitzacio}</td></tr>
              <tr><td className="font-black text-slate-400 text-xs uppercase">ESTRUCTURACIÓ</td><td className="text-sm">{data.desenvolupament.activitats.estructuracio.descripcio}</td><td className="text-center font-bold">{data.desenvolupament.activitats.estructuracio.temporitzacio}</td></tr>
              <tr><td className="font-black text-slate-400 text-xs uppercase">APLICACIÓ</td><td className="text-sm">{data.desenvolupament.activitats.aplicacio.descripcio}</td><td className="text-center font-bold">{data.desenvolupament.activitats.aplicacio.temporitzacio}</td></tr>
            </tbody>
          </table>
          <div className="page-num uppercase tracking-widest">Pàgina 4 / 5</div>
        </div>

        {/* PÀGINA 5: ATENCIÓ A LA DIVERSITAT */}
        <div className="official-page">
          <img src={LOGO_GEN_BASE64} alt="Gencat" className="h-10 opacity-30 absolute top-10 right-10" />
          <div className="section-header">6. Vectors del Currículum</div>
          <div className="box-content h-24 italic text-sm text-slate-700 bg-red-50/20 border-red-100">{data.vectors_suports.vectors_descripcio}</div>
          <div className="section-header">7. Mesures i Suports Universals (DUA)</div>
          <div className="box-content h-28 text-sm">{data.vectors_suports.suports_universals}</div>
          <div className="section-header">8. Mesures Addicionals o Intensives</div>
          <table className="official-table">
            <thead><tr className="bg-slate-50 font-bold text-[10px] text-center uppercase"><td className="w-1/3">Alumne/a o Grup</td><td>Mesura / Suport específic</td></tr></thead>
            <tbody>
              {data.vectors_suports.suports_addicionals.length > 0 ? 
                data.vectors_suports.suports_addicionals.map((s, i) => (
                  <tr key={i}><td className="font-bold text-center">{s.alumne}</td><td className="text-sm">{s.mesura}</td></tr>
                )) : <tr><td colSpan={2} className="text-center italic text-slate-300 py-8">No s'han definit mesures addicionals.</td></tr>
              }
            </tbody>
          </table>
          <div className="page-num uppercase tracking-widest">Pàgina 5 / 5</div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto mt-12 mb-24 flex flex-wrap justify-center gap-6 no-print px-6">
        <button onClick={handleDownloadPDF} disabled={isExporting} className="group relative flex items-center gap-4 bg-slate-900 text-white px-10 py-5 rounded-2xl font-black shadow-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50">
          {isExporting ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
          {isExporting ? "GENERANT..." : "BAIXAR PDF OFICIAL"}
        </button>
        <button onClick={handleDownloadDOCX} disabled={isExportingWord} className="flex items-center gap-4 bg-white text-slate-900 border-2 border-slate-200 px-10 py-5 rounded-2xl font-black shadow-xl transition-all hover:bg-slate-50 hover:scale-105 active:scale-95 disabled:opacity-50">
           <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/></svg>
           WORD (.DOCX)
        </button>
        <button onClick={() => window.print()} className="bg-slate-100 text-slate-500 px-10 py-5 rounded-2xl font-bold hover:bg-white transition-all border border-slate-200 shadow-sm">IMPRIMIR</button>
        <button onClick={() => onEdit(data)} className="bg-red-50 text-red-600 px-8 py-4 rounded-xl font-black border border-red-100 hover:bg-red-100 transition-all">MODIFICAR DADES</button>
      </div>
    </div>
  );
};