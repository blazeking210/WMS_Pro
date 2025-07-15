import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { insertProductSchema } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

const productFormSchema = insertProductSchema.extend({
  unitPrice: z.coerce.number().min(0).optional(),
  currentStock: z.coerce.number().min(0).optional(),
  minStock: z.coerce.number().min(0).optional(),
  zoneId: z.coerce.number().optional(),
});

type ProductFormData = z.infer<typeof productFormSchema>;

interface AddProductModalProps {
  trigger?: React.ReactNode;
}

export default function AddProductModal({ trigger }: AddProductModalProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: zones } = useQuery({
    queryKey: ["/api/zones"],
    retry: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
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
      setOpen(false);
      reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create product",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProductFormData) => {
    createProductMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="warehouse-secondary">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>
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
              <Label htmlFor="unitPrice">Unit Price</Label>
              <Input
                id="unitPrice"
                type="number"
                step="0.01"
                {...register("unitPrice")}
                placeholder="0.00"
              />
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
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
