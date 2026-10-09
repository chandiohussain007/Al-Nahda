'use client';

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Custom UI rendered when a child throws. Defaults to a styled retry card. */
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Catches render-time errors in the subtree so one broken component cannot
 * white-screen the whole app. Pairs with the error/empty/skeleton states from
 * the shared component library.
 */
export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Console output is what feeds error reporting hooks (Sentry, etc.).
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;

    if (error) {
      if (this.props.fallback) return this.props.fallback(error, this.reset);

      return (
        <div className="card" role="alert" style={{ margin: '2rem auto', maxWidth: 480 }}>
          <h2>Something went wrong</h2>
          <p className="muted">{error.message}</p>
          <button type="button" className="btn-primary" onClick={this.reset}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
