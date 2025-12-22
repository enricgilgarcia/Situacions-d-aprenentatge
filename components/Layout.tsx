import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200 py-4 px-6 no-print">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-800">
              Situacions d'Aprenentatge <span className="text-red-600">LOMLOE</span>
            </h1>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden md:block">Eina de Planificació Docent</p>
        </div>
      </header>
      <main className="flex-grow max-w-6xl mx-auto w-full p-4 md:p-8">
        {children}
      </main>
      <footer className="bg-white border-t border-slate-200 py-6 px-6 no-print">
        <div className="max-w-6xl mx-auto text-center text-slate-400 text-sm">
          Creat amb Intel·ligència Artificial per al personal docent. {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
};
