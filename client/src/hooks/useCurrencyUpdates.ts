import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrency } from '@/contexts/CurrencyContext';

/**
 * Hook to handle real-time currency updates across the application
 * This ensures that currency changes are immediately reflected in all components
 */
export const useCurrencyUpdates = () => {
  const queryClient = useQueryClient();
  const { userSettings, refreshSettings } = useCurrency();

  // Listen for storage events to detect currency changes in other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currency-settings-updated') {
        refreshSettings();
        queryClient.invalidateQueries({ queryKey: ["userSettings"] });
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshSettings, queryClient]);

  // Function to trigger currency update across all tabs
  const triggerCurrencyUpdate = () => {
    localStorage.setItem('currency-settings-updated', Date.now().toString());
    localStorage.removeItem('currency-settings-updated');
    refreshSettings();
  };

  return {
    triggerCurrencyUpdate,
    userSettings,
  };
};