import React from 'react';
import { resetLocalState } from '@/lib/storageRecovery';

interface AppErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

export class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { hasError: true, error };
  }

  handleReset = () => {
    resetLocalState();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground px-6">
          <div className="max-w-lg text-center space-y-4">
            <h1 className="font-display text-3xl">Something went wrong</h1>
            <p className="text-sm text-muted-foreground">
              The local state store failed to load. You can reset the local data and reload the app.
            </p>
            <button
              onClick={this.handleReset}
              className="px-5 py-2 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium"
            >
              Reset Local State
            </button>
            {this.state.error && (
              <p className="text-xs text-muted-foreground break-words">{this.state.error.message}</p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
