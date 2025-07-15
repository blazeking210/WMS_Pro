import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateUserSettingsSchema, type UpdateUserSettings, type UserSettings } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Settings, User, Bell, Palette, Globe, DollarSign } from "lucide-react";
import { CURRENCY_OPTIONS } from "@/lib/currency";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useCurrencyUpdates } from "@/hooks/useCurrencyUpdates";
import CurrencyUpdateBanner from "@/components/currency-update-banner";

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { refreshSettings, isUpdating } = useCurrency();
  const { triggerCurrencyUpdate } = useCurrencyUpdates();

  const { data: userSettings, isLoading } = useQuery<UserSettings>({
    queryKey: ["userSettings"],
    queryFn: async () => {
      const response = await fetch("/api/user/settings");
      if (!response.ok) {
        throw new Error("Failed to fetch user settings");
      }
      return response.json();
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: UpdateUserSettings) => {
      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });
      if (!response.ok) {
        throw new Error("Failed to update settings");
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all queries that might use user settings
      queryClient.invalidateQueries({ queryKey: ["userSettings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/movements"] });
      
      // Force refetch of settings to ensure immediate update
      queryClient.refetchQueries({ queryKey: ["userSettings"] });
      
      // Also refresh currency context and trigger updates across all tabs
      refreshSettings();
      triggerCurrencyUpdate();
      
      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UpdateUserSettings>({
    resolver: zodResolver(updateUserSettingsSchema),
    defaultValues: userSettings,
  });

  useEffect(() => {
    if (userSettings) {
      Object.entries(userSettings).forEach(([key, value]) => {
        setValue(key as keyof UpdateUserSettings, value);
      });
    }
  }, [userSettings, setValue]);

  const watchedValues = watch();

  const onSubmit = (data: UpdateUserSettings) => {
    updateSettingsMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Settings
        </h1>
        <p className="text-gray-600 mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <CurrencyUpdateBanner />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Currency & Format Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Currency & Format
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={watchedValues.currency || "USD"}
                  onValueChange={(value) => {
                    setValue("currency", value as any);
                    const selectedCurrency = CURRENCY_OPTIONS.find(c => c.value === value);
                    if (selectedCurrency) {
                      setValue("currencySymbol", selectedCurrency.symbol);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.currency && (
                  <p className="text-sm text-red-600">{errors.currency.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateFormat">Date Format</Label>
                <Select
                  value={watchedValues.dateFormat || "MM/DD/YYYY"}
                  onValueChange={(value) => setValue("dateFormat", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select date format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={watchedValues.timezone || "UTC"}
                  onValueChange={(value) => setValue("timezone", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    <SelectItem value="Europe/London">London</SelectItem>
                    <SelectItem value="Europe/Paris">Paris</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                    <SelectItem value="Asia/Shanghai">Shanghai</SelectItem>
                    <SelectItem value="Asia/Kolkata">Mumbai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select
                  value={watchedValues.theme || "light"}
                  onValueChange={(value) => setValue("theme", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select
                  value={watchedValues.language || "en"}
                  onValueChange={(value) => setValue("language", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="ja">Japanese</SelectItem>
                    <SelectItem value="zh">Chinese</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">Push Notifications</Label>
                  <div className="text-sm text-gray-500">
                    Receive notifications in the app
                  </div>
                </div>
                <Switch
                  id="notifications"
                  checked={watchedValues.notifications === 1}
                  onCheckedChange={(checked) => setValue("notifications", checked ? 1 : 0)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <div className="text-sm text-gray-500">
                    Receive notifications via email
                  </div>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={watchedValues.emailNotifications === 1}
                  onCheckedChange={(checked) => setValue("emailNotifications", checked ? 1 : 0)}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  min="1"
                  max="1000"
                  value={watchedValues.lowStockThreshold || 10}
                  onChange={(e) => setValue("lowStockThreshold", parseInt(e.target.value) || 10)}
                />
                <div className="text-sm text-gray-500">
                  Alert when stock falls below this number
                </div>
                {errors.lowStockThreshold && (
                  <p className="text-sm text-red-600">{errors.lowStockThreshold.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Currency Format</h4>
                <div className="text-sm text-gray-600">
                  {CURRENCY_OPTIONS.find(c => c.value === watchedValues.currency)?.symbol || "$"}1,234.56
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Example: Large amount would show as {CURRENCY_OPTIONS.find(c => c.value === watchedValues.currency)?.symbol || "$"}123,456.78
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Date Format</h4>
                <div className="text-sm text-gray-600">
                  {(() => {
                    const format = watchedValues.dateFormat || "MM/DD/YYYY";
                    const now = new Date();
                    const day = String(now.getDate()).padStart(2, "0");
                    const month = String(now.getMonth() + 1).padStart(2, "0");
                    const year = now.getFullYear();
                    
                    switch (format) {
                      case "DD/MM/YYYY":
                        return `${day}/${month}/${year}`;
                      case "YYYY-MM-DD":
                        return `${year}-${month}-${day}`;
                      case "MM/DD/YYYY":
                      default:
                        return `${month}/${day}/${year}`;
                    }
                  })()}
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Theme</h4>
                <div className="text-sm text-gray-600 capitalize">
                  {watchedValues.theme || "light"}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={updateSettingsMutation.isPending || isUpdating}
            className="px-8"
          >
            {updateSettingsMutation.isPending || isUpdating ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}