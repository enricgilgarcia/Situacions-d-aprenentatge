
import React, { useRef, useState } from 'react';
import { SituacioAprenentatge, ActivitatDetall } from '../types';
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
  BorderStyle,
  PageBreak
} from 'docx';
import saveAs from 'file-saver';

interface TableDisplayProps {
  data: SituacioAprenentatge;
  onEdit: (data: SituacioAprenentatge) => void;
}

export const TableDisplay: React.FC<TableDisplayProps> = ({ data, onEdit }) => {
  const pdfRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);

  const formatCE = (text: string, index: number) => {
    if (text.startsWith('CE.')) return text;
    return `CE.${index + 1}. ${text}`;
  };

  const handleDownloadPDF = async () => {
    if (!pdfRef.current) return;
    setIsExporting(true);
    const element = pdfRef.current;
    const titolNet = data.identificacio.titol.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    const opt = {
      margin: 0,
      filename: `Situacio_Aprenentatge_${titolNet}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        letterRendering: true,
        windowWidth: 1122 
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
      pagebreak: { mode: 'css', before: '.official-page' }
    };

    try {
      // @ts-ignore
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("Error PDF:", error);
      alert("Error al generar el PDF. Recomanem usar 'Imprimir' i triar 'Guardar com a PDF'.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadDOCX = async () => {
    setIsExportingWord(true);
    
    // Fix: Define titolNet in this scope to resolve 'Cannot find name titolNet'
    const titolNet = data.identificacio.titol.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    const createCell = (text: string, bold = false, width = 100, isHeader = false, italic = false) => new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text: text || "", bold, italic, size: 20, font: "Arial" })],
        spacing: { before: 80, after: 80 },
        alignment: isHeader ? AlignmentType.CENTER : AlignmentType.LEFT
      })],
      width: { size: width, type: WidthType.PERCENTAGE },
      verticalAlign: VerticalAlign.TOP,
      shading: isHeader ? { fill: "F2F2F2" } : undefined,
      margins: { left: 100, right: 100, top: 100, bottom: 100 }
    });

    const createSectionTitle = (text: string) => new Paragraph({
      children: [new TextRun({ text, bold: true, size: 24, font: "Arial" })],
      spacing: { before: 200, after: 100 }
    });

    const doc = new Document({
      sections: [{
        properties: {
          page: { size: { orientation: PageOrientation.LANDSCAPE } },
        },
        children: [
          // PÀGINA 1
          new Paragraph({ text: "Situació d’aprenentatge", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.RIGHT, spacing: { after: 800 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [createCell("Títol", true, 30, true), createCell(data.identificacio.titol)] }),
              new TableRow({ children: [createCell("Curs (Nivell educatiu)", true, 30, true), createCell(data.identificacio.curs)] }),
              new TableRow({ children: [createCell("Àrea / Matèria / Àmbit", true, 30, true), createCell(data.identificacio.area_materia_ambit)] }),
            ]
          }),
          new Paragraph({ text: "\n", children: [new PageBreak()] }),

          // PÀGINA 2
          createSectionTitle("DESCRIPCIÓ (Context + Repte)"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [new TableRow({ children: [createCell(data.descripcio.context_repte)] })]
          }),
          createSectionTitle("COMPETÈNCIES ESPECÍFIQUES"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [createCell("Competències específiques", true, 70, true), createCell("Àrea o matèria", true, 30, true)] }),
              ...data.concrecio_curricular.competencies_especifiques.map((c, i) => 
                new TableRow({ children: [createCell(formatCE(c.descripcio, i)), createCell(c.area_materia)] })
              )
            ]
          }),
          createSectionTitle("TRACTAMENT DE LES COMPETÈNCIES TRANSVERSALS"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [new TableRow({ children: [createCell(data.descripcio.competencies_transversals)] })]
          }),
          new Paragraph({ text: "\n", children: [new PageBreak()] }),

          // PÀGINA 3
          createSectionTitle("OBJECTIUS D'APRENENTATGE I CRITERIS D'AVALUACIÓ"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [createCell("OBJECTIUS D'APRENENTATGE", true, 50, true), createCell("CRITERIS D'AVALUACIÓ", true, 50, true)] }),
              new TableRow({ children: [
                createCell(data.concrecio_curricular.objectius.map((o, i) => `${i+1}. ${o}`).join("\n")),
                createCell(data.concrecio_curricular.criteris_avaluacio.join("\n"))
              ] })
            ]
          }),
          createSectionTitle("SABERS"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [createCell("#", true, 10, true), createCell("Saber", true, 60, true), createCell("Àrea", true, 30, true)] }),
              ...data.concrecio_curricular.sabers.map((s, i) => 
                new TableRow({ children: [createCell((i+1).toString()), createCell(s.saber), createCell(s.area_materia)] })
              )
            ]
          }),
          new Paragraph({ text: "\n", children: [new PageBreak()] }),

          // PÀGINA 4
          createSectionTitle("DESENVOLUPAMENT I ACTIVITATS"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [new TableRow({ children: [createCell(data.desenvolupament.estrategies_metodologiques)] })]
          }),
          createSectionTitle("ACTIVITATS D'APRENENTATGE I D'AVALUACIÓ"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [createCell("Fase", true, 25, true), createCell("Descripció", true, 60, true), createCell("Temps", true, 15, true)] }),
              new TableRow({ children: [createCell("Inicial", true), createCell(data.desenvolupament.activitats.inicials.descripcio), createCell(data.desenvolupament.activitats.inicials.temporitzacio)] }),
              new TableRow({ children: [createCell("Desenvolupament", true), createCell(data.desenvolupament.activitats.desenvolupament.descripcio), createCell(data.desenvolupament.activitats.desenvolupament.temporitzacio)] }),
              new TableRow({ children: [createCell("Estructuració", true), createCell(data.desenvolupament.activitats.estructuracio.descripcio), createCell(data.desenvolupament.activitats.estructuracio.temporitzacio)] }),
              new TableRow({ children: [createCell("Aplicació", true), createCell(data.desenvolupament.activitats.aplicacio.descripcio), createCell(data.desenvolupament.activitats.aplicacio.temporitzacio)] }),
            ]
          }),
          new Paragraph({ text: "\n", children: [new PageBreak()] }),

          // PÀGINA 5
          createSectionTitle("VECTORS I SUPORTS"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [new TableRow({ children: [createCell(data.vectors_suports.vectors_descripcio, false, 100, false, true)] })]
          }),
          createSectionTitle("MESURES I SUPORTS UNIVERSALS"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [new TableRow({ children: [createCell(data.vectors_suports.suports_universals)] })]
          }),
          createSectionTitle("MESURES I SUPORTS ADDICIONALS"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [createCell("Alumne", true, 35, true), createCell("Mesura i suport", true, 65, true)] }),
              ...data.vectors_suports.suports_addicionals.map(s => 
                new TableRow({ children: [createCell(s.alumne), createCell(s.mesura)] })
              )
            ]
          }),
        ]
      }]
    });

    try {
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `Situacio_Aprenentatge_${titolNet}.docx`);
    } catch (err) {
      console.error(err);
      alert("Error generant el document Word.");
    } finally {
      setIsExportingWord(false);
    }
  };

  return (
    <div className="bg-slate-200 p-0 md:p-8 print:p-0 min-h-screen">
      <style>{`
        .official-container {
          width: 297mm;
          margin: 0 auto;
        }
        .official-page { 
          background: white; 
          width: 297mm; 
          height: 210mm; 
          padding: 15mm; 
          margin-bottom: 0;
          box-shadow: 0 4px 30px rgba(0,0,0,0.15); 
          position: relative;
          color: black;
          font-family: 'Arial', sans-serif;
          box-sizing: border-box;
          overflow: hidden;
          page-break-after: always;
        }
        @media screen {
           .official-page { margin-bottom: 25px; }
        }
        .official-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; table-layout: fixed; }
        .official-table td { border: 1.2px solid black; padding: 6px 10px; vertical-align: top; font-size: 13px; word-wrap: break-word; }
        .official-table .label { width: 220px; font-weight: bold; background: #fafafa; }
        .official-header { display: flex; align-items: center; gap: 15px; margin-bottom: 30px; }
        .gov-logo { width: 45px; height: 45px; flex-shrink: 0; }
        .official-title-big { font-size: 64px; font-weight: 900; text-align: right; margin-top: 50px; line-height: 1; letter-spacing: -2px; }
        .section-title { font-weight: bold; font-size: 14px; margin-bottom: 5px; text-transform: uppercase; margin-top: 12px; }
        .box-content { border: 1.2px solid black; padding: 10px; min-height: 80px; font-size: 13px; margin-bottom: 12px; }
        .footnote-area { position: absolute; bottom: 15mm; left: 15mm; right: 15mm; font-size: 9px; line-height: 1.2; border-top: 1px solid #ccc; padding-top: 5px; }
        .page-num { position: absolute; bottom: 10mm; right: 15mm; font-size: 11px; font-weight: bold; }
        
        @media print {
          .official-container { width: 100%; margin: 0; }
          .official-page { box-shadow: none; margin: 0; width: 297mm; height: 210mm; page-break-after: always; }
          .no-print { display: none !important; }
          body { background: white; margin: 0; padding: 0; }
        }
      `}</style>
      
      <div ref={pdfRef} className="official-container">
        {/* PÀGINA 1 */}
        <div className="official-page">
          <div className="official-header">
             <svg className="gov-logo" viewBox="0 0 100 100" fill="none">
                <rect width="100" height="100" fill="#E30613"/>
                <path d="M20 20H80V80H20V20Z" stroke="white" strokeWidth="4"/>
                <path d="M40 20V80M60 20V80" stroke="white" strokeWidth="4"/>
             </svg>
             <div>
               <div className="font-bold text-lg leading-tight">Generalitat de Catalunya</div>
               <div className="font-bold text-lg leading-tight">Departament d’Educació</div>
             </div>
          </div>
          <div className="official-title-big">Situació d’aprenentatge<sup className="text-xl">1</sup></div>
          <div className="mt-20">
            <table className="official-table">
              <tbody>
                <tr style={{ height: '50px' }}>
                  <td className="label">Títol</td>
                  <td>{data.identificacio.titol}</td>
                </tr>
                <tr style={{ height: '50px' }}>
                  <td className="label">Curs (Nivell educatiu)</td>
                  <td>{data.identificacio.curs}</td>
                </tr>
                <tr style={{ height: '50px' }}>
                  <td className="label">Àrea / Matèria / Àmbit</td>
                  <td>{data.identificacio.area_materia_ambit}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="footnote-area">
            <p><sup>1</sup> Són els escenaris que l’alumnat es troba a la vida real i que es poden utilitzar per desenvolupar aprenentatges...</p>
          </div>
          <div className="page-num">Pàgina 1/5</div>
        </div>

        {/* PÀGINA 2 */}
        <div className="official-page">
          <div className="section-title">DESCRIPCIÓ (Context + Repte)</div>
          <div className="box-content h-28 overflow-hidden">{data.descripcio.context_repte}</div>

          <div className="section-title">COMPETÈNCIES ESPECÍFIQUES</div>
          <table className="official-table">
            <thead>
              <tr className="bg-gray-50">
                <td className="font-bold">Competències específiques</td>
                <td className="font-bold w-1/3 text-blue-700">Àrea o matèria</td>
              </tr>
            </thead>
            <tbody>
              {data.concrecio_curricular.competencies_especifiques.map((c, i) => (
                <tr key={i} style={{ height: '35px' }}>
                  <td>{formatCE(c.descripcio, i)}</td>
                  <td>{c.area_materia}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="section-title">TRACTAMENT DE LES COMPETÈNCIES TRANSVERSALS</div>
          <div className="box-content h-20 overflow-hidden">{data.descripcio.competencies_transversals}</div>
          <div className="page-num">Pàgina 2/5</div>
        </div>

        {/* PÀGINA 3 */}
        <div className="official-page">
          <div className="flex border border-black bg-gray-50">
             <div className="flex-1 p-2 border-r border-black text-center font-bold text-xs uppercase">OBJECTIUS D’APRENENTATGE</div>
             <div className="flex-1 p-2 text-center font-bold text-xs uppercase">CRITERIS D’AVALUACIÓ</div>
          </div>
          <div className="flex border-l border-r border-b border-black">
             <div className="flex-1 p-3 border-r border-black min-h-[160px] text-xs space-y-2">
                {data.concrecio_curricular.objectius.map((o, i) => (
                  <div key={i} className="flex gap-2"><b>{i+1}.</b> {o}</div>
                ))}
             </div>
             <div className="flex-1 p-3 min-h-[160px] text-xs space-y-2">
                {data.concrecio_curricular.criteris_avaluacio.map((cr, i) => (
                  <div key={i} className="flex gap-2"><b>{cr.includes('.') ? '' : (i+1)+'.'}</b> {cr}</div>
                ))}
             </div>
          </div>
          <div className="section-title mt-4">SABERS</div>
          <table className="official-table">
            <thead>
              <tr className="bg-gray-50">
                <td className="w-10 text-center font-bold">#</td>
                <td className="font-bold">Saber</td>
                <td className="font-bold w-1/3">Àrea</td>
              </tr>
            </thead>
            <tbody>
              {data.concrecio_curricular.sabers.map((s, i) => (
                <tr key={i}><td className="text-center">{i+1}</td><td>{s.saber}</td><td>{s.area_materia}</td></tr>
              ))}
            </tbody>
          </table>
          <div className="page-num">Pàgina 3/5</div>
        </div>

        {/* PÀGINA 4 */}
        <div className="official-page">
          <div className="section-title">DESENVOLUPAMENT</div>
          <div className="box-content h-20 overflow-hidden">{data.desenvolupament.estrategies_metodologiques}</div>
          <div className="section-title mt-4">ACTIVITATS D’APRENENTATGE I D’AVALUACIÓ</div>
          <table className="official-table">
            <thead>
              <tr className="bg-gray-100 font-bold">
                <td className="w-1/4">Fase</td>
                <td>Descripció</td>
                <td className="w-1/6">Temps</td>
              </tr>
            </thead>
            <tbody>
              {/* Fix: Explicitly cast Object.entries to provide typing and fix 'unknown' property access error */}
              {(Object.entries(data.desenvolupament.activitats) as [string, ActivitatDetall][]).map(([key, act], idx) => (
                <tr key={key} style={{ height: '70px' }}>
                  <td className="font-bold capitalize">{key.replace('_', ' ')}</td>
                  <td>{act.descripcio}</td>
                  <td>{act.temporitzacio}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="page-num">Pàgina 4/5</div>
        </div>

        {/* PÀGINA 5 */}
        <div className="official-page">
          <div className="section-title">VECTORS DEL CURRÍCULUM</div>
          <div className="box-content h-24 italic overflow-hidden">{data.vectors_suports.vectors_descripcio}</div>
          <div className="section-title">MESURES I SUPORTS UNIVERSALS</div>
          <div className="box-content h-24 overflow-hidden">{data.vectors_suports.suports_universals}</div>
          <div className="section-title">MESURES ADDICIONALS</div>
          <table className="official-table">
            <thead><tr className="bg-gray-50 font-bold"><td>Alumne</td><td>Mesura</td></tr></thead>
            <tbody>
              {data.vectors_suports.suports_addicionals.length > 0 ? 
                data.vectors_suports.suports_addicionals.map((s, i) => (
                  <tr key={i}><td>{s.alumne}</td><td>{s.mesura}</td></tr>
                )) : <tr><td colSpan={2} className="h-10 text-slate-300 italic">No s'han definit mesures addicionals</td></tr>
              }
            </tbody>
          </table>
          <div className="page-num">Pàgina 5/5</div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto mt-8 mb-20 flex flex-wrap justify-center gap-4 no-print px-4">
        <button 
          onClick={handleDownloadPDF} 
          disabled={isExporting}
          className={`flex items-center gap-3 bg-red-600 text-white px-8 py-4 rounded-xl font-bold shadow-xl transition-all transform active:scale-95 ${isExporting ? 'opacity-50' : 'hover:bg-red-700 hover:-translate-y-1'}`}
        >
          {isExporting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
          {isExporting ? "GENERANT..." : "BAIXAR PDF"}
        </button>
        
        <button 
          onClick={handleDownloadDOCX} 
          disabled={isExportingWord}
          className={`flex items-center gap-3 bg-blue-700 text-white px-8 py-4 rounded-xl font-bold shadow-xl transition-all transform active:scale-95 ${isExportingWord ? 'opacity-50' : 'hover:bg-blue-800 hover:-translate-y-1'}`}
        >
          {isExportingWord ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/></svg>}
          {isExportingWord ? "GENERANT..." : "BAIXAR WORD"}
        </button>

        <button 
          onClick={() => window.print()} 
          className="flex items-center gap-3 bg-white text-slate-800 border-2 border-slate-300 px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-slate-50 transition-all transform hover:-translate-y-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          IMPRIMIR
        </button>

        <button 
          onClick={() => onEdit(data)} 
          className="flex items-center gap-3 bg-slate-100 text-slate-500 px-8 py-4 rounded-xl font-bold hover:bg-white transition-all border border-slate-300"
        >
          TORNA A L'EDITOR
        </button>
      </div>
    </div>
  );
};
