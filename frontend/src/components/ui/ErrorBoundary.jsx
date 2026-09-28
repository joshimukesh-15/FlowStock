import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an unhandled React error:", error, errorInfo);
    if (typeof window !== "undefined") {
      window.__REACT_ERROR__ = { error, errorInfo };
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleClearSession = () => {
    if (typeof window !== "undefined") {
      localStorage.clear();
      window.location.href = "/";
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#11120D] flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white dark:bg-[#191B15] border border-slate-200 dark:border-[#33372B] rounded-2xl shadow-xl p-6 sm:p-8 text-center space-y-5">
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Something went wrong
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#9BA3AF] leading-relaxed">
                An unexpected UI rendering error was intercepted. The page has been safely prevented from crashing.
              </p>
            </div>

            {this.state.error && (
              <div className="text-left bg-slate-900 text-rose-300 p-3 rounded-lg font-mono text-[11px] overflow-auto max-h-36 border border-slate-800 leading-tight">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto px-4 py-2 bg-slate-900 dark:bg-[#D8CFBC] hover:bg-slate-800 dark:hover:bg-[#FFFBF4] text-white dark:text-[#11120D] font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Page</span>
              </button>

              <button
                type="button"
                onClick={this.handleClearSession}
                className="w-full sm:w-auto px-4 py-2 border border-slate-200 dark:border-[#33372B] hover:bg-slate-100 dark:hover:bg-[#23261E] text-slate-700 dark:text-[#E2E8F0] font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Reset & Go Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
