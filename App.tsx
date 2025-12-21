
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { TableDisplay } from './components/TableDisplay';
import { SituacioAprenentatge } from './types';
import { extractLearningSituation } from './services/geminiService';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [result, setResult] = useState<SituacioAprenentatge | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showKeySelector, setShowKeySelector] = useState(false);

  // Comprovar si tenim clau al carregar
  useEffect(() => {
    const checkKey = async () => {
      const hasEnvKey = !!process.env.API_KEY && process.env.API_KEY !== "undefined";
      if (!hasEnvKey && window.aistudio) {
        const hasSelected = await window.aistudio.hasSelectedApiKey();
        if (!hasSelected) setShowKeySelector(true);
      }
    };
    checkKey();
  }, []);

  const handleOpenKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setShowKeySelector(false);
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
        // Accedim a l'objecte global pdfjsLib carregat des de index.html
        // @ts-ignore
        const pdfjsLib = window.pdfjsLib;
        if (!pdfjsLib) throw new Error("La llibreria PDF.js no s'ha carregat correctament.");

        // Configurem el worker des del CDN
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          fullText += content.items.map((item: any) => item.str).join(' ') + '\n';
        }
        setInputText(fullText);
      } else if (ext === 'docx') {
        // @ts-ignore
        const mammoth = window.mammoth;
        if (!mammoth) throw new Error("La llibreria Mammoth no s'ha carregat correctament.");
        
        const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
        setInputText(result.value);
      } else {
        const text = await file.text();
        setInputText(text);
      }
    } catch (err: any) {
      console.error("Error lectura:", err);
      setError(`No s'ha pogut llegir el fitxer: ${err.message || 'Format no suportat'}`);
    } finally {
      setIsParsing(false);
      e.target.value = '';
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
      if (err.message.includes("Falta la clau API")) {
        setShowKeySelector(true);
      }
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      {showKeySelector ? (
        <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-3xl shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
          </div>
          <h2 className="text-2xl font-bold">Configuració de Clau</h2>
          <p className="text-slate-500 text-sm">Per poder generar les graelles automàticament, cal activar una clau API personal o configurar-la al servidor.</p>
          <button onClick={handleOpenKey} className="w-full py-4 bg-red-600 text-white rounded-xl font-bold shadow-lg hover:bg-red-700 transition-all">
            Seleccionar Clau API
          </button>
        </div>
      ) : !result ? (
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-extrabold text-slate-900">Programador LOMLOE</h2>
            <p className="text-slate-500 font-medium">Omple la taula de la Situació d'Aprenentatge en segons.</p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 space-y-6">
            <div className="space-y-3">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Exemple: Una SA per a 3r d'ESO sobre sostenibilitat i canvi climàtic..."
                className="w-full h-64 p-6 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-slate-100 transition-all text-slate-700 text-lg resize-none"
              />
              
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex-grow flex items-center justify-center gap-3 p-4 bg-slate-100 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:bg-slate-200 transition-all">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  <span className="text-sm font-semibold text-slate-600">
                    {isParsing ? "Analitzant..." : "Importar document (PDF/Word)"}
                  </span>
                  <input type="file" className="hidden" accept=".pdf,.docx,.txt" onChange={handleFileUpload} />
                </label>
                {inputText && (
                   <button onClick={() => setInputText('')} className="px-6 py-4 text-sm font-bold text-red-600 hover:bg-red-50 rounded-2xl transition-all">Netejar</button>
                )}
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-semibold border border-red-100 flex gap-3 items-center">
                <span className="shrink-0">⚠️</span>
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isLoading || !inputText.trim()}
              className={`w-full py-5 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest shadow-lg transition-all active:scale-95 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-800'}`}
            >
              {isLoading ? "Processant dades..." : "Generar Graella Oficial"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center no-print">
            <button onClick={() => setResult(null)} className="text-slate-400 hover:text-slate-900 font-bold text-sm flex items-center gap-2">
              ← Tornar a l'editor
            </button>
            <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Vista de Document</div>
          </div>
          <TableDisplay data={result} onEdit={setResult} />
        </div>
      )}
    </Layout>
  );
};

export default App;
