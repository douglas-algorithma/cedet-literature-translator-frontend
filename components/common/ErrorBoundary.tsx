"use client";

import type { ReactNode } from "react";
import { Component } from "react";

import { Button } from "@/components/common/Button";

type ErrorBoundaryState = { hasError: boolean };

type ErrorBoundaryProps = {
  title?: string;
  description?: string;
  children: ReactNode;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-3xl border border-border bg-surface p-8 text-center">
          <h2 className="text-lg font-semibold text-text">
            {this.props.title ?? "Algo deu errado"}
          </h2>
          <p className="max-w-md text-sm text-text-muted">
            {this.props.description ??
              "Ocorreu um erro inesperado. Recarregue a página para tentar novamente."}
          </p>
          <Button onClick={this.handleReload}>Recarregar</Button>
        </div>
      );
    }

    return this.props.children;
  }
}
