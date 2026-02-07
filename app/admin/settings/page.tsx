"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { toast } = useToast();
  const { data } = trpc.auth.get2FAStatus.useQuery();
  const [token, setToken] = useState("");
  const setupMutation = trpc.auth.setup2FA.useMutation({
    onSuccess: () => toast({ title: "Scan the QR", description: "Scan the QR with Google Authenticator then enter the 6-digit code." }),
    onError: (e) => toast({ title: "Setup failed", description: e.message, variant: "destructive" }),
  });
  const enableMutation = trpc.auth.enable2FA.useMutation({
    onSuccess: () => toast({ title: "2FA enabled" }),
    onError: (e) => toast({ title: "Enable failed", description: e.message, variant: "destructive" }),
  });
  const disableMutation = trpc.auth.disable2FA.useMutation({
    onSuccess: () => toast({ title: "2FA disabled" }),
    onError: (e) => toast({ title: "Disable failed", description: e.message, variant: "destructive" }),
  });

  const [qr, setQr] = useState<string | null>(null);

  const handleSetup = async () => {
    const res = await setupMutation.mutateAsync();
    setQr(res.qrCode);
  };

  const handleEnable = async () => {
    await enableMutation.mutateAsync({ token });
    setToken("");
  };

  const handleDisable = async () => {
    await disableMutation.mutateAsync({ token });
    setToken("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Security and authentication settings
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Two-factor authentication (TOTP)</CardTitle>
            <CardDescription>Protect your account with Google Authenticator or similar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Status: {data?.enabled ? "Enabled" : "Disabled"}
            </div>
            {!data?.enabled ? (
              <>
                <Button onClick={handleSetup} disabled={setupMutation.isPending}>
                  {setupMutation.isPending ? "Generating..." : "Generate QR"}
                </Button>
                {qr && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">Scan this QR with your authenticator app, then enter the 6-digit code:</p>
                    <div className="border rounded-md p-3 bg-white inline-block">
                      <img src={qr} alt="2FA QR" className="h-48 w-48 object-contain" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground" htmlFor="token">6-digit code</label>
                      <Input
                        id="token"
                        inputMode="numeric"
                        maxLength={6}
                        value={token}
                        onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      />
                    </div>
                    <Button onClick={handleEnable} disabled={enableMutation.isPending || token.length !== 6}>
                      {enableMutation.isPending ? "Enabling..." : "Enable 2FA"}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  To disable, enter a current 6-digit code from your authenticator app.
                </p>
                <Input
                  inputMode="numeric"
                  maxLength={6}
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                />
                <Button variant="outline" onClick={handleDisable} disabled={disableMutation.isPending || token.length !== 6}>
                  {disableMutation.isPending ? "Disabling..." : "Disable 2FA"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Passwordless (magic link)</CardTitle>
            <CardDescription>Users can sign in with an email link instead of a password.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            Already enabled via Email provider. Nothing to configure here beyond setting `RESEND_API_KEY` and `EMAIL_FROM`.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
