import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Package, 
  Plus, 
  MapPin, 
  Clock, 
  BarChart3, 
  Settings,
  User,
  Warehouse
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Add Product", href: "/add-product", icon: Plus },
  { name: "Zone Management", href: "/zones", icon: MapPin },
  { name: "Movement Logs", href: "/movements", icon: Clock },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Profile", href: "/profile", icon: User },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 bg-gray-800 text-white flex-shrink-0">
      <div className="p-6">
        <div className="flex items-center">
          <Warehouse className="h-8 w-8 mr-3" />
          <h1 className="text-xl font-bold">WMS Pro</h1>
        </div>
      </div>
      
      <nav className="mt-8">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link key={item.name} href={item.href}>
              <div className={cn(
                "flex items-center px-6 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200",
                isActive && "bg-gray-700 text-white"
              )}>
                <Icon className="h-5 w-5 mr-3" />
                {item.name}
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
