import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ProductWithZone } from "@shared/schema";
import { ArrowUp, ArrowDown } from "lucide-react";

const stockMovementSchema = z.object({
  type: z.enum(["IN", "OUT"]),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  reason: z.string().min(1, "Reason is required"),
});

type StockMovementForm = z.infer<typeof stockMovementSchema>;

interface StockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductWithZone | null;
}

export default function StockMovementModal({ isOpen, onClose, product }: StockMovementModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<StockMovementForm>({
    resolver: zodResolver(stockMovementSchema),
    defaultValues: {
      type: "IN",
      quantity: 1,
      reason: "",
    },
  });

  const stockMovementMutation = useMutation({
    mutationFn: async (data: StockMovementForm) => {
      if (!product) throw new Error("No product selected");
      
      const response = await fetch(`/api/products/${product.id}/stock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update stock");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/movements"] });
      toast({
        title: "Success",
        description: "Stock updated successfully",
      });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = (data: StockMovementForm) => {
    stockMovementMutation.mutate(data);
  };

  const movementType = watch("type");
  const quantity = watch("quantity");

  const getNewStock = () => {
    if (!product || !quantity) return product?.currentStock || 0;
    return movementType === "IN" 
      ? (product.currentStock || 0) + quantity
      : (product.currentStock || 0) - quantity;
  };

  const willBeNegative = getNewStock() < 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Stock - {product?.name}</DialogTitle>
        </DialogHeader>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Product ID:</span> {product?.productId}
            </div>
            <div>
              <span className="font-medium">Current Stock:</span> {product?.currentStock || 0}
            </div>
            <div>
              <span className="font-medium">Min Stock:</span> {product?.minStock || 0}
            </div>
            <div>
              <span className="font-medium">Zone:</span> {product?.zone?.name || "No zone"}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Movement Type</Label>
            <Select
              value={watch("type")}
              onValueChange={(value: "IN" | "OUT") => setValue("type", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IN">
                  <div className="flex items-center">
                    <ArrowUp className="h-4 w-4 mr-2 text-green-600" />
                    Stock In (Add)
                  </div>
                </SelectItem>
                <SelectItem value="OUT">
                  <div className="flex items-center">
                    <ArrowDown className="h-4 w-4 mr-2 text-red-600" />
                    Stock Out (Remove)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              {...register("quantity")}
              placeholder="Enter quantity"
            />
            {errors.quantity && (
              <p className="text-sm text-red-600">{errors.quantity.message}</p>
            )}
            {willBeNegative && (
              <p className="text-sm text-red-600">
                Warning: This will result in negative stock ({getNewStock()})
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              {...register("reason")}
              placeholder="Enter reason for stock movement"
              rows={3}
            />
            {errors.reason && (
              <p className="text-sm text-red-600">{errors.reason.message}</p>
            )}
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm font-medium mb-1">Preview:</p>
            <div className="text-sm text-gray-600">
              Current: {product?.currentStock || 0} → New: {getNewStock()}
              <span className={`ml-2 ${getNewStock() < (product?.minStock || 0) ? 'text-red-600' : 'text-green-600'}`}>
                {getNewStock() < (product?.minStock || 0) ? '(Below minimum)' : '(Normal)'}
              </span>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={stockMovementMutation.isPending || willBeNegative}
              className={movementType === "IN" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {stockMovementMutation.isPending ? "Updating..." : `${movementType === "IN" ? "Add" : "Remove"} Stock`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}