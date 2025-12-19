
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { TableDisplay } from './components/TableDisplay';
import { SituacioAprenentatge } from './types';
import { extractLearningSituation } from './services/geminiService';
import * as mammoth from 'mammoth';
import * as pdfjs from 'pdfjs-dist';

// Configurar el worker de PDF.js des de CDN
pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [result, setResult] = useState<SituacioAprenentatge | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [checkingKey, setCheckingKey] = useState<boolean>(true);

  useEffect(() => {
    const checkKey = async () => {
      // 1. Prioritat: Variable d'entorn real (Injectada per Netlify o similar)
      const envKey = process.env.API_KEY;
      if (envKey && envKey !== "" && envKey !== "undefined") {
        setHasApiKey(true);
        setCheckingKey(false);
        return;
      }

      // 2. Segona opció: Entorn de AI Studio
      try {
        if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
          const selected = await window.aistudio.hasSelectedApiKey();
          if (selected) {
            setHasApiKey(true);
            setCheckingKey(false);
            return;
          }
        }
      } catch (err) {
        console.warn("Error comprovant clau AI Studio:", err);
      }
      
      setCheckingKey(false);
    };
    checkKey();
  }, []);

  const handleOpenKeySelector = async () => {
    try {
      if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
        await window.aistudio.openSelectKey();
        setHasApiKey(true);
        setError(null);
      } else {
        setError("Aquesta funció només està disponible dins de Google AI Studio. Si estàs a Netlify, has de configurar la variable d'entorn API_KEY als ajustos del lloc.");
      }
    } catch (err) {
      setError("No s'ha pogut obrir el selector de claus.");
    }
  };

  const extractTextFromPDF = async (arrayBuffer: ArrayBuffer): Promise<string> => {
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
      } else {
        throw new Error("Format de fitxer no suportat.");
      }
    } catch (err) {
      setError("No s'ha pogut processar el fitxer.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      setError("Si us plau, introdueix o puja un text de planificació.");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const extractedData = await extractLearningSituation(inputText);
      setResult(extractedData);
    } catch (err: any) {
      console.error("Error durant la generació:", err);
      if (err.message && (err.message.includes("API Key") || err.message.includes("not found"))) {
        setHasApiKey(false);
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "S'ha produït un error inesperat.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-10 w-10 border-4 border-red-600 border-t-transparent rounded-full"></div>
          <p className="text-slate-500 font-medium">Comprovant configuració...</p>
        </div>
      </div>
    );
  }

  if (!hasApiKey) {
    return (
      <Layout>
        <div className="max-w-xl mx-auto mt-12 text-center p-8 bg-white rounded-2xl shadow-xl border border-slate-200">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4">Clau API no trobada</h2>
          
          <div className="text-left space-y-4 mb-8">
            <p className="text-slate-600">
              Aquesta aplicació necessita una clau de l'API de Google Gemini per funcionar. Teniu dues opcions:
            </p>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm space-y-3">
              <p><strong>A Netlify:</strong> Ves a <em>Site Configuration > Environment Variables</em> i afegeix una variable anomenada <code>API_KEY</code> amb la teva clau.</p>
              <p><strong>A AI Studio:</strong> Fes clic al botó de sota per autoritzar l'ús de la teva clau de pagament.</p>
            </div>
          </div>

          <button
            onClick={handleOpenKeySelector}
            className="w-full py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition shadow-lg flex items-center justify-center gap-3 mb-4"
          >
            Configurar via Google AI Studio
          </button>
          
          {error && <p className="text-red-600 text-sm font-medium mt-2">{error}</p>}
          
          <p className="mt-6 text-xs text-slate-400">
            Per a més informació, consulteu <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline">ai.google.dev/gemini-api/docs/billing</a>.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {!result ? (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold text-slate-900">Planifica la teva docència amb IA</h2>
            <p className="text-slate-600">Puja el teu esborrany o enganxa les teves notes per generar la taula oficial LOMLOE.</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Opció 1: Puja un fitxer</label>
              <div className="flex items-center justify-center w-full">
                <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer transition ${isParsing ? 'bg-slate-200 cursor-wait' : 'bg-slate-50 hover:bg-slate-100'}`}>
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {isParsing ? (
                      <p className="text-sm font-medium text-slate-600">Llegint el document...</p>
                    ) : (
                      <>
                        <svg className="w-8 h-8 mb-4 text-slate-500" fill="none" viewBox="0 0 20 16"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/></svg>
                        <p className="text-sm text-slate-500"><span className="font-semibold">Fes clic per pujar</span></p>
                      </>
                    )}
                  </div>
                  <input type="file" className="hidden" accept=".txt,.md,.pdf,.docx" onChange={handleFileUpload} disabled={isParsing} />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Text de la planificació</label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Exemple: Vull fer una unitat de medi natural sobre les plantes per a 3r de primària..."
                className="w-full h-64 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 transition resize-none text-slate-700 text-sm"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-3">
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isLoading || isParsing || !inputText.trim()}
              className={`w-full py-4 rounded-lg font-bold text-white shadow-md transition-all flex items-center justify-center gap-3 ${
                isLoading || isParsing || !inputText.trim() 
                  ? 'bg-slate-300 cursor-not-allowed' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Analitzant contingut...
                </>
              ) : "Generar Taula Oficial (LOMLOE)"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between no-print px-4">
            <button onClick={() => setResult(null)} className="text-slate-500 hover:text-red-600 font-medium flex items-center gap-2 transition">
              ← Tornar a l'editor
            </button>
          </div>
          <TableDisplay data={result} onEdit={(newData) => setResult(newData)} />
        </div>
      )}
    </Layout>
  );
};

export default App;
