'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { InlineAlert } from '@/components/ui/inline-alert';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(_: Error, __: ErrorInfo) {
    // Error is captured and rendered with a safe fallback UI.
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="space-y-3">
          <InlineAlert
            variant="danger"
            title="Falha ao renderizar este painel"
            description="Atualize a pagina para tentar novamente."
          />
          <Button variant="secondary" onClick={this.handleRetry}>
            Tentar novamente
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
