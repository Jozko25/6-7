"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Car, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";

export function SetupPasswordForm() {
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenData, setTokenData] = useState<{ token: string; email: string } | null>(null);

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  // Validate token on mount and store in state (removes from URL)
  useEffect(() => {
    // Skip if we already have token data (URL was replaced)
    if (tokenData) {
      return;
    }

    if (!token || !email) {
      setError("Invalid invitation link. Please request a new invitation.");
      setIsValidating(false);
      return;
    }

    // Store token data in state BEFORE validation
    setTokenData({ token, email });

    // Validate the token exists (without consuming it)
    const validateToken = async () => {
      try {
        const res = await fetch("/api/auth/validate-invitation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, email }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setTokenData(null); // Clear token data on error
          throw new Error(data.error || "Invalid invitation");
        }

        // Replace URL to remove token from browser history/referrer
        window.history.replaceState({}, "", "/auth/setup-password");
        setIsValidating(false);
      } catch (err: any) {
        setError(err.message || "Invalid or expired invitation link.");
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token, email, tokenData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!tokenData) {
      setError("Session expired. Please use the invitation link again.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/setup-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: tokenData.token,
          email: tokenData.email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to set password");
      }

      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center justify-center">
              <Car className="h-12 w-12 text-blue-600" />
              <span className="ml-2 text-2xl font-bold text-gray-900">
                Car Company
              </span>
            </Link>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Account Setup Complete!
                </h2>
                <p className="text-gray-600 mb-6">
                  Your password has been set. You can now sign in to your account.
                </p>
                <Button asChild className="w-full">
                  <Link href="/auth/login">Go to Login</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center">
            <Car className="h-12 w-12 text-blue-600" />
            <span className="ml-2 text-2xl font-bold text-gray-900">
              Car Company
            </span>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Set Up Your Account</CardTitle>
            <CardDescription className="text-center">
              Create a password to activate your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isValidating ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 text-blue-600 mx-auto mb-4 animate-spin" />
                <p className="text-gray-600">Validating invitation...</p>
              </div>
            ) : error && !tokenData ? (
              <div className="text-center py-4">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">{error}</p>
                <Button asChild variant="outline">
                  <Link href="/auth/login">Go to Login</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={tokenData?.email || ""}
                    disabled
                    className="bg-gray-50"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    required
                    minLength={8}
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                    minLength={8}
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-md">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    "Set Password & Activate Account"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
