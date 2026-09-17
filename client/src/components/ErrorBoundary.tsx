import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In production this should forward to a real error-tracking service
    // (Sentry, Bugsnag, ...) rather than just the console.
    console.error('Unhandled UI error:', error, info.componentStack);
  }

  private handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--background)' }}>
          <div className="text-center max-w-sm">
            <p className="text-5xl mb-4">⚠️</p>
            <h1 className="text-lg font-bold mb-2" style={{ color: 'var(--foreground)' }}>
              حدث خطأ غير متوقع
            </h1>
            <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
              نعتذر عن الإزعاج، حاول تحديث الصفحة مرة أخرى.
            </p>
            <button
              onClick={this.handleReload}
              className="px-5 py-2.5 rounded-xl font-semibold text-white"
              style={{ background: 'linear-gradient(135deg,#6d5ef5,#a855f7)' }}
            >
              تحديث الصفحة
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
