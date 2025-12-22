import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 py-4 px-6 no-print">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-200">
               <span className="text-white font-black text-xs">SA</span>
            </div>
            <h1 className="text-lg font-bold tracking-tight text-slate-800">
              Programador <span className="text-red-600">LOMLOE</span>
            </h1>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <span className="px-3 py-1 bg-slate-100 text-[10px] font-bold text-slate-500 rounded-full uppercase tracking-wider">Eina Docent</span>
          </div>
        </div>
      </header>
      <main className="flex-grow max-w-6xl mx-auto w-full p-4 md:p-8">
        {children}
      </main>
      <footer className="bg-white border-t border-slate-200 py-8 px-6 no-print">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-xs">
          <p className="font-medium">© {new Date().getFullYear()} Generador de Situacions d'Aprenentatge Catalunya</p>
          <div className="flex gap-6 font-bold uppercase tracking-widest">
            <span>Model Oficial</span>
            <span className="text-red-500">Departament d'Educació</span>
          </div>
        </div>
      </footer>
    </div>
  );
};