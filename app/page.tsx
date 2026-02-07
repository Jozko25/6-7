"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";
import { Car, Shield, Users, ArrowRight } from "lucide-react";

export default function HomePage() {
  const { data } = trpc.vehicles.getAll.useQuery({
    status: "AVAILABLE",
    limit: 3,
  });

  const featuredVehicles = data?.vehicles || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Car className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                Car Company
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/vehicles">
                <Button variant="ghost">Browse Vehicles</Button>
              </Link>
              <Link href="/admin">
                <Button>Admin Panel</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
            Find Your Perfect <span className="text-blue-600">Vehicle</span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
            Production-ready white-label car company platform with advanced
            security, 2FA authentication, and role-based access control.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link href="/vehicles">
              <Button size="lg" className="text-lg">
                Browse Vehicles
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/admin">
              <Button size="lg" variant="outline" className="text-lg">
                Admin Login
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Platform Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-blue-600 mb-2" />
              <CardTitle>Enterprise Security</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                2FA authentication, rate limiting, OWASP Top 10 protection, and
                comprehensive security headers.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-blue-600 mb-2" />
              <CardTitle>Role-Based Access</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Granular permissions with ADMIN, MANAGER, and VIEWER roles for
                complete control.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Car className="h-10 w-10 text-blue-600 mb-2" />
              <CardTitle>Vehicle Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Comprehensive inventory management with image uploads, status
                tracking, and audit logs.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Featured Vehicles */}
      {featuredVehicles.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Featured Vehicles
            </h2>
            <Link href="/vehicles">
              <Button variant="outline">View All</Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredVehicles.map((vehicle) => (
              <Card key={vehicle.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gray-200 relative">
                  {vehicle.images.length > 0 ? (
                    <img
                      src={vehicle.images[0]}
                      alt={`${vehicle.make} ${vehicle.model}`}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Car className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </CardTitle>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-2xl font-bold text-blue-600">
                      ${Number(vehicle.price).toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500">
                      {vehicle.mileage.toLocaleString()} mi
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                    {vehicle.description}
                  </p>
                  <Link href={`/vehicles/${vehicle.id}`}>
                    <Button className="w-full">View Details</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Car className="h-8 w-8 text-blue-500" />
              <span className="ml-2 text-xl font-bold">Car Company</span>
            </div>
            <p className="text-gray-400">
              Production-ready white-label car company platform
            </p>
            <p className="text-gray-500 text-sm mt-4">
              © 2024 Car Company. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
