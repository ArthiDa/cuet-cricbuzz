import { Component } from 'react';
import Button from './Button';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    // Optionally reload the page or navigate home
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 sm:p-8 text-center">
            {/* Error Icon */}
            <div className="text-6xl mb-4">⚠️</div>
            
            {/* Error Title */}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">
              Oops! Something went wrong
            </h1>
            
            {/* Error Message */}
            <p className="text-gray-600 mb-6">
              We encountered an unexpected error. Don't worry, it's been logged and we'll look into it.
            </p>

            {/* Development Error Details */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left bg-red-50 border border-red-200 rounded-lg p-4">
                <summary className="font-semibold text-red-700 cursor-pointer mb-2">
                  Error Details (Development Only)
                </summary>
                <div className="text-sm text-red-800 font-mono break-words">
                  <p className="mb-2">
                    <strong>Error:</strong> {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <pre className="whitespace-pre-wrap text-xs overflow-auto max-h-40">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={this.handleReset} variant="primary">
                🏠 Go to Home
              </Button>
              <Button onClick={() => window.location.reload()} variant="outline">
                🔄 Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

