
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
        const pdfjsLib = (window as any).pdfjsLib;
        if (!pdfjsLib) throw new Error("Llibreria PDF no carregada.");
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
        setInputText(prev => prev + (prev ? '\n\n' : '') + fullText);
      } else if (ext === 'docx') {
        const mammoth = (window as any).mammoth;
        if (!mammoth) throw new Error("Llibreria Mammoth no carregada.");
        const res = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
        setInputText(prev => prev + (prev ? '\n\n' : '') + res.value);
      } else {
        const text = await file.text();
        setInputText(prev => prev + (prev ? '\n\n' : '') + text);
      }
    } catch (err: any) {
      setError(`Error lectura: ${err.message}`);
    } finally {
      setIsParsing(false);
      e.target.value = '';
    }
  };

  const handleOpenKeySelector = async () => {
    if ((window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      setError(null); // Intentem netejar l'error per si volen re-provar
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
      if (err.message === "QUOTA_EXHAUSTED") {
        setError("S'ha esgotat la quota de la clau compartida. Pots utilitzar la teva pròpia clau gratuïta d'AI Studio per continuar.");
      } else {
        setError(err.message || "S'ha produït un error inesperat.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      {!result ? (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="text-center space-y-3">
            <h2 className="text-5xl font-extrabold text-slate-900 tracking-tight">
              Programador <span className="text-red-600">LOMLOE</span>
            </h2>
            <p className="text-slate-500 text-lg font-medium">
              Planificació pedagògica oficial en un instant.
            </p>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-2xl border border-slate-100 space-y-6">
            <div className="relative group">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Escriu la teva idea aquí (ex: Una SA de 4t sobre el canvi climàtic)..."
                className="w-full h-80 p-8 bg-slate-50 border-2 border-transparent focus:border-red-100 rounded-3xl focus:ring-0 transition-all text-slate-700 text-lg resize-none placeholder:text-slate-300"
              />
              {inputText && (
                <button onClick={() => setInputText('')} className="absolute bottom-4 right-4 p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center justify-center gap-3 p-5 bg-white border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-red-300 hover:bg-red-50/30 transition-all group">
                <svg className="w-6 h-6 text-slate-400 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-bold text-slate-600 uppercase tracking-tighter">
                  {isParsing ? "Analitzant..." : "Carregar PDF/Word"}
                </span>
                <input type="file" className="hidden" accept=".pdf,.docx,.txt" onChange={handleFileUpload} />
              </label>

              <button
                onClick={handleGenerate}
                disabled={isLoading || !inputText.trim()}
                className={`flex items-center justify-center gap-3 py-5 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest shadow-xl transition-all active:scale-[0.98] ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-slate-800'}`}
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : "Generar Graella Oficial"}
              </button>
            </div>

            {error && (
              <div className="p-6 bg-red-50 text-red-800 rounded-3xl border border-red-100 space-y-3 animate-in zoom-in-95">
                <div className="flex gap-3">
                  <span className="text-xl">⚠️</span>
                  <p className="font-medium">{error}</p>
                </div>
                {error.includes("quota") && (
                  <button 
                    onClick={handleOpenKeySelector}
                    className="w-full py-3 bg-white border border-red-200 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors"
                  >
                    Utilitzar la meva clau API d'AI Studio (Gratuït)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="flex justify-between items-center no-print px-4">
            <button 
              onClick={() => setResult(null)} 
              className="px-4 py-2 bg-white text-slate-600 hover:text-slate-900 font-bold text-sm rounded-xl border border-slate-200 shadow-sm flex items-center gap-2 group transition-all"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span> Tornar a l'editor
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Planificació Enllestida</span>
            </div>
          </div>
          <TableDisplay data={result} onEdit={setResult} />
        </div>
      )}
    </Layout>
  );
};

export default App;
