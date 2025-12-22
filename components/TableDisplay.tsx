
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
  BorderStyle,
  AlignmentType,
  PageOrientation,
  Header,
  Footer,
  HeightRule
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

  const handleDownloadPDF = async () => {
    if (!pdfRef.current) return;
    setIsExporting(true);
    const element = pdfRef.current;
    const titolNet = data.identificacio.titol.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    // Configuració optimitzada per evitar pàgines en blanc i talls
    const opt = {
      margin: 0,
      filename: `SA_${titolNet}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        letterRendering: true,
        windowWidth: 1122 // Amplada A4 landscape en píxels aproximadament
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
      pagebreak: { mode: ['css', 'legacy'] }
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
    
    const createCell = (text: string, bold = false, width = 100) => new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text, bold, size: 22, font: "Arial" })],
        spacing: { before: 120, after: 120 }
      })],
      width: { size: width, type: WidthType.PERCENTAGE },
      margins: { left: 100, right: 100 }
    });

    const doc = new Document({
      sections: [{
        properties: {
          page: { size: { orientation: PageOrientation.LANDSCAPE } },
        },
        children: [
          new Paragraph({ text: "SITUACIÓ D'APRENENTATGE", heading: "Heading1", alignment: AlignmentType.CENTER }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [createCell("Títol", true, 30), createCell(data.identificacio.titol)] }),
              new TableRow({ children: [createCell("Curs", true, 30), createCell(data.identificacio.curs)] }),
              new TableRow({ children: [createCell("Àrea", true, 30), createCell(data.identificacio.area_materia_ambit)] }),
            ]
          }),
          // Add more sections as needed for the full 5 pages...
          new Paragraph({ text: "\n(Aquest document s'ha generat automàticament i és compatible amb Google Docs)", size: 16, italic: true })
        ]
      }]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `SA_${data.identificacio.titol.replace(/\s+/g, '_')}.docx`);
    setIsExportingWord(false);
  };

  const handleExportGoogleDocs = () => {
    // Google Docs obre fitxers .docx perfectament conservant el format de taules.
    // Simplement redirigim a la descàrrega de Word ja que és el format d'intercanvi estàndard.
    handleDownloadDOCX();
    alert("S'està baixant un fitxer .docx. Pots pujar-lo directament a Google Drive i obrir-lo com a Google Doc.");
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
          margin-bottom: 10mm;
          box-shadow: 0 4px 30px rgba(0,0,0,0.15); 
          position: relative;
          color: black;
          font-family: 'Arial', sans-serif;
          box-sizing: border-box;
          overflow: hidden;
          page-break-after: always;
        }
        .official-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; table-layout: fixed; }
        .official-table td { border: 1.2px solid black; padding: 8px 12px; vertical-align: top; font-size: 13px; word-wrap: break-word; }
        .official-table .label { width: 220px; font-weight: bold; background: #fafafa; }
        .official-header { display: flex; align-items: center; gap: 15px; margin-bottom: 40px; }
        .gov-logo { width: 45px; height: 45px; flex-shrink: 0; }
        .official-title-big { font-size: 64px; font-weight: 900; text-align: right; margin-top: 60px; line-height: 1; letter-spacing: -2px; }
        .section-title { font-weight: bold; font-size: 14px; margin-bottom: 6px; text-transform: uppercase; margin-top: 15px; }
        .box-content { border: 1.2px solid black; padding: 12px; min-height: 100px; font-size: 13px; margin-bottom: 15px; }
        .footnote-area { position: absolute; bottom: 15mm; left: 15mm; right: 15mm; font-size: 9px; line-height: 1.3; border-top: 1px solid #ccc; pt-2; }
        .page-num { position: absolute; bottom: 10mm; right: 15mm; font-size: 11px; font-weight: bold; }
        
        @media print {
          .official-container { width: 100%; margin: 0; }
          .official-page { box-shadow: none; margin: 0; width: 297mm; height: 210mm; page-break-after: always; }
          .no-print { display: none !important; }
          body { background: white; margin: 0; }
        }
      `}</style>
      
      <div ref={pdfRef} className="official-container">
        {/* PÀGINA 1: PORTADA */}
        <div className="official-page">
          <div className="official-header">
             <svg className="gov-logo" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          
          <div className="mt-24">
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
                  <td className="label">Àrea / Matèria<sup className="text-[9px]">2</sup> / Àmbit<sup className="text-[9px]">3</sup></td>
                  <td>{data.identificacio.area_materia_ambit}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="footnote-area">
            <p><sup>1</sup> Són els escenaris que l’alumnat es troba a la vida real i que es poden utilitzar per desenvolupar aprenentatges. Plantegen un context concret...</p>
            <p><sup>2</sup> A l’educació primària fem referència a les àrees i a l’educació secundària obligatòria i el batxillerat a les matèries.</p>
            <p><sup>3</sup> Agrupació d’àrees o matèries que s’imparteixen de manera integrada.</p>
          </div>
          <div className="page-num">Pàgina 1/5</div>
        </div>

        {/* PÀGINA 2: DESCRIPCIÓ I COMPETÈNCIES */}
        <div className="official-page">
          <div className="section-title">DESCRIPCIÓ (Context<sup>4</sup> + Repte<sup>5</sup>)</div>
          <div className="text-[11px] italic mb-2">Per què aquesta situació d’aprenentatge? Està relacionada amb alguna altra? Quin és el context? Quin repte planteja?</div>
          <div className="box-content h-32">{data.descripcio.context_repte}</div>

          <div className="section-title">COMPETÈNCIES ESPECÍFIQUES</div>
          <div className="text-[11px] mb-2">Amb la realització d’aquesta situació d’aprenentatge s’afavoreix l’assoliment de les competències específiques següents:</div>
          <table className="official-table">
            <thead>
              <tr className="bg-gray-50">
                <td className="font-bold">Competències específiques</td>
                <td className="font-bold w-1/3 text-blue-700">Àrea o matèria</td>
              </tr>
            </thead>
            <tbody>
              {data.concrecio_curricular.competencies_especifiques.map((c, i) => (
                <tr key={i} style={{ height: '40px' }}>
                  <td>{c.descripcio}</td>
                  <td>{c.area_materia}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="section-title">TRACTAMENT DE LES COMPETÈNCIES TRANSVERSALS<sup>6</sup></div>
          <div className="box-content h-24">{data.descripcio.competencies_transversals}</div>

          <div className="footnote-area">
            <p><sup>4</sup> Conjunt de circumstàncies que envolten i expliquen un esdeveniment...</p>
            <p><sup>5</sup> Reptes: Tema d’interès plantejat per l’alumnat, observació d’un fenomen...</p>
            <p><sup>6</sup> Competència ciutadana, emprenedora, personal, social i d’aprendre a aprendre i competència digital.</p>
          </div>
          <div className="page-num">Pàgina 2/5</div>
        </div>

        {/* PÀGINA 3: OBJECTIUS, CRITERIS I SABERS */}
        <div className="official-page">
          <div className="flex gap-0 border-t border-l border-r border-black">
             <div className="flex-1 p-3 border-r border-black text-center">
                <div className="font-bold text-xs uppercase">OBJECTIUS D’APRENENTATGE<sup>7</sup></div>
                <div className="text-[9px] italic mb-3">Què volem que aprengui l’alumnat i per a què?<br/>CAPACITAT + SABER + FINALITAT</div>
             </div>
             <div className="flex-1 p-3 text-center">
                <div className="font-bold text-xs uppercase">CRITERIS D’AVALUACIÓ<sup>8</sup></div>
                <div className="text-[9px] italic mb-3">Com sabem que ho han après?<br/>ACCIÓ + SABER + CONTEXT</div>
             </div>
          </div>
          <table className="official-table mt-[-1px]">
             <tbody>
               <tr>
                 <td className="w-1/2 p-0">
                    <table className="w-full border-none">
                      <tbody>
                        {data.concrecio_curricular.objectius.map((o, i) => (
                          <tr key={i}><td className="border-0 border-b border-black last:border-0 h-12 flex gap-2"><span className="font-bold">{i+1}</span>{o}</td></tr>
                        ))}
                      </tbody>
                    </table>
                 </td>
                 <td className="w-1/2 p-0">
                    <table className="w-full border-none">
                      <tbody>
                        {data.concrecio_curricular.criteris_avaluacio.map((cr, i) => (
                          <tr key={i}><td className="border-0 border-b border-black last:border-0 h-10 flex gap-2"><span className="font-bold">{cr.includes('.') ? '' : i+1}</span>{cr}</td></tr>
                        ))}
                      </tbody>
                    </table>
                 </td>
               </tr>
             </tbody>
          </table>

          <div className="section-title mt-6">SABERS</div>
          <div className="text-[11px] mb-2">Amb la realització d’aquesta situació d’aprenentatge es tractaran els sabers següents:</div>
          <table className="official-table">
            <thead>
              <tr className="bg-gray-50">
                <td className="w-12 font-bold text-center">#</td>
                <td className="font-bold">Saber</td>
                <td className="font-bold w-1/3 text-blue-700">Àrea o matèria</td>
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

          <div className="footnote-area">
            <p><sup>7</sup> Les competències específiques estan formulades de forma general...</p>
            <p><sup>8</sup> Els criteris d'avaluació es poden desplegar en indicadors...</p>
          </div>
          <div className="page-num">Pàgina 3/5</div>
        </div>

        {/* PÀGINA 4: DESENVOLUPAMENT I ACTIVITATS */}
        <div className="official-page">
          <div className="section-title">DESENVOLUPAMENT DE LA SITUACIÓ D’APRENENTATGE</div>
          <div className="text-[11px] italic mb-2">Quines són les principals estratègies metodològiques? Quins tipus d’agrupament? Materials i recursos?</div>
          <div className="box-content h-24">{data.desenvolupament.estrategies_metodologiques}</div>

          <div className="section-title mt-4">ACTIVITATS D’APRENENTATGE I D’AVALUACIÓ</div>
          <table className="official-table">
            <thead>
              <tr className="bg-gray-100 font-bold">
                <td className="w-1/4">Fase</td>
                <td>Descripció de l’activitat d’aprenentatge i d’avaluació</td>
                <td className="w-1/6">Temporització</td>
              </tr>
            </thead>
            <tbody>
              <tr style={{ height: '80px' }}>
                <td className="font-bold">Activitats inicials<br/><span className="text-[10px] font-normal italic">Què en sabem?</span></td>
                <td>{data.desenvolupament.activitats.inicials.descripcio}</td>
                <td>{data.desenvolupament.activitats.inicials.temporitzacio}</td>
              </tr>
              <tr style={{ height: '100px' }}>
                <td className="font-bold">Activitats de desenvolupament<br/><span className="text-[10px] font-normal italic">Aprenem nous sabers</span></td>
                <td>{data.desenvolupament.activitats.desenvolupament.descripcio}</td>
                <td>{data.desenvolupament.activitats.desenvolupament.temporitzacio}</td>
              </tr>
              <tr style={{ height: '80px' }}>
                <td className="font-bold">Activitats d’estructuració<br/><span className="text-[10px] font-normal italic">Què hem après?</span></td>
                <td>{data.desenvolupament.activitats.estructuracio.descripcio}</td>
                <td>{data.desenvolupament.activitats.estructuracio.temporitzacio}</td>
              </tr>
              <tr style={{ height: '80px' }}>
                <td className="font-bold">Activitats d’aplicació<br/><span className="text-[10px] font-normal italic">Apliquem el que hem après</span></td>
                <td>{data.desenvolupament.activitats.aplicacio.descripcio}</td>
                <td>{data.desenvolupament.activitats.aplicacio.temporitzacio}</td>
              </tr>
            </tbody>
          </table>
          <div className="page-num">Pàgina 4/5</div>
        </div>

        {/* PÀGINA 5: VECTORS I SUPORTS */}
        <div className="official-page">
          <div className="section-title">BREU DESCRIPCIÓ DE COM S’ABORDEN ELS VECTORS<sup>9</sup></div>
          <div className="box-content h-24">{data.vectors_suports.vectors_descripcio}</div>

          <div className="section-title">MESURES I SUPORTS UNIVERSALS<sup>10</sup></div>
          <div className="box-content h-24">{data.vectors_suports.suports_universals}</div>

          <div className="section-title">MESURES I SUPORTS ADDICIONALS<sup>11</sup> O INTENSIUS<sup>12</sup></div>
          <div className="text-[11px] mb-2">Quines mesures o suports addicionals o intensius es proposen per a cadascun dels alumnes següents:</div>
          <table className="official-table">
            <thead>
              <tr className="bg-gray-50 font-bold">
                <td className="w-1/3">Alumne</td>
                <td>Mesura i suport addicional o intensiu</td>
              </tr>
            </thead>
            <tbody>
              {data.vectors_suports.suports_addicionals.length > 0 ? (
                data.vectors_suports.suports_addicionals.map((s, i) => (
                  <tr key={i} style={{ height: '40px' }}>
                    <td>{s.alumne}</td>
                    <td>{s.mesura}</td>
                  </tr>
                ))
              ) : (
                <tr style={{ height: '60px' }}><td></td><td></td></tr>
              )}
            </tbody>
          </table>

          <div className="footnote-area">
            <p><sup>9</sup> 1/ Aprenentatges competencials. 2/ Perspectiva de gènere. 3/ Universalitat del currículum...</p>
            <p><sup>10</sup> Les mesures i els suports universals són els que s’adrecen a tots l’alumnat...</p>
            <p><sup>11</sup> Les mesures i els suports addicionals s’adrecen a alguns alumnes...</p>
            <p><sup>12</sup> Les mesures i els suports intensius són específics per als alumnes que presenta NESE...</p>
          </div>
          <div className="page-num">Pàgina 5/5</div>
        </div>
      </div>

      {/* BOTONS D'ACCIO REFINATS */}
      <div className="max-w-[1200px] mx-auto mt-8 mb-20 flex flex-wrap justify-center gap-4 no-print px-4">
        <button 
          onClick={handleDownloadPDF} 
          disabled={isExporting}
          className={`flex items-center gap-3 bg-red-600 text-white px-8 py-4 rounded-xl font-bold shadow-xl transition-all transform active:scale-95 ${isExporting ? 'opacity-50' : 'hover:bg-red-700 hover:-translate-y-1'}`}
        >
          {isExporting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
          DESCARREGAR PDF
        </button>
        
        <button 
          onClick={handleDownloadDOCX} 
          disabled={isExportingWord}
          className={`flex items-center gap-3 bg-blue-700 text-white px-8 py-4 rounded-xl font-bold shadow-xl transition-all transform active:scale-95 ${isExportingWord ? 'opacity-50' : 'hover:bg-blue-800 hover:-translate-y-1'}`}
        >
          {isExportingWord ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/></svg>}
          WORD (.docx)
        </button>

        <button 
          onClick={handleExportGoogleDocs} 
          className="flex items-center gap-3 bg-white text-blue-600 border-2 border-blue-100 px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-blue-50 transition-all transform hover:-translate-y-1"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M14.5 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V7.5L14.5 2zM15 13H9v-2h6v2zm-2 4H9v-2h4v2zm0-8H9V7h4v2z"/></svg>
          GOOGLE DOCS
        </button>

        <button 
          onClick={() => window.print()} 
          className="flex items-center gap-3 bg-slate-800 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-black transition-all transform hover:-translate-y-1"
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
