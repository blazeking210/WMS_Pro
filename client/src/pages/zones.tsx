import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { insertZoneSchema, type Zone } from "@shared/schema";
import { z } from "zod";
import { Edit, Trash2, Plus, MapPin } from "lucide-react";

const zoneFormSchema = insertZoneSchema.extend({
  capacity: z.coerce.number().min(0).optional(),
});

type ZoneFormData = z.infer<typeof zoneFormSchema>;

export default function Zones() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);

  const { data: zones, isLoading: zonesLoading } = useQuery({
    queryKey: ["/api/zones"],
    retry: false,
  });

  const { data: products } = useQuery({
    queryKey: ["/api/products"],
    retry: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ZoneFormData>({
    resolver: zodResolver(zoneFormSchema),
    defaultValues: {
      capacity: 0,
    },
  });

  const createZoneMutation = useMutation({
    mutationFn: async (data: ZoneFormData) => {
      await apiRequest("POST", "/api/zones", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Zone created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/zones"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      setIsDialogOpen(false);
      reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create zone",
        variant: "destructive",
      });
    },
  });

  const updateZoneMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ZoneFormData }) => {
      await apiRequest("PUT", `/api/zones/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Zone updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/zones"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      setIsDialogOpen(false);
      setEditingZone(null);
      reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update zone",
        variant: "destructive",
      });
    },
  });

  const deleteZoneMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/zones/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Zone deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/zones"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete zone",
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

  const handleEdit = (zone: Zone) => {
    setEditingZone(zone);
    reset({
      name: zone.name,
      description: zone.description || "",
      capacity: zone.capacity || 0,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this zone?")) {
      deleteZoneMutation.mutate(id);
    }
  };

  const onSubmit = (data: ZoneFormData) => {
    if (editingZone) {
      updateZoneMutation.mutate({ id: editingZone.id, data });
    } else {
      createZoneMutation.mutate(data);
    }
  };

  if (isLoading || zonesLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
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
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Zone Management</h2>
              <p className="text-gray-600 mt-1">Manage warehouse zones and locations</p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="warehouse-secondary"
                  onClick={() => {
                    setEditingZone(null);
                    reset({
                      name: "",
                      description: "",
                      capacity: 0,
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Zone
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingZone ? "Edit Zone" : "Add New Zone"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Zone Name</Label>
                    <Input
                      id="name"
                      {...register("name")}
                      placeholder="e.g., Zone A"
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      {...register("description")}
                      placeholder="Zone description..."
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      {...register("capacity")}
                      placeholder="0"
                    />
                    {errors.capacity && (
                      <p className="text-sm text-red-600 mt-1">{errors.capacity.message}</p>
                    )}
                  </div>
                  
                  <div className="flex gap-4 pt-4">
                    <Button
                      type="submit"
                      disabled={createZoneMutation.isPending || updateZoneMutation.isPending}
                      className="warehouse-secondary"
                    >
                      {createZoneMutation.isPending || updateZoneMutation.isPending
                        ? "Saving..."
                        : editingZone
                        ? "Update Zone"
                        : "Create Zone"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {zones?.map((zone) => (
              <Card key={zone.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 text-blue-600 mr-2" />
                      <CardTitle className="text-lg">{zone.name}</CardTitle>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(zone)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(zone.id)}
                        disabled={deleteZoneMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-3">
                    {zone.description || "No description"}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Capacity:</span>
                    <span className="font-medium">{zone.capacity || 0} items</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
