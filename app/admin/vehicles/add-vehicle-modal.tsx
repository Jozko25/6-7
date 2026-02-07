"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc/client";
import { createVehicleSchema, type CreateVehicleInput } from "@/lib/validators/vehicle";
import { X, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddVehicleModal({ isOpen, onClose, onSuccess }: AddVehicleModalProps) {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<CreateVehicleInput>({
    resolver: zodResolver(createVehicleSchema),
    defaultValues: {
      status: "AVAILABLE",
      images: [],
    },
  });

  const createMutation = trpc.vehicles.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Vehicle created",
        description: "The vehicle has been successfully added to your inventory.",
      });
      reset();
      setUploadedImages([]);
      onSuccess();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Failed to create vehicle",
        description: error.message || "An error occurred while creating the vehicle",
        variant: "destructive",
      });
    },
  });

  const getUploadUrlMutation = trpc.uploads.getUploadUrl.useMutation();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const { uploadUrl, fileUrl } = await getUploadUrlMutation.mutateAsync({
          fileName: file.name,
          contentType: file.type,
        });

        const uploadResponse = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
        }

        return fileUrl;
      });

      const urls = await Promise.all(uploadPromises);
      setUploadedImages((prev) => [...prev, ...urls]);
      toast({
        title: "Images uploaded",
        description: `Successfully uploaded ${urls.length} image(s)`,
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload images",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data: CreateVehicleInput) => {
    createMutation.mutate({
      ...data,
      images: uploadedImages,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent className="sm:max-w-[760px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Vehicle</DialogTitle>
          <DialogDescription>Enter vehicle details and upload images.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Make & Model */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="make">Make *</Label>
              <Input id="make" {...register("make")} placeholder="e.g. Tesla" />
              {errors.make && (
                <p className="text-sm text-red-600 mt-1">{errors.make.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="model">Model *</Label>
              <Input id="model" {...register("model")} placeholder="e.g. Model 3" />
              {errors.model && (
                <p className="text-sm text-red-600 mt-1">{errors.model.message}</p>
              )}
            </div>
          </div>

          {/* Year & Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="year">Year *</Label>
              <Input
                id="year"
                type="number"
                {...register("year", { valueAsNumber: true })}
                placeholder="e.g. 2024"
              />
              {errors.year && (
                <p className="text-sm text-red-600 mt-1">{errors.year.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="price">Price ($) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                {...register("price", { valueAsNumber: true })}
                placeholder="e.g. 42990"
              />
              {errors.price && (
                <p className="text-sm text-red-600 mt-1">{errors.price.message}</p>
              )}
            </div>
          </div>

          {/* Mileage & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mileage">Mileage (mi) *</Label>
              <Input
                id="mileage"
                type="number"
                {...register("mileage", { valueAsNumber: true })}
                placeholder="e.g. 1250"
              />
              {errors.mileage && (
                <p className="text-sm text-red-600 mt-1">{errors.mileage.message}</p>
              )}
            </div>
            <div>
              <Label>Status *</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AVAILABLE">Available</SelectItem>
                      <SelectItem value="RESERVED">Reserved</SelectItem>
                      <SelectItem value="SOLD">Sold</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Describe the vehicle features, condition, etc."
              rows={4}
            />
            {errors.description && (
              <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Image Upload */}
          <div>
            <Label>Images</Label>
            <div className="mt-2">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Click to upload vehicle images</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={isUploading}
                />
              </label>
            </div>

            {/* Image Preview */}
            {uploadedImages.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-4">
                {uploadedImages.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {isUploading && (
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Uploading images...
              </div>
            )}
          </div>

          {/* Error Message */}
          {createMutation.error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800">{createMutation.error.message}</p>
            </div>
          )}

          {/* Actions */}
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending || isUploading}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Add Vehicle"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
