
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { TableDisplay } from './components/TableDisplay';
import { SituacioAprenentatge } from './types';
import { extractLearningSituation } from './services/geminiService';
import * as mammoth from 'mammoth';
import * as pdfjs from 'pdfjs-dist';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs';

const LOADING_MESSAGES = [
  "Analitzant el text pedagògic...",
  "Dissenyant competències específiques...",
  "Estructurant les fases de les activitats...",
  "Cercant sabers i criteris d'avaluació...",
  "Polint la situació d'aprenentatge..."
];

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [isParsing, setIsParsing] = useState(false);
  const [result, setResult] = useState<SituacioAprenentatge | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Rotació de missatges de càrrega
  useEffect(() => {
    let interval: any;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 3000);
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
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
        }
        setInputText(fullText);
      } else if (ext === 'docx') {
        const res = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
        setInputText(res.value);
      } else {
        setInputText(await file.text());
      }
    } catch (err) {
      setError("Error en llegir el fitxer. Comprova que el format sigui vàlid.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setError(null);
    setLoadingMsgIdx(0);

    try {
      const data = await extractLearningSituation(inputText);
      setResult(data);
    } catch (err: any) {
      const errMsg = err.message || "";
      console.error("Error capturat:", errMsg);

      if (errMsg.includes("API_KEY_MISSING") || errMsg.includes("403") || errMsg.includes("401") || errMsg.includes("not found")) {
        setError("La clau API no és vàlida o no està configurada. Si us plau, verifica que la variable API_KEY estigui ben posada a Netlify.");
        if (window.aistudio) {
          // Si som en l'entorn de l'estudi, provem d'obrir el diàleg
          await window.aistudio.openSelectKey();
        }
      } else if (errMsg.includes("Quota") || errMsg.includes("429")) {
        setError("S'ha superat el límit de velocitat. Espera un minut i torna-ho a provar.");
      } else {
        setError(`S'ha produït un error inesperat: ${errMsg}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualKeyTrigger = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
    } else {
      alert("Si estàs a Netlify, assegura't que has afegit API_KEY a 'Site Settings -> Environment Variables' i has tornat a fer el desplegament.");
    }
  };

  return (
    <Layout>
      {!result ? (
        <div className="max-w-4xl mx-auto space-y-10 py-6">
          <div className="text-center space-y-4">
            <div className="inline-block px-4 py-1.5 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase tracking-widest">
              LOMLOE Catalunya
            </div>
            <h2 className="text-4xl font-black text-slate-900 leading-tight">Generador de Situacions d'Aprenentatge</h2>
            <p className="text-lg text-slate-600">Planificació docent automàtica amb IA.</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 space-y-8">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="flex-1 w-full space-y-3">
                <label className="block text-sm font-bold text-slate-800 uppercase tracking-wide">1. Importar document</label>
                <input 
                  type="file" 
                  accept=".pdf,.docx,.txt" 
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 cursor-pointer"
                />
                {isParsing && <p className="text-xs text-blue-600 animate-pulse font-bold italic">Extraient text del document...</p>}
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-800 uppercase tracking-wide">2. Detalls de la unitat</label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Exemple: 'Vull fer una SA sobre l'estalvi d'aigua per a 3r de Primària, incloent una sortida al riu Besòs i activitats de laboratori...'"
                className="w-full h-64 p-5 border border-slate-300 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-500 transition-all text-slate-700 leading-relaxed shadow-inner"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-600 text-red-900 rounded-lg flex flex-col gap-2 shadow-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                  <span className="font-bold">Error de configuració</span>
                </div>
                <p className="text-sm opacity-90">{error}</p>
                <button 
                  onClick={handleManualKeyTrigger}
                  className="mt-2 text-xs font-bold text-red-700 underline hover:text-red-800 self-start"
                >
                  Reconfigurar clau o revisar Netlify
                </button>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isLoading || isParsing || !inputText.trim()}
              className="w-full py-5 bg-red-600 text-white rounded-xl font-black text-lg uppercase tracking-widest shadow-lg hover:bg-red-700 active:scale-95 disabled:bg-slate-300 disabled:scale-100 transition-all flex flex-col items-center justify-center gap-1"
            >
              {isLoading ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="animate-spin h-5 w-5 border-3 border-white border-t-transparent rounded-full"></div>
                    <span>Processant amb Gemini</span>
                  </div>
                  <span className="text-xs font-medium normal-case opacity-80 mt-1 animate-pulse italic">
                    {LOADING_MESSAGES[loadingMsgIdx]}
                  </span>
                </>
              ) : "Generar Taula Oficial"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex items-center justify-between no-print bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <button 
              onClick={() => setResult(null)} 
              className="flex items-center gap-2 font-bold text-slate-600 hover:text-red-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Tornar a l'editor
            </button>
            <div className="flex items-center gap-4">
               <span className="text-xs text-slate-400 italic font-medium">Model: gemini-3-flash</span>
               <div className="h-4 w-px bg-slate-200"></div>
               <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-black uppercase rounded">Èxit</span>
            </div>
          </div>
          <TableDisplay data={result} onEdit={setResult} />
        </div>
      )}
    </Layout>
  );
};

export default App;
