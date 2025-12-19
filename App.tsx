
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
    // Removed readonly modifier to fix 'All declarations must have identical modifiers' error
    aistudio: AIStudio;
  }
}

pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs';

const App: React.FC = () => {
  const [needsKey, setNeedsKey] = useState<boolean>(false);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [result, setResult] = useState<SituacioAprenentatge | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Comprovació inicial de la disponibilitat de la clau a l'entorn de Netlify/AI Studio
  useEffect(() => {
    const checkInitialKey = async () => {
      const currentKey = process.env.API_KEY;
      if (!currentKey || currentKey === "") {
        if (window.aistudio) {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          if (!hasKey) setNeedsKey(true);
        } else {
          setNeedsKey(true);
        }
      }
    };
    checkInitialKey();
  }, []);

  const handleConnect = async () => {
    if (window.aistudio) {
      // Obrim el diàleg de selecció de clau i procedim immediatament per evitar race conditions
      await window.aistudio.openSelectKey();
      setNeedsKey(false);
      setError(null);
    } else {
      setError("No s'ha detectat el selector de claus oficial. Si us plau, verifica la configuració.");
    }
  };

  const extractTextFromPDF = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
    }
    return fullText;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsParsing(true);
    setError(null);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') {
        const text = await extractTextFromPDF(await file.arrayBuffer());
        setInputText(text);
      } else if (ext === 'docx') {
        const res = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
        setInputText(res.value);
      } else {
        setInputText(await file.text());
      }
    } catch (err) {
      setError("Error en llegir el fitxer.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await extractLearningSituation(inputText);
      setResult(data);
    } catch (err: any) {
      // Gestionem casos on la clau ha fallat o cal re-seleccionar un projecte amb facturació
      if (err.message === "API_KEY_MISSING" || err.message === "API_KEY_INVALID" || err.message === "ENTITY_NOT_FOUND") {
        if (err.message === "ENTITY_NOT_FOUND" && window.aistudio) {
           await window.aistudio.openSelectKey();
        }
        setNeedsKey(true);
        setError("Cal configurar una clau API vàlida de facturació per continuar.");
      } else {
        setError(err.message || "S'ha produït un error inesperat.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (needsKey) {
    return (
      <Layout>
        <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl shadow-2xl border border-slate-200 text-center space-y-6">
          <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Connecta amb Gemini</h2>
          <p className="text-slate-600 leading-relaxed">
            Per utilitzar aquesta eina, cal que vinculis el teu propi projecte de Google Cloud mitjançant una clau API de facturació.
          </p>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-left space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Instruccions</p>
            <p className="text-xs text-slate-500">1. Prem el botó de sota.</p>
            <p className="text-xs text-slate-500">2. Selecciona un projecte amb facturació activa.</p>
            <p className="text-xs text-slate-500">3. L'aplicació es carregarà automàticament.</p>
          </div>
          <button 
            onClick={handleConnect}
            className="w-full py-4 bg-red-600 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg active:scale-95"
          >
            Configurar Clau API
          </button>
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="block text-xs text-slate-400 hover:text-red-600 underline">
            Documentació sobre facturació i claus
          </a>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {!result ? (
        <div className="max-w-4xl mx-auto space-y-10 py-6 animate-in fade-in duration-700">
          <div className="text-center space-y-4">
            <div className="inline-block px-4 py-1.5 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase tracking-widest mb-2">
              Currículum Catalunya
            </div>
            <h2 className="text-4xl font-black text-slate-900 leading-tight tracking-tight">Generador de Situacions d'Aprenentatge</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Crea la teva taula oficial LOMLOE en segons a partir d'esborranys o fitxers.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-800 uppercase tracking-wide">1. Carregar document</label>
                <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer transition-all ${isParsing ? 'bg-slate-100' : 'bg-slate-50 hover:bg-white hover:border-red-500'}`}>
                  <div className="flex flex-col items-center justify-center p-4">
                    {isParsing ? (
                      <div className="animate-spin h-6 w-6 border-2 border-red-600 border-t-transparent rounded-full"></div>
                    ) : (
                      <>
                        <p className="text-sm font-bold text-slate-700 text-center">Tria un fitxer PDF, Word o Text</p>
                        <p className="text-xs text-slate-400 mt-1">Extracció automàtica</p>
                      </>
                    )}
                  </div>
                  <input type="file" className="hidden" accept=".pdf,.docx,.txt" onChange={handleFileUpload} disabled={isParsing} />
                </label>
              </div>

              <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 flex items-center">
                <p className="text-sm text-blue-800 leading-relaxed">
                  <strong>Consell:</strong> Inclou el curs, la matèria i una llista d'activitats. La IA cercarà els sabers i competències més adients.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-800 uppercase tracking-wide">2. Descripció de la unitat</label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Exemple: Treballarem l'ecosistema marí amb alumnes de 4t de primària. Visitarem el port, farem un mural..."
                className="w-full h-64 p-5 border border-slate-300 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-500 transition-all resize-none text-slate-700 text-base"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-800 rounded-lg flex items-center gap-3">
                <svg className="h-6 w-6 shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-sm font-bold">{error}</span>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isLoading || isParsing || !inputText.trim()}
              className={`w-full py-5 rounded-xl font-black text-lg uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-4 ${
                isLoading || isParsing || !inputText.trim() 
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                  : 'bg-red-600 text-white hover:bg-red-700 active:scale-95'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-6 w-6 border-4 border-white border-t-transparent rounded-full"></div>
                  Processant Currículum...
                </>
              ) : "Generar Taula Oficial"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between no-print bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <button onClick={() => setResult(null)} className="flex items-center gap-2 font-bold text-slate-600 hover:text-red-600 transition-colors">
              ← Nova planificació
            </button>
            <div className="flex gap-4">
               <button onClick={handleConnect} className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest">Canviar Clau API</button>
            </div>
          </div>
          <TableDisplay data={result} onEdit={(newData) => setResult(newData)} />
        </div>
      )}
    </Layout>
  );
};

export default App;
