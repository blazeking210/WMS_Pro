import { Zone } from "@shared/schema";
import { Warehouse } from "lucide-react";

interface ZoneStatusProps {
  zone: Zone & { itemCount: number };
}

export default function ZoneStatus({ zone }: ZoneStatusProps) {
  const getUtilizationPercentage = () => {
    if (!zone.capacity || zone.capacity === 0) return 0;
    return Math.min((zone.itemCount / zone.capacity) * 100, 100);
  };

  const getUtilizationColor = () => {
    const percentage = getUtilizationPercentage();
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
          <Warehouse className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <p className="font-medium text-gray-900">{zone.name}</p>
          <p className="text-sm text-gray-500">{zone.description || "No description"}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-gray-900">{zone.itemCount} items</p>
        <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
          <div 
            className={`h-2 rounded-full ${getUtilizationColor()}`}
            style={{ width: `${getUtilizationPercentage()}%` }}
          />
        </div>
      </div>
    </div>
  );
}
