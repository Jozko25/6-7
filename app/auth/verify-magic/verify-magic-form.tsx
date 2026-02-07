"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Car, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function VerifyMagicForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      setStatus("error");
      setError("Invalid magic link. Please request a new one.");
      return;
    }

    // Immediately exchange the token via POST (more secure than GET)
    const verifyToken = async () => {
      try {
        const res = await fetch("/api/auth/magic/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, email }),
          credentials: "include",
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Verification failed");
        }

        setStatus("success");

        // Short delay to show success, then redirect
        setTimeout(() => {
          // Use replace to remove token from browser history
          router.replace("/admin");
        }, 1000);
      } catch (err: any) {
        setStatus("error");
        setError(err.message || "Failed to verify magic link");
      }
    };

    verifyToken();
  }, [searchParams, router]);

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
              {status === "loading" && (
                <>
                  <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Verifying...
                  </h2>
                  <p className="text-gray-600">
                    Please wait while we sign you in.
                  </p>
                </>
              )}

              {status === "success" && (
                <>
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Success!
                  </h2>
                  <p className="text-gray-600">
                    Redirecting to dashboard...
                  </p>
                </>
              )}

              {status === "error" && (
                <>
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Verification Failed
                  </h2>
                  <p className="text-gray-600 mb-6">{error}</p>
                  <Button asChild>
                    <Link href="/auth/login">Back to Login</Link>
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
