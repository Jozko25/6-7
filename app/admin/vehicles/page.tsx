"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { AddVehicleModal } from "./add-vehicle-modal";
import { EditVehicleModal } from "./edit-vehicle-modal";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { useToast } from "@/hooks/use-toast";

export default function VehiclesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editVehicleId, setEditVehicleId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<{ id: string; name: string } | null>(null);
  const { toast } = useToast();

  // Fetch vehicles using tRPC
  const { data, isLoading, refetch } = trpc.vehicles.getAll.useQuery({
    limit: 50,
  });

  const deleteMutation = trpc.vehicles.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "Vehicle deleted",
        description: "The vehicle has been successfully deleted.",
      });
      refetch();
      setDeleteDialogOpen(false);
      setVehicleToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete vehicle",
        variant: "destructive",
      });
    },
  });

  const vehicles = data?.vehicles || [];

  const handleDeleteClick = (id: string, vehicleName: string) => {
    setVehicleToDelete({ id, name: vehicleName });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (vehicleToDelete) {
      deleteMutation.mutate({ id: vehicleToDelete.id });
    }
  };

  const filteredVehicles = vehicles.filter((vehicle) => {
    const query = searchQuery.toLowerCase();
    return (
      vehicle.make.toLowerCase().includes(query) ||
      vehicle.model.toLowerCase().includes(query) ||
      vehicle.year.toString().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Vehicles</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage your vehicle inventory
          </p>
        </div>
        <Button className="flex items-center" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Vehicle
        </Button>
      </div>

      {/* Add Vehicle Modal */}
      <AddVehicleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => refetch()}
      />

      {/* Edit Vehicle Modal */}
      {editVehicleId && (
        <EditVehicleModal
          isOpen={!!editVehicleId}
          onClose={() => setEditVehicleId(null)}
          onSuccess={() => refetch()}
          vehicleId={editVehicleId}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Vehicle"
        description={`Are you sure you want to delete ${vehicleToDelete?.name}? This action cannot be undone.`}
        isLoading={deleteMutation.isPending}
      />

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by make, model, or year..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline">Filter</Button>
          </div>
        </CardContent>
      </Card>

      {/* Vehicles Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading vehicles...</p>
        </div>
      ) : filteredVehicles.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-semibold text-foreground">
                No vehicles found
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get started by adding a new vehicle to your inventory.
              </p>
              <div className="mt-6">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Vehicle
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVehicles.map((vehicle) => (
            <Card key={vehicle.id} className="overflow-hidden transition-shadow hover:shadow-lg">
              <div className="aspect-video bg-muted/40 relative">
                {vehicle.images.length > 0 ? (
                  <img
                    src={vehicle.images[0]}
                    alt={`${vehicle.make} ${vehicle.model}`}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <svg
                      className="h-12 w-12 text-muted-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      vehicle.status === "AVAILABLE"
                        ? "bg-emerald-100 text-emerald-700"
                        : vehicle.status === "RESERVED"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {vehicle.status}
                  </span>
                </div>
              </div>
              <CardHeader>
                <CardTitle className="text-lg">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </CardTitle>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-2xl font-semibold text-slate-900">
                    ${Number(vehicle.price).toLocaleString()}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {vehicle.mileage.toLocaleString()} mi
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {vehicle.description}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(`/vehicles/${vehicle.id}`, '_blank')}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setEditVehicleId(vehicle.id)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(vehicle.id, `${vehicle.year} ${vehicle.make} ${vehicle.model}`)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
