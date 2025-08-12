import React, { createContext, useContext, useState, useEffect } from 'react';

const LoadingContext = createContext();

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Cargando...');

  const startLoading = (message = 'Cargando...') => {
    setIsLoading(true);
    setLoadingMessage(message);
  };

  const stopLoading = () => {
    setIsLoading(false);
    setLoadingMessage('');
  };

  const setMessage = message => {
    setLoadingMessage(message);
  };

  // Auto-hide loading after initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        stopLoading();
      }
    }, 3000); // Fallback to prevent infinite loading

    return () => clearTimeout(timer);
  }, [isLoading]);

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        loadingMessage,
        startLoading,
        stopLoading,
        setMessage,
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
};
