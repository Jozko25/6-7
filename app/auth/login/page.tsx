"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Car, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useState as useStateReact } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpToken, setTotpToken] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [needs2FA, setNeeds2FA] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        totpToken: totpToken || undefined,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "2FA_REQUIRED") {
          setNeeds2FA(true);
          setError("Please enter your 2FA code");
        } else {
          setError(result.error);
        }
      } else if (result?.ok) {
        router.push("/admin");
        router.refresh();
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/magic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to send magic link");
      }
      setMagicSent(true);
      toast({
        title: "Check your email",
        description: "We sent a sign-in link that expires in 15 minutes.",
      });
    } catch (err: any) {
      setError(err.message || "Failed to send magic link");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center">
            <Car className="h-12 w-12 text-blue-600" />
            <span className="ml-2 text-2xl font-bold text-gray-900">
              Car Company
            </span>
          </Link>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Admin Login</CardTitle>
            <CardDescription className="text-center">
              Sign in to access the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Password login */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>

              {needs2FA && (
                <div className="space-y-2">
                  <label htmlFor="totpToken" className="text-sm font-medium text-gray-700">
                    2FA Code
                  </label>
                  <Input
                    id="totpToken"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={totpToken}
                    onChange={(e) => setTotpToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    disabled={isLoading}
                    autoComplete="one-time-code"
                  />
                  <p className="text-xs text-gray-500">
                    Enter the 6-digit code from your authenticator app
                  </p>
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">or</span>
              </div>
            </div>

            {/* Magic link login */}
            <form onSubmit={handleMagicLink} className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700" htmlFor="magic-email">
                  Email for magic link
                </label>
                <Input
                  id="magic-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" variant="outline" disabled={isLoading}>
                {magicSent ? "Link sent — check email" : "Send magic sign-in link"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Forgot password?{" "}
              <Link className="text-primary underline" href="/auth/forgot">
                Reset it
              </Link>
            </p>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm font-medium text-blue-900 mb-2">
                Demo Credentials:
              </p>
              <div className="text-xs text-blue-800 space-y-1 font-mono">
                <p>Email: admin@example.com</p>
                <p>Password: Admin123!</p>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
                ← Back to home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
