import React, { createContext, useContext, useEffect, useState } from "react";
import { useSettings } from "@/hooks/useSettings";
import { formatCurrency, formatDate } from "@/lib/currency";
import type { UserSettings } from "@shared/schema";

interface CurrencyContextType {
  userSettings: UserSettings | null;
  isLoading: boolean;
  error: Error | null;
  formatCurrency: (amount: number | string) => string;
  formatDate: (date: string | number | Date) => string;
  getCurrencySymbol: () => string;
  refreshSettings: () => void;
  isUpdating: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: userSettings, isLoading, refetch, error, isFetching } = useSettings();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (userSettings) {
      setSettings(userSettings);
      setIsUpdating(false);
    }
  }, [userSettings]);

  const formatCurrencyWithSettings = (amount: number | string): string => {
    return formatCurrency(amount, settings);
  };

  const formatDateWithSettings = (date: string | number | Date): string => {
    return formatDate(date, settings);
  };

  const getCurrencySymbol = (): string => {
    return settings?.currencySymbol || "$";
  };

  const refreshSettings = async () => {
    setIsUpdating(true);
    try {
      await refetch();
    } catch (err) {
      console.error("Failed to refresh settings:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const value: CurrencyContextType = {
    userSettings: settings,
    isLoading,
    error: error as Error | null,
    formatCurrency: formatCurrencyWithSettings,
    formatDate: formatDateWithSettings,
    getCurrencySymbol,
    refreshSettings,
    isUpdating: isUpdating || isFetching,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};