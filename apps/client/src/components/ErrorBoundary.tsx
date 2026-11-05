import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught uncaught UI error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#141414] border border-[#2a2a2a] rounded-2xl p-8 text-center shadow-2xl flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-6">
              <AlertTriangle size={32} />
            </div>

            <h2 className="text-xl font-bold tracking-tight mb-2">Something went wrong</h2>
            <p className="text-[#888] text-sm mb-6 leading-relaxed">
              An unexpected error occurred while rendering this interface. Your data and session remain intact.
            </p>

            {this.state.error?.message && (
              <div className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg p-3 text-left font-mono text-[12px] text-red-300 mb-6 overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center gap-3 w-full">
              <Button
                variant="outline"
                onClick={this.handleGoHome}
                className="flex-1 bg-transparent border-[#333] hover:bg-[#222] text-[#ccc]"
              >
                <Home size={16} className="mr-2" />
                Go Home
              </Button>
              <Button
                onClick={this.handleReset}
                className="flex-1 bg-white text-black hover:bg-neutral-200"
              >
                <RefreshCw size={16} className="mr-2" />
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
