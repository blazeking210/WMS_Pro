import type { UserSettings } from "@shared/schema";

export const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD - US Dollar", symbol: "$" },
  { value: "EUR", label: "EUR - Euro", symbol: "€" },
  { value: "GBP", label: "GBP - British Pound", symbol: "£" },
  { value: "JPY", label: "JPY - Japanese Yen", symbol: "¥" },
  { value: "AUD", label: "AUD - Australian Dollar", symbol: "A$" },
  { value: "CAD", label: "CAD - Canadian Dollar", symbol: "C$" },
  { value: "CHF", label: "CHF - Swiss Franc", symbol: "Fr" },
  { value: "CNY", label: "CNY - Chinese Yuan", symbol: "¥" },
  { value: "INR", label: "INR - Indian Rupee", symbol: "₹" },
];

export const getCurrencySymbol = (currency: string): string => {
  const currencyOption = CURRENCY_OPTIONS.find(option => option.value === currency);
  return currencyOption?.symbol || "$";
};

export const formatCurrency = (
  amount: number | string,
  userSettings?: UserSettings | null
): string => {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) return getCurrencySymbol(userSettings?.currency || "USD") + "0";
  
  const currency = userSettings?.currency || "USD";
  const symbol = userSettings?.currencySymbol || getCurrencySymbol(currency);
  
  // Get the appropriate locale for the currency
  const locale = getLocaleForCurrency(currency);
  
  // Currency-specific formatting rules
  const shouldShowDecimals = shouldShowDecimalPlaces(currency, numAmount);
  const fractionDigits = shouldShowDecimals ? 2 : 0;
  
  // Special handling for INR to use Indian numbering system
  if (currency === "INR") {
    try {
      const formatted = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      }).format(numAmount);
      
      // Replace ₹ with user's preferred symbol
      return formatted.replace('₹', symbol);
    } catch (error) {
      // Fallback for INR
      const formatted = new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      }).format(numAmount);
      
      return `${symbol}${formatted}`;
    }
  }
  
  // Use Intl.NumberFormat with the specific currency for proper formatting
  try {
    const formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(numAmount);
    
    // Replace the default currency symbol with user's preferred symbol if different
    const defaultSymbol = getCurrencySymbol(currency);
    if (symbol !== defaultSymbol) {
      return formatted.replace(defaultSymbol, symbol);
    }
    
    return formatted;
  } catch (error) {
    // Fallback to manual formatting if Intl.NumberFormat fails
    const formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(numAmount);
    
    return `${symbol}${formatted}`;
  }
};

// Helper function to determine if decimals should be shown
export const shouldShowDecimalPlaces = (currency: string, amount: number): boolean => {
  switch (currency) {
    case "INR":
      // For INR, don't show decimals for whole numbers or large amounts
      return amount < 1000 && amount % 1 !== 0;
    case "JPY":
    case "KRW":
      // These currencies typically don't use decimal places
      return false;
    default:
      return true;
  }
};

// Format currency for large amounts (like dashboard metrics)
export const formatCurrencyLarge = (
  amount: number,
  userSettings?: UserSettings | null
): string => {
  const currency = userSettings?.currency || "USD";
  
  // For INR, don't use K suffix and show full amount with Indian numbering
  if (currency === "INR") {
    return formatCurrencyIndian(amount, userSettings);
  }
  
  // For other currencies, use K suffix for thousands
  if (amount >= 1000) {
    return `${formatCurrency(Math.round(amount / 1000), userSettings)}K`;
  }
  
  return formatCurrency(amount, userSettings);
};

// Format currency using Indian numbering system (lakhs, crores)
export const formatCurrencyIndian = (
  amount: number,
  userSettings?: UserSettings | null
): string => {
  const currency = userSettings?.currency || "USD";
  const symbol = userSettings?.currencySymbol || getCurrencySymbol(currency);
  
  if (isNaN(amount)) return `${symbol}0`;
  
  // Use Indian locale for proper comma placement
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  
  // Replace ₹ with user's preferred symbol
  return formatted.replace('₹', symbol);
};

// Helper function to get locale based on currency
export const getLocaleForCurrency = (currency: string): string => {
  switch (currency) {
    case "USD":
    case "CAD":
    case "AUD":
      return "en-US";
    case "EUR":
      return "en-GB";
    case "GBP":
      return "en-GB";
    case "JPY":
      return "ja-JP";
    case "CNY":
      return "zh-CN";
    case "CHF":
      return "de-CH";
    case "INR":
      return "en-IN";
    default:
      return "en-US";
  }
};

export const formatDate = (
  date: string | number | Date,
  userSettings?: UserSettings | null
): string => {
  const dateObj = new Date(date);
  const format = userSettings?.dateFormat || "MM/DD/YYYY";
  
  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const year = dateObj.getFullYear();
  
  switch (format) {
    case "DD/MM/YYYY":
      return `${day}/${month}/${year}`;
    case "YYYY-MM-DD":
      return `${year}-${month}-${day}`;
    case "MM/DD/YYYY":
    default:
      return `${month}/${day}/${year}`;
  }
};