
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
        throw new Error("Format de fitxer no suportat (utilitza PDF, DOCX o TXT).");
      }
    } catch (err) {
      setError("No s'ha pogut processar el fitxer correctament.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      setError("Si us plau, introdueix o puja un text de planificació abans de continuar.");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const extractedData = await extractLearningSituation(inputText);
      setResult(extractedData);
    } catch (err: any) {
      console.error("Error durant la generació:", err);
      if (err.message && err.message.includes("API Key")) {
        setError("Error de configuració: La clau de l'API no s'ha carregat correctament. Si ets l'administrador, revisa les variables d'entorn.");
      } else {
        setError(err instanceof Error ? err.message : "S'ha produït un error inesperat analitzant el text.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      {!result ? (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold text-slate-900">Planifica la teva docència amb IA</h2>
            <p className="text-slate-600">Genera la taula oficial LOMLOE a partir de qualsevol esborrany, nota o document.</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">1. Puja un document (opcional)</label>
                <div className="flex items-center justify-center w-full">
                  <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer transition ${isParsing ? 'bg-slate-200 cursor-wait' : 'bg-slate-50 hover:bg-slate-100'}`}>
                    <div className="flex flex-col items-center justify-center">
                      {isParsing ? (
                        <p className="text-xs font-medium text-slate-600">Processant...</p>
                      ) : (
                        <>
                          <svg className="w-6 h-6 mb-2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="text-xs text-slate-500 font-semibold">Clica per carregar PDF o DOCX</p>
                        </>
                      )}
                    </div>
                    <input type="file" className="hidden" accept=".txt,.md,.pdf,.docx" onChange={handleFileUpload} disabled={isParsing} />
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Notes ràpides</label>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <p className="text-xs text-blue-800 leading-relaxed">
                    Pots enganxar textos desordenats. La IA s'encarregarà d'extreure les competències i sabers oficials.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">2. Text de la planificació o esborrany</label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Exemple: Unitat de medi sobre les plantes per a 3r de primària. Farem un hort escolar, estudiarem les parts de la flor i la fotosíntesi. Vull treballar la competència de recerca científica..."
                className="w-full h-64 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 transition resize-none text-slate-700 text-sm shadow-inner"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-3 animate-bounce">
                <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                  : 'bg-red-600 hover:bg-red-700 active:scale-95'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Generant document oficial...
                </>
              ) : "Generar Taula Oficial (LOMLOE)"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between no-print px-4">
            <button onClick={() => setResult(null)} className="text-slate-500 hover:text-red-600 font-medium flex items-center gap-2 transition group">
              <span className="group-hover:-translate-x-1 transition-transform">←</span> Tornar a l'editor
            </button>
          </div>
          <TableDisplay data={result} onEdit={(newData) => setResult(newData)} />
        </div>
      )}
    </Layout>
  );
};

export default App;
