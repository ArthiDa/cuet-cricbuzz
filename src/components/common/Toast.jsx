import { useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';

const Toast = () => {
  const { toasts, removeToast } = useToast();

  const getToastStyles = (type) => {
    const baseStyles = 'flex items-start gap-3 p-4 rounded-lg shadow-lg border-2 backdrop-blur-sm transition-all duration-300 ease-in-out transform';
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-50/95 border-green-500 text-green-800`;
      case 'error':
        return `${baseStyles} bg-red-50/95 border-red-500 text-red-800`;
      case 'warning':
        return `${baseStyles} bg-yellow-50/95 border-yellow-500 text-yellow-800`;
      case 'info':
      default:
        return `${baseStyles} bg-blue-50/95 border-blue-500 text-blue-800`;
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className={getToastStyles(toast.type)}
          style={{
            animation: 'slideInRight 0.3s ease-out',
          }}
        >
          <span className="text-2xl">{getIcon(toast.type)}</span>
          <div className="flex-1">
            <p className="font-semibold text-sm">{toast.message}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close notification"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ))}
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Toast;

