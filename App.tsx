
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { TableDisplay } from './components/TableDisplay';
import { SituacioAprenentatge } from './types';
import { extractLearningSituation } from './services/geminiService';
import * as mammoth from 'mammoth';
import * as pdfjs from 'pdfjs-dist';

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
      console.error("Detalls de l'error:", err);
      // Mostrem l'error real perquè sàpigues exactament què passa
      setError(err.message || "S'ha produït un error inesperat.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      {!result ? (
        <div className="max-w-4xl mx-auto space-y-8 py-6">
          <div className="text-center space-y-4">
            <div className="inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-black uppercase tracking-widest">
              Programació LOMLOE Catalunya
            </div>
            <h2 className="text-4xl font-black text-slate-900 leading-tight">Generador de Situacions d'Aprenentatge</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              L'eina per estalviar hores de burocràcia pedagògica.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 space-y-8">
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Importar document</label>
              <input 
                type="file" 
                accept=".pdf,.docx,.txt" 
                onChange={handleFileUpload}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-red-50 hover:file:text-red-700 cursor-pointer transition-all"
              />
              {isParsing && <p className="text-xs text-blue-600 font-bold animate-pulse">Extraient text...</p>}
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Descripció o esborrany</label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Escriu de què va la teva SA..."
                className="w-full h-72 p-6 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-red-100 transition-all text-slate-700 text-base leading-relaxed"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border-2 border-red-100 text-red-700 rounded-2xl text-xs font-mono break-all">
                <p className="font-bold mb-1 uppercase">Error detectat:</p>
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isLoading || isParsing || !inputText.trim()}
              className="w-full py-5 bg-red-600 text-white rounded-2xl font-black text-xl uppercase tracking-tighter shadow-xl hover:bg-red-700 active:scale-[0.98] disabled:bg-slate-200 transition-all flex items-center justify-center gap-4"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-6 w-6 border-4 border-white border-t-transparent rounded-full"></div>
                  <span>Generant...</span>
                </>
              ) : (
                "Generar Programació"
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-700 slide-in-from-bottom-4">
          <div className="flex items-center justify-between no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <button 
              onClick={() => setResult(null)} 
              className="flex items-center gap-2 font-black text-slate-500 hover:text-red-600 transition-colors uppercase text-xs tracking-widest"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Nova Situació
            </button>
          </div>
          <TableDisplay data={result} onEdit={setResult} />
        </div>
      )}
    </Layout>
  );
};

export default App;
