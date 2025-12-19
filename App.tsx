
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { TableDisplay } from './components/TableDisplay';
import { SituacioAprenentatge } from './types';
import { extractLearningSituation } from './services/geminiService';
import * as mammoth from 'mammoth';
import * as pdfjs from 'pdfjs-dist';

// Declare global for AI Studio tools to resolve "must be of type AIStudio" and "identical modifiers" errors
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    readonly aistudio: AIStudio;
  }
}

// Configurar el worker de PDF.js des de CDN
pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs';

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState<boolean>(true);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [result, setResult] = useState<SituacioAprenentatge | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Comprovar si hi ha una clau seleccionada al carregar
  useEffect(() => {
    const checkKey = async () => {
      // Si estem en un entorn on process.env.API_KEY ja existeix (com Google Studio), no cal el diàleg
      if (process.env.API_KEY) {
        setHasKey(true);
        return;
      }
      
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      }
    };
    checkKey();
  }, []);

  const handleOpenKeySelector = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      // Després de cridar el selector, assumim que l'usuari ha fet el procés
      setHasKey(true);
    }
  };

  const extractTextFromPDF = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    try {
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }
      return fullText;
    } catch (err) {
      throw new Error("No s'ha pogut llegir el PDF correctament.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setError(null);

    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension === 'pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const text = await extractTextFromPDF(arrayBuffer);
        setInputText(text);
      } else if (fileExtension === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setInputText(result.value);
      } else if (fileExtension === 'txt' || fileExtension === 'md') {
        const text = await file.text();
        setInputText(text);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error en processar el fitxer.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      setError("Si us plau, escriu alguna cosa sobre la teva unitat didàctica.");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const extractedData = await extractLearningSituation(inputText);
      setResult(extractedData);
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      
      // Si l'error diu que falta la clau, tornem a demanar selecció
      if (msg.toLowerCase().includes("api key") || msg.toLowerCase().includes("not found")) {
        setHasKey(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasKey) {
    return (
      <Layout>
        <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl shadow-2xl border border-slate-200 text-center space-y-6">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-800">Connexió amb Gemini</h2>
          <p className="text-slate-600">
            Per poder generar les situacions d'aprenentatge amb IA, cal que connectis l'aplicació amb la teva clau de Google Cloud.
          </p>
          <div className="text-xs text-slate-400 bg-slate-50 p-3 rounded-lg border border-slate-100">
            Pots obtenir una clau gratuïta a <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-red-600 underline">ai.google.dev</a>.
          </div>
          <button 
            onClick={handleOpenKeySelector}
            className="w-full py-4 bg-red-600 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg active:scale-95"
          >
            Configurar Clau API
          </button>
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
            <h2 className="text-4xl font-black text-slate-900 leading-tight">Generador de Situacions d'Aprenentatge</h2>
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
                        <p className="text-sm font-bold text-slate-700">Tria un fitxer PDF o Word</p>
                        <p className="text-xs text-slate-500 mt-1">Extracció automàtica de text</p>
                      </>
                    )}
                  </div>
                  <input type="file" className="hidden" accept=".pdf,.docx,.txt" onChange={handleFileUpload} disabled={isParsing} />
                </label>
              </div>

              <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 flex items-center">
                <p className="text-sm text-blue-800 leading-relaxed">
                  <strong>Consell:</strong> Com més detalls donis (curs, matèria, activitats principals), millor serà la selecció de competències i sabers.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-800 uppercase tracking-wide">2. Descripció de la unitat</label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Exemple: Unitat sobre el cos humà per a 1r de primària. Farem un dibuix de siluetes, aprendrem els sentits i jugarem a endevinar olors..."
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
                  Generant taula...
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
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Document Generat</span>
          </div>
          <TableDisplay data={result} onEdit={(newData) => setResult(newData)} />
        </div>
      )}
    </Layout>
  );
};

export default App;
