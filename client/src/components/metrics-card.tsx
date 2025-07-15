import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Package, AlertTriangle, AlertCircle, DollarSign } from "lucide-react";

interface MetricsCardProps {
  title: string;
  value: string | number;
  icon: "package" | "warning" | "alert" | "dollar";
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "warning" | "danger" | "success";
}

const iconMap = {
  package: Package,
  warning: AlertTriangle,
  alert: AlertCircle,
  dollar: DollarSign,
};

const variantStyles = {
  default: "bg-blue-50 text-blue-600",
  warning: "bg-yellow-50 text-yellow-600",
  danger: "bg-red-50 text-red-600",
  success: "bg-green-50 text-green-600",
};

export default function MetricsCard({ title, value, icon, trend, variant = "default" }: MetricsCardProps) {
  const Icon = iconMap[icon];
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={`p-3 rounded-full ${variantStyles[variant]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
        
        {trend && (
          <div className="mt-4 flex items-center">
            {trend.isPositive ? (
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
            )}
            <span className={`text-sm font-medium ${trend.isPositive ? "text-green-600" : "text-red-600"}`}>
              {trend.isPositive ? "+" : ""}{trend.value}
            </span>
            <span className="text-sm text-gray-500 ml-2">from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
