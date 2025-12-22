import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { TableDisplay } from './components/TableDisplay';
import { SituacioAprenentatge } from './types';
import { extractLearningSituation } from './services/geminiService';

const LOADING_MESSAGES = [
  "Analitzant el currículum oficial...",
  "Alineant competències amb el decret...",
  "Dissenyant la seqüència didàctica...",
  "Redactant criteris d'avaluació...",
  "Incorporant mesures DUA i vectors...",
  "Polint el document final..."
];

const SUGGESTIONS = [
  "Unitat sobre l'antic Egipte per a 5è de Primària",
  "El cicle de l'aigua i sostenibilitat a 1r d'ESO",
  "Taller de robòtica i pensament computacional a Primària",
  "Hàbits saludables i l'aparell digestiu a 3r"
];

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [result, setResult] = useState<SituacioAprenentatge | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingMsgIdx(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 3500);
    } else {
      setLoadingMsgIdx(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setError(null);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (ext === 'pdf') {
        const pdfjsLib = (window as any).pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          fullText += content.items.map((item: any) => item.str).join(' ') + '\n';
        }
        setInputText(prev => prev + (prev ? '\n\n' : '') + fullText);
      } else if (ext === 'docx') {
        const mammoth = (window as any).mammoth;
        const res = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
        setInputText(prev => prev + (prev ? '\n\n' : '') + res.value);
      } else {
        const text = await file.text();
        setInputText(prev => prev + (prev ? '\n\n' : '') + text);
      }
    } catch (err: any) {
      setError(`Error lectura: ${err.message}`);
    } finally {
      setIsParsing(false);
      e.target.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) return;

    if ((window as any).aistudio && !await (window as any).aistudio.hasSelectedApiKey()) {
      await (window as any).aistudio.openSelectKey();
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await extractLearningSituation(inputText);
      setResult(data);
    } catch (err: any) {
      if (err.message === "QUOTA_EXHAUSTED" || err.message === "KEY_NOT_FOUND") {
        setError("Cal configurar una clau API Paid per utilitzar aquest servei.");
      } else {
        setError(err.message || "S'ha produït un error inesperat.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      {!result ? (
        <div className="max-w-4xl mx-auto space-y-12 py-10">
          <div className="text-center space-y-6">
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter leading-tight">
              Dissenya la teva <span className="text-red-600 underline decoration-red-200 decoration-4 underline-offset-4">graella oficial</span> en segons
            </h2>
            <p className="text-slate-500 text-lg md:text-xl font-medium max-w-2xl mx-auto">
              Transforma les teves notes, idees o documents en una Situació d'Aprenentatge alineada amb la LOMLOE a Catalunya.
            </p>
          </div>

          <div className="bg-white p-2 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100">
            <div className="bg-slate-50 p-6 md:p-10 rounded-[2rem] space-y-8">
              <div className="relative group">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Descriu la teva unitat, activitat o repte aquí..."
                  className="w-full h-80 p-6 bg-transparent border-none focus:ring-0 text-slate-800 text-xl font-medium placeholder:text-slate-300 resize-none"
                />
                {!inputText && (
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-200 pointer-events-none hidden md:block">
                      <svg className="w-24 h-24 mx-auto mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                   </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 px-2">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-full mb-1">Suggeriments ràpids:</span>
                 {SUGGESTIONS.map(s => (
                   <button 
                    key={s} 
                    onClick={() => setInputText(s)}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 hover:border-red-300 hover:text-red-600 transition-all shadow-sm"
                   >
                    + {s}
                   </button>
                 ))}
              </div>
              
              <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-slate-200">
                <label className="flex-1 flex items-center justify-center gap-4 p-5 bg-white border-2 border-dashed border-slate-300 rounded-[1.5rem] cursor-pointer hover:border-red-400 hover:bg-red-50/50 transition-all group overflow-hidden">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-red-100 transition-colors">
                     <svg className="w-5 h-5 text-slate-500 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black text-slate-700 uppercase leading-none mb-1">{isParsing ? "Analitzant..." : "Importar document"}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PDF, Word o Text</p>
                  </div>
                  <input type="file" className="hidden" accept=".pdf,.docx,.txt" onChange={handleFileUpload} />
                </label>

                <button
                  onClick={handleGenerate}
                  disabled={isLoading || !inputText.trim()}
                  className="flex-[1.5] flex items-center justify-center gap-4 py-6 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-2xl shadow-slate-300 transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50 disabled:scale-100"
                >
                  {isLoading ? (
                    <div className="flex flex-col items-center">
                       <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin mb-2" />
                    </div>
                  ) : (
                    <>
                      Generar Graella Oficial
                      <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </>
                  )}
                </button>
              </div>

              {isLoading && (
                <div className="text-center animate-pulse pt-2">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">{LOADING_MESSAGES[loadingMsgIdx]}</p>
                </div>
              )}

              {error && (
                <div className="p-8 bg-red-600 text-white rounded-[2rem] shadow-xl shadow-red-200 border border-red-500 space-y-4 animate-in zoom-in-95">
                  <div className="flex gap-4">
                    <span className="text-3xl">⚠️</span>
                    <div>
                      <p className="font-black text-lg leading-tight mb-1">Alguna cosa no ha anat bé</p>
                      <p className="text-red-100 font-medium">{error}</p>
                    </div>
                  </div>
                  {(error.includes("clau") || error.includes("quota")) && (
                    <button 
                      onClick={async () => {(window as any).aistudio && await (window as any).aistudio.openSelectKey(); setError(null);}}
                      className="w-full py-4 bg-white text-red-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-50 transition-colors shadow-lg"
                    >
                      Configurar clau API Paid (Gratuït)
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="flex justify-between items-center no-print bg-white/50 p-4 rounded-2xl backdrop-blur-sm border border-white">
            <button 
              onClick={() => setResult(null)} 
              className="px-6 py-3 bg-white text-slate-800 font-black text-xs rounded-xl border border-slate-200 shadow-sm flex items-center gap-2 group transition-all hover:bg-slate-50"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span> TORNA A L'EDITOR
            </button>
            <div className="flex items-center gap-3">
              <div className="flex flex-col text-right">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Estat del Document</span>
                <span className="text-xs font-black text-green-600 uppercase">Alineat LOMLOE</span>
              </div>
              <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                 <div className="w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
              </div>
            </div>
          </div>
          <TableDisplay data={result} onEdit={setResult} />
        </div>
      )}
    </Layout>
  );
};

export default App;
