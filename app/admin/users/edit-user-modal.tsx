"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { updateUserSchema, type UpdateUserInput } from "@/lib/validators/user";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

export function EditUserModal({ isOpen, onClose, onSuccess, userId }: EditUserModalProps) {
  const { toast } = useToast();

  const { data: user, isLoading } = trpc.users.getById.useQuery(
    { id: userId },
    { enabled: isOpen }
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setValue,
  } = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
  });

  useEffect(() => {
    if (user) {
      setValue("name", user.name ?? "");
      setValue("email", user.email);
      setValue("role", user.role);
      setValue("twoFactorEnabled", user.twoFactorEnabled ?? false);
    }
  }, [user, setValue]);

  const updateMutation = trpc.users.update.useMutation({
    onSuccess: () => {
      toast({
        title: "User updated",
        description: "The user has been successfully updated.",
      });
      reset();
      onSuccess();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Failed to update user",
        description: error.message || "An error occurred while updating the user",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UpdateUserInput) => {
    const payload = { ...data } as UpdateUserInput;
    if (payload.name === "") {
      delete payload.name;
    }
    if (payload.email === "") {
      delete payload.email;
    }
    if (!payload.password) {
      delete payload.password;
    }

    updateMutation.mutate({
      id: userId,
      data: payload,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Update user details, role, or password.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-10 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Loading user...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register("name")} placeholder="Jane Doe" />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="jane@example.com"
              />
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                placeholder="Leave blank to keep current password"
              />
              {errors.password && (
                <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
              )}
            </div>

            <div>
              <Label>Role</Label>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="VIEWER">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.role && (
                <p className="text-sm text-red-600 mt-1">{errors.role.message}</p>
              )}
            </div>

            {updateMutation.error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800">{updateMutation.error.message}</p>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
