import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, RotateCcw, AlertTriangle } from 'lucide-react';
import { LOGO_FEMALE_BASE64 } from '../../assets/logoBase64';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AniKuro Caught Unhandled Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetAndReload = () => {
    try {
      localStorage.clear();
    } catch (e) {
      console.error('Failed to clear storage:', e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#020617] text-white flex flex-col items-center justify-center p-4 selection:bg-sky-500 selection:text-white font-sans">
          <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-slate-900/95 border border-sky-500/40 shadow-2xl text-center space-y-5 backdrop-blur-xl">
            <div className="w-20 h-20 mx-auto rounded-3xl overflow-hidden border-2 border-sky-400/60 shadow-xl shadow-sky-500/20 bg-slate-950">
              <img src={LOGO_FEMALE_BASE64} alt="AniKuro" className="w-full h-full object-cover" />
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-black">
                <AlertTriangle size={14} />
                <span>AniKuro Auto-Recovery</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">Oops! A Temporal Glitch Occurred</h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                An unexpected exception was safely intercepted. You can reload the app or reset cached data to recover immediately.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-2xl bg-black/60 border border-slate-800 text-left text-xs font-mono text-rose-300 max-h-28 overflow-y-auto break-all">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 font-black text-xs shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <RefreshCw size={15} />
                <span>Reload App</span>
              </button>

              <button
                onClick={this.handleResetAndReload}
                className="flex-1 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <RotateCcw size={15} />
                <span>Reset Cache & Recover</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
