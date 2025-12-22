
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
      margin: 10,
      filename: `Situacio_Aprenentatge_${titolNet}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        letterRendering: true,
        windowWidth: 1122 
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape', compress: true },
      pagebreak: { mode: ['css', 'legacy'] }
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
    
    const createCell = (text: string, options: { 
      bold?: boolean, 
      width?: number, 
      isHeader?: boolean, 
      align?: any,
      size?: number
    } = {}) => {
      const { bold = false, width = 100, isHeader = false, align = AlignmentType.LEFT, size = 20 } = options;
      return new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: text || "", bold, size, font: "Arial" })],
          spacing: { before: 120, after: 120 },
          alignment: align
        })],
        width: { size: width, type: WidthType.PERCENTAGE },
        verticalAlign: VerticalAlign.CENTER,
        shading: isHeader ? { fill: "F3F4F6", type: ShadingType.CLEAR } : undefined,
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
          new Paragraph({ children: [new TextRun({ text: "Generalitat de Catalunya", bold: true, size: 24 })] }),
          new Paragraph({ children: [new TextRun({ text: "Departament d’Educació", bold: true, size: 24 })], spacing: { after: 400 } }),
          new Paragraph({ text: "SITUACIÓ D'APRENENTATGE", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
          
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [createCell("Títol de la SA", { bold: true, width: 25, isHeader: true }), createCell(data.identificacio.titol, { width: 75 })] }),
              new TableRow({ children: [createCell("Curs", { bold: true, width: 25, isHeader: true }), createCell(data.identificacio.curs, { width: 75 })] }),
              new TableRow({ children: [createCell("Àrea / Matèria", { bold: true, width: 25, isHeader: true }), createCell(data.identificacio.area_materia_ambit, { width: 75 })] }),
            ]
          }),
          
          new Paragraph({ text: "CONCRECIÓ CURRICULAR", heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 200 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [createCell("Competències Específiques", { bold: true, width: 70, isHeader: true }), createCell("Àrea", { bold: true, width: 30, isHeader: true })] }),
              ...data.concrecio_curricular.competencies_especifiques.map((c, i) => 
                new TableRow({ children: [createCell(formatCE(c.descripcio, i), { width: 70 }), createCell(c.area_materia, { width: 30 })] })
              )
            ]
          }),

          new Paragraph({ text: "OBJECTIUS I CRITERIS D'AVALUACIÓ", heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 200 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [createCell("Objectius", { bold: true, width: 50, isHeader: true }), createCell("Criteris d'Avaluació", { bold: true, width: 50, isHeader: true })] }),
              new TableRow({ children: [
                createCell(data.concrecio_curricular.objectius.join("\n"), { width: 50 }),
                createCell(data.concrecio_curricular.criteris_avaluacio.join("\n"), { width: 50 })
              ]})
            ]
          }),

          new Paragraph({ text: "SEQÜÈNCIA DIDÀCTICA", heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 200 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [createCell("Fase", { bold: true, width: 20, isHeader: true }), createCell("Activitat / Descripció", { bold: true, width: 60, isHeader: true }), createCell("Temps", { bold: true, width: 20, isHeader: true })] }),
              new TableRow({ children: [createCell("Inicial"), createCell(data.desenvolupament.activitats.inicials.descripcio), createCell(data.desenvolupament.activitats.inicials.temporitzacio)] }),
              new TableRow({ children: [createCell("Desenvolupament"), createCell(data.desenvolupament.activitats.desenvolupament.descripcio), createCell(data.desenvolupament.activitats.desenvolupament.temporitzacio)] }),
              new TableRow({ children: [createCell("Estructuració"), createCell(data.desenvolupament.activitats.estructuracio.descripcio), createCell(data.desenvolupament.activitats.estructuracio.temporitzacio)] }),
              new TableRow({ children: [createCell("Aplicació"), createCell(data.desenvolupament.activitats.aplicacio.descripcio), createCell(data.desenvolupament.activitats.aplicacio.temporitzacio)] }),
            ]
          })
        ]
      }]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Situacio_Aprenentatge_${data.identificacio.titol.replace(/\s+/g, '_')}.docx`);
    setIsExportingWord(false);
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
      <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 no-print">
        <div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Vista Prèvia del Document</h3>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Model de Graella Generalitat de Catalunya</p>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-50"
           >
             {isExporting ? 'Generant...' : (
               <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg> Exportar PDF</>
             )}
           </button>
           <button 
            onClick={handleDownloadDOCX}
            disabled={isExportingWord}
            className="px-6 py-3 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-200 flex items-center gap-2 disabled:opacity-50"
           >
             {isExportingWord ? 'Generant...' : (
               <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> Exportar Word</>
             )}
           </button>
        </div>
      </div>

      <div ref={pdfRef} className="p-8 md:p-12 space-y-10 print:p-0 bg-white">
        <div className="flex justify-between items-start border-b-2 border-slate-100 pb-8">
          <div className="space-y-1">
            <h4 className="text-sm font-black text-slate-800 uppercase leading-tight">Generalitat de Catalunya</h4>
            <h4 className="text-sm font-black text-slate-800 uppercase leading-tight">Departament d'Educació</h4>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Codi Centre: [CENTRE_ID]</p>
            <p className="text-xs font-bold text-slate-800 uppercase">Curs {new Date().getFullYear()}-{new Date().getFullYear()+1}</p>
          </div>
        </div>

        <section className="space-y-4">
          <div className="bg-slate-900 text-white px-4 py-2 inline-block rounded-lg text-[10px] font-black uppercase tracking-[0.2em]">1. Identificació</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-1 border border-slate-200 rounded-2xl overflow-hidden bg-slate-200">
            <div className="bg-slate-50 p-4 font-bold text-xs text-slate-500 uppercase tracking-wider">Títol de la SA</div>
            <div className="bg-white p-4 md:col-span-2 text-slate-800 font-bold">{data.identificacio.titol}</div>
            <div className="bg-slate-50 p-4 font-bold text-xs text-slate-500 uppercase tracking-wider">Etapa i Curs</div>
            <div className="bg-white p-4 text-slate-800">{data.identificacio.curs}</div>
            <div className="bg-slate-50 p-4 font-bold text-xs text-slate-500 uppercase tracking-wider">Àrea / Matèria</div>
            <div className="bg-white p-4 text-slate-800">{data.identificacio.area_materia_ambit}</div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="bg-slate-900 text-white px-4 py-2 inline-block rounded-lg text-[10px] font-black uppercase tracking-[0.2em]">2. Concreció Curricular</div>
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 text-left font-black text-slate-500 uppercase text-[10px] tracking-widest w-2/3">Competències Específiques</th>
                  <th className="p-4 text-left font-black text-slate-500 uppercase text-[10px] tracking-widest">Àrea / Matèria</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.concrecio_curricular.competencies_especifiques.map((ce, i) => (
                  <tr key={i}>
                    <td className="p-4 text-slate-700 leading-relaxed font-medium">{formatCE(ce.descripcio, i)}</td>
                    <td className="p-4 text-slate-500 font-bold text-xs">{ce.area_materia}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="bg-slate-900 text-white px-4 py-2 inline-block rounded-lg text-[10px] font-black uppercase tracking-[0.2em]">3. Objectius</div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <ul className="space-y-3">
                {data.concrecio_curricular.objectius.map((obj, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-700 leading-relaxed">
                    <span className="text-red-600 font-black">•</span>
                    {obj}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-slate-900 text-white px-4 py-2 inline-block rounded-lg text-[10px] font-black uppercase tracking-[0.2em]">4. Criteris d'Avaluació</div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
               <ul className="space-y-3">
                {data.concrecio_curricular.criteris_avaluacio.map((cr, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-700 leading-relaxed">
                    <span className="text-red-600 font-black">✓</span>
                    {cr}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="bg-slate-900 text-white px-4 py-2 inline-block rounded-lg text-[10px] font-black uppercase tracking-[0.2em]">5. Seqüència Didàctica</div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Cast act to ActivitatDetall to fix unknown property error */}
            {Object.entries(data.desenvolupament.activitats).map(([key, act]) => {
              const activity = act as ActivitatDetall;
              return (
                <div key={key} className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col h-full hover:shadow-lg transition-all">
                  <div className="flex justify-between items-start mb-3">
                     <h5 className="text-[10px] font-black text-red-600 uppercase tracking-widest">{key}</h5>
                     <span className="px-2 py-1 bg-slate-100 rounded text-[9px] font-bold text-slate-500">{activity.temporitzacio}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed flex-grow">{activity.descripcio}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
