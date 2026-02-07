"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Car, Users, Settings, Home, LogOut, ShieldAlert, ChevronUp, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Permission mapping for navigation items
const navigation = [
  { name: "Dashboard", href: "/admin", icon: Home, permission: null }, // Everyone can see dashboard
  { name: "Vehicles", href: "/admin/vehicles", icon: Car, permission: "vehicles:read" },
  { name: "Users", href: "/admin/users", icon: Users, permission: "users:read" },
  { name: "Settings", href: "/admin/settings", icon: Settings, permission: "settings:update" },
];

// Client-side permission check (mirrors server-side RBAC)
const rolePermissions: Record<string, string[]> = {
  ADMIN: [
    "vehicles:create", "vehicles:read", "vehicles:update", "vehicles:delete",
    "users:create", "users:read", "users:update", "users:delete",
    "settings:update",
  ],
  MANAGER: [
    "vehicles:create", "vehicles:read", "vehicles:update", "vehicles:delete",
  ],
  VIEWER: ["vehicles:read"],
};

function hasPermission(role: string | undefined, permission: string | null): boolean {
  if (!permission) return true; // No permission required
  if (!role) return false;
  return rolePermissions[role]?.includes(permission) ?? false;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const userRole = (session?.user as any)?.role as string | undefined;
  const userEmail = session?.user?.email || "Loading...";
  const userName = session?.user?.name || userEmail?.split("@")[0] || "User";
  const userInitial = userName.charAt(0).toUpperCase();

  // Filter navigation based on permissions
  const visibleNavigation = navigation.filter(item =>
    hasPermission(userRole, item.permission)
  );

  // Check if current page requires permission user doesn't have
  const currentNavItem = navigation.find(item =>
    pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
  );
  const hasAccessToCurrentPage = !currentNavItem || hasPermission(userRole, currentNavItem.permission);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200/80">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-slate-200/80">
            <Car className="h-8 w-8 text-slate-900" />
            <span className="ml-2 text-xl font-semibold tracking-tight text-slate-900">
              Car Admin
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {visibleNavigation.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User section with dropdown */}
          <div className="p-3 border-t border-slate-200/80">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200">
                  <div className="relative flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-semibold shadow-sm">
                      {userInitial}
                    </div>
                    <div className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white",
                      userRole === "ADMIN" && "bg-purple-500",
                      userRole === "MANAGER" && "bg-blue-500",
                      userRole === "VIEWER" && "bg-slate-400"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-slate-900 truncate">{userName}</p>
                    <p className="text-xs text-slate-500 truncate">{userEmail}</p>
                  </div>
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                className="w-56 mb-2"
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{userName}</p>
                    <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" disabled>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer gap-2">
                  <Shield className="h-4 w-4" />
                  <span>Role</span>
                  <span className={cn(
                    "ml-auto text-xs px-1.5 py-0.5 rounded-full",
                    userRole === "ADMIN" && "bg-purple-100 text-purple-700",
                    userRole === "MANAGER" && "bg-blue-100 text-blue-700",
                    userRole === "VIEWER" && "bg-slate-100 text-slate-700"
                  )}>
                    {userRole}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                  onClick={() => signOut({ callbackUrl: "/auth/login" })}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="py-6">
          <div className="mx-auto px-4 sm:px-6 lg:px-8">
            {status === "loading" ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
              </div>
            ) : !hasAccessToCurrentPage ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <ShieldAlert className="h-16 w-16 text-slate-400 mb-4" />
                <h2 className="text-xl font-semibold text-slate-900 mb-2">Access Denied</h2>
                <p className="text-slate-600 mb-4">
                  You don't have permission to view this page.
                </p>
                <Button asChild variant="outline">
                  <Link href="/admin">Go to Dashboard</Link>
                </Button>
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}
