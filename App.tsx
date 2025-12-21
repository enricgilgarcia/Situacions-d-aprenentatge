
import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { TableDisplay } from './components/TableDisplay';
import { SituacioAprenentatge } from './types';
import { extractLearningSituation } from './services/geminiService';
import * as mammoth from 'mammoth';
import * as pdfjs from 'pdfjs-dist';

// Config PDF
// @ts-ignore
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
      setError("No s'ha pogut llegir el fitxer.");
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
      if (err.message?.includes("ERROR_CONFIG")) {
        setError("⚠️ Falta configurar la clau API al servidor (Netlify). Ves a 'Site settings' > 'Environment variables' i afegeix una clau anomenada API_KEY.");
      } else {
        setError("⚠️ S'ha produït un error en generar la SA. Prova-ho amb un text més curt o revisa la teva connexió.");
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      {!result ? (
        <div className="max-w-4xl mx-auto space-y-8 py-6">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black text-slate-900 leading-tight">Generador de Situacions d'Aprenentatge</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Crea automàticament la taula oficial LOMLOE a partir de les teves idees.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 space-y-6">
            <div className="space-y-4">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Escriu aquí el tema, curs i activitats de la teva SA..."
                className="w-full h-64 p-6 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-red-100 transition-all text-slate-700 text-lg leading-relaxed resize-none"
              />
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <input 
                  type="file" 
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileUpload} 
                  className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-white file:text-slate-700 hover:file:bg-slate-100 cursor-pointer" 
                />
                {isParsing && <span className="text-xs text-blue-600 font-bold animate-pulse">Analitzant document...</span>}
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-600 text-red-700 rounded-r-xl text-sm font-medium">
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isLoading || !inputText.trim()}
              className={`w-full py-5 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700'}`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Generant taula...
                </span>
              ) : "Generar Programació LOMLOE"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center no-print px-4">
            <button 
              onClick={() => setResult(null)}
              className="text-slate-500 hover:text-slate-800 flex items-center gap-2 font-bold text-sm transition-colors"
            >
              ← Torna a l'inici
            </button>
          </div>
          <TableDisplay data={result} onEdit={setResult} />
        </div>
      )}
    </Layout>
  );
};

export default App;
