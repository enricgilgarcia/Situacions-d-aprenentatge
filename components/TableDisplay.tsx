
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
    const element = pdfRef.current;
    const titolNet = data.identificacio.titol.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    // Configuració ultra-precisa per evitar espais en blanc i talls estranys
    const opt = {
      margin: [10, 5, 10, 5],
      filename: `SA_${titolNet || 'document'}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: "#ffffff",
        logging: false,
        letterRendering: true,
        windowWidth: 1200 // Fixem l'amplada de la finestra per a una captura consistent
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
      pagebreak: { mode: 'css', before: '.page-break-before' }
    };

    try {
      // @ts-ignore
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("Error generant el PDF:", error);
      alert("S'ha produït un error. Recomanem utilitzar la funció d'Imprimir del navegador i triar 'Guardar com a PDF'.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadDOCX = async () => {
    setIsExportingWord(true);

    const createCell = (text: string, isHeader = false, colSpan = 1) => new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text: text || "", bold: isHeader, size: 20 })],
        spacing: { before: 100, after: 100 }
      })],
      shading: isHeader ? { fill: "F1F5F9", type: ShadingType.CLEAR } : undefined,
      columnSpan: colSpan,
      margins: { top: 120, bottom: 120, left: 120, right: 120 },
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
            text: "SITUACIÓ D'APRENENTATGE (LOMLOE)",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [createCell("Títol", true), createCell(data.identificacio.titol)] }),
              new TableRow({ children: [createCell("Curs", true), createCell(data.identificacio.curs)] }),
              new TableRow({ children: [createCell("Àrea / Matèria", true), createCell(data.identificacio.area_materia_ambit)] }),
            ],
          }),
          new Paragraph({ text: "DESCRIPCIÓ I CONTEXT", bold: true, spacing: { before: 400, after: 100 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [new TableRow({ children: [createCell(data.descripcio.context_repte)] })],
          }),
          new Paragraph({ text: "CONCRECIÓ CURRICULAR", bold: true, spacing: { before: 400, after: 100 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [createCell("Competències i Criteris", true), createCell("Continguts/Sabers", true)] }),
              new TableRow({ children: [
                createCell("Criteris d'avaluació:\n" + data.concrecio_curricular.criteris_avaluacio.join("\n")),
                createCell(data.concrecio_curricular.sabers.map(s => `• ${s.saber}`).join("\n"))
              ]}),
            ],
          }),
          new Paragraph({ text: "SEQÜÈNCIA DIDÀCTICA", bold: true, spacing: { before: 400, after: 100 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [createCell("Fase", true), createCell("Activitats", true)] }),
              new TableRow({ children: [createCell("Inicial", true), createCell(data.desenvolupament.activitats.inicials)] }),
              new TableRow({ children: [createCell("Desenvolupament", true), createCell(data.desenvolupament.activitats.desenvolupament)] }),
              new TableRow({ children: [createCell("Estructuració", true), createCell(data.desenvolupament.activitats.estructuracio)] }),
              new TableRow({ children: [createCell("Aplicació", true), createCell(data.desenvolupament.activitats.aplicacio)] }),
            ],
          }),
        ],
      }],
    });

    try {
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `SA_${data.identificacio.titol.replace(/\s+/g, '_') || 'document'}.docx`);
    } catch (error) {
      console.error("Error Word:", error);
      alert("Error en generar Word.");
    } finally {
      setIsExportingWord(false);
    }
  };

  return (
    <div className="bg-slate-100 p-0 md:p-8 print:p-0 min-h-screen">
      <style>{`
        .pdf-page { 
          background: white; 
          box-shadow: 0 0 20px rgba(0,0,0,0.1); 
          padding: 0; 
          margin: 0 auto;
          width: 297mm;
          min-height: 210mm;
          position: relative;
        }
        .grid-container { display: grid; grid-template-columns: 1fr; border: 2px solid #1e293b; }
        .grid-row { display: flex; border-bottom: 1px solid #1e293b; }
        .grid-label { width: 220px; background: #f8fafc; padding: 12px; font-weight: 800; border-right: 1px solid #1e293b; font-size: 11px; text-transform: uppercase; flex-shrink: 0; }
        .grid-content { padding: 12px; font-size: 13px; line-height: 1.5; flex-grow: 1; }
        .header-title { background: #1e293b; color: white; padding: 15px; text-align: center; font-weight: 800; font-size: 18px; text-transform: uppercase; letter-spacing: 1px; }
        .section-header { background: #e2e8f0; padding: 8px 12px; font-weight: 800; font-size: 12px; border-bottom: 2px solid #1e293b; border-top: 2px solid #1e293b; text-transform: uppercase; }
        .list-item { margin-bottom: 6px; display: flex; gap: 8px; }
        .list-num { font-weight: 800; color: #dc2626; min-width: 24px; font-size: 12px; }
        
        @media print {
          body { background: white; }
          .pdf-page { box-shadow: none; border: none; margin: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>
      
      <div 
        ref={pdfRef} 
        className="pdf-page"
      >
        <div className="header-title">Situació d’aprenentatge (Decrets 175/2022 i 171/2022)</div>
        
        <div className="grid-container">
          {/* Identificació */}
          <div className="grid-row">
            <div className="grid-label">Títol de la SA</div>
            <div className="grid-content font-bold">{data.identificacio.titol}</div>
          </div>
          <div className="grid-row">
            <div className="grid-label">Curs i Nivell</div>
            <div className="grid-content">{data.identificacio.curs}</div>
          </div>
          <div className="grid-row">
            <div className="grid-label">Àrea / Matèria / Àmbit</div>
            <div className="grid-content">{data.identificacio.area_materia_ambit}</div>
          </div>

          <div className="section-header">1. Descripció, Context i Repte</div>
          <div className="p-4 text-sm italic border-b border-slate-800 bg-slate-50">
            {data.descripcio.context_repte}
          </div>

          <div className="section-header">2. Concreció Curricular</div>
          <div className="flex border-b border-slate-800 min-h-[200px]">
            <div className="w-1/2 border-r border-slate-800 p-4">
              <h3 className="text-[10px] font-black uppercase mb-3 text-slate-400">Objectius d'Aprenentatge i Criteris</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold underline mb-2">Objectius:</h4>
                  {data.concrecio_curricular.objectius.map((o, i) => (
                    <div key={i} className="list-item">
                      <span className="list-num">{i + 1}.</span>
                      <span className="text-xs">{o}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <h4 className="text-xs font-bold underline mb-2">Criteris d'avaluació (Normativa):</h4>
                  {data.concrecio_curricular.criteris_avaluacio.map((cr, i) => (
                    <div key={i} className="list-item">
                      <span className="list-num">{cr.match(/^\d+\.?\d*/) ? "" : `${i+1}. `}</span>
                      <span className="text-xs font-semibold text-slate-800">{cr}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="w-1/2 p-4 bg-slate-50">
              <h3 className="text-[10px] font-black uppercase mb-3 text-slate-400">Sabers i Continguts Associats</h3>
              <div className="space-y-2">
                {data.concrecio_curricular.sabers.map((s, i) => (
                  <div key={i} className="flex gap-2 items-start border-b border-slate-200 pb-2 last:border-0">
                    <span className="text-red-600 font-bold">•</span>
                    <div>
                      <div className="text-xs font-bold">{s.saber}</div>
                      <div className="text-[10px] text-slate-500">{s.area_materia}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="section-header">3. Seqüència Didàctica (Activitats)</div>
          <div className="grid grid-cols-4 border-b border-slate-800 bg-white">
            <div className="p-3 border-r border-slate-800">
              <div className="text-[9px] font-bold text-red-600 mb-1">FASE INICIAL</div>
              <p className="text-[11px] leading-tight">{data.desenvolupament.activitats.inicials}</p>
            </div>
            <div className="p-3 border-r border-slate-800 bg-slate-50">
              <div className="text-[9px] font-bold text-red-600 mb-1">FASE DESENVOLUPAMENT</div>
              <p className="text-[11px] leading-tight">{data.desenvolupament.activitats.desenvolupament}</p>
            </div>
            <div className="p-3 border-r border-slate-800">
              <div className="text-[9px] font-bold text-red-600 mb-1">FASE ESTRUCTURACIÓ</div>
              <p className="text-[11px] leading-tight">{data.desenvolupament.activitats.estructuracio}</p>
            </div>
            <div className="p-3 bg-slate-50">
              <div className="text-[9px] font-bold text-red-600 mb-1">FASE APLICACIÓ</div>
              <p className="text-[11px] leading-tight">{data.desenvolupament.activitats.aplicacio}</p>
            </div>
          </div>

          <div className="section-header">4. Atenció a la Diversitat (DUA) i Vectors</div>
          <div className="flex bg-slate-50 p-4 gap-8">
            <div className="flex-1">
              <h4 className="text-[10px] font-bold uppercase mb-1 text-slate-500">Mesures Universals</h4>
              <p className="text-xs">{data.vectors_suports.suports_universals}</p>
            </div>
            <div className="flex-1">
              <h4 className="text-[10px] font-bold uppercase mb-1 text-slate-500">Vectors del Currículum</h4>
              <p className="text-xs italic">{data.vectors_suports.vectors_descripcio}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[297mm] mx-auto mt-8 mb-20 flex flex-wrap justify-center gap-4 no-print px-4">
        <button 
          onClick={handleDownloadPDF} 
          disabled={isExporting}
          className={`flex items-center gap-3 bg-red-600 text-white px-10 py-4 rounded-2xl font-black shadow-2xl transition-all transform active:scale-95 ${isExporting ? 'opacity-50' : 'hover:bg-red-700 hover:-translate-y-1'}`}
        >
          {isExporting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
          )}
          {isExporting ? "GENERANT..." : "DESCARREGAR PDF"}
        </button>
        
        <button 
          onClick={handleDownloadDOCX} 
          disabled={isExportingWord}
          className={`flex items-center gap-3 bg-blue-700 text-white px-10 py-4 rounded-2xl font-black shadow-2xl transition-all transform active:scale-95 ${isExportingWord ? 'opacity-50' : 'hover:bg-blue-800 hover:-translate-y-1'}`}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/></svg>
          {isExportingWord ? "GENERANT..." : "EXPORTAR A WORD"}
        </button>

        <button 
          onClick={() => window.print()} 
          className="flex items-center gap-3 bg-white text-slate-800 border-2 border-slate-200 px-10 py-4 rounded-2xl font-black shadow-lg hover:bg-slate-50 transition-all transform hover:-translate-y-1 active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          IMPRIMIR
        </button>
      </div>
    </div>
  );
};
