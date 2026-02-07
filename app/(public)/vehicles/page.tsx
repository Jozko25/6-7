"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc/client";
import { Car, Search } from "lucide-react";

export default function VehiclesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading } = trpc.vehicles.getAll.useQuery({
    status: "AVAILABLE",
    limit: 50,
  });

  const vehicles = data?.vehicles || [];

  const filteredVehicles = vehicles.filter((vehicle) => {
    const query = searchQuery.toLowerCase();
    return (
      vehicle.make.toLowerCase().includes(query) ||
      vehicle.model.toLowerCase().includes(query) ||
      vehicle.year.toString().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center">
              <Car className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                Car Company
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost">Home</Button>
              </Link>
              <Link href="/admin">
                <Button variant="outline">Admin Panel</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Browse Vehicles</h1>
          <p className="mt-2 text-gray-600">
            Find your perfect vehicle from our available inventory
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by make, model, or year..."
              className="pl-10 h-12 text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Vehicles Grid */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading vehicles...</p>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <Card className="py-20">
            <CardContent>
              <div className="text-center">
                <Car className="mx-auto h-16 w-16 text-gray-400" />
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  No vehicles found
                </h3>
                <p className="mt-2 text-gray-500">
                  {searchQuery
                    ? "Try adjusting your search query"
                    : "Check back later for new inventory"}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredVehicles.map((vehicle) => (
              <Card
                key={vehicle.id}
                className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
              >
                <div className="aspect-video bg-gray-200 relative">
                  {vehicle.images.length > 0 ? (
                    <img
                      src={vehicle.images[0]}
                      alt={`${vehicle.make} ${vehicle.model}`}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Car className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="text-xl">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </CardTitle>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-3xl font-bold text-blue-600">
                      ${Number(vehicle.price).toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      {vehicle.mileage.toLocaleString()} mi
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 line-clamp-3 mb-4">
                    {vehicle.description}
                  </p>
                  <Button className="w-full" size="lg">
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Results count */}
        {!isLoading && filteredVehicles.length > 0 && (
          <div className="mt-8 text-center text-gray-600">
            Showing {filteredVehicles.length} vehicle
            {filteredVehicles.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}
