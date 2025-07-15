import { MovementWithProduct } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { Plus, Minus, CheckCircle, AlertTriangle } from "lucide-react";

interface ActivityItemProps {
  movement: MovementWithProduct;
}

export default function ActivityItem({ movement }: ActivityItemProps) {
  const getIcon = () => {
    switch (movement.type) {
      case "IN":
        return <Plus className="h-4 w-4 text-white" />;
      case "OUT":
        return <Minus className="h-4 w-4 text-white" />;
      default:
        return <CheckCircle className="h-4 w-4 text-white" />;
    }
  };

  const getIconBgColor = () => {
    switch (movement.type) {
      case "IN":
        return "bg-blue-600";
      case "OUT":
        return "bg-yellow-600";
      default:
        return "bg-green-600";
    }
  };

  const getActivityText = () => {
    const action = movement.type === "IN" ? "Added" : "Removed";
    return `${action} ${movement.quantity} units of ${movement.product.name}`;
  };

  return (
    <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getIconBgColor()}`}>
        {getIcon()}
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-900">{getActivityText()}</p>
        <p className="text-xs text-gray-500">
          {formatDistanceToNow(new Date(movement.createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}
