
import React, { useRef, useState } from 'react';
import { SituacioAprenentatge } from '../types';

interface TableDisplayProps {
  data: SituacioAprenentatge;
  onEdit: (data: SituacioAprenentatge) => void;
}

// Fixed: Added onEdit to the destructured props to resolve the "Cannot find name 'onEdit'" error.
export const TableDisplay: React.FC<TableDisplayProps> = ({ data, onEdit }) => {
  const pdfRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadPDF = async () => {
    if (!pdfRef.current) return;
    setIsExporting(true);
    const element = pdfRef.current;
    const titolNet = data.identificacio.titol.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    const opt = {
      margin: [5, 5, 5, 5],
      filename: `Situacio_Aprenentatge_${titolNet}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
      pagebreak: { mode: 'css', after: '.official-page' }
    };

    try {
      // @ts-ignore
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("Error PDF:", error);
      alert("Error al generar el PDF. Prova amb la funció d'imprimir.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-slate-200 p-0 md:p-8 print:p-0 min-h-screen">
      <style>{`
        .official-page { 
          background: white; 
          width: 297mm; 
          min-height: 210mm; 
          padding: 15mm; 
          margin: 0 auto 20px auto; 
          box-shadow: 0 4px 20px rgba(0,0,0,0.1); 
          position: relative;
          color: black;
          font-family: Arial, Helvetica, sans-serif;
        }
        .official-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .official-table td { border: 1.5px solid black; padding: 10px; vertical-align: top; font-size: 13px; }
        .official-table .label { width: 250px; font-weight: bold; background: #fcfcfc; }
        .official-header-title { font-size: 56px; font-weight: bold; margin-top: 100px; text-align: right; }
        .official-section-title { font-weight: bold; font-size: 14px; margin-bottom: 8px; text-transform: uppercase; }
        .official-note { font-size: 10px; line-height: 1.2; margin-top: 20px; color: #333; }
        .official-footer { position: absolute; bottom: 15mm; right: 15mm; text-align: right; font-size: 10px; }
        .flex-table { display: flex; width: 100%; border: 1.5px solid black; }
        .flex-col-table { flex: 1; padding: 10px; border-right: 1.5px solid black; }
        .flex-col-table:last-child { border-right: none; }
        .section-spacer { margin-bottom: 30px; }
        
        @media print {
          .official-page { box-shadow: none; margin: 0; width: 100%; min-height: 100vh; page-break-after: always; }
          .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>
      
      <div ref={pdfRef}>
        {/* PÀGINA 1: PORTADA */}
        <div className="official-page">
          <div className="flex justify-between items-start">
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 bg-red-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">GC</span>
              </div>
              <div>
                <div className="font-bold text-sm">Generalitat de Catalunya</div>
                <div className="font-bold text-sm">Departament d'Educació</div>
              </div>
            </div>
          </div>
          
          <div className="official-header-title">Situació d’aprenentatge<sup className="text-sm">1</sup></div>
          
          <div className="mt-20">
            <table className="official-table">
              <tbody>
                <tr>
                  <td className="label">Títol</td>
                  <td>{data.identificacio.titol}</td>
                </tr>
                <tr>
                  <td className="label">Curs (Nivell educatiu)</td>
                  <td>{data.identificacio.curs}</td>
                </tr>
                <tr>
                  <td className="label">Àrea / Matèria<sup className="text-[10px]">2</sup> / Àmbit<sup className="text-[10px]">3</sup></td>
                  <td>{data.identificacio.area_materia_ambit}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="official-note border-t border-black pt-2">
            <p><sup>1</sup> Són els escenaris que l’alumnat es troba a la vida real... [Model oficial]</p>
            <p><sup>2</sup> A l’educació primària fem referència a les àrees...</p>
            <p><sup>3</sup> Agrupació d’àrees o matèries...</p>
          </div>
          <div className="official-footer">Pàgina 1/5</div>
        </div>

        {/* PÀGINA 2: DESCRIPCIÓ I COMPETÈNCIES */}
        <div className="official-page">
          <div className="section-spacer">
            <div className="official-section-title">DESCRIPCIÓ (Context<sup>4</sup> + Repte<sup>5</sup>)</div>
            <div className="p-4 border-1.5 border-black min-h-[150px] text-sm">
              <p className="italic text-slate-500 mb-2">Per què aquesta situació d’aprenentatge? Està relacionada amb alguna altra? Quin és el context? Quin repte planteja?</p>
              {data.descripcio.context_repte}
            </div>
          </div>

          <div className="section-spacer">
            <div className="official-section-title">COMPETÈNCIES ESPECÍFIQUES</div>
            <p className="text-[11px] mb-2">Amb la realització d’aquesta situació d’aprenentatge s’afavoreix l’assoliment de les competències específiques següents:</p>
            <table className="official-table">
              <thead>
                <tr className="bg-slate-50 font-bold">
                  <td>Competències específiques</td>
                  <td className="w-1/3">Àrea o matèria</td>
                </tr>
              </thead>
              <tbody>
                {data.concrecio_curricular.competencies_especifiques.map((c, i) => (
                  <tr key={i}>
                    <td>{c.descripcio}</td>
                    <td>{c.area_materia}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="section-spacer">
            <div className="official-section-title">TRACTAMENT DE LES COMPETÈNCIES TRANSVERSALS<sup>6</sup></div>
            <div className="p-4 border-1.5 border-black min-h-[80px] text-sm">
              {data.descripcio.competencies_transversals}
            </div>
          </div>

          <div className="official-footer">Pàgina 2/5</div>
        </div>

        {/* PÀGINA 3: OBJECTIUS, CRITERIS I SABERS */}
        <div className="official-page">
          <div className="flex-table mb-8">
            <div className="flex-col-table">
              <div className="text-center font-bold text-xs uppercase mb-1">OBJECTIUS D'APRENENTATGE<sup>7</sup></div>
              <div className="text-center text-[10px] mb-2 italic">Què volem que aprengui l’alumnat i per a què? CAPACITAT + SABER + FINALITAT</div>
              <div className="space-y-2">
                {data.concrecio_curricular.objectius.map((o, i) => (
                  <div key={i} className="flex gap-2 text-xs">
                    <span className="font-bold">{i+1}</span>
                    <span>{o}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-col-table">
              <div className="text-center font-bold text-xs uppercase mb-1">CRITERIS D'AVALUACIÓ<sup>8</sup></div>
              <div className="text-center text-[10px] mb-2 italic">Com sabem que ho han après? ACCIÓ + SABER + CONTEXT</div>
              <div className="space-y-2">
                {data.concrecio_curricular.criteris_avaluacio.map((cr, i) => (
                  <div key={i} className="flex gap-2 text-xs">
                    <span className="font-bold">{cr.includes('.') ? "" : i+1}</span>
                    <span>{cr}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="section-spacer">
            <div className="official-section-title">SABERS</div>
            <p className="text-[11px] mb-2">Amb la realització d’aquesta situació d’aprenentatge es tractaran els sabers següents:</p>
            <table className="official-table">
              <thead>
                <tr className="bg-slate-50 font-bold">
                  <td className="w-12 text-center">#</td>
                  <td>Saber</td>
                  <td className="w-1/3">Àrea o matèria</td>
                </tr>
              </thead>
              <tbody>
                {data.concrecio_curricular.sabers.map((s, i) => (
                  <tr key={i}>
                    <td className="text-center">{i+1}</td>
                    <td>{s.saber}</td>
                    <td>{s.area_materia}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="official-footer">Pàgina 3/5</div>
        </div>

        {/* PÀGINA 4: DESENVOLUPAMENT I ACTIVITATS */}
        <div className="official-page">
          <div className="section-spacer">
            <div className="official-section-title">DESENVOLUPAMENT DE LA SITUACIÓ D’APRENENTATGE</div>
            <div className="p-4 border-1.5 border-black min-h-[120px] text-sm">
              <p className="italic text-slate-500 mb-2">Quines són les principals estratègies metodològiques? Quins tipus d’agrupament? Materials i recursos?</p>
              {data.desenvolupament.estrategies_metodologiques}
            </div>
          </div>

          <div className="section-spacer">
            <div className="official-section-title">ACTIVITATS D’APRENENTATGE I D’AVALUACIÓ</div>
            <table className="official-table">
              <thead>
                <tr className="bg-slate-50 font-bold">
                  <td className="w-1/4">Fase</td>
                  <td>Descripció de l’activitat d’aprenentatge i d’avaluació</td>
                  <td className="w-1/6">Temporització</td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-bold">Activitats inicials<br/><span className="text-[10px] font-normal italic">Què en sabem?</span></td>
                  <td>{data.desenvolupament.activitats.inicials.descripcio}</td>
                  <td>{data.desenvolupament.activitats.inicials.temporitzacio}</td>
                </tr>
                <tr>
                  <td className="font-bold">Activitats de desenvolupament<br/><span className="text-[10px] font-normal italic">Aprenem nous sabers</span></td>
                  <td>{data.desenvolupament.activitats.desenvolupament.descripcio}</td>
                  <td>{data.desenvolupament.activitats.desenvolupament.temporitzacio}</td>
                </tr>
                <tr>
                  <td className="font-bold">Activitats d’estructuració<br/><span className="text-[10px] font-normal italic">Què hem après?</span></td>
                  <td>{data.desenvolupament.activitats.estructuracio.descripcio}</td>
                  <td>{data.desenvolupament.activitats.estructuracio.temporitzacio}</td>
                </tr>
                <tr>
                  <td className="font-bold">Activitats d’aplicació<br/><span className="text-[10px] font-normal italic">Apliquem el que hem après</span></td>
                  <td>{data.desenvolupament.activitats.aplicacio.descripcio}</td>
                  <td>{data.desenvolupament.activitats.aplicacio.temporitzacio}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="official-footer">Pàgina 4/5</div>
        </div>

        {/* PÀGINA 5: VECTORS I SUPORTS */}
        <div className="official-page">
          <div className="section-spacer">
            <div className="official-section-title">BREU DESCRIPCIÓ DE COM S’ABORDEN ELS VECTORS<sup>9</sup></div>
            <div className="p-4 border-1.5 border-black min-h-[100px] text-sm italic">
              {data.vectors_suports.vectors_descripcio}
            </div>
          </div>

          <div className="section-spacer">
            <div className="official-section-title">MESURES I SUPORTS UNIVERSALS<sup>10</sup></div>
            <div className="p-4 border-1.5 border-black min-h-[100px] text-sm">
              {data.vectors_suports.suports_universals}
            </div>
          </div>

          <div className="section-spacer">
            <div className="official-section-title">MESURES I SUPORTS ADDICIONALS<sup>11</sup> O INTENSIUS<sup>12</sup></div>
            <p className="text-[11px] mb-2">Quines mesures o suports addicionals o intensius es proposen per a cadascun dels alumnes següents:</p>
            <table className="official-table">
              <thead>
                <tr className="bg-slate-50 font-bold">
                  <td className="w-1/3">Alumne</td>
                  <td>Mesura i suport addicional o intensiu</td>
                </tr>
              </thead>
              <tbody>
                {data.vectors_suports.suports_addicionals.length > 0 ? (
                  data.vectors_suports.suports_addicionals.map((s, i) => (
                    <tr key={i}>
                      <td>{s.alumne}</td>
                      <td>{s.mesura}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="h-12"></td>
                    <td></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="official-footer">Pàgina 5/5</div>
        </div>
      </div>

      {/* BOTONS D'ACCIO */}
      <div className="max-w-[297mm] mx-auto mt-8 mb-20 flex flex-wrap justify-center gap-4 no-print px-4">
        <button 
          onClick={handleDownloadPDF} 
          disabled={isExporting}
          className={`flex items-center gap-3 bg-slate-900 text-white px-10 py-5 rounded-full font-black shadow-2xl transition-all transform active:scale-95 ${isExporting ? 'opacity-50' : 'hover:bg-black hover:-translate-y-1'}`}
        >
          {isExporting ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
          )}
          {isExporting ? "GENERANT PDF..." : "BAIXAR MODEL OFICIAL (PDF)"}
        </button>
        
        <button 
          onClick={() => window.print()} 
          className="flex items-center gap-3 bg-white text-slate-800 border-2 border-slate-300 px-10 py-5 rounded-full font-black shadow-lg hover:bg-slate-50 transition-all transform hover:-translate-y-1 active:scale-95"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          IMPRIMIR / GUARDAR
        </button>

        <button 
          onClick={() => onEdit(data)} 
          className="flex items-center gap-3 bg-slate-100 text-slate-600 border border-slate-200 px-10 py-5 rounded-full font-bold hover:bg-white transition-all"
        >
          TORNA A L'EDITOR
        </button>
      </div>
    </div>
  );
};
