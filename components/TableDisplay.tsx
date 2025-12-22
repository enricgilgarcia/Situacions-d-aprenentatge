
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
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        windowWidth: 1122, // Amplada A4 horitzontal exacta
        scrollY: 0
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape', compress: true },
      pagebreak: { mode: 'css' }
    };

    try {
      // @ts-ignore
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("Error PDF:", error);
      alert("S'ha produït un error al generar el PDF.");
    } finally {
      element.classList.remove('is-exporting-pdf');
      setIsExporting(false);
    }
  };

  const handleDownloadDOCX = async () => {
    setIsExportingWord(true);
    const titolNet = data.identificacio.titol.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    const createCell = (text: string, options: { 
      bold?: boolean, 
      width?: number, 
      isHeader?: boolean, 
      italic?: boolean, 
      align?: AlignmentType,
      size?: number,
      vAlign?: VerticalAlign
    } = {}) => {
      const { bold = false, width = 100, isHeader = false, italic = false, align = AlignmentType.LEFT, size = 20, vAlign = VerticalAlign.CENTER } = options;
      return new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: text || "", bold, italic, size, font: "Arial" })],
          spacing: { before: 140, after: 140 },
          alignment: align
        })],
        width: { size: width, type: WidthType.PERCENTAGE },
        verticalAlign: vAlign,
        shading: isHeader ? { fill: "F9FAFB", type: ShadingType.CLEAR } : undefined,
        margins: { left: 160, right: 160, top: 120, bottom: 120 },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        }
      });
    };

    const doc = new Document({
      sections: [{
        properties: { page: { size: { orientation: PageOrientation.LANDSCAPE } } },
        children: [
          new Paragraph({ text: "Generalitat de Catalunya", bold: true, size: 28, font: "Arial" }),
          new Paragraph({ text: "Departament d’Educació", bold: true, size: 32, font: "Arial", spacing: { after: 600 } }),
          new Paragraph({ text: "Situació d’aprenentatge", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.RIGHT, spacing: { after: 1200 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [createCell("Títol", { bold: true, width: 25, isHeader: true }), createCell(data.identificacio.titol, { width: 75 })] }),
              new TableRow({ children: [createCell("Curs (Nivell educatiu)", { bold: true, width: 25, isHeader: true }), createCell(data.identificacio.curs, { width: 75 })] }),
              new TableRow({ children: [createCell("Àrea / Matèria / Àmbit", { bold: true, width: 25, isHeader: true }), createCell(data.identificacio.area_materia_ambit, { width: 75 })] }),
            ]
          }),
          new Paragraph({ children: [new PageBreak()] }),
          // Concreció Curricular
          new Paragraph({ text: "DESCRIPCIÓ I COMPETÈNCIES", bold: true, size: 24, font: "Arial", spacing: { before: 400, after: 200 } }),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: [createCell(data.descripcio.context_repte)] })] }),
          new Paragraph({ text: "COMPETÈNCIES ESPECÍFIQUES I CRITERIS", bold: true, size: 24, font: "Arial", spacing: { before: 400, after: 200 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [createCell("Competències específiques", { bold: true, width: 70, isHeader: true }), createCell("Àrea", { bold: true, width: 30, isHeader: true })] }),
              ...data.concrecio_curricular.competencies_especifiques.map((c, i) => 
                new TableRow({ children: [createCell(formatCE(c.descripcio, i), { width: 70 }), createCell(c.area_materia, { width: 30 })] })
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
      console.error("Error DOCX:", err);
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
          display: flex;
          flex-direction: column;
          align-items: center;
          background: #e2e8f0;
          padding: 0;
        }
        .official-page { 
          background: white; 
          width: 297mm; 
          height: 209.4mm; /* Alçada per evitar micro-talls a l'exportació */
          padding: 15mm; 
          margin: 0;
          box-shadow: 0 4px 30px rgba(0,0,0,0.1); 
          position: relative;
          color: black;
          font-family: Arial, sans-serif;
          box-sizing: border-box;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        
        /* Gestió de salts per evitar pàgines en blanc finals */
        .official-page:not(:last-child) {
          page-break-after: always;
        }
        
        @media screen {
           .official-page { margin-bottom: 40px; }
           .official-container { padding-bottom: 80px; }
           .official-container.is-exporting-pdf .official-page { margin-bottom: 0 !important; box-shadow: none; }
        }
        
        .official-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; table-layout: fixed; border: 1.2px solid black; }
        .official-table td { border: 1px solid black; padding: 10px 14px; vertical-align: middle; font-size: 13px; line-height: 1.4; word-wrap: break-word; }
        .label-cell { width: 25%; font-weight: bold; background: #f9fafb; }
        .official-header { display: flex; align-items: center; margin-bottom: 30px; }
        .official-logo { height: 60px; }
        .official-title-big { font-size: 64px; font-weight: 900; text-align: right; margin-top: 40px; line-height: 1; letter-spacing: -2px; }
        .section-title { font-weight: bold; font-size: 14px; margin-bottom: 6px; text-transform: uppercase; margin-top: 15px; border-bottom: 1px solid #eee; }
        .box-content { border: 1.2px solid black; padding: 12px; min-height: 85px; font-size: 13px; margin-bottom: 12px; line-height: 1.5; }
        .footnote-area { position: absolute; bottom: 15mm; left: 15mm; right: 15mm; font-size: 9px; line-height: 1.3; border-top: 1px solid #ddd; padding-top: 8px; color: #666; }
        .page-num { position: absolute; bottom: 10mm; right: 15mm; font-size: 11px; font-weight: bold; }
        
        @media print {
          .official-container { width: 297mm; margin: 0; background: white; }
          .official-page { box-shadow: none; width: 297mm; height: 210mm; border: none; }
          .no-print { display: none !important; }
        }
      `}</style>
      
      <div ref={pdfRef} className="official-container">
        {/* PÀGINA 1: PORTADA AMB LOGO */}
        <div className="official-page">
          <div className="official-header">
             <img src={LOGO_GEN_BASE64} alt="Generalitat de Catalunya" className="official-logo" />
          </div>
          <div className="official-title-big">Situació d’aprenentatge<sup className="text-xl font-normal">1</sup></div>
          <div className="mt-24">
            <table className="official-table">
              <tbody>
                <tr style={{ height: '60px' }}>
                  <td className="label-cell">Títol</td>
                  <td>{data.identificacio.titol}</td>
                </tr>
                <tr style={{ height: '60px' }}>
                  <td className="label-cell">Curs (Nivell educatiu)</td>
                  <td>{data.identificacio.curs}</td>
                </tr>
                <tr style={{ height: '60px' }}>
                  <td className="label-cell">Àrea / Matèria / Àmbit</td>
                  <td>{data.identificacio.area_materia_ambit}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="footnote-area">
            <p><sup>1</sup> Són els escenaris que l’alumnat es troba a la vida real i que es poden utilitzar per desenvolupar aprenentatges competencials.</p>
          </div>
          <div className="page-num text-slate-400">Pàgina 1/5</div>
        </div>

        {/* PÀGINA 2: DESCRIPCIÓ I COMPETÈNCIES */}
        <div className="official-page">
          <div className="section-title">DESCRIPCIÓ (Context + Repte)</div>
          <div className="box-content h-32 overflow-hidden">{data.descripcio.context_repte}</div>
          <div className="section-title">COMPETÈNCIES ESPECÍFIQUES</div>
          <table className="official-table">
            <thead>
              <tr className="bg-slate-50 font-bold text-center">
                <td className="w-[70%]">Competències específiques</td>
                <td className="w-[30%]">Àrea o matèria</td>
              </tr>
            </thead>
            <tbody>
              {data.concrecio_curricular.competencies_especifiques.map((c, i) => (
                <tr key={i} style={{ minHeight: '40px' }}>
                  <td>{formatCE(c.descripcio, i)}</td>
                  <td className="text-center">{c.area_materia}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="section-title">TRACTAMENT DE LES COMPETÈNCIES TRANSVERSALS</div>
          <div className="box-content h-24 overflow-hidden">{data.descripcio.competencies_transversals}</div>
          <div className="page-num text-slate-400">Pàgina 2/5</div>
        </div>

        {/* PÀGINA 3: CONCRECIÓ CURRICULAR */}
        <div className="official-page">
          <div className="flex border-t border-l border-r border-black bg-slate-50 font-bold text-[10px] uppercase text-center">
             <div className="flex-1 p-2 border-r border-black">OBJECTIUS D’APRENENTATGE</div>
             <div className="flex-1 p-2">CRITERIS D’AVALUACIÓ</div>
          </div>
          <div className="flex border border-black flex-grow">
             <div className="flex-1 p-4 border-r border-black text-xs space-y-3">
                {data.concrecio_curricular.objectius.map((o, i) => (
                  <div key={i} className="flex gap-2"><b>{i+1}.</b> {o}</div>
                ))}
             </div>
             <div className="flex-1 p-4 text-xs space-y-3">
                {data.concrecio_curricular.criteris_avaluacio.map((cr, i) => (
                  <div key={i} className="flex gap-2"><b>{cr.includes('.') ? '' : (i+1)+'.'}</b> {cr}</div>
                ))}
             </div>
          </div>
          <div className="section-title mt-4">SABERS</div>
          <table className="official-table">
            <thead><tr className="bg-slate-50 font-bold text-center"><td className="w-10">#</td><td>Saber</td><td className="w-1/3">Àrea</td></tr></thead>
            <tbody>
              {data.concrecio_curricular.sabers.map((s, i) => (
                <tr key={i}><td className="text-center">{i+1}</td><td>{s.saber}</td><td className="text-center">{s.area_materia}</td></tr>
              ))}
            </tbody>
          </table>
          <div className="page-num text-slate-400">Pàgina 3/5</div>
        </div>

        {/* PÀGINA 4: ACTIVITATS */}
        <div className="official-page">
          <div className="section-title">DESENVOLUPAMENT I ACTIVITATS</div>
          <div className="box-content mb-4 text-xs italic">{data.desenvolupament.estrategies_metodologiques}</div>
          <table className="official-table">
            <thead><tr className="bg-slate-50 font-bold text-center"><td className="w-1/4">Fase</td><td>Descripció</td><td className="w-20">Temps</td></tr></thead>
            <tbody>
              <tr><td className="font-bold">Inicials</td><td>{data.desenvolupament.activitats.inicials.descripcio}</td><td className="text-center">{data.desenvolupament.activitats.inicials.temporitzacio}</td></tr>
              <tr><td className="font-bold">Desenvolupament</td><td>{data.desenvolupament.activitats.desenvolupament.descripcio}</td><td className="text-center">{data.desenvolupament.activitats.desenvolupament.temporitzacio}</td></tr>
              <tr><td className="font-bold">Estructuració</td><td>{data.desenvolupament.activitats.estructuracio.descripcio}</td><td className="text-center">{data.desenvolupament.activitats.estructuracio.temporitzacio}</td></tr>
              <tr><td className="font-bold">Aplicació</td><td>{data.desenvolupament.activitats.aplicacio.descripcio}</td><td className="text-center">{data.desenvolupament.activitats.aplicacio.temporitzacio}</td></tr>
            </tbody>
          </table>
          <div className="page-num text-slate-400">Pàgina 4/5</div>
        </div>

        {/* PÀGINA 5: VECTORS I SUPORTS */}
        <div className="official-page">
          <div className="section-title">VECTORS DEL CURRÍCULUM</div>
          <div className="box-content h-24 italic bg-slate-50/50">{data.vectors_suports.vectors_descripcio}</div>
          <div className="section-title">MESURES I SUPORTS DUA</div>
          <div className="box-content h-24 mb-4">{data.vectors_suports.suports_universals}</div>
          <table className="official-table">
            <thead><tr className="bg-slate-50 font-bold text-center"><td className="w-1/3">Alumne</td><td>Mesura / Suport Addicional</td></tr></thead>
            <tbody>
              {data.vectors_suports.suports_addicionals.length > 0 ? 
                data.vectors_suports.suports_addicionals.map((s, i) => (
                  <tr key={i}><td>{s.alumne}</td><td>{s.mesura}</td></tr>
                )) : <tr><td colSpan={2} className="text-center italic text-slate-300">Cap mesura addicional definida</td></tr>
              }
            </tbody>
          </table>
          <div className="page-num text-slate-400">Pàgina 5/5</div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto mt-8 mb-20 flex flex-wrap justify-center gap-4 no-print px-4">
        <button onClick={handleDownloadPDF} disabled={isExporting} className={`flex items-center gap-3 bg-red-600 text-white px-10 py-5 rounded-2xl font-black shadow-2xl transition-all transform active:scale-95 ${isExporting ? 'opacity-50' : 'hover:bg-red-700 hover:-translate-y-1'}`}>
          {isExporting ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "BAIXAR PDF"}
        </button>
        <button onClick={handleDownloadDOCX} disabled={isExportingWord} className={`flex items-center gap-3 bg-green-700 text-white px-10 py-5 rounded-2xl font-black shadow-2xl transition-all transform active:scale-95 ${isExportingWord ? 'opacity-50' : 'hover:bg-green-800 hover:-translate-y-1'}`}>
          {isExportingWord ? "GENERANT..." : "BAIXAR WORD"}
        </button>
        <button onClick={() => window.print()} className="bg-white text-slate-800 border-2 border-slate-300 px-10 py-5 rounded-2xl font-black hover:bg-slate-50">IMPRIMIR</button>
        <button onClick={() => onEdit(data)} className="bg-slate-100 text-slate-500 px-8 py-4 rounded-xl font-bold border border-slate-300">MODIFICAR</button>
      </div>
    </div>
  );
};
