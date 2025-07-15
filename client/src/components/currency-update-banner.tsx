import { useCurrency } from "@/contexts/CurrencyContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export default function CurrencyUpdateBanner() {
  const { isUpdating } = useCurrency();

  if (!isUpdating) return null;

  return (
    <Alert className="border-blue-200 bg-blue-50 text-blue-900 mb-4">
      <Loader2 className="h-4 w-4 animate-spin" />
      <AlertDescription>
        Updating currency settings across the application...
      </AlertDescription>
    </Alert>
  );
}