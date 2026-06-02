import React, { Component, ErrorInfo, ReactNode } from "react";
import { ShieldAlert, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an uncaught exception: ", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div 
          id="error-boundary-view" 
          className="bg-[#0F0F0F] border border-white/10 text-[#E0E0E0] p-8 sm:p-12 rounded-3xl max-w-xl mx-auto my-16 text-center shadow-2xl font-sans animate-fadeIn"
        >
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-7 h-7 text-red-400" />
          </div>
          
          <h2 className="font-serif italic text-2xl font-semibold text-white tracking-wide">
            Component Rendering Error
          </h2>
          <p className="text-[11px] text-[#C5A059] font-mono mt-1.5 mb-6 uppercase tracking-widest">
            {this.props.fallbackName || "Administrative Interface Guard"}
          </p>

          <div className="bg-red-950/20 border border-red-500/15 p-4 rounded-2xl text-left font-mono text-[11px] leading-relaxed text-red-300 max-h-48 overflow-y-auto mb-6">
            <p className="font-bold text-red-400 mb-1">Error Message:</p>
            <p className="mb-3 whitespace-pre-wrap">{this.state.error?.message || "Unknown Runtime Error"}</p>
            
            {this.state.error?.stack && (
              <>
                <p className="font-bold text-red-400 mb-1">Stack Trace:</p>
                <p className="opacity-70 whitespace-pre-wrap text-[10px] h-32 overflow-y-auto pr-1">
                  {this.state.error.stack}
                </p>
              </>
            )}
          </div>

          <p className="text-white/40 text-xs mb-8 leading-relaxed">
            Please verify if your Firebase collection schemas are properly initialized or if authentication permissions have been granted in your Firestore settings.
          </p>

          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 bg-[#C5A059] hover:bg-[#C5A059]/90 text-black px-6 py-3 rounded-xl font-bold text-xs transition-all shadow-lg hover:scale-103 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Interface Settings</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
