"use client";

import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, MapPin, Calendar, Gauge, DollarSign } from "lucide-react";
import Link from "next/link";

export default function VehicleDetailPage() {
  const params = useParams();
  const vehicleId = params.id as string;

  const { data: vehicle, isLoading } = trpc.vehicles.getById.useQuery({
    id: vehicleId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading vehicle details...</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Vehicle Not Found</h2>
            <p className="text-gray-600 mb-6">
              The vehicle you're looking for doesn't exist or has been removed.
            </p>
            <Link href="/">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusColors = {
    AVAILABLE: "bg-green-100 text-green-800",
    SOLD: "bg-red-100 text-red-800",
    RESERVED: "bg-yellow-100 text-yellow-800",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Vehicles
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images */}
          <div className="lg:col-span-2 space-y-4">
            {/* Main Image */}
            {vehicle.images.length > 0 ? (
              <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                <img
                  src={vehicle.images[0]}
                  alt={`${vehicle.make} ${vehicle.model}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                <svg
                  className="h-24 w-24 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}

            {/* Thumbnail Gallery */}
            {vehicle.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {vehicle.images.slice(1).map((image, index) => (
                  <div
                    key={index}
                    className="aspect-video bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:opacity-75 transition-opacity"
                  >
                    <img
                      src={image}
                      alt={`${vehicle.make} ${vehicle.model} - Image ${index + 2}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Description */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-600 whitespace-pre-wrap">{vehicle.description}</p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                {/* Status Badge */}
                <div className="mb-4">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      statusColors[vehicle.status]
                    }`}
                  >
                    {vehicle.status}
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h1>

                {/* Price */}
                <div className="flex items-center mb-6">
                  <DollarSign className="h-8 w-8 text-blue-600" />
                  <span className="text-4xl font-bold text-blue-600">
                    {Number(vehicle.price).toLocaleString()}
                  </span>
                </div>

                {/* Key Details */}
                <div className="space-y-4 border-t pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-5 w-5 mr-2" />
                      <span className="font-medium">Year</span>
                    </div>
                    <span className="text-gray-900 font-semibold">{vehicle.year}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-600">
                      <Gauge className="h-5 w-5 mr-2" />
                      <span className="font-medium">Mileage</span>
                    </div>
                    <span className="text-gray-900 font-semibold">
                      {vehicle.mileage.toLocaleString()} mi
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-5 w-5 mr-2" />
                      <span className="font-medium">Make</span>
                    </div>
                    <span className="text-gray-900 font-semibold">{vehicle.make}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-5 w-5 mr-2" />
                      <span className="font-medium">Model</span>
                    </div>
                    <span className="text-gray-900 font-semibold">{vehicle.model}</span>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="mt-6 space-y-3">
                  <Button className="w-full" size="lg">
                    Contact Seller
                  </Button>
                  <Button variant="outline" className="w-full" size="lg">
                    Schedule Test Drive
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Additional Info */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Vehicle ID</h3>
                <p className="text-sm text-gray-600 font-mono break-all">{vehicle.id}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
