import { useEffect, useCallback, useRef } from 'react';

// Simple debounce function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
  let timeout: NodeJS.Timeout;
  
  const debounced = (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
  
  debounced.cancel = () => {
    clearTimeout(timeout);
  };
  
  return debounced;
}

interface UseAutoSaveOptions {
  key: string;
  data: any;
  delay?: number;
  enabled?: boolean;
}

export const useAutoSave = ({ key, data, delay = 1000, enabled = true }: UseAutoSaveOptions) => {
  const isInitialMount = useRef(true);

  // Debounced save function
  const debouncedSave = useCallback(
    debounce((dataToSave: any) => {
      if (enabled && !isInitialMount.current) {
        try {
          sessionStorage.setItem(key, JSON.stringify(dataToSave));
        } catch (error) {
          console.warn('Failed to save to sessionStorage:', error);
        }
      }
    }, delay),
    [key, delay, enabled]
  );

  // Save data when it changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    debouncedSave(data);
    
    // Cleanup function to cancel pending debounced calls
    return () => {
      debouncedSave.cancel();
    };
  }, [data, debouncedSave]);

  // Function to restore saved data
  const restoreData = useCallback(() => {
    try {
      const savedData = sessionStorage.getItem(key);
      return savedData ? JSON.parse(savedData) : null;
    } catch (error) {
      console.warn('Failed to restore from sessionStorage:', error);
      return null;
    }
  }, [key]);

  // Function to clear saved data
  const clearSavedData = useCallback(() => {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to clear sessionStorage:', error);
    }
  }, [key]);

  // Function to check if saved data exists
  const hasSavedData = useCallback(() => {
    try {
      return sessionStorage.getItem(key) !== null;
    } catch (error) {
      return false;
    }
  }, [key]);

  return {
    restoreData,
    clearSavedData,
    hasSavedData,
  };
};