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
  HeadingLevel,
  ShadingType,
  PageOrientation
} from 'docx';
import saveAs from 'file-saver';

interface TableDisplayProps {
  data: SituacioAprenentatge;
  onEdit: (data: SituacioAprenentatge) => void;
}

export const TableDisplay: React.FC<TableDisplayProps> = ({ data }) => {
  const pdfRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);

  const handleDownloadPDF = async () => {
    if (!pdfRef.current) return;
    
    setIsExporting(true);
    // Assegurem que l'usuari està al capdamunt per a una captura neta
    window.scrollTo(0, 0);
    
    const element = pdfRef.current;
    const titolNet = data.identificacio.titol.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    // Configuració optimitzada per a A4 horitzontal sense talls
    const opt = {
      margin: 10,
      filename: `SA_${titolNet || 'document'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: "#ffffff",
        logging: false,
        scrollY: 0,
        scrollX: 0,
        width: element.offsetWidth, // Captura l'amplada real de l'element
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
      // @ts-ignore
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("Error generant el PDF:", error);
      alert("S'ha produït un error en exportar el PDF. Recomanem utilitzar 'Imprimir -> Guardar com a PDF' del navegador.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadDOCX = async () => {
    setIsExportingWord(true);

    const createCell = (text: string, isHeader = false, colSpan = 1) => new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text: text || "", bold: isHeader, size: 20 })],
      })],
      shading: isHeader ? { fill: "F1F5F9", type: ShadingType.CLEAR } : undefined,
      columnSpan: colSpan,
      margins: { top: 100, bottom: 100, left: 100, right: 100 },
    });

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            size: { orientation: PageOrientation.LANDSCAPE },
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        children: [
          new Paragraph({
            text: "Situació d’aprenentatge",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [createCell("Títol", true), createCell(data.identificacio.titol)] }),
              new TableRow({ children: [createCell("Curs (Nivell educatiu)", true), createCell(data.identificacio.curs)] }),
              new TableRow({ children: [createCell("Àrea / Matèria / Àmbit", true), createCell(data.identificacio.area_materia_ambit)] }),
            ],
          }),
          new Paragraph({ text: "DESCRIPCIÓ (Context + Repte)", bold: true, spacing: { before: 400, after: 100 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [new TableRow({ children: [createCell(data.descripcio.context_repte)] })],
          }),
          new Paragraph({ text: "COMPETÈNCIES ESPECÍFIQUES", bold: true, spacing: { before: 400, after: 100 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [createCell("Competència específica", true), createCell("Àrea/Matèria", true)] }),
              ...data.concrecio_curricular.competencies_especifiques.map(c => new TableRow({
                children: [createCell(c.descripcio), createCell(c.area_materia)]
              }))
            ],
          }),
          new Paragraph({ text: "OBJECTIUS I CRITERIS", bold: true, spacing: { before: 400, after: 100 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [createCell("Objectius", true), createCell("Criteris d'avaluació", true)] }),
              new TableRow({ children: [
                createCell(data.concrecio_curricular.objectius.join("\n")),
                createCell(data.concrecio_curricular.criteris_avaluacio.join("\n"))
              ]}),
            ],
          }),
          new Paragraph({ text: "SABERS", bold: true, spacing: { before: 400, after: 100 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [createCell("Saber", true), createCell("Àrea/Matèria", true)] }),
              ...data.concrecio_curricular.sabers.map(s => new TableRow({
                children: [createCell(s.saber), createCell(s.area_materia)]
              }))
            ],
          }),
          new Paragraph({ text: "DESENVOLUPAMENT", bold: true, spacing: { before: 400, after: 100 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [createCell("Estratègies", true), createCell(data.desenvolupament.estrategies_materials)] }),
              new TableRow({ children: [createCell("Activitat Inicial", true), createCell(data.desenvolupament.activitats.inicials)] }),
              new TableRow({ children: [createCell("Activitat Desenvolupament", true), createCell(data.desenvolupament.activitats.desenvolupament)] }),
              new TableRow({ children: [createCell("Activitat Estructuració", true), createCell(data.desenvolupament.activitats.estructuracio)] }),
              new TableRow({ children: [createCell("Activitat Aplicació", true), createCell(data.desenvolupament.activitats.aplicacio)] }),
            ],
          }),
        ],
      }],
    });

    try {
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `SA_${data.identificacio.titol.replace(/\s+/g, '_') || 'document'}.docx`);
    } catch (error) {
      console.error("Error generant el Word:", error);
      alert("No s'ha pogut generar el fitxer Word.");
    } finally {
      setIsExportingWord(false);
    }
  };

  return (
    <div className="bg-white p-0 md:p-4 print:p-0 overflow-visible">
      <style>{`
        .pdf-section { page-break-inside: avoid; break-inside: avoid; margin-bottom: 2px; }
        .pdf-table-row { page-break-inside: avoid; break-inside: avoid; }
        .break-words { word-break: break-word; overflow-wrap: break-word; }
        @media print {
            .pdf-content { border: none !important; box-shadow: none !important; width: 100% !important; }
        }
      `}</style>
      
      <div 
        ref={pdfRef} 
        className="pdf-content mx-auto border-2 border-slate-800 bg-white shadow-none overflow-hidden"
        style={{ width: '277mm', minHeight: 'auto' }}
      >
        {/* Capçalera del Document */}
        <div className="border-b-2 border-slate-800 p-8 flex flex-col items-center pdf-section">
          <h1 className="text-4xl font-bold text-center py-4 uppercase tracking-tight break-words">Situació d’aprenentatge</h1>
        </div>

        {/* 1. Dades d'identificació */}
        <table className="w-full border-collapse pdf-section table-fixed">
          <tbody>
            <tr className="border-b-2 border-slate-800 pdf-table-row">
              <td className="w-1/4 p-4 border-r-2 border-slate-800 font-bold bg-slate-50 text-sm">Títol</td>
              <td className="p-4 text-sm font-medium break-words">{data.identificacio.titol}</td>
            </tr>
            <tr className="border-b-2 border-slate-800 pdf-table-row">
              <td className="w-1/4 p-4 border-r-2 border-slate-800 font-bold bg-slate-50 text-sm">Curs (Nivell educatiu)</td>
              <td className="p-4 text-sm break-words">{data.identificacio.curs}</td>
            </tr>
            <tr className="border-b-4 border-slate-800 pdf-table-row">
              <td className="w-1/4 p-4 border-r-2 border-slate-800 font-bold bg-slate-50 text-sm">Àrea / Matèria / Àmbit</td>
              <td className="p-4 text-sm break-words">{data.identificacio.area_materia_ambit}</td>
            </tr>
          </tbody>
        </table>

        {/* 2. Descripció */}
        <div className="p-6 bg-slate-100 border-b-2 border-slate-800 pdf-section">
          <h2 className="font-bold text-lg mb-1 uppercase">DESCRIPCIÓ (Context + Repte)</h2>
          <div className="bg-white border-2 border-slate-800 p-4 min-h-[80px] mb-6 text-sm leading-relaxed break-words">
            {data.descripcio.context_repte}
          </div>
          
          <h2 className="font-bold text-lg mb-1 uppercase">COMPETÈNCIES ESPECÍFIQUES</h2>
          <table className="w-full border-2 border-slate-800 bg-white table-fixed">
            <thead>
              <tr className="border-b-2 border-slate-800 bg-slate-50">
                <th className="p-3 border-r-2 border-slate-800 text-left text-xs uppercase font-bold w-3/4">Competències específiques</th>
                <th className="p-3 text-left w-1/4 text-xs uppercase font-bold">Àrea o matèria</th>
              </tr>
            </thead>
            <tbody>
              {data.concrecio_curricular.competencies_especifiques.map((c, i) => (
                <tr key={i} className="border-b border-slate-300 last:border-0 pdf-table-row">
                  <td className="p-3 border-r-2 border-slate-800 text-sm leading-relaxed break-words">{c.descripcio}</td>
                  <td className="p-3 text-sm break-words">{c.area_materia}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 3. Concreció Curricular */}
        <div className="grid grid-cols-2 border-b-4 border-slate-800 bg-white pdf-section">
          <div className="border-r-2 border-slate-800">
            <div className="p-3 bg-slate-50 border-b-2 border-slate-800 font-bold text-center text-md uppercase">OBJECTIUS D’APRENENTATGE</div>
            <div className="p-6 space-y-4">
              {data.concrecio_curricular.objectius.map((o, i) => (
                <div key={i} className="flex gap-3">
                  <span className="font-bold text-red-600 text-sm shrink-0">{i+1}</span>
                  <p className="text-sm leading-relaxed break-words">{o}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="p-3 bg-slate-50 border-b-2 border-slate-800 font-bold text-center text-md uppercase">CRITERIS D’AVALUACIÓ</div>
            <div className="p-6 space-y-4">
              {data.concrecio_curricular.criteris_avaluacio.map((cr, i) => (
                <div key={i} className="flex gap-3">
                  <span className="font-bold text-red-600 text-sm shrink-0">{i+1}</span>
                  <p className="text-sm leading-relaxed break-words">{cr}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sabers */}
        <div className="p-6 bg-slate-100 border-b-4 border-slate-800 pdf-section">
          <h2 className="font-bold text-lg mb-1 uppercase">SABERS</h2>
          <table className="w-full border-2 border-slate-800 bg-white table-fixed">
            <thead>
              <tr className="border-b-2 border-slate-800 bg-slate-50">
                <th className="p-3 border-r-2 border-slate-800 text-left text-xs uppercase font-bold w-3/4">Saber</th>
                <th className="p-3 text-left w-1/4 text-xs uppercase font-bold">Àrea o matèria</th>
              </tr>
            </thead>
            <tbody>
              {data.concrecio_curricular.sabers.map((s, i) => (
                <tr key={i} className="border-b border-slate-300 last:border-0 pdf-table-row">
                  <td className="p-3 border-r-2 border-slate-800 text-sm leading-relaxed break-words">{s.saber}</td>
                  <td className="p-3 text-sm break-words">{s.area_materia}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 4. Desenvolupament */}
        <div className="p-6 border-b-4 border-slate-800 bg-white pdf-section">
          <h2 className="font-bold text-lg mb-1 uppercase">DESENVOLUPAMENT DE LA SITUACIÓ D’APRENENTATGE</h2>
          <div className="bg-slate-50 border-2 border-slate-800 p-4 min-h-[60px] mb-8 text-sm leading-relaxed break-words">
            {data.desenvolupament.estrategies_materials}
          </div>

          <h2 className="font-bold text-lg mb-1 uppercase text-center bg-slate-800 text-white py-2 mb-4">ACTIVITATS D’APRENENTATGE I D’AVALUACIÓ</h2>
          <table className="w-full border-2 border-slate-800 table-fixed">
            <thead>
              <tr className="bg-slate-200 border-b-2 border-slate-800">
                <th className="p-3 border-r-2 border-slate-800 text-left w-1/5 text-xs uppercase font-bold">Fase</th>
                <th className="p-3 text-left text-xs uppercase font-bold">Descripció de l’activitat</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b-2 border-slate-300 pdf-table-row">
                <td className="p-4 border-r-2 border-slate-800 font-bold bg-slate-50 text-xs">Inicials</td>
                <td className="p-4 text-sm leading-relaxed break-words">{data.desenvolupament.activitats.inicials}</td>
              </tr>
              <tr className="border-b-2 border-slate-300 pdf-table-row">
                <td className="p-4 border-r-2 border-slate-800 font-bold bg-slate-50 text-xs">Desenvolupament</td>
                <td className="p-4 text-sm leading-relaxed break-words">{data.desenvolupament.activitats.desenvolupament}</td>
              </tr>
              <tr className="border-b-2 border-slate-300 pdf-table-row">
                <td className="p-4 border-r-2 border-slate-800 font-bold bg-slate-50 text-xs">Estructuració</td>
                <td className="p-4 text-sm leading-relaxed break-words">{data.desenvolupament.activitats.estructuracio}</td>
              </tr>
              <tr className="pdf-table-row">
                <td className="p-4 border-r-2 border-slate-800 font-bold bg-slate-50 text-xs">Aplicació</td>
                <td className="p-4 text-sm leading-relaxed break-words">{data.desenvolupament.activitats.aplicacio}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 5. Vectors i Suports */}
        <div className="p-6 bg-slate-50 pdf-section">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h2 className="font-bold text-md mb-2 uppercase">VECTORS</h2>
              <div className="bg-white border-2 border-slate-800 p-4 min-h-[60px] text-sm leading-relaxed break-words">
                {data.vectors_suports.vectors_descripcio}
              </div>
            </div>
            <div>
              <h2 className="font-bold text-md mb-2 uppercase">MESURES I SUPORTS</h2>
              <div className="bg-white border-2 border-slate-800 p-4 min-h-[60px] text-sm leading-relaxed break-words">
                {data.vectors_suports.suports_universals}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[297mm] mx-auto mt-8 mb-20 flex flex-col sm:flex-row justify-center gap-4 no-print px-4">
        <button 
          onClick={handleDownloadPDF} 
          disabled={isExporting || isExportingWord}
          className={`bg-red-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg transition-all ${isExporting ? 'opacity-70 cursor-wait' : 'hover:bg-red-700'}`}
        >
          {isExporting ? "Generant PDF..." : "Exportar PDF"}
        </button>
        
        <button 
          onClick={handleDownloadDOCX} 
          disabled={isExporting || isExportingWord}
          className={`bg-blue-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg transition-all ${isExportingWord ? 'opacity-70 cursor-wait' : 'hover:bg-blue-700'}`}
        >
          {isExportingWord ? "Generant Word..." : "Exportar Word (.docx)"}
        </button>

        <button 
          onClick={() => window.print()} 
          className="bg-white text-slate-700 border border-slate-300 px-8 py-3 rounded-lg font-bold shadow-md hover:bg-slate-50 transition-all"
        >
          Imprimir / Guardar manual
        </button>
      </div>
    </div>
  );
};
