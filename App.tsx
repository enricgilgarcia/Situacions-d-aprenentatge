
import React, { useState } from 'react';
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
      console.error("Error PDF:", err);
      throw new Error("No s'ha pogut llegir el contingut del PDF.");
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
      } else {
        throw new Error("Format de fitxer no suportat. Utilitza PDF, Word o Text.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error processant el fitxer.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      setError("Si us plau, escriu o puja un document amb la teva planificació.");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const extractedData = await extractLearningSituation(inputText);
      setResult(extractedData);
    } catch (err: any) {
      console.error("Error generació:", err);
      setError("S'ha produït un error en generar la taula. Verifica que el text sigui prou descriptiu o torna-ho a intentar.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      {!result ? (
        <div className="max-w-4xl mx-auto space-y-10 py-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="text-center space-y-4">
            <div className="inline-block px-4 py-1.5 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase tracking-widest mb-2">
              Eina Docent LOMLOE
            </div>
            <h2 className="text-4xl font-black text-slate-900 leading-tight">Generador de Situacions d'Aprenentatge</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Transforma els teus esborranys en la taula oficial de la Generalitat de Catalunya utilitzant Intel·ligència Artificial.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Panell Esquerre: Inputs */}
            <div className="lg:col-span-12 bg-white p-8 rounded-2xl shadow-xl border border-slate-200 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-slate-800 uppercase tracking-wide">1. Carregar document</label>
                  <label className={`group relative flex flex-col items-center justify-center w-full h-36 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer transition-all ${isParsing ? 'bg-slate-100' : 'bg-slate-50 hover:bg-white hover:border-red-500'}`}>
                    <div className="flex flex-col items-center justify-center p-4 text-center">
                      {isParsing ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="animate-spin h-6 w-6 border-2 border-red-600 border-t-transparent rounded-full"></div>
                          <p className="text-sm font-semibold text-slate-600">Llegint el fitxer...</p>
                        </div>
                      ) : (
                        <>
                          <svg className="w-8 h-8 mb-3 text-slate-400 group-hover:text-red-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-sm font-bold text-slate-700">Puja PDF o Word</p>
                          <p className="text-xs text-slate-500 mt-1">L'extraurem automàticament</p>
                        </>
                      )}
                    </div>
                    <input type="file" className="hidden" accept=".pdf,.docx,.txt" onChange={handleFileUpload} disabled={isParsing} />
                  </label>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-bold text-slate-800 uppercase tracking-wide">Consell professional</label>
                  <div className="bg-gradient-to-br from-red-50 to-white p-5 rounded-xl border border-red-100 h-36 flex flex-col justify-center">
                    <p className="text-sm text-slate-700 leading-relaxed italic">
                      "Pots enganxar les teves notes de classe o la planificació d'una unitat. La IA s'encarregarà de mapejar les competències i sabers oficials segons el currículum de Catalunya."
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-800 uppercase tracking-wide">2. Planificació o esborrany de la unitat</label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Exemple: Situació sobre l'energia per a 6è de primària. Investigarem les renovables, farem maquetes de molins i analitzarem factures de la llum..."
                  className="w-full h-80 p-5 border border-slate-300 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-500 transition-all resize-none text-slate-700 text-base shadow-inner leading-relaxed"
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-800 rounded-lg flex items-center gap-3 animate-pulse">
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
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' 
                    : 'bg-red-600 text-white hover:bg-red-700 hover:shadow-red-200 active:scale-95'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin h-6 w-6 border-4 border-white border-t-transparent rounded-full"></div>
                    Processant currículum...
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 2v4a2 2 0 002 2h4" />
                    </svg>
                    Generar Taula Oficial
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in zoom-in duration-500">
          <div className="flex items-center justify-between no-print bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <button onClick={() => setResult(null)} className="flex items-center gap-2 font-bold text-slate-600 hover:text-red-600 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Nou document
            </button>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Previsualització del document</p>
          </div>
          <TableDisplay data={result} onEdit={(newData) => setResult(newData)} />
        </div>
      )}
    </Layout>
  );
};

export default App;
