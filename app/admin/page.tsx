"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Users, ShieldCheck, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const stats = [
    {
      name: "Total Vehicles",
      value: "12",
      icon: Car,
      change: "+2 from last week",
      changeType: "positive",
    },
    {
      name: "Active Users",
      value: "3",
      icon: Users,
      change: "+1 this month",
      changeType: "positive",
    },
    {
      name: "Vehicles Sold",
      value: "5",
      icon: TrendingUp,
      change: "+3 this month",
      changeType: "positive",
    },
    {
      name: "Security Status",
      value: "Active",
      icon: ShieldCheck,
      change: "2FA Enabled",
      changeType: "neutral",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Welcome to your car company admin panel
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.name}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stat.value}
              </div>
              <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Vehicles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    2024 Tesla Model 3
                  </p>
                  <p className="text-xs text-gray-500">Added 2 days ago</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Available
                </span>
              </div>
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    2023 BMW X5
                  </p>
                  <p className="text-xs text-gray-500">Added 5 days ago</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Reserved
                </span>
              </div>
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    2022 Mercedes C-Class
                  </p>
                  <p className="text-xs text-gray-500">Added 1 week ago</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Sold
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <a
                href="/admin/vehicles?action=new"
                className="block p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center">
                  <Car className="h-5 w-5 text-blue-600" />
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    Add New Vehicle
                  </span>
                </div>
              </a>
              <a
                href="/admin/users"
                className="block p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    Manage Users
                  </span>
                </div>
              </a>
              <a
                href="/admin/settings"
                className="block p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center">
                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    Security Settings
                  </span>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
