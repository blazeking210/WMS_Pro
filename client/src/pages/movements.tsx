import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ArrowUp, ArrowDown, Clock } from "lucide-react";

export default function Movements() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  const { data: movements, isLoading: movementsLoading } = useQuery({
    queryKey: ["/api/movements"],
    retry: false,
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading || movementsLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="bg-white rounded-lg shadow p-6">
                    <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Movement Logs</h2>
            <p className="text-gray-600 mt-1">Track all inventory movements and stock changes</p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Recent Movements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {movements?.map((movement) => (
                  <div key={movement.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          movement.type === "IN" ? "bg-green-100" : "bg-red-100"
                        }`}>
                          {movement.type === "IN" ? (
                            <ArrowUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <ArrowDown className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{movement.product.name}</h4>
                          <p className="text-sm text-gray-600">
                            {movement.type === "IN" ? "Added" : "Removed"} {movement.quantity} units
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={movement.type === "IN" ? "default" : "destructive"}>
                          {movement.type === "IN" ? "Stock In" : "Stock Out"}
                        </Badge>
                        <p className="text-sm text-gray-500 mt-1">
                          {format(new Date(movement.createdAt), "MMM d, yyyy HH:mm")}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
                      <span>
                        Stock: {movement.previousStock} → {movement.newStock}
                      </span>
                      {movement.reason && (
                        <span className="italic">Reason: {movement.reason}</span>
                      )}
                    </div>
                  </div>
                ))}
                
                {!movements?.length && (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No movement history found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
