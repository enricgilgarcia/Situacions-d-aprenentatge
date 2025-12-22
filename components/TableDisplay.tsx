
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

  // Normalitza el format de les competències a CE.X.
  const formatCE = (text: string, index: number) => {
    const cleanText = text.replace(/^CE\.\d+\.\s*/i, '').trim();
    return `CE.${index + 1}. ${cleanText}`;
  };

  const handleDownloadPDF = async () => {
    if (!pdfRef.current) return;
    setIsExporting(true);
    const element = pdfRef.current;
    const titolNet = data.identificacio.titol.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    // Configuració optimitzada per evitar pàgines en blanc i assegurar talls nets
    const opt = {
      margin: 0,
      filename: `Situacio_Aprenentatge_${titolNet}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        letterRendering: true,
        windowWidth: 1122 // Aproximadament l'amplada de l'A4 en horitzontal
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
      pagebreak: { mode: 'css', after: '.official-page' }
    };

    try {
      // @ts-ignore
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("Error PDF:", error);
      alert("Error en generar el PDF. Si el format no és correcte, prova d'usar el botó 'Imprimir' i triar 'Anomena com a PDF'.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadDOCX = async () => {
    setIsExportingWord(true);
    const titolNet = data.identificacio.titol.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    // Funció auxiliar per crear cel·les estandarditzades
    const createCell = (text: string, bold = false, width = 100, isHeader = false, italic = false) => new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text: text || "", bold, italic, size: 20, font: "Arial" })],
        spacing: { before: 100, after: 100 },
        alignment: isHeader ? AlignmentType.CENTER : AlignmentType.LEFT
      })],
      width: { size: width, type: WidthType.PERCENTAGE },
      verticalAlign: VerticalAlign.TOP,
      shading: isHeader ? { fill: "F2F2F2", type: ShadingType.CLEAR } : undefined,
      margins: { left: 120, right: 120, top: 120, bottom: 120 }
    });

    const createSectionHeader = (text: string) => new Paragraph({
      children: [new TextRun({ text, bold: true, size: 24, font: "Arial" })],
      spacing: { before: 300, after: 150 }
    });

    // Construcció del document de 5 pàgines
    const doc = new Document({
      sections: [{
        properties: {
          page: { size: { orientation: PageOrientation.LANDSCAPE } },
        },
        children: [
          // PÀGINA 1
          new Paragraph({ text: "Generalitat de Catalunya", bold: true, size: 24, font: "Arial" }),
          new Paragraph({ text: "Departament d’Educació", bold: true, size: 24, font: "Arial", spacing: { after: 600 } }),
          new Paragraph({ text: "Situació d’aprenentatge", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.RIGHT, spacing: { after: 1200 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [createCell("Títol", true, 30, true), createCell(data.identificacio.titol)] }),
              new TableRow({ children: [createCell("Curs (Nivell educatiu)", true, 30, true), createCell(data.identificacio.curs)] }),
              new TableRow({ children: [createCell("Àrea / Matèria / Àmbit", true, 30, true), createCell(data.identificacio.area_materia_ambit)] }),
            ]
          }),
          new Paragraph({ children: [new PageBreak()] }),

          // PÀGINA 2
          createSectionHeader("DESCRIPCIÓ (Context + Repte)"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [new TableRow({ children: [createCell(data.descripcio.context_repte)] })]
          }),
          createSectionHeader("COMPETÈNCIES ESPECÍFIQUES"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [createCell("Competències específiques", true, 70, true), createCell("Àrea o matèria", true, 30, true)] }),
              ...data.concrecio_curricular.competencies_especifiques.map((c, i) => 
                new TableRow({ children: [createCell(formatCE(c.descripcio, i)), createCell(c.area_materia)] })
              )
            ]
          }),
          createSectionHeader("TRACTAMENT DE LES COMPETÈNCIES TRANSVERSALS"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [new TableRow({ children: [createCell(data.descripcio.competencies_transversals)] })]
          }),
          new Paragraph({ children: [new PageBreak()] }),

          // PÀGINA 3
          createSectionHeader("OBJECTIUS D'APRENENTATGE I CRITERIS D'AVALUACIÓ"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [createCell("OBJECTIUS D'APRENENTATGE", true, 50, true), createCell("CRITERIS D'AVALUACIÓ", true, 50, true)] }),
              new TableRow({ children: [
                createCell(data.concrecio_curricular.objectius.map((o, i) => `${i+1}. ${o}`).join("\n")),
                createCell(data.concrecio_curricular.criteris_avaluacio.map((cr, i) => `${cr.includes('.') ? '' : (i+1) + '. '}${cr}`).join("\n"))
              ] })
            ]
          }),
          createSectionHeader("SABERS"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [createCell("#", true, 10, true), createCell("Saber", true, 60, true), createCell("Àrea o matèria", true, 30, true)] }),
              ...data.concrecio_curricular.sabers.map((s, i) => 
                new TableRow({ children: [createCell((i+1).toString(), false, 10, false), createCell(s.saber), createCell(s.area_materia)] })
              )
            ]
          }),
          new Paragraph({ children: [new PageBreak()] }),

          // PÀGINA 4
          createSectionHeader("DESENVOLUPAMENT DE LA SITUACIÓ D’APRENENTATGE"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [new TableRow({ children: [createCell(data.desenvolupament.estrategies_metodologiques)] })]
          }),
          createSectionHeader("ACTIVITATS D'APRENENTATGE I D'AVALUACIÓ"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [createCell("Fase", true, 25, true), createCell("Descripció de l'activitat", true, 60, true), createCell("Temporització", true, 15, true)] }),
              new TableRow({ children: [createCell("Activitats inicials", true), createCell(data.desenvolupament.activitats.inicials.descripcio), createCell(data.desenvolupament.activitats.inicials.temporitzacio)] }),
              new TableRow({ children: [createCell("Activitats de desenvolupament", true), createCell(data.desenvolupament.activitats.desenvolupament.descripcio), createCell(data.desenvolupament.activitats.desenvolupament.temporitzacio)] }),
              new TableRow({ children: [createCell("Activitats d'estructuració", true), createCell(data.desenvolupament.activitats.estructuracio.descripcio), createCell(data.desenvolupament.activitats.estructuracio.temporitzacio)] }),
              new TableRow({ children: [createCell("Activitats d'aplicació", true), createCell(data.desenvolupament.activitats.aplicacio.descripcio), createCell(data.desenvolupament.activitats.aplicacio.temporitzacio)] }),
            ]
          }),
          new Paragraph({ children: [new PageBreak()] }),

          // PÀGINA 5
          createSectionHeader("BREU DESCRIPCIÓ DE COM S’ABORDEN ELS VECTORS"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [new TableRow({ children: [createCell(data.vectors_suports.vectors_descripcio, false, 100, false, true)] })]
          }),
          createSectionHeader("MESURES I SUPORTS UNIVERSALS"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [new TableRow({ children: [createCell(data.vectors_suports.suports_universals)] })]
          }),
          createSectionHeader("MESURES I SUPORTS ADDICIONALS O INTENSIUS"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [createCell("Alumne", true, 35, true), createCell("Mesura i suport addicional o intensiu", true, 65, true)] }),
              ...(data.vectors_suports.suports_addicionals.length > 0 ? 
                data.vectors_suports.suports_addicionals.map(s => 
                  new TableRow({ children: [createCell(s.alumne), createCell(s.mesura)] })
                ) : [new TableRow({ children: [createCell("", false, 35), createCell("", false, 65)] })]
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
      alert("No s'ha pogut generar el fitxer Word correctament.");
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
          gap: 0;
        }
        .official-page { 
          background: white; 
          width: 297mm; 
          height: 210mm; 
          padding: 15mm; 
          margin: 0;
          box-shadow: 0 4px 30px rgba(0,0,0,0.1); 
          position: relative;
          color: black;
          font-family: Arial, Helvetica, sans-serif;
          box-sizing: border-box;
          overflow: hidden;
          page-break-after: always;
        }
        @media screen {
           .official-page { margin-bottom: 40px; }
           .official-container { padding-bottom: 60px; }
        }
        .official-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; table-layout: fixed; border: 1.2px solid black; }
        .official-table td { border: 1px solid black; padding: 8px 14px; vertical-align: top; font-size: 13px; word-wrap: break-word; }
        .official-table .label { width: 220px; font-weight: bold; background: #fdfdfd; }
        .official-header { display: flex; align-items: center; gap: 15px; margin-bottom: 30px; }
        .official-title-big { font-size: 64px; font-weight: 900; text-align: right; margin-top: 50px; line-height: 1; letter-spacing: -2px; color: #000; }
        .section-title { font-weight: bold; font-size: 14px; margin-bottom: 5px; text-transform: uppercase; margin-top: 15px; color: #000; border-bottom: 1px solid #eee; padding-bottom: 2px; }
        .box-content { border: 1.2px solid black; padding: 12px; min-height: 85px; font-size: 13px; margin-bottom: 12px; line-height: 1.5; }
        .footnote-area { position: absolute; bottom: 15mm; left: 15mm; right: 15mm; font-size: 9px; line-height: 1.3; border-top: 1px solid #ddd; padding-top: 8px; color: #555; }
        .page-num { position: absolute; bottom: 10mm; right: 15mm; font-size: 11px; font-weight: bold; }
        
        @media print {
          .official-container { width: 100%; margin: 0; }
          .official-page { box-shadow: none; margin: 0; width: 297mm; height: 210mm; page-break-after: always; border: none; }
          .no-print { display: none !important; }
          body { background: white; margin: 0; padding: 0; }
        }
      `}</style>
      
      <div ref={pdfRef} className="official-container">
        {/* PÀGINA 1: PORTADA */}
        <div className="official-page">
          <div className="official-header">
             <div className="w-12 h-12 bg-[#E30613] flex items-center justify-center">
                <div className="border-2 border-white w-8 h-8 flex items-center justify-center">
                  <div className="w-0.5 h-6 bg-white mx-1"></div>
                  <div className="w-0.5 h-6 bg-white mx-1"></div>
                </div>
             </div>
             <div>
               <div className="font-bold text-lg leading-tight uppercase">Generalitat de Catalunya</div>
               <div className="font-bold text-lg leading-tight uppercase">Departament d’Educació</div>
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
              <tr className="bg-gray-50 font-bold">
                <td>Competències específiques</td>
                <td className="w-1/3">Àrea o matèria</td>
              </tr>
            </thead>
            <tbody>
              {data.concrecio_curricular.competencies_especifiques.map((c, i) => (
                <tr key={i} style={{ height: '40px' }}>
                  <td>{formatCE(c.descripcio, i)}</td>
                  <td>{c.area_materia}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="section-title">TRACTAMENT DE LES COMPETÈNCIES TRANSVERSALS</div>
          <div className="box-content h-24 overflow-hidden">{data.descripcio.competencies_transversals}</div>
          <div className="page-num">Pàgina 2/5</div>
        </div>

        {/* PÀGINA 3: OBJECTIUS, CRITERIS I SABERS */}
        <div className="official-page">
          <div className="flex border-t border-l border-r border-black bg-gray-50 font-bold text-xs uppercase text-center">
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
                <td className="w-1/3">Àrea o matèria</td>
              </tr>
            </thead>
            <tbody>
              {data.concrecio_curricular.sabers.map((s, i) => (
                <tr key={i} style={{ height: '35px' }}>
                  <td className="text-center">{i+1}</td>
                  <td>{s.saber}</td>
                  <td>{s.area_materia}</td>
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
              <tr className="bg-gray-100 font-bold">
                <td className="w-1/4">Fase</td>
                <td>Descripció de l’activitat</td>
                <td className="w-1/6">Temporització</td>
              </tr>
            </thead>
            <tbody>
              {/* Cast as ActivitatDetall to avoid any implicit any issues */}
              {(Object.entries(data.desenvolupament.activitats) as [string, ActivitatDetall][]).map(([key, act], idx) => (
                <tr key={key} style={{ height: idx === 1 ? '100px' : '75px' }}>
                  <td className="font-bold capitalize">{key.replace(/_/g, ' ')}</td>
                  <td>{act.descripcio}</td>
                  <td>{act.temporitzacio}</td>
                </tr>
              ))}
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
              <tr className="bg-gray-50 font-bold">
                <td className="w-1/3">Alumne</td>
                <td>Mesura i suport addicional o intensiu</td>
              </tr>
            </thead>
            <tbody>
              {data.vectors_suports.suports_addicionals.length > 0 ? 
                data.vectors_suports.suports_addicionals.map((s, i) => (
                  <tr key={i} style={{ height: '40px' }}><td>{s.alumne}</td><td>{s.mesura}</td></tr>
                )) : <tr><td colSpan={2} className="h-12 text-slate-300 italic">No s'han especificat mesures addicionals per a cap alumne.</td></tr>
              }
            </tbody>
          </table>
          <div className="page-num">Pàgina 5/5</div>
        </div>
      </div>

      {/* BOTONS D'ACCIO REFINATS */}
      <div className="max-w-[1200px] mx-auto mt-8 mb-20 flex flex-wrap justify-center gap-4 no-print px-4">
        <button 
          onClick={handleDownloadPDF} 
          disabled={isExporting}
          className={`flex items-center gap-3 bg-red-600 text-white px-10 py-5 rounded-2xl font-black shadow-2xl transition-all transform active:scale-95 ${isExporting ? 'opacity-50' : 'hover:bg-red-700 hover:-translate-y-1'}`}
        >
          {isExporting ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
          {isExporting ? "GENERANT..." : "BAIXAR PDF OFICIAL"}
        </button>
        
        <button 
          onClick={handleDownloadDOCX} 
          disabled={isExportingWord}
          className={`flex items-center gap-3 bg-[#1B5E20] text-white px-10 py-5 rounded-2xl font-black shadow-2xl transition-all transform active:scale-95 ${isExportingWord ? 'opacity-50' : 'hover:bg-[#2E7D32] hover:-translate-y-1'}`}
        >
          {isExportingWord ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/></svg>}
          {isExportingWord ? "GENERANT..." : "BAIXAR WORD (DOCX)"}
        </button>

        <button 
          onClick={() => window.print()} 
          className="flex items-center gap-3 bg-white text-slate-800 border-2 border-slate-300 px-10 py-5 rounded-2xl font-black shadow-lg hover:bg-slate-50 transition-all transform hover:-translate-y-1"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
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
