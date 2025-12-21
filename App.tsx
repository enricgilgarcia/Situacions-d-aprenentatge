
import React, { useState } from 'react';
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setError(null);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (ext === 'pdf') {
        // Accedim de forma segura a pdfjsLib des de window
        const pdfjsLib = (window as any).pdfjsLib;
        if (!pdfjsLib) {
          throw new Error("La llibreria de lectura de PDF no està carregada. Refresca la pàgina.");
        }

        // Configurem el worker abans d'utilitzar-lo
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
        const mammoth = (window as any).mammoth;
        if (!mammoth) {
          throw new Error("La llibreria de lectura de Word no està carregada. Refresca la pàgina.");
        }
        
        const res = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
        setInputText(res.value);
      } else {
        const text = await file.text();
        setInputText(text);
      }
    } catch (err: any) {
      console.error("Error lectura:", err);
      setError(`Error en llegir el fitxer: ${err.message}`);
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
      console.error("Error generació:", err);
      setError(err.message || "S'ha produït un error inesperat.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      {!result ? (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Programador de Graelles</h2>
            <p className="text-slate-500 font-medium">Converteix el teu text o document en una Situació d'Aprenentatge LOMLOE.</p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 space-y-6">
            <div className="space-y-3">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Escriu les teves notes aquí o puja un fitxer..."
                className="w-full h-72 p-6 bg-slate-50 border-2 border-transparent focus:border-slate-200 rounded-2xl focus:ring-0 transition-all text-slate-700 text-lg resize-none"
              />
              
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex-grow flex items-center justify-center gap-3 p-4 bg-slate-100 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:bg-slate-200 transition-all">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span className="text-sm font-semibold text-slate-600">
                    {isParsing ? "Analitzant fitxer..." : "Carregar PDF o Word"}
                  </span>
                  <input type="file" className="hidden" accept=".pdf,.docx,.txt" onChange={handleFileUpload} />
                </label>
                {inputText && (
                   <button 
                    onClick={() => setInputText('')} 
                    className="px-6 py-4 text-sm font-bold text-red-600 hover:bg-red-50 rounded-2xl transition-all"
                   >
                     Esborrar tot
                   </button>
                )}
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-semibold border border-red-100 flex gap-3 items-center animate-pulse">
                <span>⚠️</span>
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isLoading || !inputText.trim()}
              className={`w-full py-5 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest shadow-lg transition-all active:scale-[0.98] ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-800'}`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generant graella...</span>
                </div>
              ) : "Generar Situació d'Aprenentatge"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
          <div className="flex justify-between items-center no-print px-4">
            <button 
              onClick={() => setResult(null)} 
              className="text-slate-500 hover:text-slate-900 font-bold text-sm flex items-center gap-2 group transition-all"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span> Tornar a l'editor
            </button>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Document Generat</div>
          </div>
          <TableDisplay data={result} onEdit={setResult} />
        </div>
      )}
    </Layout>
  );
};

export default App;
