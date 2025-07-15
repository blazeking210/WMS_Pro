import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { type InsertProduct, type ProductWithZone } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useCurrencyUpdates } from "@/hooks/useCurrencyUpdates";

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductWithZone | null;
}

export default function EditProductModal({ isOpen, onClose, product }: EditProductModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getCurrencySymbol, formatCurrency } = useCurrency();
  
  // Enable real-time currency updates
  useCurrencyUpdates();
  const [formData, setFormData] = useState({
    productId: '',
    name: '',
    description: '',
    category: '',
    zoneId: undefined as number | undefined,
    currentStock: 0,
    minStock: 0,
    unitPrice: 0,
    isActive: true,
  });

  const { data: zones, isLoading: zonesLoading, error: zonesError } = useQuery({
    queryKey: ["/api/zones"],
    queryFn: async () => {
      const response = await fetch("/api/zones");
      if (!response.ok) throw new Error("Failed to fetch zones");
      return response.json();
    },
  });

  // Debug logging
  useEffect(() => {
    if (isOpen) {
      console.log("EditProductModal opened with product:", product);
      console.log("Zones:", zones);
      console.log("Zones loading:", zonesLoading);
      console.log("Zones error:", zonesError);
    }
  }, [isOpen, product, zones, zonesLoading, zonesError]);

  const updateProductMutation = useMutation({
    mutationFn: async (data: Partial<InsertProduct>) => {
      const response = await fetch(`/api/products/${product?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to update product");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (product && isOpen) {
      setFormData({
        productId: product.productId,
        name: product.name,
        description: product.description || "",
        category: product.category,
        zoneId: product.zoneId || undefined,
        currentStock: product.currentStock,
        minStock: product.minStock,
        unitPrice: product.unitPrice || 0,
        isActive: product.isActive,
      });
    }
  }, [product, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProductMutation.mutate(formData);
  };

  const handleClose = () => {
    setFormData({
      productId: '',
      name: '',
      description: '',
      category: '',
      zoneId: undefined,
      currentStock: 0,
      minStock: 0,
      unitPrice: 0,
      isActive: true,
    });
    onClose();
  };

  if (!product) {
    return null;
  }

  if (zonesLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Product - {product.name}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Product - {product.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="productId">Product ID</Label>
            <Input
              id="productId"
              value={formData.productId}
              onChange={(e) => setFormData({...formData, productId: e.target.value})}
              placeholder="Enter product ID"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Enter product name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Enter product description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              placeholder="Enter category"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="zoneId">Zone ID</Label>
            <Input
              id="zoneId"
              type="number"
              value={formData.zoneId || ''}
              onChange={(e) => setFormData({...formData, zoneId: e.target.value ? parseInt(e.target.value) : undefined})}
              placeholder="Enter zone ID"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentStock">Current Stock</Label>
              <Input
                id="currentStock"
                type="number"
                min="0"
                value={formData.currentStock}
                onChange={(e) => setFormData({...formData, currentStock: parseInt(e.target.value) || 0})}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minStock">Min Stock</Label>
              <Input
                id="minStock"
                type="number"
                min="0"
                value={formData.minStock}
                onChange={(e) => setFormData({...formData, minStock: parseInt(e.target.value) || 0})}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitPrice">Unit Price ({getCurrencySymbol()})</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  {getCurrencySymbol()}
                </span>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({...formData, unitPrice: parseFloat(e.target.value) || 0})}
                  placeholder="0.00"
                  className="pl-8"
                />
              </div>
              <div className="text-sm text-gray-500">
                Preview: {formatCurrency(formData.unitPrice || 0)}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={() => updateProductMutation.mutate(formData)} disabled={updateProductMutation.isPending}>
              {updateProductMutation.isPending ? "Updating..." : "Update Product"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}