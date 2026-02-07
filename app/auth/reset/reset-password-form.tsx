"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { toast } = useToast();

  const mutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      toast({ title: "Password updated", description: "You can now sign in with your new password." });
      router.push("/auth/login");
    },
    onError: (error) => {
      toast({ title: "Reset failed", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ token, password, confirmPassword });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Set a new password</CardTitle>
            <CardDescription className="text-center">
              Enter your new password. The link expires after 30 minutes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {token ? (
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="password">New password</label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="confirm">Confirm password</label>
                  <Input id="confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={mutation.isPending}>
                  {mutation.isPending ? "Saving..." : "Update password"}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">Reset link is missing or invalid.</p>
                <Link className="text-primary underline" href="/auth/forgot">Request a new link</Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
