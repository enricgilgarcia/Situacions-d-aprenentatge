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
  PageBreak,
  ShadingType,
  BorderStyle
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

  /**
   * Normalitza les competències al format estricte CE.X.
   * Elimina prefixos variats (CE.1, CE 1, Competència 1, etc.) per evitar duplicitats.
   */
  const formatCE = (text: string, index: number) => {
    if (!text) return `CE.${index + 1}.`;
    const cleanText = text.replace(/^(CE\.?\s*\d+\.?\s*:?|Competència\s*específica\s*\d+\.?\s*:?|CE\d+)\s*[-–—]?\s*/i, '').trim();
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
        letterRendering: true,
        windowWidth: 1122, 
        scrollY: 0,
        x: 0,
        y: 0
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape', compress: true },
      pagebreak: { mode: 'css' }
    };

    try {
      // @ts-ignore
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("Error PDF:", error);
      alert("Error al generar el PDF.");
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
      align?: any,
      size?: number,
      vAlign?: any
    } = {}) => {
      const { 
        bold = false, 
        width = 100, 
        isHeader = false, 
        italic = false, 
        align = AlignmentType.LEFT, 
        size = 20,
        vAlign = VerticalAlign.CENTER
      } = options;
      
      return new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: text || "", bold, italics: italic, size, font: "Arial" })],
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

    const createSectionTitle = (text: string) => new Paragraph({
      children: [new TextRun({ text, bold: true, size: 24, font: "Arial" })],
      spacing: { before: 400, after: 200 }
    });

    const doc = new Document({
      sections: [{
        properties: {
          page: { size: { orientation: PageOrientation.LANDSCAPE } },
        },
        children: [
          new Paragraph({ 
            children: [new TextRun({ text: "Generalitat de Catalunya", bold: true, size: 28, font: "Arial" })] 
          }),
          new Paragraph({ 
            children: [new TextRun({ text: "Departament d’Educació", bold: true, size: 28, font: "Arial" })],
            spacing: { after: 600 } 
          }),
          new Paragraph({ 
            children: [new TextRun({ text: "Situació d’aprenentatge" })], 
            heading: HeadingLevel.HEADING_1, 
            alignment: AlignmentType.RIGHT, 
            spacing: { after: 1200 } 
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [createCell("Títol", { bold: true, width: 25, isHeader: true }), createCell(data.identificacio.titol, { width: 75 })] }),
              new TableRow({ children: [createCell("Curs (Nivell educatiu)", { bold: true, width: 25, isHeader: true }), createCell(data.identificacio.curs, { width: 75 })] }),
              new TableRow({ children: [createCell("Àrea / Matèria / Àmbit", { bold: true, width: 25, isHeader: true }), createCell(data.identificacio.area_materia_ambit, { width: 75 })] }),
            ]
          }),
          new Paragraph({ children: [new PageBreak()] }),
          createSectionTitle("DESCRIPCIÓ (Context + Repte)"),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: [createCell(data.descripcio.context_repte)] })] }),
          createSectionTitle("COMPETÈNCIES ESPECÍFIQUES"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [createCell("Competències específiques", { bold: true, width: 70, isHeader: true, align: AlignmentType.CENTER }), createCell("Àrea o matèria", { bold: true, width: 30, isHeader: true, align: AlignmentType.CENTER })] }),
              ...data.concrecio_curricular.competencies_especifiques.map((c, i) => 
                new TableRow({ children: [createCell(formatCE(c.descripcio, i), { width: 70 }), createCell(c.area_materia, { width: 30 })] })
              )
            ]
          }),
          createSectionTitle("TRACTAMENT DE LES COMPETÈNCIES TRANSVERSALS"),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: [createCell(data.descripcio.competencies_transversals)] })] }),
          new Paragraph({ children: [new PageBreak()] }),
          createSectionTitle("OBJECTIUS D'APRENENTATGE I CRITERIS D'AVALUACIÓ"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [createCell("OBJECTIUS D'APRENENTATGE", { bold: true, width: 50, isHeader: true, align: AlignmentType.CENTER }), createCell("CRITERIS D'AVALUACIÓ", { bold: true, width: 50, isHeader: true, align: AlignmentType.CENTER })] }),
              new TableRow({ children: [
                createCell(data.concrecio_curricular.objectius.map((o, i) => `${i+1}. ${o}`).join("\n"), { width: 50 }),
                createCell(data.concrecio_curricular.criteris_avaluacio.map((cr, i) => `${cr.includes('.') ? '' : (i+1) + '. '}${cr}`).join("\n"), { width: 50 })
              ] })
            ]
          }),
          createSectionTitle("SABERS"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [createCell("#", { bold: true, width: 10, isHeader: true, align: AlignmentType.CENTER }), createCell("Saber", { bold: true, width: 60, isHeader: true, align: AlignmentType.CENTER }), createCell("Àrea o matèria", { bold: true, width: 30, isHeader: true, align: AlignmentType.CENTER })] }),
              ...data.concrecio_curricular.sabers.map((s, i) => 
                new TableRow({ children: [createCell((i+1).toString(), { width: 10, align: AlignmentType.CENTER }), createCell(s.saber, { width: 60 }), createCell(s.area_materia, { width: 30 })] })
              )
            ]
          }),
          new Paragraph({ children: [new PageBreak()] }),
          createSectionTitle("DESENVOLUPAMENT DE LA SITUACIÓ D’APRENENTATGE"),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: [createCell(data.desenvolupament.estrategies_metodologiques)] })] }),
          createSectionTitle("ACTIVITATS D'APRENENTATGE I D'AVALUACIÓ"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [createCell("Fase", { bold: true, width: 25, isHeader: true, align: AlignmentType.CENTER }), createCell("Descripció de l'activitat", { bold: true, width: 60, isHeader: true, align: AlignmentType.CENTER }), createCell("Temporització", { bold: true, width: 15, isHeader: true, align: AlignmentType.CENTER })] }),
              new TableRow({ children: [createCell("Activitats inicials", { bold: true, width: 25 }), createCell(data.desenvolupament.activitats.inicials.descripcio, { width: 60 }), createCell(data.desenvolupament.activitats.inicials.temporitzacio, { align: AlignmentType.CENTER, width: 15 })] }),
              new TableRow({ children: [createCell("Activitats de desenvolupament", { bold: true, width: 25 }), createCell(data.desenvolupament.activitats.desenvolupament.descripcio, { width: 60 }), createCell(data.desenvolupament.activitats.desenvolupament.temporitzacio, { align: AlignmentType.CENTER, width: 15 })] }),
              new TableRow({ children: [createCell("Activitats d'estructuració", { bold: true, width: 25 }), createCell(data.desenvolupament.activitats.estructuracio.descripcio, { width: 60 }), createCell(data.desenvolupament.activitats.estructuracio.temporitzacio, { align: AlignmentType.CENTER, width: 15 })] }),
              new TableRow({ children: [createCell("Activitats d'aplicació", { bold: true, width: 25 }), createCell(data.desenvolupament.activitats.aplicacio.descripcio, { width: 60 }), createCell(data.desenvolupament.activitats.aplicacio.temporitzacio, { align: AlignmentType.CENTER, width: 15 })] }),
            ]
          }),
          new Paragraph({ children: [new PageBreak()] }),
          createSectionTitle("BREU DESCRIPCIÓ DE COM S’ABORDEN ELS VECTORS"),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: [createCell(data.vectors_suports.vectors_descripcio, { italic: true })] })] }),
          createSectionTitle("MESURES I SUPORTS UNIVERSALS"),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: [createCell(data.vectors_suports.suports_universals)] })] }),
          createSectionTitle("MESURES I SUPORTS ADDICIONALS O INTENSIUS"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [createCell("Alumne", { bold: true, width: 35, isHeader: true, align: AlignmentType.CENTER }), createCell("Mesura i suport addicional o intensiu", { bold: true, width: 65, isHeader: true, align: AlignmentType.CENTER })] }),
              ...(data.vectors_suports.suports_addicionals.length > 0 ? 
                data.vectors_suports.suports_addicionals.map(s => 
                  new TableRow({ children: [createCell(s.alumne, { width: 35 }), createCell(s.mesura, { width: 65 })] })
                ) : [new TableRow({ children: [createCell("Sense dades", { italic: true, align: AlignmentType.CENTER, width: 35 }), createCell("Sense dades", { italic: true, align: AlignmentType.CENTER, width: 65 })] })]
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
          padding: 0;
        }
        .official-page { 
          background: white; 
          width: 297mm; 
          height: 209.3mm;
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
        
        .official-page:not(:last-child) {
          page-break-after: always;
        }
        
        @media screen {
           .official-page { margin-bottom: 40px; }
           .official-container { padding-bottom: 80px; }
           .official-container.is-exporting-pdf .official-page { margin-bottom: 0 !important; }
        }
        
        .official-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; table-layout: fixed; border: 1.2px solid black; }
        .official-table td { border: 1px solid black; padding: 10px 14px; vertical-align: middle; font-size: 13px; word-wrap: break-word; line-height: 1.4; }
        .official-table .label { width: 25%; font-weight: bold; background: #f9fafb; }
        .official-header { display: flex; align-items: center; gap: 15px; margin-bottom: 30px; }
        .official-title-big { font-size: 64px; font-weight: 900; text-align: right; margin-top: 50px; line-height: 1; letter-spacing: -2px; color: #000; }
        .section-title { font-weight: bold; font-size: 14px; margin-bottom: 6px; text-transform: uppercase; margin-top: 15px; color: #000; border-bottom: 1px solid #eee; }
        .box-content { border: 1.2px solid black; padding: 12px; min-height: 85px; font-size: 13px; margin-bottom: 12px; line-height: 1.5; }
        .footnote-area { position: absolute; bottom: 15mm; left: 15mm; right: 15mm; font-size: 9px; line-height: 1.3; border-top: 1px solid #ddd; padding-top: 8px; color: #666; }
        .page-num { position: absolute; bottom: 10mm; right: 15mm; font-size: 11px; font-weight: bold; }
        
        @media print {
          .official-container { width: 297mm; margin: 0; background: white; }
          .official-page { box-shadow: none; margin: 0; width: 297mm; height: 210mm; border: none; }
          .no-print { display: none !important; }
          body { background: white; margin: 0; padding: 0; }
        }
      `}</style>
      
      <div ref={pdfRef} className="official-container">
        {/* PÀGINA 1: PORTADA */}
        <div className="official-page">
          <div className="official-header">
             <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                <rect width="48" height="48" fill="#E30613"/>
                <rect x="10" y="10" width="28" height="28" stroke="white" strokeWidth="2.5"/>
                <rect x="14.5" y="14" width="2" height="20" fill="white"/>
                <rect x="20.5" y="14" width="2" height="20" fill="white"/>
                <rect x="26.5" y="14" width="2" height="20" fill="white"/>
                <rect x="32.5" y="14" width="2" height="20" fill="white"/>
             </svg>
             <div className="flex flex-col">
               <div className="font-bold text-[17px] leading-[1.1] uppercase tracking-tight">Generalitat de Catalunya</div>
               <div className="font-bold text-[17px] leading-[1.1] uppercase tracking-tight">Departament d’Educació</div>
             </div>
          </div>
          <div className="official-title-big">Situació d’aprenentatge<sup className="text-xl font-normal">1</sup></div>
          <div className="mt-24">
            <table className="official-table">
              <tbody>
                <tr style={{ height: '55px' }}>
                  <td className="label">Títol</td>
                  <td>{data.identificacio.titol}</td>
                </tr>
                <tr style={{ height: '55px' }}>
                  <td className="label">Curs (Nivell educatiu)</td>
                  <td>{data.identificacio.curs}</td>
                </tr>
                <tr style={{ height: '55px' }}>
                  <td className="label">Àrea / Matèria / Àmbit</td>
                  <td>{data.identificacio.area_materia_ambit}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="footnote-area">
            <p><sup>1</sup> Són els escenaris que l’alumnat es troba a la vida real i que es poden utilitzar per desenvolupar aprenentatges competencials que permetin resoldre els reptes i les qüestions que se’ls plantegen.</p>
          </div>
          <div className="page-num">Pàgina 1/5</div>
        </div>

        {/* PÀGINA 2: DESCRIPCIÓ I COMPETÈNCIES */}
        <div className="official-page">
          <div className="section-title">DESCRIPCIÓ (Context + Repte)</div>
          <div className="box-content h-32 overflow-hidden">{data.descripcio.context_repte}</div>
          <div className="section-title">COMPETÈNCIES ESPECÍFIQUES</div>
          <table className="official-table">
            <thead>
              <tr className="bg-gray-50 font-bold text-center">
                <td className="w-[70%]">Competències específiques</td>
                <td className="w-[30%] text-center">Àrea o matèria</td>
              </tr>
            </thead>
            <tbody>
              {data.concrecio_curricular.competencies_especifiques.map((c, i) => (
                <tr key={i} style={{ height: '40px' }}>
                  <td>{formatCE(c.descripcio, i)}</td>
                  <td className="text-center">{c.area_materia}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="section-title">TRACTAMENT DE LES COMPETÈNCIES TRANSVERSALS</div>
          <div className="box-content h-24 overflow-hidden">{data.descripcio.competencies_transversals}</div>
          <div className="page-num">Pàgina 2/5</div>
        </div>

        {/* PÀGINA 3: CONCRECIÓ CURRICULAR */}
        <div className="official-page">
          <div className="flex border-t border-l border-r border-black bg-gray-50 font-bold text-[10px] uppercase text-center">
             <div className="flex-1 p-2 border-r border-black">OBJECTIUS D’APRENENTATGE</div>
             <div className="flex-1 p-2">CRITERIS D’AVALUACIÓ</div>
          </div>
          <div className="flex border border-black">
             <div className="flex-1 p-4 border-r border-black min-h-[180px] text-xs space-y-3">
                {data.concrecio_curricular.objectius.map((o, i) => (
                  <div key={i} className="flex gap-2"><b>{i+1}.</b> {o}</div>
                ))}
             </div>
             <div className="flex-1 p-4 min-h-[180px] text-xs space-y-3">
                {data.concrecio_curricular.criteris_avaluacio.map((cr, i) => (
                  <div key={i} className="flex gap-2"><b>{cr.includes('.') ? '' : (i+1)+'.'}</b> {cr}</div>
                ))}
             </div>
          </div>
          <div className="section-title mt-6">SABERS</div>
          <table className="official-table">
            <thead>
              <tr className="bg-gray-50 font-bold text-center">
                <td className="w-10">#</td>
                <td>Saber</td>
                <td className="w-1/3 text-center">Àrea o matèria</td>
              </tr>
            </thead>
            <tbody>
              {data.concrecio_curricular.sabers.map((s, i) => (
                <tr key={i} style={{ height: '35px' }}>
                  <td className="text-center">{i+1}</td>
                  <td>{s.saber}</td>
                  <td className="text-center">{s.area_materia}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="page-num">Pàgina 3/5</div>
        </div>

        {/* PÀGINA 4: ACTIVITATS */}
        <div className="official-page">
          <div className="section-title">DESENVOLUPAMENT DE LA SITUACIÓ D’APRENENTATGE</div>
          <div className="box-content h-24 overflow-hidden">{data.desenvolupament.estrategies_metodologiques}</div>
          <div className="section-title mt-4">ACTIVITATS D’APRENENTATGE I D’AVALUACIÓ</div>
          <table className="official-table">
            <thead>
              <tr className="bg-gray-100 font-bold text-center">
                <td className="w-1/4">Fase</td>
                <td>Descripció de l’activitat</td>
                <td className="w-1/6">Temporització</td>
              </tr>
            </thead>
            <tbody>
              <tr style={{ height: '75px' }}>
                <td className="font-bold">Activitats inicials</td>
                <td>{data.desenvolupament.activitats.inicials.descripcio}</td>
                <td className="text-center">{data.desenvolupament.activitats.inicials.temporitzacio}</td>
              </tr>
              <tr style={{ height: '100px' }}>
                <td className="font-bold">Activitats de desenvolupament</td>
                <td>{data.desenvolupament.activitats.desenvolupament.descripcio}</td>
                <td className="text-center">{data.desenvolupament.activitats.desenvolupament.temporitzacio}</td>
              </tr>
              <tr style={{ height: '75px' }}>
                <td className="font-bold">Activitats d'estructuració</td>
                <td>{data.desenvolupament.activitats.estructuracio.descripcio}</td>
                <td className="text-center">{data.desenvolupament.activitats.estructuracio.temporitzacio}</td>
              </tr>
              <tr style={{ height: '75px' }}>
                <td className="font-bold">Activitats d'aplicació</td>
                <td>{data.desenvolupament.activitats.aplicacio.descripcio}</td>
                <td className="text-center">{data.desenvolupament.activitats.aplicacio.temporitzacio}</td>
              </tr>
            </tbody>
          </table>
          <div className="page-num">Pàgina 4/5</div>
        </div>

        {/* PÀGINA 5: VECTORS I SUPORTS */}
        <div className="official-page">
          <div className="section-title">BREU DESCRIPCIÓ DE COM S’ABORDEN ELS VECTORS</div>
          <div className="box-content h-28 italic overflow-hidden bg-gray-50/50">{data.vectors_suports.vectors_descripcio}</div>
          <div className="section-title">MESURES I SUPORTS UNIVERSALS</div>
          <div className="box-content h-28 overflow-hidden">{data.vectors_suports.suports_universals}</div>
          <div className="section-title">MESURES I SUPORTS ADDICIONALS O INTENSIUS</div>
          <table className="official-table">
            <thead>
              <tr className="bg-gray-50 font-bold text-center">
                <td className="w-1/3">Alumne</td>
                <td className="text-center">Mesura i suport addicional o intensiu</td>
              </tr>
            </thead>
            <tbody>
              {data.vectors_suports.suports_addicionals.length > 0 ? 
                data.vectors_suports.suports_addicionals.map((s, i) => (
                  <tr key={i} style={{ height: '40px' }}>
                    <td className="text-center">{s.alumne}</td>
                    <td>{s.mesura}</td>
                  </tr>
                )) : <tr><td colSpan={2} className="h-12 text-slate-300 italic text-center">No s'han definit mesures addicionals.</td></tr>
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
          className={`flex items-center gap-3 bg-red-600 text-white px-8 py-4 rounded-2xl font-black shadow-2xl transition-all transform active:scale-95 ${isExporting ? 'opacity-50' : 'hover:bg-red-700 hover:-translate-y-1'}`}
        >
          {isExporting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
          {isExporting ? "PDF..." : "BAIXAR PDF"}
        </button>
        <button 
          onClick={handleDownloadDOCX} 
          disabled={isExportingWord}
          className={`flex items-center gap-3 bg-green-700 text-white px-8 py-4 rounded-2xl font-black shadow-2xl transition-all transform active:scale-95 ${isExportingWord ? 'opacity-50' : 'hover:bg-green-800 hover:-translate-y-1'}`}
        >
          {isExportingWord ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/></svg>}
          {isExportingWord ? "WORD..." : "BAIXAR WORD"}
        </button>
        <button onClick={() => window.print()} className="flex items-center gap-3 bg-white text-slate-800 border-2 border-slate-300 px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-slate-50 transition-all transform hover:-translate-y-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          IMPRIMIR
        </button>
        <button onClick={() => onEdit(data)} className="flex items-center gap-3 bg-slate-100 text-slate-500 px-6 py-4 rounded-xl font-bold hover:bg-white transition-all border border-slate-300">
          TORNA A L'EDITOR
        </button>
      </div>
    </div>
  );
};