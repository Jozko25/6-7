"use client";

import { Suspense } from "react";
import { SetupPasswordForm } from "./setup-password-form";
import { Card, CardContent } from "@/components/ui/card";
import { Car, Loader2 } from "lucide-react";
import Link from "next/link";

function LoadingFallback() {
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
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 text-blue-600 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SetupPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SetupPasswordForm />
    </Suspense>
  );
}
