import { Component, type ErrorInfo, type ReactNode } from "react";
import { frontendLogger } from "../services/logger/frontend-logger";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  houveErro: boolean;
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    houveErro: false,
  };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { houveErro: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    frontendLogger.error("ErrorBoundary", "Erro não tratado na interface", {
      erro: error,
      arvoreComponentes: info.componentStack,
    });
  }

  render() {
    if (this.state.houveErro) {
      return (
        <main className="container py-5">
          <section className="card border-0 shadow-sm">
            <div className="card-body p-4 p-md-5">
              <span className="badge text-bg-danger mb-3">Erro inesperado</span>
              <h1 className="h4 mb-2">Não foi possível carregar esta tela.</h1>
              <p className="text-muted mb-4">
                Recarregue a página e tente novamente. Se o problema continuar,
                entre em contato com o suporte.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => window.location.reload()}
              >
                Recarregar página
              </button>
            </div>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
