
import React, { useState } from 'react';
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
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      {!result ? (
        <div className="max-w-4xl mx-auto space-y-8 py-6">
          <div className="text-center space-y-4">
            <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest">
              Versió 2.1 (Debug Mode)
            </div>
            <h2 className="text-4xl font-black text-slate-900 leading-tight">Generador de Situacions d'Aprenentatge</h2>
            <p className="text-lg text-slate-500">Si veus aquest text Blau, el codi s'ha actualitzat correctament.</p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 space-y-6">
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Contingut de la SA</label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Pega aquí el teu esborrany o puja un document..."
                className="w-full h-64 p-6 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-100 transition-all text-slate-700"
              />
              <input type="file" onChange={handleFileUpload} className="text-xs text-slate-400" />
            </div>

            {error && (
              <div className="p-6 bg-red-50 border-2 border-red-200 rounded-2xl animate-bounce">
                <div className="flex items-start gap-4">
                  <div className="bg-red-600 text-white p-2 rounded-lg font-bold">!</div>
                  <div className="space-y-2">
                    <p className="text-red-800 font-bold text-sm uppercase">S'ha detectat un error tècnic:</p>
                    <div className="p-3 bg-white/50 rounded-xl font-mono text-[10px] text-red-600 break-all border border-red-100">
                      {error}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isLoading || isParsing || !inputText.trim()}
              className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xl uppercase tracking-tighter hover:bg-black disabled:bg-slate-200 transition-all flex items-center justify-center gap-4"
            >
              {isLoading ? "Generant amb IA..." : "Començar Generació"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <button onClick={() => setResult(null)} className="no-print text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-blue-600 flex items-center gap-2">
            ← Tornar a l'inici
          </button>
          <TableDisplay data={result} onEdit={setResult} />
        </div>
      )}
    </Layout>
  );
};

export default App;
