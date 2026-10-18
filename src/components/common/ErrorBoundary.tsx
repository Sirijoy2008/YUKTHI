'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/Button';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  title?: string;
  sectionName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Reusable React Error Boundary component.
 * Catches JavaScript errors anywhere in its child component tree,
 * logs the error, and displays a graceful fallback UI instead of crashing the page.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    if (process.env.NODE_ENV !== 'production') {
      console.error('[ErrorBoundary caught error]:', error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      if (this.props.fallback) {
        return this.props.fallback;
      }

      const sectionTitle = this.props.title || (this.props.sectionName ? `Unable to display ${this.props.sectionName}` : 'Something went wrong in this section');

      return (
        <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-6 text-[#991B1B] shadow-xs space-y-4 my-4 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FEE2E2] flex items-center justify-center shrink-0 text-xl border border-[#FCA5A5]">
              ⚠️
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#991B1B]">
                {sectionTitle}
              </h3>
              <p className="text-xs text-[#7F1D1D] leading-relaxed">
                An unexpected display error occurred while loading this view. Your saved records and transactions are safe.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#FCA5A5]/40">
            <Button
              variant="secondary"
              size="sm"
              onClick={this.handleReset}
              className="bg-white hover:bg-[#F8FAFC] text-[#991B1B] border border-[#FECACA]"
            >
              Try Again
            </Button>
            <span className="text-[11px] text-[#7F1D1D]">
              If this issue persists, please refresh the page or return to the Dashboard.
            </span>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
