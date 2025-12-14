import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // Log error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                ¡Ups! Algo salió mal
              </h1>
              <p className="text-muted-foreground">
                Ha ocurrido un error inesperado. Puedes intentar recargar la página o volver al inicio.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={this.handleRetry}
                variant="default"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reintentar
              </Button>
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="gap-2"
              >
                <Home className="h-4 w-4" />
                Ir al inicio
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left bg-muted/50 rounded-lg p-4 text-xs">
                <summary className="cursor-pointer text-sm font-medium text-muted-foreground mb-2">
                  Detalles del error (desarrollo)
                </summary>
                <pre className="overflow-auto text-destructive whitespace-pre-wrap">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
