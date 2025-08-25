import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  FileText,
  Plus,
  CheckCircle,
  Bug,
  User,
} from "lucide-react";
import { usePathname } from "wouter/use-browser-location";
import clsx from "clsx";

export default function SidebarNavigation() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/forms", label: "Forms", icon: FileText },
    { href: "/forms/new", label: "New Form", icon: Plus },
    { href: "/todo", label: "Todo", icon: CheckCircle },
    { href: "/bugs", label: "Bugs", icon: Bug },
  ];

  return (
    <div className="w-16 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Logo */}
      <div className="p-3 border-b border-gray-200">
        <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
          <svg
            className="w-6 h-6 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
          </svg>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-4">
        <div className="space-y-2 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || 
              (item.href === "/forms" && pathname.startsWith("/forms") && pathname !== "/forms/new");

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  size="icon"
                  className={clsx(
                    "w-12 h-12 rounded-lg transition-colors relative group",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  )}
                  title={item.label}
                >
                  <Icon className="h-5 w-5" />
                  {item.href === "/todo" && (user?.todoCount ?? 0) > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60"></span>
                      <span className="relative inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold">
                        {user?.todoCount! > 9 ? "9+" : user?.todoCount}
                      </span>
                    </span>
                  )}
                  {/* Tooltip */}
                  <span className="absolute left-16 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                    {item.label}
                  </span>
                </Button>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Profile at bottom */}
      <div className="p-2 border-t border-gray-200">
        <Button
          variant="ghost"
          size="icon"
          className="w-12 h-12 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 group relative"
          onClick={logout}
          title="Profile"
        >
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user?.username?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          {/* Tooltip */}
          <span className="absolute left-16 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            Profile
          </span>
        </Button>
      </div>
    </div>
  );
}