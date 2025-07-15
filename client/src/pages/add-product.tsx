import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { insertProductSchema } from "@shared/schema";
import { z } from "zod";
import { useLocation } from "wouter";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useCurrencyUpdates } from "@/hooks/useCurrencyUpdates";

const productFormSchema = insertProductSchema.extend({
  unitPrice: z.coerce.number().min(0).optional(),
  currentStock: z.coerce.number().min(0).optional(),
  minStock: z.coerce.number().min(0).optional(),
  zoneId: z.coerce.number().optional(),
});

type ProductFormData = z.infer<typeof productFormSchema>;

export default function AddProduct() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { getCurrencySymbol, formatCurrency } = useCurrency();
  
  // Enable real-time currency updates
  useCurrencyUpdates();

  const { data: zones } = useQuery({
    queryKey: ["/api/zones"],
    retry: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      currentStock: 0,
      minStock: 0,
      unitPrice: 0,
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      await apiRequest("POST", "/api/products", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      setLocation("/inventory");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create product",
        variant: "destructive",
      });
    },
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

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const onSubmit = (data: ProductFormData) => {
    createProductMutation.mutate(data);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Add New Product</h2>
            <p className="text-gray-600 mt-1">Create a new product in your inventory</p>
          </div>
          
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="productId">Product ID</Label>
                    <Input
                      id="productId"
                      {...register("productId")}
                      placeholder="e.g., WH-001"
                    />
                    {errors.productId && (
                      <p className="text-sm text-red-600 mt-1">{errors.productId.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="name">Product Name</Label>
                    <Input
                      id="name"
                      {...register("name")}
                      placeholder="e.g., Wireless Keyboard"
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    {...register("category")}
                    placeholder="e.g., Electronics"
                  />
                  {errors.category && (
                    <p className="text-sm text-red-600 mt-1">{errors.category.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    placeholder="Product description..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="currentStock">Initial Stock</Label>
                    <Input
                      id="currentStock"
                      type="number"
                      {...register("currentStock")}
                      placeholder="0"
                    />
                    {errors.currentStock && (
                      <p className="text-sm text-red-600 mt-1">{errors.currentStock.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="minStock">Minimum Stock</Label>
                    <Input
                      id="minStock"
                      type="number"
                      {...register("minStock")}
                      placeholder="0"
                    />
                    {errors.minStock && (
                      <p className="text-sm text-red-600 mt-1">{errors.minStock.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="unitPrice">Unit Price ({getCurrencySymbol()})</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        {getCurrencySymbol()}
                      </span>
                      <Input
                        id="unitPrice"
                        type="number"
                        step="0.01"
                        {...register("unitPrice")}
                        placeholder="0.00"
                        className="pl-8"
                      />
                    </div>
                    {watch("unitPrice") && (
                      <div className="text-sm text-gray-500 mt-1">
                        Preview: {formatCurrency(watch("unitPrice") || 0)}
                      </div>
                    )}
                    {errors.unitPrice && (
                      <p className="text-sm text-red-600 mt-1">{errors.unitPrice.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="zoneId">Zone</Label>
                  <Select onValueChange={(value) => setValue("zoneId", parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {zones?.map((zone) => (
                        <SelectItem key={zone.id} value={zone.id.toString()}>
                          {zone.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.zoneId && (
                    <p className="text-sm text-red-600 mt-1">{errors.zoneId.message}</p>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={createProductMutation.isPending}
                    className="warehouse-secondary"
                  >
                    {createProductMutation.isPending ? "Creating..." : "Create Product"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/inventory")}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
