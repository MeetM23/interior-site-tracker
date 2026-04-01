import { createContext, useContext, useMemo, useState } from 'react';

const ToastContext = createContext({});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = (type, message) => {
    const id = Date.now() + Math.random().toString(16).slice(2);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const removeToast = id => setToasts(prev => prev.filter(t => t.id !== id));

  const value = useMemo(() => ({ addToast, removeToast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 999 }}> 
        {toasts.map(t => (
          <div key={t.id} style={{ margin: '0.4rem', padding: '0.6rem 0.9rem', borderRadius: 6, color: '#fff', background: t.type === 'error' ? '#e74c3c' : '#27ae60' }}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
