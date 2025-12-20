
import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { TableDisplay } from './components/TableDisplay';
import { SituacioAprenentatge } from './types';
import { extractLearningSituation } from './services/geminiService';
import * as mammoth from 'mammoth';
import * as pdfjs from 'pdfjs-dist';

// Declaració per a l'entorn de l'estudi
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

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [result, setResult] = useState<SituacioAprenentatge | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      console.error("Error capturat a App:", err);
      const msg = err.message || "";
      
      if (msg.includes("API_KEY_MISSING") || msg.includes("AUTH_ERROR")) {
        setError("Error d'autenticació: La clau API no està configurada correctament o no és vàlida per a aquest servei.");
        if (window.aistudio) {
          await window.aistudio.openSelectKey();
        }
      } else if (msg.includes("404") || msg.includes("not found")) {
        setError("Error de model: El model seleccionat (gemini-3-flash-preview) no està disponible per a aquesta clau.");
      } else if (msg.includes("Quota") || msg.includes("429")) {
        setError("Has superat la quota gratuïta. Espera uns minuts o revisa els límits del teu projecte.");
      } else {
        setError(`S'ha produït un error: ${msg}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

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
                  <strong>Nota:</strong> Si et dóna error de clau a Netlify, assegura't que l'API de Gemini està activada al teu Google Cloud Console per a aquesta clau específica.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-800 uppercase tracking-wide">2. Descripció de la unitat</label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Exemple: Treballarem l'ecosistema marí amb alumnes de 4t de primària..."
                className="w-full h-64 p-5 border border-slate-300 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-500 transition-all resize-none text-slate-700 text-base"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-800 rounded-lg flex items-start gap-3 shadow-sm">
                <svg className="h-5 w-5 shrink-0 text-red-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="text-sm">
                  <p className="font-bold">Error detectat</p>
                  <p className="opacity-90">{error}</p>
                </div>
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
                  Processant amb Gemini...
                </>
              ) : "Generar Taula Oficial"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between no-print bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <button onClick={() => setResult(null)} className="flex items-center gap-2 font-bold text-slate-600 hover:text-red-600 transition-colors">
              ← Tornar a l'editor
            </button>
            <div className="text-xs text-slate-400 font-medium italic">Taula generada mitjançant IA gemini-3-flash</div>
          </div>
          <TableDisplay data={result} onEdit={(newData) => setResult(newData)} />
        </div>
      )}
    </Layout>
  );
};

export default App;
