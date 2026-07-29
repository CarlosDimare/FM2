import React, { ErrorInfo, ReactNode, useState, useEffect } from 'react';

interface Props {
  children?: ReactNode;
}

export const ErrorBoundary: React.FC<Props> = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setHasError(true);
      setError(new Error(event.error?.message || 'Error inesperado'));
      console.error('FM Error:', event.error);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setHasError(true);
      setError(new Error(event.reason?.message || 'Error inesperado'));
      console.error('FM Error:', event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (hasError) {
    return (
      <div className="h-screen w-screen bg-slate-800 flex flex-col items-center justify-center text-white p-8">
        <div className="max-w-md text-center">
          <div className="text-6xl mb-6 opacity-50">!</div>
          <h1 className="text-2xl font-black uppercase italic mb-4 tracking-tight">
            Se produjo un error
          </h1>
          <p className="text-slate-400 text-sm mb-6 font-mono">
            {error?.message || 'Error inesperado'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-white text-slate-900 px-8 py-3 rounded-sm font-black uppercase text-sm tracking-widest hover:bg-slate-200 transition-colors"
          >
            Recargar
          </button>
        </div>
      </div>
    );
  }

  return children;
};
