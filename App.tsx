
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { TableDisplay } from './components/TableDisplay';
import { SituacioAprenentatge } from './types';
import { extractLearningSituation } from './services/geminiService';
import * as mammoth from 'mammoth';
import * as pdfjs from 'pdfjs-dist';

// Configure PDF worker
// @ts-ignore
pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs';

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [isCheckingKey, setIsCheckingKey] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [result, setResult] = useState<SituacioAprenentatge | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check for API key availability on mount
  useEffect(() => {
    const checkKey = async () => {
      // Priority 1: Environment variable
      if (process.env.API_KEY && process.env.API_KEY !== "undefined") {
        setHasKey(true);
        setIsCheckingKey(false);
        return;
      }

      // Priority 2: AI Studio key selector
      if (window.aistudio) {
        try {
          const selected = await window.aistudio.hasSelectedApiKey();
          setHasKey(selected);
        } catch (e) {
          console.error("Error checking key status:", e);
        }
      }
      setIsCheckingKey(false);
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      try {
        await window.aistudio.openSelectKey();
        // Per guidelines, assume key selection successful to avoid race conditions
        setHasKey(true);
      } catch (e) {
        setError("No s'ha pogut obrir el selector de claus.");
      }
    } else {
      setError("El servei de selecció de claus no està disponible en aquest entorn.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsParsing(true);
    setError(null);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item: any) => item.str).join(' ') + '\n';
        }
        setInputText(text);
      } else if (ext === 'docx') {
        const res = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
        setInputText(res.value);
      } else {
        setInputText(await file.text());
      }
    } catch (err) {
      setError("Error en processar el fitxer.");
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
      // If request fails due to invalid key, reset selection state
      if (err.message?.includes("Requested entity was not found")) {
        setHasKey(false);
        setError("La clau seleccionada no és vàlida o el projecte no té facturació activa. Revisa ai.google.dev/gemini-api/docs/billing");
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingKey) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-red-600"></div>
        </div>
      </Layout>
    );
  }

  if (!hasKey) {
    return (
      <Layout>
        <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-3xl shadow-2xl border border-slate-100 text-center space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
          </div>
          <h2 className="text-2xl font-black text-slate-900 leading-tight">Accés a Gemini 3</h2>
          <p className="text-slate-500 text-sm">
            Per generar situacions d'aprenentatge completes, cal configurar una clau API personal des de Google Cloud.
          </p>
          <div className="p-4 bg-slate-50 rounded-xl text-xs text-left space-y-3">
            <p className="font-bold text-slate-700">Requisits:</p>
            <ul className="space-y-2">
              <li className="flex gap-2">
                <span className="text-red-600 font-bold">•</span>
                <span>Un projecte a Google Cloud Platform.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-red-600 font-bold">•</span>
                <span>Facturació activa (el model Gemini 3 Pro la requereix).</span>
              </li>
            </ul>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="block text-center text-red-600 underline font-bold pt-2">
              Llegir documentació de facturació
            </a>
          </div>
          <button
            onClick={handleSelectKey}
            className="w-full py-4 bg-red-600 text-white rounded-xl font-bold uppercase tracking-tight hover:bg-red-700 active:scale-95 transition-all shadow-lg"
          >
            Seleccionar Clau API
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {!result ? (
        <div className="max-w-4xl mx-auto space-y-8 py-6">
          <div className="text-center space-y-4">
            <div className="inline-block px-3 py-1 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest">
              Gemini 3 Pro Active
            </div>
            <h2 className="text-4xl font-black text-slate-900 leading-tight">Generador de Situacions d'Aprenentatge</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Transforma les teves idees en programacions LOMLOE oficials en un clic.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 space-y-6">
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Planificació o descripció</label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Exemple: Una SA per a 3r de Primària sobre el cicle de l'aigua utilitzant el mètode científic..."
                className="w-full h-64 p-6 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-red-100 transition-all text-slate-700 text-lg leading-relaxed resize-none"
              />
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl">
                <input 
                  type="file" 
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileUpload} 
                  className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-white file:text-slate-700 hover:file:bg-slate-100 cursor-pointer" 
                />
                {isParsing && <span className="text-xs text-blue-600 font-bold animate-pulse">Analitzant document...</span>}
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-600 text-red-700 rounded-r-xl text-sm animate-in shake duration-500">
                <p className="font-bold uppercase text-[10px] mb-1">Error:</p>
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isLoading || !inputText.trim()}
              className={`w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-800'}`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Generant Programació...
                </span>
              ) : "Generar Situació d'Aprenentatge"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center no-print">
            <button 
              onClick={() => setResult(null)}
              className="text-slate-500 hover:text-slate-800 flex items-center gap-2 font-bold text-sm transition-colors"
            >
              ← Tornar a l'editor
            </button>
          </div>
          <TableDisplay data={result} onEdit={setResult} />
        </div>
      )}
    </Layout>
  );
};

export default App;
