import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ErrorBoundary } from './ErrorBoundary';

// Helper component that throws on demand
function FaultyComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test rendering crash');
  }
  return <div>Component loaded successfully</div>;
}

describe('ErrorBoundary Component', () => {
  it('renders children normally when no exception is thrown', () => {
    const html = renderToStaticMarkup(
      <ErrorBoundary>
        <FaultyComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(html).toContain('Component loaded successfully');
  });

  it('updates state via getDerivedStateFromError when error occurs', () => {
    const error = new Error('Test crash');
    const newState = ErrorBoundary.getDerivedStateFromError(error);

    expect(newState.hasError).toBe(true);
    expect(newState.error).toBe(error);
  });

  it('calls onError prop when componentDidCatch is invoked', () => {
    const onError = vi.fn();
    const boundary = new ErrorBoundary({
      children: <div>Child</div>,
      onError,
    });

    const error = new Error('Runtime error');
    const errorInfo = { componentStack: 'at FaultyComponent' };

    boundary.componentDidCatch(error, errorInfo);
    expect(onError).toHaveBeenCalledWith(error, errorInfo);
  });

  it('renders default fallback UI when error state is active', () => {
    const boundary = new ErrorBoundary({
      children: <div>Child</div>,
      sectionName: 'Payment Cases',
    });

    // Simulate error state
    boundary.state = {
      hasError: true,
      error: new Error('Simulated failure'),
    };

    const rendered = boundary.render();
    const html = renderToStaticMarkup(rendered as React.ReactElement);

    expect(html).toContain('Unable to display Payment Cases');
    expect(html).toContain('Try Again');
  });

  it('renders custom fallback function when provided', () => {
    const boundary = new ErrorBoundary({
      children: <div>Child</div>,
      fallback: (err, reset) => (
        <div>
          <span>Custom Fallback: {err.message}</span>
        </div>
      ),
    });

    boundary.state = {
      hasError: true,
      error: new Error('Custom failure message'),
    };

    const rendered = boundary.render();
    const html = renderToStaticMarkup(rendered as React.ReactElement);

    expect(html).toContain('Custom Fallback: Custom failure message');
  });

  it('resets state when handleReset is triggered', () => {
    const boundary = new ErrorBoundary({
      children: <div>Child</div>,
    });

    boundary.state = {
      hasError: true,
      error: new Error('Temporary error'),
    };

    boundary.setState = vi.fn((update: any) => {
      boundary.state = { ...boundary.state, ...(typeof update === 'function' ? update(boundary.state) : update) };
    }) as any;

    boundary.handleReset();

    expect(boundary.state.hasError).toBe(false);
    expect(boundary.state.error).toBeNull();
  });
});
