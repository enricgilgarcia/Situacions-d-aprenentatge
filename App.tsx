
import React, { useState, useCallback } from 'react';
import { Layout } from './components/Layout';
import { TableDisplay } from './components/TableDisplay';
import { SituacioAprenentatge } from './types';
import { extractLearningSituation } from './services/geminiService';
import * as mammoth from 'mammoth';
import * as pdfjs from 'pdfjs-dist';

// Configurar el worker de PDF.js des de CDN per evitar problemes de rutes
pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [result, setResult] = useState<SituacioAprenentatge | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        throw new Error("Format de fitxer no suportat. Utilitza PDF, DOCX, TXT o MD.");
      }
    } catch (err) {
      console.error("Error processant el fitxer:", err);
      setError("No s'ha pogut processar el fitxer. Assegura't que el format és correcte.");
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "S'ha produït un error inesperat.");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setInputText('');
    setError(null);
  };

  return (
    <Layout>
      {!result ? (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold text-slate-900">Planifica la teva docència amb IA</h2>
            <p className="text-slate-600">Puja el teu esborrany (PDF, DOCX, TXT) o enganxa les teves notes per generar la taula oficial de Situació d'Aprenentatge segons la LOMLOE.</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Opció 1: Puja un fitxer (PDF, DOCX, TXT, MD)</label>
              <div className="flex items-center justify-center w-full">
                <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer transition ${isParsing ? 'bg-slate-200 cursor-wait' : 'bg-slate-50 hover:bg-slate-100'}`}>
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {isParsing ? (
                      <div className="flex flex-col items-center gap-2">
                        <svg className="animate-spin h-8 w-8 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-sm font-medium text-slate-600">Llegint el document...</p>
                      </div>
                    ) : (
                      <>
                        <svg className="w-8 h-8 mb-4 text-slate-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                        </svg>
                        <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Fes clic per pujar</span> o arrossega</p>
                        <p className="text-xs text-slate-400">PDF, Word (.docx), Text o Markdown</p>
                      </>
                    )}
                  </div>
                  <input type="file" className="hidden" accept=".txt,.md,.pdf,.docx" onChange={handleFileUpload} disabled={isParsing} />
                </label>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-400 uppercase font-medium">contingut extret o enganxat</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Text de la planificació</label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="El text extret del document apareixerà aquí. També pots escriure directament..."
                className="w-full h-64 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition resize-none text-slate-700 text-sm"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 10 2 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isLoading || isParsing || !inputText.trim()}
              className={`w-full py-4 rounded-lg font-bold text-white shadow-md transition-all flex items-center justify-center gap-3 ${
                isLoading || isParsing || !inputText.trim() 
                  ? 'bg-slate-300 cursor-not-allowed' 
                  : 'bg-red-600 hover:bg-red-700 active:transform active:scale-95'
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analitzant contingut pedagògic...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generar Taula Oficial (LOMLOE)
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-bottom-10 duration-700">
          <div className="flex items-center justify-between no-print mb-4">
            <button 
              onClick={reset}
              className="text-slate-500 hover:text-red-600 font-medium flex items-center gap-2 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Tornar a començar
            </button>
            <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider">
              Generat correctament
            </div>
          </div>
          
          <TableDisplay 
            data={result} 
            onEdit={(newData) => setResult(newData)} 
          />
        </div>
      )}
    </Layout>
  );
};

export default App;
