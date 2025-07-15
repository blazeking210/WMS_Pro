import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Warehouse, BarChart3, Package, MapPin, Clock, Shield } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Warehouse className="h-16 w-16 text-blue-600 mr-4" />
            <h1 className="text-5xl font-bold text-gray-900">WMS Pro</h1>
          </div>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Comprehensive warehouse management system for efficient inventory tracking, 
            stock control, and real-time monitoring of your warehouse operations.
          </p>
          <Button 
            size="lg" 
            className="warehouse-secondary"
            onClick={() => window.location.href = "/api/login"}
          >
            Get Started
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <Package className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Inventory Management</CardTitle>
              <CardDescription>
                Track stock levels, manage product information, and get real-time inventory updates
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <MapPin className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle>Zone Management</CardTitle>
              <CardDescription>
                Organize your warehouse into zones and track product locations efficiently
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-8 w-8 text-purple-600 mb-2" />
              <CardTitle>Analytics & Reports</CardTitle>
              <CardDescription>
                Get insights into your warehouse performance with detailed reports and analytics
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Clock className="h-8 w-8 text-orange-600 mb-2" />
              <CardTitle>Real-time Tracking</CardTitle>
              <CardDescription>
                Monitor stock movements and get instant alerts for low stock items
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 text-red-600 mb-2" />
              <CardTitle>Secure Access</CardTitle>
              <CardDescription>
                Role-based access control to ensure data security and user management
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Warehouse className="h-8 w-8 text-indigo-600 mb-2" />
              <CardTitle>Multi-location Support</CardTitle>
              <CardDescription>
                Manage multiple warehouses and locations from a single dashboard
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to optimize your warehouse?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of businesses already using WMS Pro to streamline their operations
          </p>
          <Button 
            size="lg" 
            className="warehouse-secondary"
            onClick={() => window.location.href = "/api/login"}
          >
            Sign In to Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
