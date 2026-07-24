import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('FM Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen bg-slate-800 flex flex-col items-center justify-center text-white p-8">
          <div className="max-w-md text-center">
            <div className="text-6xl mb-6 opacity-50">!</div>
            <h1 className="text-2xl font-black uppercase italic mb-4 tracking-tight">
              Se produjo un error
            </h1>
            <p className="text-slate-400 text-sm mb-6 font-mono">
              {this.state.error?.message || 'Error inesperado'}
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

    return this.props.children;
  }
}
